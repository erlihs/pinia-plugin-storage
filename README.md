![pinia-plugin-storage](./pinia-plugin-storage.png)

# pinia-plugin-storage

🍍 A comprehensive state persistence and synchronization, yet as simple as it can be

Main Features:

- **Multi-Adapter Support**: localStorage, sessionStorage, cookies, and indexedDB

- **Selective Persistence**: Include/exclude specific state properties

- **Multiple Buckets**: Different parts of state can use different storage adapters

- **Automatic Hydration**: Restores state from storage on app initialization

- **Real-time Synchronization**: Syncs state changes across browser tabs/windows

- **Debounced Persistence**: Configurable debouncing to optimize write performance

- **Namespace & Versioning**: Prevents storage key collisions and supports data migration

- **State Transformation**: Before/after hooks for data transformation during hydration

- **SSR Safe**: Server-side rendering compatible with environment detection

- **Error Handling**: Comprehensive error handling with custom error callbacks

## Getting started

### Installation

```sh
# or pnpm or yarn
npm install pinia-plugin-storage
```

### Usage

//todo

## Contributing

//todo

## Credits

- [pinia-plugin-persistedstate](https://github.com/prazdevs/pinia-plugin-persistedstate)
- [pinia-plugin-persistedstate-2](https://github.com/soc221b/pinia-plugin-persistedstate-2)
- [pinia-plugin-persist](https://github.com/Seb-L/pinia-plugin-persist)

## License

This project is licensed under the MIT License - see the [LICENSE](/LICENSE) file for details
