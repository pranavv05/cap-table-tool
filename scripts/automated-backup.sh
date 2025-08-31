#!/bin/bash

# Automated Database Backup Script for Cap Table Tool
# This script performs automated backups of the Supabase PostgreSQL database
# Usage: ./automated-backup.sh [daily|weekly|monthly]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/../backups"
LOG_FILE="${BACKUP_DIR}/backup.log"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Database configuration (use environment variables)
DB_HOST="${SUPABASE_DB_HOST:-db.your-project.supabase.co}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD}"

# Backup storage configuration
BACKUP_TYPE="${1:-daily}"
S3_BUCKET="${BACKUP_S3_BUCKET:-cap-table-backups}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Notification configuration
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"
EMAIL_RECIPIENTS="${BACKUP_EMAIL_RECIPIENTS}"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/weekly"
mkdir -p "${BACKUP_DIR}/monthly"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Error handling function
error_exit() {
    log "ERROR: $1"
    send_notification "BACKUP FAILED" "Database backup failed: $1" "error"
    exit 1
}

# Success notification function
send_notification() {
    local title="$1"
    local message="$2"
    local level="${3:-info}"
    
    # Send Slack notification
    if [[ -n "${SLACK_WEBHOOK}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"[Cap Table Tool] ${title}: ${message}\"}" \
            "${SLACK_WEBHOOK}" || true
    fi
    
    # Send email notification (requires sendmail or similar)
    if [[ -n "${EMAIL_RECIPIENTS}" ]]; then
        echo "${message}" | mail -s "[Cap Table Tool] ${title}" "${EMAIL_RECIPIENTS}" || true
    fi
}

# Database connectivity check
check_database_connection() {
    log "Checking database connectivity..."
    
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
        -c "SELECT 1;" > /dev/null 2>&1 || error_exit "Cannot connect to database"
    
    log "Database connection successful"
}

# Create database backup
create_backup() {
    local backup_type="$1"
    local backup_file="${BACKUP_DIR}/${backup_type}/backup_${backup_type}_${DATE}.sql"
    
    log "Starting ${backup_type} backup..."
    
    # Perform the backup
    PGPASSWORD="${DB_PASSWORD}" pg_dump \
        --host="${DB_HOST}" \
        --username="${DB_USER}" \
        --dbname="${DB_NAME}" \
        --no-owner \
        --no-privileges \
        --verbose \
        --file="${backup_file}" || error_exit "Backup creation failed"
    
    # Verify backup file was created and has content
    if [[ ! -f "${backup_file}" ]]; then
        error_exit "Backup file was not created"
    fi
    
    local file_size=$(stat -f%z "${backup_file}" 2>/dev/null || stat -c%s "${backup_file}" 2>/dev/null)
    if [[ "${file_size}" -lt 1000 ]]; then
        error_exit "Backup file is too small (${file_size} bytes)"
    fi
    
    log "Backup created successfully: ${backup_file} (${file_size} bytes)"
    echo "${backup_file}"
}

# Compress and encrypt backup
encrypt_backup() {
    local backup_file="$1"
    local compressed_file="${backup_file}.gz"
    local encrypted_file="${compressed_file}.enc"
    
    log "Compressing backup..."
    gzip "${backup_file}" || error_exit "Backup compression failed"
    
    if [[ -n "${ENCRYPTION_KEY}" ]]; then
        log "Encrypting backup..."
        openssl enc -aes-256-cbc -salt -in "${compressed_file}" -out "${encrypted_file}" \
            -k "${ENCRYPTION_KEY}" || error_exit "Backup encryption failed"
        
        # Remove unencrypted file
        rm "${compressed_file}"
        echo "${encrypted_file}"
    else
        log "Skipping encryption (no key provided)"
        echo "${compressed_file}"
    fi
}

# Upload backup to cloud storage
upload_to_cloud() {
    local backup_file="$1"
    local backup_type="$2"
    
    if [[ -n "${S3_BUCKET}" ]] && command -v aws &> /dev/null; then
        log "Uploading backup to S3..."
        
        local s3_key="${backup_type}/$(basename "${backup_file}")"
        aws s3 cp "${backup_file}" "s3://${S3_BUCKET}/${s3_key}" \
            --storage-class STANDARD_IA || error_exit "S3 upload failed"
        
        log "Backup uploaded to S3: s3://${S3_BUCKET}/${s3_key}"
    else
        log "Skipping cloud upload (AWS CLI not configured or S3 bucket not specified)"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup integrity..."
    
    # Create temporary database for verification
    local temp_db="backup_verify_${DATE}"
    
    PGPASSWORD="${DB_PASSWORD}" createdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}" || error_exit "Cannot create verification database"
    
    # Restore backup to temporary database
    if [[ "${backup_file}" == *.enc ]]; then
        # Decrypt and restore
        openssl enc -aes-256-cbc -d -in "${backup_file}" -k "${ENCRYPTION_KEY}" | \
        gunzip | \
        PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${temp_db}" > /dev/null 2>&1 || {
            PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}" || true
            error_exit "Backup verification failed"
        }
    elif [[ "${backup_file}" == *.gz ]]; then
        # Decompress and restore
        gunzip -c "${backup_file}" | \
        PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${temp_db}" > /dev/null 2>&1 || {
            PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}" || true
            error_exit "Backup verification failed"
        }
    else
        # Direct restore
        PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${temp_db}" \
            < "${backup_file}" > /dev/null 2>&1 || {
            PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}" || true
            error_exit "Backup verification failed"
        }
    fi
    
    # Verify table counts
    local company_count=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${temp_db}" \
        -t -c "SELECT COUNT(*) FROM companies;" | xargs)
    
    # Clean up verification database
    PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}"
    
    log "Backup verification successful (${company_count} companies restored)"
}

# Clean up old backups
cleanup_old_backups() {
    local backup_type="$1"
    local retention_days="$2"
    
    log "Cleaning up old ${backup_type} backups (older than ${retention_days} days)..."
    
    find "${BACKUP_DIR}/${backup_type}" -name "backup_${backup_type}_*.sql*" \
        -type f -mtime +${retention_days} -delete || true
    
    log "Old backup cleanup completed"
}

# Generate backup report
generate_report() {
    local backup_file="$1"
    local backup_type="$2"
    local start_time="$3"
    local end_time="$4"
    
    local duration=$((end_time - start_time))
    local file_size=$(stat -f%z "${backup_file}" 2>/dev/null || stat -c%s "${backup_file}" 2>/dev/null)
    local file_size_mb=$((file_size / 1024 / 1024))
    
    cat << EOF > "${BACKUP_DIR}/backup_report_${DATE}.txt"
Cap Table Tool Database Backup Report
=====================================

Backup Type: ${backup_type}
Date: $(date)
Duration: ${duration} seconds
File Size: ${file_size_mb} MB
Backup File: ${backup_file}

Database Details:
- Host: ${DB_HOST}
- Database: ${DB_NAME}
- Backup Method: pg_dump

Status: SUCCESS
EOF

    log "Backup report generated: ${BACKUP_DIR}/backup_report_${DATE}.txt"
}

# Main backup process
main() {
    local backup_type="${1:-daily}"
    local start_time=$(date +%s)
    
    log "Starting ${backup_type} backup process..."
    
    # Validate backup type
    case "${backup_type}" in
        daily|weekly|monthly)
            ;;
        *)
            error_exit "Invalid backup type: ${backup_type}. Use daily, weekly, or monthly."
            ;;
    esac
    
    # Check prerequisites
    command -v pg_dump > /dev/null || error_exit "pg_dump is not installed"
    command -v psql > /dev/null || error_exit "psql is not installed"
    
    if [[ -z "${DB_PASSWORD}" ]]; then
        error_exit "Database password not provided (SUPABASE_DB_PASSWORD)"
    fi
    
    # Execute backup process
    check_database_connection
    
    local backup_file
    backup_file=$(create_backup "${backup_type}")
    
    local final_backup_file
    final_backup_file=$(encrypt_backup "${backup_file}")
    
    verify_backup "${final_backup_file}"
    upload_to_cloud "${final_backup_file}" "${backup_type}"
    
    # Set retention based on backup type
    case "${backup_type}" in
        daily)
            cleanup_old_backups "${backup_type}" 30
            ;;
        weekly)
            cleanup_old_backups "${backup_type}" 84  # 12 weeks
            ;;
        monthly)
            cleanup_old_backups "${backup_type}" 365  # 12 months
            ;;
    esac
    
    local end_time=$(date +%s)
    generate_report "${final_backup_file}" "${backup_type}" "${start_time}" "${end_time}"
    
    log "Backup process completed successfully"
    send_notification "BACKUP SUCCESS" "${backup_type} backup completed successfully ($(((end_time - start_time))) seconds)" "success"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi