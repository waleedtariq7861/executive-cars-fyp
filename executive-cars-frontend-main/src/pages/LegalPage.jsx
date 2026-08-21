import React from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

const content = {
  privacy: {
    title: 'Privacy Notice',
    intro: 'Executive Cars uses account, booking, vehicle, and payment-reference information to provide the services you choose.',
    sections: [
      ['Data use', 'Account information supports sign-in and access to your activity. Vehicle and booking information supports listings, inspections, and managed selling.'],
      ['Data sharing', 'Payment details are handled by the configured payment provider. Executive Cars does not store card numbers.'],
      ['Your account', 'Keep your profile information accurate and protect your sign-in details. Access to account activity is limited to authorised users.'],
    ],
  },
  terms: {
    title: 'Terms of Use',
    intro: 'These terms explain how listings, valuations, inspections, auctions, and payments are presented on Executive Cars.',
    sections: [
      ['Listings', 'Vehicle details are provided by administrators or sellers. Review the available information and inspect a vehicle before completing a transaction.'],
      ['Valuations', 'Price estimates are indicative and are not guaranteed offers, sale prices, or financial advice.'],
      ['Auctions and payments', 'A bid is subject to auction rules. A payment is complete only after confirmation by the configured payment gateway.'],
    ],
  },
}

export default function LegalPage({ type }) {
  const page = content[type] || content.terms
  return <div className="min-h-screen bg-gray-50"><Navbar /><main className="market-shell pt-[116px] md:pt-[140px] pb-16"><article className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl shadow-card p-6 sm:p-9"><p className="eyebrow">Executive Cars</p><h1 className="text-3xl font-black text-gray-900 mt-2">{page.title}</h1><p className="text-sm text-gray-500 leading-7 mt-4">{page.intro}</p><div className="space-y-7 mt-8">{page.sections.map(([title, body]) => <section key={title}><h2 className="font-bold text-gray-900">{title}</h2><p className="text-sm text-gray-600 leading-7 mt-2">{body}</p></section>)}</div></article></main><Footer /></div>
}
