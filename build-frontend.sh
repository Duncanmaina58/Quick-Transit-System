#!/bin/bash
set -e
echo "=== Node Version ==="
node --version
echo "=== Installing dependencies ==="
npm install
echo "=== Building ==="
npm run build