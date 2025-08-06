import { promises as fs } from 'fs';
import path from 'path';

class ReportGenerator {
  constructor(evaluationConfig) {
    this.config = evaluationConfig;
    this.reportsDir = process.env.REPORTS_DIR || 'reports';
  }

  /**
   * Generate a comprehensive Markdown report from evaluation results
   * @param {Object} evaluation - Evaluation results from Gemini AI
   * @param {Object} extractedContent - Original extracted content
   * @returns {Object} Report object with content and metadata
   */
  generate(evaluation, extractedContent) {
    const report = {
      content: this.buildReportContent(evaluation, extractedContent),
      metadata: {
        generated_at: new Date().toISOString(),
        post_title: extractedContent.title,
        post_slug: extractedContent.slug,
        overall_score: evaluation.overall_score,
        model_used: evaluation.model
      }
    };

    return report;
  }

  /**
   * Build the main report content
   * @param {Object} evaluation - Evaluation results
   * @param {Object} extractedContent - Original content
   * @returns {string} Markdown report content
   */
  buildReportContent(evaluation, extractedContent) {
    let report = '';

    // Header
    report += this.generateHeader(extractedContent, evaluation);
    
    // Executive Summary
    report += this.generateExecutiveSummary(evaluation);
    
    // Detailed Analysis
    report += this.generateDetailedAnalysis(evaluation);
    
    // Recommendations
    report += this.generateRecommendations(evaluation);
    
    // Technical Details (if enabled)
    if (this.config.output_format.include_raw_data) {
      report += this.generateTechnicalDetails(evaluation, extractedContent);
    }

    return report;
  }

  /**
   * Generate report header
   * @param {Object} extractedContent - Original content
   * @param {Object} evaluation - Evaluation results
   * @returns {string} Header section
   */
  generateHeader(extractedContent, evaluation) {
    const scoreColor = this.getScoreColor(evaluation.overall_score);
    const scoreEmoji = this.getScoreEmoji(evaluation.overall_score);
    
    return `# SEO Analysis Report

**Post Title:** ${extractedContent.title || 'N/A'}  
**URL:** ${extractedContent.url || 'N/A'}  
**Analysis Date:** ${new Date().toLocaleDateString()}  
**AI Model:** ${evaluation.model}

## Overall Score: ${scoreEmoji} ${evaluation.overall_score}/100

<div align="center">

${this.generateScoreBar(evaluation.overall_score)}

</div>

---

`;
  }

  /**
   * Generate executive summary
   * @param {Object} evaluation - Evaluation results
   * @returns {string} Executive summary section
   */
  generateExecutiveSummary(evaluation) {
    return `## 📊 Executive Summary

${evaluation.summary}

### Key Metrics

| Metric | Score | Status |
|--------|-------|--------|
${this.generateMetricsTable(evaluation)}

---
`;
  }

  /**
   * Generate detailed analysis section
   * @param {Object} evaluation - Evaluation results
   * @returns {string} Detailed analysis section
   */
  generateDetailedAnalysis(evaluation) {
    let analysis = '## 🔍 Detailed Analysis\n\n';

    for (const [criterionName, criterionData] of Object.entries(evaluation.evaluations || evaluation)) {
      if (criterionName === 'overall_score' || criterionName === 'optimization_recommendation' || criterionName === 'summary' || criterionName === 'priority_recommendations') {
        continue;
      }
      
      const scoreColor = this.getScoreColor(criterionData.score);
      const scoreEmoji = this.getScoreEmoji(criterionData.score);
      
      analysis += `### ${this.formatCriterionName(criterionName)} ${scoreEmoji} ${criterionData.score}/100\n\n`;
      analysis += `${criterionData.analysis}\n\n`;
      
      if (criterionData.recommendations && criterionData.recommendations.length > 0) {
        analysis += '**Recommendations:**\n';
        criterionData.recommendations.forEach((rec, index) => {
          analysis += `${index + 1}. ${rec}\n`;
        });
        analysis += '\n';
      }
      
      analysis += '---\n\n';
    }

    return analysis;
  }

