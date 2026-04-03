


global.device = {
  launchApp: async () => { throw new Error('[device] App is not running — no React Native project built'); },
  reloadReactNative: async () => { throw new Error('[device] Cannot reload — no React Native project built'); },
};

const makeElement = (selector) => ({
  tap: async () => { throw new Error(`[UI] Element not found: ${selector}`); },
  typeText: async (text) => { throw new Error(`[UI] Element not found: ${selector}`); },
  waitToBeVisible: async () => { throw new Error(`[UI] Element not found: ${selector}`); },
});

global.by = {
  id: (id) => `id:${id}`,
  text: (text) => `text:${text}`,
};

global.element = (selector) => makeElement(selector);

global.expect = (el) => ({
  toBeVisible: async () => { throw new Error(`[Assertion] Expected element to be visible — app not running`); },
  not: {
    toBeVisible: async () => { throw new Error(`[Assertion] Expected element NOT to be visible — app not running`); },
  },
  toHaveValue: async (val) => { throw new Error(`[Assertion] Expected element to have value "${val}" — app not running`); },
});
