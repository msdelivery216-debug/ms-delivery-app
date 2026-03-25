import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  UserCircle, 
  LogOut, 
  Menu, 
  X,
  Truck,
  ListOrdered,
  Plus,
  WalletCards // <-- Added Icon for Payment Summary
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => setProfile(data));
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Register Order', path: '/orders', icon: PlusCircle },
    { name: 'All Orders', path: '/orders-list', icon: ListOrdered },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Payment Summary', path: '/payment-summary', icon: WalletCards }, // <-- Added Route
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header - High Contrast */}
      <div className="md:hidden bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <Truck className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-lg tracking-tight">MS Delivery</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar - Premium Dark Theme */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300 md:relative md:translate-x-0 shadow-2xl md:shadow-none",
              !isSidebarOpen && "hidden md:flex"
            )}
          >
            {/* Sidebar Header */}
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                {profile?.logoUrl ? (
                  <img src={profile.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-800" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-inner">
                    <Truck className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-white leading-tight tracking-wide">MS Delivery</h1>
                  <p className="text-xs text-slate-400 font-medium tracking-wider uppercase mt-0.5">Logistics Admin</p>
                </div>
              </div>
              <button className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group font-medium",
                      isActive 
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3.5 w-full px-4 py-3.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200 font-medium"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full min-h-full">
          {children}
        </div>
        
        {/* Floating Action Button (FAB) */}
        <Link
          to="/orders"
          className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:bg-indigo-500 hover:-translate-y-1 transition-all duration-300 z-40 group"
          title="Register New Order"
        >
          <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
        </Link>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
