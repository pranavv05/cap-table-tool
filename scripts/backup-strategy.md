# Database Backup and Disaster Recovery Strategy

## Overview
This document outlines the comprehensive backup and disaster recovery strategy for the Cap Table Tool's PostgreSQL database hosted on Supabase.

## 1. Backup Strategy

### 1.1 Automated Backups (Supabase Native)
Supabase provides automated backups with the following features:
- **Point-in-Time Recovery (PITR)**: 7-day retention for Pro plans
- **Daily Backups**: Automated daily backups with configurable retention
- **Geographic Replication**: Backups stored in multiple regions

### 1.2 Custom Backup Implementation

#### 1.2.1 Database Schema Backup
```bash
# Export complete schema
pg_dump --schema-only --no-owner --no-privileges \
  -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  > schema_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2.2 Data-Only Backup
```bash
# Export data only (excluding schema)
pg_dump --data-only --no-owner --no-privileges \
  -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  > data_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2.3 Complete Database Backup
```bash
# Full database backup
pg_dump --no-owner --no-privileges \
  -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  > full_backup_$(date +%Y%m%d_%H%M%S).sql
```

## 2. Backup Schedule

### 2.1 Production Environment
- **Real-time**: Supabase PITR (continuous)
- **Daily**: Automated full backup (3 AM UTC)
- **Weekly**: Manual verification backup (Sundays)
- **Monthly**: Long-term archive backup

### 2.2 Backup Retention Policy
- **Daily backups**: 30 days retention
- **Weekly backups**: 12 weeks retention  
- **Monthly backups**: 12 months retention
- **Yearly backups**: 7 years retention

## 3. Storage Locations

### 3.1 Primary Storage
- **Location**: Supabase native backup storage
- **Encryption**: AES-256 encryption at rest
- **Replication**: Multi-region replication

### 3.2 Secondary Storage (Recommended)
- **AWS S3**: Separate AWS account for additional security
- **Google Cloud Storage**: Alternative cloud provider
- **Azure Blob Storage**: Third-party redundancy

### 3.3 Offline Storage
- **Local encrypted drives**: For critical monthly backups
- **Secure off-site storage**: Physical backup location

## 4. Disaster Recovery Procedures

### 4.1 Recovery Time Objectives (RTO)
- **Critical data loss**: < 15 minutes
- **Complete system restore**: < 4 hours
- **Full operational recovery**: < 24 hours

### 4.2 Recovery Point Objectives (RPO)
- **Maximum acceptable data loss**: < 5 minutes
- **Point-in-time recovery**: Available for last 7 days
- **Full backup recovery**: Last 24 hours

### 4.3 Recovery Scenarios

#### 4.3.1 Individual Table Recovery
```sql
-- Restore specific table from backup
DROP TABLE IF EXISTS companies_backup;
CREATE TABLE companies_backup AS SELECT * FROM companies;

-- Restore from backup file
psql -h db.your-project.supabase.co -U postgres -d postgres \
  -c "\\copy companies FROM 'companies_backup.csv' CSV HEADER"
```

#### 4.3.2 Point-in-Time Recovery
```sql
-- Using Supabase dashboard or CLI
supabase db restore --project-ref your-project-ref \
  --backup-id backup-id \
  --timestamp "2024-01-15 10:30:00"
```

#### 4.3.3 Complete Database Restore
```bash
# Restore complete database from backup
psql -h db.your-project.supabase.co -U postgres -d postgres \
  < full_backup_20240115_103000.sql
```

## 5. Monitoring and Alerting

### 5.1 Backup Monitoring
- **Backup completion status**: Daily verification
- **Backup file integrity**: Hash verification
- **Storage capacity**: Monitor available space
- **Network connectivity**: Backup transfer success

### 5.2 Alert Configurations
```yaml
# Example monitoring configuration
backup_alerts:
  failed_backup:
    condition: backup_status != 'success'
    notification: email, slack
    severity: critical
  
  storage_capacity:
    condition: storage_usage > 80%
    notification: email
    severity: warning
  
  data_inconsistency:
    condition: data_validation_failed
    notification: email, slack, sms
    severity: critical
```

## 6. Security Considerations

### 6.1 Backup Encryption
- **In-transit**: TLS 1.3 encryption
- **At-rest**: AES-256 encryption
- **Key management**: Separate key storage (AWS KMS, Azure Key Vault)

### 6.2 Access Control
```yaml
# IAM policy for backup access
backup_access_policy:
  users:
    - database_admin
    - backup_operator
  permissions:
    - read_backup
    - create_backup
    - restore_backup
  restrictions:
    - mfa_required: true
    - ip_whitelist: ["office_ip", "vpn_range"]
```

### 6.3 Audit Trail
- **Backup operations**: All backup/restore operations logged
- **Access logs**: Who accessed backups and when
- **Data changes**: Change tracking for sensitive tables

## 7. Testing and Validation

### 7.1 Backup Testing Schedule
- **Daily**: Automated backup integrity checks
- **Weekly**: Test restore of random table
- **Monthly**: Complete disaster recovery drill
- **Quarterly**: Cross-region recovery test

### 7.2 Data Validation
```sql
-- Validate data integrity after restore
SELECT 
  table_name,
  row_count,
  last_updated,
  checksum
FROM backup_validation_view;

-- Check for data consistency
SELECT COUNT(*) as total_companies FROM companies;
SELECT COUNT(*) as total_funding_rounds FROM funding_rounds;
SELECT COUNT(*) as total_shareholders FROM shareholders;
```

## 8. Implementation Scripts

### 8.1 Backup Automation Script
See: `scripts/automated-backup.sh`

### 8.2 Recovery Scripts
See: `scripts/disaster-recovery.sh`

### 8.3 Monitoring Scripts
See: `scripts/backup-monitoring.js`

## 9. Emergency Contacts

### 9.1 Internal Team
- **Database Administrator**: [email]
- **DevOps Lead**: [email]
- **CTO**: [email]

### 9.2 External Vendors
- **Supabase Support**: support@supabase.io
- **AWS Support**: [support case system]
- **Cloud Provider Emergency**: [24/7 hotline]

## 10. Regular Review Process

### 10.1 Monthly Reviews
- Backup success rates
- Storage utilization
- Recovery time metrics
- Security audit results

### 10.2 Quarterly Reviews
- Disaster recovery plan updates
- Technology stack evaluation
- Compliance requirements
- Cost optimization

### 10.3 Annual Reviews
- Complete strategy overhaul
- Vendor assessment
- Regulatory compliance audit
- Business continuity planning

## 11. Compliance and Legal

### 11.1 Data Retention Requirements
- **SOX Compliance**: 7 years financial data retention
- **GDPR**: Right to deletion procedures
- **CCPA**: Data portability requirements

### 11.2 Geographic Considerations
- **Data residency**: Ensure backups comply with local laws
- **Cross-border transfers**: Encryption and legal agreements
- **Regulatory reporting**: Backup for audit purposes

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Next Review**: 2024-04-15  
**Owner**: Database Administration Team