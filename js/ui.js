"use strict";

(() => {

    const {
        create: createIcon
    } = window.App.icons

    const {
        formatCurrency,
        formatMonth,
        formatExpenseDate
    } = window.App.utils


    const {
        getTotal,
        getByType,
        getByMonth,
        sortByDate,
        groupByDate,
        getTotalsByCategory,
        getBudgetUsagePercent
    } = window.App.transactions


    const {
        getById: getCategoryById
    } = window.App.categories


    /**
     * Rendert die Monatsübersicht.
     *
     * @param {RenderSummaryOptions} options - Daten und DOM-Elemente der Übersicht.
     * @returns {void}
     */
    const renderSummary = ({
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
    }) => {
        const monthlyTransactions =
            getByMonth(
                transactions,
                selectedMonth
            )

        const monthlyExpenses =
            getByType(
                monthlyTransactions,
                "expense"
            )

        const monthlyIncome =
            getByType(
                monthlyTransactions,
                "income"
            )

        const totalExpenseCents =
            getTotal(
                monthlyExpenses
            )

        const totalIncomeCents =
            getTotal(
                monthlyIncome
            )

        const balanceCents =
            totalIncomeCents -
            totalExpenseCents

        const remainingCents =
            monthlyBudgetCents -
            totalExpenseCents

        const usagePercent =
            getBudgetUsagePercent(
                totalExpenseCents,
                monthlyBudgetCents
            )

        const progressPercent =
            Math.min(
                Math.max(
                    usagePercent,
                    0
                ),
                100
            )

        const isOverBudget =
            totalExpenseCents >
            monthlyBudgetCents

        currentMonthTitle.textContent =
            formatMonth(
                selectedMonth
            )

        monthlyBudgetElement.textContent =
            formatCurrency(
                monthlyBudgetCents
            )

        totalExpensesElement.textContent =
            formatCurrency(
                totalExpenseCents
            )

        balanceElement.textContent =
            `${balanceCents >= 0 ? "+" : "−"} ${formatCurrency(
                Math.abs(balanceCents)
            )}`

        totalIncomeElement.textContent =
            `+ ${formatCurrency(
                totalIncomeCents
            )}`

        remainingBudgetElement.textContent =
            `${formatCurrency(
                remainingCents
            )} verbleibend`

        animateProgressBar(
            budgetProgressElement,
            progressPercent
        )

        const isPositiveBalance =
            balanceCents >= 0


        balanceElement.classList.toggle(
            "text-emerald-600",
            isPositiveBalance
        )

        balanceElement.classList.toggle(
            "dark:text-emerald-400",
            isPositiveBalance
        )

        balanceElement.classList.toggle(
            "text-red-600",
            !isPositiveBalance
        )

        balanceElement.classList.toggle(
            "dark:text-red-400",
            !isPositiveBalance
        )

        budgetUsagePercentElement.textContent =
            `${usagePercent.toFixed(1)} %`


        budgetProgressElement.classList.toggle(
            "bg-red-500",
            isOverBudget
        )

        budgetProgressElement.classList.toggle(
            "bg-emerald-500",
            !isOverBudget
        )

        remainingBudgetElement.classList.toggle(
            "text-red-600",
            isOverBudget
        )

        remainingBudgetElement.classList.toggle(
            "dark:text-red-400",
            isOverBudget
        )

        remainingBudgetElement.classList.toggle(
            "text-slate-900",
            !isOverBudget
        )

        remainingBudgetElement.classList.toggle(
            "dark:text-slate-100",
            !isOverBudget
        )
    }

    /*
     * Prüft, ob der Benutzer im Betriebssystem
     * reduzierte Animationen aktiviert hat.
     */
    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches

    /**
     * Animiert einen Fortschrittsbalken von 0
     * bis zu einem angegebenen Prozentwert.
     *
     * @param {HTMLElement} element - Zu animierender Balken.
     * @param {number} percent - Zielwert zwischen 0 und 100.
     * @param {number} [delayMs=0] - Verzögerung vor dem Start.
     * @returns {void}
     */
    const animateProgressBar = (
        element,
        percent,
        delayMs = 0
    ) => {
        const targetPercent =
            Math.min(
                Math.max(percent, 0),
                100
            )

        const effectiveDelay =
            prefersReducedMotion
                ? 0
                : delayMs

        element.classList.add(
            "moneta-progress"
        )

        element.style.width =
            "0%"

        window.setTimeout(
            () => {
                requestAnimationFrame(
                    () => {
                        requestAnimationFrame(
                            () => {
                                element.style.width =
                                    `${targetPercent}%`
                            }
                        )
                    }
                )
            },
            effectiveDelay
        )
    }


    /**
     * Spielt die Exit-Animation einer Buchung ab
     * und wartet auf deren Ende.
     *
     * @param {HTMLElement} element
     * @returns {Promise<void>}
     */
    const animateTransactionRemoval = (
        element
    ) => {
        if (prefersReducedMotion) {
            return Promise.resolve()
        }

        return new Promise(
            (resolve) => {
                /**
                 * @param {TransitionEvent} event
                 * @returns {void}
                 */
                const handleTransitionEnd = (
                    event
                ) => {
                    if (
                        event.propertyName !==
                        "opacity"
                    ) {
                        return
                    }

                    element.removeEventListener(
                        "transitionend",
                        handleTransitionEnd
                    )

                    resolve()
                }

                element.addEventListener(
                    "transitionend",
                    handleTransitionEnd
                )

                element.classList.add(
                    "is-removing"
                )
            }
        )
    }


     /**
     * Rendert eine einzelne Buchung.
     *
     * @param {Transaction} transaction - Darzustellende Buchung.
     * @param {TransactionHandler} onEdit - Callback zum Bearbeiten.
     * @param {TransactionHandler} onDelete - Callback zum Löschen.
     * @returns {HTMLElement} Fertiges DOM-Element.
     */
    const renderTransaction = (
        transaction,
        onEdit,
        onDelete
    ) => {
        const category =
            getCategoryById(
                transaction.categoryId
            )

        const categoryName =
            category?.name ??
            "Unbekannte Kategorie"

        const isIncome =
            transaction.type === "income"


        const item =
            document.createElement("article")

        item.className =
            `moneta-transaction ${isIncome ? "is-income" : "is-expense"} ` +
            "group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm " +
            "transition duration-200 hover:border-slate-300 hover:shadow-md " +
            "dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"

        item.dataset.categoryId =
            transaction.categoryId


        const content =
            document.createElement("div")

        content.className =
            "moneta-transaction-content flex items-start justify-between gap-4"


        const avatar =
            document.createElement("div")

        avatar.className =
            "moneta-transaction-avatar"

        avatar.setAttribute(
            "aria-hidden",
            "true"
        )

        avatar.textContent =
            categoryName
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "•"


        const information =
            document.createElement("div")

        information.className =
            "moneta-transaction-information min-w-0 flex-1"


        const description =
            document.createElement("p")

        description.className =
            "moneta-transaction-description truncate font-semibold text-slate-900 dark:text-slate-100"

        description.textContent =
            transaction.description


        const categoryElement =
            document.createElement("p")

        categoryElement.className =
            "moneta-transaction-category mt-1 text-sm text-slate-500 dark:text-slate-400"

        categoryElement.textContent =
            categoryName


        information.append(
            description,
            categoryElement
        )


        const amount =
            document.createElement("p")

        amount.className =
            isIncome
                ? "moneta-transaction-amount shrink-0 text-base font-bold text-emerald-600 dark:text-emerald-400"
                : "moneta-transaction-amount shrink-0 text-base font-bold text-slate-900 dark:text-slate-100"

        amount.textContent =
            `${isIncome ? "+" : "−"} ${formatCurrency(transaction.amountCents)}`


        content.append(
            avatar,
            information,
            amount
        )


        const actions =
            document.createElement("div")

        actions.className =
            "moneta-transaction-actions mt-3 flex items-center gap-1 border-t border-slate-100 pt-3 " +
            "dark:border-slate-800"


        const editButton =
            document.createElement("button")

        editButton.type =
            "button"

        editButton.className =
            "flex h-9 w-9 items-center justify-center rounded-xl " +
            "text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 " +
            "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"

        editButton.setAttribute(
            "aria-label",
            "Buchung bearbeiten"
        )

        editButton.title =
            "Bearbeiten"

        editButton.appendChild(
            createIcon(
                "pencil",
                {
                    className: "h-4 w-4"
                }
            )
        )

        editButton.addEventListener(
            "click",
            () => onEdit(transaction)
        )


        const deleteButton =
            document.createElement("button")

        deleteButton.type =
            "button"

        deleteButton.className =
            "flex h-9 w-9 items-center justify-center rounded-xl " +
            "text-red-500 transition hover:bg-red-50 " +
            "dark:text-red-400 dark:hover:bg-red-500/10"

        deleteButton.setAttribute(
            "aria-label",
            "Buchung löschen"
        )

        deleteButton.title =
            "Löschen"

        deleteButton.appendChild(
            createIcon(
                "trash-2",
                {
                    className: "h-4 w-4"
                }
            )
        )

        deleteButton.addEventListener(
    "click",
    async () => {
        deleteButton.disabled =
            true

        await animateTransactionRemoval(
            item
        )

        await onDelete(
            transaction
        )
    }
)


        actions.append(
            editButton,
            deleteButton
        )

        item.append(
            content,
            actions
        )

        return item
    }


    /**
     * Rendert eine Gruppe von Buchungen eines Tages.
     *
     * @param {string} date - Datum im Format YYYY-MM-DD.
     * @param {Transaction[]} dayTransactions - Buchungen des Tages.
     * @param {TransactionHandler} onEdit - Callback zum Bearbeiten.
     * @param {TransactionHandler} onDelete - Callback zum Löschen.
     * @returns {HTMLElement} Fertige Tagesgruppe.
     */
    const renderTransactionGroup = (
        date,
        dayTransactions,
        onEdit,
        onDelete
    ) => {
        const section =
            document.createElement("section")

        section.className =
            "moneta-day-group space-y-3"


        const header =
            document.createElement("div")

        header.className =
            "moneta-day-header flex items-center justify-between gap-4 px-1"


        const dateElement =
            document.createElement("h3")

        dateElement.className =
            "moneta-day-date font-semibold text-slate-800 dark:text-slate-200"

        dateElement.textContent =
            formatExpenseDate(date)


        const dayBalanceCents =
            dayTransactions.reduce(
                (sum, transaction) =>
                    sum +
                    (transaction.type === "income"
                        ? transaction.amountCents
                        : -transaction.amountCents),
                0
            )


        const dayTotal =
            document.createElement("span")

        const isPositiveDay =
            dayBalanceCents >= 0

        dayTotal.className =
            "moneta-day-total text-sm font-semibold " +
            (isPositiveDay
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400")

        dayTotal.textContent =
            `${isPositiveDay ? "+" : "−"} ${formatCurrency(
                Math.abs(dayBalanceCents)
            )}`


        header.append(
            dateElement,
            dayTotal
        )


        const items =
            dayTransactions.map(
                (transaction) =>
                    renderTransaction(
                        transaction,
                        onEdit,
                        onDelete
                    )
            )


        section.append(
            header,
            ...items
        )

        return section
    }


    /**
     * Rendert alle Buchungen eines ausgewählten Monats.
     *
     * @param {RenderTransactionsOptions} options - Optionen für die Darstellung.
     * @returns {void}
     */
    const renderTransactions = ({
        transactions,
        selectedMonth,
        transactionList,
        onEdit,
        onDelete,
        categoryId = null
    }) => {
        transactionList.replaceChildren()

        const monthlyTransactions =
            getByMonth(
                transactions,
                selectedMonth
            )

        const categoryTransactions =
            categoryId
                ? monthlyTransactions.filter(
                    (transaction) =>
                        transaction.categoryId ===
                        categoryId
                )
                : monthlyTransactions

        const filteredTransactions =
            sortByDate(
                categoryTransactions
            )

        if (
            filteredTransactions.length === 0
        ) {
            const emptyState =
                document.createElement("div")

            emptyState.className =
                "rounded-3xl border border-dashed border-slate-300 " +
                "bg-white/70 px-6 py-12 text-center transition-colors " +
                "dark:border-slate-700 dark:bg-slate-900/70"


            const title =
                document.createElement("p")

            title.className =
                "font-semibold text-slate-700 dark:text-slate-200"

            title.textContent =
                "Keine Buchungen in diesem Zeitraum vorhanden"


            const description =
                document.createElement("p")

            description.className =
                "mt-1 text-sm text-slate-500 dark:text-slate-400"

            description.textContent =
                `Für ${formatMonth(selectedMonth)} wurden noch keine Buchungen erfasst.`


            emptyState.append(
                title,
                description
            )

            transactionList.appendChild(
                emptyState
            )

            return
        }


        const groupedTransactions =
            groupByDate(
                filteredTransactions
            )

        const groups =
            Object.entries(
                groupedTransactions
            ).map(
                ([date, dayTransactions]) =>
                    renderTransactionGroup(
                        date,
                        dayTransactions,
                        onEdit,
                        onDelete
                    )
            )

        transactionList.append(
            ...groups
        )
    }


    /**
     * Rendert die Ausgaben nach Kategorien
     * für den ausgewählten Monat.
     *
     * @param {RenderCategorySummaryOptions} options - Optionen der Kategorieauswertung.
     * @returns {void}
     */
    const renderCategorySummary = ({
        transactions,
        selectedMonth,
        container
    }) => {
        container.replaceChildren()

        const monthlyTransactions =
            getByMonth(
                transactions,
                selectedMonth
            )

        const monthlyExpenses =
            getByType(
                monthlyTransactions,
                "expense"
            )

        const totalCents =
            getTotal(
                monthlyExpenses
            )

        const totalsByCategory =
            getTotalsByCategory(
                monthlyExpenses
            )


        if (totalCents === 0) {
            const emptyState =
                document.createElement("div")

            emptyState.className =
                "rounded-3xl border border-dashed border-slate-300 " +
                "bg-white/70 px-6 py-10 text-center transition-colors " +
                "dark:border-slate-700 dark:bg-slate-900/70"


            const title =
                document.createElement("p")

            title.className =
                "font-semibold text-slate-700 dark:text-slate-200"

            title.textContent =
                "Noch keine Kategorieauswertung vorhanden"


            const description =
                document.createElement("p")

            description.className =
                "mt-1 text-sm text-slate-500 dark:text-slate-400"

            description.textContent =
                `Für ${formatMonth(selectedMonth)} gibt es noch keine Buchungen.`


            emptyState.append(
                title,
                description
            )

            container.appendChild(
                emptyState
            )

            return
        }

        const categoryItems =
            Object.entries(
                totalsByCategory
            )
                .sort(
                    (
                        [, amountA],
                        [, amountB]
                    ) =>
                        amountB - amountA
                )
                .map(
                    ([categoryId, amountCents], index) => {

                        const delayMs = Math.min(index * 50, 300)

                        const category =
                            getCategoryById(
                                categoryId
                            )

                        const categoryName =
                            category?.name ??
                            "Unbekannte Kategorie"

                        const percent =
                            (amountCents / totalCents) *
                            100


                        const item =
                            document.createElement("article")

                        item.className =
                            "rounded-2xl border border-slate-200 bg-white p-4 " +
                            "shadow-sm transition-colors " +
                            "dark:border-slate-800 dark:bg-slate-900"


                        const header =
                            document.createElement("div")

                        header.className =
                            "flex items-center justify-between gap-3"


                        const name =
                            document.createElement("span")

                        name.className =
                            "min-w-0 truncate font-medium text-slate-800 " +
                            "dark:text-slate-200"

                        name.textContent =
                            categoryName


                        const amount =
                            document.createElement("span")

                        amount.className =
                            "shrink-0 font-semibold text-slate-900 " +
                            "dark:text-slate-100"

                        amount.textContent =
                            formatCurrency(
                                amountCents
                            )


                        header.append(
                            name,
                            amount
                        )


                        const percentText =
                            document.createElement("p")

                        percentText.className =
                            "mt-1 text-sm text-slate-500 dark:text-slate-400"

                        percentText.textContent =
                            `${percent.toFixed(1)} % der Monatsausgaben`


                        const progressTrack =
                            document.createElement("div")

                        progressTrack.className =
                            "mt-3 h-2 overflow-hidden rounded-full " +
                            "bg-slate-100 dark:bg-slate-800"


                        const progress =
                            document.createElement("div")

                        progress.className =
                            "moneta-progress h-full rounded-full bg-emerald-500"


                        progressTrack.appendChild(
                            progress
                        )

                        animateProgressBar(
                            progress,
                            percent,
                            delayMs
                        )

                        item.append(
                            header,
                            percentText,
                            progressTrack
                        )

                        return item
                    }
                )


        container.append(
            ...categoryItems
        )
    }


    /**
     * Rendert die verfügbaren Kategorien
     * in ein Select-Element.
     *
     * @param {HTMLSelectElement} selectElement - Ziel-Select.
     * @param {Category[]} categories - Verfügbare Kategorien.
     * @returns {void}
     */
    const renderCategoryOptions = (
        selectElement,
        categories
    ) => {
        const selectedValue =
            selectElement.value

        selectElement.replaceChildren()

        const options =
            categories.map(
                (category) => {
                    const option =
                        document.createElement("option")

                    option.value =
                        category.id

                    option.textContent =
                        category.name

                    return option
                }
            )

        selectElement.append(
            ...options
        )


        const selectedCategoryStillExists =
            categories.some(
                (category) =>
                    category.id === selectedValue
            )

        if (selectedCategoryStillExists) {
            selectElement.value =
                selectedValue
        }
    }


    /**
     * Rendert die kompakte Kategorie-Navigation
     * der mobilen Übersicht.
     *
     * @param {Object} options - Optionen der Filterleiste.
     * @param {HTMLElement} options.container - Zielcontainer.
     * @param {Category[]} options.categories - Verfügbare Kategorien.
     * @param {string | null} options.selectedCategoryId - Aktiver Filter.
     * @param {(categoryId: string | null) => void} options.onSelect - Auswahl-Callback.
     * @returns {void}
     */
    const renderMobileCategoryFilters = ({
        container,
        categories,
        selectedCategoryId,
        onSelect
    }) => {
        container.replaceChildren()

        const filters = [
            {
                id: null,
                name: "Alle"
            },
            ...categories
        ]

        const buttons =
            filters.map(
                (filter) => {
                    const button =
                        document.createElement("button")

                    button.type =
                        "button"

                    const isActive =
                        filter.id ===
                        selectedCategoryId

                    button.className =
                        `moneta-category-filter${isActive ? " is-active" : ""}`

                    button.textContent =
                        filter.name

                    button.setAttribute(
                        "aria-pressed",
                        String(isActive)
                    )

                    button.addEventListener(
                        "click",
                        () => onSelect(filter.id)
                    )

                    return button
                }
            )

        container.append(
            ...buttons
        )
    }


    /**
     * Rendert die vorhandenen Kategorien
     * im Kategorien-Dialog.
     *
     * @param {HTMLElement} container - Zielbereich im Dialog.
     * @param {Category[]} categories - Verfügbare Kategorien.
     * @param {(category: Category) => void} onEdit - Callback zum Bearbeiten.
     * @param {(category: Category) => void} onDelete - Callback zum Löschen.
     * @returns {void}
     */
    const renderCategoryDialogList = (
        container,
        categories,
        onEdit,
        onDelete
    ) => {
        container.replaceChildren()

        const items =
            categories.map(
                (category) => {
                    const item =
                        document.createElement("div")

                    item.className =
                        "flex items-center justify-between gap-3 " +
                        "rounded-2xl border border-slate-200 bg-slate-50 " +
                        "px-4 py-3 transition-colors " +
                        "dark:border-slate-700 dark:bg-slate-800"


                    const name =
                        document.createElement("span")

                    name.className =
                        "min-w-0 flex-1 truncate font-medium " +
                        "text-slate-800 dark:text-slate-200"

                    name.textContent =
                        category.name


                    const actions =
                        document.createElement("div")

                    actions.className =
                        "flex shrink-0 items-center gap-1"


                    const editButton =
                        document.createElement("button")

                    editButton.type =
                        "button"

                    editButton.className =
                        "flex h-9 w-9 items-center justify-center rounded-xl " +
                        "text-slate-500 transition " +
                        "hover:bg-white hover:text-slate-900 " +
                        "dark:text-slate-400 dark:hover:bg-slate-700 " +
                        "dark:hover:text-white"

                    editButton.setAttribute(
                        "aria-label",
                        "Kategorie bearbeiten"
                    )

                    editButton.title =
                        "Bearbeiten"

                    editButton.appendChild(
                        createIcon(
                            "pencil",
                            {
                                className: "h-4 w-4"
                            }
                        )
                    )

                    editButton.addEventListener(
                        "click",
                        () => onEdit(category)
                    )


                    const deleteButton =
                        document.createElement("button")

                    deleteButton.type =
                        "button"

                    deleteButton.className =
                        "flex h-9 w-9 items-center justify-center rounded-xl " +
                        "text-red-500 transition hover:bg-red-50 " +
                        "dark:text-red-400 dark:hover:bg-red-500/10"

                    deleteButton.setAttribute(
                        "aria-label",
                        "Kategorie löschen"
                    )

                    deleteButton.title =
                        "Löschen"

                    deleteButton.appendChild(
                        createIcon(
                            "trash-2",
                            {
                                className: "h-4 w-4"
                            }
                        )
                    )

                    deleteButton.addEventListener(
                        "click",
                        () => onDelete(category)
                    )


                    actions.append(
                        editButton,
                        deleteButton
                    )

                    item.append(
                        name,
                        actions
                    )

                    return item
                }
            )


        container.append(
            ...items
        )
    }


    window.App.ui = {
        renderSummary,
        renderTransaction,
        renderTransactionGroup,
        renderTransactions,
        renderCategorySummary,
        renderCategoryOptions,
        renderMobileCategoryFilters,
        renderCategoryDialogList
    }
})()