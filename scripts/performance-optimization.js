#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Performance optimization configuration
const config = {
  bundleAnalysisDir: './analysis',
  cacheDir: './.next/cache',
  publicDir: './public',
  componentsDir: './components',
  maxBundleSize: 500 * 1024, // 500KB
  maxImageSize: 2 * 1024 * 1024, // 2MB
  performanceThresholds: {
    fcp: 1800, // First Contentful Paint
    lcp: 2500, // Largest Contentful Paint
    fid: 100,  // First Input Delay
    cls: 0.1   // Cumulative Layout Shift
  }
}

// Bundle analysis
async function analyzeBundles() {
  console.log('📦 Analyzing bundle sizes...')
  
  if (!fs.existsSync(config.bundleAnalysisDir)) {
    fs.mkdirSync(config.bundleAnalysisDir, { recursive: true })
  }
  
  try {
    // Build with bundle analyzer
    console.log('🔨 Building with bundle analyzer...')
    process.env.ANALYZE = 'true'
    execSync('npm run build', { stdio: 'inherit' })
    
    // Analyze build output
    const buildManifest = '.next/build-manifest.json'
    if (fs.existsSync(buildManifest)) {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'))
      
      console.log('\n📊 Bundle Analysis Results:')
      
      // Calculate bundle sizes
      const bundleSizes = {}
      const totalSize = Object.entries(manifest.pages).reduce((total, [page, files]) => {
        let pageSize = 0
        files.forEach(file => {
          const filePath = path.join('.next', file)
          if (fs.existsSync(filePath)) {
            const size = fs.statSync(filePath).size
            pageSize += size
          }
        })
        bundleSizes[page] = pageSize
        return total + pageSize
      }, 0)
      
      console.log(`   Total Bundle Size: ${formatBytes(totalSize)}`)
      
      // Show largest bundles
      const sortedBundles = Object.entries(bundleSizes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
      
      console.log('\n📈 Largest Page Bundles:')
      sortedBundles.forEach(([page, size]) => {
        const status = size > config.maxBundleSize ? '⚠️' : '✅'
        console.log(`   ${status} ${page}: ${formatBytes(size)}`)
      })
      
      // Generate recommendations
      const recommendations = generateBundleRecommendations(bundleSizes)
      if (recommendations.length > 0) {
        console.log('\n💡 Optimization Recommendations:')
        recommendations.forEach(rec => console.log(`   • ${rec}`))
      }
      
      // Save analysis results
      const analysisResult = {
        timestamp: new Date().toISOString(),
        totalSize,
        bundleSizes,
        recommendations,
        thresholdViolations: sortedBundles.filter(([, size]) => size > config.maxBundleSize)
      }
      
      fs.writeFileSync(
        path.join(config.bundleAnalysisDir, 'bundle-analysis.json'),
        JSON.stringify(analysisResult, null, 2)
      )
      
    } else {
      console.log('⚠️  Build manifest not found')
    }
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message)
    throw error
  }
}

// Image optimization analysis
function analyzeImages() {
  console.log('🖼️  Analyzing image optimization...')
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']
  const images = []
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        scanDirectory(filePath)
      } else if (imageExtensions.includes(path.extname(file).toLowerCase())) {
        images.push({
          path: filePath,
          size: stat.size,
          extension: path.extname(file).toLowerCase()
        })
      }
    })
  }
  
  scanDirectory(config.publicDir)
  
  console.log(`\n📊 Found ${images.length} images`)
  
  // Analyze image sizes
  const largeImages = images.filter(img => img.size > config.maxImageSize)
  const unoptimizedImages = images.filter(img => !['.webp', '.avif'].includes(img.extension))
  
  if (largeImages.length > 0) {
    console.log('\n⚠️  Large Images (>2MB):')
    largeImages.forEach(img => {
      console.log(`   ${img.path}: ${formatBytes(img.size)}`)
    })
  }
  
  if (unoptimizedImages.length > 0) {
    console.log(`\n💡 Consider converting ${unoptimizedImages.length} images to WebP/AVIF format`)
  }
  
  // Generate image optimization recommendations
  const imageRecommendations = []
  
  if (largeImages.length > 0) {
    imageRecommendations.push('Compress large images or use responsive images')
  }
  
  if (unoptimizedImages.length > 0) {
    imageRecommendations.push('Convert images to modern formats (WebP, AVIF)')
  }
  
  const duplicateImages = findDuplicateImages(images)
  if (duplicateImages.length > 0) {
    imageRecommendations.push(`Remove ${duplicateImages.length} duplicate images`)
  }
  
  return {
    totalImages: images.length,
    totalSize: images.reduce((sum, img) => sum + img.size, 0),
    largeImages: largeImages.length,
    unoptimizedImages: unoptimizedImages.length,
    recommendations: imageRecommendations
  }
}

