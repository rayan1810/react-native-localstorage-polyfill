const createMMKV = jest.fn(() => ({
  getAllKeys: jest.fn(() => []),
  getString: jest.fn(() => undefined),
  set: jest.fn(),
  remove: jest.fn(),
  clearAll: jest.fn(),
}));

export { createMMKV };
export type MMKV = ReturnType<typeof createMMKV>;
