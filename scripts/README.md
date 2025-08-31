# Backup and Disaster Recovery System

This directory contains the complete backup and disaster recovery implementation for the Cap Table Tool. The system provides automated backups, disaster recovery procedures, and monitoring capabilities to ensure data safety and business continuity.

## 📁 Files Overview

### Core Documentation
- **`backup-strategy.md`** - Comprehensive backup and disaster recovery strategy document
- **`README.md`** - This file - implementation guide and usage instructions

### Automation Scripts
- **`automated-backup.sh`** - Automated backup script for daily, weekly, and monthly backups
- **`disaster-recovery.sh`** - Disaster recovery script for emergency database restoration
- **`backup-monitoring.js`** - Node.js monitoring script for backup health checks

### Configuration
- **`.env.backup.example`** - Environment configuration template
- **`crontab.example`** - Cron job configuration examples

### Database Schemas
- **`002_create_shareholders_table.sql`** - Shareholders table schema
- **`004_create_funding_rounds_table.sql`** - Funding rounds table schema

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy and configure environment file
cp .env.backup.example .env.backup
nano .env.backup  # Configure your settings

# Make scripts executable
chmod +x automated-backup.sh
chmod +x disaster-recovery.sh

# Install Node.js dependencies for monitoring
npm install pg node-fetch
```

### 2. Configure Database Connection

Update `.env.backup` with your Supabase credentials:

```bash
SUPABASE_DB_HOST=db.your-project.supabase.co
SUPABASE_DB_USER=postgres
SUPABASE_DB_NAME=postgres
SUPABASE_DB_PASSWORD=your_password_here
```

### 3. Set Up Automated Backups

```bash
# Test backup script
./automated-backup.sh daily

# Set up cron jobs
crontab -e
# Add these lines:
0 3 * * * /path/to/cap-table-tool/scripts/automated-backup.sh daily
0 1 * * 0 /path/to/cap-table-tool/scripts/automated-backup.sh weekly
0 2 1 * * /path/to/cap-table-tool/scripts/automated-backup.sh monthly
```

### 4. Test Monitoring

```bash
# Run health check
node backup-monitoring.js health-check

# Set up monitoring cron job
*/5 * * * * /usr/bin/node /path/to/cap-table-tool/scripts/backup-monitoring.js health-check
```

## 📊 Backup Strategy

### Backup Types and Schedule

| Type | Schedule | Retention | Purpose |
|------|----------|-----------|---------|
| **Daily** | 3:00 AM UTC | 30 days | Regular recovery points |
| **Weekly** | Sunday 1:00 AM | 12 weeks | Medium-term recovery |
| **Monthly** | 1st day 2:00 AM | 12 months | Long-term archives |
| **PITR** | Continuous | 7 days | Point-in-time recovery |

### Storage Locations

1. **Primary**: Supabase native backups (automated)
2. **Secondary**: Local encrypted backups
3. **Tertiary**: AWS S3 cloud storage (optional)
4. **Archive**: Monthly offline backups

## 🔧 Backup Scripts Usage

### Automated Backup Script

```bash
# Daily backup
./automated-backup.sh daily

# Weekly backup
./automated-backup.sh weekly

# Monthly backup
./automated-backup.sh monthly

# View backup logs
tail -f ../backups/backup.log
```

**Features:**
- Automatic encryption and compression
- Cloud storage upload (S3)
- Backup verification
- Slack/email notifications
- Error handling and logging

### Disaster Recovery Script

```bash
# List available backups
./disaster-recovery.sh list-backups

# Full database restore
./disaster-recovery.sh restore-full backups/daily/backup_daily_20240115_030000.sql.gz.enc

# Restore specific table
./disaster-recovery.sh restore-table backups/daily/backup_daily_20240115_030000.sql.gz.enc companies

# Point-in-time recovery (requires Supabase dashboard)
./disaster-recovery.sh restore-pitr "2024-01-15 10:30:00"

# Verify backup integrity
./disaster-recovery.sh verify-backup backups/daily/backup_daily_20240115_030000.sql.gz.enc

# Create emergency clone
./disaster-recovery.sh emergency-clone
```

**Features:**
- Multiple recovery scenarios
- Backup verification
- Pre-recovery safety backups
- Dry-run mode (`--dry-run`)
- Force mode (`--force`)

### Monitoring Script

```bash
# Complete health check
node backup-monitoring.js health-check

# List local backups
node backup-monitoring.js list-backups

# Check database connectivity
node backup-monitoring.js check-database

# Check cloud backup status
node backup-monitoring.js check-cloud
```

**Features:**
- Backup file validation
- Database connectivity checks
- Cloud storage monitoring
- Automated alerting
- Detailed health reports

## 🔐 Security Features

### Encryption
- **At Rest**: AES-256 encryption for all backup files
- **In Transit**: TLS 1.3 for all network transfers
- **Key Management**: Separate encryption key storage

### Access Control
```bash
# Set proper file permissions
chmod 600 .env.backup
chmod 700 automated-backup.sh
chmod 700 disaster-recovery.sh
chmod 755 backup-monitoring.js

