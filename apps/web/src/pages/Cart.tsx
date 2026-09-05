import { Link } from 'react-router-dom';
import { useState } from 'react';

import Spinner from '../components/Spinner';
import { useCart, useClearCart, useUpdateCartItem, useUpdateMeasurements } from '../api/hooks';
import { MeasurementValue } from '../api/cartApi';
import { formatPrice } from '../lib/format';

function CartPage() {
  const cart = useCart();
  const update = useUpdateCartItem();
  const updateMeasurements = useUpdateMeasurements();
  const clear = useClearCart();
  const items = cart.data?.data.items ?? [];

  if (cart.isPending) return <Spinner label="Loading your cart…" />;
  if (cart.isError) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-red-700">Could not load your cart.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Your selections</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Cart</h1>
        </div>
        {items.length > 0 && (
          <button onClick={() => clear.mutate()} className="text-sm font-medium text-gray-600 hover:text-red-600">
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-gray-700">Your cart is empty.</p>
          <Link to="/products" className="mt-4 inline-block font-semibold text-pink-600">Explore designs →</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4" aria-label="Cart items">
            {items.map((item, index) => (
              <article key={`${item.productId}-${item.variantId ?? item.fiberId ?? index}`} className="flex gap-4 border-b border-gray-200 pb-4">
                <div className="h-28 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                  {item.productImage && <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900">{item.productName}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {item.productType === 'CUSTOMIZE' ? `Custom · ${item.fiberName ?? 'Fabric pending'}` : `${item.color ?? 'Color'} · ${item.size ?? 'Size'}`}
                  </p>
                  <p className="mt-2 font-semibold text-gray-900">{formatPrice(item.unitPrice)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <label htmlFor={`quantity-${index}`} className="text-sm text-gray-600">Quantity</label>
                    <select id={`quantity-${index}`} value={item.quantity} onChange={(event) => update.mutate({ index, quantity: Number(event.target.value) })} className="rounded border border-gray-300 px-2 py-1 text-sm">
                      {Array.from({ length: 10 }, (_, quantity) => quantity + 1).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
                    </select>
                  </div>
                  {item.productType === 'CUSTOMIZE' && (
                    <MeasurementForm
                      complete={item.measurementStatus === 'COMPLETE'}
                      pending={updateMeasurements.isPending}
                      onSubmit={(values) => updateMeasurements.mutate({ index, values })}
                    />
                  )}
                </div>
              </article>
            ))}
          </section>
          <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
            <div className="mt-4 flex justify-between text-sm text-gray-600"><span>Items</span><span>{cart.data?.data.totalItems}</span></div>
            <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900"><span>Total</span><span>{formatPrice(cart.data?.data.totalPrice ?? 0)}</span></div>
            <Link to="/checkout" className="mt-5 block w-full rounded-md bg-pink-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-pink-700">Continue to checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}

const MEASUREMENT_FIELDS = [
  ['bust', 'Bust'], ['under-bust', 'Under Bust'], ['waist', 'Waist'], ['shoulder', 'Shoulder'],
  ['blouse-length', 'Blouse Length'], ['sleeve-length', 'Sleeve Length'], ['armhole', 'Armhole'],
  ['upper-arm', 'Upper Arm'], ['sleeve-opening', 'Sleeve Opening'], ['front-neck-depth', 'Front Neck Depth'],
  ['back-neck-depth', 'Back Neck Depth'],
] as const;

function MeasurementForm({ complete, pending, onSubmit }: { complete: boolean; pending: boolean; onSubmit: (values: MeasurementValue[]) => void }) {
  const [open, setOpen] = useState(!complete);
  const [values, setValues] = useState<Record<string, string>>({});

  if (!open && complete) return <p className="mt-2 text-sm font-medium text-green-700">✓ Measurements complete <button type="button" onClick={() => setOpen(true)} className="ml-2 underline">Edit</button></p>;
  return <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-semibold text-gray-900">{complete ? 'Update measurements' : 'Complete measurements'}</p><div className="mt-2 grid grid-cols-2 gap-2">{MEASUREMENT_FIELDS.map(([key, label]) => <label key={key} className="text-xs text-gray-700">{label}<input type="number" min="1" max="200" value={values[key] ?? ''} onChange={(event) => setValues({ ...values, [key]: event.target.value })} className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1" /></label>)}</div><button type="button" disabled={pending || MEASUREMENT_FIELDS.some(([key]) => !values[key])} onClick={() => onSubmit(MEASUREMENT_FIELDS.map(([fieldKey, label]) => ({ fieldKey, label, value: Number(values[fieldKey]), unit: 'INCHES' as const })))} className="mt-3 rounded bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:bg-gray-300">{pending ? 'Saving…' : 'Save measurements'}</button></div>;
}

export default CartPage;