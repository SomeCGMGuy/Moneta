
/*
DOM-Related
*/

interface AppDomSummary {
    currentMonthTitle: HTMLElement
    monthInput: HTMLInputElement
    monthlyBudgetElement: HTMLElement
    totalExpensesElement: HTMLElement
    remainingBudgetElement: HTMLElement
    budgetProgressElement: HTMLElement
    budgetUsagePercentElement: HTMLElement
    totalIncomeElement: HTMLElement
    balanceElement: HTMLElement
}


interface AppDomBudget {
    form: HTMLFormElement
    input: HTMLInputElement
}


interface AppDomExpense {
    form: HTMLFormElement

    dateInput: HTMLInputElement
    descriptionInput: HTMLInputElement
    amountInput: HTMLInputElement
    categoryInput: HTMLSelectElement

    saveButton: HTMLButtonElement
    saveButtonLabel: HTMLElement

    cancelEditButton: HTMLButtonElement

    expenseButton: HTMLButtonElement
    incomeButton: HTMLButtonElement

    list: HTMLElement
    error: HTMLElement

    newTransactionButton: HTMLButtonElement
    newTransactionIcon: HTMLElement

    drawer: HTMLDialogElement
    drawerTitle: HTMLElement

    closeDrawerButton: HTMLButtonElement
    closeDrawerIcon: HTMLElement

    deleteDialog: HTMLDialogElement
    deleteMessage: HTMLElement
    cancelDeleteButton: HTMLButtonElement
    confirmDeleteButton: HTMLButtonElement

}


interface AppDomCategories {
    summaryElement: HTMLElement
    mobileFilters: HTMLElement

    manageButton: HTMLButtonElement

    dialog: HTMLDialogElement
    closeDialogButton: HTMLButtonElement
    closeDialogBottomButton: HTMLButtonElement
    dialogList: HTMLElement

    form: HTMLFormElement
    nameInput: HTMLInputElement
    formError: HTMLElement

    saveButton: HTMLButtonElement
    cancelEditButton: HTMLButtonElement

    deleteDialog: HTMLDialogElement
    deleteMessage: HTMLElement

    cancelDeleteButton: HTMLButtonElement
    confirmDeleteButton: HTMLButtonElement
}

interface AppDomMessageDialog {
    dialog: HTMLDialogElement
    icon: HTMLElement
    title: HTMLElement
    text: HTMLElement
    closeButton: HTMLButtonElement
}

/*
Expense-Related
*/


interface Expense {
    id: string
    date: string
    amountCents: number
    categoryId: string
    description: string
}

interface ExpenseInput {
    date: string
    description: string
    amount: string | number
    categoryId: string
}

type ExpenseHandler =
    (expense: Expense) => void | Promise<void>


interface RenderExpensesOptions {
    expenses: Expense[]
    selectedMonth: string
    expenseList: HTMLElement
    onEdit: ExpenseHandler
    onDelete: ExpenseHandler
}

/*
Summary-Related
*/

interface RenderSummaryOptions {
    transactions: Transaction[]
    selectedMonth: string
    monthlyBudgetCents: number

    currentMonthTitle: HTMLElement
    monthlyBudgetElement: HTMLElement
    totalExpensesElement: HTMLElement
    totalIncomeElement: HTMLElement
    balanceElement: HTMLElement
    remainingBudgetElement: HTMLElement
    budgetProgressElement: HTMLElement
    budgetUsagePercentElement: HTMLElement
}

interface RenderCategorySummaryOptions {
    transactions: Transaction[]
    selectedMonth: string
    container: HTMLElement
}

interface RenderMobileCategoryFiltersOptions {
    container: HTMLElement
    categories: Category[]
    selectedCategoryId: string | null
    onSelect: (categoryId: string | null) => void
}

/**
 * Dialog
 */

interface AppDialog {
    open(
        dialog: HTMLDialogElement
    ): void

    close(
        dialog: HTMLDialogElement,
        returnValue?: string
    ): void

    isOpen(
        dialog: HTMLDialogElement
    ): boolean

    initialize(): void
}

