import { useEffect, useRef, useState } from 'react';
import { ArrowUp, List, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

type PageSection = { id: string; label: string };

export function ScrollToTopButton() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > Math.max(520, window.innerHeight * 0.65));
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    setVisible(false);
    setOpen(false);

    const collect = () => {
      const headings = Array.from(document.querySelectorAll<HTMLElement>('main h2'))
        .filter(heading => heading.textContent?.trim() && heading.offsetParent !== null)
        .slice(0, 14);
      const next = headings.map((heading, index) => {
        if (!heading.id) heading.id = `page-section-${index + 1}`;
        return { id: heading.id, label: heading.textContent!.trim().replace(/\s+/g, ' ') };
      });
      setSections(next.length >= 3 ? next : []);
    };

    const schedule = () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(collect, 120);
    };
    schedule();
    const main = document.querySelector('main');
    const observer = new MutationObserver(schedule);
    if (main) observer.observe(main, { childList: true, characterData: true, subtree: true });
    return () => {
      observer.disconnect();
      window.clearTimeout(timerRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);

  return (
    <>
      {open && sections.length > 0 && (
        <nav id="page-section-menu" aria-label="Sections on this page" className="fixed bottom-[4.5rem] left-4 z-40 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-navy/15 bg-white shadow-[0_24px_60px_-24px_rgba(15,31,61,0.55)] sm:bottom-[5.25rem] sm:left-6">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-navy/60">On this page</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-navy/50 hover:bg-navy/5 hover:text-navy" aria-label="Close section menu"><X size={15} /></button>
          </div>
          <div className="max-h-[min(55dvh,28rem)] overflow-y-auto p-2">
            {sections.map((section, index) => (
              <button
                type="button"
                key={section.id}
                onClick={() => {
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setOpen(false);
                }}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm leading-5 text-navy/75 hover:bg-navy/5 hover:text-navy"
              >
                <span className="mt-0.5 w-5 shrink-0 text-[10px] font-bold tabular-nums text-navy/35">{String(index + 1).padStart(2, '0')}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 sm:bottom-6 sm:left-6">
        {sections.length > 0 && visible && (
          <button
            type="button"
            onClick={() => setOpen(value => !value)}
            aria-expanded={open}
            aria-controls="page-section-menu"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-navy/15 bg-white px-3.5 text-xs font-bold uppercase tracking-[0.1em] text-navy shadow-[0_12px_35px_-16px_rgba(15,31,61,0.55)] hover:border-navy/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            <List size={16} aria-hidden="true" />
            <span className="hidden min-[390px]:inline">Sections</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Return to the main menu and top of page"
          className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-navy/15 bg-white px-3.5 text-xs font-bold uppercase tracking-[0.1em] text-navy shadow-[0_12px_35px_-16px_rgba(15,31,61,0.55)] transition-all duration-200 hover:border-navy/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
        >
          <ArrowUp size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Menu & top</span>
        </button>
      </div>
    </>
  );
}
