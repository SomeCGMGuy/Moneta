import {
    icons
} from "@iconify-json/lucide"

import {
    getIconData,
    iconToSVG
} from "@iconify/utils"

import {
    mkdir,
    writeFile
} from "node:fs/promises"


/**
 * Icons, die Moneta tatsächlich verwendet.
 */
const iconNames = [
    "pencil",
    "trash-2",
    "settings-2",

    "moon",
    "sun",

    "plus",
    "x",

    "wallet",
    "receipt-text",
    "check-circle",
    "tags",

    "info",
    "triangle-alert",
    "circle-x"
]


const generatedIcons = {}


for (const iconName of iconNames) {
    const iconData =
        getIconData(
            icons,
            iconName
        )

    if (!iconData) {
        throw new Error(
            `Lucide-Icon "${iconName}" wurde nicht gefunden.`
        )
    }

    const {
        attributes,
        body
    } = iconToSVG(
        iconData,
        {
            height: "unset"
        }
    )

    generatedIcons[iconName] = {
        attributes,
        body
    }
}


const output = `"use strict";

(() => {
    window.App.iconData =
${JSON.stringify(generatedIcons, null, 4)}
})()
`


await mkdir(
    "./js/generated",
    {
        recursive: true
    }
)


await writeFile(
    "./js/generated/icons-data.js",
    output,
    "utf8"
)


console.log(
    `\${iconNames.length} Moneta-Icons generiert.`
)