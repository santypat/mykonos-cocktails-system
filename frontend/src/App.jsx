import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Páginas
import Login from './pages/Login';
import SellerPanel from './pages/SellerPanel';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminInventory from './pages/admin/Inventory';
import AdminSales from './pages/admin/Sales';
import AdminMovements from './pages/admin/Movements';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';

// Componente de ruta protegida
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/seller" />;
  }

  return children;
}

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid #00F0FF',
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#00FF85',
              secondary: '#1A1A1A',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF006E',
              secondary: '#1A1A1A',
            },
          },
        }}
      />

      <Routes>
        {/* Ruta pública */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'admin' ? '/admin' : '/seller'} />
            ) : (
              <Login />
            )
          } 
        />

        {/* Panel de Vendedor */}
        <Route
          path="/seller"
          element={
            <ProtectedRoute>
              <SellerPanel />
            </ProtectedRoute>
          }
        />

        {/* Panel Administrativo */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout>
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="sales" element={<AdminSales />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="movements" element={<AdminMovements />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="reports" element={<AdminReports />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route
          path="/"
          element={
            <Navigate to={
              isAuthenticated
                ? (user?.role === 'admin' ? '/admin' : '/seller')
                : '/login'
            } />
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
