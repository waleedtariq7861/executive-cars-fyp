const value = (name, fallback = '') => String(import.meta.env[name] || fallback).trim()

export const siteConfig = Object.freeze({
  name: 'Executive Cars',
  tagline: 'From Inspection to Auction, Everything Smart.',
  city: value('VITE_BUSINESS_CITY', 'Pakistan'),
  address: value('VITE_BUSINESS_ADDRESS'),
  phone: value('VITE_CONTACT_PHONE'),
  phoneLabel: value('VITE_CONTACT_PHONE_LABEL'),
  email: value('VITE_CONTACT_EMAIL'),
})
