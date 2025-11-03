#!/usr/bin/env node

import 'dotenv/config';
import WordPressClient from './src/wordpress-client.js';
import ContentExtractor from './src/content-extractor.js';
import ConfigLoader from './src/config-loader.js';

async function debugExtraction() {
  try {
    console.log('=== DEBUG EXTRACTION PROCESS ===\n');
    
    // 1. Load configuration
    const configLoader = new ConfigLoader();
    const extractionConfig = await configLoader.loadExtractionConfig('default');
    console.log('✅ Extraction config loaded');
    
    // 2. Fetch WordPress data
    const wordpressClient = new WordPressClient();
    console.log('📡 Fetching WordPress data...');
    const wordpressData = await wordpressClient.getPost({ type: 'slug', value: 'how-to-save-money-on-a-trip-to-chapada-dos-veadeiros' });
    
    console.log('\n📊 WordPress Data Analysis:');
    console.log('- Data keys:', Object.keys(wordpressData));
    console.log('- Has yoast_head_json:', !!wordpressData.yoast_head_json);
    console.log('- Has meta:', !!wordpressData.meta);
    console.log('- Content structure:', typeof wordpressData.content, wordpressData.content ? Object.keys(wordpressData.content) : 'no content');
    console.log('- content.rendered exists:', !!(wordpressData.content && wordpressData.content.rendered));
    console.log('- content.text exists:', !!(wordpressData.content && wordpressData.content.text));
    console.log('- Yoast keys:', wordpressData.yoast_head_json ? Object.keys(wordpressData.yoast_head_json).slice(0, 10) : 'none');
    
    // 3. Extract content
    console.log('\n🔍 Extracting content...');
    const contentExtractor = new ContentExtractor(extractionConfig);
    const extractedContent = contentExtractor.extract(wordpressData);
    
    console.log('\n📋 Extracted Content Analysis:');
    console.log('- Total fields:', Object.keys(extractedContent).length);
    console.log('- yoast_seo_title:', extractedContent.yoast_seo_title || 'MISSING');
    console.log('- yoast_canonical:', extractedContent.yoast_canonical || 'MISSING');
    console.log('- meta_description:', extractedContent.meta_description || 'MISSING');
    console.log('- og_title:', extractedContent.og_title || 'MISSING');
    console.log('- og_description:', extractedContent.og_description || 'MISSING');
    
    // 4. Check if issue is in applyConfigFilter
    console.log('\n🔧 Testing config filter...');
    const rawExtraction = contentExtractor.extractWordPressContent(wordpressData);
    console.log('- Raw yoast_seo_title:', rawExtraction.yoast_seo_title || 'MISSING');
    console.log('- Raw og_title:', rawExtraction.og_title || 'MISSING');
    
    const filteredExtraction = contentExtractor.applyConfigFilter(rawExtraction);
    console.log('- Filtered yoast_seo_title:', filteredExtraction.yoast_seo_title || 'MISSING');
    console.log('- Filtered og_title:', filteredExtraction.og_title || 'MISSING');
    
    console.log('\n✅ Debug completed');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugExtraction();
