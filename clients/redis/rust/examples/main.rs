// extern crate futures_util;
// mod example_schema_generated;

// use crate::futures_util::StreamExt;

// #[tokio::main]
// async fn main() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
//     let redis_url = std::env::var("REDIS_URL").expect("missing environment variable REDIS_URL");
//     let mut memorix = example_schema_generated::Memorix::new(&redis_url).await?;

//     // memorix
//     //     .blaBla
//     //     .cache
//     //     .favoriteAnimal
//     //     .set("123".to_string(), example_schema_generated::Animal::cat)
//     //     .await?;
//     // let fav = memorix
//     //     .blaBla
//     //     .cache
//     //     .favoriteAnimal
//     //     .get("123".to_string())
//     //     .await?;
//     // println!("Your fav is {:?}", fav);

//     // let mut stream = memorix.pubsub.message.subscribe().await?;
//     // memorix.pubsub.message.publish("Hello".to_string()).await?;
//     // memorix.pubsub.message.publish("world".to_string()).await?;
//     // while let Some(res) = stream.next().await {
//     //     let payload = res?.payload;
//     //     println!("your sub is {}", payload);
//     // }

//     memorix.task.runAlgo.queue("yay".to_string()).await?;
//     memorix.task.runAlgo.queue("nay".to_string()).await?;
//     let mut stream = memorix.task.runAlgo.dequeue().await?;
//     while let Some(res) = stream.next().await {
//         let payload = res?;
//         println!("your task is {}", payload);
//     }
//     Ok(())
// }

extern crate futures;
extern crate futures_util;
extern crate redis;

mod example_schema_generated;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
    let redis_url = std::env::var("REDIS_URL").expect("missing environment variable REDIS_URL");
    let mut memorix = example_schema_generated::Memorix::new(&redis_url).await?;

    let futures_v: Vec<
        std::pin::Pin<
            Box<
                dyn std::future::Future<
                    Output = Result<(), Box<dyn std::error::Error + Sync + Send>>,
                >,
            >,
        >,
    > = vec![
        Box::pin(loop_print(memorix.clone())),
        Box::pin(async move {
            loop {
                tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
                memorix
                    .blaBla
                    .cache
                    .favoriteAnimal
                    .set(
                        &"the key".to_string(),
                        &example_schema_generated::Animal::dog,
                    )
                    .await?;
            }
            #[allow(unreachable_code)]
            Ok(())
        }),
    ];

    futures::future::select_all(futures_v).await.0?;

    Ok(())
}

#[allow(unreachable_code)]
async fn loop_print(
    mut memorix: example_schema_generated::Memorix,
) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
    loop {
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
        let value = memorix
            .blaBla
            .cache
            .favoriteAnimal
            .get(&"the key".to_string())
            .await?;
        match value {
            Some(x) => println!("Animal is \"{:?}\".", x),
            _ => println!("No value yet!"),
        }
    }
    Ok(())
}
