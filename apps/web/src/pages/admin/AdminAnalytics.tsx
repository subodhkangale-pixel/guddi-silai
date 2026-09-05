import { useQuery } from '@tanstack/react-query';

import { apiRequestAuth } from '../../api/admin';
import Spinner from '../../components/Spinner';

interface AnalyticsSummary {
  visitors: number;
  productViews: number;
  addToCart: number;
  wishlistAdds: number;
  orders: number;
  payments: number;
  searches: number;
  productsTracked: number;
}

function AdminAnalytics() {
  const analytics = useQuery({
    queryKey: ['admin-analytics-summary'],
    queryFn: () => apiRequestAuth<{ data: AnalyticsSummary }>('/analytics/summary'),
  });
  if (analytics.isPending) return <Spinner label="Loading analytics…" />;
  if (analytics.isError) return <p className="text-red-700">Could not load analytics.</p>;
  const data = analytics.data.data;
  const cards = [['Visitors', data.visitors], ['Product views', data.productViews], ['Add to cart', data.addToCart], ['Wishlist adds', data.wishlistAdds], ['Orders', data.orders], ['Successful payments', data.payments], ['Searches', data.searches], ['Products tracked', data.productsTracked]];
  return <div><h1 className="text-2xl font-bold text-gray-900">Analytics</h1><p className="mt-1 text-sm text-gray-600">Event-based activity summary from your storefront.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={String(label)} className="rounded-lg border border-gray-200 bg-white p-5"><p className="text-sm text-gray-600">{label}</p><p className="mt-2 text-3xl font-bold text-gray-900">{value}</p></div>)}</div></div>;
}

export default AdminAnalytics;
