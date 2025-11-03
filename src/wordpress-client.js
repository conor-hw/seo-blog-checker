import axios from 'axios';

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
        'User-Agent': 'Hostelworld-SEO-Blog-Checker/1.0.0 (Internal Tool)',
        'Accept': 'application/json',
        'From': 'engineering@hostelworld.com',  // Identify ourselves
        'Cache-Control': 'no-cache'  // Ensure we get fresh responses
      }
    });
  }

  /**
   * Get a WordPress post by slug or ID
   * @param {Object} identifier - Object with type ('slug' or 'id') and value
   * @returns {Promise<Object>} WordPress post data
   */
  async getPost(identifier, retryCount = 3, retryDelay = 30000) { // 30 seconds as requested by server
    try {
      let endpoint;
      
      if (identifier.type === 'slug') {
        endpoint = `/wp-json/wp/v2/posts?slug=${encodeURIComponent(identifier.value)}&_embed=1`;
      } else if (identifier.type === 'id') {
        endpoint = `/wp-json/wp/v2/posts/${identifier.value}?_embed=1`;
      } else {
        throw new Error(`Invalid identifier type: ${identifier.type}`);
      }

      console.log(`[WordPress] Fetching post from: ${this.baseUrl}${endpoint}`);
      console.log(`[WordPress] Request headers:`, this.apiClient.defaults.headers);
      console.log(`[WordPress] Attempts remaining: ${retryCount}`);
      
      try {
        // First test the API endpoint
        console.log('[WordPress] Testing API endpoint...');
        await this.testConnection();
        console.log('[WordPress] API endpoint test successful');
      } catch (testError) {
        console.error('[WordPress] API endpoint test failed:', testError.message);
        if (retryCount > 0) {
          console.log(`[WordPress] Retrying in ${retryDelay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.getPost(identifier, retryCount - 1, retryDelay);
        }
        throw testError;
      }

      console.log('[WordPress] Sending post request...');
      const response = await this.apiClient.get(endpoint, {
        validateStatus: function (status) {
          console.log(`[WordPress] Received status code: ${status}`);
          return status >= 200 && status < 300;
        },
        timeout: 30000 // 30 seconds timeout
      });
      
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
      console.error('[WordPress] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        } : null,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers,
          timeout: error.config.timeout
        } : null
      });

      if (error.response) {
        if (error.response.status === 404) {
          throw new Error(`Post not found: ${identifier.value}`);
        }
        if (error.response.status === 502) {
          throw new Error(`WordPress API Gateway error (502). This could be due to:
1. The WordPress site is temporarily down
2. The site's server is overloaded
3. Network connectivity issues
Try again in a few minutes.`);
        }
        throw new Error(`WordPress API error (${error.response.status}): ${error.response.statusText}
Response data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to WordPress site at ${this.baseUrl}. Please check if the site is accessible.`);
      }
      if (error.code === 'ENOTFOUND') {
        throw new Error(`WordPress site not found: ${this.baseUrl}. Please verify the URL is correct.`);
      }
      throw new Error(`WordPress API error: ${error.message}
Stack trace: ${error.stack}`);
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
    // Log metadata availability for debugging
    console.log('[WordPress] Metadata availability check:', {
      has_yoast_head_json: !!postData.yoast_head_json,
      yoast_keys: postData.yoast_head_json ? Object.keys(postData.yoast_head_json) : [],
      has_meta: !!postData.meta,
      meta_keys: postData.meta ? Object.keys(postData.meta) : [],
      has_embedded: !!postData._embedded
    });

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
      status: postData.status,
      type: postData.type,
      // Extract meta data if available - prioritize yoast_head_json
      meta: postData.meta || {},
      // Extract Yoast SEO data if available
      yoast_head_json: postData.yoast_head_json || null,
      // Include embedded data if available
      _embedded: postData._embedded || null,
      // Raw data for debugging
      raw: postData
    };
  }

  /**
   * Test the WordPress API connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection(retryCount = 3, retryDelay = 30000) { // 30 seconds as requested by server
    try {
      console.log(`[WordPress] Testing connection to ${this.baseUrl}/wp-json/`);
      const response = await this.apiClient.get('/wp-json/', {
        timeout: 30000,
        validateStatus: function (status) {
          console.log(`[WordPress] Test connection status: ${status}`);
          return status >= 200 && status < 300;
        }
      });
      return response.status === 200;
    } catch (error) {
      console.error('[WordPress] Connection test error:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText
        } : null
      });

      if (retryCount > 0) {
        console.log(`[WordPress] Retrying connection test in ${retryDelay/1000} seconds... (${retryCount} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.testConnection(retryCount - 1, retryDelay);
      }
      
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

export default WordPressClient;
