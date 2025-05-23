import { View, Text, TouchableOpacity } from "react-native"
import { useNavigation, DrawerActions } from "@react-navigation/native"
import { Menu, Bell, ChevronLeft, Search } from "../icons"

interface HeaderProps {
  title: string
  showBack?: boolean
  showMenu?: boolean
  showNotification?: boolean
  showSearch?: boolean
  onSearchPress?: () => void
}

export default function Header({
  title,
  showBack = false,
  showMenu = false,
  showNotification = false,
  showSearch = false,
  onSearchPress,
}: HeaderProps) {
  const navigation = useNavigation()

  return (
    <View className="bg-white px-4 py-3 flex-row items-center justify-between shadow-sm">
      <View className="flex-row items-center">
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
        )}

        {showMenu && (
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="mr-3">
            <Menu size={24} color="#374151" />
          </TouchableOpacity>
        )}

        <Text className="text-lg font-semibold text-gray-800">{title}</Text>
      </View>

      <View className="flex-row items-center">
        {showSearch && (
          <TouchableOpacity onPress={onSearchPress} className="mr-4">
            <Search size={22} color="#374151" />
          </TouchableOpacity>
        )}

        {showNotification && (
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
            <Bell size={22} color="#374151" />
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
              <Text className="text-white text-xs font-bold">3</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
