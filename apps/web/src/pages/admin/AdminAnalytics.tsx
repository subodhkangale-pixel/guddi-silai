import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getAnalyticsDashboard, DashboardData } from '../../api/analyticsApi';
import { formatPrice } from '../../lib/format';
import Spinner from '../../components/Spinner';

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const FUNNEL_STEPS: { key: keyof DashboardData['funnel']; label: string }[] = [
  { key: 'PAGE_VIEW', label: 'Browse' },
  { key: 'PRODUCT_VIEW', label: 'Product views' },
  { key: 'CART_ADD', label: 'Add to cart' },
  { key: 'CHECKOUT_START', label: 'Checkout started' },
  { key: 'ORDER_PLACED', label: 'Orders placed' },
  { key: 'PAYMENT_SUCCESS', label: 'Payments complete' },
];

function exportCsv(data: DashboardData) {
  const rows: string[][] = [
    ['Metric', 'Value'],
    ['Visitors', String(data.visitors)],
    ['Products tracked', String(data.productsTracked)],
    ['Revenue', String(data.revenue.amount)],
    ['Paid orders', String(data.revenue.orders)],
  ];
  for (const step of FUNNEL_STEPS) {
    rows.push([step.label, String(data.funnel[step.key])]);
  }
  rows.push([]);
  rows.push(['Top products']);
  rows.push(['Name', 'Views', 'Carts', 'Orders', 'Likes']);
  for (const product of data.topProducts) {
    rows.push([product.name, String(product.views), String(product.carts), String(product.orders), String(product.likes)]);
  }
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `guddi-silai-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const analytics = useQuery({
    queryKey: ['admin-analytics-dashboard', days],
    queryFn: () => getAnalyticsDashboard({ days }),
    placeholderData: (previous) => previous,
  });

  if (analytics.isPending && !analytics.data) return <Spinner label="Loading analytics…" />;
  if (analytics.isError) return <p className="text-red-700">Could not load analytics.</p>;
  const data = analytics.data?.data;

  if (!data) return null;

  const maxFunnel = Math.max(1, ...Object.values(data.funnel));
  const maxTrend = Math.max(1, ...data.trend.views, ...data.trend.carts, ...data.trend.orders);
  const kpiCards = [
    ['Visitors', data.visitors],
    ['Revenue', formatPrice(data.revenue.amount)],
    ['Paid orders', data.revenue.orders],
    ['Products tracked', data.productsTracked],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">Activity from your storefront.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-gray-300">
            {RANGES.map((range) => (
              <button
                key={range.days}
                onClick={() => setDays(range.days)}
                className={`px-3 py-1.5 text-sm font-medium ${
                  days === range.days ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportCsv(data)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-600">{label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Conversion funnel</h2>
          <div className="mt-4 space-y-3">
            {FUNNEL_STEPS.map((step, index) => {
              const value = data.funnel[step.key];
              const width = Math.max(2, (value / maxFunnel) * 100);
              return (
                <div key={step.key}>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{step.label}</span>
                    <span>{value}</span>
                  </div>
                  <div className="mt-1 h-3 w-full overflow-hidden rounded bg-gray-100">
                    <div
                      className={`h-full rounded ${index === 0 ? 'bg-pink-500' : 'bg-purple-600'}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Daily activity</h2>
          {data.trend.days.length === 0 ? (
            <p className="mt-4 text-xs text-gray-400">No trend data for this range.</p>
          ) : (
            <>
              <div className="mt-4 flex h-40 items-end gap-1">
                {data.trend.days.map((day, index) => (
                  <div
                    key={day}
                    title={`${day}: ${data.trend.views[index]} views, ${data.trend.orders[index]} orders`}
                    className="flex flex-1 flex-col justify-end rounded-t bg-purple-200"
                    style={{ height: `${Math.max(4, ((data.trend.views[index] ?? 0) / maxTrend) * 100)}%` }}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>{data.trend.days[0]}</span>
                <span>{data.trend.days[data.trend.days.length - 1]}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Top products</h2>
        </div>
        {data.topProducts.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">No product activity in this range yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Views</th>
                <th className="px-5 py-3">Cart adds</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Saves</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((product) => (
                <tr key={product.productId} className="border-t border-gray-100">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img src={product.image} alt="" className="h-10 w-8 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.designId && <p className="text-xs text-gray-400">{product.designId}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{product.views}</td>
                  <td className="px-5 py-3">{product.carts}</td>
                  <td className="px-5 py-3">{product.orders}</td>
                  <td className="px-5 py-3">{product.likes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminAnalytics;