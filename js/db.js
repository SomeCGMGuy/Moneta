"use strict";

;(() => {

    const DB_NAME = "expense-tracker"
    const DB_VERSION = 5
    const STORE_SETTINGS = "settings"
    const STORE_CATEGORIES = "categories"
    const STORE_TRANSACTIONS =
        "transactions"

    /**
     * Öffnet die IndexedDB-Datenbank der Anwendung.
     * Erstellt beim ersten Öffnen den Object Store "expenses".
     *
     * @returns {Promise<IDBDatabase>} Die geöffnete IndexedDB-Datenbank.
     */
    const openDatabase = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(
                DB_NAME, 
                DB_VERSION
            )

            request.onupgradeneeded = (event) => {
                const db = request.result

                if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
                    db.createObjectStore(STORE_SETTINGS, {
                        keyPath: "key"
                    })
                }

                if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
                    db.createObjectStore(
                        STORE_CATEGORIES,
                        { keyPath: "id" }
                    )
                }

                if (
                    !db.objectStoreNames.contains(
                        STORE_TRANSACTIONS
                    )
                ) {
                    db.createObjectStore(
                        STORE_TRANSACTIONS,
                        {
                            keyPath: "id"
                        }
                    )
                }

            }

            request.onsuccess = () => 
                resolve(request.result)

            request.onerror = () => 
                reject(request.error)

        })
    }

    /**
 * Speichert oder aktualisiert eine Einstellung.
 *
 * @param {string} key - Eindeutiger Name der Einstellung.
 * @param {*} value - Zu speichernder Wert.
 * @returns {Promise<void>}
 */
    const saveSetting = async (key, value) => {
        const db = await openDatabase()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                STORE_SETTINGS,
                "readwrite"
            )

            const store =
                transaction.objectStore(STORE_SETTINGS)

            store.put({
                key,
                value
            })

            transaction.oncomplete = () => {
                resolve()
            }

            transaction.onerror = () => {
                reject(transaction.error)
            }
        })
    }

    /**
     * Lädt eine Einstellung anhand ihres Schlüssels.
     *
     * @param {string} key - Eindeutiger Name der Einstellung.
     * @returns {Promise<unknown | undefined>} Gespeicherter Wert oder undefined.
     */
    const loadSetting = async (key) => {
        const db = await openDatabase()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                STORE_SETTINGS,
                "readonly"
            )

            const store =
                transaction.objectStore(STORE_SETTINGS)

            const request = store.get(key)

            request.onsuccess = () => {
                resolve(request.result?.value)
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    }

    /**
     * Speichert oder aktualisiert eine Kategorie.
     *
     * @param {Category} category - Zu speichernde Kategorie.
     * @returns {Promise<void>}
     */
    const saveCategory = async (category) => {
        const db = await openDatabase()

        return new Promise((resolve, reject) => {
            const transaction =
                db.transaction(
                    STORE_CATEGORIES,
                    "readwrite"
                )

            const store =
                transaction.objectStore(
                    STORE_CATEGORIES
                )

            store.put(category)

            transaction.oncomplete = () =>
                resolve()

            transaction.onerror = () =>
                reject(transaction.error)
        })
    }


    /**
     * Lädt alle gespeicherten Kategorien.
     *
     * @returns {Promise<Category[]>}
     */
    const loadCategories = async () => {
        const db = await openDatabase()

        return new Promise((resolve, reject) => {
            const transaction =
                db.transaction(
                    STORE_CATEGORIES,
                    "readonly"
                )

            const store =
                transaction.objectStore(
                    STORE_CATEGORIES
                )

            const request =
                store.getAll()

            request.onsuccess = () =>
                resolve(request.result)

            request.onerror = () =>
                reject(request.error)
        })
    }

    /**
     * Löscht eine Kategorie anhand ihrer ID.
     *
     * @param {string} categoryId - ID der zu löschenden Kategorie.
     * @returns {Promise<void>}
     */
    const deleteCategory = async (categoryId) => {
        const db = await openDatabase()

        return new Promise((resolve, reject) => {
            const transaction =
                db.transaction(
                    STORE_CATEGORIES,
                    "readwrite"
                )

            const store =
                transaction.objectStore(
                    STORE_CATEGORIES
                )

            store.delete(categoryId)

            transaction.oncomplete = () =>
                resolve()

            transaction.onerror = () =>
                reject(transaction.error)
        })
    }

    /**
     * Speichert oder aktualisiert eine Buchung.
     *
     * @param {Transaction} transaction - Zu speichernde Buchung.
     * @returns {Promise<void>}
     */
    const saveTransaction = async (
        transaction
    ) => {
        const db =
            await openDatabase()

        return new Promise(
            (resolve, reject) => {
                const dbTransaction =
                    db.transaction(
                        STORE_TRANSACTIONS,
                        "readwrite"
                    )

                const store =
                    dbTransaction.objectStore(
                        STORE_TRANSACTIONS
                    )

                store.put(
                    transaction
                )

                dbTransaction.oncomplete =
                    () => resolve()

                dbTransaction.onerror =
                    () => reject(
                        dbTransaction.error
                    )
            }
        )
    }

    /**
     * Lädt alle gespeicherten Buchungen.
     *
     * @returns {Promise<Transaction[]>}
     */
    const loadTransactions = async () => {
        const db =
            await openDatabase()

        return new Promise(
            (resolve, reject) => {
                const dbTransaction =
                    db.transaction(
                        STORE_TRANSACTIONS,
                        "readonly"
                    )

                const store =
                    dbTransaction.objectStore(
                        STORE_TRANSACTIONS
                    )

                const request =
                    store.getAll()

                request.onsuccess =
                    () => resolve(
                        request.result
                    )

                request.onerror =
                    () => reject(
                        request.error
                    )
            }
        )
    }

    /**
     * Löscht eine Buchung anhand ihrer ID.
     *
     * @param {string} transactionId - ID der zu löschenden Buchung.
     * @returns {Promise<void>}
     */
    const deleteTransaction = async (
        transactionId
    ) => {
        const db =
            await openDatabase()

        return new Promise(
            (resolve, reject) => {
                const dbTransaction =
                    db.transaction(
                        STORE_TRANSACTIONS,
                        "readwrite"
                    )

                const store =
                    dbTransaction.objectStore(
                        STORE_TRANSACTIONS
                    )

                store.delete(
                    transactionId
                )

                dbTransaction.oncomplete =
                    () => resolve()

                dbTransaction.onerror =
                    () => reject(
                        dbTransaction.error
                    )
            }
        )
    }

    window.App.db = {
        openDatabase,
        
        saveTransaction,
        loadTransactions,
        deleteTransaction,

        saveSetting,
        loadSetting,
        
        saveCategory,
        loadCategories,
        deleteCategory
    }

})()