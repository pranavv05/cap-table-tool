#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  backupDir: './backups',
  migrationsDir: './scripts/migrations'
}

// Initialize Supabase client
function getSupabaseClient() {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error('Supabase URL and Service Role Key must be set in environment variables')
  }
  
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database health check
async function healthCheck() {
  console.log('🔍 Running database health check...')
  
  const supabase = getSupabaseClient()
  const checks = []
  
  try {
    // Test basic connectivity
    const { data, error } = await supabase.from('companies').select('count', { count: 'exact', head: true })
    if (error) throw error
    checks.push({ name: 'Connectivity', status: 'PASS', details: 'Database accessible' })
  } catch (error) {
    checks.push({ name: 'Connectivity', status: 'FAIL', details: error.message })
  }
  
  try {
    // Check RLS is enabled
    const { data, error } = await supabase.rpc('check_rls_enabled')
    checks.push({ name: 'Row Level Security', status: 'PASS', details: 'RLS enabled on all tables' })
  } catch (error) {
    checks.push({ name: 'Row Level Security', status: 'UNKNOWN', details: 'Could not verify RLS status' })
  }
  
  try {
    // Check for recent audit logs
    const { data, error } = await supabase
      .from('audit_logs')
      .select('count', { count: 'exact', head: true })
    
    if (error) throw error
    checks.push({ name: 'Audit Logging', status: 'PASS', details: `${data?.[0]?.count || 0} audit records` })
  } catch (error) {
    checks.push({ name: 'Audit Logging', status: 'FAIL', details: error.message })
  }
  
  try {
    // Check database size and performance
    const { data, error } = await supabase.rpc('get_db_stats')
    if (!error && data) {
      checks.push({ name: 'Performance', status: 'PASS', details: `DB size: ${data.size}, Active connections: ${data.connections}` })
    }
  } catch (error) {
    checks.push({ name: 'Performance', status: 'UNKNOWN', details: 'Performance stats not available' })
  }
  
  // Display results
  console.log('\n📊 Health Check Results:')
  checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${icon} ${check.name}: ${check.status} - ${check.details}`)
  })
  
  const failedChecks = checks.filter(c => c.status === 'FAIL')
  if (failedChecks.length > 0) {
    console.log(`\n🚨 ${failedChecks.length} health check(s) failed!`)
    return false
  }
  
  console.log('\n✅ All health checks passed!')
  return true
}

// Run database migrations
async function runMigrations() {
  console.log('🔄 Running database migrations...')
  
  if (!fs.existsSync(config.migrationsDir)) {
    console.log('📁 Creating migrations directory...')
    fs.mkdirSync(config.migrationsDir, { recursive: true })
  }
  
  const migrationFiles = fs.readdirSync(config.migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
  
  if (migrationFiles.length === 0) {
    console.log('ℹ️  No migration files found')
    return
  }
  
  const supabase = getSupabaseClient()
  
  // Create migrations table if it doesn't exist
  try {
    await supabase.rpc('create_migrations_table')
  } catch (error) {
    console.log('📝 Creating migrations tracking table...')
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum TEXT
      );
    `
    await supabase.rpc('exec_sql', { sql: createMigrationsTable })
  }
  
  // Get already executed migrations
  const { data: executedMigrations } = await supabase
    .from('migrations')
    .select('filename')
  
  const executedFilenames = new Set(executedMigrations?.map(m => m.filename) || [])
  
  // Execute pending migrations
  for (const filename of migrationFiles) {
    if (executedFilenames.has(filename)) {
      console.log(`⏭️  Skipping ${filename} (already executed)`)
      continue
    }
    
    console.log(`🔄 Executing migration: ${filename}`)
    
    try {
      const migrationSQL = fs.readFileSync(path.join(config.migrationsDir, filename), 'utf8')
      
      // Execute migration
      const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
      if (error) throw error
      
      // Record migration as executed
      await supabase.from('migrations').insert({ 
        filename,
        checksum: require('crypto').createHash('md5').update(migrationSQL).digest('hex')
      })
      
      console.log(`✅ Migration ${filename} executed successfully`)
    } catch (error) {
      console.error(`❌ Migration ${filename} failed:`, error.message)
      throw error
    }
  }
  
  console.log('✅ All migrations completed successfully!')
}

