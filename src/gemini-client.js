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

  async evaluate(extractedContent, evaluationConfig) {
    try {
      console.log('[Gemini] Building evaluation prompt...');
      console.log('[Gemini] Content to analyze:', {
        title: extractedContent.title,
        url: extractedContent.url,
        contentLength: extractedContent.content?.length || 0,
        metaDescription: extractedContent.meta_description,
        keywords: extractedContent.keywords
      });
      
      const prompt = this.buildEvaluationPrompt(extractedContent, evaluationConfig);
      
      console.log('[Gemini] Sending request to API...');
      const response = await this.sendRequest(prompt);
      
      console.log('[Gemini] Response received:', {
        hasContent: !!response.candidates?.[0]?.content,
        contentLength: response.candidates?.[0]?.content?.parts?.[0]?.text?.length || 0
      });
      
      console.log('[Gemini] Raw response text:', response.candidates?.[0]?.content?.parts?.[0]?.text);
      
      console.log('[Gemini] Parsing response...');
      const evaluation = this.parseEvaluationResponse(response);
      
      console.log('[Gemini] Evaluation scores:', {
        overall: evaluation.overall_score,
        scores: evaluation.scores
      });

      return evaluation;
    } catch (error) {
      console.error('[Gemini] Evaluation error:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      throw new Error(`Gemini AI evaluation failed: ${error.message}\n${error.stack || ''}`);
    }
  }

  buildEvaluationPrompt(extractedContent) {
    return `You are an SEO expert evaluating Hostelworld blog content. Analyze this post and provide specific, actionable feedback.

CONTENT TO ANALYZE:
Title: ${extractedContent.title || 'Not found'}
Content: ${extractedContent.content || 'Not found'}
Meta Description: ${extractedContent.meta_description || 'Not found'}
Keywords: ${extractedContent.keywords ? extractedContent.keywords.join(', ') : 'Not found'}
URL: ${extractedContent.url || 'Not found'}
Last Modified: ${extractedContent.last_modified || 'Not found'}

EVALUATION CRITERIA:
- EEAT (20%): Expert authority, user experiences, Hostelworld brand integration
- Technical SEO (10%): Metadata, structure, internal linking
- Relevance (20%): Search intent match, comprehensive coverage
- Text Quality (10%): Writing style, readability, formatting
- AI Optimization (25%): Featured snippets, voice search, structured data
- Freshness (15%): Current information, seasonal relevance

IMPORTANT GUIDELINES:
1. Flag any missing metadata - don't assume it exists
2. Give specific examples in all recommendations
3. Include point values for improvements
4. Analyze high-scoring sections too
5. Keep feedback clear and actionable

Return a SINGLE JSON object in this EXACT format (no other text):

{
  "scores": {
    "eeat": 75,
    "technical": 80,
    "relevance": 85,
    "quality": 90,
    "ai_ready": 70,
    "freshness": 65
  },
  "overall_score": 77.5,
  "strengths": ["Clear heading structure", "Good keyword coverage"],
  "improvements": ["Add author bio (+10)", "Update prices (+5)"],
  "priority": "medium"
}`;
  }

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
      console.log('[Gemini] Sending request to:', this.baseUrl);
      console.log('[Gemini] Request config:', {
        temperature: requestData.generationConfig.temperature,
        maxOutputTokens: requestData.generationConfig.maxOutputTokens
      });

      const response = await this.apiClient.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        requestData
      );

      if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
        console.error('[Gemini] Invalid response format:', response.data);
        throw new Error('Invalid response format from Gemini API');
      }

      return response.data;
    } catch (error) {
      console.error('[Gemini] Request error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });

      if (error.response) {
        if (error.response.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please try again later.');
        }
        if (error.response.status === 400) {
          const errorMsg = error.response.data.error?.message || 'Invalid request';
          throw new Error(`Gemini API request failed: ${errorMsg}`);
        }
        if (error.response.status === 404) {
          throw new Error(`Gemini API endpoint not found. Please check the API key and endpoint URL.`);
        }
        throw new Error(`Gemini API error (${error.response.status}): ${error.response.statusText}`);
      }

      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Gemini API. Please check your internet connection.`);
      }
      if (error.code === 'ENOTFOUND') {
        throw new Error(`Gemini API host not found. Please check the API endpoint URL.`);
      }

      throw error;
    }
  }

  parseEvaluationResponse(response) {
    try {
      const text = response.candidates[0].content.parts[0].text;
      console.log('[Gemini] Raw response text:', text);
      
      // Extract JSON from the response
      let jsonStr = text.trim();
      
      // If there's text before/after the JSON, extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      // Basic cleanup
      jsonStr = jsonStr
        // Remove all comments
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
        // Remove non-printable characters
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Fix arrays with missing commas
        .replace(/"\s*\]/g, '"]')
        .replace(/(\[\s*"[^"]+")(\s*")/g, '$1,$2');

      // Ensure arrays are properly formatted
      let depth = 0;
      let inString = false;
      let inArray = false;
      let lastChar = '';
      let result = '';

      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        
        // Handle strings
        if (char === '"' && lastChar !== '\\') {
          inString = !inString;
        }
        
        // Only process special characters outside strings
        if (!inString) {
          if (char === '[') {
            depth++;
            inArray = true;
          } else if (char === ']') {
            depth--;
            inArray = depth > 0;
          } else if (inArray && char === '"' && jsonStr[i-1] === '"') {
            // Add missing comma between array elements
            result += ',';
          }
        }
        
        result += char;
        lastChar = char;
      }

      jsonStr = result;
      console.log('[Gemini] Cleaned JSON:', jsonStr);
      
      const evaluation = JSON.parse(jsonStr);

      // Calculate overall score if not provided
      if (!evaluation.overall_score) {
        const weights = {
          eeat: 0.20,
          technical: 0.10,
          relevance: 0.20,
          quality: 0.10,
          ai_ready: 0.25,
          freshness: 0.15
        };

        evaluation.overall_score = Object.entries(weights).reduce((sum, [key, weight]) => {
          return sum + (evaluation.scores[key] * weight);
        }, 0);
      }

      // Set priority if not provided
      if (!evaluation.priority) {
        if (evaluation.overall_score < 60) evaluation.priority = 'high';
        else if (evaluation.overall_score < 75) evaluation.priority = 'medium';
        else evaluation.priority = 'low';
      }

      return evaluation;
    } catch (error) {
      throw new Error(`Failed to parse Gemini response: ${error.message}`);
    }
  }

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