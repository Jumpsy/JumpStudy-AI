import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">StudyForge AI</h1>
        <p className="text-xl text-gray-600 mb-8">Your AI-powered study assistant</p>
        <Link
          href="/chat"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Start Chatting
        </Link>
      </div>
    </div>
  );
}
