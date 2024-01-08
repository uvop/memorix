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
pub use serde::Deserialize;
pub use serde::Serialize;

#[derive(Debug)]
struct MemorixError;

impl std::error::Error for MemorixError {}

impl std::fmt::Display for MemorixError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "Oh no, something bad went down")
    }
}

#[derive(Clone)]
pub struct MemorixOptionsCacheExpire {
    pub value: u32,
    pub is_in_ms: Option<bool>,
    pub extend_on_get: Option<bool>,
}
#[derive(Clone)]
pub struct MemorixOptionsCache {
    pub expire: Option<MemorixOptionsCacheExpire>,
}
#[derive(Clone)]
pub struct MemorixOptionsTask {
    pub take_newest: Option<bool>,
}

#[derive(Clone)]
pub struct MemorixOptions {
    pub cache: Option<MemorixOptionsCache>,
    pub task: Option<MemorixOptionsTask>,
}

#[derive(Clone)]
pub struct MemorixBase {
    client: redis::Client,
    redis: redis::aio::MultiplexedConnection,
    task_redis: redis::aio::MultiplexedConnection,
    namespace_name_tree: &'static [&'static str],
    default_options: Option<MemorixOptions>,
}

impl MemorixBase {
    pub async fn new(
        redis_url: &str,
        namespace_name_tree: &'static [&'static str],
        default_options: Option<MemorixOptions>,
    ) -> Result<MemorixBase, Box<dyn std::error::Error>> {
        let client = redis::Client::open(redis_url)?;
        let redis = client.get_multiplexed_async_connection().await?;
        let task_redis = client.get_multiplexed_async_connection().await?;
        Ok(Self {
            client,
            redis,
            task_redis,
            namespace_name_tree,
            default_options,
        })
    }
    pub fn from(
        other: Self,
        namespace_name_tree: &'static [&'static str],
        default_options: Option<MemorixOptions>,
    ) -> Self {
        Self {
            client: other.client,
            redis: other.redis,
            task_redis: other.task_redis,
            namespace_name_tree,
            default_options,
        }
    }
}

#[derive(Clone)]
pub struct MemorixCacheItem<K, P>
where
    P: serde::de::DeserializeOwned,
{
    memorix_base: MemorixBase,
    id: String,
    has_key: bool,
    options: Option<MemorixOptionsCache>,
    _phantom1: std::marker::PhantomData<K>,
    _phantom2: std::marker::PhantomData<P>,
}

