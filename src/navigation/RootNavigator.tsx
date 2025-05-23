"use client"

import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useAuth } from "../contexts/AuthContext"
import AuthNavigator from "./AuthNavigator"
import MainNavigator from "./MainNavigator"
import LoadingScreen from "../screens/LoadingScreen"
import OnboardingScreen from "../screens/OnboardingScreen"
import { useTeam } from "../contexts/TeamContext"
import { View, TextInput, TouchableOpacity, Text } from "react-native"

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  const { user, isLoading: authLoading } = useAuth()
  const { currentTeam, isLoading: teamLoading } = useTeam()
  const isLoading = authLoading || teamLoading

  // Check if user has completed onboarding
  const hasCompletedOnboarding = user?.metadata?.onboarded === true

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !currentTeam ? (
        <Stack.Screen name="TeamSetup" component={TeamSetupScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  )
}

function TeamSetupScreen() {
  const { user } = useAuth()
  const { createTeam } = useTeam()
  const [teamName, setTeamName] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return

    setIsLoading(true)
    try {
      await createTeam(teamName)
    } catch (error) {
      console.error("Failed to create team:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-white p-4 justify-center">
      <Text className="text-2xl font-bold text-center mb-8">Create Your Team</Text>
      <Text className="text-gray-600 mb-6 text-center">Create a team to start managing your business</Text>

      <TextInput
        className="border border-gray-300 rounded-lg p-4 mb-4"
        placeholder="Team Name"
        value={teamName}
        onChangeText={setTeamName}
      />

      <TouchableOpacity
        className={`rounded-lg p-4 ${isLoading ? "bg-gray-400" : "bg-primary"}`}
        onPress={handleCreateTeam}
        disabled={isLoading || !teamName.trim()}
      >
        <Text className="text-white text-center font-semibold">{isLoading ? "Creating..." : "Create Team"}</Text>
      </TouchableOpacity>
    </View>
  )
}
