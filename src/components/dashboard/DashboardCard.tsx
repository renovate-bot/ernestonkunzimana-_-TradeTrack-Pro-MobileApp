import type React from "react"
import { View, Text, TouchableOpacity } from "react-native"

interface DashboardCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: React.ReactNode
  trendValue?: string
  onPress?: () => void
  className?: string
}

export default function DashboardCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  onPress,
  className = "",
}: DashboardCardProps) {
  return (
    <TouchableOpacity onPress={onPress} className={`bg-white p-4 rounded-lg shadow-sm ${className}`}>
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-gray-500 font-medium">{title}</Text>
        {icon}
      </View>

      <Text className="text-xl font-bold text-gray-800 mb-1">{value}</Text>

      {trend && trendValue && (
        <View className="flex-row items-center">
          {trend}
          <Text className="ml-1 text-xs">{trendValue}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
