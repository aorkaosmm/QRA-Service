// 테스트용 Capacitor 대역: 네이티브인 척하고 호출을 기록한다
window.__calls = window.__calls || [];
window.__overlay = window.__overlay || { permission: false, running: false, wanted: false };
export const Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android' };
export function registerPlugin(name) {
  return new Proxy({}, {
    get: (_t, method) => async (args) => {
      window.__calls.push({ plugin: name, method, args });
      const o = window.__overlay;
      switch (method) {
        case 'pinWidget': return { requested: true };
        case 'openWallpaperPicker': return { opened: true };
        case 'overlayStatus': return { ...o };
        case 'requestOverlayPermission': o.permission = true; return { opened: true }; // 사용자가 허용했다고 가정
        case 'setOverlay':
          if (args.enabled && !o.permission) return { running: false, permission: false };
          o.running = Boolean(args.enabled); o.wanted = Boolean(args.enabled);
          return { running: o.running, permission: o.permission };
        default: return {};
      }
    },
  });
}
