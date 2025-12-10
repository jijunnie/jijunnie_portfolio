import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, NavLink } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Search, 
  Globe, 
  Calculator as CalculatorIcon, 
  Store, 
  Trophy,
  TrendingUp,
  Zap
} from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Markets from './pages/Markets';
import CalculatorPage from './pages/Calculator';
import Suppliers from './pages/Suppliers';
import Rankings from './pages/Rankings';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Search },
  { name: 'Markets', href: '/markets', icon: Globe },
  { name: 'Rankings', href: '/rankings', icon: Trophy },
  { name: 'Suppliers', href: '/suppliers', icon: Store },
  { name: 'Calculator', href: '/calculator', icon: CalculatorIcon },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">DropShip</h1>
              <p className="text-xs text-gray-400">Analytics Pro</p>
            </div>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
                <span className="font-medium">{item.name}</span>
                {item.name === 'Rankings' && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Pro Badge */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-white">Market Status</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-400">All systems operational</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Data refreshes every 5 minutes
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ onMenuClick }) {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10"
          >
            <Menu className="w-6 h-6 text-gray-400" />
          </button>
          
          {/* Mobile Logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">DropShip</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Market indicators */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">🇺🇸 US:</span>
              <span className="text-emerald-400">+2.4%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">🇨🇳 CN:</span>
              <span className="text-emerald-400">+3.1%</span>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/rankings" element={<Rankings />} />
        </Routes>
      </Layout>
    </Router>
  );
}
