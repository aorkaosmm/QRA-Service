window.__appListeners = window.__appListeners || {};
export const App = {
  addListener(event, cb) { (window.__appListeners[event] = window.__appListeners[event] || []).push(cb); return { remove() {} }; },
  minimizeApp() { window.__calls.push({ plugin: 'App', method: 'minimizeApp' }); },
};
