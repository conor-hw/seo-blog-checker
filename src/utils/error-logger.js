import fs from 'fs/promises';
import path from 'path';

class ErrorLogger {
  constructor(logDir = 'logs') {
    this.logDir = logDir;
    this.logFile = path.join(logDir, 'error_log.json');
  }

  async initialize() {
    try {
      // Create logs directory if it doesn't exist
      await fs.mkdir(this.logDir, { recursive: true });
      
      // Check if log file exists, create with empty array if not
      try {
        await fs.access(this.logFile);
      } catch {
        await fs.writeFile(this.logFile, '[]');
      }
    } catch (error) {
      console.error('Failed to initialize error logger:', error);
    }
  }

  async logError(error) {
    try {
      // Read existing logs
      const logs = JSON.parse(await fs.readFile(this.logFile, 'utf8'));
      
      // Create error entry
      const errorEntry = {
        timestamp: new Date().toISOString(),
        slug: error.slug || 'unknown',
        error_type: error.name || 'Error',
        message: error.message,
        stack: error.stack,
        details: {
          response_data: error.response?.data,
          status: error.response?.status,
          status_text: error.response?.statusText
        }
      };

      // Add to logs
      logs.push(errorEntry);

      // Write back to file
      await fs.writeFile(this.logFile, JSON.stringify(logs, null, 2));

      // Also write to a daily log file for easier tracking
      const today = new Date().toISOString().split('T')[0];
      const dailyLogFile = path.join(this.logDir, `errors_${today}.log`);
      
      const logMessage = `[${errorEntry.timestamp}] ${errorEntry.slug}: ${errorEntry.error_type} - ${errorEntry.message}\n`;
      await fs.appendFile(dailyLogFile, logMessage);

    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  async getErrorSummary() {
    try {
      const logs = JSON.parse(await fs.readFile(this.logFile, 'utf8'));
      
      // Group errors by type
      const summary = logs.reduce((acc, log) => {
        const type = log.error_type;
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            slugs: new Set()
          };
        }
        acc[type].count++;
        acc[type].slugs.add(log.slug);
        return acc;
      }, {});

      // Convert to readable format
      return Object.entries(summary).map(([type, data]) => ({
        error_type: type,
        count: data.count,
        affected_slugs: Array.from(data.slugs)
      }));
    } catch (error) {
      console.error('Failed to generate error summary:', error);
      return [];
    }
  }

  async clearLogs() {
    try {
      await fs.writeFile(this.logFile, '[]');
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }
}

export default ErrorLogger;
