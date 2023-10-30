extern crate serde_json;

use redis::AsyncCommands;

pub struct MemorixBase {
    redis: redis::aio::MultiplexedConnection,
}

pub struct MemorixCacheItemNoKey<'a, P>
where
    P: serde::Deserialize<'a>,
{
    memorix_base: MemorixBase,
    id: &'a str,
    payload: Option<P>,
}

impl<'a, P> MemorixCacheItemNoKey<'a, P>
where
    P: serde::Deserialize<'a>,
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

        let payload: P = serde_json::from_str(payload_str.as_str())?;

        Ok(Some(payload))
    }
    pub fn set(payload: P) {}
}
pub struct MemorixCacheItem<K, P> {
    id: &'static str,
    key: K,
    payload: P,
}
