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
}

#[derive(
    Clone,
    memorix_client_redis::Serialize,
    memorix_client_redis::Deserialize,
    PartialEq,
    std::fmt::Debug,
)]
pub struct SpaceshipCachePilotPayload {
    pub name: String,
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCacheSpaceshipCrew {
    pub count: memorix_client_redis::MemorixCacheItemNoKey<i32>,
}

impl MemorixCacheSpaceshipCrew {
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Self {
        Self {
            count: memorix_client_redis::MemorixCacheItemNoKey::new(
                memorix_base.clone(),
                "count".to_string(),
                None,
            ),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixSpaceshipCrew {
    pub cache: MemorixCacheSpaceshipCrew,
}

const MEMORIX_SPACESHIP_CREW_NAMESPACE_NAME_TREE: &[&str] = &["spaceship", "crew"];

impl MemorixSpaceshipCrew {
    pub fn new(
        other: memorix_client_redis::MemorixBase,
    ) -> Result<MemorixSpaceshipCrew, Box<dyn std::error::Error + Sync + Send>> {
        let memorix_base = memorix_client_redis::MemorixBase::from(
            other,
            MEMORIX_SPACESHIP_CREW_NAMESPACE_NAME_TREE,
            None,
        );
        Ok(Self {
            cache: MemorixCacheSpaceshipCrew::new(memorix_base.clone()),
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCacheSpaceship {
    pub pilot: memorix_client_redis::MemorixCacheItemNoKey<SpaceshipCachePilotPayload>,
}

impl MemorixCacheSpaceship {
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Self {
        Self {
            pilot: memorix_client_redis::MemorixCacheItemNoKey::new(
                memorix_base.clone(),
                "pilot".to_string(),
                None,
            ),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixSpaceship {
    pub crew: MemorixSpaceshipCrew,

    pub cache: MemorixCacheSpaceship,
}

const MEMORIX_SPACESHIP_NAMESPACE_NAME_TREE: &[&str] = &["spaceship"];

impl MemorixSpaceship {
    pub fn new(
        other: memorix_client_redis::MemorixBase,
    ) -> Result<MemorixSpaceship, Box<dyn std::error::Error + Sync + Send>> {
        let memorix_base = memorix_client_redis::MemorixBase::from(
            other,
            MEMORIX_SPACESHIP_NAMESPACE_NAME_TREE,
            None,
        );
        Ok(Self {
            crew: MemorixSpaceshipCrew::new(memorix_base.clone())?,

            cache: MemorixCacheSpaceship::new(memorix_base.clone()),
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCache {
    pub favoriteAnimal: memorix_client_redis::MemorixCacheItem<String, Animal>,
    pub user: memorix_client_redis::MemorixCacheItem<String, User>,
    pub userNoKey: memorix_client_redis::MemorixCacheItemNoKey<User>,
    pub userExpire: memorix_client_redis::MemorixCacheItem<String, User>,
    pub userExpire2: memorix_client_redis::MemorixCacheItem<String, User>,
    pub userExpire3: memorix_client_redis::MemorixCacheItem<String, User>,
}

impl MemorixCache {
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Self {
        Self {
            favoriteAnimal: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "favoriteAnimal".to_string(),
                None,
            ),
            user: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "user".to_string(),
                None,
            ),
            userNoKey: memorix_client_redis::MemorixCacheItemNoKey::new(
                memorix_base.clone(),
                "userNoKey".to_string(),
                None,
            ),
            userExpire: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire".to_string(),
                Some(memorix_client_redis::MemorixOptionsCache {
                    expire: Some(memorix_client_redis::MemorixOptionsCacheExpire {
                        value: 1000,
                        is_in_ms: Some(true),
                        extend_on_get: None,
                    }),
                }),
            ),
            userExpire2: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire2".to_string(),
                Some(memorix_client_redis::MemorixOptionsCache { expire: None }),
            ),
            userExpire3: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire3".to_string(),
                Some(memorix_client_redis::MemorixOptionsCache {
                    expire: Some(memorix_client_redis::MemorixOptionsCacheExpire {
                        value: 2,
                        is_in_ms: None,
                        extend_on_get: Some(true),
                    }),
                }),
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
    pub runAlgo2: memorix_client_redis::MemorixTaskItemNoKeyNoReturns<String>,
    pub runAlgoNewest: memorix_client_redis::MemorixTaskItemNoKey<String, Animal>,
}

impl MemorixTask {
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Self {
        Self {
            runAlgo: memorix_client_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgo".to_string(),
                None,
            ),
            runAlgo2: memorix_client_redis::MemorixTaskItemNoKeyNoReturns::new(
                memorix_base.clone(),
                "runAlgo2".to_string(),
                None,
            ),
            runAlgoNewest: memorix_client_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgoNewest".to_string(),
                Some(memorix_client_redis::MemorixOptionsTask {
                    take_newest: Some(true),
                }),
            ),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct Memorix {
    pub spaceship: MemorixSpaceship,

    pub cache: MemorixCache,
    pub pubsub: MemorixPubSub,
    pub task: MemorixTask,
}

const MEMORIX_NAMESPACE_NAME_TREE: &[&str] = &[];

impl Memorix {
    pub async fn new(redis_url: &str) -> Result<Memorix, Box<dyn std::error::Error + Sync + Send>> {
        let memorix_base = memorix_client_redis::MemorixBase::new(
            redis_url,
            MEMORIX_NAMESPACE_NAME_TREE,
            Some(memorix_client_redis::MemorixOptions {
                cache: Some(memorix_client_redis::MemorixOptionsCache {
                    expire: Some(memorix_client_redis::MemorixOptionsCacheExpire {
                        value: 2,
                        is_in_ms: None,
                        extend_on_get: None,
                    }),
                }),
                task: None,
            }),
        )
        .await?;
        Ok(Self {
            spaceship: MemorixSpaceship::new(memorix_base.clone())?,

            cache: MemorixCache::new(memorix_base.clone()),
            pubsub: MemorixPubSub::new(memorix_base.clone()),
            task: MemorixTask::new(memorix_base.clone()),
        })
    }
}
