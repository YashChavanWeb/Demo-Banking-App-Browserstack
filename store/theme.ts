// Global theme store — green mode toggle
let _greenMode = false;
let _listeners: (() => void)[] = [];

function notify() { _listeners.forEach(fn => fn()); }

export const ThemeStore = {
  isGreenMode: () => _greenMode,
  toggle: () => { _greenMode = !_greenMode; notify(); },
  subscribe: (fn: () => void) => {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  },
  // Returns the active primary color
  primaryColor: () => _greenMode ? '#059669' : '#4F46E5',
};