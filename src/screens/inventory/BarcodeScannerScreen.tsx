"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { BarCodeScanner } from "expo-barcode-scanner"
import { useTranslation } from "react-i18next"
import { useDatabase } from "../../contexts/DatabaseContext"
import { useTeam } from "../../contexts/TeamContext"
import { useToast } from "../../contexts/ToastContext"
import Header from "../../components/common/Header"
import { X, Check } from "../../components/icons"

export default function BarcodeScannerScreen({ navigation, route }: any) {
  const { t } = useTranslation()
  const { executeQuery } = useDatabase()
  const { currentTeam } = useTeam()
  const { showToast } = useToast()

  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { mode = "search" } = route.params || {}

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === "granted")
    }

    getBarCodeScannerPermissions()
  }, [])

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true)
    setIsLoading(true)

    try {
      if (mode === "search") {
        // Search for product with this barcode
        const result = await executeQuery(`SELECT * FROM products WHERE barcode = ? AND team_id = ?`, [
          data,
          currentTeam?.id,
        ])

        if (result.length > 0) {
          setProduct(result[0])
          showToast(t("inventory.productFound"), "success")
        } else {
          showToast(t("inventory.productNotFound"), "error")
        }
      } else if (mode === "add") {
        // Return the barcode to the product form
        navigation.navigate("AddProduct", { barcode: data })
        return
      }
    } catch (error) {
      console.error("Error scanning barcode:", error)
      showToast(t("common.error"), "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewProduct = () => {
    if (product) {
      navigation.navigate("ProductDetails", { productId: product.id })
    }
  }

  const handleScanAgain = () => {
    setScanned(false)
    setProduct(null)
  }

  if (hasPermission === null) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>{t("inventory.requestingCameraPermission")}</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-center mb-4">{t("inventory.noCameraPermission")}</Text>
        <TouchableOpacity className="bg-primary-600 py-3 px-6 rounded-lg" onPress={() => navigation.goBack()}>
          <Text className="text-white font-medium">{t("common.back")}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1">
      <Header title={t("inventory.scanBarcode")} showBack />

      <View className="flex-1">
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />

        <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center">
          <View className="w-64 h-64 border-2 border-white opacity-70" />
          <Text className="text-white mt-4 text-center px-8">{t("inventory.scanBarcodeInstructions")}</Text>
        </View>

        {scanned && (
          <View className="absolute bottom-0 left-0 right-0 bg-white p-4 rounded-t-xl">
            {isLoading ? (
              <View className="items-center py-4">
                <Text>{t("common.loading")}</Text>
              </View>
            ) : product ? (
              <View>
                <Text className="text-lg font-bold mb-2">{product.name}</Text>
                <Text className="text-gray-600 mb-1">
                  {t("inventory.barcode")}: {product.barcode}
                </Text>
                <Text className="text-gray-600 mb-1">
                  {t("inventory.currentStock")}: {product.current_stock} {product.unit}
                </Text>
                <Text className="text-gray-600 mb-4">
                  {t("inventory.sellingPrice")}: ${product.selling_price}
                </Text>

                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="bg-gray-200 py-2 px-4 rounded-lg flex-row items-center"
                    onPress={handleScanAgain}
                  >
                    <X size={18} color="#374151" />
                    <Text className="ml-2 font-medium">{t("inventory.scanAgain")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-primary-600 py-2 px-4 rounded-lg flex-row items-center"
                    onPress={handleViewProduct}
                  >
                    <Check size={18} color="white" />
                    <Text className="ml-2 font-medium text-white">{t("inventory.viewProduct")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <Text className="text-lg font-bold mb-2">{t("inventory.productNotFound")}</Text>
                <Text className="text-gray-600 mb-4">{t("inventory.productNotFoundDescription")}</Text>

                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="bg-gray-200 py-2 px-4 rounded-lg flex-row items-center"
                    onPress={handleScanAgain}
                  >
                    <X size={18} color="#374151" />
                    <Text className="ml-2 font-medium">{t("inventory.scanAgain")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-primary-600 py-2 px-4 rounded-lg flex-row items-center"
                    onPress={() => navigation.navigate("AddProduct", { barcode: route.params?.lastScannedBarcode })}
                  >
                    <Check size={18} color="white" />
                    <Text className="ml-2 font-medium text-white">{t("inventory.addNewProduct")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
