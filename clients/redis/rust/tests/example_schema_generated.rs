#![allow(dead_code)]
extern crate memorix_client_redis;


#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
#[memorix_client_redis::serialization]
#[derive(Clone, PartialEq, std::fmt::Debug)]
pub enum Animal {
    dog,
    cat,
    person,
}


#[memorix_client_redis::serialization]
#[derive(Clone, PartialEq, std::fmt::Debug)]
pub struct InlineTypeUser {
    pub name: String,
    pub age: Option<i32>,
}

pub type User = InlineTypeUser;

pub mod spaceship {

    #[memorix_client_redis::serialization]
    #[derive(Clone, PartialEq, std::fmt::Debug)]
    pub struct InlineCachePayloadPilot {
        pub name: String,
    }

    pub mod crew {
        #[derive(Clone)]
        #[allow(non_snake_case)]
        pub struct MemorixCache {
            pub count: memorix_client_redis::MemorixCacheItemNoKey<i32, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
            pub another: memorix_client_redis::MemorixCacheItemNoKey<super::super::User, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
        }

        impl MemorixCache {
            fn new(memorix_base: memorix_client_redis::MemorixBase) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
                Ok(Self {
                    count: memorix_client_redis::MemorixCacheItemNoKey::new(
                        memorix_base.clone(),
                        "count".to_string(),
                        Some(memorix_client_redis::MemorixCacheOptions {
                            ttl_ms: None,
                            extend_on_get: None,
                        }),
                    )?,
                    another: memorix_client_redis::MemorixCacheItemNoKey::new(
                        memorix_base.clone(),
                        "another".to_string(),
                        Some(memorix_client_redis::MemorixCacheOptions {
                            ttl_ms: None,
                            extend_on_get: None,
                        }),
                    )?,
                })
            }
        }

        #[derive(Clone)]
        #[allow(non_snake_case)]
        pub struct Memorix {
            pub cache: MemorixCache,
        }

        const MEMORIX_NAMESPACE_NAME_TREE: &[&str] = &["spaceship", "crew"];

        impl Memorix {
            pub fn new(
                other: memorix_client_redis::MemorixBase,
            ) -> Result<Memorix, Box<dyn std::error::Error + Sync + Send>> {
                let _memorix_base = memorix_client_redis::MemorixBase::from(
                    other,
                    MEMORIX_NAMESPACE_NAME_TREE,
                );
                Ok(Self {
                    cache: MemorixCache::new(_memorix_base.clone())?,
                })
            }
        }

    }
    #[derive(Clone)]
    #[allow(non_snake_case)]
    pub struct MemorixCache {
        pub pilot: memorix_client_redis::MemorixCacheItemNoKey<InlineCachePayloadPilot, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
    }

    impl MemorixCache {
        fn new(memorix_base: memorix_client_redis::MemorixBase) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
            Ok(Self {
                pilot: memorix_client_redis::MemorixCacheItemNoKey::new(
                    memorix_base.clone(),
                    "pilot".to_string(),
                    Some(memorix_client_redis::MemorixCacheOptions {
                        ttl_ms: None,
                        extend_on_get: None,
                    }),
                )?,
            })
        }
    }

    #[derive(Clone)]
    #[allow(non_snake_case)]
    pub struct Memorix {
        pub crew: crew::Memorix,

        pub cache: MemorixCache,
    }

    const MEMORIX_NAMESPACE_NAME_TREE: &[&str] = &["spaceship"];

    impl Memorix {
        pub fn new(
            other: memorix_client_redis::MemorixBase,
        ) -> Result<Memorix, Box<dyn std::error::Error + Sync + Send>> {
            let _memorix_base = memorix_client_redis::MemorixBase::from(
                other,
                MEMORIX_NAMESPACE_NAME_TREE,
            );
            Ok(Self {
                crew: crew::Memorix::new(_memorix_base.clone())?,

                cache: MemorixCache::new(_memorix_base.clone())?,
            })
        }
    }

}
#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCache {
    pub favoriteAnimal: memorix_client_redis::MemorixCacheItem<String, Animal, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
    pub user: memorix_client_redis::MemorixCacheItem<String, User, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
    pub userNoKey: memorix_client_redis::MemorixCacheItemNoKey<User, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
    pub userExpire: memorix_client_redis::MemorixCacheItem<String, User, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
    pub userExpire2: memorix_client_redis::MemorixCacheItem<String, User, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
    pub userExpire3: memorix_client_redis::MemorixCacheItem<String, User, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
}

