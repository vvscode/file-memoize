import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { fileMemoize } from './file-memoize'; // Adjust import path accordingly

describe('fileMemoize', () => {
  const functionName = 'testFunction';

  // Helper to generate cache file path
  const getFileName = () =>
    path.join(os.tmpdir(), `${process.env.CI_COMMIT_SHA || 'default'}_${functionName}.json`);
  const cacheFilePath = getFileName();

  // Mock function to wrap
  let mockFn: jest.Mock<any, any>;

  // Wrap with memoize
  let memoized: (...args: unknown[]) => Promise<unknown>;

  beforeEach(async () => {
    mockFn = jest.fn(async (param: string) => `Result for ${param}`);
    memoized = fileMemoize(mockFn, functionName, getFileName);

    try {
      await fs.unlink(cacheFilePath);
    } catch {
      // ignore if not exists
    }
  });

  it('calls the wrapped function on first call and caches result', async () => {
    const result = await memoized('param1');
    expect(result).toBe('Result for param1');

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('returns cached result on subsequent calls with same args', async () => {
    await memoized('param2');
    await memoized('param2');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('handles multiple different parameters separately', async () => {
    await memoized('paramA');
    await memoized('paramB');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('writes cache to file', async () => {
    await memoized('paramX');
    const fileContent = await fs.readFile(cacheFilePath, 'utf-8');
    expect(JSON.parse(fileContent)).toHaveProperty('paramX', 'Result for paramX');
  });

  it('loads cache from file on new instance', async () => {
    await memoized('paramY');
    // Create new memoized instance
    const newMemoized = fileMemoize(mockFn, functionName, getFileName);
    const result = await newMemoized('paramY');
    expect(result).toBe('Result for paramY');
    expect(mockFn).toHaveBeenCalledTimes(1); // original call only
  });

  it('handles errors reading cache file gracefully', async () => {
    // Corrupt the cache file
    await fs.writeFile(cacheFilePath, 'not a json');
    const newMemoized = fileMemoize(mockFn, functionName, getFileName);
    const result = await newMemoized('paramZ');
    expect(result).toBe('Result for paramZ');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('handles errors writing cache file gracefully', async () => {
    // Mock fs.writeFile to throw
    const originalWriteFile = fs.writeFile;
    fs.writeFile = jest.fn().mockRejectedValue(new Error('Write error'));
    await expect(memoized('paramError')).rejects.toThrow('Write error');
    fs.writeFile = originalWriteFile; // restore
  });

  it('correctly caches results for complex args', async () => {
    const complexArg = { foo: 'bar' };
    const complexMemoized = fileMemoize(
      async (arg: typeof complexArg) => `Result for ${JSON.stringify(arg)}`,
      'complex'
    );
    const result = await complexMemoized(complexArg);
    expect(result).toBe(`Result for ${JSON.stringify(complexArg)}`);
    // Call again with same object
    const result2 = await complexMemoized(complexArg);
    expect(result2).toBe(result);
  });

  it('works without second param', async () => {
    const complexArg = { foo: 'bar' };
    const complexMemoized = fileMemoize(async function complex(arg: typeof complexArg) {
      return `Result for ${JSON.stringify(arg)}`;
    });
    const result = await complexMemoized(complexArg);
    expect(result).toBe(`Result for ${JSON.stringify(complexArg)}`);
    // Call again with same object
    const result2 = await complexMemoized(complexArg);
    expect(result2).toBe(result);
  });
});
