extern crate memorix_redis;
extern crate serde;
extern crate serde_json;

#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
#[derive(Clone, serde::Serialize, serde::Deserialize, PartialEq, std::fmt::Debug)]
pub enum Animal {
    dog,
    cat,
    person,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct User {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub age: Option<i32>,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct SpaceshipCachePilotPayload {
    pub name: String,
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCacheSpaceshipCrew<'a> {
    pub count: memorix_redis::MemorixCacheItemNoKey<'a, i32>,
}

impl<'a> MemorixCacheSpaceshipCrew<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            count: memorix_redis::MemorixCacheItemNoKey::new(memorix_base.clone(), "count"),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixSpaceshipCrew<'a> {
    pub cache: MemorixCacheSpaceshipCrew<'a>,
}

const MEMORIX_SPACESHIP_CREW_NAMESPACE_NAME_TREE: &'static [&'static str] = &["spaceship", "crew"];

impl<'a> MemorixSpaceshipCrew<'a> {
    pub fn new(
        other: memorix_redis::MemorixBase,
    ) -> Result<MemorixSpaceshipCrew<'a>, Box<dyn std::error::Error>> {
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
pub struct MemorixCacheSpaceship<'a> {
    pub pilot: memorix_redis::MemorixCacheItemNoKey<'a, SpaceshipCachePilotPayload>,
}

impl<'a> MemorixCacheSpaceship<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            pilot: memorix_redis::MemorixCacheItemNoKey::new(memorix_base.clone(), "pilot"),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixSpaceship<'a> {
    pub crew: MemorixSpaceshipCrew<'a>,

    pub cache: MemorixCacheSpaceship<'a>,
}

const MEMORIX_SPACESHIP_NAMESPACE_NAME_TREE: &'static [&'static str] = &["spaceship"];

impl<'a> MemorixSpaceship<'a> {
    pub fn new(
        other: memorix_redis::MemorixBase,
    ) -> Result<MemorixSpaceship<'a>, Box<dyn std::error::Error>> {
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
pub struct MemorixCache<'a> {
    pub favoriteAnimal: memorix_redis::MemorixCacheItem<'a, String, Animal>,
    pub user: memorix_redis::MemorixCacheItem<'a, String, User>,
    pub userNoKey: memorix_redis::MemorixCacheItemNoKey<'a, User>,
    pub userExpire: memorix_redis::MemorixCacheItem<'a, String, User>,
    pub userExpire2: memorix_redis::MemorixCacheItem<'a, String, User>,
    pub userExpire3: memorix_redis::MemorixCacheItem<'a, String, User>,
}

impl<'a> MemorixCache<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            favoriteAnimal: memorix_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "favoriteAnimal",
            ),
            user: memorix_redis::MemorixCacheItem::new(memorix_base.clone(), "user"),
            userNoKey: memorix_redis::MemorixCacheItemNoKey::new(memorix_base.clone(), "userNoKey"),
            userExpire: memorix_redis::MemorixCacheItem::new(memorix_base.clone(), "userExpire"),
            userExpire2: memorix_redis::MemorixCacheItem::new(memorix_base.clone(), "userExpire2"),
            userExpire3: memorix_redis::MemorixCacheItem::new(memorix_base.clone(), "userExpire3"),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixPubSub<'a> {
    pub message: memorix_redis::MemorixPubSubItemNoKey<'a, String>,
}

impl<'a> MemorixPubSub<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            message: memorix_redis::MemorixPubSubItemNoKey::new(memorix_base.clone(), "message"),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixTask<'a> {
    pub runAlgo: memorix_redis::MemorixTaskItemNoKey<'a, String, Animal>,
    pub runAlgoNewest: memorix_redis::MemorixTaskItemNoKey<'a, String, Animal>,
}

impl<'a> MemorixTask<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            runAlgo: memorix_redis::MemorixTaskItemNoKey::new(memorix_base.clone(), "runAlgo"),
            runAlgoNewest: memorix_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgoNewest",
            ),
        }
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct Memorix<'a> {
    pub spaceship: MemorixSpaceship<'a>,

    pub cache: MemorixCache<'a>,
    pub pubsub: MemorixPubSub<'a>,
    pub task: MemorixTask<'a>,
}

const MEMORIX_NAMESPACE_NAME_TREE: &'static [&'static str] = &[];

impl<'a> Memorix<'a> {
    pub async fn new(redis_url: &str) -> Result<Memorix<'a>, Box<dyn std::error::Error>> {
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