/**
 * Category
 */

interface Category {
    id: string
    name: string
    type: TransactionType
}

interface CategoryControllerOptions {
    getTransactions: () => Transaction[]
    onChange?: () => void
}


interface AppCategoryController {
    initialize(
        options: CategoryControllerOptions
    ): Promise<void>
}

/**
 * Namespace Related
 */


interface AppNamespace {
    utils: AppUtils
    db: AppDb
    expenses: AppExpenses
    categories: AppCategories
    dom: AppDom
    dialog: AppDialog,
    messageDialog: AppMessageDialog
    ui: AppUI,
    categoryController: AppCategoryController
    theme: AppTheme,
    iconData:
        Record<
            MonetaIconName,
            IconRenderData
        >

    icons: AppIcons
    expenseController: AppExpenseController
    transactions: AppTransactions
    transactionController: AppTransactionController
    mobile: AppMobile
}


declare var App: AppNamespace


interface Window {
    App: AppNamespace
}

interface AppDb {
    openDatabase(): Promise<IDBDatabase>

    saveTransaction(
        transaction: Transaction
    ): Promise<void>

    loadTransactions(): Promise<Transaction[]>

    deleteTransaction(transactionId: string): Promise<void>

    saveSetting(
        key: string,
        value: *)
    : Promise<void>

    loadSetting(key: string): Promise<unknown | undefined>

    saveCategory(
        category: Category
    ): Promise<void>

    loadCategories(): Promise<Category[]>

    deleteCategory(
        categoryId: string
    ): Promise<void>

}

type TransactionHandler =
    (
        transaction: Transaction
    ) => void | Promise<void>

interface RenderTransactionsOptions {
    transactions: Transaction[]
    selectedMonth: string
    transactionList: HTMLElement
    onEdit: TransactionHandler
    onDelete: TransactionHandler
    categoryId?: string | null
}

interface AppTransactions {
    create(
        data: TransactionInput
    ): Transaction

    getByMonth(
        transactions: Transaction[],
        month: string
    ): Transaction[]

    getByType(
        transactions: Transaction[],
        type: TransactionType
    ): Transaction[]

    getTotal(
        transactions: Transaction[]
    ): number

    getTotalsByCategory(
        transactions: Transaction[]
    ): Record<string, number>

    getBudgetUsagePercent(
        spentCents: number,
        budgetCents: number
    ): number

    sortByDate(
        transactions: Transaction[]
    ): Transaction[]

    groupByDate(
        transactions: Transaction[]
    ): Record<string, Transaction[]>
}

interface TransactionControllerOptions {
    getTransactions: () => Transaction[]
    getSelectedMonth: () => string
    getCategoryFilter?: () => string | null
    onChange?: () => void
}


interface AppTransactionController {
    initialize(
        options: TransactionControllerOptions
    ): void

    refresh(): void
}

interface AppDom {
    summary: AppDomSummary
    budget: AppDomBudget
    expense: AppDomExpense
    categories: AppDomCategories
    messageDialog: AppDomMessageDialog,
    mobile: AppDomMobile
    icons: AppDomIcons
}

interface AppUtils {
    formatCurrency(amountCents: number): string
    getToday(): string
    formatMonth(month: string): string
    formatExpenseDate(dateString: string): string
    getRemainingBudget(budgetCents: number, expenses: Expense[]): number
}

// Dialogs

type MessageDialogType =
    "info"
    | "warning"
    | "error"
    | "critical"


interface MessageDialogOptions {
    title: string
    message: string
    type?: MessageDialogType
    dismissible?: boolean
}


interface AppMessageDialog {
    show(
        options: MessageDialogOptions
    ): void

    close(): void
}


interface AppCategories {
    getDefaults(): Category[]

    setAll(
        categories: Category[]
    ): void

    getAll(): Category[]

    getByType(type: TransactionType): Category[]

    getById(
        categoryId: string
    ): Category | undefined

    getByName(
        categoryName: string
    ): Category | undefined
}


interface AppExpenses {
    create(data: ExpenseInput): Expense

    getTotal(expenses: Expense[]): number

