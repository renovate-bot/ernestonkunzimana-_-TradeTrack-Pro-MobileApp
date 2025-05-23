import { createDrawerNavigator } from "@react-navigation/drawer"
import { useTranslation } from "react-i18next"
import CustomDrawerContent from "../components/navigation/CustomDrawerContent"
import DashboardNavigator from "./DashboardNavigator"
import InventoryNavigator from "./InventoryNavigator"
import SalesNavigator from "./SalesNavigator"
import PurchasesNavigator from "./PurchasesNavigator"
import CustomersNavigator from "./CustomersNavigator"
import SuppliersNavigator from "./SuppliersNavigator"
import ReportsNavigator from "./ReportsNavigator"
import SettingsNavigator from "./SettingsNavigator"
import MapsNavigator from "./MapsNavigator"
import { Dimensions } from "react-native"
import { Map, BarChart2 } from "../components/icons"

const Drawer = createDrawerNavigator()
const { width } = Dimensions.get("window")

export default function MainNavigator() {
  const { t } = useTranslation()

  return (
    <Drawer.Navigator
      initialRouteName="DashboardNav"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: width >= 768 ? "permanent" : "front",
        drawerStyle: {
          width: width >= 768 ? 280 : "80%",
        },
      }}
    >
      <Drawer.Screen
        name="DashboardNav"
        component={DashboardNavigator}
        options={{ title: t("navigation.dashboard") }}
      />
      <Drawer.Screen
        name="InventoryNav"
        component={InventoryNavigator}
        options={{ title: t("navigation.inventory") }}
      />
      <Drawer.Screen name="SalesNav" component={SalesNavigator} options={{ title: t("navigation.sales") }} />
      <Drawer.Screen
        name="PurchasesNav"
        component={PurchasesNavigator}
        options={{ title: t("navigation.purchases") }}
      />
      <Drawer.Screen
        name="CustomersNav"
        component={CustomersNavigator}
        options={{ title: t("navigation.customers") }}
      />
      <Drawer.Screen
        name="SuppliersNav"
        component={SuppliersNavigator}
        options={{ title: t("navigation.suppliers") }}
      />
      <Drawer.Screen
        name="MapsNav"
        component={MapsNavigator}
        options={{
          title: t("maps.locationMap"),
          drawerIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="ReportsNav"
        component={ReportsNavigator}
        options={{
          title: t("navigation.reports"),
          drawerIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
      <Drawer.Screen name="SettingsNav" component={SettingsNavigator} options={{ title: t("navigation.settings") }} />
    </Drawer.Navigator>
  )
}
