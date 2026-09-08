const RELEASE_API = 'https://api.github.com/repos/SomeCGMGuy/Moneta/releases/latest';
const RELEASES_URL = 'https://github.com/SomeCGMGuy/Moneta/releases';

const versionNode = document.querySelector('[data-release-version]');
const detailNode = document.querySelector('[data-release-detail]');
const statusNode = document.querySelector('[data-release-status]');
const downloadLink = document.querySelector('[data-download-link]');
const fileMetaNode = document.querySelector('[data-file-meta]');

loadLatestRelease();

async function loadLatestRelease() {
  try {
    const response = await fetch(RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });

    if (response.status === 404) {
      showEmptyState();
      return;
    }

    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

    const release = await response.json();
    const apk = release.assets?.find((asset) => asset.name?.toLowerCase().endsWith('.apk'));

    if (!apk) {
      showReleaseWithoutApk(release);
      return;
    }

    const version = String(release.tag_name || release.name || '').replace(/^v/i, '') || 'Aktuell';
    const publishedAt = release.published_at ? new Date(release.published_at) : null;

    versionNode.textContent = version;
    detailNode.textContent = publishedAt
      ? `Veröffentlicht am ${publishedAt.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}.`
      : 'Aktuell veröffentlichtes Android-Paket.';
    statusNode.textContent = 'Bereit';

    downloadLink.href = apk.browser_download_url;
    downloadLink.classList.remove('is-disabled');
    downloadLink.removeAttribute('aria-disabled');
    downloadLink.setAttribute('download', '');

    fileMetaNode.textContent = `${apk.name} · ${formatBytes(apk.size)}`;
  } catch (error) {
    console.warn('Could not load latest Moneta release:', error);
    showErrorState();
  }
}

function showEmptyState() {
  versionNode.textContent = 'Noch kein Release';
  detailNode.textContent = 'Sobald die erste stabile APK veröffentlicht wurde, erscheint sie hier automatisch.';
  statusNode.textContent = 'In Vorbereitung';
  fileMetaNode.textContent = '';
  makeFallbackLink('Releases auf GitHub öffnen');
}

function showReleaseWithoutApk(release) {
  const version = String(release.tag_name || release.name || '').replace(/^v/i, '') || 'Aktuell';
  versionNode.textContent = version;
  detailNode.textContent = 'Das neueste Release enthält aktuell keine APK-Datei.';
  statusNode.textContent = 'APK fehlt';
  fileMetaNode.textContent = '';
  makeFallbackLink('Release auf GitHub öffnen', release.html_url || RELEASES_URL);
}

function showErrorState() {
  versionNode.textContent = 'Nicht erreichbar';
  detailNode.textContent = 'Die aktuelle Version konnte gerade nicht automatisch geladen werden.';
  statusNode.textContent = 'GitHub';
  fileMetaNode.textContent = 'Du kannst die Releases weiterhin direkt auf GitHub öffnen.';
  makeFallbackLink('Releases auf GitHub öffnen');
}

function makeFallbackLink(label, href = RELEASES_URL) {
  downloadLink.href = href;
  downloadLink.classList.remove('is-disabled');
  downloadLink.removeAttribute('aria-disabled');
  downloadLink.removeAttribute('download');
  downloadLink.querySelector('span:first-child').textContent = label;
  downloadLink.querySelector('.download-arrow').textContent = '↗';
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'APK';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** index);
  return `${value.toLocaleString('de-DE', { maximumFractionDigits: index > 1 ? 1 : 0 })} ${units[index]}`;
}
