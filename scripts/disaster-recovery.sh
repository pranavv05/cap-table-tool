#!/bin/bash

# Disaster Recovery Script for Cap Table Tool
# This script handles emergency database restoration procedures
# Usage: ./disaster-recovery.sh [restore-type] [backup-file] [target-database]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/../backups"
LOG_FILE="${BACKUP_DIR}/recovery.log"
DATE=$(date +%Y%m%d_%H%M%S)

# Database configuration
DB_HOST="${SUPABASE_DB_HOST:-db.your-project.supabase.co}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD}"

# Recovery configuration
RECOVERY_TYPE="${1:-}"
BACKUP_FILE="${2:-}"
TARGET_DB="${3:-${DB_NAME}}"

# Encryption configuration
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Notification configuration
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"
EMAIL_RECIPIENTS="${RECOVERY_EMAIL_RECIPIENTS}"

# Ensure log directory exists
mkdir -p "${BACKUP_DIR}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Error handling function
error_exit() {
    log "ERROR: $1"
    send_notification "RECOVERY FAILED" "Database recovery failed: $1" "error"
    exit 1
}

# Send notification
send_notification() {
    local title="$1"
    local message="$2"
    local level="${3:-info}"
    
    log "NOTIFICATION: ${title} - ${message}"
    
    # Send Slack notification
    if [[ -n "${SLACK_WEBHOOK}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 [Cap Table Tool] ${title}: ${message}\"}" \
            "${SLACK_WEBHOOK}" || true
    fi
    
    # Send email notification
    if [[ -n "${EMAIL_RECIPIENTS}" ]]; then
        echo "${message}" | mail -s "[URGENT] [Cap Table Tool] ${title}" "${EMAIL_RECIPIENTS}" || true
    fi
}

# Show usage information
show_usage() {
    cat << EOF
Disaster Recovery Script for Cap Table Tool

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  list-backups              List available backup files
  restore-full [file]       Complete database restoration
  restore-table [file] [table]  Restore specific table
  restore-pitr [timestamp]  Point-in-time recovery (Supabase)
  verify-backup [file]      Verify backup integrity
  emergency-clone           Create emergency database clone

Options:
  --target-db [name]        Target database name (default: postgres)
  --dry-run                 Show what would be done without executing
  --force                   Skip confirmation prompts

Examples:
  $0 list-backups
  $0 restore-full backups/daily/backup_daily_20240115_030000.sql.gz.enc
  $0 restore-table backups/daily/backup_daily_20240115_030000.sql.gz.enc companies
  $0 restore-pitr "2024-01-15 10:30:00"
  $0 emergency-clone

Environment Variables:
  SUPABASE_DB_HOST         Database host
  SUPABASE_DB_USER         Database user
  SUPABASE_DB_PASSWORD     Database password
  BACKUP_ENCRYPTION_KEY    Backup encryption key
  SLACK_WEBHOOK_URL        Slack notification webhook
  RECOVERY_EMAIL_RECIPIENTS Email addresses for notifications

EOF
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check required commands
    command -v psql > /dev/null || error_exit "psql is not installed"
    command -v pg_dump > /dev/null || error_exit "pg_dump is not installed"
    command -v pg_restore > /dev/null || error_exit "pg_restore is not installed"
    
    # Check database password
    if [[ -z "${DB_PASSWORD}" ]]; then
        error_exit "Database password not provided (SUPABASE_DB_PASSWORD)"
    fi
    
    # Check database connectivity
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
        -c "SELECT 1;" > /dev/null 2>&1 || error_exit "Cannot connect to database"
    
    log "Prerequisites check passed"
}

# List available backups
list_backups() {
    log "Listing available backup files..."
    
    echo "Available backup files:"
    echo "======================"
    
    for backup_type in daily weekly monthly; do
        local backup_dir="${BACKUP_DIR}/${backup_type}"
        if [[ -d "${backup_dir}" ]]; then
            echo
            echo "${backup_type} backups:"
            find "${backup_dir}" -name "backup_${backup_type}_*.sql*" -type f -exec ls -lh {} \; | \
                sort -k9 | tail -10
        fi
    done
    
    echo
    echo "Cloud backups (if configured):"
    if command -v aws &> /dev/null && [[ -n "${S3_BUCKET:-}" ]]; then
        aws s3 ls "s3://${S3_BUCKET}/" --recursive --human-readable | tail -10
    else
        echo "AWS CLI not configured or S3 bucket not specified"
    fi
}

# Prepare backup file for restoration
prepare_backup_file() {
    local backup_file="$1"
    local temp_file="${BACKUP_DIR}/temp_restore_${DATE}.sql"
    
    log "Preparing backup file for restoration: ${backup_file}"
    
    if [[ ! -f "${backup_file}" ]]; then
        error_exit "Backup file not found: ${backup_file}"
    fi
    
    # Handle different file formats
    if [[ "${backup_file}" == *.enc ]]; then
        if [[ -z "${ENCRYPTION_KEY}" ]]; then
            error_exit "Encrypted backup requires BACKUP_ENCRYPTION_KEY"
        fi
        log "Decrypting backup file..."
        openssl enc -aes-256-cbc -d -in "${backup_file}" -k "${ENCRYPTION_KEY}" | \
            gunzip > "${temp_file}" || error_exit "Failed to decrypt backup file"
    elif [[ "${backup_file}" == *.gz ]]; then
        log "Decompressing backup file..."
        gunzip -c "${backup_file}" > "${temp_file}" || error_exit "Failed to decompress backup file"
    else
        log "Using backup file directly..."
        cp "${backup_file}" "${temp_file}" || error_exit "Failed to copy backup file"
    fi
    
    echo "${temp_file}"
}

# Create database backup before restoration
create_pre_recovery_backup() {
    local target_db="$1"
    local backup_file="${BACKUP_DIR}/pre_recovery_backup_${DATE}.sql"
    
    log "Creating pre-recovery backup of ${target_db}..."
    
    PGPASSWORD="${DB_PASSWORD}" pg_dump \
        --host="${DB_HOST}" \
        --username="${DB_USER}" \
        --dbname="${target_db}" \
        --no-owner \
        --no-privileges \
        --file="${backup_file}" || error_exit "Pre-recovery backup failed"
    
    log "Pre-recovery backup created: ${backup_file}"
    echo "${backup_file}"
}

# Restore complete database
restore_full_database() {
    local backup_file="$1"
    local target_db="$2"
    local dry_run="${3:-false}"
    
    log "Starting full database restoration..."
    
    if [[ "${dry_run}" == "true" ]]; then
        log "[DRY RUN] Would restore ${backup_file} to ${target_db}"
        return 0
    fi
    
    # Confirm restoration
    echo "WARNING: This will completely replace the database '${target_db}'"
    echo "Backup file: ${backup_file}"
    echo "Target database: ${target_db}"
    echo
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [[ "${confirm}" != "yes" ]]; then
        log "Restoration cancelled by user"
        exit 0
    fi
    
    # Create pre-recovery backup
    local pre_backup
    pre_backup=$(create_pre_recovery_backup "${target_db}")
    
    # Prepare backup file
    local prepared_file
    prepared_file=$(prepare_backup_file "${backup_file}")
    
    # Perform restoration
    log "Restoring database from ${prepared_file}..."
    
    # Drop existing connections
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${target_db}' AND pid <> pg_backend_pid();" || true
    
    # Restore database
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${target_db}" \
        < "${prepared_file}" || error_exit "Database restoration failed"
    
    # Clean up temporary file
    rm -f "${prepared_file}"
    
    log "Full database restoration completed successfully"
    send_notification "RECOVERY SUCCESS" "Full database restoration completed for ${target_db}" "success"
}

# Restore specific table
restore_table() {
    local backup_file="$1"
    local table_name="$2"
    local target_db="$3"
    local dry_run="${4:-false}"
    
    log "Starting table restoration for: ${table_name}"
    
    if [[ "${dry_run}" == "true" ]]; then
        log "[DRY RUN] Would restore table ${table_name} from ${backup_file} to ${target_db}"
        return 0
    fi
    
    # Prepare backup file
    local prepared_file
    prepared_file=$(prepare_backup_file "${backup_file}")
    
    # Create temporary database for extraction
    local temp_db="temp_restore_${DATE}"
    PGPASSWORD="${DB_PASSWORD}" createdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}" || error_exit "Cannot create temporary database"
    
    # Restore to temporary database
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${temp_db}" \
        < "${prepared_file}" || {
        PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}" || true
        error_exit "Failed to restore to temporary database"
    }
    
    # Export specific table
    local table_file="${BACKUP_DIR}/table_restore_${table_name}_${DATE}.sql"
    PGPASSWORD="${DB_PASSWORD}" pg_dump \
        --host="${DB_HOST}" \
        --username="${DB_USER}" \
        --dbname="${temp_db}" \
        --table="${table_name}" \
        --data-only \
        --no-owner \
        --no-privileges \
        --file="${table_file}" || {
        PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}" || true
        error_exit "Failed to export table from temporary database"
    }
    
    # Backup current table data
    local current_table_backup="${BACKUP_DIR}/current_${table_name}_backup_${DATE}.sql"
    PGPASSWORD="${DB_PASSWORD}" pg_dump \
        --host="${DB_HOST}" \
        --username="${DB_USER}" \
        --dbname="${target_db}" \
        --table="${table_name}" \
        --file="${current_table_backup}" || true
    
    # Restore table data
    log "Restoring table ${table_name} to ${target_db}..."
    
    # Truncate existing table
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${target_db}" \
        -c "TRUNCATE TABLE ${table_name} CASCADE;" || error_exit "Failed to truncate table"
    
    # Import table data
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${target_db}" \
        < "${table_file}" || error_exit "Failed to restore table data"
    
    # Clean up
    PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}" || true
    rm -f "${prepared_file}" "${table_file}"
    
    log "Table restoration completed successfully"
    send_notification "TABLE RECOVERY SUCCESS" "Table ${table_name} restored successfully" "success"
}

