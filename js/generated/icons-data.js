"use strict";

(() => {
    window.App.iconData =
{
    "pencil": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4\"/>"
    },
    "trash-2": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 11v6m4-6v6m5-11v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"/>"
    },
    "settings-2": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M14 17H5M19 7h-9\"/><circle cx=\"17\" cy=\"17\" r=\"3\"/><circle cx=\"7\" cy=\"7\" r=\"3\"/></g>"
    },
    "moon": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\"/>"
    },
    "sun": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\"/></g>"
    },
    "plus": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 12h14m-7-7v14\"/>"
    },
    "x": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M18 6L6 18M6 6l12 12\"/>"
    },
    "wallet": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1\"/><path d=\"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4\"/></g>"
    },
    "receipt-text": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 16H8m6-8H8m8 4H8M4 3a1 1 0 0 1 1-1a1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1a1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2a1 1 0 0 1-1-1z\"/>"
    },
    "check-circle": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M21.801 10A10 10 0 1 1 17 3.335\"/><path d=\"m9 11l3 3L22 4\"/></g>"
    },
    "tags": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1zM2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193\"/><circle cx=\"10.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\"/></g>"
    },
    "info": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 16v-4m0-4h.01\"/></g>"
    },
    "triangle-alert": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01\"/>"
    },
    "circle-x": {
        "attributes": {
            "viewBox": "0 0 24 24"
        },
        "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m15 9l-6 6m0-6l6 6\"/></g>"
    }
}
})()
