/**
 * Empty Layout Component
 * 
 * Full-width layout without any navigation
 * - Used for special pages or full-screen views
 * - Responsive design
 * 
 * Usage:
 * <EmptyLayout>
 *   <YourContent />
 * </EmptyLayout>
 */
export default function EmptyLayout({ children, className = "" }) {
  return (
    <div className={`min-h-screen p-12 bg-gray-50 ${className}`}>
      {children}
    </div>
  );
}
