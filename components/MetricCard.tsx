
export function MetricCard({ title, value }: { title: string, value: string }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-gray-600 text-sm">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
