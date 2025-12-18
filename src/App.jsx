import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X, User, FileText, FolderKanban, Code, Heart, Mail, Globe as GlobeIcon } from 'lucide-react';
import Home from './pages/Home';
import About from './pages/About';
import Resume from './pages/Resume';
import Projects from './pages/Projects';
import Skills from './pages/Skills';
import Interests from './pages/Interests';
import Contact from './pages/Contact';
import Globe from './pages/Globe';
import WorldIcon from './components/globe/WorldIcon';
// Navigation Bar Component with Liquid Glass Design
function NavBar({ navItems, isMenuOpen, setIsMenuOpen, closeMenus }) {
  const location = useLocation();
  const isGlobePage = location.pathname === '/globe';
  
  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] max-w-4xl">
      {/* Liquid Glass Background */}
      <div className={`liquid-glass-nav ${isGlobePage ? 'globe-page-nav' : ''}`}>
        <div className="relative flex items-center justify-between h-14 md:h-16 px-4 md:px-6" style={{ alignItems: 'center' }}>
          {/* Desktop: Name on left, Icons centered, Globe centered */}
          <div className="hidden md:flex items-center w-full">
            {/* Name on left */}
            <Link
              to="/"
              onClick={closeMenus}
              className="text-lg md:text-xl font-bold text-gray-800 mr-8 hover:text-gray-600 transition-colors"
              style={{ fontFamily: 'cursive', whiteSpace: 'nowrap' }}
            >
              Jijun Nie
            </Link>
            
            {/* Centered Icons (without globe) */}
            <div className="flex items-center justify-center flex-1 space-x-2 md:space-x-3 lg:space-x-4">
              {navItems.filter(item => item.path !== '/globe').map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenus}
                    className={`nav-icon-link ${isActive ? 'active' : ''}`}
                    title={item.label}
                  >
                    <Icon
                      size={20}
                      className={`transition-all duration-300 ${isActive ? 'scale-110' : ''}`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {isActive && <span className="nav-active-indicator"></span>}
                  </Link>
                );
              })}
            </div>
            
            {/* Globe Icon - Right Aligned, Center Point Aligned with Header Height */}
            <div className="flex items-center justify-end ml-8" style={{ height: '100%', alignItems: 'center' }}>
              {navItems.filter(item => item.path === '/globe').map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenus}
                    className={`nav-icon-link ${isActive ? 'active' : ''}`}
                    title={item.label}
                    style={{
                      width: '80px',
                      height: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: 0,
                      transform: 'none',
                      position: 'relative',
                      marginLeft: '16px',
                      left: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'none'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      margin: 0,
                      position: 'relative',
                      top: '8px',
                      left: '8px'
                    }}>
                      <WorldIcon size={110} className={`transition-all duration-300 ${isActive ? 'scale-110' : ''}`} />
                    </div>
                    {isActive && <span className="nav-active-indicator"></span>}
                  </Link>
                );
              })}
            </div>
          </div>
          {/* Mobile: Hamburger left, Name centered, Globe right */}
          <div className="md:hidden flex items-center justify-between w-full">
            {/* Hamburger Menu - Left */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-gray-900 transition-all duration-300 hover:bg-white/30 hover:scale-110 rounded-lg p-2 -ml-2 group active:scale-95"
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                <X
                  size={24}
                  className={`absolute transition-all duration-300 ease-in-out ${
                    isMenuOpen
                      ? 'opacity-100 rotate-0 scale-100'
                      : 'opacity-0 rotate-180 scale-0'
                  }`}
                />
                <Menu
                  size={24}
                  className={`absolute transition-all duration-300 ease-in-out ${
                    isMenuOpen
                      ? 'opacity-0 -rotate-180 scale-0'
                      : 'opacity-100 rotate-0 scale-100'
                  }`}
                />
              </div>
            </button>
            
            {/* Name - Centered */}
            <Link
              to="/"
              onClick={closeMenus}
              className="absolute left-1/2 transform -translate-x-1/2 text-lg font-bold text-gray-800 hover:text-gray-600 transition-colors"
              style={{ fontFamily: 'cursive' }}
            >
              Jijun Nie
            </Link>
            
            {/* Globe Icon - Right Aligned, Center Point Aligned with Header Height */}
            <div className="flex items-center justify-end" style={{ height: '100%', alignItems: 'center' }}>
              {navItems.filter(item => item.path === '/globe').map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenus}
                    className={`nav-icon-link ${isActive ? 'active' : ''}`}
                    title={item.label}
                    style={{
                      width: '70px',
                      height: '70px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: 0,
                      transform: 'none',
                      position: 'relative',
                      marginLeft: '16px',
                      left: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'none'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      margin: 0,
                      position: 'relative',
                      top: '8px',
                      left: '8px'
                    }}>
                      <WorldIcon size={100} className={`transition-all duration-300 ${isActive ? 'scale-110' : ''}`} />
                    </div>
                    {isActive && <span className="nav-active-indicator"></span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 px-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const isGlobe = item.path === '/globe';
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenus}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-white/40 text-blue-600'
                        : 'text-gray-600 hover:bg-white/20 hover:text-gray-900'
                    }`}
                  >
                    {isGlobe ? (
                      <WorldIcon size={44} className={isActive ? 'scale-110' : ''} />
                    ) : (
                      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    )}
                    <span className="text-xs mt-1 font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .liquid-glass-nav {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          box-shadow:
            0 8px 32px 0 rgba(31, 38, 135, 0.1),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease;
        }
        .liquid-glass-nav.globe-page-nav {
          background: rgba(255, 255, 255, 0.95);
        }
        .liquid-glass-nav:hover {
          background: rgba(255, 255, 255, 0.75);
          box-shadow:
            0 12px 40px 0 rgba(31, 38, 135, 0.15),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.6);
        }
        .liquid-glass-nav.globe-page-nav:hover {
          background: rgba(255, 255, 255, 0.98);
        }
        .nav-icon-link {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          color: #6b7280;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-icon-link:hover {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          transform: translateY(-2px);
        }
        .nav-icon-link.active {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.15);
        }
        .nav-active-indicator {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: #3b82f6;
          border-radius: 50%;
          animation: pulse-indicator 2s ease-in-out infinite;
        }
        @keyframes pulse-indicator {
          0%, 100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          50% {
            opacity: 0.6;
            transform: translateX(-50%) scale(1.3);
          }
        }
        @keyframes rotate-in {
          from {
            opacity: 0;
            transform: rotate(-90deg) scale(0.5);
          }
          to {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
        }
        @keyframes rotate-out {
          from {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
          to {
            opacity: 0;
            transform: rotate(90deg) scale(0.5);
          }
        }
        .hamburger-rotate-in {
          animation: rotate-in 0.3s ease forwards;
        }
        .hamburger-rotate-out {
          animation: rotate-out 0.3s ease forwards;
        }
        @media (max-width: 768px) {
          .liquid-glass-nav {
            border-radius: 16px;
          }
        }
      `}</style>
    </nav>
  );
}
// Layout component that conditionally shows footer
function Layout({ children }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isGlobePage = location.pathname === '/globe';
  
  return (
    <>
      {children}
      {/* Footer - hidden on home and globe pages since they use fixed positioning */}
      {!isHomePage && !isGlobePage && (
        <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <p>&copy; 2024 Jijun Nie. All rights reserved.</p>
          </div>
        </footer>
      )}
    </>
  );
}
export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenus = () => {
    setIsMenuOpen(false);
  };
  // Navigation items with icons
  const navItems = [
    { path: '/about', icon: User, label: 'About' },
    { path: '/resume', icon: FileText, label: 'Resume' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/skills', icon: Code, label: 'Skills' },
    { path: '/interests', icon: Heart, label: 'Interests' },
    { path: '/globe', icon: GlobeIcon, label: 'Travel' },
    { path: '/contact', icon: Mail, label: 'Contact' },
  ];
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation with Liquid Glass Design */}
        <NavBar navItems={navItems} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} closeMenus={closeMenus} />
        {/* Main Content */}
        <Layout>
          <div className="pt-20 md:pt-24">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/resume" element={<Resume />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/interests" element={<Interests />} />
              <Route path="/globe" element={<Globe />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </div>
        </Layout>
      </div>
    </Router>
  );
}

