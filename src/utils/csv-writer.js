import fs from 'fs/promises';
import path from 'path';

class CSVWriter {
  constructor(filepath) {
    this.filepath = filepath;
    this.headers = [
      'URL',
      'Slug',
      'Score',
      'Status',
      'Top Strengths',
      'Critical Issues',
      'Update Priority',
      'Last Updated',
      'Word Count',
      'Processing Date'
    ];
  }

  async initialize() {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(this.filepath), { recursive: true });
      
      // Check if file exists
      try {
        await fs.access(this.filepath);
      } catch {
        // File doesn't exist, create with headers
        await fs.writeFile(this.filepath, this.headers.join(',') + '\n');
      }
    } catch (error) {
      throw new Error(`Failed to initialize CSV file: ${error.message}`);
    }
  }

  getStatusFromScore(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Needs Update';
    return 'Critical';
  }

  getUpdatePriority(score, wordCount) {
    if (score < 60) return 'High';
    if (score < 75 && wordCount > 1000) return 'High';
    if (score < 75) return 'Medium';
    return 'Low';
  }

  escapeCSV(str) {
    if (!str) return '';
    // If string contains comma, quote, or newline, wrap in quotes and escape existing quotes
    if (/[,"\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  formatArray(arr) {
    if (!Array.isArray(arr)) return '';
    return this.escapeCSV(arr.join('; '));
  }

  async appendResult(result) {
    try {
      const status = this.getStatusFromScore(result.overall_score);
      const updatePriority = this.getUpdatePriority(result.overall_score, result.word_count);
      
      const row = [
        this.escapeCSV(result.url),
        this.escapeCSV(result.slug),
        result.overall_score,
        status,
        this.formatArray(result.top_strengths),
        this.formatArray(result.critical_issues),
        updatePriority,
        result.last_updated || 'Unknown',
        result.word_count || 0,
        new Date().toISOString()
      ];

      await fs.appendFile(this.filepath, row.join(',') + '\n');
    } catch (error) {
      console.error(`Failed to append result for ${result.url}: ${error.message}`);
      // Continue processing despite error
    }
  }
}

export default CSVWriter;
