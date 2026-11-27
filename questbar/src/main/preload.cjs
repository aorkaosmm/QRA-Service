// 렌더러에 노출하는 안전한 API (contextIsolation + sandbox).
const { contextBridge, ipcRenderer } = require('electron');

const subscribe = (channel) => (cb) => {
  const handler = (_event, payload) => cb(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

contextBridge.exposeInMainWorld('questbar', {
  init: () => ipcRenderer.invoke('qb:init'),
  dispatch: (type, payload) => ipcRenderer.invoke('qb:dispatch', { type, payload }),
  onState: subscribe('qb:state'),
  onEvents: subscribe('qb:events'),
  onLayout: subscribe('qb:layout'),
  battleReport: (report) => ipcRenderer.send('qb:battle-report', report),
  setIgnoreMouse: (ignore) => ipcRenderer.send('qb:set-ignore-mouse', Boolean(ignore)),
  windowCmd: (cmd) => ipcRenderer.send('qb:window', cmd),
  openWidget: () => ipcRenderer.send('qb:open-widget'),
  exportData: () => ipcRenderer.invoke('qb:export'),
  importData: () => ipcRenderer.invoke('qb:import'),
  openDataFolder: () => ipcRenderer.send('qb:open-data-folder'),
});
