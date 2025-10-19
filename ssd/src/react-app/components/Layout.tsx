import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSupabaseAuth } from '../auth/SupabaseAuthProvider';
import { supabase } from '../supabaseClient';
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  Package,
  Users,
  Briefcase,
  Settings,
  Menu,
  X,
  LogOut,
  Scissors // Ícone para Serviços
} from 'lucide-react';

// --- Definição de Tipos ---
interface LayoutProps {
  children: React.ReactNode;
}

// --- Dados de Navegação (com "Serviços") ---
const navigation = [
  { name: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agendamentos', href: '/appointments', icon: Calendar },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Produtos', href: '/products', icon: Package },
  { name: 'Serviços', href: '/services', icon: Scissors }, // <-- NOVO LINK
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Profissionais', href: '/professionals', icon: Briefcase },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

/**
 * Componente principal do layout que envolve todas as páginas protegidas.
 */
export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao fazer logout:", error.message);
    }
    navigate('/');
  };
  
  const userName = user?.user_metadata?.full_name || user?.email;
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Móvel */}
      <div className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-overlay/75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-card">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-primary-foreground" />
              </button>
            </div>
            <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-2">
                    <Scissors className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-bold text-foreground">SalonFlow</h1>
                </div>
              </div>
              <nav className="mt-5 space-y-1 px-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className={`mr-4 h-6 w-6 flex-shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex flex-shrink-0 border-t border-border p-4">
              <div className="flex items-center">
                <div>
                  <img
                    className="inline-block h-9 w-9 rounded-full"
                    src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || '')}&background=6366f1&color=fff`}
                    alt="Avatar do utilizador"
                  />
                </div>
                <div className="ml-3 min-w-0">
                  <p className="truncate text-base font-medium text-foreground" title={userName}>
                    {userName}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-card">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
                <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-2">
                  <Scissors className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-foreground">SalonFlow</h1>
              </div>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <item.icon className={`mr-3 h-6 w-6 flex-shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-border p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div>
                   <img
                    className="inline-block h-9 w-9 rounded-full"
                    src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || '')}&background=6366f1&color=fff`}
                    alt="Avatar do utilizador"
                  />
                </div>
                <div className="ml-3 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground" title={userName}>
                    {userName}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 bg-card pl-1 pt-1 sm:pl-3 sm:pt-3 lg:hidden">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}