import { renderHook } from '@testing-library/react-native';
import { useFrameworkReady } from '../useFrameworkReady';

describe('useFrameworkReady', () => {
  let mockFrameworkReady: jest.Mock;

  beforeEach(() => {
    mockFrameworkReady = jest.fn();
    (global as any).window = { frameworkReady: mockFrameworkReady };
  });

  afterEach(() => {
    delete (global as any).window;
  });

  it('should call window.frameworkReady when it exists', () => {
    renderHook(() => useFrameworkReady());

    expect(mockFrameworkReady).toHaveBeenCalled();
  });

  it('should call window.frameworkReady on every render', () => {
    const { rerender } = renderHook(() => useFrameworkReady());

    expect(mockFrameworkReady).toHaveBeenCalledTimes(1);

    rerender();

    expect(mockFrameworkReady).toHaveBeenCalledTimes(2);

    rerender();

    expect(mockFrameworkReady).toHaveBeenCalledTimes(3);
  });

  it('should not throw error when window.frameworkReady is undefined', () => {
    (global as any).window = {};

    expect(() => {
      renderHook(() => useFrameworkReady());
    }).not.toThrow();
  });

  it('should not throw error when window.frameworkReady is undefined', () => {
    (global as any).window = { frameworkReady: undefined };

    expect(() => {
      renderHook(() => useFrameworkReady());
    }).not.toThrow();
  });

  it('should handle window.frameworkReady being null', () => {
    (global as any).window = { frameworkReady: null };

    expect(() => {
      renderHook(() => useFrameworkReady());
    }).not.toThrow();
  });
});