impl<K, P> MemorixCacheItem<K, P>
where
    K: serde::Serialize,
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixOptionsCache>,
    ) -> Self {
        Self {
            memorix_base,
            id,
            has_key: true,
            options,
            _phantom1: std::marker::PhantomData,
            _phantom2: std::marker::PhantomData,
        }
    }
    fn new_no_key(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixOptionsCache>,
    ) -> Self {
        Self {
            memorix_base,
            id,
            has_key: false,
            options,
            _phantom1: std::marker::PhantomData,
            _phantom2: std::marker::PhantomData,
        }
    }
    pub fn key(&self, key: &K) -> Result<String, Box<dyn std::error::Error>> {
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
    pub async fn get(&mut self, key: &K) -> Result<Option<P>, Box<dyn std::error::Error>> {
        let payload_str: Option<String> = self.memorix_base.redis.get(self.key(key)?).await?;

        let payload_str = match payload_str {
            Some(x) => x,
            None => {
                return Ok(None);
            }
        };

        let payload: P = serde_json::from_str(&payload_str)?;

        let extend_on_get = match self.memorix_base.default_options.to_owned() {
            Some(MemorixOptions {
                cache:
                    Some(MemorixOptionsCache {
                        expire:
                            Some(MemorixOptionsCacheExpire {
                                value: _,
                                is_in_ms: _,
                                extend_on_get: Some(x),
                            }),
                    }),
                task: _task,
            }) => x,
            _ => false,
        };

        if extend_on_get {
            self.extend(key).await?;
        }

        Ok(Some(payload))
    }
    pub async fn set(&mut self, key: &K, payload: &P) -> Result<(), Box<dyn std::error::Error>> {
        let payload_str = serde_json::to_string(&payload)?;
        let expire = match self.memorix_base.default_options.to_owned() {
            Some(MemorixOptions {
                cache: Some(MemorixOptionsCache { expire: Some(x) }),
                task: _,
            }) => Some(x),
            _ => None,
        };
        match expire {
            Some(MemorixOptionsCacheExpire {
                value,
                is_in_ms: Some(true),
                extend_on_get: _,
            }) => {
                self.memorix_base
                    .redis
                    .pset_ex(self.key(key)?, payload_str, value as usize)
                    .await?;
            }
            Some(MemorixOptionsCacheExpire {
                value,
                is_in_ms: _,
                extend_on_get: _,
            }) => {
                self.memorix_base
                    .redis
                    .set_ex(self.key(key)?, payload_str, value as usize)
                    .await?;
            }
            _ => {
                self.memorix_base
                    .redis
                    .set(self.key(key)?, payload_str)
                    .await?;
            }
        }

        Ok(())
    }
    pub async fn extend(&mut self, key: &K) -> Result<(), Box<dyn std::error::Error>> {
        let expire = match self.memorix_base.default_options.to_owned() {
            Some(MemorixOptions {
                cache: Some(MemorixOptionsCache { expire: Some(x) }),
                task: _task,
            }) => x,
            _ => return Ok(()),
        };

        let hashed_key = self.key(key)?;
        let expire_value: usize = expire.value as usize;
        match expire.is_in_ms {
            Some(true) => {
                self.memorix_base
                    .redis
                    .pexpire(hashed_key, expire_value)
                    .await?
            }
            _ => {
                self.memorix_base
                    .redis
                    .expire(hashed_key, expire_value)
                    .await?
            }
        };
        Ok(())
    }
}

#[derive(Clone)]
pub struct MemorixCacheItemNoKey<P>
where
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixCacheItem<std::marker::PhantomData<std::marker::PhantomData<u8>>, P>,
}

impl<P> MemorixCacheItemNoKey<P>
where
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixOptionsCache>,
    ) -> Self {
        Self {
            base_item: MemorixCacheItem::new_no_key(memorix_base, id, options),
        }
    }
    pub async fn get(&mut self) -> Result<Option<P>, Box<dyn std::error::Error>> {
        self.base_item.get(&std::marker::PhantomData).await
    }
    pub async fn set(&mut self, payload: &P) -> Result<(), Box<dyn std::error::Error>> {
        self.base_item.set(&std::marker::PhantomData, payload).await
    }
}

pub struct MemorixPayload<P>
where
    P: serde::de::DeserializeOwned,
{
    pub payload: P,
}

impl<P> redis::FromRedisValue for MemorixPayload<P>
where
    P: serde::de::DeserializeOwned,
{
    fn from_redis_value(v: &redis::Value) -> redis::RedisResult<Self> {
        let payload_str: String = redis::from_redis_value(v)?;
        let payload: P = serde_json::from_str(&payload_str).unwrap();

        Ok(Self { payload })
    }
}

#[derive(Clone)]
pub struct MemorixPubSubItem<K, P>
where
    P: serde::de::DeserializeOwned,
{
    memorix_base: MemorixBase,
    id: String,
    has_key: bool,
    _key: std::marker::PhantomData<K>,
    _payload: std::marker::PhantomData<P>,
}

impl<K, P> MemorixPubSubItem<K, P>
where
    K: serde::Serialize,
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: String) -> Self {
        Self {
            memorix_base,
            id,
            has_key: true,
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
        }
    }
    fn new_no_key(memorix_base: MemorixBase, id: String) -> Self {
        Self {
            memorix_base,
            id,
            has_key: false,
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
        }
    }
    pub fn key(&self, key: &K) -> Result<String, Box<dyn std::error::Error>> {
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
    pub async fn subscribe(
        &self,
        key: &K,
    ) -> Result<
        core::pin::Pin<
            Box<
                dyn futures_core::stream::Stream<
                        Item = Result<MemorixPayload<P>, Box<dyn std::error::Error>>,
                    > + std::marker::Send,
            >,
        >,
        Box<dyn std::error::Error>,
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
            .map(|m| m.get_payload::<MemorixPayload<P>>().map_err(|e| e.into()))
            .boxed();
        Ok(stream)
    }
    pub async fn publish(
        &mut self,
        key: &K,
        payload: &P,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let payload_str = serde_json::to_string(&payload)?;
        self.memorix_base
            .redis
            .publish(self.key(key)?, payload_str)
            .await?;
        Ok(())
    }
}

