let activeSentinel = null;
let observer = null;

const mutationObserver = new MutationObserver(() => bindTimeline());
mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
bindTimeline();

function bindTimeline() {
  const sentinel = document.querySelector('[data-booking-timeline-sentinel]');
  if (!sentinel || sentinel === activeSentinel) return;
  activeSentinel = sentinel;
  observer?.disconnect();
  observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    revealNextPage(sentinel);
  }, { rootMargin: '320px 0px 320px 0px' });
  observer.observe(sentinel);
}

function revealNextPage(sentinel) {
  const timeline = sentinel.closest('[data-booking-timeline]');
  const template = timeline?.querySelector('template[data-booking-timeline-page]');
  if (!timeline || !template) {
    sentinel.remove();
    observer?.disconnect();
    activeSentinel = null;
    return;
  }

  sentinel.before(template.content.cloneNode(true));
  template.remove();
  updateVisibleCount(timeline);

  if (!timeline.querySelector('template[data-booking-timeline-page]')) {
    sentinel.remove();
    observer?.disconnect();
    activeSentinel = null;
  }
}

function updateVisibleCount(timeline) {
  const section = timeline.closest('[data-booking-section]');
  const count = section?.querySelector('[data-booking-visible-count]');
  if (!count) return;
  count.textContent = String(timeline.querySelectorAll('[data-booking-row]').length);
}
