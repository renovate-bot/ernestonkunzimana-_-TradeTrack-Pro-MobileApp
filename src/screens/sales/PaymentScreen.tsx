"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useTranslation } from "react-i18next"
import { useDatabase } from "../../contexts/DatabaseContext"
import { useTeam } from "../../contexts/TeamContext"
import { useToast } from "../../contexts/ToastContext"
import Header from "../../components/common/Header"
import {
  processMobileMoneyPayment,
  processBankTransferPayment,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from "../../services/PaymentService"
import { DollarSign, CreditCard, Smartphone, Building } from "../../components/icons"

export default function PaymentScreen({ navigation, route }: any) {
  const { t } = useTranslation()
  const { executeQuery } = useDatabase()
  const { currentTeam } = useTeam()
  const { showToast } = useToast()

  const { amount, saleId, customerId, returnScreen } = route.params || {}

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.MOBILE_MONEY)
  const [provider, setProvider] = useState<PaymentProvider>(PaymentProvider.MTN)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [reference, setReference] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    if (!amount || !currentTeam) {
      showToast(t("payments.invalidAmount"), "error")
      return
    }

    try {
      setIsLoading(true)

      let response

      if (paymentMethod === PaymentMethod.MOBILE_MONEY) {
        if (!phoneNumber) {
          showToast(t("payments.phoneNumberRequired"), "error")
          setIsLoading(false)
          return
        }

        response = await processMobileMoneyPayment(
          amount,
          phoneNumber,
          t("payments.paymentFor", { id: saleId }),
          provider,
        )
      } else if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
        if (!email) {
          showToast(t("payments.emailRequired"), "error")
          setIsLoading(false)
          return
        }

        response = await processBankTransferPayment(amount, email, t("payments.paymentFor", { id: saleId }))
      } else {
        // For cash and other methods, just record the payment
        response = {
          success: true,
          transactionId: `MANUAL-${Date.now()}`,
          status: PaymentStatus.COMPLETED,
          message: t("payments.paymentRecorded"),
        }
      }

      if (response.success) {
        // Update the sale with payment information
        if (saleId) {
          await executeQuery(
            `UPDATE sales SET 
             payment_method = ?, 
             payment_reference = ?, 
             payment_status = ?, 
             updated_at = ? 
             WHERE id = ? AND team_id = ?`,
            [
              paymentMethod,
              response.transactionId || reference,
              response.status === PaymentStatus.COMPLETED ? "paid" : "pending",
              new Date().toISOString(),
              saleId,
              currentTeam.id,
            ],
          )
        }

        showToast(response.message, "success")

        // Navigate back to the appropriate screen
        if (returnScreen) {
          navigation.navigate(returnScreen, { saleId })
        } else {
          navigation.goBack()
        }
      } else {
        showToast(response.message, "error")
      }
    } catch (error) {
      console.error("Payment error:", error)
      showToast(t("payments.paymentError"), "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title={t("payments.processPayment")} showBack />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 p-4">
          <View className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <Text className="text-lg font-semibold text-center mb-2">{t("payments.amountToPay")}</Text>
            <Text className="text-3xl font-bold text-center text-primary-600 mb-4">${amount?.toFixed(2)}</Text>

            <View className="h-px bg-gray-200 my-2" />

            <Text className="text-gray-600 text-center">{t("payments.selectPaymentMethod")}</Text>
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <Text className="font-semibold mb-4">{t("payments.paymentMethod")}</Text>

            <View className="flex-row flex-wrap justify-between mb-4">
              <TouchableOpacity
                className={`w-[48%] p-3 rounded-lg border mb-3 items-center ${
                  paymentMethod === PaymentMethod.CASH ? "border-primary-600 bg-primary-50" : "border-gray-300"
                }`}
                onPress={() => setPaymentMethod(PaymentMethod.CASH)}
              >
                <DollarSign size={24} color={paymentMethod === PaymentMethod.CASH ? "#3B82F6" : "#6B7280"} />
                <Text
                  className={`mt-1 font-medium ${
                    paymentMethod === PaymentMethod.CASH ? "text-primary-600" : "text-gray-600"
                  }`}
                >
                  {t("payments.cash")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`w-[48%] p-3 rounded-lg border mb-3 items-center ${
                  paymentMethod === PaymentMethod.MOBILE_MONEY ? "border-primary-600 bg-primary-50" : "border-gray-300"
                }`}
                onPress={() => setPaymentMethod(PaymentMethod.MOBILE_MONEY)}
              >
                <Smartphone size={24} color={paymentMethod === PaymentMethod.MOBILE_MONEY ? "#3B82F6" : "#6B7280"} />
                <Text
                  className={`mt-1 font-medium ${
                    paymentMethod === PaymentMethod.MOBILE_MONEY ? "text-primary-600" : "text-gray-600"
                  }`}
                >
                  {t("payments.mobileMoney")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`w-[48%] p-3 rounded-lg border mb-3 items-center ${
                  paymentMethod === PaymentMethod.BANK_TRANSFER ? "border-primary-600 bg-primary-50" : "border-gray-300"
                }`}
                onPress={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
              >
                <Building size={24} color={paymentMethod === PaymentMethod.BANK_TRANSFER ? "#3B82F6" : "#6B7280"} />
                <Text
                  className={`mt-1 font-medium ${
                    paymentMethod === PaymentMethod.BANK_TRANSFER ? "text-primary-600" : "text-gray-600"
                  }`}
                >
                  {t("payments.bankTransfer")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`w-[48%] p-3 rounded-lg border mb-3 items-center ${
                  paymentMethod === PaymentMethod.CARD ? "border-primary-600 bg-primary-50" : "border-gray-300"
                }`}
                onPress={() => setPaymentMethod(PaymentMethod.CARD)}
              >
                <CreditCard size={24} color={paymentMethod === PaymentMethod.CARD ? "#3B82F6" : "#6B7280"} />
                <Text
                  className={`mt-1 font-medium ${
                    paymentMethod === PaymentMethod.CARD ? "text-primary-600" : "text-gray-600"
                  }`}
                >
                  {t("payments.card")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Money Provider Selection */}
            {paymentMethod === PaymentMethod.MOBILE_MONEY && (
              <View className="mb-4">
                <Text className="font-semibold mb-2">{t("payments.selectProvider")}</Text>

                <View className="flex-row">
                  <TouchableOpacity
                    className={`mr-3 px-4 py-2 rounded-lg ${
                      provider === PaymentProvider.MTN ? "bg-yellow-500" : "bg-gray-200"
                    }`}
                    onPress={() => setProvider(PaymentProvider.MTN)}
                  >
                    <Text
                      className={`font-medium ${provider === PaymentProvider.MTN ? "text-white" : "text-gray-600"}`}
                    >
                      MTN
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`px-4 py-2 rounded-lg ${
                      provider === PaymentProvider.AIRTEL ? "bg-red-500" : "bg-gray-200"
                    }`}
                    onPress={() => setProvider(PaymentProvider.AIRTEL)}
                  >
                    <Text
                      className={`font-medium ${provider === PaymentProvider.AIRTEL ? "text-white" : "text-gray-600"}`}
                    >
                      Airtel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Payment Details */}
            {paymentMethod === PaymentMethod.MOBILE_MONEY && (
              <View className="mb-4">
                <Text className="font-semibold mb-2">{t("payments.phoneNumber")}</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3"
                  placeholder={t("payments.enterPhoneNumber")}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            {paymentMethod === PaymentMethod.BANK_TRANSFER && (
              <View className="mb-4">
                <Text className="font-semibold mb-2">{t("payments.email")}</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3"
                  placeholder={t("payments.enterEmail")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}

            {paymentMethod === PaymentMethod.CASH && (
              <View className="mb-4">
                <Text className="font-semibold mb-2">{t("payments.reference")}</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3"
                  placeholder={t("payments.enterReference")}
                  value={reference}
                  onChangeText={setReference}
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            className={`rounded-lg p-4 items-center ${isLoading ? "bg-gray-400" : "bg-primary-600"}`}
            onPress={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">{t("payments.processPayment")}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
