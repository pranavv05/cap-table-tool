#!/usr/bin/env node

/**
 * Backup Monitoring Script for Cap Table Tool
 * Monitors backup health, validates backup files, and sends alerts
 * Usage: node backup-monitoring.js [check-type]
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuration
const config = {
  backupDir: path.join(__dirname, '..', 'backups'),
  logFile: path.join(__dirname, '..', 'backups', 'monitoring.log'),
  maxBackupAge: {
    daily: 25 * 60 * 60 * 1000,    // 25 hours
    weekly: 8 * 24 * 60 * 60 * 1000, // 8 days
    monthly: 32 * 24 * 60 * 60 * 1000 // 32 days
  },
  minBackupSize: 1024 * 1024, // 1MB minimum
  retentionLimits: {
    daily: 30,
    weekly: 12,
    monthly: 12
  },
  notifications: {
    slack: process.env.SLACK_WEBHOOK_URL,
    email: process.env.MONITORING_EMAIL_RECIPIENTS
  },
  database: {
    host: process.env.SUPABASE_DB_HOST,
    user: process.env.SUPABASE_DB_USER,
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD
  },
  cloudStorage: {
    s3Bucket: process.env.BACKUP_S3_BUCKET,
    region: process.env.AWS_REGION || 'us-east-1'
  }
};

// Logging utility
class Logger {
  static async log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    // Console output
    if (level === 'error') {
      console.error(logEntry.trim());
    } else {
      console.log(logEntry.trim());
    }
    
    // File output
    try {
      await fs.appendFile(config.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }
  
  static async info(message) { await this.log('info', message); }
  static async warn(message) { await this.log('warn', message); }
  static async error(message) { await this.log('error', message); }
  static async debug(message) { await this.log('debug', message); }
}

// Notification utility
class NotificationService {
  static async sendAlert(title, message, severity = 'info') {
    await Logger.info(`ALERT [${severity}]: ${title} - ${message}`);
    
    // Send Slack notification
    if (config.notifications.slack) {
      try {
        const fetch = await import('node-fetch').then(mod => mod.default);
        
        const emoji = severity === 'error' ? '🚨' : severity === 'warn' ? '⚠️' : 'ℹ️';
        const payload = {
          text: `${emoji} [Cap Table Tool] ${title}: ${message}`,
          username: 'Backup Monitor',
          icon_emoji: ':floppy_disk:'
        };
        
        const response = await fetch(config.notifications.slack, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          await Logger.error(`Failed to send Slack notification: ${response.statusText}`);
        }
      } catch (error) {
        await Logger.error(`Slack notification error: ${error.message}`);
      }
    }
    
    // Send email notification (simplified - requires sendmail or similar)
    if (config.notifications.email && severity !== 'info') {
      try {
        const subject = `[Cap Table Tool] ${title}`;
        const body = `Backup Monitoring Alert\n\nSeverity: ${severity}\nTitle: ${title}\nMessage: ${message}\n\nTimestamp: ${new Date().toISOString()}`;
        
        execSync(`echo "${body}" | mail -s "${subject}" "${config.notifications.email}"`, {
          stdio: 'ignore'
        });
      } catch (error) {
        await Logger.error(`Email notification error: ${error.message}`);
      }
    }
  }
}

// Backup file analyzer
class BackupAnalyzer {
  static async getBackupFiles(backupType = null) {
    const files = [];
    const types = backupType ? [backupType] : ['daily', 'weekly', 'monthly'];
    
    for (const type of types) {
      const typeDir = path.join(config.backupDir, type);
      try {
        const dirFiles = await fs.readdir(typeDir);
        for (const file of dirFiles) {
          if (file.startsWith(`backup_${type}_`)) {
            const filePath = path.join(typeDir, file);
            const stats = await fs.stat(filePath);
            files.push({
              path: filePath,
              name: file,
              type,
              size: stats.size,
              mtime: stats.mtime,
              age: Date.now() - stats.mtime.getTime()
            });
          }
        }
      } catch (error) {
        await Logger.warn(`Cannot read backup directory ${typeDir}: ${error.message}`);
      }
    }
    
    return files.sort((a, b) => b.mtime - a.mtime);
  }
  
  static async validateBackupFile(backup) {
    const issues = [];
    
    // Check file size
    if (backup.size < config.minBackupSize) {
      issues.push(`File too small: ${this.formatBytes(backup.size)}`);
    }
    
    // Check file age
    const maxAge = config.maxBackupAge[backup.type];
    if (backup.age > maxAge) {
      issues.push(`File too old: ${this.formatDuration(backup.age)}`);
    }
    
    // Check file integrity (basic)
    try {
      if (backup.name.endsWith('.gz') || backup.name.endsWith('.enc')) {
        // For compressed/encrypted files, just check if we can read the header
        const buffer = await fs.readFile(backup.path, { start: 0, end: 100 });
        if (buffer.length === 0) {
          issues.push('File appears to be empty');
        }
      }
    } catch (error) {
      issues.push(`Cannot read file: ${error.message}`);
    }
    
    return issues;
  }
  
  static formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  static formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

// Database connectivity checker
class DatabaseMonitor {
  static async checkConnection() {
    if (!config.database.password) {
      throw new Error('Database password not configured');
    }
    
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        host: config.database.host,
        user: config.database.user,
        database: config.database.database,
        password: config.database.password,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      });
      
      const client = await pool.connect();
      const result = await client.query('SELECT version(), now() as current_time');
      client.release();
      await pool.end();
      
      return {
        success: true,
        version: result.rows[0].version,
        currentTime: result.rows[0].current_time
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async getTableCounts() {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        host: config.database.host,
        user: config.database.user,
        database: config.database.database,
        password: config.database.password,
        ssl: { rejectUnauthorized: false }
      });
      
      const client = await pool.connect();
      const queries = [
        'SELECT COUNT(*) as count FROM companies',
        'SELECT COUNT(*) as count FROM funding_rounds',
        'SELECT COUNT(*) as count FROM shareholders',
        'SELECT COUNT(*) as count FROM equity_grants'
      ];
      
      const results = {};
      results.companies = (await client.query(queries[0])).rows[0].count;
      results.funding_rounds = (await client.query(queries[1])).rows[0].count;
      results.shareholders = (await client.query(queries[2])).rows[0].count;
      
      try {
        results.equity_grants = (await client.query(queries[3])).rows[0].count;
      } catch (error) {
        results.equity_grants = 'N/A'; // Table might not exist
      }
      
      client.release();
      await pool.end();
      
      return results;
    } catch (error) {
      throw new Error(`Failed to get table counts: ${error.message}`);
    }
  }
}

// Cloud storage monitor
class CloudStorageMonitor {
  static async checkS3Backups() {
    if (!config.cloudStorage.s3Bucket) {
      return { success: false, reason: 'S3 bucket not configured' };
    }
    
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Check if AWS CLI is available
      await execAsync('aws --version');
      
      // List recent backups
      const command = `aws s3 ls s3://${config.cloudStorage.s3Bucket}/ --recursive --region ${config.cloudStorage.region}`;
      const { stdout } = await execAsync(command);
      
      const backups = stdout.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            date: parts[0],
            time: parts[1],
            size: parseInt(parts[2]) || 0,
            key: parts[3]
          };
        })
        .filter(backup => backup.key && backup.key.includes('backup_'));
      
      return {
        success: true,
        backupCount: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
        latestBackup: backups.length > 0 ? backups[backups.length - 1] : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Main monitoring class
class BackupMonitor {
  static async checkBackupHealth() {
    await Logger.info('Starting backup health check...');
    
    const report = {
      timestamp: new Date().toISOString(),
      overall_status: 'healthy',
      issues: [],
      statistics: {}
    };
    
    // Check local backups
    const backups = await BackupAnalyzer.getBackupFiles();
    report.statistics.total_backups = backups.length;
    
    if (backups.length === 0) {
      report.issues.push('No backup files found');
      report.overall_status = 'critical';
    }
    
    // Validate each backup type
    for (const type of ['daily', 'weekly', 'monthly']) {
      const typeBackups = backups.filter(b => b.type === type);
      report.statistics[`${type}_backups`] = typeBackups.length;
      
      if (typeBackups.length === 0) {
        report.issues.push(`No ${type} backups found`);
        report.overall_status = 'warning';
        continue;
      }
      
      // Check latest backup
      const latest = typeBackups[0];
      const maxAge = config.maxBackupAge[type];
      
      if (latest.age > maxAge) {
        report.issues.push(`Latest ${type} backup is too old: ${BackupAnalyzer.formatDuration(latest.age)}`);
        report.overall_status = 'warning';
      }
      
      // Validate backup files
      for (const backup of typeBackups.slice(0, 3)) { // Check last 3 backups
        const issues = await BackupAnalyzer.validateBackupFile(backup);
        if (issues.length > 0) {
          report.issues.push(`${backup.name}: ${issues.join(', ')}`);
          if (report.overall_status === 'healthy') {
            report.overall_status = 'warning';
          }
        }
      }
      
      // Check retention compliance
      const retentionLimit = config.retentionLimits[type];
      if (typeBackups.length > retentionLimit * 1.2) { // 20% buffer
        report.issues.push(`Too many ${type} backups: ${typeBackups.length} (limit: ${retentionLimit})`);
      }
    }
    
    return report;
  }
  
  static async checkDatabaseHealth() {
    await Logger.info('Checking database health...');
    
    const dbCheck = await DatabaseMonitor.checkConnection();
    if (!dbCheck.success) {
      return {
        status: 'critical',
        error: dbCheck.error
      };
    }
    
    try {
      const tableCounts = await DatabaseMonitor.getTableCounts();
      return {
        status: 'healthy',
        connection: true,
        version: dbCheck.version,
        currentTime: dbCheck.currentTime,
        tableCounts
      };
    } catch (error) {
      return {
        status: 'warning',
        connection: true,
        error: error.message
      };
    }
  }
  
  static async checkCloudBackups() {
    await Logger.info('Checking cloud backup status...');
    
    const s3Check = await CloudStorageMonitor.checkS3Backups();
    return {
      s3: s3Check
    };
  }
  
  static async generateReport() {
    await Logger.info('Generating comprehensive backup report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overall_status: 'healthy',
        total_issues: 0
      },
      checks: {}
    };
    
    // Backup health check
    try {
      report.checks.backups = await this.checkBackupHealth();
      if (report.checks.backups.overall_status !== 'healthy') {
        report.summary.overall_status = report.checks.backups.overall_status;
      }
      report.summary.total_issues += report.checks.backups.issues.length;
    } catch (error) {
      await Logger.error(`Backup health check failed: ${error.message}`);
      report.checks.backups = { status: 'critical', error: error.message };
      report.summary.overall_status = 'critical';
    }
    
    // Database health check
    try {
      report.checks.database = await this.checkDatabaseHealth();
      if (report.checks.database.status === 'critical') {
        report.summary.overall_status = 'critical';
      }
    } catch (error) {
      await Logger.error(`Database health check failed: ${error.message}`);
      report.checks.database = { status: 'critical', error: error.message };
      report.summary.overall_status = 'critical';
    }
    
    // Cloud backup check
    try {
      report.checks.cloud = await this.checkCloudBackups();
    } catch (error) {
      await Logger.error(`Cloud backup check failed: ${error.message}`);
      report.checks.cloud = { status: 'warning', error: error.message };
    }
    
    return report;
  }
  
  static async runHealthCheck() {
    try {
      const report = await this.generateReport();
      
      // Save report
      const reportFile = path.join(config.backupDir, `health_report_${Date.now()}.json`);
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      
      // Send notifications based on status
      if (report.summary.overall_status === 'critical') {
        await NotificationService.sendAlert(
          'BACKUP CRITICAL',
          `Backup system has critical issues. Total issues: ${report.summary.total_issues}`,
          'error'
        );
      } else if (report.summary.overall_status === 'warning') {
        await NotificationService.sendAlert(
          'BACKUP WARNING',
          `Backup system has warnings. Total issues: ${report.summary.total_issues}`,
          'warn'
        );
      } else {
        await Logger.info(`Backup health check passed. Status: ${report.summary.overall_status}`);
      }
      
      // Output summary
      console.log('\n=== BACKUP HEALTH SUMMARY ===');
      console.log(`Overall Status: ${report.summary.overall_status.toUpperCase()}`);
      console.log(`Total Issues: ${report.summary.total_issues}`);
      console.log(`Report saved: ${reportFile}`);
      
      if (report.checks.backups && report.checks.backups.issues.length > 0) {
        console.log('\nIssues found:');
        report.checks.backups.issues.forEach(issue => {
          console.log(`  - ${issue}`);
        });
      }
      
      return report;
    } catch (error) {
      await Logger.error(`Health check failed: ${error.message}`);
      await NotificationService.sendAlert(
        'MONITORING FAILURE',
        `Backup monitoring script failed: ${error.message}`,
        'error'
      );
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2] || 'health-check';
  
  try {
    // Ensure backup directory exists
    await fs.mkdir(config.backupDir, { recursive: true });
    await fs.mkdir(path.join(config.backupDir, 'daily'), { recursive: true });
    await fs.mkdir(path.join(config.backupDir, 'weekly'), { recursive: true });
    await fs.mkdir(path.join(config.backupDir, 'monthly'), { recursive: true });
    
    switch (command) {
      case 'health-check':
        await BackupMonitor.runHealthCheck();
        break;
      
      case 'list-backups':
        const backups = await BackupAnalyzer.getBackupFiles();
        console.log('\n=== LOCAL BACKUP FILES ===');
        backups.forEach(backup => {
          console.log(`${backup.type.padEnd(8)} ${backup.name.padEnd(40)} ${BackupAnalyzer.formatBytes(backup.size).padEnd(10)} ${backup.mtime.toISOString()}`);
        });
        break;
      
      case 'check-database':
        const dbHealth = await BackupMonitor.checkDatabaseHealth();
        console.log('\n=== DATABASE HEALTH ===');
        console.log(JSON.stringify(dbHealth, null, 2));
        break;
      
      case 'check-cloud':
        const cloudHealth = await BackupMonitor.checkCloudBackups();
        console.log('\n=== CLOUD BACKUP STATUS ===');
        console.log(JSON.stringify(cloudHealth, null, 2));
        break;
      
      default:
        console.log('Usage: node backup-monitoring.js [command]');
        console.log('Commands:');
        console.log('  health-check    - Run complete health check (default)');
        console.log('  list-backups    - List all local backup files');
        console.log('  check-database  - Check database connectivity and health');
        console.log('  check-cloud     - Check cloud backup status');
        process.exit(1);
    }
  } catch (error) {
    await Logger.error(`Script failed: ${error.message}`);
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  BackupMonitor,
  BackupAnalyzer,
  DatabaseMonitor,
  CloudStorageMonitor,
  NotificationService,
  Logger
};