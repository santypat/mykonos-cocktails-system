import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Users, 
  BarChart3, 
  FileText, 
  LogOut,
  Menu,
  X,
  Settings
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/sales', icon: ShoppingCart, label: 'Ventas' },
    { path: '/admin/products', icon: Package, label: 'Productos' },
    { path: '/admin/inventory', icon: Settings, label: 'Inventario' },
    { path: '/admin/movements', icon: DollarSign, label: 'Movimientos' },
    { path: '/admin/users', icon: Users, label: 'Usuarios' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reportes' },
    { path: '/admin/billing', icon: FileText, label: 'Facturación', disabled: true },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-dark-800 border-r border-dark-600 transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-dark-600">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div>
                  <h2 className="neon-text-gold font-bold text-xl">MYKONOS</h2>
                  <p className="neon-text-pink text-xs">ADMIN PANEL</p>
                </div>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              
              return (
                <Link
                  key={item.path}
                  to={item.disabled ? '#' : item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : active
                      ? 'bg-neon-cyan bg-opacity-20 neon-border-cyan border'
                      : 'hover:bg-dark-700'
                  }`}
                  onClick={(e) => item.disabled && e.preventDefault()}
                >
                  <Icon 
                    size={20} 
                    className={active ? 'text-neon-cyan' : 'text-gray-400'} 
                  />
                  {sidebarOpen && (
                    <span className={active ? 'neon-text-cyan font-medium' : 'text-gray-300'}>
                      {item.label}
                      {item.disabled && <span className="ml-2 text-xs">(Próximo)</span>}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-dark-600">
            {sidebarOpen && (
              <div className="mb-3">
                <p className="text-sm text-gray-400">Administrador</p>
                <p className="text-white font-medium truncate">{user?.fullName}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-dark-700 transition-colors w-full text-left"
            >
              <LogOut size={20} className="text-neon-pink" />
              {sidebarOpen && <span className="text-gray-300">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
