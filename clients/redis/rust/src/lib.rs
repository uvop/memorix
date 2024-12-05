extern crate futures_core;
extern crate futures_util;
extern crate proc_macro;
extern crate redis;
extern crate serde;
extern crate serde_json;
extern crate uuid;

mod utils;

use redis::AsyncCommands;

pub use futures_util::StreamExt;
pub use memorix_client_redis_macros::serialization;
use redis::Value;

#[doc(hidden)]
pub mod __private {
    pub extern crate serde;
}

pub struct Expose;
pub struct Hide;

#[derive(Clone)]
pub struct MemorixCacheOptions {
    pub ttl: Option<String>,
    pub extend_on_get: Option<String>,
}
#[derive(Clone)]
pub struct MemorixCacheOptionsInner {
    pub ttl: usize,
    pub extend_on_get: bool,
}

impl TryFrom<Option<MemorixCacheOptions>> for MemorixCacheOptionsInner {
    type Error = Box<dyn std::error::Error + Send + Sync>;
    fn try_from(value: Option<MemorixCacheOptions>) -> Result<Self, Self::Error> {
        Ok(Self {
            ttl: match value.as_ref().and_then(|x| x.ttl.as_ref()) {
                Some(x) => x.parse()?,
                None => 0,
            },
            extend_on_get: match value.as_ref().and_then(|x| x.extend_on_get.as_ref()) {
                Some(x) => x.parse()?,
                None => false,
            },
        })
    }
}

#[derive(Clone)]
pub struct MemorixTaskOptions {
    pub queue_type: Option<String>,
}

#[derive(Clone)]
pub enum QueueType {
    Fifo,
    Lifo,
}
#[derive(Clone)]
pub struct MemorixTaskOptionsInner {
    pub queue_type: QueueType,
}
impl TryFrom<Option<MemorixTaskOptions>> for MemorixTaskOptionsInner {
    type Error = Box<dyn std::error::Error + Send + Sync>;
    fn try_from(value: Option<MemorixTaskOptions>) -> Result<Self, Self::Error> {
        Ok(Self {
            queue_type: match value.as_ref().and_then(|x| x.queue_type.as_ref()) {
                Some(x) => match x.as_str() {
                    "lifo" => QueueType::Lifo,
                    "fifo" => QueueType::Fifo,
                    _ => {
                        return Err(
                            format!("no valid option for \"queue_type\", given \"{x}\"").into()
                        )
                    }
                },
                None => QueueType::Fifo,
            },
        })
    }
}

#[derive(Clone)]
pub struct MemorixBase {
    client: redis::Client,
    redis: redis::aio::MultiplexedConnection,
    task_redis: redis::aio::MultiplexedConnection,
    namespace_name_tree: &'static [&'static str],
}

impl MemorixBase {
    pub async fn new(
        redis_url: &str,
        namespace_name_tree: &'static [&'static str],
    ) -> Result<MemorixBase, Box<dyn std::error::Error + Sync + Send>> {
        let client = redis::Client::open(redis_url)?;
        let redis = client.get_multiplexed_async_connection().await?;
        let task_redis = client.get_multiplexed_async_connection().await?;
        Ok(Self {
            client,
            redis,
            task_redis,
            namespace_name_tree,
        })
    }
    pub fn from(other: Self, namespace_name_tree: &'static [&'static str]) -> Self {
        Self {
            client: other.client,
            redis: other.redis,
            task_redis: other.task_redis,
            namespace_name_tree,
        }
    }
}

pub trait CanCacheGet {}
pub trait CanCacheSet {}
pub trait CanCacheDelete {}
pub trait CanCacheExpire {}

impl CanCacheGet for Expose {}
impl CanCacheSet for Expose {}
impl CanCacheDelete for Expose {}
impl CanCacheExpire for Expose {}

pub struct MemorixCacheItem<K, P, G, S, D, E> {
    memorix_base: MemorixBase,
    id: String,
    has_key: bool,
    options: MemorixCacheOptionsInner,
    _marker: std::marker::PhantomData<(K, P, G, S, D, E)>,
}
impl<K, P, G, S, D, E> Clone for MemorixCacheItem<K, P, G, S, D, E> {
    fn clone(&self) -> Self {
        Self {
            memorix_base: self.memorix_base.clone(),
            has_key: self.has_key,
            id: self.id.clone(),
            options: self.options.clone(),
            _marker: self._marker,
        }
    }
}

