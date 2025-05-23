"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import { useTranslation } from "react-i18next"
import { useDatabase } from "../../contexts/DatabaseContext"
import { useTeam } from "../../contexts/TeamContext"
import { useToast } from "../../contexts/ToastContext"
import Header from "../../components/common/Header"
import { MapPin, Navigation, User, Users, Truck, Package } from "../../components/icons"

export default function LocationMapScreen({ navigation, route }: any) {
  const { t } = useTranslation()
  const { executeQuery } = useDatabase()
  const { currentTeam } = useTeam()
  const { showToast } = useToast()
  const mapRef = useRef<MapView>(null)

  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapType, setMapType] = useState("standard")

  const [customers, setCustomers] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])

  const [showCustomers, setShowCustomers] = useState(true)
  const [showSuppliers, setShowSuppliers] = useState(true)
  const [showDeliveries, setShowDeliveries] = useState(true)

  const { entityType, entityId } = route.params || {}

  useEffect(() => {
    ;(async () => {
      try {
        setIsLoading(true)

        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied")
          return
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({})
        setLocation(location)

        // Load map data based on team
        if (currentTeam) {
          await loadMapData()
        }

        // If specific entity is provided, focus on it
        if (entityType && entityId) {
          focusOnEntity(entityType, entityId)
        }
      } catch (error) {
        console.error("Error setting up map:", error)
        showToast(t("common.error"), "error")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [currentTeam])

  const loadMapData = async () => {
    try {
      // Load customers with location data
      const customersResult = await executeQuery(
        `SELECT id, name, latitude, longitude, address FROM customers 
         WHERE team_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL`,
        [currentTeam?.id],
      )
      setCustomers(customersResult)

      // Load suppliers with location data
      const suppliersResult = await executeQuery(
        `SELECT id, name, latitude, longitude, address FROM suppliers 
         WHERE team_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL`,
        [currentTeam?.id],
      )
      setSuppliers(suppliersResult)

      // Load deliveries (sales with pending delivery status)
      const deliveriesResult = await executeQuery(
        `SELECT s.id, s.customer_id, c.name as customer_name, c.latitude, c.longitude, c.address, s.delivery_status
         FROM sales s
         JOIN customers c ON s.customer_id = c.id
         WHERE s.team_id = ? AND s.delivery_status = 'pending' AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL`,
        [currentTeam?.id],
      )
      setDeliveries(deliveriesResult)
    } catch (error) {
      console.error("Error loading map data:", error)
    }
  }

  const focusOnEntity = (type: string, id: string) => {
    let entity = null

    if (type === "customer") {
      entity = customers.find((c) => c.id === id)
      setShowCustomers(true)
      setShowSuppliers(false)
      setShowDeliveries(false)
    } else if (type === "supplier") {
      entity = suppliers.find((s) => s.id === id)
      setShowCustomers(false)
      setShowSuppliers(true)
      setShowDeliveries(false)
    } else if (type === "delivery") {
      entity = deliveries.find((d) => d.id === id)
      setShowCustomers(false)
      setShowSuppliers(false)
      setShowDeliveries(true)
    }

    if (entity && entity.latitude && entity.longitude) {
      mapRef.current?.animateToRegion(
        {
          latitude: Number.parseFloat(entity.latitude),
          longitude: Number.parseFloat(entity.longitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      )
    }
  }

  const handleMarkerPress = (type: string, id: string) => {
    if (type === "customer") {
      navigation.navigate("CustomersNav", {
        screen: "CustomerDetails",
        params: { customerId: id },
      })
    } else if (type === "supplier") {
      navigation.navigate("SuppliersNav", {
        screen: "SupplierDetails",
        params: { supplierId: id },
      })
    } else if (type === "delivery") {
      navigation.navigate("SalesNav", {
        screen: "SaleDetails",
        params: { saleId: id },
      })
    }
  }

  const centerOnUserLocation = () => {
    if (location) {
      mapRef.current?.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000,
      )
    }
  }

  const toggleMapType = () => {
    setMapType(mapType === "standard" ? "satellite" : "standard")
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">{t("common.loading")}</Text>
      </View>
    )
  }

  if (errorMsg) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-center mb-4 text-red-500">{errorMsg}</Text>
        <TouchableOpacity className="bg-primary-600 py-3 px-6 rounded-lg" onPress={() => navigation.goBack()}>
          <Text className="text-white font-medium">{t("common.back")}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1">
      <Header title={t("maps.locationMap")} showBack />

      <View className="flex-1">
        {location && (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            mapType={mapType}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Current location marker */}
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title={t("maps.yourLocation")}
            >
              <View className="bg-blue-500 p-2 rounded-full">
                <User size={16} color="white" />
              </View>
            </Marker>

            {/* Customer markers */}
            {showCustomers &&
              customers.map((customer) => (
                <Marker
                  key={`customer-${customer.id}`}
                  coordinate={{
                    latitude: Number.parseFloat(customer.latitude),
                    longitude: Number.parseFloat(customer.longitude),
                  }}
                  title={customer.name}
                  description={customer.address}
                  onCalloutPress={() => handleMarkerPress("customer", customer.id)}
                >
                  <View className="bg-purple-500 p-2 rounded-full">
                    <Users size={16} color="white" />
                  </View>
                </Marker>
              ))}

            {/* Supplier markers */}
            {showSuppliers &&
              suppliers.map((supplier) => (
                <Marker
                  key={`supplier-${supplier.id}`}
                  coordinate={{
                    latitude: Number.parseFloat(supplier.latitude),
                    longitude: Number.parseFloat(supplier.longitude),
                  }}
                  title={supplier.name}
                  description={supplier.address}
                  onCalloutPress={() => handleMarkerPress("supplier", supplier.id)}
                >
                  <View className="bg-green-500 p-2 rounded-full">
                    <Package size={16} color="white" />
                  </View>
                </Marker>
              ))}

            {/* Delivery markers */}
            {showDeliveries &&
              deliveries.map((delivery) => (
                <Marker
                  key={`delivery-${delivery.id}`}
                  coordinate={{
                    latitude: Number.parseFloat(delivery.latitude),
                    longitude: Number.parseFloat(delivery.longitude),
                  }}
                  title={`${t("maps.deliveryTo")} ${delivery.customer_name}`}
                  description={delivery.address}
                  onCalloutPress={() => handleMarkerPress("delivery", delivery.id)}
                >
                  <View className="bg-orange-500 p-2 rounded-full">
                    <Truck size={16} color="white" />
                  </View>
                </Marker>
              ))}
          </MapView>
        )}

        {/* Map controls */}
        <View className="absolute top-4 right-4">
          <TouchableOpacity className="bg-white p-3 rounded-full shadow-md mb-2" onPress={toggleMapType}>
            <MapPin size={20} color="#3B82F6" />
          </TouchableOpacity>

          <TouchableOpacity className="bg-white p-3 rounded-full shadow-md" onPress={centerOnUserLocation}>
            <Navigation size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Filter controls */}
        <View className="absolute bottom-4 left-4 right-4 flex-row justify-center">
          <View className="bg-white rounded-full shadow-md flex-row">
            <TouchableOpacity
              className={`py-2 px-4 rounded-full flex-row items-center ${showCustomers ? "bg-purple-100" : ""}`}
              onPress={() => setShowCustomers(!showCustomers)}
            >
              <Users size={16} color={showCustomers ? "#8B5CF6" : "#6B7280"} />
              <Text className={`ml-1 text-sm ${showCustomers ? "text-purple-700" : "text-gray-600"}`}>
                {t("maps.customers")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`py-2 px-4 rounded-full flex-row items-center ${showSuppliers ? "bg-green-100" : ""}`}
              onPress={() => setShowSuppliers(!showSuppliers)}
            >
              <Package size={16} color={showSuppliers ? "#10B981" : "#6B7280"} />
              <Text className={`ml-1 text-sm ${showSuppliers ? "text-green-700" : "text-gray-600"}`}>
                {t("maps.suppliers")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`py-2 px-4 rounded-full flex-row items-center ${showDeliveries ? "bg-orange-100" : ""}`}
              onPress={() => setShowDeliveries(!showDeliveries)}
            >
              <Truck size={16} color={showDeliveries ? "#F59E0B" : "#6B7280"} />
              <Text className={`ml-1 text-sm ${showDeliveries ? "text-orange-700" : "text-gray-600"}`}>
                {t("maps.deliveries")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}
