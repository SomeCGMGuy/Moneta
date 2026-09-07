"use strict";

(() => {
    const {
        saveTransaction,
        deleteTransaction
    } = window.App.db

    const {
        create: createTransaction
    } = window.App.transactions

    const {
        renderTransactions
    } = window.App.ui

    const {
        show: showMessage
    } = window.App.messageDialog

    const {
        expense: {
            form,
            newTransactionButton,
            newTransactionIcon,
            drawer,
            drawerTitle,
            closeDrawerButton,
            closeDrawerIcon,
            expenseButton,
            incomeButton,
            dateInput,
            descriptionInput,
            amountInput,
            categoryInput,
            saveButtonLabel,
            cancelEditButton,
            list,
            error: formError
        }
    } = window.App.dom


    /** @type {string | null} */
    let editingTransactionId = null

    /** @type {TransactionType} */
    let selectedTransactionType =
        "expense"

    /** @type {() => Transaction[]} */
    let getTransactions = () => []

    /** @type {() => string} */
    let getSelectedMonth = () => ""

    /** @type {() => string | null} */
    let getCategoryFilter = () => null

    /** @type {() => void} */
    let onTransactionsChanged = () => {}

    let eventsBound = false

    /**
     * Aktualisiert den aktuell ausgewählten
     * Buchungstyp und dessen Darstellung.
     *
     * @param {TransactionType} type - Neuer Buchungstyp.
     * @returns {void}
     */
    const setTransactionType = (type) => {
        selectedTransactionType =
            type

        const isExpense =
            type === "expense"

        expenseButton.classList.toggle(
            "bg-white",
            isExpense
        )

        expenseButton.classList.toggle(
            "shadow-sm",
            isExpense
        )

        expenseButton.classList.toggle(
            "text-slate-900",
            isExpense
        )

        expenseButton.classList.toggle(
            "dark:bg-slate-700",
            isExpense
        )

        expenseButton.classList.toggle(
            "dark:text-white",
            isExpense
        )

        expenseButton.classList.toggle(
            "text-slate-500",
            !isExpense
        )

        expenseButton.classList.toggle(
            "dark:text-slate-400",
            !isExpense
        )


        incomeButton.classList.toggle(
            "bg-white",
            !isExpense
        )

        incomeButton.classList.toggle(
            "shadow-sm",
            !isExpense
        )

        incomeButton.classList.toggle(
            "text-slate-900",
            !isExpense
        )

        incomeButton.classList.toggle(
            "dark:bg-slate-700",
            !isExpense
        )

        incomeButton.classList.toggle(
            "dark:text-white",
            !isExpense
        )

        incomeButton.classList.toggle(
            "text-slate-500",
            isExpense
        )

        incomeButton.classList.toggle(
            "dark:text-slate-400",
            isExpense
        )


        saveButtonLabel.textContent =
            type === "expense"
                ? "Ausgabe hinzufügen"
                : "Einnahme hinzufügen"

        updateSaveButtonLabel()

    }

    /**
     * Zeigt einen technischen Fehler
     * als Meldungsdialog an.
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
     * Aktualisiert die dargestellte Buchungsliste.
     *
     * @returns {void}
     */
    const refresh = () => {
        renderTransactions({
            transactions: getTransactions(),
            selectedMonth: getSelectedMonth(),
            transactionList: list,
            onEdit: handleEditTransaction,
            onDelete: handleDeleteTransaction,
            categoryId: getCategoryFilter()
        })
    }

    /**
     * Setzt das Buchungsformular zurück.
     *
     * @returns {void}
     */
    const resetForm = () => {
        editingTransactionId = null

        form.reset()

        setTransactionType(
            "expense"
        )

        dateInput.value =
            window.App.utils.getToday()

        cancelEditButton.classList.add(
            "hidden"
        )

        formError.classList.add(
            "hidden"
        )
    }


    /**
     * Versetzt das Buchungsformular
     * in den Bearbeitungsmodus.
     *
     * @param {Transaction} transaction - Zu bearbeitende Buchung.
     * @returns {void}
     */
    const handleEditTransaction = (
        transaction
    ) => {
        editingTransactionId =
            transaction.id

        dateInput.value =
            transaction.date

        descriptionInput.value =
            transaction.description

        amountInput.value =
            String(
                transaction.amountCents / 100
            )

        categoryInput.value =
            transaction.categoryId

        saveButtonLabel.textContent =
            "Änderungen Speichern"

        cancelEditButton.classList.remove(
            "hidden"
        )

        setTransactionType(
            transaction.type
        )

        drawerTitle.textContent =
            "Buchung bearbeiten"

        openDrawer()

        descriptionInput.focus()
    }


    /**
     * Löscht eine Buchung dauerhaft.
     *
     * @param {Transaction} transaction - Zu löschende Buchung.
     * @returns {Promise<void>}
     */
    const handleDeleteTransaction = async (
        transaction
    ) => {
        try {
            await deleteTransaction(
                transaction.id
            )

            const transactions =
                getTransactions()

            const index =
                transactions.findIndex(
                    (item) =>
                        item.id ===
                        transaction.id
                )

            if (index !== -1) {
                transactions.splice(
                    index,
                    1
                )
            }

            if (
                editingTransactionId ===
                transaction.id
            ) {
                resetForm()
            }

            refresh()

            onTransactionsChanged()

        } catch (error) {
            /*
            * Die Karte wurde bereits visuell
            * ausgeblendet.
            *
            * Falls IndexedDB fehlschlägt,
            * rendern wir sie aus dem unveränderten
            * Runtime-State wieder neu.
            */
            refresh()

            showTechnicalError(
                "Buchung konnte nicht gelöscht werden",
                error
            )
        }
    }


    /**
     * Verarbeitet das Speichern einer neuen
     * oder bearbeiteten Buchung.
     *
     * @param {SubmitEvent} event - Submit-Event des Formulars.
     * @returns {Promise<void>}
     */
    const handleSubmit = async (event) => {
        event.preventDefault()

        formError.classList.add(
            "hidden"
        )

        const formData =
            new FormData(form)

        try {
            if (editingTransactionId) {
                const transactions =
                    getTransactions()

                const existingTransaction =
                    transactions.find(
                        (transaction) =>
                            transaction.id ===
                            editingTransactionId
                    )

                if (!existingTransaction) {
                    throw new Error(
                        "Die zu bearbeitende Buchung wurde nicht gefunden."
                    )
                }

                const amountCents =
                    Math.round(
                        Number(
                            formData.get("amount")
                        ) * 100
                    )

                if (
                    !Number.isFinite(amountCents) ||
                    amountCents <= 0
                ) {
                    formError.textContent =
                        "Bitte einen gültigen Betrag eingeben."

                    formError.classList.remove(
                        "hidden"
                    )

                    closeDrawer()

                    return
                }

                /** @type {Transaction} */
                const updatedTransaction = {
                    ...existingTransaction,

                    type: selectedTransactionType,

                    date: String(
                        formData.get("date") ?? ""
                    ),

                    description: String(
                        formData.get("description") ?? ""
                    ).trim(),

                    amountCents,

                    categoryId: String(
                        formData.get("category") ?? ""
                    )
                }

                await saveTransaction(
                    updatedTransaction
                )

                Object.assign(
                    existingTransaction,
                    updatedTransaction
                )

            } else {
                const transaction =
                    createTransaction({
                        type: selectedTransactionType,

                        date: String(
                            formData.get("date") ?? ""
                        ),

                        description: String(
                            formData.get("description") ?? ""
                        ),

                        amount: String(
                            formData.get("amount") ?? ""
                        ),

                        categoryId: String(
                            formData.get("category") ?? ""
                        )
                    })

                await saveTransaction(
                    transaction
                )

                getTransactions().push(
                    transaction
                )
            }

            resetForm()

            refresh()
            closeDrawer()
            onTransactionsChanged()

        } catch (error) {
            if (error instanceof Error) {
                formError.textContent =
                    error.message

                formError.classList.remove(
                    "hidden"
                )

                return
            }

            showTechnicalError(
                "Buchung konnte nicht gespeichert werden",
                error
            )
        }
    }


    /**
     * Fängt das native Schließen per ESC ab,
     * damit zuerst die Drawer-Animation läuft.
     *
     * @param {Event} event
     * @returns {void}
     */
    const handleDrawerCancel = (
        event
    ) => {
        event.preventDefault()

        closeDrawer()
    }

    /**
     * Schließt den Drawer beim Klick
     * auf den Backdrop.
     *
     * @param {MouseEvent} event
     * @returns {void}
     */
    const handleDrawerBackdropClick = (
        event
    ) => {
        if (event.target !== drawer) {
            return
        }

        event.stopImmediatePropagation()

        closeDrawer()
    }

    /**
     * Aktualisiert den Text des Speichern-Buttons
     * abhängig vom aktuellen Bearbeitungsmodus
     * und Buchungstyp.
     *
     * @returns {void}
     */
    const updateSaveButtonLabel = () => {
        if (editingTransactionId !== null) {
            saveButtonLabel.textContent =
                "Änderungen speichern"

            return
        }

        saveButtonLabel.textContent =
            selectedTransactionType === "expense"
                ? "Ausgabe hinzufügen"
                : "Einnahme hinzufügen"
    }    

    /**
     * Registriert einmalig die Events
     * des Buchungsformulars.
     *
     * @returns {void}
     */
    const bindEvents = () => {
        if (eventsBound) {
            return
        }

        form.addEventListener(
            "submit",
            handleSubmit
        )

        expenseButton.addEventListener(
            "click",
            () => {
                setTransactionType(
                    "expense"
                )
            }
        )

        incomeButton.addEventListener(
            "click",
            () => {
                setTransactionType(
                    "income"
                )
            }
        )

        newTransactionButton.addEventListener(
            "click",
            handleNewTransaction
        )

        closeDrawerButton.addEventListener(
            "click",
            closeDrawer
        )

        cancelEditButton.addEventListener(
            "click",
            () => {
                resetForm()
                closeDrawer()
            }
        )

        drawer.addEventListener(
            "cancel",
            handleDrawerCancel
        )

        drawer.addEventListener(
            "click",
            handleDrawerBackdropClick,
            true
        )

        drawer.addEventListener(
            "close",
            () => {
                drawer.classList.remove(
                    "is-closing"
                )

                document.documentElement.classList.remove(
                    "moneta-transaction-open"
                )

                document.body.classList.remove(
                    "moneta-transaction-open"
                )

                resetForm()
            }
        )

        eventsBound = true
    }


    /**
     * Öffnet den Drawer für eine Buchung.
     *
     * @returns {void}
     */
    const openDrawer = () => {
        if (!drawer.open) {
            document.documentElement.classList.add(
                "moneta-transaction-open"
            )

            document.body.classList.add(
                "moneta-transaction-open"
            )

            drawer.showModal()
        }

        requestAnimationFrame(
            () => {
                descriptionInput.focus()
            }
        )
    }
    
    /**
     * Schließt den Drawer nach der
     * Schließanimation.
     *
     * @returns {void}
     */
    const closeDrawer = () => {
        if (!drawer.open) {
            return
        }

        const prefersReducedMotion =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches

        if (prefersReducedMotion) {
            drawer.close()
            return
        }

        drawer.classList.add(
            "is-closing"
        )

        /**
         * Schließt den Dialog, sobald die
         * Drawer-Animation beendet wurde.
         *
         * @param {AnimationEvent} event
         * @returns {void}
         */
        const handleAnimationEnd = (
            event
        ) => {
            if (
                event.target !== drawer ||
                (event.animationName !==
                    "moneta-drawer-out" &&
                 event.animationName !==
                    "moneta-mobile-drawer-out")
            ) {
                return
            }

            drawer.removeEventListener(
                "animationend",
                handleAnimationEnd
            )

            drawer.classList.remove(
                "is-closing"
            )

            drawer.close()
        }

        drawer.addEventListener(
            "animationend",
            handleAnimationEnd
        )

        window.setTimeout(
            () => {
                if (
                    drawer.open &&
                    drawer.classList.contains(
                        "is-closing"
                    )
                ) {
                    drawer.classList.remove(
                        "is-closing"
                    )

                    drawer.close()
                }
            },
            320
        )
    }


    /**
     * Startet das Erfassen einer neuen Buchung.
     *
     * @returns {void}
     */
    const handleNewTransaction = () => {
        resetForm()

        drawerTitle.textContent =
            "Neue Buchung"

        updateSaveButtonLabel()

        openDrawer()
    }

    /**
     * Initialisiert den Transaction-Controller.
     *
     * @param {TransactionControllerOptions} options - Abhängigkeiten des Controllers.
     * @returns {void}
     */
    const initialize = ({
        getTransactions: transactionProvider,
        getSelectedMonth: monthProvider,
        getCategoryFilter: categoryFilterProvider = () => null,
        onChange = () => {}
    }) => {
        getTransactions =
            transactionProvider

        getSelectedMonth =
            monthProvider

        getCategoryFilter =
            categoryFilterProvider

        onTransactionsChanged =
            onChange

        bindEvents()

        resetForm()
        refresh()
    }


    window.App.transactionController = {
        initialize,
        refresh
    }
})()