// Performance testing
async function runPerformanceTests() {
  console.log('🚀 Running performance tests...')
  
  try {
    // Build the application
    console.log('🔨 Building application for performance testing...')
    execSync('npm run build', { stdio: 'inherit' })
    
    // Start the application
    console.log('🌐 Starting application server...')
    const serverProcess = execSync('npm start &', { stdio: 'pipe' })
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Run Lighthouse audit
    console.log('🔍 Running Lighthouse performance audit...')
    
    const lighthouseConfig = {
      extends: 'lighthouse:default',
      settings: {
        onlyCategories: ['performance'],
        chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
      }
    }
    
    try {
      const lighthouse = require('lighthouse')
      const chromeLauncher = require('chrome-launcher')
      
      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
      const options = { logLevel: 'info', output: 'json', port: chrome.port }
      
      const runnerResult = await lighthouse('http://localhost:3000', options, lighthouseConfig)
      
      await chrome.kill()
      
      // Parse results
      const results = runnerResult.lhr
      const performance = results.categories.performance.score * 100
      
      console.log(`\n📊 Performance Score: ${performance}/100`)
      
      // Core Web Vitals
      const coreWebVitals = {
        fcp: results.audits['first-contentful-paint'].numericValue,
        lcp: results.audits['largest-contentful-paint'].numericValue,
        fid: results.audits['max-potential-fid'].numericValue,
        cls: results.audits['cumulative-layout-shift'].numericValue
      }
      
      console.log('\n📈 Core Web Vitals:')
      Object.entries(coreWebVitals).forEach(([metric, value]) => {
        const threshold = config.performanceThresholds[metric]
        const status = value <= threshold ? '✅' : '⚠️'
        console.log(`   ${status} ${metric.toUpperCase()}: ${value}ms (threshold: ${threshold}ms)`)
      })
      
      // Performance recommendations
      const opportunities = results.audits
      const significantOpportunities = Object.entries(opportunities)
        .filter(([key, audit]) => audit.scoreDisplayMode === 'numeric' && audit.numericValue > 1000)
        .map(([key, audit]) => ({
          id: key,
          title: audit.title,
          description: audit.description,
          savings: audit.numericValue
        }))
      
      if (significantOpportunities.length > 0) {
        console.log('\n💡 Performance Opportunities:')
        significantOpportunities.forEach(opp => {
          console.log(`   • ${opp.title}: ${formatBytes(opp.savings)} potential savings`)
        })
      }
      
      // Save performance results
      const performanceResult = {
        timestamp: new Date().toISOString(),
        score: performance,
        coreWebVitals,
        opportunities: significantOpportunities,
        passedThresholds: Object.entries(coreWebVitals).filter(([metric, value]) => 
          value <= config.performanceThresholds[metric]
        ).length
      }
      
      fs.writeFileSync(
        path.join(config.bundleAnalysisDir, 'performance-results.json'),
        JSON.stringify(performanceResult, null, 2)
      )
      
    } catch (error) {
      console.log('⚠️  Lighthouse not available, skipping detailed performance audit')
      console.log('   Install with: npm install -g lighthouse')
    }
    
    // Stop the server
    try {
      execSync('pkill -f "next start"')
    } catch (error) {
      // Process might already be stopped
    }
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error.message)
    throw error
  }
}

