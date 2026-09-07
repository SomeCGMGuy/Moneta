"use strict";

;(() => {

    /**
     * DOM-Referenzen der Monatsübersicht.
     */
    const summary = {
        currentMonthTitle:
        /** @type {HTMLElement} */
        (document.querySelector(
            "#current-month-title"
        )),

        monthInput:
            /** @type {HTMLInputElement} */
            (document.querySelector(
                "#month"
            )),

        monthlyBudgetElement:
            /** @type {HTMLElement} */
            (document.querySelector(
                "#monthly-budget"
            )),

        totalExpensesElement:
            /** @type {HTMLElement} */
            (document.querySelector(
                "#total-expenses"
            )),

        totalIncomeElement:
            /** @type {HTMLElement} */
            (document.querySelector(
                "#total-income"
            )),

        balanceElement:
            /** @type {HTMLElement} */
            (document.querySelector(
                "#monthly-balance"
            )),

        remainingBudgetElement:
            /** @type {HTMLElement} */
            (document.querySelector(
                "#remaining-budget"
            )),

        budgetProgressElement:
            /** @type {HTMLElement} */
            (document.querySelector(
                "#budget-progress"
            )),

        budgetUsagePercentElement:
            /** @type {HTMLElement} */
            (document.querySelector(
                "#budget-usage-percent"
            ))
    }


    /**
     * DOM-Referenzen des Budgetformulars.
     */
    const budget = {
        form:
            /** @type {HTMLFormElement} */
            (document.querySelector("#budget-form")),

        input:
            /** @type {HTMLInputElement} */
            (document.querySelector("#budget-input"))
    }


    const expenseForm =
        /** @type {HTMLFormElement} */
        (document.querySelector("#expense-form"))


    /**
     * DOM-Referenzen für Ausgaben.
     */
    const expense = {
        form: expenseForm,

        expenseButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector(
                "#button-transaction-expense"
            )),

        incomeButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector(
                "#button-transaction-income"
            )),

        dateInput:
            /** @type {HTMLInputElement} */
            (expenseForm.elements.namedItem("date")),

        descriptionInput:
            /** @type {HTMLInputElement} */
            (expenseForm.elements.namedItem("description")),

        amountInput:
            /** @type {HTMLInputElement} */
            (expenseForm.elements.namedItem("amount")),

        categoryInput:
            /** @type {HTMLSelectElement} */
            (expenseForm.elements.namedItem("category")),

        saveButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-add-expense")),

        saveButtonLabel:
        /** @type {HTMLElement} */
        (document.querySelector("#button-add-expense-label")),

        cancelEditButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-cancel-edit")),

        list:
            /** @type {HTMLElement} */
            (document.querySelector("#expense-list")),

        error:
            /** @type {HTMLElement} */
            (document.querySelector("#expense-form-error")),

        newTransactionButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector(
                "#button-new-transaction"
            )),

        newTransactionIcon:
            /** @type {HTMLElement} */
            (document.querySelector(
                "#icon-new-transaction"
            )),

        drawer:
            /** @type {HTMLDialogElement} */
            (document.querySelector(
                "#transaction-drawer"
            )),

        drawerTitle:
            /** @type {HTMLElement} */
            (document.querySelector(
                "#transaction-drawer-title"
            )),

        closeDrawerButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector(
                "#button-close-transaction-drawer"
            )),

        closeDrawerIcon:
            /** @type {HTMLElement} */
            (document.querySelector(
                "#icon-close-transaction-drawer"
            )),

        deleteDialog:
            /** @type {HTMLDialogElement} */
            (document.querySelector("#delete-transaction-dialog")),

        deleteMessage:
            /** @type {HTMLElement} */
            (document.querySelector("#delete-transaction-message")),

        cancelDeleteButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-cancel-delete-transaction")),

        confirmDeleteButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-confirm-delete-transaction")),

    }


    /**
     * DOM-Referenzen für Kategorien und deren Dialoge.
     */
    const categories = {
        summaryElement:
            /** @type {HTMLElement} */
            (document.querySelector("#category-summary")),

        mobileFilters:
            /** @type {HTMLElement} */
            (document.querySelector("#mobile-category-filters")),

        manageButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-manage-categories")),

        dialog:
            /** @type {HTMLDialogElement} */
            (document.querySelector("#category-dialog")),

        closeDialogButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-close-category-dialog")),

        closeDialogBottomButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-close-category-dialog-bottom")),

        dialogList:
            /** @type {HTMLElement} */
            (document.querySelector("#category-dialog-list")),

        form:
            /** @type {HTMLFormElement} */
            (document.querySelector("#category-form")),

        nameInput:
            /** @type {HTMLInputElement} */
            (document.querySelector("#category-name-input")),

        expenseTypeButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-category-type-expense")),

        incomeTypeButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-category-type-income")),

        formError:
            /** @type {HTMLElement} */
            (document.querySelector("#category-form-error")),

        saveButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-save-category")),

        cancelEditButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-cancel-category-edit")),

        deleteDialog:
            /** @type {HTMLDialogElement} */
            (document.querySelector("#delete-category-dialog")),

        deleteMessage:
            /** @type {HTMLElement} */
            (document.querySelector("#delete-category-message")),

        cancelDeleteButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-cancel-delete-category")),

        confirmDeleteButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-confirm-delete-category"))
    }

    /**
     * DOM-Referenzen für allgemeine Meldungsdialoge.
     */
    const messageDialog = {
        dialog:
            /** @type {HTMLDialogElement} */
            (document.querySelector("#message-dialog")),

        icon:
            /** @type {HTMLElement} */
            (document.querySelector("#message-dialog-icon")),

        title:
            /** @type {HTMLElement} */
            (document.querySelector("#message-dialog-title")),

        text:
            /** @type {HTMLElement} */
            (document.querySelector("#message-dialog-text")),

        closeButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-close-message-dialog"))
    }

    /**
     * DOM-Referenzen für das Farbschema.
     */
    const theme = {
        toggleButton:
            /** @type {HTMLButtonElement} */
            (document.querySelector("#button-theme-toggle")),

        icon:
            /** @type {SVGElement} */
            (document.querySelector("#theme-icon"))
    }

    /**
     * DOM-Referenzen der kompakten mobilen Navigation.
     */
    const mobile = {
        overviewButton: /** @type {HTMLButtonElement} */ (document.querySelector("#button-mobile-overview")),
        analysisButton: /** @type {HTMLButtonElement} */ (document.querySelector("#button-mobile-analysis")),
        newTransactionButton: /** @type {HTMLButtonElement} */ (document.querySelector("#button-mobile-new-transaction")),
        budgetButton: /** @type {HTMLButtonElement} */ (document.querySelector("#button-mobile-budget")),
        moreButton: /** @type {HTMLButtonElement} */ (document.querySelector("#button-mobile-more")),
        toolsCloseButton: /** @type {HTMLButtonElement} */ (document.querySelector("#button-mobile-tools-close")),
        toolsBackdrop: /** @type {HTMLElement} */ (document.querySelector("#mobile-tools-backdrop")),

        overviewIcon: /** @type {HTMLElement} */ (document.querySelector("#icon-mobile-overview")),
        analysisIcon: /** @type {HTMLElement} */ (document.querySelector("#icon-mobile-analysis")),
        newTransactionIcon: /** @type {HTMLElement} */ (document.querySelector("#icon-mobile-new-transaction")),
        budgetIcon: /** @type {HTMLElement} */ (document.querySelector("#icon-mobile-budget")),
        moreIcon: /** @type {HTMLElement} */ (document.querySelector("#icon-mobile-more")),
        toolsCloseIcon: /** @type {HTMLElement} */ (document.querySelector("#icon-mobile-tools-close")),

        analysisView: /** @type {HTMLElement} */ (document.querySelector("#mobile-analysis-view")),
        analysisExpenseButton: /** @type {HTMLButtonElement} */ (document.querySelector("#button-analysis-expense")),
        analysisIncomeButton: /** @type {HTMLButtonElement} */ (document.querySelector("#button-analysis-income")),
        analysisMonth: /** @type {HTMLElement} */ (document.querySelector("#mobile-analysis-month")),
        analysisTotalLabel: /** @type {HTMLElement} */ (document.querySelector("#mobile-analysis-total-label")),
        analysisTotal: /** @type {HTMLElement} */ (document.querySelector("#mobile-analysis-total")),
        analysisChart: /** @type {HTMLElement} */ (document.querySelector("#mobile-analysis-chart")),
        analysisList: /** @type {HTMLElement} */ (document.querySelector("#mobile-analysis-list"))
    }

    /**
     * DOM-Platzhalter für statische Icons.
     */
    const icons = {
        manageCategories:
            /** @type {HTMLElement} */
            (document.querySelector("#icon-manage-categories")),

        addExpense:
            /** @type {HTMLElement} */
            (document.querySelector("#icon-add-expense"))
    }


    window.App.dom = {
        summary,
        budget,
        expense,
        categories,
        messageDialog,
        theme,
        mobile,
        icons
    }

})()