#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');

// Import our modules (we'll create these next)
const WordPressClient = require('./wordpress-client');
const GeminiClient = require('./gemini-client');
const ContentExtractor = require('./content-extractor');
const ReportGenerator = require('./report-generator');
const ConfigLoader = require('./config-loader');

const program = new Command();

program
  .name('seo-blog-checker')
  .description('Evaluate SEO quality of WordPress blog posts using Gemini AI')
  .version('1.0.0');

program
  .command('evaluate')
  .description('Evaluate SEO quality of blog posts')
  .option('-s, --slug <slug>', 'WordPress post slug')
  .option('-i, --id <id>', 'WordPress post ID')
  .option('--slugs <slugs>', 'Comma-separated list of slugs')
  .option('--ids <ids>', 'Comma-separated list of IDs')
  .option('-c, --config <config>', 'Configuration name (default: default)')
  .option('-e, --extraction-config <config>', 'Extraction configuration file')
  .option('-v, --evaluation-config <config>', 'Evaluation configuration file')
  .action(async (options) => {
    const spinner = ora('Initializing SEO evaluation...').start();
    
    try {
      // Load configurations
      const configLoader = new ConfigLoader();
      const extractionConfig = await configLoader.loadExtractionConfig(options.extractionConfig || 'default');
      const evaluationConfig = await configLoader.loadEvaluationConfig(options.evaluationConfig || 'default');
      
      spinner.text = 'Loading configurations...';
      
      // Initialize clients
      const wordpressClient = new WordPressClient();
      const geminiClient = new GeminiClient();
      const contentExtractor = new ContentExtractor(extractionConfig);
      const reportGenerator = new ReportGenerator(evaluationConfig);
      
      spinner.text = 'Processing blog posts...';
      
      // Get post identifiers
      let postIdentifiers = [];
      if (options.slug) postIdentifiers.push({ type: 'slug', value: options.slug });
      if (options.id) postIdentifiers.push({ type: 'id', value: options.id });
      if (options.slugs) {
        postIdentifiers.push(...options.slugs.split(',').map(slug => ({ type: 'slug', value: slug.trim() })));
      }
      if (options.ids) {
        postIdentifiers.push(...options.ids.split(',').map(id => ({ type: 'id', value: id.trim() })));
      }
      
      if (postIdentifiers.length === 0) {
        spinner.fail('No posts specified. Use --slug, --id, --slugs, or --ids');
        process.exit(1);
      }
      
      // Process each post
      for (const identifier of postIdentifiers) {
        spinner.text = `Processing ${identifier.type}: ${identifier.value}...`;
        
        // Fetch content from WordPress
        const wordpressData = await wordpressClient.getPost(identifier);
        
        // Extract relevant content
        const extractedContent = contentExtractor.extract(wordpressData);
        
        // Evaluate with Gemini AI
        const evaluation = await geminiClient.evaluate(extractedContent, evaluationConfig);
        
        // Generate report
        const report = reportGenerator.generate(evaluation, extractedContent);
        
        // Save report
        await reportGenerator.save(report, identifier.value);
      }
      
      spinner.succeed(`Successfully evaluated ${postIdentifiers.length} post(s)`);
      console.log(chalk.green(`Reports saved to: ${path.resolve('reports')}`));
      
    } catch (error) {
      spinner.fail('Evaluation failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();
