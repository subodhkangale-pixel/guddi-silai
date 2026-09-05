import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetailPage from './pages/ProductDetail';
import CartPage from './pages/Cart';
import WishlistPage from './pages/Wishlist';
import CheckoutPage from './pages/Checkout';
import OrdersPage from './pages/Orders';
import OrderDetailPage from './pages/OrderDetail';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import CatalogueCrud from './pages/admin/CatalogueCrud';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminInventory from './pages/admin/AdminInventory';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminOffers from './pages/admin/AdminOffers';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRoles from './pages/admin/AdminRoles';
import AdminPermissions from './pages/admin/AdminPermissions';
import AdminLogs from './pages/admin/AdminLogs';
import AdminAddons from './pages/admin/AdminAddons';
import AdminNotifications from './pages/admin/AdminNotifications';
import NotificationsPage from './pages/Notifications';
import SizeGuidePage from './pages/SizeGuide';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Catalog />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:orderNumber" element={<OrderDetailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="size-guide" element={<SizeGuidePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/products" replace />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="offers" element={<AdminOffers />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="roles" element={<AdminRoles />} />
        <Route path="permissions" element={<AdminPermissions />} />
        <Route path="activity" element={<AdminLogs />} />
        <Route path="addons" element={<AdminAddons />} />
        <Route path="categories" element={<CatalogueCrud entity="categories" />} />
        <Route path="subcategories" element={<CatalogueCrud entity="subcategories" />} />
        <Route path="colors" element={<CatalogueCrud entity="colors" />} />
        <Route path="sizes" element={<CatalogueCrud entity="sizes" />} />
        <Route path="fibers" element={<CatalogueCrud entity="fibers" />} />
        <Route path="embroidery" element={<CatalogueCrud entity="embroidery" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;