impl<K: serde::Serialize, P: serde::Serialize + serde::de::DeserializeOwned, G, S, D, E>
    MemorixCacheItem<K, P, G, S, D, E>
{
    pub fn new(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixCacheOptions>,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            memorix_base,
            id,
            has_key: true,
            options: options.try_into()?,
            _marker: std::marker::PhantomData,
        })
    }
    fn new_no_key(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixCacheOptions>,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            memorix_base,
            id,
            has_key: false,
            options: options.try_into()?,
            _marker: std::marker::PhantomData,
        })
    }
    pub fn key(&self, key: &K) -> Result<String, Box<dyn std::error::Error + Sync + Send>> {
        let prefix = match self.memorix_base.namespace_name_tree.len() {
            0 => "".to_string(),
            _ => format!(
                "{},",
                self.memorix_base
                    .namespace_name_tree
                    .iter()
                    .map(|x| format!("\"{}\"", x))
                    .collect::<Vec<_>>()
                    .join(",")
            ),
        };
        Ok(match self.has_key {
            false => format!("[{}\"{}\"]", prefix, self.id),
            true => format!("[{}\"{}\",{}]", prefix, self.id, utils::hash_key(&key)?),
        })
    }
    pub async fn extend(
        &mut self,
        key: &K,
    ) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        let hashed_key = self.key(key)?;
        let ttl = match self.options.ttl {
            0 => return Err("Called extend with no ttl".into()),
            x => x,
        };
        let _: Value = self.memorix_base.redis.expire(hashed_key, ttl).await?;
        Ok(())
    }
}

impl<
        K: serde::Serialize,
        P: serde::Serialize + serde::de::DeserializeOwned,
        G: CanCacheGet,
        S,
        D,
        E,
    > MemorixCacheItem<K, P, G, S, D, E>
{
    pub async fn get(
        &mut self,
        key: &K,
    ) -> Result<Option<P>, Box<dyn std::error::Error + Sync + Send>> {
        let payload_str: Option<String> = self.memorix_base.redis.get(self.key(key)?).await?;

        let payload_str = match payload_str {
            Some(x) => x,
            None => {
                return Ok(None);
            }
        };

        let payload: P = serde_json::from_str(&payload_str)?;

        if self.options.extend_on_get {
            self.extend(key).await?;
        }

        Ok(Some(payload))
    }
}

impl<
        K: serde::Serialize,
        P: serde::Serialize + serde::de::DeserializeOwned,
        G,
        S: CanCacheSet,
        D,
        E,
    > MemorixCacheItem<K, P, G, S, D, E>
{
    pub async fn set(
        &mut self,
        key: &K,
        payload: &P,
    ) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        let payload_str = serde_json::to_string(&payload)?;
        match self.options.ttl {
            0 => {
                let _: Value = self
                    .memorix_base
                    .redis
                    .set(self.key(key)?, payload_str)
                    .await?;
            }
            ttl => {
                let _: Value = self
                    .memorix_base
                    .redis
                    .set_ex(self.key(key)?, payload_str, ttl)
                    .await?;
            }
        }

        Ok(())
    }
}

impl<
        K: serde::Serialize,
        P: serde::Serialize + serde::de::DeserializeOwned,
        G,
        S,
        D: CanCacheDelete,
        E,
    > MemorixCacheItem<K, P, G, S, D, E>
{
    pub async fn delete(
        &mut self,
        key: &K,
    ) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        let _: Value = self.memorix_base.redis.del(self.key(key)?).await?;

        Ok(())
    }
}

impl<
        K: serde::Serialize,
        P: serde::Serialize + serde::de::DeserializeOwned,
        G,
        S,
        D,
        E: CanCacheExpire,
    > MemorixCacheItem<K, P, G, S, D, E>
{
    pub async fn expire(
        &mut self,
        key: &K,
        ttl: usize,
    ) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        let _: Value = self.memorix_base.redis.expire(self.key(key)?, ttl).await?;

        Ok(())
    }
}

pub struct MemorixCacheItemNoKey<P, G, S, D, E> {
    base_item:
        MemorixCacheItem<std::marker::PhantomData<std::marker::PhantomData<u8>>, P, G, S, D, E>,
}
impl<P, G, S, D, E> Clone for MemorixCacheItemNoKey<P, G, S, D, E> {
    fn clone(&self) -> Self {
        Self {
            base_item: self.base_item.clone(),
        }
    }
}

