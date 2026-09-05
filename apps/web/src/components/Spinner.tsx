function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
      <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export default Spinner;