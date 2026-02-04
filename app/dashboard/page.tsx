'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { PRICING_PLANS, getPlan } from '@/lib/pricing'
import {
  Crown, Settings, LogOut, CreditCard, MessageSquare,
  Image, Video, Shield, Sparkles, Mic, ArrowRight, Loader2
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Fetch profile with plan info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profile || { plan: 'free' })
      setLoading(false)
    }

    fetchUser()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Portal error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  const currentPlan = getPlan(profile?.plan || 'free')

  const tools = [
    { name: 'AI Chat', icon: MessageSquare, href: '/chat', color: 'from-blue-500 to-cyan-500' },
    { name: 'Voice Chat', icon: Mic, href: '/conversation', color: 'from-green-500 to-emerald-500' },
    { name: 'Humanizer', icon: Sparkles, href: '/humanizer', color: 'from-purple-500 to-pink-500' },
    { name: 'Detector', icon: Shield, href: '/detector', color: 'from-red-500 to-orange-500' },
    { name: 'Images', icon: Image, href: '/image-generator', color: 'from-pink-500 to-rose-500' },
    { name: 'Videos', icon: Video, href: '/video-generator', color: 'from-violet-500 to-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
            </h1>
            <p className="text-gray-400">
              Manage your account and access all AI tools
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Plan Card */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{currentPlan.name} Plan</h3>
                    <p className="text-sm text-gray-400">
                      {currentPlan.price === 0 ? 'Free forever' : `$${currentPlan.price}/month`}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {currentPlan.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {currentPlan.price === 0 ? (
                  <Link
                    href="/pricing"
                    className="block w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-center font-medium transition-colors"
                  >
                    Upgrade Plan
                  </Link>
                ) : (
                  <button
                    onClick={handleManageSubscription}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Manage Subscription
                  </button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-gray-300 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    Account Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-gray-300 transition-colors w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Tools Grid */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-white mb-4">AI Tools</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    className="group p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                          <tool.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-white">{tool.name}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Usage Stats */}
              <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Today's Usage</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-2xl font-bold text-white">∞</p>
                    <p className="text-sm text-gray-400">Messages</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-2xl font-bold text-white">
                      {currentPlan.limits.imagesPerDay === -1 ? '∞' : `${currentPlan.limits.imagesPerDay}`}
                    </p>
                    <p className="text-sm text-gray-400">Images</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-2xl font-bold text-white">
                      {currentPlan.limits.videosPerDay === -1 ? '∞' : `${currentPlan.limits.videosPerDay}`}
                    </p>
                    <p className="text-sm text-gray-400">Videos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
