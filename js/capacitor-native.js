const capacitor = window.Capacitor;
const appPlugin = capacitor?.Plugins?.App;

if (capacitor?.isNativePlatform?.() && appPlugin?.addListener) {
  appPlugin.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack || history.length > 1) {
      history.back();
      return;
    }

    appPlugin.exitApp?.();
  });
}
