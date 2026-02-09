import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user has requested reduced motion.
 * @returns boolean - true if the user prefers reduced motion.
 */
export function useReducedMotion() {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setMatches(mediaQuery.matches);

        const listener = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        mediaQuery.addEventListener('change', listener);
        return () => {
            mediaQuery.removeEventListener('change', listener);
        };
    }, []);

    return matches;
}
