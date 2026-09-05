import { useState } from 'react';

import { useAdminModerateReview, useAdminReviews } from '../../api/hooks';
import { formatDate } from '../../lib/format';
import Spinner from '../../components/Spinner';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

function AdminReviews() {
  const [filter, setFilter] = useState<string | undefined>();
  const { data, isPending, isError } = useAdminReviews(filter);
  const moderate = useAdminModerateReview();
  const reviews = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
        <div className="flex gap-2">
          {[undefined, 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status ?? 'all'}
              onClick={() => setFilter(status)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status === undefined ? 'All' : status[0].toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isPending && <Spinner label="Loading reviews…" />}
      {isError && <p className="mt-4 text-sm text-red-700">Could not load reviews.</p>}

      {!isPending && !isError && reviews.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">No reviews match this filter.</p>
      )}

      {!isPending && !isError && reviews.length > 0 && (
        <ul className="mt-6 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{'★'.repeat(review.rating)}</span>
                  <span className="text-sm text-gray-500">· {review.productId}</span>
                  <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[review.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {review.status}
                </span>
              </div>
              {review.title && <p className="mt-2 text-sm font-medium text-gray-900">{review.title}</p>}
              {review.text && <p className="mt-1 text-sm text-gray-700">{review.text}</p>}
              {review.images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {review.images.map((image, index) => (
                    <img key={index} src={image} alt="" className="h-20 w-16 rounded-md object-cover" />
                  ))}
                </div>
              )}
              {review.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => moderate.mutate({ id: review.id, status: 'approved' })}
                    disabled={moderate.isPending}
                    className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => moderate.mutate({ id: review.id, status: 'rejected' })}
                    disabled={moderate.isPending}
                    className="rounded-md border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminReviews;