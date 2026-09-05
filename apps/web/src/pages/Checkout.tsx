import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import Spinner from '../components/Spinner';
import { useCart, useCreateOrder } from '../api/hooks';
import { createPayment, verifyPayment } from '../api/paymentApi';
import { estimateShipping, checkPincode } from '../api/deliveryApi';
import { formatPrice } from '../lib/format';

type PaymentMethod = 'COD' | 'UPI' | 'NET_BANKING' | 'RAZORPAY';
const PAYMENT_METHODS: { value: PaymentMethod; label: string; detail: string }[] = [
  { value: 'UPI', label: 'UPI', detail: 'GPay, PhonePe, Paytm — 0% fee' },
  { value: 'COD', label: 'Cash on Delivery', detail: 'Pay when you receive' },
  { value: 'NET_BANKING', label: 'Net Banking', detail: 'All major banks' },
  { value: 'RAZORPAY', label: 'Card / Other', detail: 'Visa, Mastercard, Amex' },
];

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [shipping, setShipping] = useState(0);
  const [shippingState, setShippingState] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [shippingMessage, setShippingMessage] = useState('');
  const [pincodeChecked, setPincodeChecked] = useState('');

  async function onCheckPincode() {
    if (form.pincode.length !== 6) { setShippingState('error'); setShippingMessage('Enter a valid 6-digit pincode'); return; }
    setShippingState('checking');
    try {
      const result = await checkPincode(form.pincode);
      const info = result.data;
      if (info.serviceable) {
        const estimate = await estimateShipping(form.pincode);
        setShipping(estimate.data.shipping);
        setShippingMessage(`${info.message}${estimate.data.shipping > 0 ? ` · Shipping ${formatPrice(estimate.data.shipping)}` : ' · Free shipping'}`);
        setShippingState('ok');
        setPincodeChecked(form.pincode);
      } else {
        setShipping(0);
        setShippingMessage(info.message);
        setShippingState('error');
        setPincodeChecked('');
      }
    } catch (error) {
      setShippingMessage(error instanceof Error ? error.message : 'Could not check pincode');
      setShippingState('error');
      setPincodeChecked('');
    }
  }

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
  const online = paymentMethod !== 'COD';
  if (createOrder.isSuccess && (!online || paid)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-600">Order placed</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Thank you for your order</h1>
        <p className="mt-3 text-gray-600">Your order number is <strong>{createOrder.data.data.orderNumber}</strong>.</p>
        <Link to={`/orders/${createOrder.data.data.orderNumber}`} className="mt-8 inline-block rounded-md bg-pink-600 px-5 py-3 font-semibold text-white">View order details</Link>
      </div>
    );
  }

  const items = cart.data?.data.items ?? [];
  if (items.length === 0) return <Message text="Your cart is empty." link />;

  const readyItems = items.filter((item) => item.productType === 'READY_MADE');
  const customItems = items.filter((item) => item.productType === 'CUSTOMIZE');
  const grossSubtotal = (cart.data?.data.sections?.readyMade.subtotal ?? 0) + (cart.data?.data.sections?.customize.subtotal ?? 0);
  const discount = cart.data?.data.discount ?? 0;
  const total = ((cart.data?.data.totalPrice ?? 0) + shipping);

  function submit(event: FormEvent) {
    event.preventDefault();
    setPaymentError(null);
    if (online && (!pincodeChecked || pincodeChecked !== form.pincode)) {
      setPaymentError('Check your pincode for delivery before continuing.');
      return;
    }
    createOrder.mutate(
      { ...form, shipping, paymentMethod },
      {
        onSuccess: (result) => {
          if (online) void startPayment(result.data.orderNumber);
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-gray-200 pb-5"><p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Almost yours</p><h1 className="mt-1 text-3xl font-bold text-gray-900">Checkout</h1></div>
      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Delivery details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(['name', 'mobile', 'email', 'city', 'state', 'pincode'] as const).map((field) => (
                <label key={field} className="text-sm font-medium capitalize text-gray-700">{field === 'pincode' ? 'Pincode' : field}
                  <input required={field !== 'email'} type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
                </label>
              ))}
            </div>
            <div className="mt-3">
              <button type="button" onClick={onCheckPincode} disabled={shippingState === 'checking'} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300">Check delivery</button>
              {shippingState === 'ok' && <p className="mt-2 text-sm text-green-700">✓ {shippingMessage}</p>}
              {shippingState === 'error' && <p className="mt-2 text-sm text-red-700">✕ {shippingMessage}</p>}
            </div>
          </div>
          <label className="block text-sm font-medium text-gray-700">Address<textarea required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} rows={3} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium text-gray-700">Order notes (optional)<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={2} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          {(createOrder.isError || paymentError) && <p className="text-sm text-red-700">{paymentError ?? createOrder.error?.message}</p>}
        </section>
        <aside className="h-fit rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
          {readyItems.length > 0 && <div className="mt-4"><p className="text-xs font-bold uppercase text-gray-500">Ready to buy</p><div className="mt-2 space-y-2 text-sm text-gray-600">{readyItems.map((item) => <div key={`r-${item.productId}-${item.variantId}`} className="flex justify-between gap-3"><span>{item.productName} × {item.quantity}</span><span>{formatPrice(item.unitPrice * item.quantity)}</span></div>)}</div></div>}
          {customItems.length > 0 && <div className="mt-4"><p className="text-xs font-bold uppercase text-gray-500">Custom with measurements</p><div className="mt-2 space-y-2 text-sm text-gray-600">{customItems.map((item) => <div key={`c-${item.productId}-${item.fiberId}`} className="flex justify-between gap-3"><span>{item.productName} × {item.quantity}</span><span>{formatPrice(item.unitPrice * item.quantity)}</span></div>)}</div></div>}
          <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(grossSubtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>−{formatPrice(discount)}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>{shipping > 0 ? formatPrice(shipping) : 'Free'}</span></div>
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900"><span>Total</span><span>{formatPrice(total)}</span></div>
          <fieldset className="mt-4 space-y-2 text-sm text-gray-700"><legend className="font-semibold">Payment method</legend>
            {PAYMENT_METHODS.map((method) => (
              <label key={method.value} className="flex items-start gap-2 rounded-md border border-gray-200 p-2">
                <input type="radio" className="mt-0.5" checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} />
                <span><span className="font-medium">{method.label}</span><span className="block text-xs text-gray-500">{method.detail}</span></span>
              </label>
            ))}
          </fieldset>
          <button disabled={createOrder.isPending || isPaying} className="mt-5 w-full rounded-md bg-pink-600 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-700 disabled:bg-gray-300">{createOrder.isPending || isPaying ? 'Processing…' : online ? 'Pay securely' : 'Place order'}</button>
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