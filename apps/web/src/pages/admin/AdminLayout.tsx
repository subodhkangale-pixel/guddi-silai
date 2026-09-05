import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';

import { clearAdminToken, getAdminToken } from '../../api/admin';
import { useAdminMe } from '../../api/hooks';
import Spinner from '../../components/Spinner';

const NAV_ITEMS = [
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/subcategories', label: 'Sub-categories' },
  { to: '/admin/colors', label: 'Colors' },
  { to: '/admin/sizes', label: 'Sizes' },
  { to: '/admin/fibers', label: 'Fibers' },
  { to: '/admin/embroidery', label: 'Embroidery' },
];

function AdminLayout() {
  const token = getAdminToken();
  const { data, isPending, isError } = useAdminMe(token);
  const navigate = useNavigate();

  if (!token) return <Navigate to="/admin/login" replace />;
  if (isPending)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner label="Checking session…" />
      </div>
    );
  if (isError) return <Navigate to="/admin/login" replace />;

  function signOut() {
    clearAdminToken();
    navigate('/admin/login');
  }

  const admin = data?.data;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <span className="font-bold">Guddi Silai Admin</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">
              {admin?.name ?? admin?.id ?? ''}
            </span>
            <button
              onClick={signOut}
              className="rounded-md border border-gray-600 px-3 py-1 text-sm text-gray-200 hover:bg-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <nav className="hidden w-44 flex-shrink-0 space-y-1 md:block">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;