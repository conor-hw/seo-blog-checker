const fs = require('fs').promises;
const path = require('path');
const YAML = require('yaml');

class ConfigLoader {
  constructor() {
    this.configDir = path.join(process.cwd(), 'config');
  }

  /**
   * Load extraction configuration from JSON file
   * @param {string} configName - Name of the config file (without .json extension)
   * @returns {Promise<Object>} Configuration object
   */
  async loadExtractionConfig(configName = 'default') {
    try {
      const configPath = path.join(this.configDir, 'extraction', `${configName}.json`);
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // Validate the configuration
      this.validateExtractionConfig(config);
      
      return config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Extraction configuration file '${configName}.json' not found`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in extraction configuration file '${configName}.json'`);
      }
      throw error;
    }
  }

  /**
   * Load evaluation configuration from YAML file
   * @param {string} configName - Name of the config file (without .yaml extension)
   * @returns {Promise<Object>} Configuration object
   */
  async loadEvaluationConfig(configName = 'default') {
    try {
      const configPath = path.join(this.configDir, 'evaluation', `${configName}.yaml`);
      const configData = await fs.readFile(configPath, 'utf8');
      const config = YAML.parse(configData);
      
      // Validate the configuration
      this.validateEvaluationConfig(config);
      
      return config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Evaluation configuration file '${configName}.yaml' not found`);
      }
      throw new Error(`Error loading evaluation configuration '${configName}.yaml': ${error.message}`);
    }
  }

  /**
   * Validate extraction configuration structure
   * @param {Object} config - Configuration object to validate
   */
  validateExtractionConfig(config) {
    const requiredFields = [
      'title', 'content', 'excerpt', 'meta_description', 
      'keywords', 'author', 'date', 'categories', 'tags'
    ];

    for (const field of requiredFields) {
      if (typeof config[field] !== 'boolean') {
        throw new Error(`Extraction config: '${field}' must be a boolean value`);
      }
    }
  }

  /**
   * Validate evaluation configuration structure
   * @param {Object} config - Configuration object to validate
   */
  validateEvaluationConfig(config) {
    if (!config.evaluation_criteria || !Array.isArray(config.evaluation_criteria)) {
      throw new Error('Evaluation config: evaluation_criteria must be an array');
    }

    if (!config.output_format || typeof config.output_format !== 'object') {
      throw new Error('Evaluation config: output_format must be an object');
    }

    // Validate each evaluation criterion
    for (const criterion of config.evaluation_criteria) {
      if (typeof criterion !== 'object') {
        throw new Error('Evaluation config: each criterion must be an object');
      }
    }
  }

  /**
   * List available extraction configurations
   * @returns {Promise<string[]>} Array of available config names
   */
  async listExtractionConfigs() {
    try {
      const extractionDir = path.join(this.configDir, 'extraction');
      const files = await fs.readdir(extractionDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      throw new Error(`Error listing extraction configs: ${error.message}`);
    }
  }

  /**
   * List available evaluation configurations
   * @returns {Promise<string[]>} Array of available config names
   */
  async listEvaluationConfigs() {
    try {
      const evaluationDir = path.join(this.configDir, 'evaluation');
      const files = await fs.readdir(evaluationDir);
      return files
        .filter(file => file.endsWith('.yaml'))
        .map(file => file.replace('.yaml', ''));
    } catch (error) {
      throw new Error(`Error listing evaluation configs: ${error.message}`);
    }
  }
}

module.exports = ConfigLoader;
