extern crate futures_util;
mod example_schema_generated;

use crate::futures_util::StreamExt;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let redis_url = std::env::var("REDIS_URL").expect("missing environment variable REDIS_URL");
    let mut memorix = example_schema_generated::Memorix::new(&redis_url).await;

    // memorix
    //     .blaBla
    //     .cache
    //     .favoriteAnimal
    //     .set("123".to_string(), example_schema_generated::Animal::cat)
    //     .await?;
    // let fav = memorix
    //     .blaBla
    //     .cache
    //     .favoriteAnimal
    //     .get("123".to_string())
    //     .await?;
    // println!("Your fav is {:?}", fav);

    // let mut stream = memorix.pubsub.message.subscribe().await?;
    // memorix.pubsub.message.publish("Hello".to_string()).await?;
    // memorix.pubsub.message.publish("world".to_string()).await?;
    // while let Some(res) = stream.next().await {
    //     let payload = res?.payload;
    //     println!("your sub is {}", payload);
    // }

    memorix.task.runAlgo.queue("yay".to_string()).await?;
    memorix.task.runAlgo.queue("nay".to_string()).await?;
    let mut stream = memorix.task.runAlgo.dequeue().await?;
    while let Some(res) = stream.next().await {
        let payload = res?;
        println!("your task is {}", payload);
    }
    Ok(())
}
