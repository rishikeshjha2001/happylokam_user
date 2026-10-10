import { Alert, Linking } from 'react-native';

const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_live_SjBHhCXWmZhVK6';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://happylokam.com/api/v1').replace(/\/$/, '');

interface RazorpayOrderResponse {
  success: boolean;
  data: {
    id: string;
    amount: number;
    currency: string;
  };
}

/**
 * Creates a Razorpay order via the backend and opens 
 * Razorpay standard checkout in the system browser.
 * 
 * Flow:
 * 1. POST /payments/create-order → gets Razorpay order_id
 * 2. Opens Razorpay checkout.js standard page in browser
 * 3. On success, Razorpay webhook handles payment.captured
 * 4. We return the orderId so the app can poll/confirm
 */
export async function createRazorpayOrder(
  token: string,
  amount: number,
  description: string
): Promise<RazorpayOrderResponse['data'] | null> {
  try {
    const res = await fetch(`${API_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `hl_${Date.now()}`,
      }),
    });

    const data = await res.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create payment order');
    }

    return data.data;
  } catch (error: any) {
    console.error('Razorpay order creation failed:', error);
    return null;
  }
}

/**
 * Opens Razorpay checkout in the device browser.
 * Since we're in Expo Go (no native Razorpay SDK),
 * we use Razorpay's standard checkout page via browser.
 */
export function openRazorpayCheckout(
  orderId: string,
  amount: number,
  description: string,
  customerName: string,
  customerEmail: string,
): void {
  // Build Razorpay standard checkout URL with prefilled params
  const params = new URLSearchParams({
    key_id: RAZORPAY_KEY,
    order_id: orderId,
    amount: String(amount * 100),
    currency: 'INR',
    name: 'HappyLokam Celebrations',
    description,
    'prefill[name]': customerName,
    'prefill[email]': customerEmail,
    'theme[color]': '#e11d48',
  });

  // Use Razorpay's hosted checkout page
  const checkoutUrl = `https://api.razorpay.com/v1/checkout/embedded?${params.toString()}`;
  
  Linking.openURL(checkoutUrl).catch(() => {
    Alert.alert(
      'Payment Error',
      'Could not open the payment gateway. Please try again.',
    );
  });
}

export { RAZORPAY_KEY, API_URL };
