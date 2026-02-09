#!/bin/bash

# Exit on error
set -e

echo "Building ccms-components..."

npm ci
npm run format:check
npm run lint
npm run test:ci
npm run build:shared
npm run build:elements

echo "Build completed successfully!"