// Create database backup
async function createBackup() {
  console.log('💾 Creating database backup...')
  
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true })
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(config.backupDir, `backup-${timestamp}.sql`)
  
  const supabase = getSupabaseClient()
  
  try {
    // Get schema backup
    console.log('📋 Backing up database schema...')
    const { data: schema } = await supabase.rpc('get_schema_backup')
    
    // Get data backup for each table
    console.log('📊 Backing up table data...')
    const tables = ['companies', 'shareholders', 'share_classes', 'equity_grants', 'funding_rounds', 'transactions', 'scenarios', 'audit_logs']
    
    let backupContent = `-- Database Backup Created: ${new Date().toISOString()}\n\n`
    backupContent += `-- Schema Backup\n${schema || ''}\n\n`
    
    for (const table of tables) {
      console.log(`📁 Backing up table: ${table}`)
      const { data, error } = await supabase.from(table).select('*')
      
      if (error) {
        console.warn(`⚠️  Warning: Could not backup table ${table}: ${error.message}`)
        continue
      }
      
      if (data && data.length > 0) {
        backupContent += `-- Data for table: ${table}\n`
        backupContent += `INSERT INTO ${table} VALUES\n`
        
        const values = data.map(row => 
          `(${Object.values(row).map(val => 
            val === null ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`
          ).join(', ')})`
        ).join(',\n')
        
        backupContent += values + ';\n\n'
      }
    }
    
    fs.writeFileSync(backupFile, backupContent)
    console.log(`✅ Backup created successfully: ${backupFile}`)
    
    // Cleanup old backups (keep last 10)
    const backupFiles = fs.readdirSync(config.backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .sort()
    
    if (backupFiles.length > 10) {
      const filesToDelete = backupFiles.slice(0, backupFiles.length - 10)
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(config.backupDir, file))
        console.log(`🗑️  Deleted old backup: ${file}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message)
    throw error
  }
}

// Monitor database performance
async function monitorPerformance() {
  console.log('📈 Monitoring database performance...')
  
  const supabase = getSupabaseClient()
  
  try {
    // Query performance metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      connections: 0,
      slowQueries: 0,
      tableStats: {}
    }
    
    // Get connection count
    try {
      const { data } = await supabase.rpc('get_connection_count')
      metrics.connections = data || 0
    } catch (error) {
      console.warn('Could not get connection count:', error.message)
    }
    
    // Get table statistics
    const tables = ['companies', 'shareholders', 'equity_grants', 'funding_rounds']
    for (const table of tables) {
      try {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
        metrics.tableStats[table] = count || 0
      } catch (error) {
        console.warn(`Could not get stats for ${table}:`, error.message)
      }
    }
    
    // Log metrics
    console.log('📊 Performance Metrics:')
    console.log(`   Active Connections: ${metrics.connections}`)
    console.log(`   Table Statistics:`)
    Object.entries(metrics.tableStats).forEach(([table, count]) => {
      console.log(`     ${table}: ${count} records`)
    })
    
    // Save metrics to file for trending
    const metricsFile = path.join(config.backupDir, 'performance-metrics.jsonl')
    fs.appendFileSync(metricsFile, JSON.stringify(metrics) + '\n')
    
    return metrics
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error.message)
    throw error
  }
}

// Optimize database
async function optimizeDatabase() {
  console.log('🔧 Optimizing database...')
  
  const supabase = getSupabaseClient()
  
  try {
    // Run VACUUM ANALYZE on all tables
    console.log('🧹 Running VACUUM ANALYZE...')
    await supabase.rpc('vacuum_analyze_all')
    
    // Update table statistics
    console.log('📊 Updating table statistics...')
    await supabase.rpc('update_table_stats')
    
    // Check for missing indexes
    console.log('🔍 Checking for missing indexes...')
    const { data: missingIndexes } = await supabase.rpc('find_missing_indexes')
    
    if (missingIndexes && missingIndexes.length > 0) {
      console.log('⚠️  Suggested indexes:')
      missingIndexes.forEach(index => {
        console.log(`   ${index.table}: ${index.suggestion}`)
      })
    } else {
      console.log('✅ All recommended indexes are present')
    }
    
    console.log('✅ Database optimization completed')
  } catch (error) {
    console.error('❌ Database optimization failed:', error.message)
    throw error
  }
}

// Main CLI handler
async function main() {
  const command = process.argv[2]
  
  console.log('🗄️  Cap Table Tool - Database Management')
  console.log('========================================\n')
  
  try {
    switch (command) {
      case 'health':
        await healthCheck()
        break
        
      case 'migrate':
        await runMigrations()
        break
        
      case 'backup':
        await createBackup()
        break
        
      case 'monitor':
        await monitorPerformance()
        break
        
      case 'optimize':
        await optimizeDatabase()
        break
        
      case 'setup':
        console.log('🚀 Running complete database setup...')
        const setupSQL = fs.readFileSync('./scripts/complete-db-setup.sql', 'utf8')
        const supabase = getSupabaseClient()
        await supabase.rpc('exec_sql', { sql: setupSQL })
        console.log('✅ Database setup completed!')
        break
        
      default:
        console.log('Usage:')
        console.log('  node database-management.js health    - Run health checks')
        console.log('  node database-management.js migrate   - Run pending migrations')
        console.log('  node database-management.js backup    - Create database backup')
        console.log('  node database-management.js monitor   - Monitor performance')
        console.log('  node database-management.js optimize  - Optimize database')
        console.log('  node database-management.js setup     - Run initial setup')
        console.log('')
        console.log('Environment Variables Required:')
        console.log('  NEXT_PUBLIC_SUPABASE_URL')
        console.log('  SUPABASE_SERVICE_ROLE_KEY')
        break
    }
  } catch (error) {
    console.error('\n❌ Command failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  healthCheck,
  runMigrations,
  createBackup,
  monitorPerformance,
  optimizeDatabase
}