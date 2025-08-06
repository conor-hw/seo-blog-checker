require('dotenv').config();
const WordPressClient = require('./src/wordpress-client');
const ConfigLoader = require('./src/config-loader');
const ContentExtractor = require('./src/content-extractor');
const GeminiClient = require('./src/gemini-client');
const ReportGenerator = require('./src/report-generator');

async function testReportGeneration() {
  try {
    console.log('📄 Testing Report Generation...\n');

    // Load configurations
    const configLoader = new ConfigLoader();
    const extractionConfig = await configLoader.loadExtractionConfig('default');
    const evaluationConfig = await configLoader.loadEvaluationConfig('default');

    // Initialize components
    const wordpressClient = new WordPressClient();
    const geminiClient = new GeminiClient();
    const contentExtractor = new ContentExtractor(extractionConfig);
    const reportGenerator = new ReportGenerator(evaluationConfig);

    // Fetch and process content
    const testSlug = 'best-traditional-canadian-food';
    const post = await wordpressClient.getPost({ type: 'slug', value: testSlug });
    const extractedContent = contentExtractor.extract(post);
    const evaluation = await geminiClient.evaluate(extractedContent, evaluationConfig);

    // Generate reports
    console.log('Generating reports...');
    
    // Technical report
    const technicalReport = reportGenerator.generate(evaluation, extractedContent);
    await reportGenerator.save(technicalReport, testSlug);
    
    // Executive report
    const executiveReport = reportGenerator.generateFormattedReport(evaluation, extractedContent, 'executive');
    const executivePath = `reports/${testSlug}/executive-summary.md`;
    await fs.writeFile(executivePath, executiveReport, 'utf8');
    
    // Content creator report
    const creatorReport = reportGenerator.generateFormattedReport(evaluation, extractedContent, 'content-creator');
    const creatorPath = `reports/${testSlug}/content-creator-guide.md`;
    await fs.writeFile(creatorPath, creatorReport, 'utf8');

    console.log('✅ Reports generated successfully!');
    console.log('�� Files created:');
    console.log(`   - reports/${testSlug}/seo-analysis-report.md`);
    console.log(`   - reports/${testSlug}/executive-summary.md`);
    console.log(`   - reports/${testSlug}/content-creator-guide.md`);
    console.log(`   - reports/${testSlug}/metadata.json`);
    console.log(`   - reports/${testSlug}/raw-evaluation.json`);

    // Show a preview of the technical report
    console.log('\n📋 Technical Report Preview:');
    console.log('='.repeat(50));
    console.log(technicalReport.content.substring(0, 500) + '...');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Report generation test failed:', error.message);
    process.exit(1);
  }
}

// Import fs for file operations
const fs = require('fs').promises;

// Run the test
testReportGeneration();