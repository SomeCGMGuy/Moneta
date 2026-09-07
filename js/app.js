"use strict";

const {
    summary: {
        currentMonthTitle,
        monthInput,
        monthlyBudgetElement,
        totalExpensesElement,
        totalIncomeElement,
        balanceElement,
        remainingBudgetElement,
        budgetProgressElement,
        budgetUsagePercentElement
    },

    budget: {
        form: budgetForm,
        input: budgetInput
    },

    expense: {
        form: expenseForm,
        dateInput,
        descriptionInput,
        amountInput,
        categoryInput,
        saveButton,
        saveButtonLabel,
        cancelEditButton,
        newTransactionIcon,
        closeDrawerIcon,
        list: expenseList,
        error: formError
    },

    categories: {
        summaryElement: categorySummaryElement,
        mobileFilters: mobileCategoryFilters
    }
} = window.App.dom

const {
    initialize: initializeCategoryController
} = window.App.categoryController

const {
    open: openDialog,
    close: closeDialog,
    isOpen: isDialogOpen,
    initialize: initializeDialogs
} = window.App.dialog

const {
    show: showMessage
} = window.App.messageDialog

const {
    formatCurrency,
    getToday,
    formatExpenseDate,
    formatMonth,
    getRemainingBudget
} = window.App.utils

const {
    saveTransaction,
    loadTransactions,

    loadSetting,
    saveSetting,
} = window.App.db

const {
    renderSummary,
    renderTransaction,
    renderTransactions,
    renderTransactionGroup,
    renderCategorySummary,
    renderCategoryOptions,
    renderMobileCategoryFilters,
    renderCategoryDialogList
} = window.App.ui;

const {
    getDefaults: getDefaultCategories,
    setAll: setCategories,
    getAll: getAllCategories,
    getByName: getCategoryByName,
    getById: getCategoryById
} = window.App.categories

const {
    initialize: initializeTheme
} = window.App.theme

const {
    initialize: initializeMobile
} = window.App.mobile

const {
    mount: mountIcon
} = window.App.icons

const {
    manageCategories: manageCategoriesIcon,
    addExpense: addExpenseIcon
} = window.App.dom.icons

const {
    initialize: initializeTransactionController,
    refresh: refreshTransactions
} = window.App.transactionController

// Unsere Beispielausgaben
/** @type {Transaction[]} */
const transactions  = [];

// Das aktuelle Monatsbudget
let monthlyBudgetCents = 270000;

// ausgewählter Monat
let selectedMonth = getToday().slice(0, 7)

// Optionaler Kategorie-Filter der mobilen Übersicht.
/** @type {string | null} */
let selectedCategoryId = null

// Der UI mitteilen welcher Monat ausgewählt wurde
monthInput.value = selectedMonth

/* ===================================
// KATEGORIEN-BEREICH
// ===================================
*/

/**
 * Aktualisiert die Kategorieübersicht
 * mit dem aktuellen App-State.
 *
 * @returns {void}
 */
const refreshCategorySummary = () => {
    renderCategorySummary({
        transactions,
        selectedMonth,
        container: categorySummaryElement
    })
}

/**
 * Aktualisiert die horizontale Kategorie-Filterleiste
 * der mobilen PWA-Ansicht.
 *
 * @returns {void}
 */
const refreshMobileCategoryFilters = () => {
    const categories =
        getAllCategories()

    const selectedCategoryStillExists =
        selectedCategoryId === null ||
        categories.some(
            (category) =>
                category.id ===
                selectedCategoryId
        )

    if (!selectedCategoryStillExists) {
        selectedCategoryId = null
    }

    renderMobileCategoryFilters({
        container: mobileCategoryFilters,
        categories,
        selectedCategoryId,
        onSelect: (categoryId) => {
            selectedCategoryId =
                categoryId

            refreshMobileCategoryFilters()
            refreshTransactions()
        }
    })
}

/* ===================================
// ENDE -KATEGORIEN-BEREICH
// ===================================
*/

/**
 * Überträgt das aktuelle Monatsbudget
 * in das Budget-Eingabefeld.
 *
 * @returns {void}
 */
const refreshBudgetForm = () => {
    budgetInput.value =
        String(monthlyBudgetCents / 100)
}

/**
 * Initialisiert die statischen Icons
 * der Hauptoberfläche.
 *
 * @returns {void}
 */
