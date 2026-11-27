window.__prefs = window.__prefs || {};
export const Preferences = {
  async get({ key }) { return { value: key in window.__prefs ? window.__prefs[key] : null }; },
  async set({ key, value }) { window.__prefs[key] = value; },
  async remove({ key }) { delete window.__prefs[key]; },
};
