import { View, Text, Dimensions } from "react-native"
import { LineChart } from "react-native-chart-kit"
import { format, parseISO } from "date-fns"

interface SalesChartProps {
  data: Array<{
    sale_date: string
    total: number
  }>
}

export default function SalesChart({ data }: SalesChartProps) {
  const screenWidth = Dimensions.get("window").width - 40

  // Format data for chart
  const chartData = {
    labels: data.map((item) => format(parseISO(item.sale_date), "dd/MM")),
    datasets: [
      {
        data: data.map((item) => item.total),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#3B82F6",
    },
  }

  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-gray-500">No sales data available</Text>
      </View>
    )
  }

  return (
    <View>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  )
}