impl MemorixCache {
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            favoriteAnimal: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "favoriteAnimal".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl_ms: Some(memorix_client_redis::Value::from_string("2000")),
                    extend_on_get: None,
                }),
            )?,
            user: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "user".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl_ms: Some(memorix_client_redis::Value::from_string("2000")),
                    extend_on_get: None,
                }),
            )?,
            userNoKey: memorix_client_redis::MemorixCacheItemNoKey::new(
                memorix_base.clone(),
                "userNoKey".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl_ms: Some(memorix_client_redis::Value::from_string("2000")),
                    extend_on_get: None,
                }),
            )?,
            userExpire: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl_ms: Some(memorix_client_redis::Value::from_string("1000")),
                    extend_on_get: None,
                }),
            )?,
            userExpire2: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire2".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl_ms: Some(memorix_client_redis::Value::from_string("10000")),
                    extend_on_get: None,
                }),
            )?,
            userExpire3: memorix_client_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "userExpire3".to_string(),
                Some(memorix_client_redis::MemorixCacheOptions {
                    ttl_ms: Some(memorix_client_redis::Value::from_string("2000")),
                    extend_on_get: Some(memorix_client_redis::Value::from_string("true")),
                }),
            )?,
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixPubSub {
    pub message: memorix_client_redis::MemorixPubSubItemNoKey<String, memorix_client_redis::Expose, memorix_client_redis::Expose>,
}

impl MemorixPubSub {
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
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
    pub runAlgo: memorix_client_redis::MemorixTaskItemNoKey<String, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
    pub runAlgo2: memorix_client_redis::MemorixTaskItemNoKey<String, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
    pub runAlgoNewest: memorix_client_redis::MemorixTaskItemNoKey<String, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose, memorix_client_redis::Expose>,
}

impl MemorixTask {
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        Ok(Self {
            runAlgo: memorix_client_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgo".to_string(),
                Some(memorix_client_redis::MemorixTaskOptions {
                    queue_type: None,
                }),
            )?,
            runAlgo2: memorix_client_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgo2".to_string(),
                Some(memorix_client_redis::MemorixTaskOptions {
                    queue_type: None,
                }),
            )?,
            runAlgoNewest: memorix_client_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgoNewest".to_string(),
                Some(memorix_client_redis::MemorixTaskOptions {
                    queue_type: Some(memorix_client_redis::Value::from_string("lifo")),
                }),
            )?,
        })
    }
}

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct Memorix {
    pub spaceship: spaceship::Memorix,

    pub cache: MemorixCache,
    pub pubsub: MemorixPubSub,
    pub task: MemorixTask,
}

const MEMORIX_NAMESPACE_NAME_TREE: &[&str] = &[];

impl Memorix {
    pub async fn new() -> Result<Memorix, Box<dyn std::error::Error + Sync + Send>> {
        let _memorix_base = memorix_client_redis::MemorixBase::new(
            &memorix_client_redis::Value::from_env_variable("REDIS_URL"),
            MEMORIX_NAMESPACE_NAME_TREE,
        )
        .await?;
        Ok(Self {
            spaceship: spaceship::Memorix::new(_memorix_base.clone())?,

            cache: MemorixCache::new(_memorix_base.clone())?,
            pubsub: MemorixPubSub::new(_memorix_base.clone())?,
            task: MemorixTask::new(_memorix_base.clone())?,
        })
    }
}
