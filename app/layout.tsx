import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// Die Grotesk A (display/headings)
const groteskA = localFont({
  src: '../public/fonts/test-die-grotesk-a-regular.woff2',
  variable: '--font-grotesk-a',
  display: 'swap',
  weight: '400',
})

// Die Grotesk B (body/UI text — variable font)
const groteskB = localFont({
  src: '../public/fonts/test-die-grotesk-vf-roman.woff2',
  variable: '--font-grotesk-b',
  display: 'swap',
  weight: '400',
})

// IBM Plex Mono (code/monospace)
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Cambrian Content Engine',
  description: 'Content creation tool for Compound / Cambrian Explorations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${groteskA.variable} ${groteskB.variable} ${ibmPlexMono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  )
}
