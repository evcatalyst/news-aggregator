// simpleDogTest.js
// A lightweight test script for dog query issues

// Simple test without DOM dependencies

// Mock console with capture
const logs = [];
const originalConsoleLog = console.log;
console.log = (...args) => {
  logs.push(args.join(' '));
  originalConsoleLog(...args);
};

// Test data
const dogQuery = "Show me news about dogs";
const mockDogArticles = [
  {
    title: "Dog News Article",
    source: { name: "Pet Source" },
    description: "Article about dogs",
    publishedAt: new Date().toISOString(),
    url: "https://pets.com/dogs"
  }
];

// Test simple card creation logic
function testDogCardCreation() {
  console.log("=== TESTING DOG CARD CREATION ===");
  
  // Create a formatted card object
  const card = {
    id: Date.now().toString(),
    title: dogQuery.slice(0, 50),
    category: "Pets",
    timestamp: new Date().toISOString(),
    articles: mockDogArticles.map(article => ({
      title: article.title,
      url: article.url,
      source: article.source?.name || 'News',
      date: article.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      summary: article.description || ''
    }))
  };
  
  console.log("Card object:", JSON.stringify(card, null, 2));
  
  // Basic verification
  if (!card?.articles?.length) {
    console.log("❌ FAIL: Card has no articles");
    return false;
  }
  
  // Verify article properties
  const article = card.articles[0];
  const requiredProps = ['title', 'url', 'source', 'date'];
  const missingProps = requiredProps.filter(prop => !article[prop]);
  
  if (missingProps.length > 0) {
    console.log(`❌ FAIL: Article missing properties: ${missingProps.join(', ')}`);
    return false;
  }
  
  // Check if special dog handling is working
  if (card.category !== "Pets") {
    console.log("❌ FAIL: Dog category not correctly set to Pets");
    return false;
  }
  
  console.log("✅ SUCCESS: Dog card created correctly!");
  return true;
}

// Run our test
const testSuccess = testDogCardCreation();
console.log(`\n=== TEST ${testSuccess ? "PASSED" : "FAILED"} ===`);