#[derive(Clone)]
pub struct MemorixPubSubItemNoKey<P>
where
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixPubSubItem<std::marker::PhantomData<u8>, P>,
}

impl<P> MemorixPubSubItemNoKey<P>
where
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: String) -> Self {
        Self {
            base_item: MemorixPubSubItem::new_no_key(memorix_base, id),
        }
    }
    pub async fn subscribe(
        &mut self,
    ) -> Result<
        core::pin::Pin<
            Box<
                dyn futures_core::stream::Stream<
                        Item = Result<MemorixPayload<P>, Box<dyn std::error::Error>>,
                    > + std::marker::Send,
            >,
        >,
        Box<dyn std::error::Error>,
    > {
        self.base_item.subscribe(&std::marker::PhantomData).await
    }
    pub async fn publish(&mut self, payload: &P) -> Result<(), Box<dyn std::error::Error>> {
        self.base_item
            .publish(&std::marker::PhantomData, payload)
            .await
    }
}

#[derive(Clone)]
pub struct MemorixTaskItem<K, P, R>
where
    K: serde::Serialize,
    P: serde::Serialize,
    P: serde::de::DeserializeOwned,
    R: serde::Serialize,
    R: serde::de::DeserializeOwned,
{
    memorix_base: MemorixBase,
    id: String,
    has_key: bool,
    return_task: Option<Box<MemorixTaskItemNoReturns<String, R>>>,
    options: Option<MemorixOptionsTask>,
    _key: std::marker::PhantomData<K>,
    _payload: std::marker::PhantomData<P>,
    _returns: std::marker::PhantomData<R>,
}

