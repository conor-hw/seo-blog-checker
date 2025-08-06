require('dotenv').config();
const WordPressClient = require('./src/wordpress-client');
const ConfigLoader = require('./src/config-loader');
const ContentExtractor = require('./src/content-extractor');
const GeminiClient = require('./src/gemini-client');

async function testIntegration() {
  try {
    console.log('🧪 Testing Full Integration...\n');

    // 1. Load configurations
    console.log('1. Loading configurations...');
    const configLoader = new ConfigLoader();
    const extractionConfig = await configLoader.loadExtractionConfig('default');
    const evaluationConfig = await configLoader.loadEvaluationConfig('default');
    console.log('✅ Configurations loaded');

    // 2. Initialize clients
    console.log('\n2. Initializing clients...');
    const wordpressClient = new WordPressClient();
    const geminiClient = new GeminiClient();
    const contentExtractor = new ContentExtractor(extractionConfig);
    console.log('✅ Clients initialized');

    // 3. Test Gemini connection
    console.log('\n3. Testing Gemini AI connection...');
    const geminiConnected = await geminiClient.testConnection();
    console.log('✅ Gemini AI connected:', geminiConnected);

    // 4. Fetch WordPress post
    console.log('\n4. Fetching WordPress post...');
    const testSlug = 'best-traditional-canadian-food';
    const post = await wordpressClient.getPost({ type: 'slug', value: testSlug });
    console.log('✅ Post fetched:', post.title.substring(0, 50) + '...');

    // 5. Extract content
    console.log('\n5. Extracting content...');
    const extractedContent = contentExtractor.extract(post);
    console.log('✅ Content extracted:');
    console.log('   - Title length:', extractedContent.title?.length || 0);
    console.log('   - Content length:', extractedContent.content?.length || 0);
    console.log('   - Meta description:', extractedContent.meta_description?.substring(0, 50) + '...');
    console.log('   - Keywords:', extractedContent.keywords?.length || 0);

    // 6. Evaluate with Gemini AI
    console.log('\n6. Evaluating with Gemini AI...');
    const evaluation = await geminiClient.evaluate(extractedContent, evaluationConfig);
    console.log('✅ Evaluation complete:');
    console.log('   - Overall score:', evaluation.overall_score);
    console.log('   - Summary:', evaluation.summary?.substring(0, 100) + '...');
    console.log('   - Recommendations:', evaluation.recommendations?.length || 0);

    console.log('\n🎉 Full integration test passed!');
    console.log('\n�� Evaluation Results:');
    console.log(JSON.stringify(evaluation, null, 2));

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the integration test
testIntegration(); 