import { Link, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../api/hooks';

function Layout() {
  const { user, status, logout } = useAuth();
  const wishlist = useWishlist();
  const cart = useCart();
  const cartCount = cart.data?.data.totalItems ?? 0;
  const navigate = useNavigate();

  function handleSignOut() {
    void logout().then(() => navigate('/'));
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Guddi Silai</h1>
            </Link>
            <nav className="hidden items-center space-x-4 sm:flex">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/products"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Products
              </Link>
              <Link to="/wishlist" aria-label="Wishlist" className="relative inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-pink-50 hover:text-pink-700">
                <span aria-hidden="true" className="text-lg leading-none">♡</span><span>Wishlist</span>
                {wishlist.items.length > 0 && <CountBadge count={wishlist.items.length} />}
              </Link>
              <Link to="/cart" aria-label="Cart" className="relative inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-pink-50 hover:text-pink-700">
                <span aria-hidden="true" className="text-lg leading-none">🛍</span><span>Cart</span>
                {cartCount > 0 && <CountBadge count={cartCount} />}
              </Link>
              <Link to="/notifications" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Notifications</Link>
              {status === 'authenticated' && user ? (
                <span className="flex items-center gap-3">
                  <Link to="/orders" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">My orders</Link>
                  <Link to="/" onClick={handleSignOut} className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Sign out ({user.name})</Link>
                </span>
              ) : (
                <Link
                  to="/login"
                  className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/products" className="text-gray-600 hover:text-gray-900 font-medium">Collection</Link>
            <Link to="/size-guide" className="text-gray-600 hover:text-gray-900 font-medium">Size guide</Link>
            <Link to="/notifications" className="text-gray-600 hover:text-gray-900 font-medium">Notifications</Link>
            <Link to="/admin/login" className="text-gray-600 hover:text-gray-900 font-medium">Admin</Link>
          </nav>
          <p className="mt-4 text-center text-gray-500 text-sm">
            © 2024 Guddi Silai. All rights reserved.
          </p>
        </div>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t bg-white/95 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur sm:hidden">
        <MobileNavLink to="/" icon="⌂" label="Home" />
        <MobileNavLink to="/products" icon="⌕" label="Shop" />
        <MobileNavLink to="/wishlist" icon="♡" label="Wishlist" count={wishlist.items.length} />
        <MobileNavLink to="/cart" icon="🛍" label="Cart" count={cartCount} />
      </nav>
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  return <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] font-bold text-white">{count > 99 ? '99+' : count}</span>;
}

function MobileNavLink({ to, icon, label, count = 0 }: { to: string; icon: string; label: string; count?: number }) {
  return <Link to={to} className="relative flex flex-col items-center justify-center gap-0.5 py-0.5 text-xs font-medium text-gray-700"><span aria-hidden="true" className="text-lg leading-none">{icon}</span><span>{label}</span>{count > 0 && <CountBadge count={count} />}</Link>;
}

export default Layout;
