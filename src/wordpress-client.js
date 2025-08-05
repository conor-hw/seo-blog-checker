const axios = require('axios');

class WordPressClient {
  constructor() {
    this.baseUrl = process.env.WORDPRESS_BASE_URL;
    if (!this.baseUrl) {
      throw new Error('WORDPRESS_BASE_URL environment variable is required');
    }
    
    // Remove trailing slash if present
    this.baseUrl = this.baseUrl.replace(/\/$/, '');
    
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'User-Agent': 'SEO-Blog-Checker/1.0.0',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Get a WordPress post by slug or ID
   * @param {Object} identifier - Object with type ('slug' or 'id') and value
   * @returns {Promise<Object>} WordPress post data
   */
  async getPost(identifier) {
    try {
      let endpoint;
      
      if (identifier.type === 'slug') {
        endpoint = `/wp-json/wp/v2/posts?slug=${encodeURIComponent(identifier.value)}`;
      } else if (identifier.type === 'id') {
        endpoint = `/wp-json/wp/v2/posts/${identifier.value}`;
      } else {
        throw new Error(`Invalid identifier type: ${identifier.type}`);
      }

      const response = await this.apiClient.get(endpoint);
      
      // Handle slug-based queries which return an array
      let postData;
      if (identifier.type === 'slug') {
        if (!response.data || response.data.length === 0) {
          throw new Error(`Post with slug '${identifier.value}' not found`);
        }
        postData = response.data[0]; // Take the first match
      } else {
        postData = response.data;
      }

      return this.normalizePostData(postData);
      
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error(`Post not found: ${identifier.value}`);
        }
        throw new Error(`WordPress API error (${error.response.status}): ${error.response.statusText}`);
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to WordPress site at ${this.baseUrl}`);
      }
      if (error.code === 'ENOTFOUND') {
        throw new Error(`WordPress site not found: ${this.baseUrl}`);
      }
      throw error;
    }
  }

  /**
   * Get multiple WordPress posts by slugs or IDs
   * @param {Array} identifiers - Array of identifier objects
   * @returns {Promise<Array>} Array of WordPress post data
   */
  async getPosts(identifiers) {
    const posts = [];
    const errors = [];

    for (const identifier of identifiers) {
      try {
        const post = await this.getPost(identifier);
        posts.push(post);
      } catch (error) {
        errors.push({
          identifier,
          error: error.message
        });
      }
    }

    if (errors.length > 0) {
      console.warn(`Failed to fetch ${errors.length} posts:`, errors);
    }

    return posts;
  }

  /**
   * Normalize WordPress post data to a consistent format
   * @param {Object} postData - Raw WordPress API response
   * @returns {Object} Normalized post data
   */
  normalizePostData(postData) {
    return {
      id: postData.id,
      slug: postData.slug,
      title: postData.title?.rendered || postData.title || '',
      content: postData.content?.rendered || postData.content || '',
      excerpt: postData.excerpt?.rendered || postData.excerpt || '',
      date: postData.date,
      modified: postData.modified,
      author: postData.author,
      categories: postData.categories || [],
      tags: postData.tags || [],
      featured_media: postData.featured_media,
      link: postData.link,
      // Extract meta data if available
      meta: postData.meta || {},
      // Extract Yoast SEO data if available
      yoast_head: postData.yoast_head_json || null,
      // Raw data for debugging
      raw: postData
    };
  }

  /**
   * Test the WordPress API connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      const response = await this.apiClient.get('/wp-json/');
      return response.status === 200;
    } catch (error) {
      throw new Error(`WordPress API connection test failed: ${error.message}`);
    }
  }

  /**
   * Get WordPress site information
   * @returns {Promise<Object>} Site information
   */
  async getSiteInfo() {
    try {
      const response = await this.apiClient.get('/wp-json/');
      return {
        name: response.data.name,
        description: response.data.description,
        url: response.data.url,
        version: response.data.version
      };
    } catch (error) {
      throw new Error(`Failed to get site info: ${error.message}`);
    }
  }
}

module.exports = WordPressClient;
