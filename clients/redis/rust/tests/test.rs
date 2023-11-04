extern crate memorix_redis;
mod example_schema_generated;

#[cfg(test)]

async fn get_memorix<'a>(
) -> Result<example_schema_generated::Memorix<'a>, Box<dyn std::error::Error>> {
    let redis_url = std::env::var("REDIS_URL").expect("missing environment variable REDIS_URL");
    let memorix = example_schema_generated::Memorix::new(&redis_url).await?;
    Ok(memorix)
}
mod tests {
    #[tokio::test]
    async fn set_get() -> Result<(), Box<dyn std::error::Error>> {
        let mut memorix = crate::get_memorix().await?;
        memorix
            .cache
            .favoriteAnimal
            .set(
                "123".to_string(),
                crate::example_schema_generated::Animal::dog,
            )
            .await?;
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
        let favorite_animal = memorix.cache.favoriteAnimal.get("123".to_string()).await?;
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
                "123".to_string(),
                crate::example_schema_generated::Animal::dog,
            )
            .await?;
        tokio::time::sleep(tokio::time::Duration::from_millis(2500)).await;
        let favorite_animal = memorix.cache.favoriteAnimal.get("123".to_string()).await?;
        assert_eq!(favorite_animal, None);
        Ok(())
    }
}
