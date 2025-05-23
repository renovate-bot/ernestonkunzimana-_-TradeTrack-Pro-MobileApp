"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { useTranslation } from "react-i18next"
import { useTeam } from "../../contexts/TeamContext"
import { useDatabase } from "../../contexts/DatabaseContext"
import { Package } from "../icons"

export default function InventoryStatusCard({ navigation }: any) {
  const { t } = useTranslation()
  const { currentTeam } = useTeam()
  const { executeQuery } = useDatabase()

  const [inventoryStatus, setInventoryStatus] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    topProducts: [],
  })

  useEffect(() => {
    loadInventoryStatus()
  }, [currentTeam])

  const loadInventoryStatus = async () => {
    if (!currentTeam) return

    try {
      // Get total products
      const totalResult = await executeQuery(`SELECT COUNT(*) as count FROM products WHERE team_id = ?`, [
        currentTeam.id,
      ])

      // Get low stock products
      const lowStockResult = await executeQuery(
        `SELECT COUNT(*) as count FROM products 
         WHERE team_id = ? AND current_stock <= min_stock_level AND current_stock > 0`,
        [currentTeam.id],
      )

      // Get out of stock products
      const outOfStockResult = await executeQuery(
        `SELECT COUNT(*) as count FROM products 
         WHERE team_id = ? AND current_stock = 0`,
        [currentTeam.id],
      )

      // Get top products
      const topProductsResult = await executeQuery(
        `SELECT id, name, current_stock, min_stock_level 
         FROM products 
         WHERE team_id = ? 
         ORDER BY current_stock ASC 
         LIMIT 3`,
        [currentTeam.id],
      )

      setInventoryStatus({
        totalProducts: totalResult[0]?.count || 0,
        lowStockProducts: lowStockResult[0]?.count || 0,
        outOfStockProducts: outOfStockResult[0]?.count || 0,
        topProducts: topProductsResult || [],
      })
    } catch (error) {
      console.error("Error loading inventory status:", error)
    }
  }

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-800 mb-4">{t("dashboard.inventoryStatus")}</Text>

      <View className="bg-white rounded-lg p-4 shadow-sm">
        <View className="flex-row justify-between mb-4">
          <View className="items-center">
            <Text className="text-gray-500 text-sm">{t("inventory.total")}</Text>
            <Text className="text-xl font-bold text-gray-800">{inventoryStatus.totalProducts}</Text>
          </View>

          <View className="items-center">
            <Text className="text-gray-500 text-sm">{t("inventory.lowStock")}</Text>
            <Text className="text-xl font-bold text-yellow-500">{inventoryStatus.lowStockProducts}</Text>
          </View>

          <View className="items-center">
            <Text className="text-gray-500 text-sm">{t("inventory.outOfStock")}</Text>
            <Text className="text-xl font-bold text-red-500">{inventoryStatus.outOfStockProducts}</Text>
          </View>
        </View>

        <View className="mb-3">
          <Text className="font-medium text-gray-700 mb-2">{t("inventory.criticalItems")}</Text>

          {inventoryStatus.topProducts.length > 0 ? (
            inventoryStatus.topProducts.map((product) => (
              <View key={product.id} className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Package size={18} color={product.current_stock === 0 ? "#EF4444" : "#F59E0B"} />
                  <Text className="ml-2 font-medium">{product.name}</Text>
                </View>
                <View className="flex-row items-center">
                  {product.current_stock === 0 && (
                    <View className="bg-red-100 px-2 py-1 rounded mr-2">
                      <Text className="text-xs text-red-600">{t("inventory.outOfStock")}</Text>
                    </View>
                  )}
                  {product.current_stock > 0 && product.current_stock <= product.min_stock_level && (
                    <View className="bg-yellow-100 px-2 py-1 rounded mr-2">
                      <Text className="text-xs text-yellow-600">{t("inventory.lowStock")}</Text>
                    </View>
                  )}
                  <Text className="text-gray-800">{product.current_stock}</Text>
                </View>
              </View>
            ))
          ) : (
            <View className="items-center py-4">
              <Text className="text-gray-500">{t("inventory.noProducts")}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          className="bg-primary-50 p-3 rounded-lg flex-row items-center justify-center"
          onPress={() => navigation.navigate("InventoryNav")}
        >
          <Text className="text-primary-600 font-medium">{t("inventory.manageInventory")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
