import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, BarChart3, ExternalLink, Globe2, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { IntelligenceTrustPanel } from '../../components/intelligence/IntelligenceTrustPanel';
import { DataReadingGuide } from '../../components/PageReadingGuide';

const compact = (value: number) => new Intl.NumberFormat('en', { notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
const valueWithUnit = (value: number, unit: string) => unit === 'current US$' ? `$${compact(value)}` : `${compact(value)} ${unit}`;
const changeWithUnit = (value: number, unit: string) => {
  const sign = value > 0 ? '+' : '';
  if (unit === 'percentage points') return `${sign}${value.toFixed(1)} pp`;
  if (unit === 'current US$') return `${sign}$${compact(value)}`;
  return `${sign}${compact(value)} ${unit}`;
};
const period = (start: number, end: number) => start === end ? String(end) : `${start}–${end}`;

export const BetaIntelligence = () => {
  const { view: requestedView = 'overview' } = useParams<{ view?: string }>();
  const view = ['overview', 'sectors', 'methodology'].includes(requestedView) ? requestedView : 'overview';
  const query = useQuery({
    queryKey: ['sector-market-performance', 'market-v2'],
    queryFn: () => api.getSectorPerformance('investor'),
    staleTime: 12 * 60 * 60 * 1000,
  });

  const performance = query.data;
  const signalCount = performance?.data.reduce((total, sector) => total + 1 + sector.dimensions.length, 0) || 0;
  const coverageValues = performance?.data.flatMap(sector => [sector.continent_coverage_pct, ...sector.dimensions.map(item => item.coverage_pct)]) || [];
  const averageCoverage = coverageValues.length ? coverageValues.reduce((sum, value) => sum + value, 0) / coverageValues.length : 0;

  return <div className="min-h-screen bg-background pb-24 text-foreground">
    <SEO title="African Market Intelligence | BOA-Story" description="Official multi-indicator African sector performance, country breadth, structural conditions and decision diligence."/>

    <header className="border-b border-white/10 bg-navy px-5 py-14 text-white sm:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <p className="text-[11px] font-bold uppercase tracking-[.22em] text-white/60">African market intelligence</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[.95] tracking-tight md:text-7xl">Understand how African sectors are performing.</h1>
          <p className="mt-7 max-w-3xl text-base leading-7 text-white/70 md:text-lg">Official measures of output, access, infrastructure, investment and operating conditions across African economies. Every result explains what it measures, which countries and years it covers, and what it cannot prove.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/dashboards" className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-navy">Continental economy</Link><Link to="/countries" className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white">Country dossiers</Link></div>
        </motion.div>
      </div>
    </header>

    <IntelligenceTrustPanel updatedAt={performance?.retrieved_at} sourceLabel={performance?.source_name || 'World Bank World Development Indicators'}/>

    <div className="page-container dashboard-shell mt-10 md:mt-14">
      <aside className="dashboard-rail" aria-label="Market intelligence sections"><nav>{[['overview','Performance matrix'],['sectors','Sector dossiers'],['methodology','Methodology']].map(([slug,label]) => <Link key={slug} to={`/intelligence/${slug}`} aria-current={view === slug ? 'page' : undefined}>{label}</Link>)}</nav></aside>
      <main className="page-stack min-w-0">
        <DataReadingGuide subject="the market-intelligence dashboard" />
        {query.isLoading && <section className="grid animate-pulse gap-4 sm:grid-cols-2"><div className="h-44 rounded-2xl bg-navy/5"/><div className="h-44 rounded-2xl bg-navy/5"/><div className="h-96 rounded-2xl bg-navy/5 sm:col-span-2"/></section>}
        {query.isError && <section className="rounded-2xl border border-border bg-white p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-navy/60">Official dataset request failed</p><h2 className="mt-2 font-serif text-3xl text-navy">The sector-performance record could not be loaded.</h2><button onClick={() => query.refetch()} className="mt-6 rounded-md bg-navy px-5 py-3 text-sm font-semibold text-white">Retry official data</button></section>}

        {performance && view === 'overview' && <>
          <section className="page-section">
            <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Cross-sector comparison</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">Compare sectors without hiding what the numbers mean</h2><p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">Each sector uses the measure that fits it. Read the measure’s name and unit before comparing movement or country coverage. BOA does not blend unrelated measures into one score.</p></div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [BarChart3,'Sectors measured',performance.sectors_measured,'sector dossiers'],
                [Activity,'Official signals',signalCount,'primary and supporting series'],
                [Globe2,'Countries in scope',performance.countries_in_scope,'African markets'],
                [Scale,'Average data coverage',`${averageCoverage.toFixed(0)}%`,'average share of 54 countries represented'],
              ].map(([Icon,label,value,detail]) => { const MetricIcon=Icon as typeof Activity; return <article key={label as string} className="rounded-2xl border border-border bg-white p-5 md:p-6"><MetricIcon size={18} className="text-navy/65"/><p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{label as string}</p><p className="mt-2 font-serif text-3xl text-navy">{value as string | number}</p><p className="mt-2 text-xs text-muted-foreground">{detail as string}</p></article>; })}
            </div>
          </section>

          <section className="page-section rounded-2xl border border-border bg-white p-5 md:p-8" aria-labelledby="market-analysis-path">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.08em] text-navy/60">From indicator to informed judgment</p>
              <h2 id="market-analysis-path" className="mt-2 font-serif text-3xl text-navy md:text-4xl">A fuller way to understand sector performance</h2>
              <p className="mt-4 readable-copy">Performance is not one number. A useful reading connects the sector’s recorded level, its direction of change, how widely that direction appears across countries, and the conditions that may support or constrain it.</p>
            </div>
            <ol className="mt-7 grid gap-4 md:grid-cols-2">
              {[
                ['Establish the level', 'Read the latest median and its unit. This describes the middle reporting country, not the continent’s combined market size and not every country.'],
                ['Test the direction', 'Compare the median change with the share of countries moving higher. A positive median with narrow country breadth may reflect a concentrated rather than widespread shift.'],
                ['Examine operating conditions', 'Read access, infrastructure, cost, capacity and investment measures alongside the headline. They can explain important constraints without proving causation.'],
                ['Check decision relevance', 'Move from the continental pattern to country dossiers, local regulation, competition, demand, currency exposure and implementation conditions before making a market decision.'],
              ].map(([title,body],index) => <li key={title} className="grid grid-cols-[2.25rem_1fr] gap-3 rounded-xl bg-navy/[.035] p-4 md:p-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{index+1}</span><div><h3 className="text-base font-bold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div></li>)}
            </ol>
          </section>

          <section className="page-section overflow-hidden rounded-2xl border border-border bg-white">
            <div className="border-b border-border px-5 py-6 md:px-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Eight-sector comparison</p><h2 className="mt-2 font-serif text-3xl text-navy">What the latest available country data shows</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">The large value is the middle country reading. “Higher” only describes direction; whether it is favourable depends on what the indicator measures.</p></div>
            <div className="divide-y divide-border">
              {performance.data.map(sector => <article key={sector.sector_id} className="grid gap-5 px-5 py-6 md:px-8 lg:grid-cols-[1.2fr_.8fr_1fr_auto] lg:items-center">
                <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">{sector.indicator_code}</p><h3 className="mt-1 font-serif text-2xl text-navy">{sector.sector_name}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{sector.indicator_name} · {period(sector.period_start,sector.period_end)}</p></div>
                <div><p className="text-[9px] uppercase tracking-[.1em] text-muted-foreground">Middle country reading · {sector.headline_label}</p><p className="mt-1 font-serif text-2xl text-navy">{valueWithUnit(sector.headline_value,sector.headline_unit)}</p><p className="mt-1 text-xs text-muted-foreground">{changeWithUnit(sector.comparison_value,sector.comparison_unit)} versus the previous available reading</p></div>
                <div className="grid grid-cols-2 gap-3"><div><strong className="block text-lg text-navy">{sector.improving_markets_pct.toFixed(0)}%</strong><span className="text-[9px] uppercase tracking-[.08em] text-muted-foreground">countries reading higher</span></div><div><strong className="block text-lg text-navy">{sector.continent_coverage_pct.toFixed(0)}%</strong><span className="text-[9px] uppercase tracking-[.08em] text-muted-foreground">of 54 countries covered</span></div></div>
                <Link to={`/sectors/${sector.sector_id}/trends`} className="inline-flex items-center gap-2 text-xs font-semibold text-navy">Full dossier <ArrowRight size={14}/></Link>
              </article>)}
            </div>
          </section>
        </>}

        {performance && view === 'sectors' && <section className="page-section">
          <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Detailed sector guides</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">Understand each sector one measure at a time</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Start with the main measure, then use the three supporting measures to see structure and operating conditions. The questions at the end show what still requires investigation.</p></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {performance.data.map(sector => <article key={sector.sector_id} className="flex flex-col rounded-2xl border border-border bg-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-border pb-4"><div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">{sector.indicator_code}</p><h3 className="mt-1 font-serif text-2xl text-navy">{sector.sector_name}</h3></div><span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-navy">{sector.direction}</span></div>
              <div className="py-5"><p className="text-[10px] uppercase tracking-[.1em] text-muted-foreground">{sector.headline_label}</p><p className="mt-2 font-serif text-4xl text-navy">{valueWithUnit(sector.headline_value,sector.headline_unit)}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Middle reading across {sector.countries_reported} countries · {period(sector.period_start,sector.period_end)} · half of the countries fall between {sector.dispersion_low.toFixed(1)} and {sector.dispersion_high.toFixed(1)}</p><p className="mt-4 text-sm leading-6 text-navy/80"><strong>What this measures:</strong> {sector.scope}</p></div>
              <div className="grid gap-2">{sector.dimensions.map(item => <div key={item.indicator_code} className="rounded-lg border border-border bg-navy/[.025] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-navy">{item.label}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{item.indicator_code} · {period(item.period_start,item.period_end)}</p></div><span className="text-right text-sm font-semibold text-navy">{valueWithUnit(item.value,item.unit)}</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-muted-foreground"><span>{changeWithUnit(item.comparison_value,item.comparison_unit)} median change</span><span>{item.markets_rising_pct.toFixed(0)}% rising</span><span>{item.coverage_pct.toFixed(0)}% coverage</span></div></div>)}</div>
              <div className="mt-5 border-t border-border pt-4"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-navy/60">Questions to check next</p><ol className="mt-3 space-y-2">{sector.diligence_questions.slice(0,2).map((question,index) => <li key={question} className="grid grid-cols-[1.25rem_1fr] gap-2 text-xs leading-5 text-muted-foreground"><span>{index+1}.</span><span>{question}</span></li>)}</ol></div>
              <Link to={`/sectors/${sector.sector_id}/trends`} className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-navy">Open complete performance dossier <ArrowRight size={14}/></Link>
            </article>)}
          </div>
        </section>}

        {performance && view === 'methodology' && <section className="page-section">
          <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Evidence discipline</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">How to read the market record</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">The dashboard is designed to preserve differences between growth, scale, access, concentration, cost and capacity rather than collapsing them into an unsupported score.</p></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              ['Primary performance','Each sector has one named output, spending, credit, adoption or external-demand proxy. Its scope and limitation are visible beside the value.'],
              ['Supporting dimensions','Three additional indicators test market structure or operating conditions. Their own units, years and country coverage remain intact.'],
              ['Country comparison','Headline values are country medians. Country leaders, laggards, middle-half dispersion and breadth show how much continental summaries conceal.'],
              ['No automatic verdict','Higher is not always better: rising lending rates, grid losses or concentration can be adverse or contextual. No field is converted into a return forecast or investment recommendation.'],
            ].map(([title,body],index) => <article key={title} className="rounded-2xl border border-border bg-white p-6"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{index+1}</span><h3 className="mt-5 font-serif text-2xl text-navy">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p></article>)}
          </div>
          <div className="mt-6 rounded-2xl bg-navy p-6 text-white md:p-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/60">Published methodology</p><p className="mt-4 text-sm leading-7 text-white/75">{performance.methodology}</p><a href={performance.source_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-white underline underline-offset-4">Inspect {performance.source_name} <ExternalLink size={12}/></a></div>
        </section>}
      </main>
    </div>
  </div>;
};
