import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import Home from './pages/Home';
import About from './pages/About';
import Resume from './pages/Resume';
import Projects from './pages/Projects';
import Skills from './pages/Skills';
import Interests from './pages/Interests';
import Contact from './pages/Contact';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" onClick={closeMenus} className="text-xl font-bold text-gray-800" style={{ fontFamily: 'cursive' }}>
                Jijun Nie
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link to="/about" onClick={closeMenus} className="text-gray-600 hover:text-gray-900">
                  About
                </Link>
                
                {/* Dropdown Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="text-gray-600 hover:text-gray-900 flex items-center"
                  >
                    More <ChevronDown size={16} className="ml-1" />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link to="/resume" onClick={closeMenus} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                        My Resume
                      </Link>
                      <Link to="/projects" onClick={closeMenus} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                        Projects
                      </Link>
                      <Link to="/skills" onClick={closeMenus} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                        Skills
                      </Link>
                      <Link to="/interests" onClick={closeMenus} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                        Personal Interests
                      </Link>
                      <Link to="/contact" onClick={closeMenus} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                        Contact
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile menu button */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
              <div className="md:hidden pb-4">
                <Link to="/about" onClick={closeMenus} className="block py-2 text-gray-600 hover:text-gray-900">
                  About
                </Link>
                <Link to="/resume" onClick={closeMenus} className="block py-2 text-gray-600 hover:text-gray-900">
                  My Resume
                </Link>
                <Link to="/projects" onClick={closeMenus} className="block py-2 text-gray-600 hover:text-gray-900">
                  Projects
                </Link>
                <Link to="/skills" onClick={closeMenus} className="block py-2 text-gray-600 hover:text-gray-900">
                  Skills
                </Link>
                <Link to="/interests" onClick={closeMenus} className="block py-2 text-gray-600 hover:text-gray-900">
                  Personal Interests
                </Link>
                <Link to="/contact" onClick={closeMenus} className="block py-2 text-gray-600 hover:text-gray-900">
                  Contact
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <div className="pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/interests" element={<Interests />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <p>&copy; 2024 Jijun Nie. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
