extern crate redis;
extern crate serde_json;

mod utils;

use redis::AsyncCommands;

#[derive(Clone)]
pub struct MemorixBase {
    redis: redis::aio::MultiplexedConnection,
    namespace_name_tree: &'static [&'static str],
    default_options: Option<u8>,
}

impl MemorixBase {
    pub async fn new(
        redis_url: &str,
        namespace_name_tree: &'static [&'static str],
        default_options: Option<u8>,
    ) -> Self {
        let client = redis::Client::open(redis_url).expect("Invalid connection URL");
        let redis = client
            .get_multiplexed_async_connection()
            .await
            .expect("failed to connect to Redis");
        Self {
            redis,
            namespace_name_tree,
            default_options,
        }
    }
    pub fn from(
        other: Self,
        namespace_name_tree: &'static [&'static str],
        default_options: Option<u8>,
    ) -> Self {
        Self {
            redis: other.redis,
            namespace_name_tree,
            default_options,
        }
    }
}

pub struct MemorixCacheItem<'a, K, P>
where
    P: serde::de::DeserializeOwned,
{
    memorix_base: MemorixBase,
    id: &'a str,
    has_key: bool,
    _key: Option<K>,
    _payload: Option<P>,
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
            _key: None,
            _payload: None,
        }
    }
    fn new_no_key(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: false,
            _key: None,
            _payload: None,
        }
    }
    fn hash_key(&self, key: K) -> Result<String, Box<dyn std::error::Error>> {
        let prefix = match self.memorix_base.namespace_name_tree.len() {
            0 => "".to_string(),
            _ => format!("{},", self.memorix_base.namespace_name_tree.join(",")),
        };
        Ok(match self.has_key {
            false => format!("[{}{}]", prefix, self.id),
            true => format!("[{}{},{}]", prefix, self.id, utils::hash_key(&key)?),
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

pub struct MemorixPubSubItem<'a, K, P>
where
    P: serde::de::DeserializeOwned,
{
    memorix_base: MemorixBase,
    id: &'a str,
    has_key: bool,
    _key: Option<K>,
    _payload: Option<P>,
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
            _key: None,
            _payload: None,
        }
    }
    fn new_no_key(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: false,
            _key: None,
            _payload: None,
        }
    }
    fn hash_key(&self, key: K) -> Result<String, Box<dyn std::error::Error>> {
        let prefix = match self.memorix_base.namespace_name_tree.len() {
            0 => "".to_string(),
            _ => format!("{},", self.memorix_base.namespace_name_tree.join(",")),
        };
        Ok(match self.has_key {
            false => format!("[{}{}]", prefix, self.id),
            true => format!("[{}{},{}]", prefix, self.id, utils::hash_key(&key)?),
        })
    }
    pub async fn subscribe(&mut self, key: K) -> Result<Option<P>, Box<dyn std::error::Error>> {
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
    pub async fn publish(&mut self, key: K, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        let payload_str = serde_json::to_string(&payload)?;
        self.memorix_base
            .redis
            .set(self.hash_key(key)?, payload_str)
            .await?;
        Ok(())
    }
}
pub struct MemorixPubSubItemNoKey<'a, P>
where
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixPubSubItem<'a, u8, P>,
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
    pub async fn subscribe(&mut self) -> Result<Option<P>, Box<dyn std::error::Error>> {
        Ok(self.base_item.subscribe(0u8).await?)
    }
    pub async fn publish(&mut self, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        Ok(self.base_item.publish(0u8, payload).await?)
    }
}

pub struct MemorixTaskItem<'a, K, P, R>
where
    P: serde::de::DeserializeOwned,
{
    memorix_base: MemorixBase,
    id: &'a str,
    has_key: bool,
    _key: Option<K>,
    _payload: Option<P>,
    _returns: Option<R>,
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
            _key: None,
            _payload: None,
            _returns: None,
        }
    }
    fn new_no_key(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            memorix_base,
            id,
            has_key: false,
            _key: None,
            _payload: None,
            _returns: None,
        }
    }
    fn hash_key(&self, key: K) -> Result<String, Box<dyn std::error::Error>> {
        let prefix = match self.memorix_base.namespace_name_tree.len() {
            0 => "".to_string(),
            _ => format!("{},", self.memorix_base.namespace_name_tree.join(",")),
        };
        Ok(match self.has_key {
            false => format!("[{}{}]", prefix, self.id),
            true => format!("[{}{},{}]", prefix, self.id, utils::hash_key(&key)?),
        })
    }
    pub async fn dequeue(&mut self, key: K) -> Result<Option<P>, Box<dyn std::error::Error>> {
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
    pub async fn queue(&mut self, key: K, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        let payload_str = serde_json::to_string(&payload)?;
        self.memorix_base
            .redis
            .set(self.hash_key(key)?, payload_str)
            .await?;
        Ok(())
    }
}
pub struct MemorixTaskItemNoKey<'a, P, R>
where
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixTaskItem<'a, u8, P, R>,
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
    pub async fn dequeue(&mut self) -> Result<Option<P>, Box<dyn std::error::Error>> {
        Ok(self.base_item.dequeue(0u8).await?)
    }
    pub async fn queue(&mut self, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        Ok(self.base_item.queue(0u8, payload).await?)
    }
}

pub struct MemorixTaskItemNoReturns<'a, K, P>
where
    K: serde::Serialize,
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixTaskItem<'a, K, P, u8>,
}

impl<'a, K, P> MemorixTaskItemNoReturns<'a, K, P>
where
    K: serde::Serialize,
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            base_item: MemorixTaskItem::new_no_key(memorix_base, id),
        }
    }
    pub async fn dequeue(&mut self, key: K) -> Result<Option<P>, Box<dyn std::error::Error>> {
        Ok(self.base_item.dequeue(key).await?)
    }
    pub async fn queue(&mut self, key: K, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        Ok(self.base_item.queue(key, payload).await?)
    }
}

pub struct MemorixTaskItemNoKeyNoReturns<'a, P>
where
    P: serde::de::DeserializeOwned,
{
    base_item: MemorixTaskItem<'a, u8, P, u8>,
}

impl<'a, P> MemorixTaskItemNoKeyNoReturns<'a, P>
where
    P: serde::de::DeserializeOwned,
    P: serde::Serialize,
{
    pub fn new(memorix_base: MemorixBase, id: &'a str) -> Self {
        Self {
            base_item: MemorixTaskItem::new_no_key(memorix_base, id),
        }
    }
    pub async fn dequeue(&mut self) -> Result<Option<P>, Box<dyn std::error::Error>> {
        Ok(self.base_item.dequeue(0u8).await?)
    }
    pub async fn queue(&mut self, payload: P) -> Result<(), Box<dyn std::error::Error>> {
        Ok(self.base_item.queue(0u8, payload).await?)
    }
}
