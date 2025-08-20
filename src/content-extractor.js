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
      word_count: this.getWordCount(wordpressData.content?.rendered || '')
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
      
      // Additional meta data for universal scraping
      og_title: scrapedData.meta?.og_title || '',
      og_description: scrapedData.meta?.og_description || '',
      og_image: scrapedData.meta?.og_image || '',
      twitter_title: scrapedData.meta?.twitter_title || '',
      twitter_description: scrapedData.meta?.twitter_description || ''
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
    for (const [field, enabled] of Object.entries(this.config)) {
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
}

export default ContentExtractor;