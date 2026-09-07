"use strict";

const CACHE_NAME = "moneta-pwa-v2";
const CACHE_PREFIX = "moneta-pwa-";

const APP_SHELL = [
    "./index.html",
    "./manifest.webmanifest",
    "./css/app.css",
    "./js/namespace.js",
    "./js/generated/icons-data.js",
    "./js/icons.js",
    "./js/utils.js",
    "./js/db.js",
    "./js/transactions.js",
    "./js/categories.js",
    "./js/dom.js",
    "./js/dialog.js",
    "./js/message-dialog.js",
    "./js/theme.js",
    "./js/ui.js",
    "./js/category-controller.js",
    "./js/transaction-controller.js",
    "./js/mobile.js",
    "./js/app.js",
    "./js/pwa.js",
    "./icons/favicon.svg",
    "./icons/apple-touch-icon.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-512.png"
];

/**
 * Löst einen relativen App-Pfad innerhalb des aktuellen PWA-Scopes auf.
 * Dadurch funktioniert der Cache auch, wenn Moneta in einem Unterordner
 * gehostet wird, z. B. auf GitHub Pages.
 *
 * @param {string} path - Relativer Pfad innerhalb der App.
 * @returns {string} Absolute URL im aktuellen Scope.
 */
const resolveAppUrl = (path) =>
    new URL(path, self.registration.scope).href;

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) =>
                cache.addAll(
                    APP_SHELL.map(resolveAppUrl)
                )
            )
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter(
                            (cacheName) =>
                                cacheName.startsWith(CACHE_PREFIX) &&
                                cacheName !== CACHE_NAME
                        )
                        .map((cacheName) =>
                            caches.delete(cacheName)
                        )
                )
            )
            .then(() => self.clients.claim())
    );
});

/**
 * Lädt eine Ressource bevorzugt aus dem Netz und aktualisiert dabei
 * den Offline-Cache. Wenn keine Verbindung besteht, wird die letzte
 * erfolgreiche Version aus dem Cache verwendet.
 *
 * Diese Strategie verhindert, dass beim Entwickeln oder Aktualisieren
 * dauerhaft eine alte JavaScript-Datei aus dem Cache hängen bleibt.
 *
 * @param {Request} request - Eingehende GET-Anfrage.
 * @returns {Promise<Response>} Netzwerk- oder Cache-Antwort.
 */
const networkFirst = async (request) => {
    try {
        const response = await fetch(request);

        if (response.ok && response.type === "basic") {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
        }

        return response;
    } catch (networkError) {
        const cachedResponse = await caches.match(
            request,
            { ignoreSearch: true }
        );

        if (cachedResponse) {
            return cachedResponse;
        }

        if (request.mode === "navigate") {
            const fallback = await caches.match(
                resolveAppUrl("./index.html")
            );

            if (fallback) {
                return fallback;
            }
        }

        throw networkError;
    }
};

self.addEventListener("fetch", (event) => {
    const { request } = event;

    if (request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(request.url);

    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        networkFirst(request)
    );
});
