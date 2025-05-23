"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import * as SQLite from "expo-sqlite"

interface DatabaseContextType {
  db: SQLite.SQLiteDatabase | null
  isLoading: boolean
  initializeUserData: (userId: string) => Promise<void>
  clearUserData: () => Promise<void>
  executeQuery: (query: string, params?: any[]) => Promise<any[]>
  executeBatch: (queries: { query: string; params?: any[] }[]) => Promise<void>
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined)

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function initializeDatabase() {
      try {
        // Open database
        const database = SQLite.openDatabase("tradetrack.db")
        setDb(database)

        // Create tables
        await createTables(database)

        setIsLoading(false)
      } catch (error) {
        console.error("Database initialization error:", error)
        setIsLoading(false)
      }
    }

    initializeDatabase()
  }, [])

  const createTables = async (database: SQLite.SQLiteDatabase) => {
    // Execute table creation queries
    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        company_name TEXT,
        company_logo TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Teams table
      `CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Team members table
      `CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Products table
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        category_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT,
        barcode TEXT,
        unit TEXT NOT NULL,
        cost_price REAL,
        selling_price REAL,
        min_stock_level REAL,
        current_stock REAL NOT NULL DEFAULT 0,
        image_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      )`,

      // Customers table
      `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        tax_number TEXT,
        credit_limit REAL DEFAULT 0,
        notes TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      )`,

      // Suppliers table
      `CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        tax_number TEXT,
        notes TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      )`,

      // Sales table
      `CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        sale_date TEXT NOT NULL,
        invoice_number TEXT,
        total_amount REAL NOT NULL,
        tax_amount REAL NOT NULL DEFAULT 0,
        discount_amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL,
        payment_reference TEXT,
        payment_status TEXT NOT NULL DEFAULT 'paid',
        delivery_status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      )`,

      // Sale items table
      `CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      )`,

      // Purchases table
      `CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        supplier_id TEXT NOT NULL,
        purchase_date TEXT NOT NULL,
        invoice_number TEXT,
        total_amount REAL NOT NULL,
        tax_amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL,
        payment_reference TEXT,
        payment_status TEXT NOT NULL DEFAULT 'paid',
        notes TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      )`,

      // Purchase items table
      `CREATE TABLE IF NOT EXISTS purchase_items (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        purchase_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_cost REAL NOT NULL,
        total_cost REAL NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      )`,

      // Sync queue table
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        operation TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_attempt TEXT,
        status TEXT NOT NULL DEFAULT 'pending'
      )`,
    ]

    for (const query of queries) {
      await executeQuery(database, query)
    }
  }

  const executeQuery = (database: SQLite.SQLiteDatabase, query: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      database.transaction((tx) => {
        tx.executeSql(
          query,
          params,
          (_, result) => {
            const rows = result.rows._array
            resolve(rows)
          },
          (_, error) => {
            reject(error)
            return false
          },
        )
      })
    })
  }

  const executeBatch = async (queries: { query: string; params?: any[] }[]): Promise<void> => {
    if (!db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          queries.forEach(({ query, params = [] }) => {
            tx.executeSql(query, params)
          })
        },
        (error) => {
          reject(error)
        },
        () => {
          resolve()
        },
      )
    })
  }

  const initializeUserData = async (userId: string) => {
    // This function will be called when a user signs in
    // It should fetch and store essential data from the server
    if (!db) return

    try {
      // Placeholder for actual implementation
      console.log("Initializing user data for:", userId)
    } catch (error) {
      console.error("Error initializing user data:", error)
    }
  }

  const clearUserData = async () => {
    // This function will be called when a user signs out
    // It should clear all user-specific data from the local database
    if (!db) return

    try {
      const tables = [
        "users",
        "teams",
        "team_members",
        "products",
        "customers",
        "suppliers",
        "sales",
        "sale_items",
        "purchases",
        "purchase_items",
        "sync_queue",
      ]

      const queries = tables.map((table) => ({
        query: `DELETE FROM ${table}`,
      }))

      await executeBatch(queries)
    } catch (error) {
      console.error("Error clearing user data:", error)
    }
  }

  const value = {
    db,
    isLoading,
    initializeUserData,
    clearUserData,
    executeQuery: (query: string, params?: any[]) => {
      if (!db) throw new Error("Database not initialized")
      return executeQuery(db, query, params)
    },
    executeBatch,
  }

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>
}

export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (context === undefined) {
    throw new Error("useDatabase must be used within a DatabaseProvider")
  }
  return context
}
