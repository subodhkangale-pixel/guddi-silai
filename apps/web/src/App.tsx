import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetailPage from './pages/ProductDetail';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import CatalogueCrud from './pages/admin/CatalogueCrud';
import AdminProducts from './pages/admin/AdminProducts';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Catalog />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/products" replace />} />
        <Route path="products" element={<AdminProducts />} />
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