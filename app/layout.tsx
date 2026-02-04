import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JumpStudy AI - Free AI Humanizer, Detector & Chatbot',
  description: 'Transform AI text into undetectable human writing. Detect AI content instantly. Chat with AI for free. Unlimited usage, no sign-up required.',
  keywords: 'AI humanizer, AI detector, ChatGPT detector, undetectable AI, bypass AI detection, free AI chat, AI writing tool',
  openGraph: {
    title: 'JumpStudy AI - Free AI Humanizer, Detector & Chatbot',
    description: 'Transform AI text into undetectable human writing. 100% Free & Unlimited.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
