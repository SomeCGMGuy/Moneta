"use strict";

;(() => {

    // Eine Hilfsfunktion zum formatieren von Cent in Euro
    const currencyFormatter = new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
    });

    /**
     * Formatiert einen Betrag in Cent als Euro-Wert.
     *
     * @param {number} amountCents - Betrag in Cent.
     * @returns {string} Formatierter Geldbetrag.
     */
    const formatCurrency = (amountCents) => {
        return currencyFormatter.format(amountCents / 100);
    };


    // Gibt das aktuelle ISO Datum aus in der Form
    // 2026-09-01
    const getToday = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0")
        const day = String(now.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }


    /**
     * Ermittlung des verbleibenden Monats-Budgets
     *
     * @param {number} budgetCents - Betrag in Cent.
     * @param {Expense[]} expenses - Die Ausgaben
     * @returns {number} das verbleibende Budget in Cent.
     */
    const getRemainingBudget = (
        budgetCents, 
        expenses
    ) => {
        return budgetCents - getTotal(expenses);
    };

    
    // Gibt das aktuelle Datum formatiert zurück
    // September 2026
    /**
     * 
     * @param {string} month - Der Monat in der Form 2026-09
     * @returns {string} - das formatierte Datum
     */
    const formatMonth = (month) => {
        // Array Destruction makes 2026-09 -> ["2026",  "09"]
        const [year, monthNumber] = month.split("-")

        const date = new Date(
            Number(year),
            Number(monthNumber) - 1,
            1
        )

        return new Intl.DateTimeFormat("de-DE", {
            month: "long",
            year: "numeric"
        }).format(date)
    }


    // Macht aus 2026-09-06 Sonntag, 6. September
    /**
     * 
     * @param {string} dateString - 2026-09-06
     * @returns {string} - Sonntag, 6. September
     */
    const formatExpenseDate = (dateString) => {
        const [year, month, day] = dateString
        .split("-")
        .map(Number)

        const date = new Date(
            year,
            month - 1,
            day
        )

        return new Intl.DateTimeFormat("de-DE", {
            weekday: "long",
            day: "numeric",
            month: "long"
        }).format(date)
    }

    window.App.utils = {
        formatCurrency,
        getToday,
        formatMonth,
        formatExpenseDate,
        getRemainingBudget
    }
    
})()