# Point-in-time recovery (Supabase specific)
restore_point_in_time() {
    local timestamp="$1"
    local dry_run="${2:-false}"
    
    log "Starting point-in-time recovery to: ${timestamp}"
    
    if [[ "${dry_run}" == "true" ]]; then
        log "[DRY RUN] Would perform PITR to ${timestamp}"
        return 0
    fi
    
    echo "WARNING: Point-in-time recovery will restore the entire database to ${timestamp}"
    echo "This operation cannot be undone through this script."
    echo "Please ensure you have created a current backup before proceeding."
    echo
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [[ "${confirm}" != "yes" ]]; then
        log "Point-in-time recovery cancelled by user"
        exit 0
    fi
    
    log "Point-in-time recovery must be performed through Supabase dashboard or CLI"
    log "Timestamp: ${timestamp}"
    log "Please follow these steps:"
    echo "1. Go to Supabase dashboard -> Settings -> Database"
    echo "2. Navigate to Backups section"
    echo "3. Select 'Point in Time Recovery'"
    echo "4. Enter timestamp: ${timestamp}"
    echo "5. Confirm recovery"
    
    send_notification "PITR INITIATED" "Point-in-time recovery to ${timestamp} requires manual action" "warning"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup integrity: ${backup_file}"
    
    # Prepare backup file
    local prepared_file
    prepared_file=$(prepare_backup_file "${backup_file}")
    
    # Create temporary database for verification
    local temp_db="verify_${DATE}"
    PGPASSWORD="${DB_PASSWORD}" createdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}" || error_exit "Cannot create verification database"
    
    # Restore to temporary database
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${temp_db}" \
        < "${prepared_file}" || {
        PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}" || true
        error_exit "Backup verification failed - cannot restore"
    }
    
    # Run verification queries
    log "Running integrity checks..."
    
    local companies_count=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${temp_db}" \
        -t -c "SELECT COUNT(*) FROM companies;" | xargs)
    
    local funding_rounds_count=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${temp_db}" \
        -t -c "SELECT COUNT(*) FROM funding_rounds;" | xargs)
    
    local shareholders_count=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${temp_db}" \
        -t -c "SELECT COUNT(*) FROM shareholders;" | xargs)
    
    # Check for basic data integrity
    local integrity_check=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${temp_db}" \
        -t -c "SELECT COUNT(*) FROM funding_rounds fr LEFT JOIN companies c ON fr.company_id = c.id WHERE c.id IS NULL;" | xargs)
    
    # Clean up
    PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -U "${DB_USER}" "${temp_db}"
    rm -f "${prepared_file}"
    
    if [[ "${integrity_check}" -gt 0 ]]; then
        error_exit "Backup verification failed - data integrity issues found"
    fi
    
    log "Backup verification successful:"
    log "  - Companies: ${companies_count}"
    log "  - Funding rounds: ${funding_rounds_count}"
    log "  - Shareholders: ${shareholders_count}"
    log "  - Data integrity: OK"
    
    send_notification "BACKUP VERIFIED" "Backup integrity check passed (${companies_count} companies)" "success"
}

