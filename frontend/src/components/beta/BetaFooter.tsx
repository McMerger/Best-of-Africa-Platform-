import { Link } from 'react-router-dom';
import { KO_FI_URL } from '../../constants/beta';

/**
 * Shared minimal footer used across all beta pages.
 * BetaLanding uses its own full footer; this is for the secondary pages.
 */
export const BetaFooter = () => (
  <footer className="border-t border-white/5 py-10 px-6">
    <div className="max-w-4xl mx-auto flex flex-col items-center gap-5 text-center">
      <Link to="/" className="font-serif text-lg font-bold">
        Best of <span className="text-[#C9A84C]">Africa</span>
      </Link>
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/40">
        <Link to="/stories"       className="hover:text-white transition-colors">Stories</Link>
        <Link to="/countries"     className="hover:text-white transition-colors">Countries</Link>
        <Link to="/about"         className="hover:text-white transition-colors">About</Link>
        <Link to="/membership"    className="hover:text-white transition-colors">Membership</Link>
        <Link to="/newsletter"    className="hover:text-white transition-colors">Newsletter</Link>
        <Link to="/member-access" className="hover:text-[#C9A84C] transition-colors">Member Access</Link>
        <a
          href={KO_FI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#C9A84C] transition-colors"
        >Ko-fi ↗</a>
      </nav>
      <p className="text-xs text-white/20">© {new Date().getFullYear()} Best of Africa</p>
    </div>
  </footer>
);
