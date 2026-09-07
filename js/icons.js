"use strict";

(() => {
    const SVG_NS =
        "http://www.w3.org/2000/svg"


    /**
     * Erstellt ein SVG-Icon aus den lokal
     * generierten Iconify-Daten.
     *
     * @param {MonetaIconName} name - Name des Icons.
     * @param {IconCreateOptions} [options] - Darstellungsoptionen.
     * @returns {SVGSVGElement} Fertiges SVG-Element.
     */
    const create = (
        name,
        {
            className = "",
            label = null
        } = {}
    ) => {
        const iconData =
            window.App.iconData[name]

        if (!iconData) {
            throw new Error(
                `Icon "${name}" ist nicht registriert.`
            )
        }


        const svg =
            document.createElementNS(
                SVG_NS,
                "svg"
            )


        Object.entries(
            iconData.attributes
        ).forEach(
            ([attribute, value]) => {
                svg.setAttribute(
                    attribute,
                    value
                )
            }
        )


        svg.innerHTML =
            iconData.body


        if (className) {
            svg.setAttribute(
                "class",
                className
            )
        }


        if (label) {
            svg.setAttribute(
                "role",
                "img"
            )

            svg.setAttribute(
                "aria-label",
                label
            )
        } else {
            svg.setAttribute(
                "aria-hidden",
                "true"
            )
        }


        return svg
    }

    /**
     * Setzt ein Icon in ein vorhandenes DOM-Element.
     *
     * Bereits vorhandener Inhalt wird ersetzt.
     *
     * @param {HTMLElement} target - Ziel-Element.
     * @param {MonetaIconName} name - Name des Icons.
     * @param {IconCreateOptions} [options] - Darstellungsoptionen.
     * @returns {void}
     */
    const mount = (
        target,
        name,
        options = {}
    ) => {
        target.replaceChildren(
            create(
                name,
                options
            )
        )
    }


    window.App.icons = {
        create,
        mount
    }
})()