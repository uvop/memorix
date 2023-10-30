extern crate memorix_redis;
extern crate serde;
extern crate serde_json;

#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
#[derive(serde::Serialize, serde::Deserialize, PartialEq)]
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
    pub favorite_animal: memorix_redis::MemorixCacheItemNoKey<'a, Animal>,
}

impl<'a> MemorixCache<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        MemorixCache {
            favorite_animal: memorix_redis::MemorixCacheItemNoKey::new(
                memorix_base,
                "favoriteAnimal",
            ),
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

// class MemorixCache(MemorixCacheBase):
//     def __init__(self, api: MemorixBase) -> None:
//         super().__init__(api=api)

//         self.favoriteAnimal = MemorixCacheItem[String, Animal](
//             api=api,
//             id="favoriteAnimal",
//             payload_class=Animal,
//         )
//         self.user = MemorixCacheItem[String, User](
//             api=api,
//             id="user",
//             payload_class=User,
//         )

// class MemorixPubSub(MemorixPubSubBase):
//     def __init__(self, api: MemorixBase) -> None:
//         super().__init__(api=api)

//         self.message = MemorixPubSubItemNoKey[String](
//             api=api,
//             id="message",
//             payload_class=String,
//         )

// class MemorixTask(MemorixTaskBase):
//     def __init__(self, api: MemorixBase) -> None:
//         super().__init__(api=api)

//         self.runAlgo = MemorixTaskItemNoKey[String, Animal](
//             api=api,
//             id="runAlgo",
//             payload_class=String,
//             returns_class=Animal,
//         )

// class Memorix(MemorixBase):
//     def __init__(
//         self,
//         redis_url: str,
//         ref: typing.Optional[MemorixBase] = None,
//     ) -> None:
//         super().__init__(redis_url=redis_url, ref=ref)

//         self._namespace_name_tree: typing.List[str] = []

//         self.cache = MemorixCache(self)
//         self.pubsub = MemorixPubSub(self)
//         self.task = MemorixTask(self)
