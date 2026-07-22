import { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

type Guide = {
  label: string;
  title: string;
  introduction: string;
  steps: string[];
};

const guideForPath = (pathname: string): Guide => {
  if (pathname.startsWith('/intelligence') || pathname.startsWith('/dashboards') || pathname.startsWith('/sectors/')) {
    return {
      label: 'Market-data guide',
      title: 'New to market data? Use this simple reading order.',
      introduction: 'You do not need an economics or investment background. Read what is measured first, then the value, then the countries and years behind it, and finally the stated limit.',
      steps: [
        'Start with the indicator name. It tells you exactly what the number measures.',
        'Keep the unit attached to the value. Dollars, percentages and people cannot be compared as if they mean the same thing.',
        'Check country coverage and the observation years before drawing a continental conclusion.',
        'Treat the result as evidence for a question, not an automatic verdict or recommendation.',
      ],
    };
  }
  if (pathname.startsWith('/countries/')) {
    return {
      label: 'Country-page guide',
      title: 'How to read a country dossier.',
      introduction: 'Begin with the dated country facts, then use the deeper sections to understand what changed, why it matters and which evidence still needs checking.',
      steps: ['Confirm the country and date range.', 'Read the plain-language summary before detailed evidence.', 'Open source links for important decisions.', 'Compare unlike measures only within their own units.'],
    };
  }
  if (pathname.startsWith('/posts/') || pathname.startsWith('/feed') || pathname.startsWith('/posts')) {
    return {
      label: 'Reading guide',
      title: 'How to assess a story or briefing.',
      introduction: 'Separate what happened from interpretation. Dates, named actors and linked sources should support the central claims.',
      steps: ['Read the headline and publication date.', 'Use the summary for the central point.', 'Check named sources and links.', 'Use related context to understand what the story does not establish.'],
    };
  }
  return {
    label: 'Page guide',
    title: 'Need help using this page?',
    introduction: 'This guide explains the quickest way through the current page without assuming prior knowledge of BOA-Story.',
    steps: ['Read the page introduction for its purpose.', 'Use the section menu on long pages.', 'Open supporting details only when you need them.', 'Use the main navigation to move between stories, countries and intelligence.'],
  };
};

export function PageReadingGuide() {
  const { pathname } = useLocation();
  const guide = useMemo(() => guideForPath(pathname), [pathname]);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  return <section className="border-b border-border bg-white" aria-label="Plain-language page guide">
    <div className="mx-auto max-w-[1400px] px-5 sm:px-6 lg:px-8">
      <button type="button" onClick={() => setOpenPath(open ? null : pathname)} aria-expanded={open} aria-controls="plain-language-page-guide" className="flex min-h-11 w-full items-center justify-between gap-4 py-2 text-left text-xs text-navy">
        <span className="flex min-w-0 items-center gap-2"><BookOpen size={15} className="shrink-0"/><span><strong>{guide.label}:</strong> {guide.title}</span></span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true"/>
      </button>
      {open && <div id="plain-language-page-guide" className="border-t border-border py-5">
        <div className="flex items-start justify-between gap-4"><p className="max-w-3xl text-sm leading-6 text-muted-foreground">{guide.introduction}</p><button type="button" onClick={() => setOpenPath(null)} className="rounded-full p-1.5 text-navy/50 hover:bg-navy/5" aria-label="Close page guide"><X size={15}/></button></div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{guide.steps.map((step,index) => <li key={step} className="grid grid-cols-[1.75rem_1fr] gap-2 rounded-lg bg-navy/[.035] p-3 text-xs leading-5 text-navy/80"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">{index+1}</span><span>{step}</span></li>)}</ol>
      </div>}
    </div>
  </section>;
}

export function DataReadingGuide({ subject = 'this dashboard' }: { subject?: string }) {
  return <section className="page-section overflow-hidden rounded-2xl border border-navy/15 bg-white" aria-labelledby="data-reading-guide-title">
    <div className="border-b border-border bg-navy/[.035] px-5 py-5 md:px-7">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Start here · no specialist background required</p>
      <h2 id="data-reading-guide-title" className="mt-2 font-serif text-2xl text-navy md:text-3xl">How to read {subject}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Use the four checks below before interpreting any number. They keep a large-looking value, a positive change or a high ranking from being mistaken for a complete conclusion.</p>
    </div>
    <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
      {[
        ['1', 'What is measured?', 'Read the full indicator name. It defines the subject of the number.'],
        ['2', 'What does the value mean?', 'Keep its unit attached. A percentage, dollar total and number of people answer different questions.'],
        ['3', 'How broad and recent is it?', 'Check how many countries reported and which years their observations cover.'],
        ['4', 'What can it not prove?', 'Read the limit before using the result. One indicator cannot establish opportunity, risk or likely return by itself.'],
      ].map(([number,title,body]) => <article key={number} className="bg-white p-5 md:p-6"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{number}</span><h3 className="mt-4 text-sm font-bold text-navy">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p></article>)}
    </div>
    <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-7">
      {[
        ['Median', 'The middle country after values are ordered. It is not the total or average.'],
        ['Coverage', 'The share of Africa’s 54 countries with usable observations for that indicator.'],
        ['Prior observation', 'The previous available value for each country; it may not be exactly one year earlier.'],
        ['Percentage point (pp)', 'The direct difference between two percentages: 10% to 12% is +2 pp.'],
      ].map(([term,meaning]) => <div key={term} className="text-xs leading-5"><strong className="block text-navy">{term}</strong><span className="text-muted-foreground">{meaning}</span></div>)}
    </div>
  </section>;
}
