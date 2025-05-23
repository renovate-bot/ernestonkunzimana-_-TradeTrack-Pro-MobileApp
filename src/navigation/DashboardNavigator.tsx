import { createNativeStackNavigator } from "@react-navigation/native-stack"
import DashboardScreen from "../screens/dashboard/DashboardScreen"
import NotificationsScreen from "../screens/dashboard/NotificationsScreen"
import { useTranslation } from "react-i18next"

const Stack = createNativeStackNavigator()

export default function DashboardNavigator() {
  const { t } = useTranslation()

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t("screens.dashboard"),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: t("screens.notifications"),
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  )
}
