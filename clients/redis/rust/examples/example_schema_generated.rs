extern crate memorix_redis;
extern crate serde;
extern crate serde_json;

#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
#[derive(serde::Serialize, serde::Deserialize, PartialEq, std::fmt::Debug)]
pub enum Animal {
    dog,
    cat,
    person,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct User {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub age: Option<i32>,
}

#[allow(non_snake_case)]
pub struct MemorixCache<'a> {
    pub favoriteAnimal: memorix_redis::MemorixCacheItem<'a, String, Animal>,
    user: memorix_redis::MemorixCacheItem<'a, String, User>,
}

impl<'a> MemorixCache<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            favoriteAnimal: memorix_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "favoriteAnimal",
            ),
            user: memorix_redis::MemorixCacheItem::new(memorix_base.clone(), "user"),
        }
    }
}

pub struct MemorixPubSub<'a> {
    message: memorix_redis::MemorixPubSubItemNoKey<'a, String>,
}

impl<'a> MemorixPubSub<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            message: memorix_redis::MemorixPubSubItemNoKey::new(memorix_base, "message"),
        }
    }
}

#[allow(non_snake_case)]
pub struct MemorixTask<'a> {
    runAlgo: memorix_redis::MemorixTaskItemNoKey<'a, String, Animal>,
}

impl<'a> MemorixTask<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            runAlgo: memorix_redis::MemorixTaskItemNoKey::new(memorix_base, "runAlgo"),
        }
    }
}

pub struct Memorix<'a> {
    pub cache: MemorixCache<'a>,
    pub pubsub: MemorixPubSub<'a>,
    pub task: MemorixTask<'a>,
}

const MEMORIX_NAMESPACE_NAME_TREE: &'static [&'static str] = &[];
impl<'a> Memorix<'a> {
    pub async fn new(redis_url: &str) -> Memorix<'a> {
        let memorix_base =
            memorix_redis::MemorixBase::new(redis_url, MEMORIX_NAMESPACE_NAME_TREE, None).await;
        Self {
            cache: MemorixCache::new(memorix_base.clone()),
            pubsub: MemorixPubSub::new(memorix_base.clone()),
            task: MemorixTask::new(memorix_base.clone()),
        }
    }
}

fn main() {}
