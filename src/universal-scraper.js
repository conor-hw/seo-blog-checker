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
      // Basic SEO metadata
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      _yoast_wpseo_metadesc: $('meta[name="description"]').attr('content') || '',
      _yoast_wpseo_focuskw: $('meta[name="keywords"]').attr('content')?.split(',')[0] || '',
      
      // Technical SEO elements
      canonical_url: $('link[rel="canonical"]').attr('href') || '',
      robots: $('meta[name="robots"]').attr('content') || '',
      viewport: $('meta[name="viewport"]').attr('content') || '',
      language: $('html').attr('lang') || '',
      
      // Open Graph metadata
      og_title: $('meta[property="og:title"]').attr('content') || '',
      og_description: $('meta[property="og:description"]').attr('content') || '',
      og_image: $('meta[property="og:image"]').attr('content') || '',
      og_type: $('meta[property="og:type"]').attr('content') || '',
      og_url: $('meta[property="og:url"]').attr('content') || '',
      og_site_name: $('meta[property="og:site_name"]').attr('content') || '',
      
      // Article-specific Open Graph
      article_author: $('meta[property="article:author"]').attr('content') || '',
      article_published_time: $('meta[property="article:published_time"]').attr('content') || '',
      article_modified_time: $('meta[property="article:modified_time"]').attr('content') || '',
      article_section: $('meta[property="article:section"]').attr('content') || '',
      article_tag: $('meta[property="article:tag"]').attr('content') || '',
      
      // Twitter metadata
      twitter_title: $('meta[name="twitter:title"]').attr('content') || '',
      twitter_description: $('meta[name="twitter:description"]').attr('content') || '',
      twitter_card: $('meta[name="twitter:card"]').attr('content') || '',
      twitter_site: $('meta[name="twitter:site"]').attr('content') || '',
      twitter_creator: $('meta[name="twitter:creator"]').attr('content') || '',
      twitter_image: $('meta[name="twitter:image"]').attr('content') || ''
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
    return this.analyzeSchemas(schemas);
  }

  /**
   * Analyze extracted schemas for completeness and validation
   * @param {Array} schemas - Array of schema objects
   * @returns {Object} Schema analysis results
   */
  analyzeSchemas(schemas) {
    if (!schemas.length) {
      return {
        raw_schemas: [],
        analysis: {
          total_schemas: 0,
          schema_types: [],
          has_article_schema: false,
          has_organization_schema: false,
          has_breadcrumb_schema: false,
          completeness_score: 0,
          validation_issues: []
        }
      };
    }

    const schemaTypes = [];
    const validationIssues = [];
    let hasArticleSchema = false;
    let hasOrganizationSchema = false;
    let hasBreadcrumbSchema = false;
    let totalCompleteness = 0;

    schemas.forEach((schema, index) => {
      const schemaType = this.getSchemaType(schema);
      schemaTypes.push(schemaType);
      
      // Check for specific schema types
      if (schemaType.includes('Article') || schemaType.includes('BlogPosting')) {
        hasArticleSchema = true;
      }
      if (schemaType.includes('Organization')) {
        hasOrganizationSchema = true;
      }
      if (schemaType.includes('BreadcrumbList')) {
        hasBreadcrumbSchema = true;
      }

      // Validate schema completeness
      const completeness = this.validateSchemaCompleteness(schema, schemaType);
      totalCompleteness += completeness.score;
      
      if (completeness.issues.length > 0) {
        validationIssues.push({
          schema_index: index,
          schema_type: schemaType,
          issues: completeness.issues
        });
      }
    });

    return {
      raw_schemas: schemas,
      analysis: {
        total_schemas: schemas.length,
        schema_types: [...new Set(schemaTypes)],
        has_article_schema: hasArticleSchema,
        has_organization_schema: hasOrganizationSchema,
        has_breadcrumb_schema: hasBreadcrumbSchema,
        completeness_score: Math.round(totalCompleteness / schemas.length),
        validation_issues: validationIssues
      }
    };
  }

  /**
   * Get schema type from schema object
   * @param {Object} schema - Schema object
   * @returns {string} Schema type
   */
  getSchemaType(schema) {
    if (Array.isArray(schema)) {
      return schema.map(s => s['@type'] || 'Unknown').join(', ');
    }
    return schema['@type'] || 'Unknown';
  }

  /**
   * Validate schema completeness based on type
   * @param {Object} schema - Schema object
   * @param {string} schemaType - Type of schema
   * @returns {Object} Validation results
   */
  validateSchemaCompleteness(schema, schemaType) {
    const issues = [];
    let score = 100;

    // Common required fields
    if (!schema['@context']) {
      issues.push('Missing @context');
      score -= 20;
    }
    if (!schema['@type']) {
      issues.push('Missing @type');
      score -= 20;
    }

    // Article/BlogPosting specific validation
    if (schemaType.includes('Article') || schemaType.includes('BlogPosting')) {
      if (!schema.headline && !schema.name) {
        issues.push('Missing headline/name for article');
        score -= 15;
      }
      if (!schema.author) {
        issues.push('Missing author information');
        score -= 10;
      }
      if (!schema.datePublished) {
        issues.push('Missing publication date');
        score -= 10;
      }
      if (!schema.image) {
        issues.push('Missing featured image');
        score -= 5;
      }
      if (!schema.publisher) {
        issues.push('Missing publisher information');
        score -= 10;
      }
    }

    // Organization specific validation
    if (schemaType.includes('Organization')) {
      if (!schema.name) {
        issues.push('Missing organization name');
        score -= 15;
      }
      if (!schema.url) {
        issues.push('Missing organization URL');
        score -= 10;
      }
    }

    return {
      score: Math.max(0, score),
      issues: issues
    };
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