# Create emergency clone
emergency_clone() {
    local clone_db="emergency_clone_${DATE}"
    local dry_run="${1:-false}"
    
    log "Creating emergency database clone: ${clone_db}"
    
    if [[ "${dry_run}" == "true" ]]; then
        log "[DRY RUN] Would create emergency clone: ${clone_db}"
        return 0
    fi
    
    # Create clone database
    PGPASSWORD="${DB_PASSWORD}" createdb -h "${DB_HOST}" -U "${DB_USER}" "${clone_db}" \
        -T "${DB_NAME}" || error_exit "Failed to create emergency clone"
    
    log "Emergency clone created successfully: ${clone_db}"
    log "You can connect to the clone using: psql -h ${DB_HOST} -U ${DB_USER} -d ${clone_db}"
    
    send_notification "EMERGENCY CLONE CREATED" "Emergency database clone created: ${clone_db}" "info"
    
    echo "${clone_db}"
}

# Main function
main() {
    local command="${1:-}"
    shift || true
    
    # Parse command line arguments
    local dry_run="false"
    local force="false"
    local target_db="${TARGET_DB}"
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run)
                dry_run="true"
                shift
                ;;
            --force)
                force="true"
                shift
                ;;
            --target-db)
                target_db="$2"
                shift 2
                ;;
            *)
                break
                ;;
        esac
    done
    
    case "${command}" in
        list-backups)
            list_backups
            ;;
        restore-full)
            local backup_file="${1:-}"
            if [[ -z "${backup_file}" ]]; then
                error_exit "Backup file required for restore-full command"
            fi
            check_prerequisites
            restore_full_database "${backup_file}" "${target_db}" "${dry_run}"
            ;;
        restore-table)
            local backup_file="${1:-}"
            local table_name="${2:-}"
            if [[ -z "${backup_file}" || -z "${table_name}" ]]; then
                error_exit "Backup file and table name required for restore-table command"
            fi
            check_prerequisites
            restore_table "${backup_file}" "${table_name}" "${target_db}" "${dry_run}"
            ;;
        restore-pitr)
            local timestamp="${1:-}"
            if [[ -z "${timestamp}" ]]; then
                error_exit "Timestamp required for restore-pitr command"
            fi
            restore_point_in_time "${timestamp}" "${dry_run}"
            ;;
        verify-backup)
            local backup_file="${1:-}"
            if [[ -z "${backup_file}" ]]; then
                error_exit "Backup file required for verify-backup command"
            fi
            check_prerequisites
            verify_backup "${backup_file}"
            ;;
        emergency-clone)
            check_prerequisites
            emergency_clone "${dry_run}"
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            echo "Error: Unknown command '${command}'"
            echo
            show_usage
            exit 1
            ;;
    esac
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 1
    fi
    
    main "$@"
fi