import React from 'react';
import { Link } from 'react-router-dom';
import { KO_FI_URL } from '../constants/beta';

const groups = [
  { title: 'Read', links: [['Stories', '/posts'], ['Daily Briefing', '/feed'], ['Countries', '/countries'], ['Gallery', '/gallery']] },
  { title: 'Intelligence', links: [['Market Intelligence', '/intelligence'], ['Continental Overview', '/dashboards/overview'], ['Decision Workspace', '/library']] },
  { title: 'Services', links: [['Events', '/events'], ['Consultation', '/request-consultation'], ['Business Travel', '/travel']] },
  { title: 'Account', links: [['Membership', '/membership'], ['Newsletter', '/newsletter'], ['Member Access', '/member-access'], ['Sign In', '/login']] },
] as const;

export const Footer: React.FC = () => (
  <footer className="mt-16 border-t border-white/10 bg-navy text-white">
    <div className="container py-14 md:py-16">
      <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.35fr_2fr]">
        <div>
          <Link to="/" className="font-serif text-2xl font-semibold tracking-tight">BOA<span className="text-accent">.</span></Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">Independent African reporting, country briefings and market intelligence built with context.</p>
          <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex border-b border-accent pb-1 text-sm font-medium text-accent hover:text-white">Support independent reporting</a>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {groups.map(group => (
            <div key={group.title}>
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">{group.title}</h2>
              <ul className="space-y-3 text-sm text-white/65">
                {group.links.map(([label, to]) => <li key={to}><Link to={to} className="hover:text-white">{label}</Link></li>)}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="flex flex-col gap-5 pt-7 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
        <span>© {new Date().getFullYear()} Best of Africa. All rights reserved.</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/about" className="hover:text-white">About</Link><Link to="/contact" className="hover:text-white">Contact</Link><Link to="/privacy" className="hover:text-white">Privacy</Link><Link to="/terms" className="hover:text-white">Terms</Link><Link to="/settings" className="hover:text-white">Settings</Link>
        </div>
      </div>
    </div>
  </footer>
);
