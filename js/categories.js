"use strict";

;(() => {
    /** @type {Category[]} */
    const defaultCategories = [
        { id: "food", name: "Lebensmittel", type: "expense" },
        { id: "housing", name: "Wohnen", type: "expense" },
        { id: "mobility", name: "Mobilität", type: "expense" },
        { id: "leisure", name: "Freizeit", type: "expense" },
        { id: "shopping", name: "Shopping", type: "expense" },
        { id: "travel", name: "Urlaub", type: "expense" },
        { id: "health", name: "Gesundheit", type: "expense" },
        { id: "other-expense", name: "Sonstiges", type: "expense" },
        { id: "salary", name: "Gehalt", type: "income" },
        { id: "side-income", name: "Nebenjob", type: "income" },
        { id: "refund", name: "Erstattung", type: "income" },
        { id: "other-income", name: "Sonstiges", type: "income" }
    ]

    /** @type {Category[]} */
    let categories = []

    const normalize = (category) => ({
        ...category,
        type: category.type === "income" ? "income" : "expense"
    })

    const getDefaults = () => defaultCategories.map((category) => ({ ...category }))

    const setAll = (newCategories) => {
        categories = newCategories.map(normalize)
    }

    const getAll = () => categories.map((category) => ({ ...category }))

    const getByType = (type) => categories
        .filter((category) => category.type === type)
        .map((category) => ({ ...category }))

    const getById = (categoryId) => categories.find((category) => category.id === categoryId)

    const getByName = (categoryName) => categories.find((category) => category.name === categoryName)

    window.App.categories = {
        getDefaults,
        setAll,
        getAll,
        getByType,
        getById,
        getByName
    }
})()
