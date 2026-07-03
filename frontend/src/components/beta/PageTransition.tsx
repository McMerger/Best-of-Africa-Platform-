import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// True once the app has completed its first page view. The entrance animation
// only runs on route *changes* — animating the very first paint from opacity 0
// hides the hero (the LCP element) until the fade finishes, adding ~300ms+ to
// LCP on every cold load for zero perceived benefit.
let hasNavigated = false;

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isFirstLoad = !hasNavigated;

  useEffect(() => { hasNavigated = true; }, []);

  return (
    <motion.div
      key={location.pathname}
      initial={isFirstLoad ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};
