// Input helpers for the checkout forms. They only shape and pre-check what the customer types; the server
// (the payment provider) is the authority and repeats every check.

export const onlyDigits = value => String(value || '').replace(/\D/g, '')

export const cardBrand = digits => {
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2(2[2-9][1-9]|2[3-9]|[3-6]|7[01]|720))/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'American Express'
  return ''
}

export const formatCardNumber = value => {
  const digits = onlyDigits(value).slice(0, 19)
  if (/^3[47]/.test(digits)) return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(' ')
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

export const luhnValid = digits => {
  if (!/^\d{12,19}$/.test(digits)) return false
  let sum = 0
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[digits.length - 1 - index])
    if (index % 2 === 1) { digit *= 2; if (digit > 9) digit -= 9 }
    sum += digit
  }
  return sum % 10 === 0
}

// "1" -> "1", "12" -> "12 / ", "1226" -> "12 / 26"
export const formatExpiry = value => {
  const digits = onlyDigits(value).slice(0, 4)
  if (digits.length < 2) return digits
  return digits.length === 2 && String(value).length < 3 ? digits : `${digits.slice(0, 2)} / ${digits.slice(2)}`
}

export const parseExpiry = value => {
  const digits = onlyDigits(value)
  if (digits.length !== 4) return null
  return { month: Number(digits.slice(0, 2)), year: 2000 + Number(digits.slice(2)) }
}

export const formatMobile = value => onlyDigits(value).slice(0, 11)

export const checkCard = ({ name, number, expiry, cvc }, now = new Date()) => {
  const errors = {}
  const digits = onlyDigits(number)
  if (String(name || '').trim().length < 2) errors.cardName = 'Enter the name on the card.'
  if (!luhnValid(digits)) errors.cardNumber = 'Enter a valid card number.'
  const parsed = parseExpiry(expiry)
  if (!parsed || parsed.month < 1 || parsed.month > 12) errors.expiry = 'Enter the expiry as MM / YY.'
  else if (parsed.year < now.getFullYear() || (parsed.year === now.getFullYear() && parsed.month < now.getMonth() + 1)) errors.expiry = 'This card has expired.'
  const cvcLength = cardBrand(digits) === 'American Express' ? 4 : 3
  if (onlyDigits(cvc).length !== cvcLength) errors.cvc = `Enter the ${cvcLength}-digit security code.`
  return errors
}

export const checkWallet = ({ provider, number }) => {
  const errors = {}
  if (!provider) errors.walletProvider = 'Choose JazzCash or Easypaisa.'
  if (!/^03\d{9}$/.test(onlyDigits(number))) errors.walletNumber = 'Enter the 11-digit mobile number of your wallet, for example 03001234567.'
  return errors
}

export const checkTransfer = ({ reference, date }, now = new Date()) => {
  const errors = {}
  if (!/^[A-Za-z0-9-]{6,30}$/.test(String(reference || '').trim())) errors.bankReference = 'Enter the transaction ID from your bank (6 to 30 letters or digits).'
  const when = new Date(date)
  if (!date || Number.isNaN(when.getTime())) errors.transferDate = 'Enter the date you made the transfer.'
  else if (when.getTime() > now.getTime() + 24 * 60 * 60 * 1000) errors.transferDate = 'The transfer date cannot be in the future.'
  return errors
}

export const formatMoney = (amount, currency = 'PKR') => `${currency} ${Number(amount || 0).toLocaleString('en-PK')}`

export const STATUS_LABELS = {
  requires_payment: 'Awaiting payment',
  processing: 'Processing',
  pending_verification: 'Awaiting confirmation',
  succeeded: 'Paid',
  failed: 'Failed',
  expired: 'Expired',
}
