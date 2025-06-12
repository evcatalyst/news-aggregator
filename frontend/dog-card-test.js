// dog-card-test.js
// Run this script with Node.js to test the card creation logic for dog queries

// Mock news data with dog article
const mockDogData = {
  response: "Here are some articles about dogs",
  newsResults: [
    {
      title: "Dog News Article",
      source: { name: "Pet Source" },
      description: "Article about dogs",
      publishedAt: new Date().toISOString(),
      url: "https://pets.com/dogs"
    }
  ]
};

// Function to simulate our handleCreateCard logic
function handleCreateCard(card) {
  console.log('handleCreateCard called with:', JSON.stringify(card, null, 2));
  
  // Basic validation
  if (!card?.articles?.length) {
    console.log('Card validation failed: No articles found');
    return false;
  }

  console.log(`Card has ${card.articles.length} articles`);
  console.log('Created card successfully');
  return true;
}

// Function to simulate ChatSidebar handleSend logic
function testChatSidebarLogic() {
  const input = "Show me news about dogs";
  const { response: explanation, newsResults } = mockDogData;
  
  console.log(`Processing query: "${input}"`);
  console.log(`Found ${newsResults.length} results:`, newsResults.map(a => a.title).join(', '));
  
  if (newsResults?.length > 0) {
    // Format articles
    const formattedArticles = newsResults
      .filter(article => article && typeof article === 'object')
      .map(article => ({
        title: article.title || 'Untitled Article',
        url: article.url || '#',
        source: article.source?.name || 'News',
        date: article.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        summary: article.description || ''
      }))
      .filter(a => a.title && a.url);
    
    console.log('Formatted articles:', formattedArticles);
    
    // Create card
    const card = {
      id: Date.now().toString(),
      title: input.slice(0, 50),
      category: input.toLowerCase().includes('dog') ? 'Pets' : 'Other',
      timestamp: new Date().toISOString(),
      articles: formattedArticles
    };
    
    // Try to create the card
    const success = handleCreateCard(card);
    console.log('Card creation result:', success);
    
    return success;
  }
  
  return false;
}

// Run the test
console.log("=== DOG CARD CREATION TEST ===");
const result = testChatSidebarLogic();
console.log("=== TEST RESULT:", result ? "SUCCESS" : "FAILURE", "===");
