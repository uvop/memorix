extern crate memorix_redis;

#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
#[derive(Clone, memorix_redis::Serialize, memorix_redis::Deserialize, PartialEq, std::fmt::Debug)]
pub enum Animal {
    dog,
    cat,
    person,
}


#[derive(Clone, memorix_redis::Serialize, memorix_redis::Deserialize)]
pub struct User {
    pub name: String,
    #[memorix_redis(skip_serializing_if = "Option::is_none")]
    pub age: Option<i32>,
    #[memorix_redis(skip_serializing_if = "Option::is_none")]
    pub r#type: Option<bool>,
}


#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCacheBlaBla<'a> {
    pub favoriteAnimal: memorix_redis::MemorixCacheItem<'a, String, Animal>,
    pub user: memorix_redis::MemorixCacheItem<'a, String, User>,
}

impl<'a> MemorixCacheBlaBla<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            favoriteAnimal: memorix_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "favoriteAnimal",
            ),
            user: memorix_redis::MemorixCacheItem::new(
                memorix_base.clone(),
                "user",
            ),
        }
    }
}


#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixBlaBla<'a> {

    pub cache: MemorixCacheBlaBla<'a>,
}

const MEMORIX_BLA_BLA_NAMESPACE_NAME_TREE: &'static [&'static str] = &["blaBla"];

impl<'a> MemorixBlaBla<'a> {
    pub fn new(other: memorix_redis::MemorixBase) -> Result<MemorixBlaBla<'a>, Box<dyn std::error::Error>> {
        let memorix_base = memorix_redis::MemorixBase::from(
            other,
            MEMORIX_BLA_BLA_NAMESPACE_NAME_TREE,
            None
        );
        Ok(Self {

            cache: MemorixCacheBlaBla::new(memorix_base.clone()),
        })
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
            message: memorix_redis::MemorixPubSubItemNoKey::new(
                memorix_base.clone(),
                "message",
            ),
        }
    }
}


#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixTask<'a> {
    pub runAlgo: memorix_redis::MemorixTaskItemNoKey<'a, String, Animal>,
}

impl<'a> MemorixTask<'a> {
    fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
        Self {
            runAlgo: memorix_redis::MemorixTaskItemNoKey::new(
                memorix_base.clone(),
                "runAlgo",
            ),
        }
    }
}


#[derive(Clone)]
#[allow(non_snake_case)]
pub struct Memorix<'a> {
            pub blaBla: MemorixBlaBla<'a>,

    pub pubsub: MemorixPubSub<'a>,
    pub task: MemorixTask<'a>,
}

const MEMORIX_NAMESPACE_NAME_TREE: &'static [&'static str] = &[];

impl<'a> Memorix<'a> {
    pub async fn new(redis_url: &str) -> Result<Memorix<'a>, Box<dyn std::error::Error>> {
        let memorix_base = memorix_redis::MemorixBase::new(
            redis_url,
            MEMORIX_NAMESPACE_NAME_TREE,
            None
        ).await?;
        Ok(Self {
            blaBla: MemorixBlaBla::new(memorix_base.clone())?,

            pubsub: MemorixPubSub::new(memorix_base.clone()),
            task: MemorixTask::new(memorix_base.clone()),
        })
    }
}