import axios from 'axios';
import * as cheerio from 'cheerio';

class ContentExtractor {
  constructor(extractionConfig) {
    this.config = extractionConfig;
  }

  /**
   * Extract content from data (WordPress or Universal format)
   * @param {Object} data - Post data
   * @returns {Object} Extracted content object
   */
  extract(data) {
    // Detect data format
    const isWordPressData = data.content && data.content.rendered;
    const isUniversalData = data.content && data.content.text;
    
    if (isWordPressData) {
      return this.extractWordPressContent(data);
    } else if (isUniversalData) {
      return this.extractUniversalContent(data);
    } else {
      // Fallback for other formats
      return this.extractGenericContent(data);
    }
  }

  /**
   * Extract content from WordPress API format
   */
  extractWordPressContent(wordpressData) {
    const extractedContent = {
      post_id: wordpressData.id,
      slug: wordpressData.slug,
      url: wordpressData.link,
      title: wordpressData.title?.rendered || wordpressData.title || '',
      content: this.stripHtml(wordpressData.content?.rendered || wordpressData.content || ''),
      content_html: wordpressData.content?.rendered || wordpressData.content || '',
      excerpt: this.stripHtml(wordpressData.excerpt?.rendered || wordpressData.excerpt || ''),
      meta_description: wordpressData.meta?._yoast_wpseo_metadesc || '',
      keywords: wordpressData.meta?._yoast_wpseo_focuskw ? [wordpressData.meta._yoast_wpseo_focuskw] : [],
      headers: this.extractHeadings(wordpressData.content?.rendered || ''),
      word_count: this.getWordCount(wordpressData.content?.rendered || ''),
      
      // Enhanced WordPress/Yoast SEO data
      yoast_seo_score: wordpressData.meta?._yoast_wpseo_linkdex || '',
      yoast_readability_score: wordpressData.meta?._yoast_wpseo_content_score || '',
      yoast_focus_keyword: wordpressData.meta?._yoast_wpseo_focuskw || '',
      yoast_seo_title: wordpressData.meta?._yoast_wpseo_title || '',
      yoast_canonical: wordpressData.meta?._yoast_wpseo_canonical || '',
      yoast_noindex: wordpressData.meta?._yoast_wpseo_meta_robots_noindex || '',
      yoast_nofollow: wordpressData.meta?._yoast_wpseo_meta_robots_nofollow || '',
      primary_category: wordpressData.meta?._yoast_wpseo_primary_category || '',
      
      // WordPress post metadata
      post_status: wordpressData.status || '',
      post_type: wordpressData.type || '',
      date_published: wordpressData.date || '',
      date_modified: wordpressData.modified || '',
      author_id: wordpressData.author || '',
      featured_media_id: wordpressData.featured_media || '',
      categories: wordpressData.categories || [],
      tags: wordpressData.tags || [],
      
      // Calculate estimated reading time
      estimated_reading_time: this.calculateReadingTime(wordpressData.content?.rendered || ''),
      
      // Extract additional meta if available
      canonical_url: wordpressData.meta?._yoast_wpseo_canonical || wordpressData.link || '',
      robots: this.buildRobotsDirective(wordpressData.meta),
      
      // Social media metadata from Yoast
      og_title: wordpressData.meta?._yoast_wpseo_opengraph_title || '',
      og_description: wordpressData.meta?._yoast_wpseo_opengraph_description || '',
      og_image: wordpressData.meta?._yoast_wpseo_opengraph_image || '',
      twitter_title: wordpressData.meta?._yoast_wpseo_twitter_title || '',
      twitter_description: wordpressData.meta?._yoast_wpseo_twitter_description || '',
      twitter_image: wordpressData.meta?._yoast_wpseo_twitter_image || ''
    };

    return this.applyConfigFilter(extractedContent);
  }

