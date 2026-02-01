/**
 * Loader Component
 * Consistent loading spinner for async operations
 */

export default function Loader({ message = "Loading...", color = "green-600" }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
      <div className="inline-block">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${color}`}></div>
        <p className="text-gray-600 mt-4">{message}</p>
      </div>
    </div>
  );
}
