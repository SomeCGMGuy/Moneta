"use strict";

;(() => {

     /**
     * Öffnet einen Dialog modal.
     *
     * Falls der Dialog bereits geöffnet ist,
     * passiert nichts.
     *
     * @param {HTMLDialogElement} dialog - Zu öffnender Dialog.
     * @returns {void}
     */
    const open = (dialog) => {
        if (dialog.open) {
            return
        }

        dialog.showModal()
    }

    /**
     * Schließt einen geöffneten Dialog.
     *
     * Falls der Dialog bereits geschlossen ist,
     * passiert nichts.
     *
     * @param {HTMLDialogElement} dialog - Zu schließender Dialog.
     * @param {string} [returnValue=""] - Optionaler Rückgabewert des Dialogs.
     * @returns {void}
     */
    const close = (
        dialog,
        returnValue = ""
    ) => {
        if (!dialog.open) {
            return
        }

        dialog.close(returnValue)
    }

    /**
     * Prüft, ob ein Dialog aktuell geöffnet ist.
     *
     * @param {HTMLDialogElement} dialog - Zu prüfender Dialog.
     * @returns {boolean} true, wenn der Dialog geöffnet ist.
     */
    const isOpen = (dialog) => {
        return dialog.open
    }

    /**
     * Prüft, ob ein Dialog vom Benutzer
     * frei geschlossen werden darf.
     *
     * Standardmäßig sind Dialoge schließbar.
     *
     * @param {HTMLDialogElement} dialog - Zu prüfender Dialog.
     * @returns {boolean}
     */
    const isDismissible = (dialog) => {
        return dialog.dataset.dismissible !== "false"
    }


    /**
     * Aktiviert das gemeinsame Verhalten
     * für einen einzelnen Dialog.
     *
     * @param {HTMLDialogElement} dialog - Zu initialisierender Dialog.
     * @returns {void}
     */
    const initializeDialog = (dialog) => {
        dialog.addEventListener(
            "click",
            (event) => {
                if (!isDismissible(dialog)) {
                    return
                }

                if (event.target !== dialog) {
                    return
                }

                close(dialog)
            }
        )


        dialog.addEventListener(
            "cancel",
            (event) => {
                if (isDismissible(dialog)) {
                    return
                }

                event.preventDefault()
            }
        )
    }

    /**
     * Initialisiert alle Dialoge der Anwendung
     * mit dem gemeinsamen Dialogverhalten.
     *
     * @returns {void}
     */
    const initialize = () => {
        const dialogs =
            document.querySelectorAll("dialog")

        dialogs.forEach((dialog) => {
            if (!(dialog instanceof HTMLDialogElement)) {
                return
            }

            initializeDialog(dialog)
        })
    }

    window.App.dialog = {
        open,
        close,
        isOpen,
        initialize 
    }

})()