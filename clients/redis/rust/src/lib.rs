extern crate redis;
extern crate serde_json;

mod utils;

use redis::AsyncCommands;

pub struct MemorixBase {
    redis: redis::aio::MultiplexedConnection,
}

impl MemorixBase {
    pub async fn new(redis_url: &str) -> Self {
        let client = redis::Client::open(redis_url).expect("Invalid connection URL");
        let redis = client
            .get_multiplexed_async_connection()
            .await
            .expect("failed to connect to Redis");
        Self { redis }
    }
}

pub struct MemorixCacheItem<'a, K, P>
where
    P: serde::de::DeserializeOwned,
{
    memorix_base: MemorixBase,
    id: &'a str,
    has_key: bool,
    key: Option<K>,
    payload: Option<P>,
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
            key: None,
            payload: None,
        }
    }
    fn new_no_key(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: false,
            key: None,
            payload: None,
        }
    }
    fn hash_key(&self, key: K) -> Result<String, Box<dyn std::error::Error>> {
        Ok(match self.has_key {
            false => format!("[{}]", self.id),
            true => format!("[{},{}]", self.id, utils::hash_key(&key)?),
        })
    }
    pub async fn get(&mut self, key: K) -> Result<Option<P>, Box<dyn std::error::Error>> {
        let payload_str: Option<String> = self.memorix_base.redis.get(self.hash_key(key)?).await?;

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
            .set(self.hash_key(key)?, payload_str)
            .await?;
        Ok(())
    }
}
pub struct MemorixCacheItemNoKey<'a, P>
where
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixCacheItem<'a, u8, P>,
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
        Ok(self.base_item.get(0u8).await?)
    }
    pub async fn set(&mut self, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        Ok(self.base_item.set(0u8, payload).await?)
    }
}
