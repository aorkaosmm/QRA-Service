window.__scheduled = [];
export const LocalNotifications = {
  async checkPermissions() { return { display: 'granted' }; },
  async requestPermissions() { return { display: 'granted' }; },
  async getPending() { return { notifications: window.__scheduled.map((n) => ({ id: n.id })) }; },
  async cancel() { window.__scheduled = []; },
  async schedule({ notifications }) { window.__scheduled.push(...notifications); },
};
