// extern crate memorix_client_redis;
mod example_schema_generated;

// use memorix_client_redis::StreamExt;

async fn get_memorix() -> Result<example_schema_generated::Memorix, Box<dyn std::error::Error>> {
    let redis_url = std::env::var("REDIS_URL").expect("missing environment variable REDIS_URL");
    let memorix = example_schema_generated::Memorix::new(&redis_url).await?;
    Ok(memorix)
}

// async fn dequeue_and_return(
//     mut memorix: example_schema_generated::Memorix,
// ) -> Result<(), Box<dyn std::error::Error>> {
//     let mut stream = memorix.task.runAlgo.dequeue().await.unwrap();
//     let res = match stream.next().await {
//         Some(x) => x.unwrap(),
//         _ => panic!("Should not happen"),
//     };
//     println!("Res is {}", res);
//     Ok(())
// }
mod tests {
    use futures_util::{future::select_all, StreamExt};
    type BoxPinFuture<'a, 'b, T> = std::pin::Pin<
        Box<dyn std::future::Future<Output = Result<T, Box<dyn std::error::Error + 'b>>> + 'a>,
    >;

    #[tokio::test]
    async fn set_get() -> Result<(), Box<dyn std::error::Error>> {
        let mut memorix = crate::get_memorix().await?;
        memorix
            .cache
            .favoriteAnimal
            .set(
                &"123".to_string(),
                &crate::example_schema_generated::Animal::dog,
            )
            .await?;
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
        let favorite_animal = memorix.cache.favoriteAnimal.get(&"123".to_string()).await?;
        assert_eq!(
            favorite_animal,
            Some(crate::example_schema_generated::Animal::dog)
        );
        Ok(())
    }
    #[tokio::test]
    async fn set_get_expire() -> Result<(), Box<dyn std::error::Error>> {
        let mut memorix = crate::get_memorix().await?;
        memorix
            .cache
            .favoriteAnimal
            .set(
                &"123".to_string(),
                &crate::example_schema_generated::Animal::dog,
            )
            .await?;
        tokio::time::sleep(tokio::time::Duration::from_millis(2500)).await;
        let favorite_animal = memorix.cache.favoriteAnimal.get(&"123".to_string()).await?;
        assert_eq!(favorite_animal, None);
        Ok(())
    }

    #[tokio::test]
    async fn publish_and_dequeue() -> Result<(), Box<dyn std::error::Error>> {
        let mut memorix = crate::get_memorix().await?;

        let v: Vec<BoxPinFuture<()>> = vec![
            Box::pin(async {
                memorix.task.runAlgo.dequeue().await?.next().await;
                Ok(())
            }),
            Box::pin(async {
                tokio::time::sleep(tokio::time::Duration::from_millis(1_000)).await;
                memorix
                    .pubsub
                    .message
                    .publish(&"payload".to_string())
                    .await?;
                Ok(())
            }),
            Box::pin(async {
                tokio::time::sleep(tokio::time::Duration::from_millis(2_000)).await;
                panic!("Timeout");
            }),
        ];

        let (result, _, _) = select_all(v).await;
        result?;
        Ok(())
    }
    // #[tokio::test]
    // #[ntest::timeout(2_000)]
    // async fn task_returns() -> Result<(), Box<dyn std::error::Error + Send>> {
    //     let mut memorix = crate::get_memorix().await.unwrap();
    //     let futures_v: Vec<
    //         std::pin::Pin<
    //             Box<dyn std::future::Future<Output = Result<(), Box<dyn std::error::Error>>>>,
    //         >,
    //     > = vec![
    //         Box::pin(crate::dequeue_and_return(memorix.clone())),
    //         Box::pin(async move {
    //             let mut res = memorix.task.runAlgo.queue(&"123".to_string()).await?;
    //             let returns = res.get_returns().await?;
    //             assert_eq!(returns, crate::example_schema_generated::Animal::dog);
    //             Ok(())
    //         }),
    //     ];

    //     futures::future::select_all(futures_v).await.0.unwrap();
    //     Ok(())
    // }
}
