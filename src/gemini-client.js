import axios from 'axios';

class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    this.apiClient = axios.create({
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SEO-Blog-Checker/1.0.0'
      }
    });
  }

  /**
   * Evaluate content using Gemini AI
   * @param {Object} extractedContent - Extracted content from WordPress
   * @param {Object} evaluationConfig - Evaluation configuration
   * @returns {Promise<Object>} Evaluation results
   */
  async evaluate(extractedContent, evaluationConfig) {
    try {
      const prompt = this.buildEvaluationPrompt(extractedContent, evaluationConfig);
      const response = await this.sendRequest(prompt);
      
      return this.parseEvaluationResponse(response, evaluationConfig);
    } catch (error) {
      throw new Error(`Gemini AI evaluation failed: ${error.message}`);
    }
  }

  /**
   * Build evaluation prompt for Gemini AI
   * @param {Object} extractedContent - Extracted content
   * @param {Object} evaluationConfig - Evaluation configuration
   * @returns {string} Formatted prompt
   */
  buildEvaluationPrompt(extractedContent, evaluationConfig) {
    const isHostelworld = evaluationConfig.output_format?.report_type === 'hostelworld';
    
    if (isHostelworld) {
      return this.buildHostelworldPrompt(extractedContent, evaluationConfig);
    } else {
      return this.buildGenericPrompt(extractedContent, evaluationConfig);
    }
  }

  /**
   * Build Hostelworld-specific evaluation prompt
   * @param {Object} extractedContent - Extracted content
   * @param {Object} evaluationConfig - Evaluation configuration
   * @returns {string} Formatted prompt
   */
  buildHostelworldPrompt(extractedContent, evaluationConfig) {
    const criteria = evaluationConfig.evaluation_criteria;
    const threshold = evaluationConfig.output_format.optimization_threshold || 75;
    
    let prompt = `You are an SEO expert specializing in Hostelworld blog content evaluation. Please evaluate the following blog post using the Hostelworld-specific criteria.

CONTENT TO ANALYZE:
Title: ${extractedContent.title || 'N/A'}
Content: ${extractedContent.content || 'N/A'}
Meta Description: ${extractedContent.meta_description || 'N/A'}
Keywords: ${extractedContent.keywords ? extractedContent.keywords.join(', ') : 'N/A'}
URL: ${extractedContent.url || 'N/A'}

HOSTELWORLD EVALUATION CRITERIA:
`;

    // Add Hostelworld-specific criteria
    for (const criterion of criteria) {
      const criterionName = Object.keys(criterion)[0];
      const criterionConfig = criterion[criterionName];
      
      prompt += `\n${criterionConfig.description} (Weight: ${criterionConfig.weight * 100}%)\n`;
      
      switch (criterionName) {
        case 'eeat_score':
          prompt += `- Real user quotes or experiences\n`;
          prompt += `- UGC or traveller contributions\n`;
          prompt += `- Specialist insights (local guides, HW experts)\n`;
          prompt += `- HW brand confidence markers (proprietary data, staff recommendations)\n`;
          prompt += `- Author/attribution or source references\n`;
          break;
        case 'technical_score':
          prompt += `- Metadata present and optimized\n`;
          prompt += `- Logical heading structure (H1-H3)\n`;
          prompt += `- No broken internal or external links\n`;
          prompt += `- Schema, canonical, and hreflang present\n`;
          prompt += `- Proper internal linking to HW pages\n`;
          break;
        case 'relevance_score':
          prompt += `- Answers top queries or relevant search topics\n`;
          prompt += `- Matches Gen Z interests (tone, hostels, experiences)\n`;
          prompt += `- Adds genuine value: what to do, where to go, what to expect\n`;
          prompt += `- Covers the topic comprehensively, not shallowly\n`;
          break;
        case 'text_quality_score':
          prompt += `- Correct grammar and spelling\n`;
          prompt += `- Clear formatting (short paras, bullets)\n`;
          prompt += `- Localized terms or translations used naturally\n`;
          prompt += `- Consistent Gen Z-appropriate tone and readability\n`;
          break;
        case 'ai_optimization_score':
          prompt += `- Includes structured FAQs or common questions\n`;
          prompt += `- Targets long-tail or intent-specific keywords\n`;
          prompt += `- Clean use of headings, lists, answer formats\n`;
          prompt += `- Designed for snippet or voice search use\n`;
          prompt += `- Opportunities for AI-based content enrichment\n`;
          break;
        case 'freshness_score':
          prompt += `- Updated within the last 6-12 months\n`;
          prompt += `- Reflects current events, travel conditions, prices\n`;
          prompt += `- Avoids references to outdated years\n`;
          prompt += `- Links point to current pages\n`;
          prompt += `- Reflects seasonal accuracy\n`;
          break;
      }
    }

    prompt += `

SCORING INSTRUCTIONS:
- Score each dimension on a 0-100 scale
- Apply the weighted formula: (EEAT × 0.20) + (Technical × 0.10) + (Relevance × 0.20) + (Text Quality × 0.10) + (AI Optimization × 0.25) + (Freshness × 0.15)
- If Final Quality Score < ${threshold}, recommend "Optimize"

Please provide your analysis in the following JSON format:
{
  "eeat_score": {
    "score": 85,
    "analysis": "Detailed analysis of trustworthiness and authority",
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "technical_score": {
    "score": 75,
    "analysis": "Technical SEO analysis",
    "strengths": [],
    "weaknesses": [],
    "recommendations": []
  },
  "relevance_score": {
    "score": 90,
    "analysis": "User relevance analysis",
    "strengths": [],
    "weaknesses": [],
    "recommendations": []
  },
  "text_quality_score": {
    "score": 80,
    "analysis": "Text quality analysis",
    "strengths": [],
    "weaknesses": [],
    "recommendations": []
  },
  "ai_optimization_score": {
    "score": 70,
    "analysis": "AI optimization readiness analysis",
    "strengths": [],
    "weaknesses": [],
    "recommendations": []
  },
  "freshness_score": {
    "score": 65,
    "analysis": "Content freshness analysis",
    "strengths": [],
    "weaknesses": [],
    "recommendations": []
  },
  "overall_score": 78.5,
  "optimization_recommendation": "Optimize",
  "summary": "Overall assessment of the content's performance",
  "priority_recommendations": ["Top recommendation 1", "Top recommendation 2"]
}

Focus on Hostelworld-specific insights and Gen Z audience considerations.`;

    return prompt;
  }

  /**
   * Build generic evaluation prompt (existing functionality)
   * @param {Object} extractedContent - Extracted content
   * @param {Object} evaluationConfig - Evaluation configuration
   * @returns {string} Formatted prompt
   */
  buildGenericPrompt(extractedContent, evaluationConfig) {
    // Existing generic prompt logic
    const criteria = evaluationConfig.evaluation_criteria;
    
    let prompt = `You are an SEO expert analyzing a blog post. Please evaluate the following content and provide a detailed SEO analysis.

CONTENT TO ANALYZE:
Title: ${extractedContent.title || 'N/A'}
Content: ${extractedContent.content || 'N/A'}
Meta Description: ${extractedContent.meta_description || 'N/A'}
Keywords: ${extractedContent.keywords ? extractedContent.keywords.join(', ') : 'N/A'}

EVALUATION CRITERIA:
`;

    for (const criterion of criteria) {
      const criterionName = Object.keys(criterion)[0];
      const criterionConfig = criterion[criterionName];
      
      prompt += `- ${criterionName}: `;
      
      switch (criterionName) {
        case 'keyword_density':
          prompt += `Target density: ${criterionConfig.target}%, Weight: ${criterionConfig.weight}\n`;
          break;
        case 'readability':
          prompt += `Target score: ${criterionConfig.target_score}, Weight: ${criterionConfig.weight}\n`;
          break;
        case 'heading_structure':
          prompt += `Required levels: ${criterionConfig.required_levels.join(', ')}, Weight: ${criterionConfig.weight}\n`;
          break;
        case 'meta_tags':
          prompt += `Required tags: ${criterionConfig.required.join(', ')}, Weight: ${criterionConfig.weight}\n`;
          break;
        case 'content_length':
          prompt += `Min words: ${criterionConfig.min_words}, Max words: ${criterionConfig.max_words}, Weight: ${criterionConfig.weight}\n`;
          break;
      }
    }

    prompt += `

Please provide your analysis in the following JSON format:
{
  "overall_score": 85,
  "evaluations": {
    "keyword_density": {
      "score": 80,
      "analysis": "Analysis text here",
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    }
  },
  "summary": "Overall summary of the content's SEO performance",
  "recommendations": ["Top recommendation 1", "Top recommendation 2"]
}

Focus on providing actionable insights and specific recommendations for improvement.
`;

    return prompt;
  }

  /**
   * Send request to Gemini API
   * @param {string} prompt - Evaluation prompt
   * @returns {Promise<Object>} API response
   */
  async sendRequest(prompt) {
    const requestData = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        requestData
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please try again later.');
        }
        if (error.response.status === 400) {
          throw new Error(`Gemini API request failed: ${error.response.data.error?.message || 'Invalid request'}`);
        }
        if (error.response.status === 404) {
          throw new Error(`Gemini API endpoint not found. Please check the API key and endpoint URL.`);
        }
        throw new Error(`Gemini API error (${error.response.status}): ${error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Parse Gemini API response
   * @param {Object} response - Raw API response
   * @param {Object} evaluationConfig - Evaluation configuration
   * @returns {Object} Parsed evaluation results
   */
  parseEvaluationResponse(response, evaluationConfig) {
    try {
      const text = response.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }

      const evaluation = JSON.parse(jsonMatch[0]);
      
      // Add metadata
      evaluation.timestamp = new Date().toISOString();
      evaluation.model = 'gemini-1.5-flash';
      evaluation.config_used = evaluationConfig;

      return evaluation;
    } catch (error) {
      throw new Error(`Failed to parse Gemini response: ${error.message}`);
    }
  }

  /**
   * Test Gemini API connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      const testPrompt = "Please respond with 'OK' if you can read this message.";
      const response = await this.sendRequest(testPrompt);
      return response.candidates && response.candidates.length > 0;
    } catch (error) {
      throw new Error(`Gemini API connection test failed: ${error.message}`);
    }
  }
}

export default GeminiClient;
