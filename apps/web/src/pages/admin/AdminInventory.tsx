import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequestAuth } from '../../api/admin';
import Spinner from '../../components/Spinner';

interface FiberInventory {
  id: string;
  fiberId: string;
  colorId: string;
  stock: number;
}

function AdminInventory() {
  const queryClient = useQueryClient();
  const inventory = useQuery({
    queryKey: ['admin-fiber-inventory'],
    queryFn: () => apiRequestAuth<{ data: FiberInventory[] }>('/admin/inventory/fiber?lowStockBelow=100000'),
  });
  const [stock, setStock] = useState<Record<string, string>>({});
  const update = useMutation({
    mutationFn: (input: { fiberId: string; colorId: string; stock: number }) =>
      apiRequestAuth('/admin/inventory/fiber', { method: 'PUT', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-fiber-inventory'] }),
  });

  if (inventory.isPending) return <Spinner label="Loading inventory…" />;
  if (inventory.isError) return <p className="text-red-700">Could not load inventory.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Fiber inventory</h1>
      <p className="mt-1 text-sm text-gray-600">Manage available fabric by color. Product names are resolved from the catalogue IDs.</p>
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {(inventory.data?.data ?? []).length === 0 ? <p className="p-5 text-sm text-gray-600">No fiber inventory records yet. Add records through the API after creating fibers and colors.</p> : (inventory.data?.data ?? []).map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 last:border-0">
            <div><p className="font-medium text-gray-900">Fiber: {item.fiberId}</p><p className="text-sm text-gray-600">Color: {item.colorId}</p></div>
            <div className="flex items-center gap-2"><input type="number" min="0" value={stock[item.id] ?? item.stock} onChange={(event) => setStock({ ...stock, [item.id]: event.target.value })} className="w-24 rounded border border-gray-300 px-2 py-1" /><button type="button" onClick={() => update.mutate({ fiberId: item.fiberId, colorId: item.colorId, stock: Number(stock[item.id] ?? item.stock) })} className="rounded bg-gray-900 px-3 py-2 text-sm font-semibold text-white">Save</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminInventory;