    getTotalByCategory(
        expenses: Expense[],
        category: string
    ): number

    getByMonth(
        expenses: Expense[],
        month: string
    ): Expense[]

    sortByDate(
        expenses: Expense[]
    ): Expense[]

    groupByDate(
        expenses: Expense[]
    ): Record<string, Expense[]>

    getBudgetUsagePercent(
        spentCents: number,
        budgetCents: number
    ): number

    getTotalsByCategory(
        expenses: Expense[]
    ): Record<string, number>

}

interface AppUI {
    renderSummary(
        options: RenderSummaryOptions
    ): void

    renderTransaction(
        transaction: Transaction,
        onEdit: TransactionHandler,
        onDelete: TransactionHandler
    ): HTMLElement

    renderTransactionGroup(
        date: string,
        transactions: Transaction[],
        onEdit: TransactionHandler,
        onDelete: TransactionHandler
    ): HTMLElement

    renderTransactions(
        options: RenderTransactionsOptions
    ): void

    renderCategorySummary(
        options: RenderCategorySummaryOptions
    ): void

    renderCategoryOptions(
        selectElement: HTMLSelectElement,
        categories: Category[]
    ): void

    renderMobileCategoryFilters(
        options: RenderMobileCategoryFiltersOptions
    ): void

    renderCategoryDialogList(
        container: HTMLElement,
        categories: Category[],
        onEdit: (category: Category) => void,
        onDelete: (category: Category) => void
    ): void
}

interface AppDomMobile {
    overviewButton: HTMLButtonElement
    newTransactionButton: HTMLButtonElement
    toolsButton: HTMLButtonElement
    toolsCloseButton: HTMLButtonElement
    toolsBackdrop: HTMLElement
    overviewIcon: HTMLElement
    newTransactionIcon: HTMLElement
    toolsIcon: HTMLElement
    toolsCloseIcon: HTMLElement
}

interface AppMobile {
    initialize(): void
    setToolsOpen(isOpen: boolean): void
}

interface AppDomTheme {
    toggleButton: HTMLButtonElement
    icon: SVGElement
}

interface AppDom {
    summary: AppDomSummary
    budget: AppDomBudget
    expense: AppDomExpense
    categories: AppDomCategories
    messageDialog: AppDomMessageDialog
    theme: AppDomTheme
    mobile: AppDomMobile
}

type AppThemeName =
    "light" | "dark"


interface AppTheme {
    initialize(): void

    apply(
        theme: AppThemeName,
        persist?: boolean
    ): void

    toggle(): void
}

type TransactionType =
    "expense"
    | "income"

interface Transaction {
    id: string
    type: TransactionType
    date: string
    amountCents: number
    categoryId: string
    description: string
}

interface TransactionInput {
    type: TransactionType
    date: string
    amount: string | number
    categoryId: string
    description: string
}

type MonetaIconName =
    | "pencil"
    | "trash-2"
    | "settings-2"
    | "moon"
    | "sun"
    | "plus"
    | "x"
    | "wallet"
    | "receipt-text"
    | "check-circle"
    | "tags"
    | "info"
    | "triangle-alert"
    | "circle-x"


interface IconRenderData {
    attributes: Record<string, string>
    body: string
}


interface IconCreateOptions {
    className?: string
    label?: string | null
}


interface AppIcons {
    create(
        name: MonetaIconName,
        options?: IconCreateOptions
    ): SVGSVGElement

    mount(
        target: HTMLElement,
        name: MonetaIconName,
        options?: IconCreateOptions
    ): void

}

interface AppDomIcons {
    manageCategories: HTMLElement
    addExpense: HTMLElement
}

interface ExpenseControllerOptions {
    getExpenses: () => Expense[]
    getSelectedMonth: () => string
    onChange?: () => void
}


interface AppExpenseController {
    initialize(
        options: ExpenseControllerOptions
    ): void

    refresh(): void
}

type TransactionType =
    "expense"
    | "income"


interface Transaction {
    id: string
    type: TransactionType
    date: string
    amountCents: number
    categoryId: string
    description: string
}