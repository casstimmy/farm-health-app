/**
 * Loader Component
 * Simple loading spinner for async operations
 */

export default function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 border-r-green-500 animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
