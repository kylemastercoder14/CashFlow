/**
 * Detects payment provider/card type from account number
 */

export interface PaymentProvider {
  type: string;
  provider: string;
  isValid: boolean;
}

/**
 * Detects credit card type from card number
 */
function detectCreditCardType(cardNumber: string): string | null {
  // Remove spaces and non-digits
  const cleaned = cardNumber.replace(/\D/g, "");

  if (cleaned.length < 4) return null;

  const firstDigit = cleaned[0];
  const firstTwoDigits = cleaned.substring(0, 2);
  const firstThreeDigits = cleaned.substring(0, 3);
  const firstFourDigits = cleaned.substring(0, 4);

  // Visa: starts with 4, 13 or 16 digits
  if (firstDigit === "4") {
    if (cleaned.length === 13 || cleaned.length === 16) {
      return "Visa";
    }
  }

  // Mastercard: starts with 51-55 or 2221-2720, 16 digits
  if (cleaned.length === 16) {
    const firstTwo = parseInt(firstTwoDigits);
    if (firstTwo >= 51 && firstTwo <= 55) {
      return "Mastercard";
    }
    // Mastercard 2-series (2221-2720)
    const firstFour = parseInt(firstFourDigits);
    if (firstFour >= 2221 && firstFour <= 2720) {
      return "Mastercard";
    }
  }

  // American Express: starts with 34 or 37, 15 digits
  if (cleaned.length === 15 && (firstTwoDigits === "34" || firstTwoDigits === "37")) {
    return "American Express";
  }

  // Discover: starts with 6011, 65, or 644-649, 16 digits
  if (cleaned.length === 16) {
    if (firstFourDigits === "6011" || firstTwoDigits === "65") {
      return "Discover";
    }
    const firstThree = parseInt(firstThreeDigits);
    if (firstThree >= 644 && firstThree <= 649) {
      return "Discover";
    }
  }

  // JCB: starts with 35, 16 digits
  if (cleaned.length === 16 && firstTwoDigits === "35") {
    return "JCB";
  }

  // Diners Club: starts with 36 or 38, 14 digits
  if (cleaned.length === 14 && (firstTwoDigits === "36" || firstTwoDigits === "38")) {
    return "Diners Club";
  }

  return null;
}

/**
 * Detects e-wallet provider from account number (Philippines)
 */
function detectEWalletType(accountNumber: string): string | null {
  // Remove spaces and non-digits
  const cleaned = accountNumber.replace(/\D/g, "");

  // GCash: Usually starts with 09 (Philippine mobile number format)
  if (cleaned.startsWith("09") && cleaned.length === 11) {
    return "GCash";
  }

  // Maya: Similar mobile number format
  if (cleaned.startsWith("09") && cleaned.length === 11) {
    // Could be Maya, but we'll default to GCash for 09 numbers
    // User can manually change if needed
    return "GCash";
  }

  // PayPal: Usually email-based, but if it's a number, it might be a PayPal account ID
  // We can't reliably detect this from number alone

  return null;
}

/**
 * Main function to detect payment provider from account number
 */
export function detectPaymentProvider(accountNumber: string, currentType?: string): PaymentProvider | null {
  if (!accountNumber || accountNumber.trim().length < 4) {
    return null;
  }

  const cleaned = accountNumber.replace(/\D/g, "");

  // If current type is already a specific e-wallet type, don't auto-detect
  // But allow detection if it's "Credit Card" or "Other"
  if (currentType && !["Credit Card", "Other"].includes(currentType)) {
    return null;
  }

  // Try to detect credit card first
  const cardType = detectCreditCardType(accountNumber);
  if (cardType) {
    return {
      type: "Credit Card",
      provider: cardType,
      isValid: cleaned.length >= 13 && cleaned.length <= 19,
    };
  }

  // Try to detect e-wallet
  const eWalletType = detectEWalletType(accountNumber);
  if (eWalletType) {
    return {
      type: eWalletType,
      provider: eWalletType,
      isValid: cleaned.length === 11,
    };
  }

  // If it looks like a credit card number (13-19 digits), suggest Credit Card
  if (cleaned.length >= 13 && cleaned.length <= 19) {
    return {
      type: "Credit Card",
      provider: "Unknown",
      isValid: false,
    };
  }

  return null;
}

/**
 * Formats card number with spaces (e.g., 1234 5678 9012 3456)
 */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, "");
  const parts = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    parts.push(cleaned.substring(i, i + 4));
  }
  return parts.join(" ");
}

