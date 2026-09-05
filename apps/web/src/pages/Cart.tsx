import { Link } from 'react-router-dom';
import { useState } from 'react';

import Spinner from '../components/Spinner';
import { useApplyCoupon, useCart, useClearCart, useMeasurementFields, useRemoveCoupon, useUpdateCartItem, useUpdateMeasurements } from '../api/hooks';
import { MeasurementValue } from '../api/cartApi';
import { formatPrice } from '../lib/format';

function CartPage() {
  const cart = useCart();
  const clear = useClearCart();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const [couponCode, setCouponCode] = useState('');
  const items = cart.data?.data.items ?? [];

  if (cart.isPending) return <Spinner label="Loading your cart…" />;
  if (cart.isError) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-red-700">Could not load your cart.</div>;
  }

  const readyItems = items.filter((item) => item.productType === 'READY_MADE');
  const customItems = items.filter((item) => item.productType === 'CUSTOMIZE');
  const measurementPending = cart.data?.data.sections?.measurementPending;

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
          <section className="space-y-6" aria-label="Cart items">
            {readyItems.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">Ready to buy <span className="ml-1 rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{readyItems.length}</span></h2>
                <div className="space-y-4">
                  {readyItems.map((item, originalIndex) => (
                    <CartItemRow key={item.productId + (item.variantId ?? originalIndex)} item={item} index={originalIndex} itemType="ready" />
                  ))}
                </div>
              </div>
            )}
            {customItems.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">Customize with measurement <span className="ml-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{customItems.length}</span></h2>
                {measurementPending && <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">⚠ Complete measurements for custom items before checkout.</p>}
                <div className="space-y-4">
                  {customItems.map((item, originalIndex) => (
                    <CartItemRow key={item.productId + (item.fiberId ?? originalIndex)} item={item} index={originalIndex} itemType="custom" />
                  ))}
                </div>
              </div>
            )}
          </section>
          <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between"><span>Items</span><span>{cart.data?.data.totalItems}</span></div>
              <div className="flex justify-between"><span>Ready-to-buy</span><span>{formatPrice(cart.data?.data.sections?.readyMade.subtotal ?? 0)}</span></div>
              <div className="flex justify-between"><span>Custom items</span><span>{formatPrice(cart.data?.data.sections?.customize.subtotal ?? 0)}</span></div>
              {(cart.data?.data.discount ?? 0) > 0 && <div className="flex justify-between text-green-700"><span>{cart.data?.data.couponCode ? `Coupon (${cart.data.data.couponCode})` : 'Discount'}</span><span>−{formatPrice(cart.data?.data.discount ?? 0)}</span></div>}
            </div>
            <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900"><span>Total</span><span>{formatPrice(cart.data?.data.totalPrice ?? 0)}</span></div>
            <form onSubmit={(event) => { event.preventDefault(); applyCoupon.mutate(couponCode); }} className="mt-4 flex gap-2"><input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Coupon code" className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-2 text-sm" /><button className="rounded bg-gray-900 px-3 py-2 text-sm font-semibold text-white">Apply</button></form>
            {cart.data?.data.couponCode && <p className="mt-2 text-sm text-green-700">{cart.data.data.couponCode} applied. <button type="button" onClick={() => removeCoupon.mutate()} className="underline">Remove</button></p>}
            {applyCoupon.isError && <p className="mt-2 text-sm text-red-700">{applyCoupon.error.message}</p>}
            <Link to="/checkout" className="mt-5 block w-full rounded-md bg-pink-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-pink-700">Continue to checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}

function CartItemRow({ item, index, itemType }: { item: { productType: 'READY_MADE' | 'CUSTOMIZE'; productId: string; productName: string; productImage: string | null; fiberName: string | null; color: string | null; size: string | null; unitPrice: number; quantity: number; measurementStatus: string | null; styleOptions?: { neckline?: string; sleeveStyle?: string; backDesign?: string; embroideryPlacement?: string; fitting?: string } | null }; index: number; itemType: 'ready' | 'custom' }) {
  const update = useUpdateCartItem();
  const updateMeasurements = useUpdateMeasurements();
  return (
    <article className={`flex gap-4 rounded-lg border p-3 ${itemType === 'custom' ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200 bg-white'}`}>
      <div className="h-28 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
        {item.productImage && <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-gray-900">{item.productName}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {itemType === 'custom' ? `Custom · ${item.fiberName ?? 'Fabric pending'}` : `${item.color ?? 'Color'} · ${item.size ?? 'Size'}`}
        </p>
        {item.styleOptions && (() => {
          const entries = Object.entries(item.styleOptions).filter(([, value]) => Boolean(value));
          if (entries.length === 0) return null;
          return <p className="mt-1 text-xs text-gray-500">{entries.map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}: ${value}`).join(' · ')}</p>;
        })()}
        <p className="mt-2 font-semibold text-gray-900">{formatPrice(item.unitPrice)}</p>
        <div className="mt-2 flex items-center gap-2">
          <label htmlFor={`quantity-${index}`} className="text-sm text-gray-600">Quantity</label>
          <select id={`quantity-${index}`} value={item.quantity} onChange={(event) => update.mutate({ index, quantity: Number(event.target.value) })} className="rounded border border-gray-300 px-2 py-1 text-sm">
            {Array.from({ length: 10 }, (_, quantity) => quantity + 1).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
          </select>
        </div>
        {itemType === 'custom' && (
          <MeasurementForm
            complete={item.measurementStatus === 'COMPLETE'}
            pending={updateMeasurements.isPending}
            onSubmit={(values) => updateMeasurements.mutate({ index, values })}
          />
        )}
      </div>
    </article>
  );
}

function MeasurementForm({ complete, pending, onSubmit }: { complete: boolean; pending: boolean; onSubmit: (values: MeasurementValue[]) => void }) {
  const fieldsQuery = useMeasurementFields();
  const [open, setOpen] = useState(!complete);
  const [unit, setUnit] = useState<'INCHES' | 'CM'>('INCHES');
  const [values, setValues] = useState<Record<string, string>>({});

  const fields = fieldsQuery.data?.data ?? [];
  if (fieldsQuery.isPending && fields.length === 0) return <p className="mt-2 text-sm text-gray-500">Loading fields…</p>;

  if (!open && complete) return <p className="mt-2 text-sm font-medium text-green-700">✓ Measurements complete <button type="button" onClick={() => setOpen(true)} className="ml-2 underline">Edit</button></p>;
  return (
    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-semibold text-gray-900">{complete ? 'Update measurements' : 'Complete measurements'}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="text-gray-600">Unit:</span>
        {(['INCHES', 'CM'] as const).map((option) => (
          <button key={option} type="button" onClick={() => setUnit(option)} className={`rounded px-2 py-1 font-semibold ${unit === option ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}>{option}</button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {fields.map((field) => (
          <label key={field.id} className="text-xs text-gray-700" title={field.instructions ?? ''}>
            {field.label}{field.isRequired ? ' *' : ''}
            <input type="number" step="0.1" min="1" max="200" value={values[field.key] ?? ''} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1" />
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={pending || fields.some((field) => field.isRequired && !values[field.key])}
        onClick={() => onSubmit(fields.map((field) => ({ fieldId: field.id, fieldKey: field.key, label: field.label, value: Number(values[field.key]), unit })))}
        className="mt-3 rounded bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:bg-gray-300"
      >{pending ? 'Saving…' : 'Save measurements'}</button>
    </div>
  );
}

export default CartPage;