impl<P: serde::de::DeserializeOwned + serde::Serialize, G, S, D, E>
    MemorixCacheItemNoKey<P, G, S, D, E>
{
    pub fn new(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixCacheOptions>,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            base_item: MemorixCacheItem::new_no_key(memorix_base, id, options)?,
        })
    }
}
impl<P: serde::de::DeserializeOwned + serde::Serialize, G: CanCacheGet, S, D, E>
    MemorixCacheItemNoKey<P, G, S, D, E>
{
    pub async fn get(&mut self) -> Result<Option<P>, Box<dyn std::error::Error + Sync + Send>> {
        self.base_item.get(&std::marker::PhantomData).await
    }
}
impl<P: serde::de::DeserializeOwned + serde::Serialize, G, S: CanCacheSet, D, E>
    MemorixCacheItemNoKey<P, G, S, D, E>
{
    pub async fn set(
        &mut self,
        payload: &P,
    ) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        self.base_item.set(&std::marker::PhantomData, payload).await
    }
}
impl<P: serde::de::DeserializeOwned + serde::Serialize, G, S, D: CanCacheDelete, E>
    MemorixCacheItemNoKey<P, G, S, D, E>
{
    pub async fn delete(&mut self) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        self.base_item.delete(&std::marker::PhantomData).await
    }
}

pub trait CanPubSubPublish {}
pub trait CanPubSubSubscribe {}

impl CanPubSubPublish for Expose {}
impl CanPubSubSubscribe for Expose {}

// #[derive(Clone)]
pub struct MemorixPubSubItem<K, P, PU, S> {
    memorix_base: MemorixBase,
    id: String,
    has_key: bool,
    _marker: std::marker::PhantomData<(K, P, PU, S)>,
}

impl<K, P, PU, S> Clone for MemorixPubSubItem<K, P, PU, S> {
    fn clone(&self) -> Self {
        Self {
            memorix_base: self.memorix_base.clone(),
            has_key: self.has_key,
            id: self.id.clone(),
            _marker: self._marker,
        }
    }
}

impl<K: serde::Serialize, P: serde::de::DeserializeOwned + serde::Serialize, PU, S>
    MemorixPubSubItem<K, P, PU, S>
{
    pub fn new(
        memorix_base: MemorixBase,
        id: String,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            memorix_base,
            id,
            has_key: true,
            _marker: std::marker::PhantomData,
        })
    }
    fn new_no_key(
        memorix_base: MemorixBase,
        id: String,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            memorix_base,
            id,
            has_key: false,
            _marker: std::marker::PhantomData,
        })
    }
    pub fn key(&self, key: &K) -> Result<String, Box<dyn std::error::Error + Sync + Send>> {
        let prefix = match self.memorix_base.namespace_name_tree.len() {
            0 => "".to_string(),
            _ => format!(
                "{},",
                self.memorix_base
                    .namespace_name_tree
                    .iter()
                    .map(|x| format!("\"{}\"", x))
                    .collect::<Vec<_>>()
                    .join(",")
            ),
        };
        Ok(match self.has_key {
            false => format!("[{}\"{}\"]", prefix, self.id),
            true => format!("[{}\"{}\",{}]", prefix, self.id, utils::hash_key(&key)?),
        })
    }
}

impl<
        K: serde::Serialize,
        P: serde::de::DeserializeOwned + serde::Serialize,
        PU: CanPubSubPublish,
        S,
    > MemorixPubSubItem<K, P, PU, S>
{
    pub async fn publish(
        &mut self,
        key: &K,
        payload: &P,
    ) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        let payload_str = serde_json::to_string(&payload)?;
        let _: Value = self
            .memorix_base
            .redis
            .publish(self.key(key)?, payload_str)
            .await?;
        Ok(())
    }
}

impl<
        K: serde::Serialize,
        P: serde::de::DeserializeOwned + serde::Serialize,
        PU,
        S: CanPubSubSubscribe,
    > MemorixPubSubItem<K, P, PU, S>
{
    pub async fn subscribe(
        &self,
        key: &K,
    ) -> Result<
        core::pin::Pin<
            Box<
                dyn futures_core::stream::Stream<
                        Item = Result<P, Box<dyn std::error::Error + Sync + Send>>,
                    > + std::marker::Send,
            >,
        >,
        Box<dyn std::error::Error + Sync + Send>,
    > {
        let mut pubsub = self
            .memorix_base
            .client
            .get_async_connection()
            .await?
            .into_pubsub();
        pubsub.subscribe(self.key(key)?).await?;
        let stream = pubsub
            .into_on_message()
            .map(|m| {
                let payload = m.get_payload::<String>()?;
                let parsed = serde_json::from_str::<P>(&payload)?;
                Ok(parsed)
            })
            .boxed();
        Ok(stream)
    }
}