  /**
   * Generate recommendations section
   * @param {Object} evaluation - Evaluation results
   * @returns {string} Recommendations section
   */
  generateRecommendations(evaluation) {
    const recommendations = evaluation.priority_recommendations || evaluation.recommendations;
    
    if (!recommendations || recommendations.length === 0) {
      return '';
    }

    let recSection = '## 🎯 Priority Recommendations\n\n';
    
    recommendations.forEach((rec, index) => {
      recSection += `### ${index + 1}. ${rec}\n\n`;
    });

    recSection += '---\n\n';
    return recSection;
  }

  /**
   * Generate technical details section
   * @param {Object} evaluation - Evaluation results
   * @param {Object} extractedContent - Original content
   * @returns {string} Technical details section
   */
  generateTechnicalDetails(evaluation, extractedContent) {
    return `## 🔧 Technical Details

### Content Statistics
- **Word Count:** ${this.getWordCount(extractedContent.content)}
- **Title Length:** ${extractedContent.title?.length || 0} characters
- **Meta Description Length:** ${extractedContent.meta_description?.length || 0} characters
- **Keywords Count:** ${extractedContent.keywords?.length || 0}

### Evaluation Configuration
\`\`\`yaml
${JSON.stringify(evaluation.config_used, null, 2)}
\`\`\`

### Raw Evaluation Data
\`\`\`json
${JSON.stringify(evaluation, null, 2)}
\`\`\`

---
`;
  }

  /**
   * Generate metrics table for executive summary
   * @param {Object} evaluation - Evaluation results
   * @returns {string} Metrics table
   */
  generateMetricsTable(evaluation) {
    let table = '';
    
    for (const [criterionName, criterionData] of Object.entries(evaluation.evaluations || evaluation)) {
      if (criterionName === 'overall_score' || criterionName === 'optimization_recommendation' || criterionName === 'summary' || criterionName === 'priority_recommendations') {
        continue;
      }
      
      const status = this.getScoreStatus(criterionData.score);
      const emoji = this.getScoreEmoji(criterionData.score);
      
      table += `| ${this.formatCriterionName(criterionName)} | ${criterionData.score}/100 | ${emoji} ${status} |\n`;
    }
    
    return table;
  }

  /**
   * Generate visual score bar
   * @param {number} score - Overall score
   * @returns {string} Score bar
   */
  generateScoreBar(score) {
    const filledBlocks = Math.round(score / 10);
    const emptyBlocks = 10 - filledBlocks;
    const filled = '█'.repeat(filledBlocks);
    const empty = '░'.repeat(emptyBlocks);
    
    return `\`${filled}${empty}\` ${score}%`;
  }

  /**
   * Get score color for formatting
   * @param {number} score - Score value
   * @returns {string} Color indicator
   */
  getScoreColor(score) {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  }

  /**
   * Get score emoji
   * @param {number} score - Score value
   * @returns {string} Emoji
   */
  getScoreEmoji(score) {
    if (score >= 90) return '🟢';
    if (score >= 80) return '🟢';
    if (score >= 70) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  }

  /**
   * Get score status text
   * @param {number} score - Score value
   * @returns {string} Status text
   */
  getScoreStatus(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Needs Improvement';
    return 'Poor';
  }

  /**
   * Format criterion name for display
   * @param {string} criterionName - Raw criterion name
   * @returns {string} Formatted name
   */
  formatCriterionName(criterionName) {
    return criterionName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get word count from text
   * @param {string} text - Text content
   * @returns {number} Word count
   */
  getWordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  }

