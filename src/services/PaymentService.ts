import { Platform } from "react-native"
import * as WebBrowser from "expo-web-browser"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "../utils/supabase"

// Payment methods
export enum PaymentMethod {
  CASH = "cash",
  MOBILE_MONEY = "mobile_money",
  BANK_TRANSFER = "bank_transfer",
  CARD = "card",
}

// Payment providers
export enum PaymentProvider {
  MTN = "mtn",
  AIRTEL = "airtel",
  BANK = "bank",
  STRIPE = "stripe",
}

// Payment status
export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

// Payment request interface
interface PaymentRequest {
  amount: number
  currency: string
  reference: string
  phoneNumber?: string
  email?: string
  description: string
  callbackUrl?: string
  provider: PaymentProvider
  method: PaymentMethod
}

// Payment response interface
interface PaymentResponse {
  success: boolean
  transactionId?: string
  status: PaymentStatus
  message: string
  paymentUrl?: string
}

/**
 * Process a mobile money payment
 */
export async function processMobileMoneyPayment(
  amount: number,
  phoneNumber: string,
  description: string,
  provider: PaymentProvider = PaymentProvider.MTN,
): Promise<PaymentResponse> {
  try {
    // Generate a unique reference
    const reference = `TTP-${uuidv4().substring(0, 8)}`

    // In a real implementation, this would call the MTN Mobile Money API
    // For this demo, we'll simulate the API call

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // For demo purposes, we'll assume the payment is initiated successfully
    const paymentUrl = `https://mtn-momo-pay.example.com/pay/${reference}`

    // Record the payment request in the database
    await supabase.from("payment_requests").insert({
      id: uuidv4(),
      reference,
      amount,
      phone_number: phoneNumber,
      description,
      provider,
      method: PaymentMethod.MOBILE_MONEY,
      status: PaymentStatus.PENDING,
      created_at: new Date().toISOString(),
    })

    // Open the payment URL in a browser if on mobile
    if (Platform.OS !== "web") {
      await WebBrowser.openBrowserAsync(paymentUrl)
    }

    return {
      success: true,
      transactionId: reference,
      status: PaymentStatus.PENDING,
      message: "Payment initiated successfully",
      paymentUrl,
    }
  } catch (error) {
    console.error("Mobile money payment error:", error)
    return {
      success: false,
      status: PaymentStatus.FAILED,
      message: "Failed to process mobile money payment",
    }
  }
}

/**
 * Process a bank transfer payment
 */
export async function processBankTransferPayment(
  amount: number,
  email: string,
  description: string,
): Promise<PaymentResponse> {
  try {
    // Generate a unique reference
    const reference = `TTP-${uuidv4().substring(0, 8)}`

    // In a real implementation, this would generate bank transfer details
    // For this demo, we'll simulate the process

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Record the payment request in the database
    await supabase.from("payment_requests").insert({
      id: uuidv4(),
      reference,
      amount,
      email,
      description,
      provider: PaymentProvider.BANK,
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PENDING,
      created_at: new Date().toISOString(),
    })

    return {
      success: true,
      transactionId: reference,
      status: PaymentStatus.PENDING,
      message: "Bank transfer initiated. Please complete the transfer using the provided details.",
    }
  } catch (error) {
    console.error("Bank transfer payment error:", error)
    return {
      success: false,
      status: PaymentStatus.FAILED,
      message: "Failed to process bank transfer",
    }
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(reference: string): Promise<PaymentStatus> {
  try {
    // In a real implementation, this would call the payment provider's API
    // For this demo, we'll check our local database

    const { data, error } = await supabase.from("payment_requests").select("status").eq("reference", reference).single()

    if (error || !data) {
      throw new Error("Payment not found")
    }

    return data.status as PaymentStatus
  } catch (error) {
    console.error("Check payment status error:", error)
    throw error
  }
}

/**
 * Update payment status (for webhook or callback handling)
 */
export async function updatePaymentStatus(
  reference: string,
  status: PaymentStatus,
  transactionId?: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("payment_requests")
      .update({
        status,
        transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Update payment status error:", error)
    return false
  }
}
