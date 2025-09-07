# Pinia Plugin Storage - Development Setup

This repository contains the Pinia Plugin Storage package and a demo application for testing.

## Project Structure

```
├── src/                 # Plugin source code
├── dist/                # Built plugin package
├── demo/                # Demo application for testing
├── package.json         # Plugin package configuration
├── tsconfig.json        # TypeScript configuration
├── tsup.config.ts       # Build configuration
└── dev-workflow.ps1     # Development workflow script
```

## Development Workflow

### Initial Setup

1. Install plugin dependencies:
   ```bash
   npm install
   ```

2. Build the plugin:
   ```bash
   npm run build
   ```

3. Install demo dependencies:
   ```bash
   cd demo
   npm install
   ```

### Making Changes to the Plugin

When you modify the plugin source code in `src/`, follow this workflow:

1. **Build the plugin** (from root directory):
   ```bash
   npm run build
   ```

2. **Update demo dependencies** (the demo uses `file:../` dependency):
   ```bash
   cd demo
   npm install
   ```

3. **Test your changes**:
   ```bash
   npm run type-check  # Check types
   npm run dev         # Start dev server
   ```

### Quick Development Scripts

From the root directory, you can use these convenience scripts:

- `npm run dev:demo` - Build plugin and start demo dev server
- `npm run test:demo` - Build plugin and run demo type check

### Development with Watch Mode

For active development, you can run the plugin in watch mode:

1. In one terminal (root directory):
   ```bash
   npm run dev  # Builds plugin on file changes
   ```

2. In another terminal (demo directory):
   ```bash
   cd demo
   npm run dev  # Starts demo dev server
   ```

The demo will automatically pick up plugin changes when you refresh the browser, as long as you rebuild the plugin.

## Publishing the Package

When ready to publish:

1. Update version in `package.json`
2. Run `npm run build`
3. Run `npm publish`

## Local Package Testing

The demo uses a local file dependency (`"pinia-plugin-storage": "file:../"`), which means:

- Changes to the plugin require a rebuild (`npm run build`)
- Demo needs dependency update (`npm install`) after plugin rebuild
- No need for `npm link` - file dependency handles local development

## Notes

- Demo imports from `pinia-plugin-storage` package instead of relative paths
- The build outputs both ESM and CommonJS formats for maximum compatibility
