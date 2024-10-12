#![allow(dead_code)]
extern crate memorix_client_redis;

#[memorix_client_redis::serialization]
#[derive(Clone, PartialEq, std::fmt::Debug)]
pub struct InlineTypeUser {
    pub name: String,
    pub age: Option<i32>,
}

#[memorix_client_redis::serialization]
#[derive(Clone, PartialEq, std::fmt::Debug)]
pub struct InlineCachePayloadPilot {
    pub name: String,
}

#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
#[memorix_client_redis::serialization]
#[derive(Clone, PartialEq, std::fmt::Debug)]
pub enum Animal {
    dog,
    cat,
    person,
}

pub type User = InlineTypeUser;

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCacheCrew {
    pub count: memorix_client_redis::MemorixCacheItemNoKey<
        i32,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
}

impl MemorixCacheCrew {
    fn new(
        memorix_base: memorix_client_redis::MemorixBase,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            count: memorix_client_redis::MemorixCacheItemNoKey::new(
                memorix_base.clone(),
                "count".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl: None,
                    extend_on_get: None,
                }),
            )?,
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCrew {
    pub cache: MemorixCacheCrew,
}

const MEMORIX_CREW_NAMESPACE_NAME_TREE: &[&str] = &["spaceship", "crew"];

impl MemorixCrew {
    pub fn new(
        other: memorix_client_redis::MemorixBase,
    ) -> Result<MemorixCrew, Box<dyn std::error::Error + Sync + Send>> {
        let memorix_base =
            memorix_client_redis::MemorixBase::from(other, MEMORIX_CREW_NAMESPACE_NAME_TREE);
        Ok(Self {
            cache: MemorixCacheCrew::new(memorix_base.clone())?,
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCacheSpaceship {
    pub pilot: memorix_client_redis::MemorixCacheItemNoKey<
        InlineCachePayloadPilot,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
}

impl MemorixCacheSpaceship {
    fn new(
        memorix_base: memorix_client_redis::MemorixBase,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            pilot: memorix_client_redis::MemorixCacheItemNoKey::new(
                memorix_base.clone(),
                "pilot".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl: None,
                    extend_on_get: None,
                }),
            )?,
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixSpaceship {
    pub crew: MemorixCrew,

    pub cache: MemorixCacheSpaceship,
}

const MEMORIX_SPACESHIP_NAMESPACE_NAME_TREE: &[&str] = &["spaceship"];

impl MemorixSpaceship {
    pub fn new(
        other: memorix_client_redis::MemorixBase,
    ) -> Result<MemorixSpaceship, Box<dyn std::error::Error + Sync + Send>> {
        let memorix_base =
            memorix_client_redis::MemorixBase::from(other, MEMORIX_SPACESHIP_NAMESPACE_NAME_TREE);
        Ok(Self {
            crew: MemorixCrew::new(memorix_base.clone())?,

            cache: MemorixCacheSpaceship::new(memorix_base.clone())?,
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCache {
    pub favoriteAnimal: memorix_client_redis::MemorixCacheItem<
        String,
        Animal,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
    pub user: memorix_client_redis::MemorixCacheItem<
        String,
        User,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
    pub userNoKey: memorix_client_redis::MemorixCacheItemNoKey<
        User,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
    pub userExpire: memorix_client_redis::MemorixCacheItem<
        String,
        User,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
    pub userExpire2: memorix_client_redis::MemorixCacheItem<
        String,
        User,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
    pub userExpire3: memorix_client_redis::MemorixCacheItem<
        String,
        User,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
}

impl MemorixCache {
    fn new(
        memorix_base: memorix_client_redis::MemorixBase,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            favoriteAnimal: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "favoriteAnimal".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl: Some("2".to_string()),
                    extend_on_get: None,
                }),
            )?,
            user: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "user".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl: Some("2".to_string()),
                    extend_on_get: None,
                }),
            )?,
            userNoKey: memorix_client_redis::MemorixCacheItemNoKey::new(
                memorix_base.clone(),
                "userNoKey".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl: Some("2".to_string()),
                    extend_on_get: None,
                }),
            )?,
            userExpire: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl: Some("1".to_string()),
                    extend_on_get: None,
                }),
            )?,
            userExpire2: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire2".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl: Some("10".to_string()),
                    extend_on_get: None,
                }),
            )?,
            userExpire3: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire3".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl: Some("2".to_string()),
                    extend_on_get: Some("true".to_string()),
                }),
            )?,
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixPubSub {
    pub message: memorix_client_redis::MemorixPubSubItemNoKey<
        String,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
}

impl MemorixPubSub {
    fn new(
        memorix_base: memorix_client_redis::MemorixBase,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            message: memorix_client_redis::MemorixPubSubItemNoKey::new(
                memorix_base.clone(),
                "message".to_string(),
            )?,
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixTask {
    pub runAlgo: memorix_client_redis::MemorixTaskItemNoKey<
        String,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
    pub runAlgo2: memorix_client_redis::MemorixTaskItemNoKey<
        String,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
    pub runAlgoNewest: memorix_client_redis::MemorixTaskItemNoKey<
        String,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
        memorix_client_redis::Expose,
    >,
}

impl MemorixTask {
    fn new(
        memorix_base: memorix_client_redis::MemorixBase,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            runAlgo: memorix_client_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgo".to_string(),
                Some(memorix_client_redis::MemorixTaskOptions { queue_type: None }),
            )?,
            runAlgo2: memorix_client_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgo2".to_string(),
                Some(memorix_client_redis::MemorixTaskOptions { queue_type: None }),
            )?,
            runAlgoNewest: memorix_client_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgoNewest".to_string(),
                Some(memorix_client_redis::MemorixTaskOptions {
                    queue_type: Some("lifo".to_string()),
                }),
            )?,
        })
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
    pub async fn new() -> Result<Memorix, Box<dyn std::error::Error + Sync + Send>> {
        let memorix_base = memorix_client_redis::MemorixBase::new(
            &std::env::var("REDIS_URL").expect("missing environment variable REDIS_URL"),
            MEMORIX_NAMESPACE_NAME_TREE,
        )
        .await?;
        Ok(Self {
            spaceship: MemorixSpaceship::new(memorix_base.clone())?,

            cache: MemorixCache::new(memorix_base.clone())?,
            pubsub: MemorixPubSub::new(memorix_base.clone())?,
            task: MemorixTask::new(memorix_base.clone())?,
        })
    }
}
