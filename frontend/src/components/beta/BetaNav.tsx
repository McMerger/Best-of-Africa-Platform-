import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { Menu, X } from 'lucide-react';
import { GoldButton } from './GoldButton';
import { KO_FI_URL } from '../../constants/beta';

const links = [
  { name: 'Stories', path: '/stories' },
  { name: 'Member Access', path: '/member-access' },
  { name: 'Countries', path: '/countries' },
  { name: 'About', path: '/about' },
  { name: 'Newsletter', path: '/newsletter' },
];

export const BetaNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when navigating or pressing Escape
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0F1E]/85 backdrop-blur-md"
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          
          <Link to="/" className="flex-shrink-0 flex items-center gap-1.5 group">
            <span className="font-serif font-bold text-xl text-white group-hover:opacity-90 transition-opacity">Best of</span>
            <span className="font-serif font-bold text-xl text-[#C9A84C] group-hover:opacity-90 transition-opacity">Africa</span>
          </Link>

          {/* Desktop Nav */}
          <NavigationMenu.Root className="hidden md:flex relative justify-center z-10">
            <NavigationMenu.List className="flex gap-8 items-center m-0 p-0 list-none">
              {links.map((link) => {
                // Match exact path or the path followed immediately by '/' (prevents /stories matching /stories/:slug)
                const isActive = location.pathname === link.path ||
                  (link.path !== '/' && location.pathname.startsWith(link.path + '/'));
                return (
                  <NavigationMenu.Item key={link.path}>
                    <NavigationMenu.Link asChild active={isActive}>
                      <Link 
                        to={link.path}
                        className={`font-sans font-medium text-[0.9375rem] transition-colors duration-150 ${
                          isActive ? 'text-white' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {link.name}
                      </Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                );
              })}
            </NavigationMenu.List>
          </NavigationMenu.Root>

          {/* Right side CTA / Mobile Toggle */}
          <div className="flex items-center gap-4">
            <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="hidden md:block">
              <GoldButton variant="primary" size="small">Join Now</GoldButton>
            </a>
            
            <button 
              className="md:hidden text-white/80 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-[#0A0F1E] flex flex-col px-6 pt-16 pb-8 border-b border-white/10"
            style={{ height: '100dvh' }}
          >
            <button 
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={28} />
            </button>
            <nav className="flex flex-col gap-8 mt-12">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-3xl font-serif text-white/80 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-10 mt-6 border-t border-white/10">
                <Link to="/membership" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                  <GoldButton variant="primary" className="w-full">Become a Founding Member</GoldButton>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