  /**
   * Extract content from Universal scraper format
   */
  extractUniversalContent(scrapedData) {
    const extractedContent = {
      post_id: scrapedData.id,
      slug: scrapedData.slug,
      url: scrapedData.link,
      title: scrapedData.title || '',
      content: scrapedData.content?.text || '',
      content_html: scrapedData.content?.rendered || '',
      excerpt: scrapedData.excerpt?.text || '',
      meta_description: scrapedData.meta?.description || '',
      keywords: scrapedData.meta?.keywords ? scrapedData.meta.keywords.split(',').map(k => k.trim()) : [],
      headers: scrapedData.headers || [],
      images: scrapedData.images || [],
      schema: scrapedData.schema || [],
      links: scrapedData.links || [],
      word_count: this.getWordCount(scrapedData.content?.text || ''),
      
      // Technical SEO metadata
      canonical_url: scrapedData.meta?.canonical_url || '',
      robots: scrapedData.meta?.robots || '',
      viewport: scrapedData.meta?.viewport || '',
      language: scrapedData.meta?.language || '',
      
      // Open Graph metadata
      og_title: scrapedData.meta?.og_title || '',
      og_description: scrapedData.meta?.og_description || '',
      og_image: scrapedData.meta?.og_image || '',
      og_type: scrapedData.meta?.og_type || '',
      og_url: scrapedData.meta?.og_url || '',
      og_site_name: scrapedData.meta?.og_site_name || '',
      
      // Article-specific Open Graph
      article_author: scrapedData.meta?.article_author || '',
      article_published_time: scrapedData.meta?.article_published_time || '',
      article_modified_time: scrapedData.meta?.article_modified_time || '',
      article_section: scrapedData.meta?.article_section || '',
      article_tag: scrapedData.meta?.article_tag || '',
      
      // Twitter metadata
      twitter_title: scrapedData.meta?.twitter_title || '',
      twitter_description: scrapedData.meta?.twitter_description || '',
      twitter_card: scrapedData.meta?.twitter_card || '',
      twitter_site: scrapedData.meta?.twitter_site || '',
      twitter_creator: scrapedData.meta?.twitter_creator || '',
      twitter_image: scrapedData.meta?.twitter_image || '',
      
      // Schema analysis (if available)
      schema_analysis: scrapedData.schema?.analysis || null,
      
      // Keep raw schemas for backward compatibility
      raw_schemas: scrapedData.schema?.raw_schemas || scrapedData.schema || []
    };

    return this.applyConfigFilter(extractedContent);
  }

  /**
   * Extract content from generic format (fallback)
   */
  extractGenericContent(data) {
    const extractedContent = {
      post_id: data.id || 'unknown',
      slug: data.slug || 'unknown',
      url: data.link || data.url || '',
      title: data.title || '',
      content: typeof data.content === 'string' ? data.content : (data.content?.text || ''),
      content_html: data.content?.rendered || '',
      excerpt: data.excerpt || '',
      meta_description: data.meta_description || '',
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      headers: data.headers || [],
      word_count: this.getWordCount(data.content || '')
    };

    return this.applyConfigFilter(extractedContent);
  }

  /**
   * Apply configuration filter to extracted content
   */
  applyConfigFilter(extractedContent) {
    if (!this.config) return extractedContent;

    const filteredContent = {};
    
    // Helper function to flatten nested config
    const flattenConfig = (config, prefix = '') => {
      const flattened = {};
      for (const [key, value] of Object.entries(config)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(flattened, flattenConfig(value, fullKey));
        } else {
          flattened[key] = value;
        }
      }
      return flattened;
    };

    const flatConfig = flattenConfig(this.config);
    
    for (const [field, enabled] of Object.entries(flatConfig)) {
      if (enabled && extractedContent[field] !== undefined) {
        filteredContent[field] = extractedContent[field];
      }
    }

    // Always include essential fields
    const essentialFields = ['post_id', 'slug', 'url', 'title', 'content'];
    essentialFields.forEach(field => {
      if (extractedContent[field] !== undefined) {
        filteredContent[field] = extractedContent[field];
      }
    });

    return filteredContent;
  }

  /**
   * Strip HTML tags from content
   * @param {string} html - HTML content
   * @returns {string} Plain text content
   */
  stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Get word count of content
   * @param {string} content - Text content
   * @returns {number} Word count
   */
  getWordCount(content) {
    if (!content) return 0;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract headings from HTML content
   * @param {string} html - HTML content
   * @returns {Array} Array of headings with their levels
   */
  extractHeadings(html) {
    if (!html) return [];
    
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
    const headings = [];
    let match;
    
    while ((match = headingRegex.exec(html)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        text: match[2].replace(/<[^>]*>/g, '').trim()
      });
    }
    
    return headings;
  }

  /**
   * Calculate estimated reading time
   * @param {string} content - Text content
   * @returns {number} Reading time in minutes
   */
  calculateReadingTime(content) {
    if (!content) return 0;
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = this.getWordCount(content);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Build robots directive from WordPress meta
   * @param {Object} meta - WordPress meta object
   * @returns {string} Robots directive
   */
  buildRobotsDirective(meta) {
    if (!meta) return '';
    
    const directives = [];
    
    if (meta._yoast_wpseo_meta_robots_noindex === '1') {
      directives.push('noindex');
    } else {
      directives.push('index');
    }
    
    if (meta._yoast_wpseo_meta_robots_nofollow === '1') {
      directives.push('nofollow');
    } else {
      directives.push('follow');
    }
    
    if (meta._yoast_wpseo_meta_robots_noarchive === '1') {
      directives.push('noarchive');
    }
    
    if (meta._yoast_wpseo_meta_robots_nosnippet === '1') {
      directives.push('nosnippet');
    }
    
    return directives.join(', ');
  }
}

export default ContentExtractor;