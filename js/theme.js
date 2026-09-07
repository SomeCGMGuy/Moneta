"use strict";

(() => {
    const {
        toggleButton
    } = window.App.dom.theme

    const STORAGE_KEY =
        "moneta-theme"

    const {
        create: createIcon
    } = window.App.icons

    /**
     * Aktualisiert das Icon des Theme-Umschalters.
     *
     * Im Darkmode wird eine Sonne angezeigt,
     * im Lightmode ein Mond.
     *
     * @param {"light" | "dark"} theme - Aktuelles Farbschema.
     * @returns {void}
     */
    const updateToggleIcon = (theme) => {
        const iconName =
            theme === "dark"
                ? "sun"
                : "moon"

        const icon =
            createIcon(
                iconName,
                {
                    className: "h-5 w-5"
                }
            )

        toggleButton.replaceChildren(
            icon
        )
    }

    /**
     * Ermittelt das bevorzugte Farbschema.
     *
     * Eine manuelle Auswahl hat Vorrang vor
     * der Systemeinstellung.
     *
     * @returns {"light" | "dark"}
     */
    const getPreferredTheme = () => {
        const storedTheme =
            localStorage.getItem(
                STORAGE_KEY
            )

        if (
            storedTheme === "light" ||
            storedTheme === "dark"
        ) {
            return storedTheme
        }

        return window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
            ? "dark"
            : "light"
    }


    /**
     * Aktiviert ein Farbschema und speichert
     * die Auswahl optional dauerhaft.
     *
     * @param {"light" | "dark"} theme
     * @param {boolean} [persist=true]
     * @returns {void}
     */
    const apply = (
    theme,
    persist = true
    ) => {
        const isDark =
            theme === "dark"

        document.documentElement.classList.toggle(
            "dark",
            isDark
        )

        document.documentElement.classList.toggle(
            "scheme-dark",
            isDark
        )

        document.documentElement.classList.toggle(
            "scheme-light",
            !isDark
        )

        updateToggleIcon(
            theme
        )

        if (persist) {
            localStorage.setItem(
                STORAGE_KEY,
                theme
            )
        }
    }


    /**
     * Wechselt zwischen hellem
     * und dunklem Farbschema.
     *
     * @returns {void}
     */
    const toggle = () => {
        const nextTheme =
            document.documentElement
                .classList
                .contains("dark")
                ? "light"
                : "dark"

        apply(nextTheme)
    }


    /**
     * Initialisiert das Farbschema
     * und registriert den Umschalter.
     *
     * @returns {void}
     */
    const initialize = () => {
        apply(
            getPreferredTheme(),
            false
        )

        toggleButton.addEventListener(
            "click",
            toggle
        )
    }


    window.App.theme = {
        initialize,
        apply,
        toggle
    }
})()