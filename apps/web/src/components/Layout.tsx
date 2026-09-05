import { Link, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

function Layout() {
  const { user, status, logout } = useAuth();
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
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t bg-white/95 py-2 backdrop-blur sm:hidden">
        <Link to="/" className="text-center text-xs font-medium text-gray-700">Home</Link>
        <Link to="/products" className="text-center text-xs font-medium text-gray-700">Categories</Link>
        <Link to="/wishlist" className="text-center text-xs font-medium text-gray-700">Wishlist</Link>
        <Link to="/cart" className="text-center text-xs font-medium text-gray-700">Cart</Link>
      </nav>
    </div>
  );
}

export default Layout;