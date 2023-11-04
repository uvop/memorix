extern crate memorix_redis;

#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
#[derive(
    Clone, memorix_redis::Serialize, memorix_redis::Deserialize, PartialEq, std::fmt::Debug,
)]
pub enum Animal {
    dog,
    cat,
    person,
}

#[derive(Clone, memorix_redis::Serialize, memorix_redis::Deserialize)]
pub struct User {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub age: Option<i32>,
}

#[derive(Clone, memorix_redis::Serialize, memorix_redis::Deserialize)]
pub struct SpaceshipCachePilotPayload {
    pub name: String,
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCacheSpaceshipCrew {
    pub count: memorix_redis::MemorixCacheItemNoKey<i32>,
}

impl MemorixCacheSpaceshipCrew {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            count: memorix_redis::MemorixCacheItemNoKey::new(
                memorix_base.clone(),
                "count".to_string(),
            ),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixSpaceshipCrew {
    pub cache: MemorixCacheSpaceshipCrew,
}

const MEMORIX_SPACESHIP_CREW_NAMESPACE_NAME_TREE: &'static [&'static str] = &["spaceship", "crew"];

impl MemorixSpaceshipCrew {
    pub fn new(
        other: memorix_redis::MemorixBase,
    ) -> Result<MemorixSpaceshipCrew, Box<dyn std::error::Error>> {
        let memorix_base = memorix_redis::MemorixBase::from(
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
    pub pilot: memorix_redis::MemorixCacheItemNoKey<SpaceshipCachePilotPayload>,
}

impl MemorixCacheSpaceship {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            pilot: memorix_redis::MemorixCacheItemNoKey::new(
                memorix_base.clone(),
                "pilot".to_string(),
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

const MEMORIX_SPACESHIP_NAMESPACE_NAME_TREE: &'static [&'static str] = &["spaceship"];

impl MemorixSpaceship {
    pub fn new(
        other: memorix_redis::MemorixBase,
    ) -> Result<MemorixSpaceship, Box<dyn std::error::Error>> {
        let memorix_base =
            memorix_redis::MemorixBase::from(other, MEMORIX_SPACESHIP_NAMESPACE_NAME_TREE, None);
        Ok(Self {
            crew: MemorixSpaceshipCrew::new(memorix_base.clone())?,

            cache: MemorixCacheSpaceship::new(memorix_base.clone()),
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCache {
    pub favoriteAnimal: memorix_redis::MemorixCacheItem<String, Animal>,
    pub user: memorix_redis::MemorixCacheItem<String, User>,
    pub userNoKey: memorix_redis::MemorixCacheItemNoKey<User>,
    pub userExpire: memorix_redis::MemorixCacheItem<String, User>,
    pub userExpire2: memorix_redis::MemorixCacheItem<String, User>,
    pub userExpire3: memorix_redis::MemorixCacheItem<String, User>,
}

impl MemorixCache {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            favoriteAnimal: memorix_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "favoriteAnimal".to_string(),
            ),
            user: memorix_redis::MemorixCacheItem::new(memorix_base.clone(), "user".to_string()),
            userNoKey: memorix_redis::MemorixCacheItemNoKey::new(
                memorix_base.clone(),
                "userNoKey".to_string(),
            ),
            userExpire: memorix_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire".to_string(),
            ),
            userExpire2: memorix_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire2".to_string(),
            ),
            userExpire3: memorix_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire3".to_string(),
            ),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixPubSub {
    pub message: memorix_redis::MemorixPubSubItemNoKey<String>,
}

impl MemorixPubSub {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            message: memorix_redis::MemorixPubSubItemNoKey::new(
                memorix_base.clone(),
                "message".to_string(),
            ),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixTask {
    pub runAlgo: memorix_redis::MemorixTaskItemNoKey<String, Animal>,
    pub runAlgoNewest: memorix_redis::MemorixTaskItemNoKey<String, Animal>,
}

impl MemorixTask {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            runAlgo: memorix_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgo".to_string(),
            ),
            runAlgoNewest: memorix_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgoNewest".to_string(),
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

const MEMORIX_NAMESPACE_NAME_TREE: &'static [&'static str] = &[];

impl Memorix {
    pub async fn new(redis_url: &str) -> Result<Memorix, Box<dyn std::error::Error>> {
        let memorix_base = memorix_redis::MemorixBase::new(
            redis_url,
            MEMORIX_NAMESPACE_NAME_TREE,
            Some(memorix_redis::MemorixOptions {
                cache: Some(memorix_redis::MemorixOptionsCache {
                    expire: Some(memorix_redis::MemorixOptionsCacheExpire {
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
