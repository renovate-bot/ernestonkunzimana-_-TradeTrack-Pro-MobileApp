import { createNativeStackNavigator } from "@react-navigation/native-stack"
import LocationMapScreen from "../screens/maps/LocationMapScreen"
import { useTranslation } from "react-i18next"

const Stack = createNativeStackNavigator()

export default function MapsNavigator() {
  const { t } = useTranslation()

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LocationMap"
        component={LocationMapScreen}
        options={{
          title: t("maps.locationMap"),
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  )
}
