"use strict";

(() => {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    if (!window.isSecureContext) {
        console.info(
            "Moneta PWA: Service Worker benötigt HTTPS oder localhost."
        );
        return;
    }

    window.addEventListener("load", async () => {
        try {
            const registration =
                await navigator.serviceWorker.register(
                    "./service-worker.js",
                    { scope: "./" }
                );

            // Bei jedem normalen Online-Start einmal nach einer neuen
            // Service-Worker-Version schauen. Die eigentlichen App-Dateien
            // werden vom Worker ebenfalls network-first aktualisiert.
            await registration.update();
        } catch (error) {
            console.error(
                "Moneta PWA konnte nicht registriert werden:",
                error
            );
        }
    });
})();
