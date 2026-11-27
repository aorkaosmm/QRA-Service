// 백엔드 API 선택: Electron(preload) → 미리보기 부모 페이지 공유 → 단독 웹 백엔드
export async function resolveApi() {
  if (window.questbar) return window.questbar;
  try {
    if (window.parent && window.parent !== window && window.parent.questbarShared) {
      return window.parent.questbarShared;
    }
  } catch {
    // 다른 출처의 부모 → 무시
  }
  const { createWebBackend } = await import('./web-backend.js');
  return createWebBackend();
}
