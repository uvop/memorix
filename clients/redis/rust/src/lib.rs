extern crate futures_core;
extern crate futures_util;
extern crate redis;
extern crate serde_json;

mod utils;

use crate::futures_util::StreamExt;
use redis::AsyncCommands;

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
        Ok(Self {
            client,
            redis,
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
            namespace_name_tree,
            default_options,
        }
    }
}

#[derive(Clone)]
pub struct MemorixCacheItem<'a, K, P>
where
    P: serde::de::DeserializeOwned,
{
    memorix_base: MemorixBase,
    id: &'a str,
    has_key: bool,
    _phantom1: std::marker::PhantomData<K>,
    _phantom2: std::marker::PhantomData<P>,
}

impl<'a, K, P> MemorixCacheItem<'a, K, P>
where
    K: serde::Serialize,
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: true,
            _phantom1: std::marker::PhantomData,
            _phantom2: std::marker::PhantomData,
        }
    }
    fn new_no_key(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: false,
            _phantom1: std::marker::PhantomData,
            _phantom2: std::marker::PhantomData,
        }
    }
    pub fn key(&self, key: K) -> Result<String, Box<dyn std::error::Error>> {
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
    pub async fn get(&mut self, key: K) -> Result<Option<P>, Box<dyn std::error::Error>> {
        let payload_str: Option<String> = self.memorix_base.redis.get(self.key(key)?).await?;

        let payload_str = match payload_str {
            Some(x) => x,
            None => {
                return Ok(None);
            }
        };

        let payload: P = serde_json::from_str(&payload_str)?;

        Ok(Some(payload))
    }
    pub async fn set(&mut self, key: K, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        let payload_str = serde_json::to_string(&payload)?;
        self.memorix_base
            .redis
            .set(self.key(key)?, payload_str)
            .await?;
        Ok(())
    }
}

#[derive(Clone)]
pub struct MemorixCacheItemNoKey<'a, P>
where
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixCacheItem<'a, std::marker::PhantomData<std::marker::PhantomData<u8>>, P>,
}

impl<'a, P> MemorixCacheItemNoKey<'a, P>
where
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            base_item: MemorixCacheItem::new_no_key(memorix_base, id),
        }
    }
    pub async fn get(&mut self) -> Result<Option<P>, Box<dyn std::error::Error>> {
        Ok(self.base_item.get(std::marker::PhantomData).await?)
    }
    pub async fn set(&mut self, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        Ok(self
            .base_item
            .set(std::marker::PhantomData, payload)
            .await?)
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
pub struct MemorixPubSubItem<'a, K, P>
where
    P: serde::de::DeserializeOwned,
{
    memorix_base: MemorixBase,
    id: &'a str,
    has_key: bool,
    _key: std::marker::PhantomData<K>,
    _payload: std::marker::PhantomData<P>,
}

impl<'a, K, P> MemorixPubSubItem<'a, K, P>
where
    K: serde::Serialize,
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: true,
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
        }
    }
    fn new_no_key(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: false,
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
        }
    }
    pub fn key(&self, key: K) -> Result<String, Box<dyn std::error::Error>> {
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
        key: K,
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
    pub async fn publish(&mut self, key: K, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        let payload_str = serde_json::to_string(&payload)?;
        self.memorix_base
            .redis
            .publish(self.key(key)?, payload_str)
            .await?;
        Ok(())
    }
}

#[derive(Clone)]
pub struct MemorixPubSubItemNoKey<'a, P>
where
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixPubSubItem<'a, std::marker::PhantomData<u8>, P>,
}

impl<'a, P> MemorixPubSubItemNoKey<'a, P>
where
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: &'a str) -> Self {
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
        Ok(self.base_item.subscribe(std::marker::PhantomData).await?)
    }
    pub async fn publish(&mut self, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        Ok(self
            .base_item
            .publish(std::marker::PhantomData, payload)
            .await?)
    }
}

#[derive(Clone)]
pub struct MemorixTaskItem<'a, K, P, R>
where
    P: serde::de::DeserializeOwned,
{
    memorix_base: MemorixBase,
    id: &'a str,
    has_key: bool,
    has_returns: bool,
    _key: std::marker::PhantomData<K>,
    _payload: std::marker::PhantomData<P>,
    _returns: std::marker::PhantomData<R>,
}

