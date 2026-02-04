'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { MessageSquare, Shield, Sparkles, Zap, Lock, Infinity, ArrowRight, Check, Star, Image, Video } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI Humanizer',
    description: 'Transform AI text into natural human writing. Bypass AI detectors with ease.',
    href: '/humanizer',
    gradient: 'from-purple-500 to-pink-500',
    shadowColor: 'shadow-purple-500/20',
  },
  {
    icon: Shield,
    title: 'AI Detector',
    description: 'Instantly detect if text was written by AI. Multi-layer analysis with detailed breakdown.',
    href: '/detector',
    gradient: 'from-red-500 to-orange-500',
    shadowColor: 'shadow-red-500/20',
  },
  {
    icon: MessageSquare,
    title: 'AI Chatbot',
    description: 'Chat with advanced AI for free. Get help with writing, coding, learning, and more.',
    href: '/chat',
    gradient: 'from-blue-500 to-cyan-500',
    shadowColor: 'shadow-blue-500/20',
  },
  {
    icon: Image,
    title: 'Image Generator',
    description: 'Create stunning AI images from text descriptions. Multiple art styles available.',
    href: '/image-generator',
    gradient: 'from-pink-500 to-rose-500',
    shadowColor: 'shadow-pink-500/20',
  },
  {
    icon: Video,
    title: 'Video Generator',
    description: 'Generate animated sequences and video frames from text prompts.',
    href: '/video-generator',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/20',
  },
]

const benefits = [
  { icon: Zap, text: 'Lightning Fast' },
  { icon: Lock, text: 'No Sign-up Required' },
  { icon: Infinity, text: 'Unlimited Usage' },
]

const testimonials = [
  { name: 'Sarah K.', role: 'Student', text: "The humanizer is incredible! My essays pass all AI detectors now.", rating: 5 },
  { name: 'Mike T.', role: 'Writer', text: "Finally a free AI chat that actually works. No more paying for ChatGPT!", rating: 5 },
  { name: 'Lisa M.', role: 'Teacher', text: "The AI detector helps me check student submissions. Very accurate!", rating: 5 },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">100% Free • No Sign-up • Unlimited</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-center mb-6">
            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              AI Humanizer, Detector
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              & Chatbot
            </span>
          </h1>

          <p className="text-xl text-gray-400 text-center max-w-3xl mx-auto mb-12">
            Transform AI-generated text into undetectable human writing. Detect AI content instantly.
            Chat with AI for free. All tools are <span className="text-green-400 font-semibold">100% free</span> with <span className="text-green-400 font-semibold">unlimited usage</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Link
              href="/humanizer"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Humanize AI Text
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/chat"
              className="group flex items-center gap-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-white border border-gray-700 hover:border-gray-600 transition-all"
            >
              <MessageSquare className="w-5 h-5" />
              Start Chatting
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-8">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-gray-400">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-purple-400" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Powerful AI Tools
            </span>
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to work with AI-generated content. All tools are completely free with no limits.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {features.map(({ icon: Icon, title, description, href, gradient, shadowColor }) => (
              <Link
                key={title}
                href={href}
                className={`group relative p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all hover:scale-[1.02] hover:${shadowColor} hover:shadow-xl`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg ${shadowColor} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 mb-4">{description}</p>
                <div className="flex items-center gap-2 text-purple-400 font-medium">
                  Try Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Paste Your Text', description: 'Copy and paste any AI-generated text into our tool.' },
              { step: '2', title: 'Click Process', description: 'Choose to humanize, detect AI, or chat with AI.' },
              { step: '3', title: 'Get Results', description: 'Instantly get humanized text or detailed AI analysis.' },
            ].map(({ step, title, description }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-purple-500/20">
                  {step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Loved by Thousands
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, rating }) => (
              <div key={name} className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{text}"</p>
                <div>
                  <p className="font-semibold text-white">{name}</p>
                  <p className="text-sm text-gray-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Start Using JumpStudy AI Today
              </span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of students, writers, and professionals using our free AI tools every day.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {['No Credit Card', 'No Sign-up', 'Unlimited Usage', 'Always Free'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-green-400">
                  <Check className="w-5 h-5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/humanizer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500">
            © 2024 JumpStudy AI. All tools are 100% free with unlimited usage.
          </p>
        </div>
      </footer>
    </div>
  )
}
