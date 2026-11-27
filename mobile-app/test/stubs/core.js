// 테스트용 Capacitor 대역: 네이티브인 척하고 호출을 기록한다
window.__calls = window.__calls || [];
export const Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android' };
export function registerPlugin(name) {
  return new Proxy({}, {
    get: (_t, method) => async (args) => {
      window.__calls.push({ plugin: name, method, args });
      if (method === 'pinWidget') return { requested: true };
      if (method === 'openWallpaperPicker') return { opened: true };
      return {};
    },
  });
}
