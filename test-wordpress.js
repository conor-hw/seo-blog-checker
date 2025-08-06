import 'dotenv/config';
import WordPressClient from './src/wordpress-client.js';
import ConfigLoader from './src/config-loader.js';

async function testWordPressIntegration() {
  try {
    console.log('🧪 Testing WordPress API Integration...\n');

    // Test configuration loading
    console.log('1. Testing configuration loading...');
    const configLoader = new ConfigLoader();
    const extractionConfig = await configLoader.loadExtractionConfig('default');
    console.log('✅ Extraction config loaded:', Object.keys(extractionConfig).filter(k => extractionConfig[k]).length, 'fields enabled');

    // Test WordPress connection
    console.log('\n2. Testing WordPress connection...');
    const wordpressClient = new WordPressClient();
    const siteInfo = await wordpressClient.getSiteInfo();
    console.log('✅ WordPress site connected:', siteInfo.name);

    // Test post retrieval with real Hostelworld blog post
    console.log('\n3. Testing post retrieval...');
    const testSlug = 'best-traditional-canadian-food'; // Real Hostelworld blog post
    console.log(`Attempting to fetch post with slug: ${testSlug}`);
    
    const post = await wordpressClient.getPost({ type: 'slug', value: testSlug });
    console.log('✅ Post retrieved successfully!');
    console.log('   Title:', post.title.substring(0, 50) + '...');
    console.log('   Content length:', post.content.length, 'characters');
    console.log('   Categories:', post.categories.length);
    console.log('   Tags:', post.tags.length);
    console.log('   Date:', post.date);
    console.log('   Modified:', post.modified);

    // Test content extraction based on our config
    console.log('\n4. Testing content extraction...');
    const extractedFields = {};
    for (const [field, enabled] of Object.entries(extractionConfig)) {
      if (enabled && post[field] !== undefined) {
        extractedFields[field] = post[field];
        console.log(`   ✅ ${field}: ${typeof post[field] === 'string' ? post[field].substring(0, 50) + '...' : post[field]}`);
      }
    }

    console.log('\n🎉 All tests passed! WordPress integration is working correctly.');
    console.log(` Extracted ${Object.keys(extractedFields).length} fields from the post`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testWordPressIntegration(); 