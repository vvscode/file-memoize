# file-memoize


[![npm version](https://badge.fury.io/js/file-memoize.svg)](https://www.npmjs.com/package/file-memoize)
[![Deploy](https://github.com/vvscode/file-memoize/workflows/build/badge.svg)](https://github.com/vvscode/file-memoize/actions)
[![Coverage Status](https://coveralls.io/repos/github/vvscode/file-memoize/badge.svg?branch=master)](https://coveralls.io/github/vvscode/file-memoize?branch=master)


A simple and efficient TypeScript higher-order function to cache asynchronous function results to JSON files in the OS temporary directory. Designed for Node.js, it persists cached results across runs using parameter-based keys and customizable cache file naming.

---

## Features

- Cache async function results to JSON files on disk
- Uses OS temporary directory for cache storage
- Supports single string or multiple parameters as cache keys
- Cache file named using `CI_COMMIT_SHA` environment variable and function name
- Automatically loads and saves cache on function calls
- Written in TypeScript with full type safety

---

## Installation

```bash
npm install file-memoize
# or
yarn add file-memoize
```

---

## Usage

```typescript
import { fileMemoize } from 'file-memoize';

// Example async function
async function fetchData(param: string): Promise {
  // Simulate an async operation
  return `Data for ${param}`;
}

// Create a memoized version of the function
const memoizedFetchData = fileMemoize(fetchData, 'fetchData');

async function run() {
  // First call: runs the original function and caches result
  console.log(await memoizedFetchData('books')); // Output: Data for books

  // Second call with same param: returns cached result instantly
  console.log(await memoizedFetchData('books')); // Output: Data for books
}

run();
```

---

## API

### `fileMemoize(fn, functionName, getFileName?)`

Creates a memoized version of an async function `fn` that caches results to a JSON file.

| Parameter     | Type                               | Description                                                                                          |
|---------------|----------------------------------|--------------------------------------------------------------------------------------------------|
| `fn`          | `(...args: any[]) => Promise` | The async function to memoize.                                                                     |
| `functionName`| `string`                         | Name of the function, used in cache file naming.                                                  |
| `getFileName` | `() => string` (optional)        | Optional function to customize cache file path. Defaults to `${tmpdir}/${CI_COMMIT_SHA}_${functionName}.json`. |

**Returns:** A function with the same signature as `fn` that caches results on disk.

---

## How it works

- On first invocation, the cache file is loaded if it exists.
- Function call arguments are serialized to form cache keys:
  - If a single string argument is passed, it is used directly as the key.
  - Otherwise, the arguments array is JSON-stringified.
- If a cached result exists for the key, it is returned immediately.
- Otherwise, the original function is called, the result cached, and saved to file.

---

## Environment Variables

- `CI_COMMIT_SHA`: Used as part of the cache filename to isolate cache per commit or environment. Defaults to `'default'` if unset.

---

## Testing

The package includes Jest tests covering:

- Cache hit and miss behavior
- Cache persistence to disk
- Handling of multiple parameters
- Graceful error handling on file read/write failures

Run tests with:

```bash
npm test
```

---

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to open issues or pull requests.

---
