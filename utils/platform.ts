export const isNativeApp = (): boolean => {
  return typeof window.Capacitor !== 'undefined';
};

export const getPlatform = (): string => {
  if (isNativeApp()) {
    // @ts-expect-error: window.Capacitor is only defined in native apps
    return window.Capacitor.getPlatform();
  }
  return 'web';
};
