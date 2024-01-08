#![allow(dead_code)]
extern crate memorix_client_redis;

#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
#[derive(
    Clone,
    memorix_client_redis::Serialize,
    memorix_client_redis::Deserialize,
    PartialEq,
    std::fmt::Debug,
)]
pub enum Animal {
    dog,
    cat,
    person,
}

#[derive(
    Clone,
    memorix_client_redis::Serialize,
    memorix_client_redis::Deserialize,
    PartialEq,
    std::fmt::Debug,
)]
pub struct User {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub age: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#type: Option<bool>,
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCacheBlaBla {
    pub favoriteAnimal: memorix_client_redis::MemorixCacheItem<String, Animal>,
    pub user: memorix_client_redis::MemorixCacheItem<String, User>,
}

impl MemorixCacheBlaBla {
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Self {
        Self {
            favoriteAnimal: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "favoriteAnimal".to_string(),
            ),
            user: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "user".to_string(),
            ),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixBlaBla {
    pub cache: MemorixCacheBlaBla,
}

const MEMORIX_BLA_BLA_NAMESPACE_NAME_TREE: &[&str] = &["blaBla"];

impl MemorixBlaBla {
    pub fn new(
        other: memorix_client_redis::MemorixBase,
    ) -> Result<MemorixBlaBla, Box<dyn std::error::Error>> {
        let memorix_base = memorix_client_redis::MemorixBase::from(
            other,
            MEMORIX_BLA_BLA_NAMESPACE_NAME_TREE,
            None,
        );
        Ok(Self {
            cache: MemorixCacheBlaBla::new(memorix_base.clone()),
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCache {
    pub hello: memorix_client_redis::MemorixCacheItemNoKey<i32>,
}

impl MemorixCache {
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Self {
        Self {
            hello: memorix_client_redis::MemorixCacheItemNoKey::new(
                memorix_base.clone(),
                "hello".to_string(),
            ),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixPubSub {
    pub message: memorix_client_redis::MemorixPubSubItemNoKey<String>,
}

impl MemorixPubSub {
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Self {
        Self {
            message: memorix_client_redis::MemorixPubSubItemNoKey::new(
                memorix_base.clone(),
                "message".to_string(),
            ),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixTask {
    pub runAlgo: memorix_client_redis::MemorixTaskItemNoKey<String, Animal>,
}

impl MemorixTask {
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Self {
        Self {
            runAlgo: memorix_client_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgo".to_string(),
            ),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct Memorix {
    pub blaBla: MemorixBlaBla,

    pub cache: MemorixCache,
    pub pubsub: MemorixPubSub,
    pub task: MemorixTask,
}

const MEMORIX_NAMESPACE_NAME_TREE: &[&str] = &[];

impl Memorix {
    pub async fn new(redis_url: &str) -> Result<Memorix, Box<dyn std::error::Error>> {
        let memorix_base =
            memorix_client_redis::MemorixBase::new(redis_url, MEMORIX_NAMESPACE_NAME_TREE, None)
                .await?;
        Ok(Self {
            blaBla: MemorixBlaBla::new(memorix_base.clone())?,

            cache: MemorixCache::new(memorix_base.clone()),
            pubsub: MemorixPubSub::new(memorix_base.clone()),
            task: MemorixTask::new(memorix_base.clone()),
        })
    }
}

#[allow(dead_code)]
fn main() {}
