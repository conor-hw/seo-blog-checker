import axios from 'axios';

class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
    this.apiClient = axios.create({
      timeout: 180000, // 3 minutes
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
      
      // console.log('[Gemini] Full response structure:', JSON.stringify(response, null, 2));
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

  buildEvaluationPrompt(extractedContent, evaluationConfig) {
    return `You are an SEO expert evaluating Hostelworld blog content to identify high-impact optimization opportunities. Your goal is to help improve existing content performance, increase organic visibility, and ensure AI-friendliness for modern search features.

EVALUATION OBJECTIVE:
- Identify strengths of the content and call them out for learning purposes
- Identify specific improvements for blog content content
- Focus on updating existing content rather than suggesting new content creation
- Ensure content is optimized for AI features (snippets, chatbots, voice)
- Improve conversion potential through better user experience
- Maintain high standards even for well-performing articles

CRITICAL RULES:
1. NEVER assume or invent metadata - if a field is missing, explicitly state "Not found"
2. NEVER give vague recommendations like "improve SEO" or "make more engaging"
3. NEVER skip analysis for high-performing articles - they still need optimization
4. NEVER deviate from the scoring formula and weightings
5. NEVER group feedback - provide specific analysis per category

SCORING CALIBRATION:
- A score of 50-60/100 represents GOOD content that performs well
- A score of 70-80/100 represents EXCELLENT content with minor optimization opportunities  
- A score of 80+/100 represents EXCEPTIONAL content that's best-in-class
- Only give scores below 30/100 for genuinely poor content with major fundamental issues
- Comprehensive, well-written content with good metadata should score 60+/100

${evaluationConfig && evaluationConfig.evaluation_criteria ? 
`EVALUATION EXPECTATIONS:
${evaluationConfig.evaluation_criteria.map(criteria => {
  const key = Object.keys(criteria)[0];
  const config = criteria[key];
  return `${key.toUpperCase()}:
${config.baseline_expectations ? config.baseline_expectations.map(exp => `- ${exp}`).join('\n') : '- Standard content evaluation criteria'}`;
}).join('\n\n')}` : ''}
5. ALWAYS call out discrepancies in language on localisation or translations. Eg: if a post is written in English, the meta description should be in English too.

REQUIRED APPROACH:
1. Point to exact content issues using quotes and examples
2. Provide specific, measurable improvements (e.g., "Reduce meta description from 180 to 155 characters")
3. Link every weakness to a concrete fix with expected impact
4. Flag any missing metadata or structural elements
5. Include improvement opportunities even for top-performing content
6. RECOGNIZE content strengths - acknowledge comprehensive coverage, good structure, expertise
7. CONSIDER content length and depth as major positive factors (1000+ words = substantial value)
8. CREDIT proper authorship, recent updates, and professional presentation

TONE GUIDELINES:
- Use "could be enhanced" instead of "is failing"
- Use "optimization opportunity" instead of "critical fix required"
- Use "consider adding" instead of "must add immediately"
- Recognize that good content with minor issues should score 60-75/100
- Technical scores should reflect actual functionality, not perfectionist standards

CONTENT TO ANALYZE:
Title: ${extractedContent.title || 'Not found'}
Content: ${extractedContent.content || 'Not found'}
Meta Description: ${extractedContent.meta_description || 'Not found'}
Keywords: ${extractedContent.keywords ? extractedContent.keywords.join(', ') : 'Not found'}
URL: ${extractedContent.url || 'Not found'}
Last Modified: ${extractedContent.last_modified || 'Not found'}

SEO METADATA:
SEO Title: ${extractedContent.yoast_seo_title || 'Not found'}
Canonical URL: ${extractedContent.yoast_canonical || 'Not found'}
Focus Keyword: ${extractedContent.yoast_focus_keyword || 'Not found'}
Robots (noindex): ${extractedContent.yoast_noindex ? 'Yes' : 'No'}
Robots (nofollow): ${extractedContent.yoast_nofollow ? 'Yes' : 'No'}

SOCIAL MEDIA METADATA:
Open Graph Title: ${extractedContent.og_title || 'Not found'}
Open Graph Description: ${extractedContent.og_description || 'Not found'}
Open Graph Image: ${extractedContent.og_image || 'Not found'}
Twitter Title: ${extractedContent.twitter_title || 'Not found'}
Twitter Description: ${extractedContent.twitter_description || 'Not found'}
Twitter Image: ${extractedContent.twitter_image || 'Not found'}

TECHNICAL SEO:
Canonical URL: ${extractedContent.canonical_url || 'Not found'}
Robots Directive: ${extractedContent.robots || 'Not found'}
Word Count: ${extractedContent.word_count || 'Not found'}
Headers: ${extractedContent.headers ? extractedContent.headers.map(h => `H${h.level}: ${h.text}`).join(', ') : 'Not found'}

EVALUATION CRITERIA:

🧠 1. EEAT Score (20%)
Evaluates trustworthiness, experience, and authority.
✅ Real user quotes or experiences
✅ UGC or traveller contributions
✅ Specialist insights (e.g., local guides, HW experts)
✅ HW brand confidence markers (e.g., proprietary data, staff recommendations)
✅ Author/attribution or source references

🔧 2. Technical Score (10%)
Assesses SEO integrity and structure.
✅ Metadata present and optimised
✅ Language consistency across ALL metadata fields (title, description, OG tags, Twitter tags)
✅ Logical heading structure (H1–H3)
✅ No broken internal or external links
✅ Schema, canonical, and hreflang present (if applicable)
✅ Proper internal linking to HW pages

**CRITICAL**: Always check if metadata language matches content language. Flag any mismatches between English content and Portuguese metadata or vice versa.

🎯 3. Relevance for User Score (20%)
Evaluates how well the article matches user needs and intent.
✅ Answers top queries or relevant search topics
✅ Matches Gen Z interests (tone, hostels, experiences)
✅ Adds genuine value: what to do, where to go, what to expect
✅ Covers the topic comprehensively, not shallowly

✍️ 4. Text Quality Score (10%)
Evaluates clarity, grammar, localisation, and Gen Z tone.
✅ Correct grammar and spelling
✅ Clear formatting (short paras, bullets)
✅ Localised terms or translations used naturally
✅ Consistent Gen Z-appropriate tone and readability

🤖 5. AI Optimisation Readiness Score (25%)
Evaluates structural readiness for AI enrichment and long-tail discovery.
✅ Includes structured FAQs or common questions
✅ Targets long-tail or intent-specific keywords
✅ Clean use of headings, lists, answer formats
✅ Designed for snippet or voice search use
✅ Opportunities for AI-based content enrichment (e.g., widgets, expandable lists, internal linking modules)

🕒 6. Freshness Score (15%)
Measures how up-to-date and timely the content is.
✅ Content updated in the last 6–12 months
✅ References current year, upcoming events, or timely seasonal content
✅ Avoids outdated mentions (e.g., "2022 festivals", old hostels)
✅ Services and locations mentioned are still open
✅ Signs of recent editorial activity (e.g., updated FAQs, metadata, added sections)

SCORING FORMULA AND WEIGHTS:
📊 Final Quality Score = (EEAT × 0.20) + (Technical × 0.10) + (Relevance × 0.20) + (Text Quality × 0.10) + (AI Optimisation × 0.25) + (Freshness × 0.15)

IMPORTANT GUIDELINES:
1. ALWAYS use these exact weights in your analysis:
   - EEAT Score: 20%
   - Technical Score: 10%
   - Relevance Score: 20%
   - Text Quality Score: 10%
   - AI Optimisation Score: 25%
   - Freshness Score: 15%
2. MANDATORY: Analyze the provided metadata fields (SEO Title, Canonical URL, Focus Keyword, Open Graph Title/Description, Twitter Title/Description, Word Count, Headers)
3. MANDATORY: Compare content language vs metadata language - flag ANY inconsistencies
4. Flag any missing metadata - don't assume it exists
5. Give specific examples in all recommendations
6. Include point values for improvements
7. Analyze high-scoring sections too
8. Keep feedback clear and actionable

LANGUAGE CONSISTENCY CHECK REQUIRED:
- Compare content language with SEO Title language
- Compare content language with Open Graph metadata language  
- Compare content language with Twitter metadata language
- ALWAYS mention any language mismatches in your analysis

Provide your analysis in this format (ensure proper JSON formatting):

{
  "eeat_score": {
    "score": null, // calculate score here based on the criteria and justify score with EXPLICIT examples referencing the content shared for analysis
    "analysis": "", // Detailed analysis justifying the score with EXPLICIT references to the content
    "strengths": [], // Detailed overview of the strengths of the content
    "weaknesses": [], // Detailed overview of the weaknesses of the content
    "recommendations": [] // Actionable recommendations for improvement
  },
  "technical_score": {
    "score": null, // calculate score here based on the criteria and justify score with EXPLICIT examples referencing the content shared for analysis
    "analysis": "", // Detailed analysis justifying the score with EXPLICIT references to the content
    "strengths": [], // Detailed overview of the strengths of the content
    "weaknesses": [], // Detailed overview of the weaknesses of the content
    "recommendations": [] // Actionable recommendations for improvement
  },
  "relevance_score": {
    "score": null, // calculate score here based on the criteria and justify score with EXPLICIT examples referencing the content shared for analysis
    "analysis": "", // Detailed analysis justifying the score with EXPLICIT references to the content
    "strengths": [], // Detailed overview of the strengths of the content
    "weaknesses": [], // Detailed overview of the weaknesses of the content
    "recommendations": [] // Actionable recommendations for improvement
  },
  "text_quality_score": {
    "score": null, // calculate score here based on the criteria and justify score with EXPLICIT examples referencing the content shared for analysis
    "analysis": "", // Detailed analysis justifying the score with EXPLICIT references to the content
    "strengths": [], // Detailed overview of the strengths of the content
    "weaknesses": [], // Detailed overview of the weaknesses of the content
    "recommendations": [] // Actionable recommendations for improvement
  },
  "ai_optimization_score": {
    "score": null, // calculate score here based on the criteria and justify score with EXPLICIT examples referencing the content shared for analysis
    "analysis": "", // Detailed analysis justifying the score with EXPLICIT references to the content
    "strengths": [], // Detailed overview of the strengths of the content
    "weaknesses": [], // Detailed overview of the weaknesses of the content
    "recommendations": [] // Actionable recommendations for improvement
  },
  "freshness_score": {
    "score": null, // calculate score here based on the criteria and justify score with EXPLICIT examples referencing the content shared for analysis
    "analysis": "", // Detailed analysis justifying the score with EXPLICIT references to the content
    "strengths": [], // Detailed overview of the strengths of the content
    "weaknesses": [], // Detailed overview of the weaknesses of the content
    "recommendations": [] // Actionable recommendations for improvement
  },
  "overall_score": null, // DO NOT calculate - will be calculated automatically using the correct weights
  "optimization_recommendation": "", // Detailed optimization recommendation
  "priority_recommendations": [] // Priority recommendations including actionable recommendations for improvement
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
        maxOutputTokens: 16384
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
      // Check if response structure is valid
      if (!response.candidates || !response.candidates[0] || !response.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini API');
      }
      
      // Check if response was truncated
      if (response.candidates[0].finishReason === 'MAX_TOKENS') {
        throw new Error('Gemini response was truncated due to token limit. Try reducing the prompt size or increasing maxOutputTokens.');
      }
      
      if (!response.candidates[0].content.parts || !response.candidates[0].content.parts[0]) {
        throw new Error('Response content parts are missing from Gemini API');
      }
      
      const text = response.candidates[0].content.parts[0].text;
      console.log('[Gemini] Raw response text length:', text.length);
      console.log('[Gemini] Raw response preview:', text.substring(0, 500) + '...');
      
      // Check for common JSON issues
      if (!text.includes('{')) {
        throw new Error('Response does not contain JSON object');
      }
      
      // Extract JSON from the response
      let jsonStr = text.trim();
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '');
      
      // If there's text before/after the JSON, extract just the JSON
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      // Basic cleanup - be more conservative to avoid breaking valid JSON
      jsonStr = jsonStr
        // Remove only C-style comments (not // which might be in URLs)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove only control characters, preserve backticks and other formatting
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalize excessive whitespace but preserve single spaces
        .replace(/\s{2,}/g, ' ');

      // Skip complex array formatting - let JSON.parse handle valid JSON
      console.log('[Gemini] Cleaned JSON length:', jsonStr.length);
      console.log('[Gemini] Cleaned JSON preview:', jsonStr.substring(0, 200) + '...');
      
      // Try to parse and provide better error information if it fails
      let evaluation;
      try {
        evaluation = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('[Gemini] JSON parse error at position:', parseError.message);
        console.error('[Gemini] Context around error position:');
        
        // Extract position from error message
        const positionMatch = parseError.message.match(/position (\d+)/);
        if (positionMatch) {
          const position = parseInt(positionMatch[1]);
          const start = Math.max(0, position - 100);
          const end = Math.min(jsonStr.length, position + 100);
          console.error('[Gemini] Error context:', jsonStr.substring(start, end));
        }
        
        throw new Error(`JSON parsing failed: ${parseError.message}`);
      }

      // Always calculate overall score using our correct weights (override Gemini's calculation)
      const weights = {
        eeat_score: 0.20,
        technical_score: 0.10,
        relevance_score: 0.20,
        text_quality_score: 0.10,
        ai_optimization_score: 0.25,
        freshness_score: 0.15
      };

      const calculatedScore = Object.entries(weights).reduce((sum, [key, weight]) => {
        const score = evaluation[key]?.score || 0;
        return sum + (score * weight);
      }, 0);

      // Always use our calculated score (round to nearest whole number)
      evaluation.overall_score = Math.round(calculatedScore);
      
      console.log('[Gemini] Score calculation check:', {
        geminiProvided: evaluation.overall_score !== Math.round(calculatedScore) ? 'OVERRIDDEN' : 'CORRECT',
        calculatedScore: Math.round(calculatedScore),
        individualScores: Object.entries(weights).map(([key, weight]) => ({
          [key]: evaluation[key]?.score || 0,
          weighted: Math.round((evaluation[key]?.score || 0) * weight * 100) / 100
        }))
      });

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