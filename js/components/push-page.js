const TRANSITION_MS = 260;

export function mountPushPage(layer, { historyKey = 'monetaPushPage' } = {}) {
  const root = document.querySelector('#modal-root');
  const app = document.querySelector('#app');

  root.append(layer);
  app?.setAttribute('inert', '');
  document.documentElement.classList.add('push-page-open');

  let historyEntryActive = false;
  try {
    const baseState = history.state && typeof history.state === 'object' ? history.state : {};
    history.pushState({ ...baseState, [historyKey]: true }, '', location.href);
    historyEntryActive = true;
  } catch (error) {
    console.warn('Push navigation history:', error);
  }

  requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('entered')));

  let settled = false;
  let closing = false;
  let pendingResult = null;
  let resolvePromise;
  const promise = new Promise((resolve) => { resolvePromise = resolve; });

  const finish = () => {
    if (settled) return;
    settled = true;
    window.removeEventListener('popstate', onPopState);
    document.removeEventListener('keydown', onKeyDown);
    layer.remove();
    document.documentElement.classList.remove('push-page-open', 'push-page-returning');
    app?.removeAttribute('inert');
    resolvePromise(pendingResult);
  };

  const beginClose = (value = null, { consumeHistory = true } = {}) => {
    if (settled || closing) return;
    closing = true;
    pendingResult = value;
    layer.classList.remove('entered');
    document.documentElement.classList.add('push-page-returning');

    if (consumeHistory && historyEntryActive) {
      historyEntryActive = false;
      try { history.back(); } catch (error) { console.warn('Push navigation history:', error); }
    }

    window.setTimeout(finish, TRANSITION_MS);
  };

  const onPopState = () => {
    historyEntryActive = false;
    beginClose(null, { consumeHistory: false });
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') beginClose(null);
  };

  window.addEventListener('popstate', onPopState);
  document.addEventListener('keydown', onKeyDown);

  return {
    close: (value = null) => beginClose(value),
    promise
  };
}
