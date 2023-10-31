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

pub struct MemorixCache<'a> {
    pub favoriteAnimal: memorix_redis::MemorixCacheItem<'a, String, Animal>,
    // pub user: memorix_redis::MemorixCacheItem<'a, String, User>,
}

impl<'a> MemorixCache<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            favoriteAnimal: memorix_redis::MemorixCacheItem::new(memorix_base, "favoriteAnimal"),
            // user: memorix_redis::MemorixCacheItem::new(memorix_base, "user"),
        }
    }
}

pub struct Memorix<'a> {
    pub cache: MemorixCache<'a>,
}

impl<'a> Memorix<'a> {
    pub async fn new(redis_url: &str) -> Memorix<'a> {
        let memorix_base = memorix_redis::MemorixBase::new(redis_url).await;
        Self {
            cache: MemorixCache::new(memorix_base),
        }
    }
}

fn main() {}
