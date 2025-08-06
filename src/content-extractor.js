import axios from 'axios';

class ContentExtractor {
  constructor(extractionConfig) {
    this.config = extractionConfig;
  }

  /**
   * Extract content from WordPress post data based on configuration
   * @param {Object} wordpressData - Normalized WordPress post data
   * @returns {Object} Extracted content object
   */
  extract(wordpressData) {
    const extractedContent = {
      post_id: wordpressData.id,
      slug: wordpressData.slug,
      url: wordpressData.link
    };

    // Extract fields based on configuration
    for (const [field, enabled] of Object.entries(this.config)) {
      if (enabled && wordpressData[field] !== undefined) {
        extractedContent[field] = wordpressData[field];
      }
    }

    // Handle special cases
    if (this.config.content && wordpressData.content) {
      // Strip HTML tags from content for analysis
      extractedContent.content = this.stripHtml(wordpressData.content.rendered || wordpressData.content);
    }

    if (this.config.title && wordpressData.title) {
      extractedContent.title = wordpressData.title.rendered || wordpressData.title;
    }

    if (this.config.excerpt && wordpressData.excerpt) {
      extractedContent.excerpt = wordpressData.excerpt.rendered || wordpressData.excerpt;
    }

    if (this.config.meta_description && wordpressData.meta) {
      extractedContent.meta_description = wordpressData.meta._yoast_wpseo_metadesc || '';
    }

    if (this.config.keywords && wordpressData.meta) {
      extractedContent.keywords = wordpressData.meta._yoast_wpseo_focuskw ? 
        [wordpressData.meta._yoast_wpseo_focuskw] : [];
    }

    return extractedContent;
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
   * Extract headings from content
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