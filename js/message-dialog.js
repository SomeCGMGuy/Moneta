"use strict";

(() => {
    const {
        dialog,
        icon,
        title,
        text,
        closeButton
    } = window.App.dom.messageDialog

    const {
        open: openDialog,
        close: closeDialog
    } = window.App.dialog


    /**
    * Zeigt eine allgemeine Meldung als Dialog an.
    *
    * @param {MessageDialogOptions} options - Darstellungsoptionen.
    * @returns {void}
    */
    const show = ({
        title: dialogTitle,
        message,
        type = "info",
        dismissible = true
    }) => {
        title.textContent =
            dialogTitle

        text.textContent =
            message

        dialog.dataset.dismissible =
            String(dismissible)

        applyType(type)

        if (type === "critical") {
            closeButton.textContent =
                "Seite neu laden"
        } else {
            closeButton.textContent =
                "OK"
        }

        openDialog(dialog)
    }


    /**
     * Passt die Darstellung des Meldungsdialogs
     * an den Meldungstyp an.
     *
     * @param {MessageDialogType} type - Art der Meldung.
     * @returns {void}
     */
    const applyType = (type) => {
        icon.className =
            "flex h-11 w-11 items-center justify-center rounded-2xl"

        switch (type) {
            case "error":
            case "critical":
                icon.classList.add(
                    "bg-red-50",
                    "text-red-600"
                )

                icon.textContent = "!"
                break

            case "warning":
                icon.classList.add(
                    "bg-amber-50",
                    "text-amber-600"
                )

                icon.textContent = "!"
                break

            default:
                icon.classList.add(
                    "bg-emerald-50",
                    "text-emerald-600"
                )

                icon.textContent = "i"
        }
    }


    /**
     * Schließt den Meldungsdialog.
     *
     * @returns {void}
     */
    const close = () => {
        closeDialog(dialog)
    }


    /**
     * Behandelt die Hauptaktion des Meldungsdialogs.
     *
     * Kritische Fehler führen zu einem Reload,
     * normale Meldungen werden geschlossen.
     *
     * @returns {void}
     */
    const handleAction = () => {
        if (
            dialog.dataset.dismissible === "false"
        ) {
            window.location.reload()
            return
        }

        close()
    }


    closeButton.addEventListener(
        "click",
        handleAction
    )


    window.App.messageDialog = {
        show,
        close
    }
})()