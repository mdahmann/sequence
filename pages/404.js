import Link from 'next/link'

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/"
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Return Home
        </Link>
        <Link 
          href="/pose-library"
          className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Browse Pose Library
        </Link>
      </div>
    </div>
  )
} 