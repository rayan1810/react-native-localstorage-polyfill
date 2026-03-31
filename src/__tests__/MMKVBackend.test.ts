import { createMMKV } from 'react-native-mmkv';
import { MMKVBackend } from '../backends/MMKVBackend';

const mockStore = new Map<string, string>();

const mockMMKVInstance = {
  getAllKeys: jest.fn(() => Array.from(mockStore.keys())),
  getString: jest.fn((key: string) => mockStore.get(key) ?? undefined),
  set: jest.fn((key: string, value: string) => mockStore.set(key, value)),
  remove: jest.fn((key: string) => mockStore.delete(key)),
  clearAll: jest.fn(() => mockStore.clear()),
};

// Override the manual mock's createMMKV to return our controlled instance
(createMMKV as jest.Mock).mockReturnValue(mockMMKVInstance);

describe('MMKVBackend', () => {
  let backend: MMKVBackend;

  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
    (createMMKV as jest.Mock).mockReturnValue(mockMMKVInstance);
    backend = new MMKVBackend();
  });

  it('creates an MMKV instance via createMMKV when no instance provided', () => {
    expect(createMMKV).toHaveBeenCalled();
  });

  it('uses a provided MMKV instance instead of creating one', () => {
    (createMMKV as jest.Mock).mockClear();

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
