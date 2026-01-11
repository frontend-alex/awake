#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const serverExamplePath = path.join('app', 'server', '.env.example');
const mobileExamplePath = path.join('app', 'mobile', '.env.example');

const serverEnvPath = path.join('app', 'server', '.env');
const mobileEnvPath = path.join('app', 'mobile', '.env');

if (!fs.existsSync(serverExamplePath)) {
  console.error('Server .env.example file not found at:', serverExamplePath);
  process.exit(1);
}

const serverDir = path.dirname(serverEnvPath);
const mobileDir = path.dirname(mobileEnvPath);

if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}

if (!fs.existsSync(mobileDir)) {
  fs.mkdirSync(mobileDir, { recursive: true });
}

// Copy server .env
fs.copyFileSync(serverExamplePath, serverEnvPath);
console.log('Server .env:', serverEnvPath);

// Copy mobile .env if example exists
if (fs.existsSync(mobileExamplePath)) {
  fs.copyFileSync(mobileExamplePath, mobileEnvPath);
  console.log('Mobile .env:', mobileEnvPath);
} else {
  console.log('Mobile .env.example not found, skipping mobile env setup');
}

console.log('');
console.log('Environment files created successfully!');
console.log('Remember to update the values in your .env files as needed!');
