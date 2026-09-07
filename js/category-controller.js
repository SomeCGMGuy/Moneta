"use strict";

(() => {
    const {
        saveCategory,
        loadCategories,
        deleteCategory
    } = window.App.db

    const {
        getDefaults: getDefaultCategories,
        setAll: setCategories
    } = window.App.categories

    const {
        renderCategoryOptions,
        renderCategoryDialogList
    } = window.App.ui

    const {
        open: openDialog,
        close: closeDialog
    } = window.App.dialog

    const {
        show: showMessage
    } = window.App.messageDialog

    const {
        expense: {
            categoryInput
        },

        categories: {
            manageButton,
            dialog,
            closeDialogButton,
            closeDialogBottomButton,
            dialogList,
            form,
            nameInput,
            expenseTypeButton,
            incomeTypeButton,
            formError,
            saveButton,
            cancelEditButton,
            deleteDialog,
            deleteMessage,
            cancelDeleteButton,
            confirmDeleteButton
        }
    } = window.App.dom


    /** @type {string | null} */
    let editingCategoryId = null

    /** @type {TransactionType} */
    let selectedCategoryType = "expense"

    /** @type {string | null} */
    let pendingCategoryDeleteId = null

    /** @type {() => Transaction[]} */
    let getTransactions = () => []

    /** @type {() => void} */
    let onCategoriesChanged = () => {}

    let eventsBound = false


    /**
     * Zeigt einen unerwarteten technischen Fehler
     * bei einer Kategorieoperation an.
     *
     * @param {string} title - Titel der Fehlermeldung.
     * @param {unknown} error - Aufgetretener Fehler.
     * @returns {void}
     */
    const showTechnicalError = (
        title,
        error
    ) => {
        console.error(
            title,
            error
        )

        const message =
            error instanceof Error
                ? error.message
                : "Ein unbekannter Fehler ist aufgetreten."

        showMessage({
            title,
            message,
            type: "error"
        })
    }


    /**
     * Lädt vorhandene Kategorien oder legt
     * beim ersten Start die Standardkategorien an.
     *
     * @returns {Promise<Category[]>}
     */
    const initializeCategories = async () => {
        let storedCategories = await loadCategories()

        if (storedCategories.length === 0) {
            const defaults = getDefaultCategories()
            for (const category of defaults) {
                await saveCategory(category)
            }
            return defaults
        }

        // Kategorien aus älteren Moneta-Versionen waren implizit Ausgaben-Kategorien.
        for (const category of storedCategories) {
            if (category.type !== "expense" && category.type !== "income") {
                await saveCategory({
                    ...category,
                    type: "expense"
                })
            }
        }

        storedCategories = await loadCategories()

        const normalized = storedCategories.map((category) => ({
            ...category,
            type: category.type === "income" ? "income" : "expense"
        }))

        const hasExpense = normalized.some((category) => category.type === "expense")
        const hasIncome = normalized.some((category) => category.type === "income")

        if (!hasExpense || !hasIncome) {
            const defaults = getDefaultCategories()
            const missingType = hasExpense ? "income" : "expense"
            for (const category of defaults.filter((item) => item.type === missingType)) {
                if (!normalized.some((item) => item.id === category.id)) {
                    await saveCategory(category)
                }
            }
        }

        return loadCategories()
    }


    /**
     * Setzt das Kategorienformular in den
     * Modus zum Hinzufügen zurück.
     *
     * @returns {void}
     */
    const setCategoryType = (type) => {
        selectedCategoryType = type
        const isExpense = type === "expense"

        expenseTypeButton.classList.toggle("is-active", isExpense)
        incomeTypeButton.classList.toggle("is-active", !isExpense)
        expenseTypeButton.setAttribute("aria-pressed", String(isExpense))
        incomeTypeButton.setAttribute("aria-pressed", String(!isExpense))
    }

    const resetCategoryForm = () => {
        editingCategoryId = null

        form.reset()
        expenseTypeButton.disabled = false
        incomeTypeButton.disabled = false
        setCategoryType("expense")

        saveButton.textContent =
            "Hinzufügen"

        cancelEditButton.classList.add(
            "hidden"
        )

        formError.classList.add(
            "hidden"
        )
    }


    /**
     * Versetzt das Kategorienformular
     * in den Bearbeitungsmodus.
     *
     * @param {Category} category - Zu bearbeitende Kategorie.
     * @returns {void}
     */
    const handleEditCategory = (category) => {
        editingCategoryId =
            category.id

        nameInput.value =
            category.name

        setCategoryType(category.type)
        expenseTypeButton.disabled = true
        incomeTypeButton.disabled = true

        saveButton.textContent =
            "Speichern"

        cancelEditButton.classList.remove(
            "hidden"
        )

        nameInput.focus()
    }


    /**
     * Prüft, ob eine Kategorie gelöscht werden darf,
     * und öffnet anschließend den Bestätigungsdialog.
     *
     * @param {Category} category - Zu löschende Kategorie.
     * @returns {void}
     */
    const handleDeleteCategory = (category) => {
        formError.classList.add(
            "hidden"
        )

        const categories =
            window.App.categories.getAll()

        const sameTypeCategories = categories.filter(
            (item) => item.type === category.type
        )

        if (sameTypeCategories.length <= 1) {
            formError.textContent =
                `Die letzte ${category.type === "income" ? "Einnahmen" : "Ausgaben"}-Kategorie kann nicht gelöscht werden.`

            formError.classList.remove(
                "hidden"
            )

            return
        }

        const transactions =
            getTransactions()

        const usageCount =
            transactions.filter(
                (transaction) =>
                    transaction.categoryId === category.id
            ).length

        if (usageCount > 0) {
            formError.textContent =
                `Die Kategorie „${category.name}“ wird noch von ${usageCount} Buchung${usageCount === 1 ? "" : "en"} verwendet und kann deshalb nicht gelöscht werden.`

            formError.classList.remove(
                "hidden"
            )

            return
        }

        pendingCategoryDeleteId =
            category.id

        deleteMessage.textContent =
            `Möchtest du „${category.name}“ wirklich löschen?`

        openDialog(
            deleteDialog
        )
    }


    /**
     * Aktualisiert alle Oberflächenelemente,
     * die direkt von Kategorien abhängen.
     *
     * @returns {void}
     */
    const refreshCategories = () => {
        const categories =
            window.App.categories.getAll()

        renderCategoryOptions(
            categoryInput,
            categories.filter((category) => category.type === "expense")
        )

        renderCategoryDialogList(
            dialogList,
            categories,
            handleEditCategory,
            handleDeleteCategory
        )
    }


    /**
     * Öffnet den Kategorien-Dialog.
     *
     * @returns {void}
     */
    const openCategoryDialog = () => {
        refreshCategories()

        openDialog(
            dialog
        )

        nameInput.focus()
    }


    /**
     * Schließt den Kategorien-Dialog.
     *
     * @returns {void}
     */
    const closeCategoryDialog = () => {
        closeDialog(
            dialog
        )
    }


    /**
     * Erstellt eine neue Kategorie oder
     * aktualisiert eine vorhandene Kategorie.
     *
     * @param {SubmitEvent} event - Submit-Event des Formulars.
     * @returns {Promise<void>}
     */
    const handleCategorySubmit = async (event) => {
        event.preventDefault()

        formError.classList.add(
            "hidden"
        )

        const name =
            nameInput.value.trim()

        if (!name) {
            return
        }

        const duplicateCategory =
            window.App.categories
                .getAll()
                .find(
                    (category) =>
                        category.name.toLowerCase() ===
                            name.toLowerCase() &&
                        category.type === selectedCategoryType &&
                        category.id !==
                            editingCategoryId
                )

        if (duplicateCategory) {
            formError.textContent =
                "Diese Kategorie existiert bereits."

            formError.classList.remove(
                "hidden"
            )

            return
        }

        try {
            /** @type {Category} */
            const category = {
                id:
                    editingCategoryId ??
                    crypto.randomUUID(),

                name,
                type: selectedCategoryType
            }

            await saveCategory(
                category
            )

            const categories =
                await loadCategories()

            setCategories(
                categories
            )

            resetCategoryForm()

            refreshCategories()

            onCategoriesChanged()

            nameInput.focus()

        } catch (error) {
            showTechnicalError(
                "Kategorie konnte nicht gespeichert werden",
                error
            )
        }
    }


    /**
     * Bricht das Löschen einer Kategorie ab.
     *
     * @returns {void}
     */
    const cancelCategoryDelete = () => {
        pendingCategoryDeleteId = null

        closeDialog(
            deleteDialog
        )
    }


    /**
     * Löscht die zuvor ausgewählte Kategorie.
     *
     * @returns {Promise<void>}
     */
    const confirmCategoryDelete = async () => {
        if (!pendingCategoryDeleteId) {
            return
        }

        try {
            const categoryId =
                pendingCategoryDeleteId

            await deleteCategory(
                categoryId
            )

            const categories =
                await loadCategories()

            setCategories(
                categories
            )

            if (
                editingCategoryId === categoryId
            ) {
                resetCategoryForm()
            }

            pendingCategoryDeleteId = null

            closeDialog(
                deleteDialog
            )

            refreshCategories()

            onCategoriesChanged()

        } catch (error) {
            showTechnicalError(
                "Kategorie konnte nicht gelöscht werden",
                error
            )
        }
    }


    /**
     * Registriert einmalig alle Event-Handler
     * des Kategorienbereichs.
     *
     * @returns {void}
     */
    const bindEvents = () => {
        if (eventsBound) {
            return
        }

        manageButton.addEventListener(
            "click",
            openCategoryDialog
        )

        closeDialogButton.addEventListener(
            "click",
            closeCategoryDialog
        )

        closeDialogBottomButton.addEventListener(
            "click",
            closeCategoryDialog
        )

        cancelEditButton.addEventListener(
            "click",
            resetCategoryForm
        )

        expenseTypeButton.addEventListener(
            "click",
            () => setCategoryType("expense")
        )

        incomeTypeButton.addEventListener(
            "click",
            () => setCategoryType("income")
        )

        form.addEventListener(
            "submit",
            handleCategorySubmit
        )

        cancelDeleteButton.addEventListener(
            "click",
            cancelCategoryDelete
        )

        confirmDeleteButton.addEventListener(
            "click",
            confirmCategoryDelete
        )

        dialog.addEventListener(
            "close",
            resetCategoryForm
        )

        deleteDialog.addEventListener(
            "close",
            () => {
                pendingCategoryDeleteId = null
            }
        )

        eventsBound = true
    }


    /**
     * Initialisiert den Kategorien-Controller.
     *
     * @param {CategoryControllerOptions} options - Abhängigkeiten des Controllers.
     * @returns {Promise<void>}
     */
    const initialize = async ({
        getTransactions: transactionProvider,
        onChange = () => {}
    }) => {
        getTransactions =
            transactionProvider

        onCategoriesChanged =
            onChange

        bindEvents()

        const categories =
            await initializeCategories()

        setCategories(
            categories
        )

        refreshCategories()
    }

    window.App.categoryController = {
        initialize
    }
})()