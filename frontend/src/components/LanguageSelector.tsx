import { GlobeIcon } from '@radix-ui/react-icons';

// Interface languages are deliberately separate from translated article
// content. Until another locale has complete, reviewed route coverage, the
// chrome must not advertise a language switch that only translates fragments.
export function LanguageSelector() {
  return (
    <div title="Application interface currently available in English" className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-muted-foreground">
      <GlobeIcon className="h-3.5 w-3.5" />
      <span className="font-bold text-[10px] uppercase tracking-widest">EN</span>
      <span className="sr-only">English interface. Additional interface languages are not yet available.</span>
    </div>
  );
}