  /**
   * Save report to file
   * @param {Object} report - Report object
   * @param {string} slug - Post slug for filename
   * @returns {Promise<string>} Path to saved report
   */
  async save(report, slug) {
    try {
      // Create reports directory if it doesn't exist
      await fs.mkdir(this.reportsDir, { recursive: true });
      
      // Create post-specific directory
      const postDir = path.join(this.reportsDir, slug);
      await fs.mkdir(postDir, { recursive: true });
      
      // Save main report
      const reportPath = path.join(postDir, 'seo-analysis-report.md');
      await fs.writeFile(reportPath, report.content, 'utf8');
      
      // Save metadata
      const metadataPath = path.join(postDir, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(report.metadata, null, 2), 'utf8');
      
      // Save raw evaluation data
      const rawDataPath = path.join(postDir, 'raw-evaluation.json');
      await fs.writeFile(rawDataPath, JSON.stringify(report.metadata, null, 2), 'utf8');
      
      return reportPath;
    } catch (error) {
      throw new Error(`Failed to save report: ${error.message}`);
    }
  }

  /**
   * Generate different report formats
   * @param {Object} evaluation - Evaluation results
   * @param {Object} extractedContent - Original content
   * @param {string} format - Report format ('technical', 'executive', 'content-creator')
   * @returns {string} Formatted report
   */
  generateFormattedReport(evaluation, extractedContent, format = 'technical') {
    switch (format) {
      case 'executive':
        return this.generateExecutiveReport(evaluation, extractedContent);
      case 'content-creator':
        return this.generateContentCreatorReport(evaluation, extractedContent);
      default:
        return this.buildReportContent(evaluation, extractedContent);
    }
  }

  /**
   * Generate executive summary report
   * @param {Object} evaluation - Evaluation results
   * @param {Object} extractedContent - Original content
   * @returns {string} Executive report
   */
  generateExecutiveReport(evaluation, extractedContent) {
    return `# SEO Performance Summary

**Post:** ${extractedContent.title}  
**Score:** ${evaluation.overall_score}/100  
**Date:** ${new Date().toLocaleDateString()}

## Key Findings

${evaluation.summary}

## Priority Actions

${evaluation.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## Performance Overview

${this.generateMetricsTable(evaluation)}
`;
  }

  /**
   * Generate content creator report
   * @param {Object} evaluation - Evaluation results
   * @param {Object} extractedContent - Original content
   * @returns {string} Content creator report
   */
  generateContentCreatorReport(evaluation, extractedContent) {
    return `# Content Optimization Guide

**Post:** ${extractedContent.title}  
**Current Score:** ${evaluation.overall_score}/100

## What's Working Well

${this.getPositiveFeedback(evaluation)}

## Areas for Improvement

${this.getActionableFeedback(evaluation)}

## Quick Wins

${evaluation.recommendations.slice(0, 3).map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## Next Steps

1. Review the detailed analysis below
2. Implement the top 3 recommendations
3. Re-run analysis after changes
`;
  }

  /**
   * Extract positive feedback from evaluation
   * @param {Object} evaluation - Evaluation results
   * @returns {string} Positive feedback
   */
  getPositiveFeedback(evaluation) {
    const positives = [];
    
    for (const [criterionName, criterionData] of Object.entries(evaluation.evaluations)) {
      if (criterionData.score >= 80) {
        positives.push(`- **${this.formatCriterionName(criterionName)}**: ${criterionData.analysis.split('.')[0]}.`);
      }
    }
    
    return positives.length > 0 ? positives.join('\n') : '- No specific strengths identified in this analysis.';
  }

  /**
   * Extract actionable feedback from evaluation
   * @param {Object} evaluation - Evaluation results
   * @returns {string} Actionable feedback
   */
  getActionableFeedback(evaluation) {
    const improvements = [];
    
    for (const [criterionName, criterionData] of Object.entries(evaluation.evaluations)) {
      if (criterionData.score < 80 && criterionData.recommendations) {
        improvements.push(`- **${this.formatCriterionName(criterionName)}**: ${criterionData.recommendations[0]}`);
      }
    }
    
    return improvements.length > 0 ? improvements.join('\n') : '- No specific improvements needed.';
  }
}

export default ReportGenerator;
