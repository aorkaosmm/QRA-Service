// 렌더러에 노출하는 안전한 API (contextIsolation + sandbox).
const { contextBridge, ipcRenderer } = require('electron');

const subscribe = (channel) => (cb) => {
  const handler = (_event, payload) => cb(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

contextBridge.exposeInMainWorld('calendarRpg', {
  init: () => ipcRenderer.invoke('rpg:init'),
  dispatch: (type, payload) => ipcRenderer.invoke('rpg:dispatch', { type, payload }),
  onState: subscribe('rpg:state'),
  onEvents: subscribe('rpg:events'),
  onLayout: subscribe('rpg:layout'),
  onHp: subscribe('rpg:hp'),
  reportHp: (hp) => ipcRenderer.send('rpg:hp', hp),
  getHp: () => ipcRenderer.invoke('rpg:get-hp'),
  battleReport: (report) => ipcRenderer.send('rpg:battle-report', report),
  setIgnoreMouse: (ignore) => ipcRenderer.send('rpg:set-ignore-mouse', Boolean(ignore)),
  windowCmd: (cmd) => ipcRenderer.send('rpg:window', cmd),
  openWidget: () => ipcRenderer.send('rpg:open-widget'),
  exportData: () => ipcRenderer.invoke('rpg:export'),
  importData: () => ipcRenderer.invoke('rpg:import'),
  openDataFolder: () => ipcRenderer.send('rpg:open-data-folder'),
});
