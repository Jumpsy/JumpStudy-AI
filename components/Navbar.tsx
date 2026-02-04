'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Shield, Sparkles, Home, Menu, X, Image, Video } from 'lucide-react'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/humanizer', label: 'Humanizer', icon: Sparkles },
  { href: '/detector', label: 'Detector', icon: Shield },
  { href: '/image-generator', label: 'Images', icon: Image },
  { href: '/video-generator', label: 'Videos', icon: Video },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
              <span className="text-white font-bold text-lg">J</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              JumpStudy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-300 shadow-lg shadow-purple-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Free Badge */}
          <div className="hidden xl:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-green-400">100% Free</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-gray-900/95 backdrop-blur-xl border-b border-gray-800">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              )
            })}
            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium text-green-400">100% Free & Unlimited</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