// Cache optimization
function optimizeCache() {
  console.log('🗄️  Optimizing cache configuration...')
  
  const cacheConfig = {
    // Static assets caching
    staticAssets: {
      maxAge: 31536000, // 1 year
      immutable: true
    },
    
    // API responses caching
    apiResponses: {
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 600 // 10 minutes
    },
    
    // Page caching
    pages: {
      maxAge: 60, // 1 minute
      staleWhileRevalidate: 300 // 5 minutes
    }
  }
  
  // Generate cache headers configuration
  const cacheHeaders = `
// Cache Configuration for Production
const cacheConfig = {
  // Static assets (JS, CSS, Images)
  '/_next/static/**': {
    'Cache-Control': 'public, max-age=31536000, immutable'
  },
  
  // API routes
  '/api/**': {
    'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=600'
  },
  
  // Pages
  '/': {
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=300'
  },
  
  // Dashboard (authenticated, no cache)
  '/dashboard/**': {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate'
  }
}

module.exports = cacheConfig
`
  
  fs.writeFileSync('./cache-config.js', cacheHeaders)
  console.log('✅ Cache configuration saved to cache-config.js')
  
  return cacheConfig
}

// Generate service worker for caching
function generateServiceWorker() {
  console.log('⚙️  Generating service worker for advanced caching...')
  
  const serviceWorkerCode = `
// Service Worker for Cap Table Tool
const CACHE_NAME = 'cap-table-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/_next/static/css/',
  '/_next/static/chunks/'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return
  
  // Skip API requests (handle differently)
  if (event.request.url.includes('/api/')) return
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response
        }
        
        // Fetch from network
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone)
                })
            }
            return response
          })
      })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
`
  
  fs.writeFileSync('./public/sw.js', serviceWorkerCode)
  console.log('✅ Service worker generated at public/sw.js')
}

// Helper functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function generateBundleRecommendations(bundleSizes) {
  const recommendations = []
  
  // Check for large bundles
  const largeBundles = Object.entries(bundleSizes).filter(([, size]) => size > config.maxBundleSize)
  if (largeBundles.length > 0) {
    recommendations.push('Split large bundles using dynamic imports')
    recommendations.push('Implement code splitting for heavy components')
  }
  
  // Check for duplicate dependencies
  recommendations.push('Run bundle analyzer to identify duplicate dependencies')
  recommendations.push('Use tree shaking to eliminate unused code')
  recommendations.push('Consider replacing heavy libraries with lighter alternatives')
  
  return recommendations
}

function findDuplicateImages(images) {
  const sizeMap = new Map()
  const duplicates = []
  
  images.forEach(img => {
    const key = `${img.size}-${path.basename(img.path)}`
    if (sizeMap.has(key)) {
      duplicates.push(img)
    } else {
      sizeMap.set(key, img)
    }
  })
  
  return duplicates
}

// Main CLI handler
async function main() {
  const command = process.argv[2]
  
  console.log('⚡ Cap Table Tool - Performance Optimization')
  console.log('===========================================\n')
  
  try {
    switch (command) {
      case 'analyze':
        await analyzeBundles()
        const imageAnalysis = analyzeImages()
        console.log('\n🖼️  Image Analysis Results:')
        console.log(`   Total Images: ${imageAnalysis.totalImages}`)
        console.log(`   Total Size: ${formatBytes(imageAnalysis.totalSize)}`)
        console.log(`   Large Images: ${imageAnalysis.largeImages}`)
        console.log(`   Unoptimized: ${imageAnalysis.unoptimizedImages}`)
        if (imageAnalysis.recommendations.length > 0) {
          console.log('\n💡 Image Optimization Recommendations:')
          imageAnalysis.recommendations.forEach(rec => console.log(`   • ${rec}`))
        }
        break
        
      case 'test':
        await runPerformanceTests()
        break
        
      case 'cache':
        optimizeCache()
        generateServiceWorker()
        break
        
      case 'all':
        console.log('🚀 Running complete performance optimization...')
        await analyzeBundles()
        analyzeImages()
        await runPerformanceTests()
        optimizeCache()
        generateServiceWorker()
        console.log('\n✅ Performance optimization completed!')
        break
        
      default:
        console.log('Usage:')
        console.log('  node performance-optimization.js analyze  - Analyze bundle sizes and images')
        console.log('  node performance-optimization.js test     - Run performance tests')
        console.log('  node performance-optimization.js cache    - Optimize caching configuration')
        console.log('  node performance-optimization.js all      - Run all optimizations')
        console.log('')
        console.log('Optional Dependencies:')
        console.log('  npm install -g lighthouse  - For detailed performance audits')
        break
    }
  } catch (error) {
    console.error('\n❌ Performance optimization failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  analyzeBundles,
  analyzeImages,
  runPerformanceTests,
  optimizeCache,
  generateServiceWorker
}