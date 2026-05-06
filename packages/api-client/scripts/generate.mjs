#!/usr/bin/env node
import { execSync } from 'node:child_process';

const url = process.env.OPENAPI_URL || 'http://localhost:8000/api/schema/';
console.log(`Generating types from: ${url}`);

try {
  execSync(
    `openapi-typescript "${url}" -o ./src/generated/schema.ts`,
    { stdio: 'inherit' }
  );
  console.log('Types generated successfully');
} catch {
  console.error('Failed to generate types');
  console.error('Make sure the backend is running at:', url);
  process.exit(1);
}