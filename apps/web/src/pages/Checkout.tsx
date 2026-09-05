import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import Spinner from '../components/Spinner';
import { useCart, useCreateOrder } from '../api/hooks';
import { createPayment, verifyPayment } from '../api/paymentApi';
import { formatPrice } from '../lib/format';

const initialForm = {
  name: '', mobile: '', email: '', address: '', city: '', state: '', pincode: '', notes: '',
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function CheckoutPage() {
  const cart = useCart();
  const createOrder = useCreateOrder();
  const [form, setForm] = useState(initialForm);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('COD');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  async function startPayment(orderNumber: string) {
    setIsPaying(true);
    try {
      if (!(await loadRazorpayScript()) || !window.Razorpay) throw new Error('Razorpay Checkout could not be loaded');
      const payment = await createPayment(orderNumber);
      const checkout = new window.Razorpay({
        key: payment.data.keyId,
        amount: payment.data.amount,
        currency: payment.data.currency,
        name: 'Guddi Silai',
        description: `Order ${orderNumber}`,
        order_id: payment.data.orderId,
        prefill: { name: form.name, email: form.email, contact: form.mobile },
        handler: async (response: Record<string, string>) => {
          try {
            await verifyPayment({
              orderNumber,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setPaid(true);
          } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'Payment verification failed');
          } finally {
            setIsPaying(false);
          }
        },
        modal: { ondismiss: () => setIsPaying(false) },
      });
      checkout.open();
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Could not start payment');
      setIsPaying(false);
    }
  }

  if (cart.isPending) return <Spinner label="Preparing checkout…" />;
  if (cart.isError) return <Message text="Could not load checkout." />;
  if (createOrder.isSuccess && (paymentMethod === 'COD' || paid)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-600">Order placed</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Thank you for your order</h1>
        <p className="mt-3 text-gray-600">Your order number is <strong>{createOrder.data.data.orderNumber}</strong>.</p>
        <Link to="/orders" className="mt-8 inline-block rounded-md bg-pink-600 px-5 py-3 font-semibold text-white">View my orders</Link>
      </div>
    );
  }

  const items = cart.data?.data.items ?? [];
  if (items.length === 0) return <Message text="Your cart is empty." link />;

  function submit(event: FormEvent) {
    event.preventDefault();
    setPaymentError(null);
    createOrder.mutate(
      { ...form, paymentMethod },
      {
        onSuccess: (result) => {
          if (paymentMethod === 'RAZORPAY') void startPayment(result.data.orderNumber);
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-gray-200 pb-5"><p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Almost yours</p><h1 className="mt-1 text-3xl font-bold text-gray-900">Checkout</h1></div>
      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Delivery details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['name', 'mobile', 'email', 'city', 'state', 'pincode'] as const).map((field) => (
              <label key={field} className="text-sm font-medium capitalize text-gray-700">{field === 'pincode' ? 'Pincode' : field}
                <input required={field !== 'email'} type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
              </label>
            ))}
          </div>
          <label className="block text-sm font-medium text-gray-700">Address<textarea required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} rows={3} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium text-gray-700">Order notes (optional)<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={2} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          {(createOrder.isError || paymentError) && <p className="text-sm text-red-700">{paymentError ?? createOrder.error?.message}</p>}
        </section>
        <aside className="h-fit rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm text-gray-600">{items.map((item) => <div key={`${item.productId}-${item.variantId ?? item.fiberId}`} className="flex justify-between gap-3"><span>{item.productName} × {item.quantity}</span><span>{formatPrice(item.unitPrice * item.quantity)}</span></div>)}</div>
          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-lg font-bold"><span>Total</span><span>{formatPrice(cart.data?.data.totalPrice ?? 0)}</span></div>
          <fieldset className="mt-4 space-y-2 text-sm text-gray-700"><legend className="font-semibold">Payment method</legend><label className="flex gap-2"><input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} /> Cash on delivery</label><label className="flex gap-2"><input type="radio" checked={paymentMethod === 'RAZORPAY'} onChange={() => setPaymentMethod('RAZORPAY')} /> UPI / Card via Razorpay</label></fieldset>
          <button disabled={createOrder.isPending || isPaying} className="mt-5 w-full rounded-md bg-pink-600 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-700 disabled:bg-gray-300">{createOrder.isPending || isPaying ? 'Processing…' : paymentMethod === 'COD' ? 'Place order' : 'Pay securely'}</button>
        </aside>
      </form>
    </div>
  );
}

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Message({ text, link = false }: { text: string; link?: boolean }) {
  return <div className="mx-auto max-w-2xl px-4 py-20 text-center"><p className="text-lg text-gray-700">{text}</p>{link && <Link to="/products" className="mt-4 inline-block font-semibold text-pink-600">Explore designs →</Link>}</div>;
}

export default CheckoutPage;