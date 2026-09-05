import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetailPage from './pages/ProductDetail';
import CartPage from './pages/Cart';
import WishlistPage from './pages/Wishlist';
import CheckoutPage from './pages/Checkout';
import OrdersPage from './pages/Orders';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import CatalogueCrud from './pages/admin/CatalogueCrud';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';

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
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/products" replace />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
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