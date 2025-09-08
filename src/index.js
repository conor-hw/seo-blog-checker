#!/usr/bin/env node

// Load environment variables first
import 'dotenv/config';

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

// Import our modules
import WordPressClient from './wordpress-client.js';
import GeminiClient from './gemini-client.js';
import ContentExtractor from './content-extractor.js';
import ReportGenerator from './report-generator.js';
import ConfigLoader from './config-loader.js';
import UniversalScraper from './universal-scraper.js';
import CSVWriter from './utils/csv-writer.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  .option('-f, --file <file>', 'File containing newline-separated list of slugs')
  .option('-c, --config <config>', 'Configuration name (default: default)')
  .option('-e, --extraction-config <config>', 'Extraction configuration file')
  .option('-v, --evaluation-config <config>', 'Evaluation configuration file')
  .option('--batch-size <size>', 'Number of posts to process in parallel (default: 3)', '3')
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
      
      // Initialize CSV writer
      const csvWriter = new CSVWriter(path.join('reports', 'seo_analysis_summary.csv'));
      await csvWriter.initialize();
      
      spinner.text = 'Processing blog posts...';
      
      // Get post identifiers
      let postIdentifiers = [];
      
      if (options.file) {
        // Read slugs from file
        postIdentifiers = await loadSlugsFromFile(options.file);
      } else if (options.slug) {
        postIdentifiers.push({ type: 'slug', value: options.slug });
      } else if (options.id) {
        postIdentifiers.push({ type: 'id', value: options.id });
      } else if (options.slugs) {
        postIdentifiers.push(...options.slugs.split(',').map(slug => ({ type: 'slug', value: slug.trim() })));
      } else if (options.ids) {
        postIdentifiers.push(...options.ids.split(',').map(id => ({ type: 'id', value: id.trim() })));
      } else {
        spinner.fail('No posts specified. Use --slug, --id, --slugs, --ids, or --file');
        process.exit(1);
      }
      
      if (postIdentifiers.length === 0) {
        spinner.fail('No valid post identifiers found');
        process.exit(1);
      }
      
      spinner.succeed(`Found ${postIdentifiers.length} posts to evaluate`);
      
      // Process posts in batches
      const batchSize = parseInt(options.batchSize) || 3;
      const results = [];
      const errors = [];
      
      for (let i = 0; i < postIdentifiers.length; i += batchSize) {
        const batch = postIdentifiers.slice(i, i + batchSize);
        const batchSpinner = ora(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(postIdentifiers.length / batchSize)} (${batch.length} posts)...`).start();
        
        try {
          const batchResults = await Promise.allSettled(
            batch.map(identifier => processSinglePost(identifier, wordpressClient, geminiClient, contentExtractor, reportGenerator, csvWriter))
          );
          
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
            } else {
              const error = {
                identifier: batch[index],
                error: result.reason.message
              };
              errors.push(error);
              console.error(chalk.red(`❌ Failed to process ${batch[index].value}: ${result.reason.message}`));
            }
          });
          
          batchSpinner.succeed(`Batch ${Math.floor(i / batchSize) + 1} completed`);
        } catch (error) {
          batchSpinner.fail(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`);
          throw error;
        }
      }
      
      // Display summary
      console.log('\n EVALUATION SUMMARY');
      console.log('='.repeat(50));
      console.log(`✅ Successfully processed: ${results.length} posts`);
      console.log(`❌ Failed: ${errors.length} posts`);
      console.log(`📁 Reports saved to: ${path.resolve('reports')}`);
      
      if (results.length > 0) {
        console.log('\n Score Summary:');
        const scores = results.map(r => r.overall_score).filter(s => s !== undefined);
        if (scores.length > 0) {
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          const minScore = Math.min(...scores);
          const maxScore = Math.max(...scores);
          console.log(`   Average Score: ${avgScore.toFixed(1)}/100`);
          console.log(`   Range: ${minScore}-${maxScore}/100`);
        }
        
        console.log('\n🏆 Top Performers:');
        const topPerformers = results
          .filter(r => r.overall_score !== undefined)
          .sort((a, b) => b.overall_score - a.overall_score)
          .slice(0, 3);
        
        topPerformers.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.slug}: ${result.overall_score}/100`);
        });
        
        console.log('\n Needs Optimization:');
        const needsOptimization = results
          .filter(r => r.optimization_recommendation === 'Optimize')
          .slice(0, 3);
        
        if (needsOptimization.length > 0) {
          needsOptimization.forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.slug}: ${result.overall_score}/100`);
          });
        } else {
          console.log('   All posts are performing well!');
        }
      }
      
      if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(error => {
          console.log(`   - ${error.identifier.value}: ${error.error}`);
        });
      }
      
    } catch (error) {
      spinner.fail('Evaluation failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Load slugs from a file
 * @param {string} filePath - Path to the file containing slugs
 * @returns {Promise<Array>} Array of slug identifiers
 */
async function loadSlugsFromFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const slugs = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#')); // Skip empty lines and comments
    
    return slugs.map(slug => ({ type: 'slug', value: slug }));
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Process a single blog post
 * @param {Object} identifier - Post identifier
 * @param {WordPressClient} wordpressClient - WordPress client
 * @param {GeminiClient} geminiClient - Gemini client
 * @param {ContentExtractor} contentExtractor - Content extractor
 * @param {ReportGenerator} reportGenerator - Report generator
 * @returns {Promise<Object>} Processing result
 */
async function processSinglePost(identifier, wordpressClient, geminiClient, contentExtractor, reportGenerator, csvWriter) {
  try {
    console.log(`Processing ${identifier.value}...`);
    
    // Fetch content from WordPress
    console.log('Fetching WordPress data...');
    const wordpressData = await wordpressClient.getPost(identifier);
    console.log('WordPress data fetched:', wordpressData.title ? wordpressData.title.substring(0, 50) + '...' : 'No title');
    
    // Extract relevant content
    console.log('Extracting content...');
    console.log('ContentExtractor methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(contentExtractor)));
    console.log('Extract method exists:', typeof contentExtractor.extract);
    
    const extractedContent = contentExtractor.extract(wordpressData);
    console.log('Content extracted:', extractedContent.title ? extractedContent.title.substring(0, 50) + '...' : 'No title');
    
    // Evaluate with AI
    console.log('Evaluating with AI...');
    const evaluation = await geminiClient.evaluate(extractedContent, reportGenerator.config);
    console.log('AI evaluation complete, score:', evaluation.overall_score);
    
    // Generate report
    console.log('Generating report...');
    const report = reportGenerator.generate(evaluation, extractedContent);
    
    // Save report
    console.log('Saving report...');
    await reportGenerator.save(report, identifier.value);
    
    // Extract top strengths and critical issues
    const topStrengths = Object.entries(evaluation)
      .filter(([key, data]) => key.endsWith('_score') && typeof data === 'object' && data.score >= 70)
      .map(([_, data]) => data.strengths?.[0])
      .filter(Boolean)
      .slice(0, 3);

    const criticalIssues = Object.entries(evaluation)
      .filter(([key, data]) => key.endsWith('_score') && typeof data === 'object' && data.score < 70)
      .map(([_, data]) => data.recommendations?.[0])
      .filter(Boolean)
      .slice(0, 3);

    // Prepare result object
    const result = {
      slug: identifier.value,
      url: extractedContent.url,
      title: extractedContent.title,
      overall_score: evaluation.overall_score,
      top_strengths: topStrengths,
      critical_issues: criticalIssues,
      word_count: extractedContent.word_count,
      last_updated: extractedContent.last_modified,
      report_path: `reports/${identifier.value}/seo-analysis-report.md`
    };

    // Write to CSV
    if (csvWriter) {
      console.log('Writing to CSV summary...');
      await csvWriter.appendResult(result);
    }
    
    return result;
  } catch (error) {
    console.error('Error in processSinglePost:', error);
    throw new Error(`Failed to process ${identifier.value}: ${error.message}`);
  }
}

// Add new command for universal URL processing
program
  .command('scrape')
  .description('Evaluate any blog post URL')
  .option('-u, --url <url>', 'Single URL to evaluate')
  .option('-f, --file <file>', 'File containing URLs (one per line)')
  .option('-e, --extraction-config <name>', 'Extraction configuration to use', 'default')
  .option('-v, --evaluation-config <name>', 'Evaluation configuration to use', 'default')
  .action(async (options) => {
    try {
      const urls = await getUrlsFromInput(options);
      await processUrls(urls, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

async function getUrlsFromInput(options) {
  if (options.url) {
    return [options.url];
  } else if (options.file) {
    const fileContent = await fs.readFile(options.file, 'utf8');
    return fileContent.split('\n')
      .map(url => url.trim())
      .filter(url => url && url.startsWith('http'));
  } else {
    throw new Error('Please provide either --url or --file option');
  }
}

async function processUrls(urls, options) {
  console.log(chalk.blue(`🔍 Processing ${urls.length} URL(s)...\n`));
  
  const scraper = new UniversalScraper();
  const configLoader = new ConfigLoader();
  const geminiClient = new GeminiClient();
  
  // Load configurations
  const extractionConfig = await configLoader.loadExtractionConfig(options.extractionConfig);
  const evaluationConfig = await configLoader.loadEvaluationConfig(options.evaluationConfig);
  
  const contentExtractor = new ContentExtractor(extractionConfig);
  const reportGenerator = new ReportGenerator(evaluationConfig);
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const spinner = ora(`Processing URL ${i + 1}/${urls.length}: ${url}`).start();
    
    try {
      // Scrape the URL
      spinner.text = `Scraping content from ${url}...`;
      const scrapedData = await scraper.scrapeUrl(url);
      
      // Extract relevant content
      spinner.text = 'Extracting content...';
      const extractedContent = contentExtractor.extract(scrapedData);
      
      // Evaluate with AI
      spinner.text = 'Evaluating with Gemini AI...';
      const evaluation = await geminiClient.evaluate(extractedContent, evaluationConfig);
      
      // Generate and save report
      spinner.text = 'Generating report...';
      const report = reportGenerator.generate(evaluation, extractedContent);
      const reportPath = await reportGenerator.save(report, extractedContent.slug);
      
      spinner.succeed(`✅ Report saved: ${reportPath}`);
      
      // Add delay between requests to be respectful
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      spinner.fail(`❌ Failed to process ${url}: ${error.message}`);
    }
  }
  
  console.log(chalk.green('\n🎉 All URLs processed!'));
}

program.parse();
