"use strict";

;(() => {

     /**
     * Standardkategorien der Anwendung.
     *
     * Diese werden verwendet, wenn noch keine
     * Kategorien in IndexedDB gespeichert sind.
     *
     * @type {Category[]}
     */
    const defaultCategories  = [
        {
            id: "food",
            name: "Lebensmittel"
        },
        {
            id: "leisure",
            name: "Freizeit"
        }
    ];

    /**
     * Aktuell in der Anwendung verfügbare Kategorien.
     *
     * @type {Category[]}
     */
    let categories = [];

    /**
     * Gibt die Standardkategorien zurück.
     *
     * @returns {Category[]} Kopie der Standardkategorien.
     */
    const getDefaults = () => {
        return [...defaultCategories]
    };

    /**
     * Ersetzt die aktuell verfügbaren Kategorien.
     *
     * @param {Category[]} newCategories - Neue Kategorien.
     * @returns {void}
     */
    const setAll = (newCategories) => {
        categories = [...newCategories]
    };

    /**
     * Gibt alle vorhandenen Kategorien zurück.
     *
     * @returns {Category[]} Liste aller Kategorien.
     */
    const getAll = () => {
        return [...categories];
    };


    /**
     * Sucht eine Kategorie anhand ihrer ID.
     *
     * @param {string} categoryId - Technische ID der Kategorie.
     * @returns {Category | undefined} Gefundene Kategorie oder undefined.
     */
    const getById = (categoryId) => {
        return categories.find(
            (category) => category.id === categoryId
        );
    };

    /**
     * Sucht eine Kategorie anhand ihres Namens.
     *
     * Diese Funktion wird vor allem für die Migration
     * alter Ausgaben benötigt.
     *
     * @param {string} categoryName - Sichtbarer Name der Kategorie.
     * @returns {Category | undefined} Gefundene Kategorie oder undefined.
     */
    const getByName = (categoryName) => {
        return categories.find(
            (category) => category.name === categoryName
        )
    }

    window.App.categories = {
        getDefaults,
        setAll,
        getAll,
        getById,
        getByName
    };

})()