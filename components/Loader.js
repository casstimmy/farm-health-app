/**
 * Loader Component
 * Consistent loading spinner for async operations
 * 
 * @param {string} message - Loading message to display
 * @param {string} color - Tailwind color class (e.g., "blue-600", "green-600")
 * @param {string} size - Size variant: "sm", "md", "lg"
 * @param {boolean} fullPage - Whether to show full page loader
 * @param {boolean} inline - Whether to show inline (no background card)
 */

export default function Loader({ 
  message = "Loading...", 
  color = "green-600", 
  size = "md",
  fullPage = false,
  inline = false 
}) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  const spinner = (
    <div className="inline-block">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-${color}`}></div>
      {message && <p className="text-gray-600 mt-4">{message}</p>}
    </div>
  );

  // Inline loader (no card background)
  if (inline) {
    return (
      <div className="text-center py-8">
        {spinner}
      </div>
    );
  }

  // Full page loader
  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100">
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg px-16">
          {spinner}
        </div>
      </div>
    );
  }

  // Default card loader
  return (
    <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
      {spinner}
    </div>
  );
}

// Small inline spinner for buttons/actions
export function ButtonLoader({ color = "current" }) {
  return (
    <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-${color}`}></div>
  );
}

// Table row loader
export function TableLoader({ columns = 5, rows = 3 }) {
  return (
    <div className="animate-pulse">
      {[...Array(rows)].map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-4 border-b border-gray-100">
          {[...Array(columns)].map((_, colIdx) => (
            <div key={colIdx} className="flex-1 h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
