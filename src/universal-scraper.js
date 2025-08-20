import axios from 'axios';
import * as cheerio from 'cheerio';

class UniversalScraper {
  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Blog-Checker/1.0.0)'
      }
    });
  }

  /**
   * Scrape any URL and extract content, headers, and schema
   * @param {string} url - URL to scrape
   * @returns {Object} Normalized content object
   */
  async scrapeUrl(url) {
    try {
      const response = await this.client.get(url);
      const $ = cheerio.load(response.data);
      
      return {
        id: this.generateId(url),
        slug: this.extractSlugFromUrl(url),
        link: url,
        title: this.extractTitle($),
        content: this.extractContent($),
        excerpt: this.extractExcerpt($),
        meta: this.extractMeta($),
        schema: this.extractSchema($),
        headers: this.extractHeaders($),
        images: this.extractImages($),
        links: this.extractLinks($)
      };
    } catch (error) {
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }

  extractTitle($) {
    return $('title').text() || $('h1').first().text() || 'No title found';
  }

  extractContent($) {
    // Try multiple selectors for main content
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      'main'
    ];
    
    for (const selector of contentSelectors) {
      const content = $(selector).first();
      if (content.length > 0) {
        return {
          rendered: content.html(),
          text: content.text().trim()
        };
      }
    }
    
    // Fallback to body content
    return {
      rendered: $('body').html(),
      text: $('body').text().trim()
    };
  }

  extractExcerpt($) {
    // Try to find excerpt in common locations
    const excerptSelectors = [
      'meta[name="description"]',
      'meta[property="og:description"]', 
      '.excerpt',
      '.post-excerpt',
      '.entry-summary'
    ];
    
    for (const selector of excerptSelectors) {
      const excerpt = $(selector).first();
      if (selector.startsWith('meta')) {
        const content = excerpt.attr('content');
        if (content && content.trim()) {
          return { rendered: content, text: content };
        }
      } else if (excerpt.length > 0) {
        return {
          rendered: excerpt.html(),
          text: excerpt.text().trim()
        };
      }
    }
    
    // Fallback: use first paragraph or first 160 chars of content
    const firstParagraph = $('p').first().text().trim();
    if (firstParagraph) {
      const excerpt = firstParagraph.length > 160 
        ? firstParagraph.substring(0, 160) + '...'
        : firstParagraph;
      return { rendered: excerpt, text: excerpt };
    }
    
    return { rendered: '', text: '' };
  }

  extractMeta($) {
    return {
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      _yoast_wpseo_metadesc: $('meta[name="description"]').attr('content') || '',
      _yoast_wpseo_focuskw: $('meta[name="keywords"]').attr('content')?.split(',')[0] || '',
      og_title: $('meta[property="og:title"]').attr('content') || '',
      og_description: $('meta[property="og:description"]').attr('content') || '',
      og_image: $('meta[property="og:image"]').attr('content') || '',
      twitter_title: $('meta[name="twitter:title"]').attr('content') || '',
      twitter_description: $('meta[name="twitter:description"]').attr('content') || ''
    };
  }

  extractSchema($) {
    const schemas = [];
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const schemaData = JSON.parse($(elem).html());
        schemas.push(schemaData);
      } catch (error) {
        // Invalid JSON schema, skip
      }
    });
    return schemas;
  }

  extractHeaders($) {
    const headers = [];
    $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
      headers.push({
        level: parseInt(elem.tagName.replace('h', '')),
        text: $(elem).text().trim()
      });
    });
    return headers;
  }

  extractImages($) {
    const images = [];
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      const alt = $(elem).attr('alt') || '';
      if (src) {
        images.push({ src, alt });
      }
    });
    return images;
  }

  extractLinks($) {
    const links = [];
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      if (href && text) {
        links.push({ href, text });
      }
    });
    return links;
  }

  generateId(url) {
    return Buffer.from(url).toString('base64').substring(0, 10);
  }

  extractSlugFromUrl(url) {
    const pathname = new URL(url).pathname;
    return pathname.split('/').filter(Boolean).pop() || 'homepage';
  }
}

export default UniversalScraper; 