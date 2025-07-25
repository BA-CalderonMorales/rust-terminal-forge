import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock navigator for mobile detection  
Object.defineProperty(global.navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Mobile)',
  writable: true,
});

Object.defineProperty(global.navigator, 'maxTouchPoints', {
  value: 5,
  writable: true,
});

Object.defineProperty(global.navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(global.navigator, 'virtualKeyboard', {
  value: {},
  writable: true,
});

// Mock window.ontouchstart for mobile detection
Object.defineProperty(window, 'ontouchstart', {
  value: true,
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver  
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = vi.fn();

// Mock Touch for gesture tests
global.Touch = class Touch {
  public identifier: number;
  public target: EventTarget;
  public clientX: number;
  public clientY: number;
  public screenX: number;
  public screenY: number;
  public pageX: number;
  public pageY: number;
  public radiusX: number;
  public radiusY: number;
  public rotationAngle: number;
  public force: number;

  constructor(touchInitDict: TouchInit) {
    this.identifier = touchInitDict.identifier;
    this.target = touchInitDict.target;
    this.clientX = touchInitDict.clientX;
    this.clientY = touchInitDict.clientY;
    this.screenX = touchInitDict.screenX || touchInitDict.clientX;
    this.screenY = touchInitDict.screenY || touchInitDict.clientY;
    this.pageX = touchInitDict.pageX || touchInitDict.clientX;
    this.pageY = touchInitDict.pageY || touchInitDict.clientY;
    this.radiusX = touchInitDict.radiusX || 0;
    this.radiusY = touchInitDict.radiusY || 0;
    this.rotationAngle = touchInitDict.rotationAngle || 0;
    this.force = touchInitDict.force || 1;
  }
};

// Mock TouchEvent
global.TouchEvent = class TouchEvent extends UIEvent {
  public touches: TouchList;
  public targetTouches: TouchList;
  public changedTouches: TouchList;
  public altKey: boolean;
  public metaKey: boolean;
  public ctrlKey: boolean;
  public shiftKey: boolean;

  constructor(type: string, eventInitDict: TouchEventInit = {}) {
    super(type, eventInitDict);
    this.touches = eventInitDict.touches || ([] as any);
    this.targetTouches = eventInitDict.targetTouches || ([] as any);
    this.changedTouches = eventInitDict.changedTouches || ([] as any);
    this.altKey = eventInitDict.altKey || false;
    this.metaKey = eventInitDict.metaKey || false;
    this.ctrlKey = eventInitDict.ctrlKey || false;
    this.shiftKey = eventInitDict.shiftKey || false;
  }
};

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));