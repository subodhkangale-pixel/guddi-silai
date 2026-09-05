import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useCreateReview, useProductReviews } from '../api/hooks';
import { formatDate } from '../lib/format';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(Math.max(0, Math.min(5, rating)))}
      <span className="text-gray-300">{'★'.repeat(Math.max(0, 5 - Math.min(5, rating)))}</span>
    </span>
  );
}

export default function ReviewsSection({ productId, productType }: { productId: string; productType: string }) {
  const { user, status } = useAuth();
  const reviewsQuery = useProductReviews(productId);
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const reviews = reviewsQuery.data?.data ?? [];
  const canReview = productType === 'READY_MADE' && status === 'authenticated';

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createReview.mutate({ productId, rating, title: title.trim() || undefined, text: text.trim() || undefined });
  }

  return (
    <section className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold text-gray-900">
        Customer Reviews
        {reviews.length > 0 && (
          <span className="ml-2 text-sm font-medium text-gray-500">({reviews.length})</span>
        )}
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No reviews yet. Be the first to review this blouse.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <Stars rating={review.rating} />
                <span className="text-sm font-medium text-gray-900">{review.title ?? 'Review'}</span>
              </div>
              {review.text && <p className="mt-2 text-sm text-gray-700">{review.text}</p>}
              {review.images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {review.images.map((image, index) => (
                    <img key={index} src={image} alt="" className="h-20 w-16 rounded-md object-cover" />
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-gray-400">Verified buyer · {formatDate(review.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}

      {canReview && (
        <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-sm font-semibold text-gray-900">Write a review</h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                  className={`text-2xl leading-none ${value <= rating ? 'text-amber-500' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Review heading (optional)"
            maxLength={120}
            className="mt-3 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Tell us about the fit, fabric and finish…"
            maxLength={2000}
            rows={4}
            className="mt-3 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={createReview.isPending}
            className="mt-3 rounded-md bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {createReview.isPending ? 'Submitting…' : 'Submit review'}
          </button>
          {createReview.isSuccess && (
            <p className="mt-2 text-sm text-green-700">Thanks! Your review is awaiting approval.</p>
          )}
          {createReview.isError && (
            <p className="mt-2 text-sm text-red-700">
              Could not submit your review. You may have already reviewed this product.
            </p>
          )}
        </form>
      )}

      {status === 'guest' && productType === 'READY_MADE' && (
        <p className="mt-6 text-sm text-gray-500">
          <Link to="/login" className="font-medium text-purple-600 hover:underline">Sign in</Link>{' '}
          to write a review.
        </p>
      )}
    </section>
  );
}