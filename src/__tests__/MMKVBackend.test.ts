import { MMKVBackend } from '../backends/MMKVBackend';

// Mock react-native-mmkv v4 API
const mockStore = new Map<string, string>();

const mockMMKVInstance = {
  getAllKeys: jest.fn(() => Array.from(mockStore.keys())),
  getString: jest.fn((key: string) => mockStore.get(key) ?? undefined),
  set: jest.fn((key: string, value: string) => mockStore.set(key, value)),
  remove: jest.fn((key: string) => mockStore.delete(key)),
  clearAll: jest.fn(() => mockStore.clear()),
};

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => mockMMKVInstance),
}));

describe('MMKVBackend', () => {
  let backend: MMKVBackend;

  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
    backend = new MMKVBackend();
  });

  it('creates an MMKV instance via createMMKV when no instance provided', () => {
    const { createMMKV } = require('react-native-mmkv');
    expect(createMMKV).toHaveBeenCalled();
  });

  it('uses a provided MMKV instance instead of creating one', () => {
    const { createMMKV } = require('react-native-mmkv');
    createMMKV.mockClear();

    const customInstance = { ...mockMMKVInstance } as any;
    const customBackend = new MMKVBackend(customInstance);
    expect(createMMKV).not.toHaveBeenCalled();

    customBackend.setItem('key', 'value');
    expect(customInstance.set).toHaveBeenCalledWith('key', 'value');
  });

  it('setItem stores a value', () => {
    backend.setItem('foo', 'bar');
    expect(mockMMKVInstance.set).toHaveBeenCalledWith('foo', 'bar');
  });

  it('removeItem calls remove (not delete)', () => {
    backend.removeItem('foo');
    expect(mockMMKVInstance.remove).toHaveBeenCalledWith('foo');
  });

  it('clear calls clearAll', () => {
    backend.clear();
    expect(mockMMKVInstance.clearAll).toHaveBeenCalled();
  });

  it('init returns all stored key-value pairs', async () => {
    mockStore.set('a', '"hello"');
    mockStore.set('b', '42');

    const result = await backend.init();
    expect(result).toEqual([
      ['a', '"hello"'],
      ['b', '42'],
    ]);
  });

  it('init returns null for keys with no string value', async () => {
    mockMMKVInstance.getAllKeys.mockReturnValueOnce(['missing']);
    mockMMKVInstance.getString.mockReturnValueOnce(undefined);

    const result = await backend.init();
    expect(result).toEqual([['missing', null]]);
  });
});
