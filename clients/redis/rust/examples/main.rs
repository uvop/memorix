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
        .favoriteAnimal
        .set("123".to_string(), example_schema_generated::Animal::cat)
        .await?;
    let fav = memorix.cache.favoriteAnimal.get("123".to_string()).await?;
    println!("Your fav is {:?}", fav);
    Ok(())
}