pub struct MemorixPubSubItemNoKey<P, PU, S> {
    base_item: MemorixPubSubItem<std::marker::PhantomData<u8>, P, PU, S>,
}
impl<P, PU, S> Clone for MemorixPubSubItemNoKey<P, PU, S> {
    fn clone(&self) -> Self {
        Self {
            base_item: self.base_item.clone(),
        }
    }
}

impl<P: serde::de::DeserializeOwned + serde::Serialize, PU, S> MemorixPubSubItemNoKey<P, PU, S> {
    pub fn new(
        memorix_base: MemorixBase,
        id: String,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            base_item: MemorixPubSubItem::new_no_key(memorix_base, id)?,
        })
    }
}
impl<P: serde::de::DeserializeOwned + serde::Serialize, PU: CanPubSubPublish, S>
    MemorixPubSubItemNoKey<P, PU, S>
{
    pub async fn publish(
        &mut self,
        payload: &P,
    ) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        self.base_item
            .publish(&std::marker::PhantomData, payload)
            .await
    }
}
impl<P: serde::de::DeserializeOwned + serde::Serialize, PU, S: CanPubSubSubscribe>
    MemorixPubSubItemNoKey<P, PU, S>
{
    pub async fn subscribe(
        &mut self,
    ) -> Result<
        core::pin::Pin<
            Box<
                dyn futures_core::stream::Stream<
                        Item = Result<P, Box<dyn std::error::Error + Sync + Send>>,
                    > + std::marker::Send,
            >,
        >,
        Box<dyn std::error::Error + Sync + Send>,
    > {
        self.base_item.subscribe(&std::marker::PhantomData).await
    }
}

pub trait CanTaskEnqueue {}
pub trait CanTaskDequeue {}
pub trait CanTaskEmpty {}
pub trait CanTaskGetLen {}

impl CanTaskEnqueue for Expose {}
impl CanTaskDequeue for Expose {}
impl CanTaskEmpty for Expose {}
impl CanTaskGetLen for Expose {}

pub struct MemorixTaskItem<K, P, E, D, EM, G> {
    memorix_base: MemorixBase,
    id: String,
    has_key: bool,
    options: MemorixTaskOptionsInner,
    _marker: std::marker::PhantomData<(K, P, E, D, EM, G)>,
}
impl<K, P, E, D, EM, G> Clone for MemorixTaskItem<K, P, E, D, EM, G> {
    fn clone(&self) -> Self {
        Self {
            memorix_base: self.memorix_base.clone(),
            id: self.id.clone(),
            has_key: self.has_key,
            options: self.options.clone(),
            _marker: self._marker,
        }
    }
}

impl<K: serde::Serialize, P: serde::Serialize + serde::de::DeserializeOwned, E, D, EM, G>
    MemorixTaskItem<K, P, E, D, EM, G>
{
    pub fn new(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixTaskOptions>,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            memorix_base: memorix_base.clone(),
            id: id.clone(),
            has_key: true,
            options: options.try_into()?,
            _marker: std::marker::PhantomData,
        })
    }
    fn new_no_key(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixTaskOptions>,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            memorix_base: memorix_base.clone(),
            id: id.clone(),
            has_key: false,
            options: options.try_into()?,
            _marker: std::marker::PhantomData,
        })
    }
    pub fn key(&self, key: &K) -> Result<String, Box<dyn std::error::Error + Sync + Send>> {
        let prefix = match self.memorix_base.namespace_name_tree.len() {
            0 => "".to_string(),
            _ => format!(
                "{},",
                self.memorix_base
                    .namespace_name_tree
                    .iter()
                    .map(|x| format!("\"{}\"", x))
                    .collect::<Vec<_>>()
                    .join(",")
            ),
        };
        Ok(match self.has_key {
            false => format!("[{}\"{}\"]", prefix, self.id),
            true => format!("[{}\"{}\",{}]", prefix, self.id, utils::hash_key(&key)?),
        })
    }
}

pub struct MemorixTaskItemEnqueue {
    pub queue_size: usize,
}

impl<
        K: serde::Serialize,
        P: serde::Serialize + serde::de::DeserializeOwned,
        E: CanTaskEnqueue,
        D,
        EM,
        G,
    > MemorixTaskItem<K, P, E, D, EM, G>
{
    pub async fn enqueue(
        &mut self,
        key: &K,
        payload: &P,
    ) -> Result<MemorixTaskItemEnqueue, Box<dyn std::error::Error + Sync + Send>> {
        let queue_size = self
            .memorix_base
            .redis
            .rpush(self.key(key)?, serde_json::to_string(&payload)?)
            .await?;
        Ok(MemorixTaskItemEnqueue { queue_size })
    }
}