const initializeIcons = () => {
    mountIcon(
        manageCategoriesIcon,
        "settings-2",
        {
            className: "h-4 w-4"
        }
    )

    mountIcon(
        addExpenseIcon,
        "plus",
        {
            className: "h-4 w-4"
        }
    )

    mountIcon(
        newTransactionIcon,
        "plus",
        {
            className: "h-[18px] w-[18px]"
        }
    )

    mountIcon(
        closeDrawerIcon,
        "x",
        {
            className: "h-5 w-5"
        }
    )

}

/**
 * Aktualisiert alles
 */
const refreshAndReset = () => {
    refreshBudgetForm()
    refreshTransactions()
    refreshCategorySummary()
    refreshMobileCategoryFilters()
}

/**
 * Speichert ein neues Monatsbudget
 * und aktualisiert die Oberfläche.
 */
budgetForm.addEventListener("submit", async (event) => {
    event.preventDefault()

    const budgetCents =
        Math.round(
            Number(budgetInput.value) * 100
        )

    if (!Number.isFinite(budgetCents) || budgetCents < 0)
        return 

    try {
        await saveSetting(
            "monthlyBudgetCents",
            budgetCents
        )
        monthlyBudgetCents = budgetCents
        refreshSummary()
    } catch (error) {
        showUnexpectedError(
            "Budget konnte nicht gespeichert werden",
            error
        )
    }    
})

// Die Gesamtsummen alle vorhandenen Kategorien ermitteln

const refreshSummary = () => {
    renderSummary({
        transactions,
        selectedMonth,
        monthlyBudgetCents,

        currentMonthTitle,
        monthlyBudgetElement,
        totalExpensesElement,
        totalIncomeElement,
        balanceElement,
        remainingBudgetElement,
        budgetProgressElement,
        budgetUsagePercentElement
    })
}


/**
 * Zeigt einen unerwarteten technischen Fehler
 * als benutzerfreundlichen Meldungsdialog an.
 *
 * Der ursprüngliche Fehler wird zusätzlich
 * in der Konsole protokolliert.
 *
 * @param {string} title - Titel der Fehlermeldung.
 * @param {unknown} error - Aufgetretener Fehler.
 * @returns {void}
 */
const showUnexpectedError = (
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

// Änderung des aktuell ausgewählten Monats
monthInput.addEventListener(
    "change",
    () => {
    selectedMonth = 
        monthInput.value
    refreshTransactions()
    refreshSummary()
    refreshCategorySummary()
    refreshMobileCategoryFilters()
})

// END /js/logic.js

/**
 * Initialisiert die Anwendung und lädt
 * gespeicherte Daten aus IndexedDB.
 *
 * @returns {Promise<void>}
 */
const initApp = async () => {
    try {

        initializeTheme()
        initializeDialogs()
        initializeIcons()

        const storedTransactions =
            await loadTransactions()

        transactions.push(
            ...storedTransactions
        )

        await initializeCategoryController({
            getTransactions: () => transactions,

            onChange: () => {
                refreshSummary()
                refreshCategorySummary()
                refreshMobileCategoryFilters()
                refreshTransactions()
            }
        })

        
        const storedBudget =
            await loadSetting(
                "monthlyBudgetCents"
            )

        if (typeof storedBudget === "number") {
            monthlyBudgetCents =
                storedBudget
        } else {
            await saveSetting(
                "monthlyBudgetCents",
                monthlyBudgetCents
            )
        }

        initializeTransactionController({
            getTransactions: () =>
                transactions,

            getSelectedMonth: () =>
                selectedMonth,

            getCategoryFilter: () =>
                selectedCategoryId,

            onChange: () => {
                refreshSummary()
                refreshCategorySummary()
            }
        })

        initializeMobile()

        refreshBudgetForm()
        refreshSummary()
        refreshCategorySummary()
        refreshMobileCategoryFilters()
        refreshTransactions()
        

    } catch (error) {
        console.error(
            "Fehler beim Initialisieren:",
            error
        )

        const message =
            error instanceof Error
                ? error.message
                : "Ein unbekannter Fehler ist aufgetreten."

        showMessage({
            title: "Moneta konnte nicht gestartet werden",
            message:
                `Die lokalen Daten konnten nicht geladen werden. ${message}`,
            type: "critical",
            dismissible: false
        })
    }
}

initApp()
