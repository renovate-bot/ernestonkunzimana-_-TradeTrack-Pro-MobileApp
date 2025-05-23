"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import NetInfo from "@react-native-community/netinfo"
import { supabase } from "../utils/supabase"
import { useAuth } from "./AuthContext"
import { useDatabase } from "./DatabaseContext"
import { useTeam } from "./TeamContext"
import { v4 as uuidv4 } from "uuid"

interface SyncContextType {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: Date | null
  syncStatus: {
    pending: number
    completed: number
    failed: number
  }
  addToSyncQueue: (operation: string, tableName: string, recordId: string, data: any) => Promise<void>
  syncNow: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { executeQuery } = useDatabase()
  const { currentTeam } = useTeam()
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    completed: 0,
    failed: 0,
  })
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false)

      // Trigger sync when coming back online
      if (state.isConnected && user && currentTeam) {
        syncNow()
      }
    })

    // Set up periodic sync
    if (user && currentTeam) {
      const interval = setInterval(
        () => {
          if (isOnline) {
            syncNow()
          }
        },
        5 * 60 * 1000,
      ) // Sync every 5 minutes

      setSyncInterval(interval)
    }

    return () => {
      unsubscribe()
      if (syncInterval) {
        clearInterval(syncInterval)
      }
    }
  }, [user, currentTeam, isOnline])

  useEffect(() => {
    // Update sync status count
    if (user && currentTeam) {
      updateSyncStatus()
    }
  }, [user, currentTeam, isSyncing])

  const updateSyncStatus = async () => {
    try {
      const pendingItems = await executeQuery("SELECT COUNT(*) as count FROM sync_queue WHERE status = ?", ["pending"])

      const completedItems = await executeQuery("SELECT COUNT(*) as count FROM sync_queue WHERE status = ?", [
        "completed",
      ])

      const failedItems = await executeQuery("SELECT COUNT(*) as count FROM sync_queue WHERE status = ?", ["failed"])

      setSyncStatus({
        pending: pendingItems[0]?.count || 0,
        completed: completedItems[0]?.count || 0,
        failed: failedItems[0]?.count || 0,
      })
    } catch (error) {
      console.error("Error updating sync status:", error)
    }
  }

  const addToSyncQueue = async (operation: string, tableName: string, recordId: string, data: any) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const syncItem = {
        id: uuidv4(),
        operation,
        table_name: tableName,
        record_id: recordId,
        data: JSON.stringify(data),
        created_at: new Date().toISOString(),
        attempts: 0,
        status: "pending",
      }

      await executeQuery(
        `INSERT INTO sync_queue (id, operation, table_name, record_id, data, created_at, attempts, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          syncItem.id,
          syncItem.operation,
          syncItem.table_name,
          syncItem.record_id,
          syncItem.data,
          syncItem.created_at,
          syncItem.attempts,
          syncItem.status,
        ],
      )

      // Trigger sync if online
      if (isOnline && !isSyncing) {
        syncNow()
      }

      await updateSyncStatus()
    } catch (error) {
      console.error("Error adding to sync queue:", error)
      throw error
    }
  }

  const syncNow = async () => {
    if (!user || !currentTeam || !isOnline || isSyncing) return

    setIsSyncing(true)

    try {
      // Get pending sync items
      const pendingItems = await executeQuery(`SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at ASC`, [
        "pending",
      ])

      for (const item of pendingItems) {
        try {
          const data = JSON.parse(item.data)

          switch (item.operation) {
            case "create":
              await supabase.from(item.table_name).insert(data)
              break

            case "update":
              await supabase.from(item.table_name).update(data).eq("id", item.record_id)
              break

            case "delete":
              await supabase.from(item.table_name).delete().eq("id", item.record_id)
              break
          }

          // Mark as completed
          await executeQuery(`UPDATE sync_queue SET status = ?, updated_at = ? WHERE id = ?`, [
            "completed",
            new Date().toISOString(),
            item.id,
          ])

          // Update local record sync status
          if (item.operation !== "delete") {
            await executeQuery(`UPDATE ${item.table_name} SET is_synced = 1 WHERE id = ?`, [item.record_id])
          }
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error)

          // Update attempts and status
          const attempts = item.attempts + 1
          const status = attempts >= 5 ? "failed" : "pending"

          await executeQuery(
            `UPDATE sync_queue SET attempts = ?, status = ?, last_attempt = ?, error = ? WHERE id = ?`,
            [attempts, status, new Date().toISOString(), JSON.stringify(error), item.id],
          )
        }
      }

      setLastSyncTime(new Date())
    } catch (error) {
      console.error("Error during sync:", error)
    } finally {
      setIsSyncing(false)
      await updateSyncStatus()
    }
  }

  const value = {
    isOnline,
    isSyncing,
    lastSyncTime,
    syncStatus,
    addToSyncQueue,
    syncNow,
  }

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider")
  }
  return context
}
