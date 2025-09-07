# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-09-07

### Added
- Initial release of @erlihs/pinia-plugin-storage
- Multi-adapter support for localStorage, sessionStorage, cookies, and indexedDB
- Selective persistence with include/exclude options
- Multiple buckets system for different storage adapters
- Automatic state hydration on app initialization
- Real-time synchronization across browser tabs/windows
- Debounced persistence for optimized write performance
- Namespace and versioning support for storage key management
- State transformation hooks (before/after hydration)
- SSR-safe with environment detection
- Comprehensive error handling with custom error callbacks
- TypeScript support with full type definitions
- Extensive test suite with 92 test cases
- Complete documentation and examples
- Demo application showcasing all features

### Features
- **Storage Adapters**: localStorage, sessionStorage, cookies, indexedDB
- **Selective Persistence**: Choose which state properties to persist
- **Bucket System**: Use different storage adapters for different parts of state
- **Synchronization**: Real-time sync across browser tabs
- **Performance**: Debounced writes and optimized operations
- **Developer Experience**: Full TypeScript support and comprehensive error handling
- **SSR Compatible**: Safe for server-side rendering environments

[Unreleased]: https://github.com/erlihs/pinia-plugin-storage/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/erlihs/pinia-plugin-storage/releases/tag/v1.0.0
