"use strict";

(() => {
    /**
     * Erstellt und validiert eine neue Buchung.
     *
     * @param {TransactionInput} data - Eingabedaten.
     * @returns {Transaction} Vollständige Buchung.
     * @throws {Error} Wenn Eingabedaten ungültig sind.
     */
    const create = ({
        type,
        date,
        description,
        amount,
        categoryId
    }) => {
        const amountCents =
            Math.round(
                Number(amount) * 100
            )

        if (
            type !== "expense" &&
            type !== "income"
        ) {
            throw new Error(
                "Ungültiger Buchungstyp."
            )
        }

        if (!date) {
            throw new Error(
                "Bitte ein Datum auswählen."
            )
        }

        if (!description.trim()) {
            throw new Error(
                "Bitte eine Beschreibung eingeben."
            )
        }

        if (!categoryId) {
            throw new Error(
                "Bitte eine Kategorie auswählen."
            )
        }

        if (
            !Number.isFinite(amountCents) ||
            amountCents <= 0
        ) {
            throw new Error(
                "Bitte einen gültigen Betrag eingeben."
            )
        }

        return {
            id: crypto.randomUUID(),
            type,
            date,
            amountCents,
            categoryId,
            description:
                description.trim()
        }
    }


    /**
     * Filtert Buchungen nach Monat.
     *
     * @param {Transaction[]} transactions - Buchungen.
     * @param {string} month - Monat im Format YYYY-MM.
     * @returns {Transaction[]}
     */
    const getByMonth = (
        transactions,
        month
    ) => {
        return transactions.filter(
            (transaction) =>
                transaction.date.startsWith(
                    month
                )
        )
    }


    /**
     * Filtert Buchungen nach Typ.
     *
     * @param {Transaction[]} transactions - Buchungen.
     * @param {TransactionType} type - Gewünschter Typ.
     * @returns {Transaction[]}
     */
    const getByType = (
        transactions,
        type
    ) => {
        return transactions.filter(
            (transaction) =>
                transaction.type === type
        )
    }


    /**
     * Berechnet die Gesamtsumme
     * einer Buchungsliste.
     *
     * @param {Transaction[]} transactions - Buchungen.
     * @returns {number} Gesamtsumme in Cent.
     */
    const getTotal = (transactions) => {
        return transactions.reduce(
            (total, transaction) =>
                total +
                transaction.amountCents,
            0
        )
    }


    /**
     * Sortiert Buchungen nach Datum,
     * neueste zuerst.
     *
     * @param {Transaction[]} transactions - Buchungen.
     * @returns {Transaction[]}
     */
    const sortByDate = (
        transactions
    ) => {
        return [...transactions]
            .sort(
                (a, b) =>
                    b.date.localeCompare(
                        a.date
                    )
            )
    }


    /**
     * Gruppiert Buchungen nach Datum.
     *
     * @param {Transaction[]} transactions - Buchungen.
     * @returns {Record<string, Transaction[]>}
     */
    const groupByDate = (
        transactions
    ) => {
        return transactions.reduce(
            (groups, transaction) => {
                if (!groups[transaction.date]) {
                    groups[transaction.date] = []
                }

                groups[
                    transaction.date
                ].push(
                    transaction
                )

                return groups
            },
            /** @type {Record<string, Transaction[]>} */ ({})
        )
    }

    /**
     * Berechnet die Gesamtsummen je Kategorie.
     *
     * @param {Transaction[]} transactions - Auszuwertende Buchungen.
     * @returns {Record<string, number>} Summen je Kategorie-ID in Cent.
     */
    const getTotalsByCategory = (transactions) => {
        return transactions.reduce(
            (totals, transaction) => {
                const categoryId =
                    transaction.categoryId

                totals[categoryId] =
                    (totals[categoryId] ?? 0) +
                    transaction.amountCents

                return totals
            },
            /** @type {Record<string, number>} */ ({})
        )
    }


    /**
     * Berechnet den prozentualen Verbrauch
     * eines Budgets.
     *
     * @param {number} spentCents - Ausgaben in Cent.
     * @param {number} budgetCents - Budget in Cent.
     * @returns {number} Verbrauch in Prozent.
     */
    const getBudgetUsagePercent = (
        spentCents,
        budgetCents
    ) => {
        if (budgetCents <= 0) {
            return 0
        }

        return (
            spentCents /
            budgetCents
        ) * 100
    }


    window.App.transactions = {
        create,
        getByMonth,
        getByType,
        getTotal,
        getTotalsByCategory,
        getBudgetUsagePercent,
        sortByDate,
        groupByDate
    }
})()