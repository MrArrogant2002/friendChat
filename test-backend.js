#!/usr/bin/env node
/**
 * Backend Integration Test Script
 * Tests connectivity to Vercel API and Render Socket.IO server
 */

const https = require('https');

const VERCEL_API = 'https://friend-chat-seven.vercel.app/api';
const RENDER_SOCKET = 'https://friendchat-8nfh.onrender.com';

console.log('🧪 Testing Backend Integration...\n');

// Test Vercel API
function testVercelAPI() {
  return new Promise((resolve) => {
    console.log('1️⃣  Testing Vercel API...');
    https
      .get(`${VERCEL_API}/auth/profile`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 401) {
            console.log(
              '   ✅ Vercel API is responding (401 Unauthorized - expected without token)'
            );
            resolve(true);
          } else {
            console.log(`   ⚠️  Unexpected status code: ${res.statusCode}`);
            console.log(`   Response: ${data}`);
            resolve(false);
          }
        });
      })
      .on('error', (err) => {
        console.log('   ❌ Vercel API connection failed:', err.message);
        resolve(false);
      });
  });
}

// Test Render Socket.IO
function testRenderSocket() {
  return new Promise((resolve) => {
    console.log('\n2️⃣  Testing Render Socket.IO Server...');
    https
      .get(`${RENDER_SOCKET}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            const health = JSON.parse(data);
            console.log('   ✅ Socket.IO server is healthy');
            console.log(`   Service: ${health.service}`);
            console.log(`   Uptime: ${Math.floor(health.uptime)}s`);
            resolve(true);
          } else {
            console.log(`   ❌ Unexpected status code: ${res.statusCode}`);
            resolve(false);
          }
        });
      })
      .on('error', (err) => {
        console.log('   ❌ Socket.IO server connection failed:', err.message);
        resolve(false);
      });
  });
}

// Run tests
async function runTests() {
  const apiOk = await testVercelAPI();
  const socketOk = await testRenderSocket();

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log(`   Vercel API:        ${apiOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Render Socket.IO:  ${socketOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(50));

  if (apiOk && socketOk) {
    console.log('\n🎉 All backend services are operational!');
    console.log('\n📱 Your Expo app should connect successfully.');
    console.log('\nNext steps:');
    console.log('   1. Start Expo: npm start');
    console.log('   2. Open on device/emulator');
    console.log('   3. Register a new account');
    console.log('   4. Test chat functionality\n');
  } else {
    console.log('\n⚠️  Some backend services are not responding.');
    console.log('Check your deployment dashboards:\n');
    console.log('   Vercel:  https://vercel.com/dashboard');
    console.log('   Render:  https://dashboard.render.com\n');
  }

  process.exit(apiOk && socketOk ? 0 : 1);
}

runTests().catch(console.error);