impl<K, P, R> MemorixTaskItem<K, P, R>
where
    K: serde::Serialize,
    P: serde::Serialize,
    P: serde::de::DeserializeOwned,
    R: serde::Serialize,
    R: serde::de::DeserializeOwned,
{
    pub fn new(memorix_base: MemorixBase, id: String, options: Option<MemorixOptionsTask>) -> Self {
        Self {
            memorix_base: memorix_base.clone(),
            id: id.clone(),
            has_key: true,
            options,
            return_task: Some(Box::new(MemorixTaskItemNoReturns::new(
                memorix_base,
                format!("{}_returns", id),
                None,
            ))),
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
            _returns: std::marker::PhantomData,
        }
    }
    fn new_no_key(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixOptionsTask>,
    ) -> Self {
        Self {
            memorix_base: memorix_base.clone(),
            id: id.clone(),
            has_key: false,
            options,
            return_task: Some(Box::new(MemorixTaskItemNoReturns::new(
                memorix_base,
                format!("{}_returns", id),
                None,
            ))),
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
            _returns: std::marker::PhantomData,
        }
    }
    fn new_no_returns(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixOptionsTask>,
    ) -> Self {
        Self {
            memorix_base,
            id,
            has_key: true,
            return_task: None,
            options,
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
            _returns: std::marker::PhantomData,
        }
    }
    fn new_no_key_no_returns(
        memorix_base: MemorixBase,
        id: String,
        options: Option<MemorixOptionsTask>,
    ) -> Self {
        Self {
            memorix_base,
            id,
            has_key: false,
            return_task: None,
            options,
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
            _returns: std::marker::PhantomData,
        }
    }
    pub fn key(&self, key: &K) -> Result<String, Box<dyn std::error::Error>> {
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
    pub async fn dequeue(
        &mut self,
        key: &K,
    ) -> Result<
        impl futures_core::Stream<Item = Result<P, Box<dyn std::error::Error>>> + '_,
        Box<dyn std::error::Error>,
    > {
        let key_str = self.key(key)?;
        let take_newest = match self.memorix_base.default_options.to_owned() {
            Some(MemorixOptions {
                cache: _cache,
                task:
                    Some(MemorixOptionsTask {
                        take_newest: Some(task_newest),
                    }),
            }) => task_newest,
            _ => false,
        };

        Ok(Box::pin(async_stream::stream! {
            loop {
                let (_, array_payload): (String, String) = (match take_newest {
                    true => self.memorix_base.task_redis.brpop(key_str.to_string(), 0),
                    _ => self.memorix_base.task_redis.blpop(key_str.to_string(), 0),
                })
                .await
                .unwrap();
                let array_payload_without_braces = {
                    let mut p = array_payload;
                    p.remove(0);
                    p.pop();
                    p
                };
                yield match self.return_task.as_mut() {
                    Some(_) => {
                        let (returns_id_with_quotes, payload_str) = array_payload_without_braces.split_once(',').ok_or(Box::new(MemorixError {}))?;
                        let _returns_id = {
                            let mut p = returns_id_with_quotes.to_string();
                            p.remove(0);
                            p.pop();
                            p
                        };

                        let payload = serde_json::from_str::<'_, P>(payload_str)?;
                        Ok(payload)
                    }
                    None => {
                        let payload = serde_json::from_str::<'_, P>(array_payload_without_braces.as_str())?;
                        Ok(payload)
                    }
                }
            }
        }))
    }
    async fn queue_internal(
        &mut self,
        key: &K,
        payload: &P,
    ) -> Result<(u32, Option<String>), Box<dyn std::error::Error>> {
        let (payload_str, returns_id) = match &self.return_task {
            Some(_) => {
                let returns_id = uuid::Uuid::new_v4().to_string();

                (
                    format!("[\"{}\",{}]", returns_id, serde_json::to_string(&payload)?),
                    Some(returns_id),
                )
            }
            _ => (format!("[{}]", serde_json::to_string(&payload)?), None),
        };
        let queue_size: u32 = self
            .memorix_base
            .redis
            .rpush(self.key(key)?, payload_str)
            .await?;
        Ok((queue_size, returns_id))
    }
    pub async fn queue(
        &mut self,
        key: &K,
        payload: &P,
    ) -> Result<MemorixTaskItemQueueResult<R>, Box<dyn std::error::Error>> {
        let (queue_size, returns_id) = match self.queue_internal(key, payload).await? {
            (x1, Some(x2)) => (x1, x2),
            _ => return Err(Box::new(MemorixError {})),
        };
        let return_task = match self.return_task.as_mut() {
            Some(x) => x,
            _ => return Err(Box::new(MemorixError {})),
        };
        Ok(MemorixTaskItemQueueResult::new(
            queue_size,
            return_task,
            returns_id,
        ))
    }
}

#[derive(Clone)]
pub struct MemorixTaskItemNoKey<P, R>
where
    P: serde::Serialize,
    P: serde::de::DeserializeOwned,
    R: serde::Serialize,
    R: serde::de::DeserializeOwned,
{
    base_item: MemorixTaskItem<std::marker::PhantomData<u8>, P, R>,
}

impl<P, R> MemorixTaskItemNoKey<P, R>
where
    P: serde::Serialize,
    P: serde::de::DeserializeOwned,
    R: serde::Serialize,
    R: serde::de::DeserializeOwned,
{
    pub fn new(memorix_base: MemorixBase, id: String, options: Option<MemorixOptionsTask>) -> Self {
        Self {
            base_item: MemorixTaskItem::new_no_key(memorix_base, id, options),
        }
    }
    pub async fn dequeue(
        &mut self,
    ) -> Result<
        impl futures_core::Stream<Item = Result<P, Box<dyn std::error::Error>>> + '_,
        Box<dyn std::error::Error>,
    > {
        self.base_item.dequeue(&std::marker::PhantomData).await
    }
    pub async fn queue(
        &mut self,
        payload: &P,
    ) -> Result<MemorixTaskItemQueueResult<R>, Box<dyn std::error::Error>> {
        let (queue_size, returns_id) = match self
            .base_item
            .queue_internal(&std::marker::PhantomData, payload)
            .await?
        {
            (x1, Some(x2)) => (x1, x2),
            _ => return Err(Box::new(MemorixError {})),
        };
        let return_task = match self.base_item.return_task.as_mut() {
            Some(x) => x,
            _ => return Err(Box::new(MemorixError {})),
        };
        Ok(MemorixTaskItemQueueResult::new(
            queue_size,
            return_task,
            returns_id,
        ))
    }
}

#[derive(Clone)]
pub struct MemorixTaskItemNoReturns<K, P>
where
    K: serde::Serialize,
    P: serde::Serialize,
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixTaskItem<K, P, std::marker::PhantomData<u8>>,
}

