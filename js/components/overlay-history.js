export function registerOverlayHistory(onBack, key = 'monetaOverlay') {
  const marker = `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let active = false;

  const onPopState = () => {
    if (!active) return;
    active = false;
    window.removeEventListener('popstate', onPopState);
    onBack();
  };

  try {
    const baseState = history.state && typeof history.state === 'object' ? history.state : {};
    history.pushState({ ...baseState, [marker]: true }, '', location.href);
    active = true;
    window.addEventListener('popstate', onPopState);
  } catch (error) {
    console.warn('Overlay navigation history:', error);
  }

  return {
    consume() {
      if (!active) return;
      active = false;
      window.removeEventListener('popstate', onPopState);
      try { history.back(); } catch (error) { console.warn('Overlay navigation history:', error); }
    },
    release() {
      if (!active) return;
      active = false;
      window.removeEventListener('popstate', onPopState);
    }
  };
}
