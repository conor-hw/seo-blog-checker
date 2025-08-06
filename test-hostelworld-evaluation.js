require('dotenv').config();
const WordPressClient = require('./src/wordpress-client');
const ConfigLoader = require('./src/config-loader');
const ContentExtractor = require('./src/content-extractor');
const GeminiClient = require('./src/gemini-client');

async function testHostelworldEvaluation() {
  try {
    console.log('🏨 Testing Hostelworld Evaluation...\n');

    // Load Hostelworld-specific configuration
    console.log('1. Loading Hostelworld evaluation config...');
    const configLoader = new ConfigLoader();
    const extractionConfig = await configLoader.loadExtractionConfig('default');
    const evaluationConfig = await configLoader.loadEvaluationConfig('hostelworld');
    console.log('✅ Hostelworld config loaded');

    // Initialize components
    console.log('\n2. Initializing components...');
    const wordpressClient = new WordPressClient();
    const geminiClient = new GeminiClient();
    const contentExtractor = new ContentExtractor(extractionConfig);
    console.log('✅ Components initialized');

    // Fetch and process content
    console.log('\n3. Fetching blog post...');
    const testSlug = 'best-traditional-canadian-food';
    const post = await wordpressClient.getPost({ type: 'slug', value: testSlug });
    console.log('✅ Post fetched:', post.title.substring(0, 50) + '...');

    console.log('\n4. Extracting content...');
    const extractedContent = contentExtractor.extract(post);
    console.log('✅ Content extracted');

    // Evaluate with Hostelworld criteria
    console.log('\n5. Evaluating with Hostelworld criteria...');
    const evaluation = await geminiClient.evaluate(extractedContent, evaluationConfig);
    console.log('✅ Evaluation complete');

    // Display results
    console.log('\n📊 HOSTELWORLD EVALUATION RESULTS');
    console.log('='.repeat(50));
    
    console.log(`\n�� Overall Score: ${evaluation.overall_score}/100`);
    console.log(`📋 Optimization Recommendation: ${evaluation.optimization_recommendation}`);
    
    console.log('\n�� Individual Scores:');
    console.log(`   EEAT Score: ${evaluation.eeat_score.score}/100 (20% weight)`);
    console.log(`   Technical Score: ${evaluation.technical_score.score}/100 (10% weight)`);
    console.log(`   Relevance Score: ${evaluation.relevance_score.score}/100 (20% weight)`);
    console.log(`   Text Quality Score: ${evaluation.text_quality_score.score}/100 (10% weight)`);
    console.log(`   AI Optimization Score: ${evaluation.ai_optimization_score.score}/100 (25% weight)`);
    console.log(`   Freshness Score: ${evaluation.freshness_score.score}/100 (15% weight)`);

    console.log('\n📝 Summary:');
    console.log(evaluation.summary);

    console.log('\n🎯 Priority Recommendations:');
    evaluation.priority_recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    // Show detailed analysis for one category
    console.log('\n🔍 Detailed Analysis (EEAT Score):');
    console.log(`Score: ${evaluation.eeat_score.score}/100`);
    console.log(`Analysis: ${evaluation.eeat_score.analysis}`);
    
    if (evaluation.eeat_score.strengths && evaluation.eeat_score.strengths.length > 0) {
      console.log('\n✅ Strengths:');
      evaluation.eeat_score.strengths.forEach(strength => console.log(`   - ${strength}`));
    }
    
    if (evaluation.eeat_score.weaknesses && evaluation.eeat_score.weaknesses.length > 0) {
      console.log('\n❌ Weaknesses:');
      evaluation.eeat_score.weaknesses.forEach(weakness => console.log(`   - ${weakness}`));
    }
    
    if (evaluation.eeat_score.recommendations && evaluation.eeat_score.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      evaluation.eeat_score.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }

    console.log('\n🎉 Hostelworld evaluation test completed successfully!');

  } catch (error) {
    console.error('\n❌ Hostelworld evaluation test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testHostelworldEvaluation(); 