"use strict";

(() => {
    const {
        expense: { newTransactionButton },
        categories: { manageButton },
        mobile: {
            overviewButton,
            analysisButton,
            newTransactionButton: mobileNewTransactionButton,
            budgetButton,
            moreButton,
            toolsCloseButton,
            toolsBackdrop,
            overviewIcon,
            analysisIcon,
            newTransactionIcon,
            budgetIcon,
            moreIcon,
            toolsCloseIcon,
            analysisExpenseButton,
            analysisIncomeButton,
            analysisMonth,
            analysisTotalLabel,
            analysisTotal,
            analysisChart,
            analysisList
        }
    } = window.App.dom

    const { mount: mountIcon } = window.App.icons
    const { formatCurrency, formatMonth } = window.App.utils
    const { getByMonth, getByType, getTotal, getTotalsByCategory } = window.App.transactions

    let initialized = false
    let currentView = "overview"
    let analysisType = "expense"
    let getTransactions = () => []
    let getSelectedMonth = () => ""

    const updateNavState = () => {
        const toolsOpen = document.body.classList.contains("moneta-tools-open")
        overviewButton.classList.toggle("is-active", !toolsOpen && currentView === "overview")
        analysisButton.classList.toggle("is-active", !toolsOpen && currentView === "analysis")
        budgetButton.classList.toggle("is-active", toolsOpen)
        moreButton.classList.remove("is-active")
    }

    const setView = (view) => {
        currentView = view
        document.body.classList.toggle("moneta-view-analysis", view === "analysis")
        closeTools()
        updateNavState()

        if (view === "analysis") {
            refreshAnalysis()
        }

        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const setToolsOpen = (isOpen) => {
        document.body.classList.toggle("moneta-tools-open", isOpen)
        toolsBackdrop.setAttribute("aria-hidden", String(!isOpen))
        updateNavState()
    }

    const closeTools = () => setToolsOpen(false)

    const setAnalysisType = (type) => {
        analysisType = type
        const isExpense = type === "expense"
        analysisExpenseButton.classList.toggle("is-active", isExpense)
        analysisIncomeButton.classList.toggle("is-active", !isExpense)
        analysisExpenseButton.setAttribute("aria-pressed", String(isExpense))
        analysisIncomeButton.setAttribute("aria-pressed", String(!isExpense))
        refreshAnalysis()
    }

    const refreshAnalysis = () => {
        if (!initialized) return

        const month = getSelectedMonth()
        const monthly = getByMonth(getTransactions(), month)
        const typed = getByType(monthly, analysisType)
        const total = getTotal(typed)
        const totalsByCategory = getTotalsByCategory(typed)

        analysisMonth.textContent = formatMonth(month)
        analysisTotalLabel.textContent = analysisType === "expense" ? "Ausgaben gesamt" : "Einnahmen gesamt"
        analysisTotal.textContent = formatCurrency(total)
        analysisList.replaceChildren()

        const entries = Object.entries(totalsByCategory).sort(([, a], [, b]) => b - a)

        if (total <= 0 || entries.length === 0) {
            analysisChart.style.background = "conic-gradient(#e2e8f0 0 100%)"
            const empty = document.createElement("div")
            empty.className = "moneta-analysis-empty"
            empty.textContent = analysisType === "expense"
                ? "In diesem Monat gibt es noch keine Ausgaben."
                : "In diesem Monat gibt es noch keine Einnahmen."
            analysisList.appendChild(empty)
            return
        }

        const palette = ["#059669", "#0d9488", "#0284c7", "#6366f1", "#8b5cf6", "#db2777", "#ea580c", "#ca8a04"]
        let cursor = 0
        const segments = entries.map(([, amount], index) => {
            const start = cursor
            cursor += (amount / total) * 100
            return `${palette[index % palette.length]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`
        })
        analysisChart.style.background = `conic-gradient(${segments.join(", ")})`

        entries.forEach(([categoryId, amount], index) => {
            const category = window.App.categories.getById(categoryId)
            const name = category?.name ?? "Unbekannte Kategorie"
            const percent = (amount / total) * 100

            const item = document.createElement("article")
            item.className = "moneta-analysis-item"

            const dot = document.createElement("span")
            dot.className = "moneta-analysis-dot"
            dot.style.background = palette[index % palette.length]

            const text = document.createElement("div")
            text.className = "moneta-analysis-item-text"
            const title = document.createElement("strong")
            title.textContent = name
            const subtitle = document.createElement("span")
            subtitle.textContent = `${percent.toFixed(1)} %`
            text.append(title, subtitle)

            const amountEl = document.createElement("strong")
            amountEl.className = "moneta-analysis-item-amount"
            amountEl.textContent = formatCurrency(amount)

            item.append(dot, text, amountEl)
            analysisList.appendChild(item)
        })
    }

    const initialize = ({
        getTransactions: transactionProvider = () => [],
        getSelectedMonth: monthProvider = () => ""
    } = {}) => {
        if (initialized) return
        initialized = true
        getTransactions = transactionProvider
        getSelectedMonth = monthProvider

        mountIcon(overviewIcon, "wallet", { className: "h-5 w-5" })
        mountIcon(analysisIcon, "receipt-text", { className: "h-5 w-5" })
        mountIcon(newTransactionIcon, "plus", { className: "h-7 w-7" })
        mountIcon(budgetIcon, "wallet", { className: "h-5 w-5" })
        mountIcon(moreIcon, "settings-2", { className: "h-5 w-5" })
        mountIcon(toolsCloseIcon, "x", { className: "h-5 w-5" })

        overviewButton.addEventListener("click", () => setView("overview"))
        analysisButton.addEventListener("click", () => setView("analysis"))
        mobileNewTransactionButton.addEventListener("click", () => {
            closeTools()
            newTransactionButton.click()
        })
        budgetButton.addEventListener("click", () => setToolsOpen(!document.body.classList.contains("moneta-tools-open")))
        moreButton.addEventListener("click", () => {
            closeTools()
            manageButton.click()
        })
        toolsCloseButton.addEventListener("click", closeTools)
        toolsBackdrop.addEventListener("click", closeTools)
        analysisExpenseButton.addEventListener("click", () => setAnalysisType("expense"))
        analysisIncomeButton.addEventListener("click", () => setAnalysisType("income"))

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && document.body.classList.contains("moneta-tools-open")) {
                closeTools()
            }
        })

        updateNavState()
        refreshAnalysis()
    }

    window.App.mobile = {
        initialize,
        setToolsOpen,
        setView,
        refreshAnalysis
    }
})()
