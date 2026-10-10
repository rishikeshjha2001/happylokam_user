declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    description?: string;
    image?: string;
    currency?: string;
    key: string;
    amount: number;
    name?: string;
    order_id: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
    [key: string]: any;
  }

  interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  const RazorpayCheckout: {
    open: (options: RazorpayOptions) => Promise<RazorpaySuccessResponse>;
  };

  export default RazorpayCheckout;
}

declare module 'react-native-qrcode-svg' {
  import { Component } from 'react';
  export interface QRCodeProps {
    value?: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    logo?: any;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoMargin?: number;
    logoBorderRadius?: number;
    quietZone?: number;
    enableLinearGradient?: boolean;
    linearGradient?: string[];
    gradientDirection?: string[];
    getRef?: (c: any) => any;
    onError?: (error: any) => void;
  }
  export default class QRCode extends Component<QRCodeProps> {}
}
