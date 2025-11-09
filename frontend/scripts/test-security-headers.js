#!/usr/bin/env node

/**
 * Security Headers Test Script
 * 
 * This script tests if the security headers are properly configured
 * by making HTTP requests to the application and checking response headers.
 */

const https = require('https');
const http = require('http');

// Configuration
const TEST_URLS = [
  'http://localhost:3000',
  'http://localhost:3000/auth/login',
  'http://localhost:3000/dictionaries/my',
];

// Expected security headers
const EXPECTED_HEADERS = {
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy': (value) => {
    if (!value) return false;
    // Check for basic CSP directives
    const hasDefaultSrc = value.includes('default-src');
    const hasConnectSrc = value.includes('connect-src');
    const hasApiUrl = value.includes('localhost:5000') || value.includes('http://localhost:5000');
    return hasDefaultSrc && hasConnectSrc && hasApiUrl;
  },
  'permissions-policy': (value) => value && value.includes('camera=()'),
  'x-dns-prefetch-control': 'on',
  'strict-transport-security': (value) => value && value.includes('max-age'),
};

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, { method: 'HEAD' }, (res) => {
      resolve({
        url,
        statusCode: res.statusCode,
        headers: res.headers
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

function checkHeaders(headers) {
  const results = {};
  
  for (const [headerName, expectedValue] of Object.entries(EXPECTED_HEADERS)) {
    const actualValue = headers[headerName.toLowerCase()];
    
    if (typeof expectedValue === 'function') {
      results[headerName] = expectedValue(actualValue);
    } else {
      results[headerName] = actualValue === expectedValue;
    }
  }
  
  return results;
}

function formatResults(results) {
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n📊 Security Headers Test Results: ${passed}/${total} passed\n`);
  
  for (const [headerName, passed] of Object.entries(results)) {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${headerName}`);
  }
  
  return passed === total;
}

async function testSecurityHeaders() {
  console.log('🔒 Testing Security Headers...\n');
  
  try {
    const results = await Promise.all(
      TEST_URLS.map(url => makeRequest(url))
    );
    
    console.log('📡 Response Headers Found:');
    results.forEach(({ url, statusCode, headers }) => {
      console.log(`\n🌐 ${url} (${statusCode})`);
      Object.keys(EXPECTED_HEADERS).forEach(headerName => {
        const value = headers[headerName.toLowerCase()];
        if (value) {
          console.log(`   ${headerName}: ${value}`);
        }
      });
    });
    
    // Check headers from the first successful response
    const firstResult = results.find(r => r.statusCode === 200);
    if (firstResult) {
      const headerResults = checkHeaders(firstResult.headers);
      const allPassed = formatResults(headerResults);
      
      if (allPassed) {
        console.log('\n🎉 All security headers are properly configured!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some security headers are missing or incorrect.');
        process.exit(1);
      }
    } else {
      console.log('\n❌ No successful responses received. Make sure the server is running.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing security headers:', error.message);
    console.log('\n💡 Make sure to start the development server first:');
    console.log('   npm run dev');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testSecurityHeaders();
}

module.exports = { testSecurityHeaders, checkHeaders };