# Backup file permissions
chmod 640 backups/*.sql.gz.enc
```

### Audit Trail
- All backup/recovery operations logged
- Access tracking for backup files
- Change tracking for sensitive data
- Compliance reporting capabilities

## 📱 Notification Setup

### Slack Integration

1. Create a Slack webhook URL
2. Add to `.env.backup`:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### Email Notifications

Configure SMTP or use system sendmail:
```bash
BACKUP_EMAIL_RECIPIENTS=admin@company.com,dba@company.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@company.com
SMTP_PASSWORD=your_email_password
```

## 🚨 Disaster Recovery Procedures

### Scenario 1: Individual Table Corruption

```bash
# 1. Identify affected table
./disaster-recovery.sh check-database

# 2. Find recent backup
./disaster-recovery.sh list-backups

# 3. Restore specific table
./disaster-recovery.sh restore-table backup_file.sql.gz.enc table_name

# 4. Verify restoration
node backup-monitoring.js check-database
```

### Scenario 2: Database Corruption

```bash
# 1. Create emergency clone (if database accessible)
./disaster-recovery.sh emergency-clone

# 2. Identify recovery point
./disaster-recovery.sh list-backups

# 3. Restore from backup
./disaster-recovery.sh restore-full backup_file.sql.gz.enc

# 4. Verify restoration
./disaster-recovery.sh verify-backup backup_file.sql.gz.enc
```

### Scenario 3: Complete System Failure

```bash
# 1. Assess situation and notify stakeholders
# 2. Provision new database instance
# 3. Restore from most recent backup
./disaster-recovery.sh restore-full latest_backup.sql.gz.enc --target-db new_database

# 4. Update application configuration
# 5. Perform full system testing
# 6. Switch production traffic
```

## 📈 Monitoring and Alerting

### Health Check Metrics

- Backup completion status
- File integrity verification
- Database connectivity
- Storage capacity usage
- Recovery time testing

### Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Backup failed | Critical | Immediate notification |
| Database unreachable | Critical | Emergency escalation |
| Old backup (>25h) | Warning | Email notification |
| Storage 80% full | Warning | Cleanup notification |
| Recovery test failed | Critical | Immediate review |

### Monitoring Dashboard

Create monitoring queries for your observability platform:

```sql
-- Backup success rate (last 7 days)
SELECT 
  DATE(created_at) as backup_date,
  COUNT(*) as total_backups,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_backups
FROM backup_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at);

-- Recovery time metrics
SELECT 
  recovery_type,
  AVG(duration_seconds) as avg_duration,
  MAX(duration_seconds) as max_duration
FROM recovery_logs
WHERE created_at >= NOW() - INTERVAL '30 days';
```

## 🧪 Testing Procedures

### Monthly Testing Checklist

- [ ] Backup integrity verification
- [ ] Recovery time testing
- [ ] Cloud storage synchronization
- [ ] Notification system testing
- [ ] Documentation review
- [ ] Emergency contact verification

### Quarterly Disaster Recovery Drill

1. **Simulate failure scenario**
2. **Execute recovery procedures**
3. **Measure recovery time**
4. **Validate data integrity**
5. **Document lessons learned**
6. **Update procedures as needed**

### Testing Commands

```bash
# Test backup creation
./automated-backup.sh daily --dry-run

# Test recovery procedures
./disaster-recovery.sh restore-full backup_file.sql.gz.enc --dry-run

# Test monitoring alerts
node backup-monitoring.js health-check

# Verify all systems
./test-disaster-recovery.sh  # Custom test script
```

## 📋 Compliance and Legal

### Data Retention Requirements

- **SOX Compliance**: 7 years financial data retention
- **GDPR**: Right to deletion procedures implemented
- **CCPA**: Data portability features available

### Geographic Considerations

- Backup storage locations comply with data residency laws
- Cross-border transfer encryption and legal agreements
- Regulatory reporting backup procedures

## 🔄 Maintenance Tasks

### Daily
- Monitor backup completion
- Review alert notifications
- Check storage capacity

### Weekly
- Verify backup integrity
- Review monitoring reports
- Test recovery procedures

### Monthly
- Update documentation
- Review security settings
- Audit access logs
- Disaster recovery drill

### Quarterly
- Review and update strategy
- Security audit
- Vendor assessment
- Business continuity planning

## 📞 Emergency Contacts

Update these in `.env.backup`:

```bash
EMERGENCY_CONTACT_PRIMARY=+1234567890
EMERGENCY_CONTACT_SECONDARY=+0987654321
EMERGENCY_EMAIL_PRIMARY=emergency@company.com
```

### Escalation Matrix

1. **Database Administrator** - First response
2. **DevOps Lead** - Technical escalation
3. **CTO** - Management escalation
4. **External Support** - Vendor escalation

## 🔍 Troubleshooting

### Common Issues

**Backup fails with "disk space" error:**
```bash
# Check disk usage
df -h
# Clean old backups
find backups/ -name "*.sql*" -mtime +30 -delete
```

**Database connection timeout:**
```bash
# Test connectivity
PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $SUPABASE_DB_HOST -U $SUPABASE_DB_USER -d $SUPABASE_DB_NAME -c "SELECT 1;"
```

**Backup verification fails:**
```bash
# Check file integrity
file backup_file.sql.gz.enc
# Test decryption
openssl enc -aes-256-cbc -d -in backup_file.sql.gz.enc -k $ENCRYPTION_KEY | head
```

### Log Analysis

```bash
# View recent backup logs
tail -100 ../backups/backup.log

# Search for errors
grep -i error ../backups/backup.log | tail -20

# Monitor real-time
tail -f ../backups/backup.log | grep -i error
```

## 📚 Additional Resources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup and Recovery](https://www.postgresql.org/docs/current/backup.html)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/s3/latest/userguide/backup-best-practices.html)
- [Disaster Recovery Planning Guide](https://www.ready.gov/business-continuity-plan)

---

**Last Updated**: 2024-01-15  
**Version**: 1.0  
**Maintained By**: Database Administration Team