impl<K, P> MemorixTaskItemNoReturns<K, P>
where
    K: serde::Serialize,
    P: serde::Serialize,
    P: serde::de::DeserializeOwned,
{
    pub fn new(memorix_base: MemorixBase, id: String, options: Option<MemorixOptionsTask>) -> Self {
        Self {
            base_item: MemorixTaskItem::new_no_returns(memorix_base, id, options),
        }
    }
    pub async fn dequeue(
        &mut self,
        key: &K,
    ) -> Result<
        impl futures_core::Stream<Item = Result<P, Box<dyn std::error::Error>>> + '_,
        Box<dyn std::error::Error>,
    > {
        self.base_item.dequeue(key).await
    }
    pub async fn queue(
        &mut self,
        key: &K,
        payload: &P,
    ) -> Result<MemorixTaskItemQueueResultNoReturns, Box<dyn std::error::Error>> {
        let (queue_size, _) = self.base_item.queue_internal(key, payload).await?;
        Ok(MemorixTaskItemQueueResultNoReturns::new(queue_size))
    }
}

#[derive(Clone)]
pub struct MemorixTaskItemNoKeyNoReturns<P>
where
    P: serde::Serialize,
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixTaskItem<std::marker::PhantomData<u8>, P, std::marker::PhantomData<u8>>,
}

impl<P> MemorixTaskItemNoKeyNoReturns<P>
where
    P: serde::Serialize,
    P: serde::de::DeserializeOwned,
{
    pub fn new(memorix_base: MemorixBase, id: String, options: Option<MemorixOptionsTask>) -> Self {
        Self {
            base_item: MemorixTaskItem::new_no_key_no_returns(memorix_base, id, options),
        }
    }
    pub async fn dequeue(
        &mut self,
    ) -> Result<
        impl futures_core::Stream<Item = Result<P, Box<dyn std::error::Error>>> + '_,
        Box<dyn std::error::Error>,
    > {
        self.base_item.dequeue(&std::marker::PhantomData).await
    }
    pub async fn queue(
        &mut self,
        payload: &P,
    ) -> Result<MemorixTaskItemQueueResultNoReturns, Box<dyn std::error::Error>> {
        let (queue_size, _) = self
            .base_item
            .queue_internal(&std::marker::PhantomData, payload)
            .await?;
        Ok(MemorixTaskItemQueueResultNoReturns::new(queue_size))
    }
}

pub struct MemorixTaskItemQueueResultNoReturns {
    pub queue_size: u32,
}

impl MemorixTaskItemQueueResultNoReturns {
    fn new(queue_size: u32) -> Self {
        Self { queue_size }
    }
}
pub struct MemorixTaskItemQueueResult<'a, R>
where
    R: serde::Serialize,
    R: serde::de::DeserializeOwned,
{
    pub queue_size: u32,
    task: &'a mut MemorixTaskItemNoReturns<String, R>,
    returns_id: String,
}

impl<'a, R> MemorixTaskItemQueueResult<'a, R>
where
    R: serde::Serialize,
    R: serde::de::DeserializeOwned,
{
    fn new(
        queue_size: u32,
        task: &'a mut MemorixTaskItemNoReturns<String, R>,
        returns_id: String,
    ) -> Self {
        Self {
            queue_size,
            task,
            returns_id,
        }
    }

    pub async fn get_returns(&mut self) -> Result<R, Box<dyn std::error::Error>> {
        let mut stream = self.task.dequeue(&self.returns_id).await?;
        let payload = stream.next().await.ok_or(Box::new(MemorixError {}))??;

        Ok(payload)
    }
}
