"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useToast } from "../../contexts/ToastContext"
import { Mail, Lock, Eye, EyeOff } from "../../components/icons"

export default function LoginScreen({ navigation }: any) {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const { showToast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      showToast(t("auth.fillAllFields"), "error")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await signIn(email, password)

      if (error) {
        showToast(t("auth.loginFailed"), "error")
        console.error("Login error:", error)
      }
    } catch (error) {
      showToast(t("auth.loginFailed"), "error")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6 justify-center">
          <View className="items-center mb-8">
            <Image source={require("../../../assets/logo.png")} className="w-32 h-32" resizeMode="contain" />
            <Text className="text-2xl font-bold mt-4 text-primary-600">TradeTrack Pro</Text>
            <Text className="text-gray-500 text-center mt-2">{t("auth.loginSubtitle")}</Text>
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 mb-2 font-medium">{t("auth.email")}</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
              <Mail size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-base"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 mb-2 font-medium">{t("auth.password")}</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-base"
                placeholder={t("auth.passwordPlaceholder")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} className="mb-6">
            <Text className="text-primary-600 text-right">{t("auth.forgotPassword")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className={`rounded-lg py-3 items-center ${isLoading ? "bg-gray-400" : "bg-primary-600"}`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">{t("auth.login")}</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">{t("auth.noAccount")} </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text className="text-primary-600 font-semibold">{t("auth.register")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
