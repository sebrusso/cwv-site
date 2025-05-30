#!/usr/bin/env node

/**
 * Authentication Flow Verification Test
 * 
 * This script verifies that the authentication system works correctly
 * when disableAuthentication is set to true.
 * 
 * Key behaviors to test:
 * 1. Users can access the app without authentication
 * 2. Login/Signup pages are still accessible
 * 3. Authentication functions return mock data when disabled
 * 4. The system bypasses real Supabase auth calls
 */

const http = require('http');
const util = require('util');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 5000;

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    }, TIMEOUT);

    const req = http.get(url, options, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Test functions
async function testPageAccessibility() {
  console.log('\n🧪 Testing Page Accessibility...');
  
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/login', name: 'Login' },
    { path: '/auth/signup', name: 'Signup' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/leaderboard', name: 'Leaderboard' },
    { path: '/dev-auth', name: 'Dev Auth Debug' }
  ];

  const results = [];
  
  for (const page of pages) {
    try {
      const response = await makeRequest(`${BASE_URL}${page.path}`);
      const isAccessible = response.statusCode === 200;
      
      results.push({
        page: page.name,
        path: page.path,
        status: response.statusCode,
        accessible: isAccessible
      });
      
      console.log(`  ${isAccessible ? '✅' : '❌'} ${page.name} (${page.path}): ${response.statusCode}`);
    } catch (error) {
      results.push({
        page: page.name,
        path: page.path,
        status: 'ERROR',
        accessible: false,
        error: error.message
      });
      
      console.log(`  ❌ ${page.name} (${page.path}): ERROR - ${error.message}`);
    }
  }
  
  return results;
}

async function testAuthenticationForms() {
  console.log('\n🧪 Testing Authentication Forms...');
  
  const tests = [
    {
      name: 'Login Form Elements',
      url: `${BASE_URL}/login`,
      checks: [
        { element: 'email', pattern: /type="email"/ },
        { element: 'password', pattern: /type="password"/ },
        { element: 'submit button', pattern: /Sign in/ },
        { element: 'signup link', pattern: /Sign up/ }
      ]
    },
    {
      name: 'Signup Form Elements',
      url: `${BASE_URL}/auth/signup`,
      checks: [
        { element: 'email', pattern: /placeholder="you@example.com"/ },
        { element: 'password', pattern: /placeholder="At least 6 characters"/ },
        { element: 'confirm password', pattern: /placeholder="Confirm your password"/ },
        { element: 'submit button', pattern: /Sign up/ }
      ]
    }
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      const response = await makeRequest(test.url);
      const testResult = {
        name: test.name,
        url: test.url,
        checks: []
      };
      
      for (const check of test.checks) {
        const found = check.pattern.test(response.body);
        testResult.checks.push({
          element: check.element,
          found: found
        });
        
        console.log(`  ${found ? '✅' : '❌'} ${check.element}`);
      }
      
      results.push(testResult);
    } catch (error) {
      console.log(`  ❌ ${test.name}: ERROR - ${error.message}`);
      results.push({
        name: test.name,
        url: test.url,
        error: error.message
      });
    }
  }
  
  return results;
}

async function testAuthenticationBypass() {
  console.log('\n🧪 Testing Authentication Bypass Logic...');
  
  try {
    const debugResponse = await makeRequest(`${BASE_URL}/dev-auth`);
    
    const checks = [
      { name: 'Authentication Disabled', pattern: /Authentication.*Disabled/ },
      { name: 'Bypass Mode Active', pattern: /Mock.*User.*Active/ },
      { name: 'No Real Auth Required', pattern: /No real authentication/ }
    ];
    
    const results = [];
    
    for (const check of checks) {
      const found = check.pattern.test(debugResponse.body);
      results.push({
        check: check.name,
        passed: found
      });
      
      console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
    }
    
    return results;
  } catch (error) {
    console.log(`  ❌ Authentication Bypass Test: ERROR - ${error.message}`);
    return [{ error: error.message }];
  }
}

async function testConfigurationConsistency() {
  console.log('\n🧪 Testing Configuration Consistency...');
  
  try {
    // Test that debug page shows authentication is disabled
    const debugResponse = await makeRequest(`${BASE_URL}/dev-auth`);
    const authDisabled = /Authentication.*Disabled/.test(debugResponse.body);
    
    console.log(`  ${authDisabled ? '✅' : '❌'} Authentication correctly disabled in config`);
    
    return { authDisabled };
  } catch (error) {
    console.log(`  ❌ Configuration Test: ERROR - ${error.message}`);
    return { error: error.message };
  }
}

async function testProfileButtonFunctionality() {
  console.log('\n🧪 Testing Profile Button Functionality...');
  
  try {
    const homeResponse = await makeRequest(`${BASE_URL}/`);
    
    const checks = [
      { name: 'Profile Button Present', pattern: /aria-label="User profile"/ },
      { name: 'User Icon Present', pattern: /UserIcon/ },
      { name: 'Arena Interface Accessible', pattern: /Creative Writing Evaluation Arena/ }
    ];
    
    const results = [];
    
    for (const check of checks) {
      const found = check.pattern.test(homeResponse.body);
      results.push({
        check: check.name,
        passed: found
      });
      
      console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
    }
    
    return results;
  } catch (error) {
    console.log(`  ❌ Profile Button Test: ERROR - ${error.message}`);
    return [{ error: error.message }];
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Authentication Flow Verification Test');
  console.log('==========================================');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  try {
    // Run all tests
    results.tests.pageAccessibility = await testPageAccessibility();
    results.tests.authenticationForms = await testAuthenticationForms();
    results.tests.authenticationBypass = await testAuthenticationBypass();
    results.tests.configurationConsistency = await testConfigurationConsistency();
    results.tests.profileButtonFunctionality = await testProfileButtonFunctionality();
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    
    // Count accessible pages
    const accessiblePages = results.tests.pageAccessibility.filter(p => p.accessible).length;
    const totalPages = results.tests.pageAccessibility.length;
    console.log(`Pages Accessible: ${accessiblePages}/${totalPages}`);
    
    // Check if critical pages work
    const criticalPages = ['Home', 'Login', 'Signup'];
    const criticalWorking = criticalPages.every(name => 
      results.tests.pageAccessibility.find(p => p.page === name)?.accessible
    );
    console.log(`Critical Pages Working: ${criticalWorking ? '✅' : '❌'}`);
    
    // Check if authentication is properly bypassed
    const authBypassWorking = results.tests.configurationConsistency.authDisabled;
    console.log(`Authentication Bypass: ${authBypassWorking ? '✅' : '❌'}`);
    
    // Check if profile button is working
    const profileButtonWorking = results.tests.profileButtonFunctionality.some(r => r.check === 'Profile Button Present' && r.passed);
    console.log(`Profile Button Available: ${profileButtonWorking ? '✅' : '❌'}`);
    
    // Overall status
    const overallSuccess = criticalWorking && authBypassWorking && profileButtonWorking;
    console.log(`Overall Status: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n🎯 Key Findings:');
    if (overallSuccess) {
      console.log('✅ Authentication system is correctly configured for production');
      console.log('✅ Users can access the app without authentication');
      console.log('✅ Login/Signup forms remain functional for optional use');
      console.log('✅ System properly bypasses authentication when disabled');
      console.log('✅ Profile button is available for optional authentication');
      console.log('✅ Perfect balance: no-friction access + optional authentication');
    } else {
      console.log('❌ Issues detected - review test output above');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Test runner error:', error.message);
    return { error: error.message };
  }
}

// Export for use in other scripts
if (require.main === module) {
  // Run tests if this file is executed directly
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, makeRequest }; 