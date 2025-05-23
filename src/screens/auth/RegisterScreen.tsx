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
import { Mail, Lock, Eye, EyeOff, User, Phone } from "../../components/icons"

export default function RegisterScreen({ navigation }: any) {
  const { t } = useTranslation()
  const { signUp } = useAuth()
  const { showToast } = useToast()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      showToast(t("auth.fillAllFields"), "error")
      return
    }

    if (password !== confirmPassword) {
      showToast(t("auth.passwordsDoNotMatch"), "error")
      return
    }

    setIsLoading(true)
    try {
      const { error, user } = await signUp(email, password, fullName, phone)

      if (error) {
        showToast(t("auth.registrationFailed"), "error")
        console.error("Registration error:", error)
      } else {
        showToast(t("auth.registrationSuccess"), "success")
        navigation.navigate("Login")
      }
    } catch (error) {
      showToast(t("auth.registrationFailed"), "error")
      console.error("Registration error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6 justify-center">
          <View className="items-center mb-8">
            <Image source={require("../../../assets/logo.png")} className="w-24 h-24" resizeMode="contain" />
            <Text className="text-2xl font-bold mt-4 text-primary-600">TradeTrack Pro</Text>
            <Text className="text-gray-500 text-center mt-2">{t("auth.registerSubtitle")}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 font-medium">{t("auth.fullName")}</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-base"
                placeholder={t("auth.fullNamePlaceholder")}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          <View className="mb-4">
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

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 font-medium">{t("auth.phone")}</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
              <Phone size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-base"
                placeholder={t("auth.phonePlaceholder")}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View className="mb-4">
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

          <View className="mb-6">
            <Text className="text-gray-700 mb-2 font-medium">{t("auth.confirmPassword")}</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-base"
                placeholder={t("auth.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            className={`rounded-lg py-3 items-center ${isLoading ? "bg-gray-400" : "bg-primary-600"}`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">{t("auth.register")}</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">{t("auth.haveAccount")} </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text className="text-primary-600 font-semibold">{t("auth.login")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
