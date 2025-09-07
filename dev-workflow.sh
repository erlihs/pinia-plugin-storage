#!/bin/bash
# Development workflow script

echo "Building plugin package..."
npm run build

echo "Updating demo dependencies..."
cd demo
npm install

echo "Running type check..."
npm run type-check

echo "Done! You can now run 'npm run dev' in the demo folder to test your changes."
