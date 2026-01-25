export default function StatCard({ title, count, icon, bgColor }) {
  return (
    <div className={`${bgColor} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:scale-105 text-white border-0`}>
      <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 text-8xl group-hover:opacity-20 transition-opacity">{icon}</div>
      <div className="relative p-8">
        <p className="text-sm font-medium opacity-90 mb-3">{title}</p>
        <p className="text-4xl font-bold tracking-tight">{count || 0}</p>
      </div>
    </div>
  );
}