impl<
        K: serde::Serialize,
        P: serde::Serialize + serde::de::DeserializeOwned,
        E,
        D: CanTaskDequeue,
        EM,
        G,
    > MemorixTaskItem<K, P, E, D, EM, G>
{
    pub async fn dequeue(
        &self,
        key: &K,
    ) -> Result<
        impl futures_core::Stream<Item = Result<P, Box<dyn std::error::Error + Sync + Send>>> + '_,
        Box<dyn std::error::Error + Sync + Send>,
    > {
        let key_str = self.key(key)?;

        let mut redis = self
            .memorix_base
            .client
            .get_multiplexed_async_connection()
            .await?;

        Ok(Box::pin(async_stream::stream! {
            loop {
                let (_, payload): (Value, String) = (match self.options.queue_type {
                    QueueType::Fifo => redis.blpop(key_str.to_string(), 0),
                    QueueType::Lifo => redis.brpop(key_str.to_string(), 0),
                })
                .await
                .unwrap();
                let payload = serde_json::from_str::<'_, P>(payload.as_str())?;
                yield Ok(payload)
            }
        }))
    }
}

impl<
        K: serde::Serialize,
        P: serde::Serialize + serde::de::DeserializeOwned,
        E,
        D,
        EM: CanTaskEmpty,
        G,
    > MemorixTaskItem<K, P, E, D, EM, G>
{
    pub async fn empty(&mut self, key: &K) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        let _: Value = self.memorix_base.redis.del(self.key(key)?).await?;
        Ok(())
    }
}

impl<
        K: serde::Serialize,
        P: serde::Serialize + serde::de::DeserializeOwned,
        E,
        D,
        EM,
        G: CanTaskGetLen,
    > MemorixTaskItem<K, P, E, D, EM, G>
{
    pub async fn get_len(
        &mut self,
        key: &K,
    ) -> Result<usize, Box<dyn std::error::Error + Sync + Send>> {
        let queue_size = self.memorix_base.redis.llen(self.key(key)?).await?;
        Ok(queue_size)
    }
}

pub struct MemorixTaskItemNoKey<P, E, D, EM, G> {
    base_item: MemorixTaskItem<std::marker::PhantomData<u8>, P, E, D, EM, G>,
}
impl<P, E, D, EM, G> Clone for MemorixTaskItemNoKey<P, E, D, EM, G> {
    fn clone(&self) -> Self {
        Self {
            base_item: self.base_item.clone(),
        }
    }
}

impl<P: serde::Serialize + serde::de::DeserializeOwned, E, D, EM, G>
    MemorixTaskItemNoKey<P, E, D, EM, G>
{
    pub fn new(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixTaskOptions>,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            base_item: MemorixTaskItem::new_no_key(memorix_base, id, options)?,
        })
    }
}
impl<P: serde::Serialize + serde::de::DeserializeOwned, E: CanTaskEnqueue, D, EM, G>
    MemorixTaskItemNoKey<P, E, D, EM, G>
{
    pub async fn enqueue(
        &mut self,
        payload: &P,
    ) -> Result<MemorixTaskItemEnqueue, Box<dyn std::error::Error + Sync + Send>> {
        self.base_item
            .enqueue(&std::marker::PhantomData, payload)
            .await
    }
}
impl<P: serde::Serialize + serde::de::DeserializeOwned, E, D: CanTaskDequeue, EM, G>
    MemorixTaskItemNoKey<P, E, D, EM, G>
{
    pub async fn dequeue(
        &self,
    ) -> Result<
        impl futures_core::Stream<Item = Result<P, Box<dyn std::error::Error + Sync + Send>>> + '_,
        Box<dyn std::error::Error + Sync + Send>,
    > {
        self.base_item.dequeue(&std::marker::PhantomData).await
    }
}
impl<P: serde::Serialize + serde::de::DeserializeOwned, E, D, EM: CanTaskEmpty, G>
    MemorixTaskItemNoKey<P, E, D, EM, G>
{
    pub async fn empty(&mut self) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        self.base_item.empty(&std::marker::PhantomData).await
    }
}
impl<P: serde::Serialize + serde::de::DeserializeOwned, E, D, EM, G: CanTaskGetLen>
    MemorixTaskItemNoKey<P, E, D, EM, G>
{
    pub async fn get_len(&mut self) -> Result<usize, Box<dyn std::error::Error + Sync + Send>> {
        self.base_item.get_len(&std::marker::PhantomData).await
    }
}
