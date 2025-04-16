import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type AnyFunction = (...args: any[]) => Promise<any>;

export function fileMemoize<T extends AnyFunction>(
  fn: T,
  functionName: string = fn.name,
  getFileName = () =>
    path.join(os.tmpdir(), `${process.env.CI_COMMIT_SHA || 'default'}_${functionName}.json`)
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let cache: Record<string, ReturnType<T>> = {};
  let initialized = false;
  const cacheFile = getFileName();

  const initializeCache = async () => {
    try {
      const fileContents = await fs.readFile(cacheFile, 'utf-8');
      cache = JSON.parse(fileContents);
    } catch (error) {
      cache = Object.create(null);
    }
    initialized = true;
  };

  const saveCache = async () => {
    await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2));
  };

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!initialized) await initializeCache();

    const key = args.length === 1 && typeof args[0] === 'string' ? args[0] : JSON.stringify(args);

    if (key in cache) return cache[key];

    const result = await fn(...args);
    cache[key] = result;
    await saveCache();

    return result;
  };
}
