import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';
import LoginPage      from './pages/LoginPage';
import DashboardPage  from './pages/DashboardPage';
import POSPage        from './pages/POSPage';
import OrdersPage     from './pages/OrdersPage';
import InventoryPage  from './pages/InventoryPage';
import ReportsPage    from './pages/ReportsPage';
import ProductsPage   from './pages/ProductsPage';
import TablesPage     from './pages/TablesPage';
import SettingsPage   from './pages/SettingsPage';
import KitchenPage    from './pages/KitchenPage';

const PrivateRoute = ({ children }) => {
  const token = useAuthStore(s => s.accessToken);
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="pos"        element={<POSPage />} />
          <Route path="orders"     element={<OrdersPage />} />
          <Route path="kitchen"    element={<KitchenPage />} />
          <Route path="products"   element={<ProductsPage />} />
          <Route path="inventory"  element={<InventoryPage />} />
          <Route path="reports"    element={<ReportsPage />} />
          <Route path="tables"     element={<TablesPage />} />
          <Route path="settings"   element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
