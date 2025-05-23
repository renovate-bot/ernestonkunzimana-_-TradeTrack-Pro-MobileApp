"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useTeam } from "../../contexts/TeamContext"
import { useSync } from "../../contexts/SyncContext"
import { useDatabase } from "../../contexts/DatabaseContext"
import { format } from "date-fns"
import Header from "../../components/common/Header"
import DashboardCard from "../../components/dashboard/DashboardCard"
import SalesChart from "../../components/dashboard/SalesChart"
import InventoryStatusCard from "../../components/dashboard/InventoryStatusCard"
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  Truck,
} from "../../components/icons"

export default function DashboardScreen({ navigation }: any) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { currentTeam } = useTeam()
  const { isOnline, syncStatus, syncNow } = useSync()
  const { executeQuery } = useDatabase()

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    pendingDeliveries: 0,
    salesTrend: [],
    recentSales: [],
    recentPurchases: [],
  })

  useEffect(() => {
    loadDashboardData()
  }, [currentTeam])

  const loadDashboardData = async () => {
    if (!currentTeam) return

    setIsLoading(true)
    try {
      // Get total sales
      const salesResult = await executeQuery(`SELECT SUM(total_amount) as total FROM sales WHERE team_id = ?`, [
        currentTeam.id,
      ])

      // Get total purchases
      const purchasesResult = await executeQuery(`SELECT SUM(total_amount) as total FROM purchases WHERE team_id = ?`, [
        currentTeam.id,
      ])

      // Get total customers
      const customersResult = await executeQuery(`SELECT COUNT(*) as count FROM customers WHERE team_id = ?`, [
        currentTeam.id,
      ])

      // Get total products
      const productsResult = await executeQuery(`SELECT COUNT(*) as count FROM products WHERE team_id = ?`, [
        currentTeam.id,
      ])

      // Get low stock products
      const lowStockResult = await executeQuery(
        `SELECT COUNT(*) as count FROM products 
         WHERE team_id = ? AND current_stock <= min_stock_level`,
        [currentTeam.id],
      )

      // Get pending deliveries
      const deliveriesResult = await executeQuery(
        `SELECT COUNT(*) as count FROM sales 
         WHERE team_id = ? AND delivery_status = 'pending'`,
        [currentTeam.id],
      )

      // Get sales trend (last 7 days)
      const today = new Date()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(today.getDate() - 7)

      const salesTrendResult = await executeQuery(
        `SELECT sale_date, SUM(total_amount) as total 
         FROM sales 
         WHERE team_id = ? AND sale_date >= ? 
         GROUP BY sale_date 
         ORDER BY sale_date ASC`,
        [currentTeam.id, format(sevenDaysAgo, "yyyy-MM-dd")],
      )

      // Get recent sales
      const recentSalesResult = await executeQuery(
        `SELECT s.id, s.sale_date, s.total_amount, c.name as customer_name 
         FROM sales s 
         JOIN customers c ON s.customer_id = c.id 
         WHERE s.team_id = ? 
         ORDER BY s.created_at DESC LIMIT 5`,
        [currentTeam.id],
      )

      // Get recent purchases
      const recentPurchasesResult = await executeQuery(
        `SELECT p.id, p.purchase_date, p.total_amount, s.name as supplier_name 
         FROM purchases p 
         JOIN suppliers s ON p.supplier_id = s.id 
         WHERE p.team_id = ? 
         ORDER BY p.created_at DESC LIMIT 5`,
        [currentTeam.id],
      )

      setDashboardData({
        totalSales: salesResult[0]?.total || 0,
        totalPurchases: purchasesResult[0]?.total || 0,
        totalCustomers: customersResult[0]?.count || 0,
        totalProducts: productsResult[0]?.count || 0,
        lowStockProducts: lowStockResult[0]?.count || 0,
        pendingDeliveries: deliveriesResult[0]?.count || 0,
        salesTrend: salesTrendResult || [],
        recentSales: recentSalesResult || [],
        recentPurchases: recentPurchasesResult || [],
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    if (isOnline) {
      await syncNow()
    }
    await loadDashboardData()
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">{t("common.loading")}</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title={t("screens.dashboard")} showMenu showNotification />

      <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
        <View className="p-4">
          {/* Sync status indicator */}
          {syncStatus.pending > 0 && (
            <TouchableOpacity
              className="bg-yellow-100 p-3 rounded-lg mb-4 flex-row items-center justify-between"
              onPress={syncNow}
              disabled={!isOnline}
            >
              <Text className="text-yellow-800">{t("sync.pendingChanges", { count: syncStatus.pending })}</Text>
              <Text className={`font-medium ${isOnline ? "text-blue-600" : "text-gray-400"}`}>
                {isOnline ? t("sync.tapToSync") : t("sync.offline")}
              </Text>
            </TouchableOpacity>
          )}

          {/* Welcome message */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-800">
              {t("dashboard.welcome", { name: user?.user_metadata?.full_name || "User" })}
            </Text>
            <Text className="text-gray-600">{format(new Date(), "EEEE, MMMM d, yyyy")}</Text>
          </View>

          {/* Key metrics */}
          <View className="flex-row flex-wrap justify-between mb-6">
            <DashboardCard
              title={t("dashboard.totalSales")}
              value={dashboardData.totalSales.toFixed(2)}
              icon={<DollarSign size={24} color="#3B82F6" />}
              trend={<ArrowUpRight size={16} color="#10B981" />}
              trendValue="+12.5%"
              onPress={() => navigation.navigate("SalesNav")}
              className="w-[48%] mb-4"
            />

            <DashboardCard
              title={t("dashboard.totalPurchases")}
              value={dashboardData.totalPurchases.toFixed(2)}
              icon={<ShoppingCart size={24} color="#EF4444" />}
              trend={<ArrowDownRight size={16} color="#EF4444" />}
              trendValue="-3.2%"
              onPress={() => navigation.navigate("PurchasesNav")}
              className="w-[48%] mb-4"
            />

            <DashboardCard
              title={t("dashboard.customers")}
              value={dashboardData.totalCustomers.toString()}
              icon={<Users size={24} color="#8B5CF6" />}
              onPress={() => navigation.navigate("CustomersNav")}
              className="w-[48%] mb-4"
            />

            <DashboardCard
              title={t("dashboard.products")}
              value={dashboardData.totalProducts.toString()}
              icon={<Package size={24} color="#F59E0B" />}
              onPress={() => navigation.navigate("InventoryNav")}
              className="w-[48%] mb-4"
            />
          </View>

          {/* Sales chart */}
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-800">{t("dashboard.salesTrend")}</Text>
              <TouchableOpacity onPress={() => navigation.navigate("ReportsNav")}>
                <Text className="text-primary-600">{t("common.viewAll")}</Text>
              </TouchableOpacity>
            </View>

            <SalesChart data={dashboardData.salesTrend} />
          </View>

          {/* Alerts section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4">{t("dashboard.alerts")}</Text>

            {dashboardData.lowStockProducts > 0 && (
              <TouchableOpacity
                className="bg-red-50 p-4 rounded-lg mb-3 flex-row items-center"
                onPress={() => navigation.navigate("InventoryNav")}
              >
                <View className="bg-red-100 p-2 rounded-full mr-3">
                  <Package size={20} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-red-800">{t("dashboard.lowStockAlert")}</Text>
                  <Text className="text-red-600">
                    {t("dashboard.lowStockDescription", { count: dashboardData.lowStockProducts })}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {dashboardData.pendingDeliveries > 0 && (
              <TouchableOpacity
                className="bg-yellow-50 p-4 rounded-lg mb-3 flex-row items-center"
                onPress={() => navigation.navigate("SalesNav")}
              >
                <View className="bg-yellow-100 p-2 rounded-full mr-3">
                  <Truck size={20} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-yellow-800">{t("dashboard.pendingDeliveriesAlert")}</Text>
                  <Text className="text-yellow-600">
                    {t("dashboard.pendingDeliveriesDescription", { count: dashboardData.pendingDeliveries })}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {dashboardData.lowStockProducts === 0 && dashboardData.pendingDeliveries === 0 && (
              <View className="bg-green-50 p-4 rounded-lg mb-3 flex-row items-center">
                <View className="bg-green-100 p-2 rounded-full mr-3">
                  <TrendingUp size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-green-800">{t("dashboard.allGoodAlert")}</Text>
                  <Text className="text-green-600">{t("dashboard.allGoodDescription")}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Inventory status */}
          <InventoryStatusCard navigation={navigation} />

          {/* Recent transactions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4">{t("dashboard.recentTransactions")}</Text>

            {dashboardData.recentSales.length > 0 ? (
              <View className="bg-white rounded-lg p-4 shadow-sm">
                {dashboardData.recentSales.map((sale, index) => (
                  <TouchableOpacity
                    key={sale.id}
                    className={`flex-row justify-between items-center py-3 ${
                      index < dashboardData.recentSales.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                    onPress={() =>
                      navigation.navigate("SalesNav", {
                        screen: "SaleDetails",
                        params: { saleId: sale.id },
                      })
                    }
                  >
                    <View>
                      <Text className="font-medium">{sale.customer_name}</Text>
                      <Text className="text-gray-500 text-sm">{format(new Date(sale.sale_date), "MMM d, yyyy")}</Text>
                    </View>
                    <Text className="font-semibold text-primary-600">${sale.total_amount.toFixed(2)}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity className="mt-3 items-center" onPress={() => navigation.navigate("SalesNav")}>
                  <Text className="text-primary-600 font-medium">{t("common.viewAll")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-white rounded-lg p-4 shadow-sm items-center justify-center py-8">
                <Text className="text-gray-500 text-center">{t("dashboard.noRecentTransactions")}</Text>
                <TouchableOpacity
                  className="mt-3 bg-primary-600 px-4 py-2 rounded-lg"
                  onPress={() => navigation.navigate("SalesNav", { screen: "CreateSale" })}
                >
                  <Text className="text-white font-medium">{t("sales.createSale")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
