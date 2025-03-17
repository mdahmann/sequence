import Link from 'next/link'

function Error({ statusCode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold mb-4">
        {statusCode
          ? `${statusCode} - An error occurred on server`
          : 'An error occurred on client'}
      </h1>
      <p className="text-lg mb-8">
        We apologize for the inconvenience. Please try again later.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/"
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error 