import '@testing-library/jest-dom';

// Mock navigator for mobile detection
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Mobile)',
    maxTouchPoints: 5,
    vibrate: vi.fn(),
    virtualKeyboard: {},
  },
  writable: true,
});

// Mock window.ontouchstart for mobile detection
Object.defineProperty(window, 'ontouchstart', {
  value: true,
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));