impl<'a, K, P, R> MemorixTaskItem<'a, K, P, R>
where
    K: serde::Serialize,
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: true,
            has_returns: true,
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
            _returns: std::marker::PhantomData,
        }
    }
    fn new_no_key(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: false,
            has_returns: true,
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
            _returns: std::marker::PhantomData,
        }
    }
    fn new_no_returns(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: true,
            has_returns: false,
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
            _returns: std::marker::PhantomData,
        }
    }
    fn new_no_key_no_returns(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: false,
            has_returns: false,
            _key: std::marker::PhantomData,
            _payload: std::marker::PhantomData,
            _returns: std::marker::PhantomData,
        }
    }
    pub fn key(&self, key: K) -> Result<String, Box<dyn std::error::Error>> {
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
    pub async fn dequeue<'b: 'a>(
        &'b mut self,
        key: K,
    ) -> Result<
        impl futures_core::Stream<Item = Result<P, Box<dyn std::error::Error>>> + 'b,
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
                let (_, pop_str): (String, String) =
                (
                match take_newest {
                        true => self
                        .memorix_base
                        .redis
                        .brpop(key_str.to_string(), 0),
                        _ => self
                        .memorix_base
                        .redis
                        .blpop(key_str.to_string(), 0)
                    }
                    )
                    .await.unwrap();
                let mut payload_str = pop_str;
                payload_str.pop();
                payload_str.remove(0);
                yield serde_json::from_str::<'_, P>(payload_str.as_str()).map_err(|e| e.into());
            }
        }))
    }
    pub async fn queue(&mut self, key: K, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        let payload_str = format!("[{}]", serde_json::to_string(&payload)?);
        self.memorix_base
            .redis
            .rpush(self.key(key)?, payload_str)
            .await?;
        Ok(())
    }
}

#[derive(Clone)]
pub struct MemorixTaskItemNoKey<'a, P, R>
where
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixTaskItem<'a, std::marker::PhantomData<u8>, P, R>,
}

impl<'a, P, R> MemorixTaskItemNoKey<'a, P, R>
where
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            base_item: MemorixTaskItem::new_no_key(memorix_base, id),
        }
    }
    pub async fn dequeue<'b: 'a>(
        &'b mut self,
    ) -> Result<
        impl futures_core::Stream<Item = Result<P, Box<dyn std::error::Error>>> + 'b,
        Box<dyn std::error::Error>,
    > {
        Ok(self.base_item.dequeue(std::marker::PhantomData).await?)
    }
    pub async fn queue(&mut self, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        Ok(self
            .base_item
            .queue(std::marker::PhantomData, payload)
            .await?)
    }
}

#[derive(Clone)]
pub struct MemorixTaskItemNoReturns<'a, K, P>
where
    K: serde::Serialize,
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixTaskItem<'a, K, P, std::marker::PhantomData<u8>>,
}

impl<'a, K, P> MemorixTaskItemNoReturns<'a, K, P>
where
    K: serde::Serialize,
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            base_item: MemorixTaskItem::new_no_returns(memorix_base, id),
        }
    }
    pub async fn dequeue<'b: 'a>(
        &'b mut self,
        key: K,
    ) -> Result<
        impl futures_core::Stream<Item = Result<P, Box<dyn std::error::Error>>> + 'b,
        Box<dyn std::error::Error>,
    > {
        Ok(self.base_item.dequeue(key).await?)
    }
    pub async fn queue(&mut self, key: K, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        Ok(self.base_item.queue(key, payload).await?)
    }
}

#[derive(Clone)]
pub struct MemorixTaskItemNoKeyNoReturns<'a, P>
where
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixTaskItem<'a, std::marker::PhantomData<u8>, P, std::marker::PhantomData<u8>>,
}

impl<'a, P> MemorixTaskItemNoKeyNoReturns<'a, P>
where
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            base_item: MemorixTaskItem::new_no_key_no_returns(memorix_base, id),
        }
    }
    pub async fn dequeue<'b: 'a>(
        &'b mut self,
    ) -> Result<
        impl futures_core::Stream<Item = Result<P, Box<dyn std::error::Error>>> + 'b,
        Box<dyn std::error::Error>,
    > {
        Ok(self.base_item.dequeue(std::marker::PhantomData).await?)
    }
    pub async fn queue(&mut self, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        Ok(self
            .base_item
            .queue(std::marker::PhantomData, payload)
            .await?)
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn exploration() {
        assert_eq!(2 + 2, 4);
    }
}
