"use strict";

(() => {
    const {
        expense: {
            newTransactionButton
        },
        mobile: {
            overviewButton,
            newTransactionButton: mobileNewTransactionButton,
            toolsButton,
            toolsCloseButton,
            toolsBackdrop,
            overviewIcon,
            newTransactionIcon,
            toolsIcon,
            toolsCloseIcon
        }
    } = window.App.dom

    const {
        mount: mountIcon
    } = window.App.icons

    let initialized = false

    /**
     * Öffnet oder schließt das mobile Werkzeugpanel
     * für Budget und Kategorien.
     *
     * @param {boolean} isOpen - Gewünschter Zustand des Panels.
     * @returns {void}
     */
    const setToolsOpen = (isOpen) => {
        document.body.classList.toggle(
            "moneta-tools-open",
            isOpen
        )

        toolsBackdrop.setAttribute(
            "aria-hidden",
            String(!isOpen)
        )

        toolsButton.classList.toggle(
            "is-active",
            isOpen
        )

        overviewButton.classList.toggle(
            "is-active",
            !isOpen
        )
    }

    /**
     * Schließt das mobile Werkzeugpanel.
     *
     * @returns {void}
     */
    const closeTools = () => {
        setToolsOpen(false)
    }

    /**
     * Initialisiert die mobile Navigation und ihre Icons.
     * Die Desktop-Oberfläche bleibt davon unberührt.
     *
     * @returns {void}
     */
    const initialize = () => {
        if (initialized) {
            return
        }

        initialized = true

        mountIcon(
            overviewIcon,
            "wallet",
            {
                className: "h-5 w-5"
            }
        )

        mountIcon(
            newTransactionIcon,
            "plus",
            {
                className: "h-7 w-7"
            }
        )

        mountIcon(
            toolsIcon,
            "settings-2",
            {
                className: "h-5 w-5"
            }
        )

        mountIcon(
            toolsCloseIcon,
            "x",
            {
                className: "h-5 w-5"
            }
        )

        overviewButton.addEventListener(
            "click",
            () => {
                closeTools()

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                })
            }
        )

        mobileNewTransactionButton.addEventListener(
            "click",
            () => {
                closeTools()
                newTransactionButton.click()
            }
        )

        toolsButton.addEventListener(
            "click",
            () => {
                setToolsOpen(
                    !document.body.classList.contains(
                        "moneta-tools-open"
                    )
                )
            }
        )

        toolsCloseButton.addEventListener(
            "click",
            closeTools
        )

        toolsBackdrop.addEventListener(
            "click",
            closeTools
        )

        document.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key === "Escape" &&
                    document.body.classList.contains(
                        "moneta-tools-open"
                    )
                ) {
                    closeTools()
                }
            }
        )
    }

    window.App.mobile = {
        initialize,
        setToolsOpen
    }
})()
