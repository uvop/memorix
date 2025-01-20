// extern crate memorix_client_redis;
mod example_schema_generated;

use example_schema_generated as mx;

// use memorix_client_redis::StreamExt;

async fn get_memorix() -> Result<mx::Memorix, Box<dyn std::error::Error + Sync + Send>> {
    let memorix = mx::Memorix::new().await?;
    Ok(memorix)
}

// async fn dequeue_and_return(
//     mut memorix: mx::Memorix,
// ) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
//     let mut stream = memorix.task.runAlgo.dequeue().await.unwrap();
//     let res = match stream.next().await {
//         Some(x) => x.unwrap(),
//         _ => panic!("Should not happen"),
//     };
//     println!("Res is {}", res);
//     Ok(())
// }
mod tests {
    use crate::example_schema_generated as mx;
    use futures_util::{future::select_all, StreamExt};
    type BoxPinFuture<'a, 'b, T> = std::pin::Pin<
        Box<
            dyn std::future::Future<
                    Output = Result<T, Box<dyn std::error::Error + Send + Sync + 'b>>,
                > + 'a,
        >,
    >;

    #[tokio::test]
    async fn set_get() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
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
    async fn set_get_expire() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
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
    async fn publish_and_dequeue() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
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

    #[tokio::test]
    async fn while_dequeue_try_something() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        tokio::time::timeout(std::time::Duration::from_millis(200), async {
            let mut memorix = crate::get_memorix().await?;

            memorix.task.runAlgo2.enqueue(&"123".to_string()).await?;
            let v: Vec<BoxPinFuture<()>> = vec![
                Box::pin(async {
                    let mut stream = memorix.task.runAlgo.dequeue().await?;
                    loop {
                        stream.next().await;
                    }
                    #[allow(unreachable_code)]
                    Ok(())
                }),
                Box::pin(async {
                    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                    memorix.task.runAlgo2.dequeue().await?.next().await;
                    Ok(())
                }),
            ];

            select_all(v).await.0?;
            Ok(())
        })
        .await?
    }

    #[tokio::test]
    async fn inline_options() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        let mut memorix = crate::get_memorix().await?;
        memorix
            .cache
            .userExpire
            .set(
                &"uv".to_owned(),
                &mx::User {
                    age: Some(11),
                    name: "uv".to_string(),
                },
            )
            .await?;
        tokio::time::sleep(tokio::time::Duration::from_millis(1_500)).await;
        let user = memorix.cache.userExpire.get(&"uv".to_owned()).await?;

        assert_eq!(user, None);
        Ok(())
    }
    #[tokio::test]
    async fn optional_payload() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        let mut memorix = crate::get_memorix().await?;
        memorix.cache.optionalPayload.set(&None).await?;
        let optional_payload = memorix.cache.optionalPayload.get().await?;

        assert_eq!(optional_payload, Some(None));
        Ok(())
    }
}
