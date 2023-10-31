mod example_schema_generated;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut list = vec![1, 2];
    list.push(1);
    list.push(1);
    let redis_url = std::env::var("REDIS_URL").expect("missing environment variable REDIS_URL");
    let mut memorix = example_schema_generated::Memorix::new(&redis_url).await;
    memorix
        .cache
        .favorite_animal
        .set(&example_schema_generated::Animal::cat)
        .await?;
    let fav = memorix.cache.favorite_animal.get().await?;
    println!("Your fav is {:?}", fav);
    Ok(())
}
