import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono, Manrope } from 'next/font/google'
import './globals.css'

// Clash Display (display font for headlines)
const clashDisplay = localFont({
  src: [
    {
      path: '../public/fonts/clash-display/ClashDisplay-Medium.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/clash-display/ClashDisplay-Regular.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
})

// Manrope (body font for UI and text) — from Google Fonts
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '700'],
})

// JetBrains Mono (monospace for code)
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Specter Content Engine',
  description: 'Content creation platform — Invisible Intelligence',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${clashDisplay.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  )
}
