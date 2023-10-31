extern crate redis;
extern crate serde_json;

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

pub struct MemorixCacheItemNoKey<'a, P>
where
    P: serde::de::DeserializeOwned,
{
    memorix_base: MemorixBase,
    id: &'a str,
    payload: Option<P>,
}

impl<'a, P> MemorixCacheItemNoKey<'a, P>
where
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            payload: None,
        }
    }
    pub async fn get(&mut self) -> Result<Option<P>, Box<dyn std::error::Error>> {
        let payload_str: Option<String> = self.memorix_base.redis.get(self.id).await?;

        let payload_str = match payload_str {
            Some(x) => x,
            None => {
                return Ok(None);
            }
        };

        let payload: P = serde_json::from_str(&payload_str)?;

        Ok(Some(payload))
    }
    pub async fn set(&mut self, payload: &P) -> Result<(), Box<dyn std::error::Error>> {
        let payload_str = serde_json::to_string(payload)?;
        self.memorix_base.redis.set(self.id, payload_str).await?;
        Ok(())
    }
}
