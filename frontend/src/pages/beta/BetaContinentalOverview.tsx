import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, ExternalLink, Globe2, Landmark, Scale, TrendingUp } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { IntelligenceTrustPanel } from '../../components/intelligence/IntelligenceTrustPanel';
import { DataReadingGuide } from '../../components/PageReadingGuide';

const compact = (value: number, digits = 1) => new Intl.NumberFormat('en', {
  notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard', maximumFractionDigits: digits,
}).format(value);

const formatValue = (value: number, unit: string) => {
  if (unit === 'current US$') return `$${compact(value)}`;
  if (unit === 'current US$ per person') return `$${compact(value)}`;
  if (unit === 'people') return compact(value);
  return `${compact(value)}${unit === '%' ? '%' : ` ${unit}`}`;
};

const period = (start: number, end: number) => start === end ? String(end) : `${start}–${end}`;

export const BetaContinentalOverview: React.FC = () => {
  const { view: requestedView = 'overview' } = useParams<{ view?: string }>();
  const view = ['overview', 'regions', 'sectors'].includes(requestedView) ? requestedView : 'overview';
  const query = useQuery({
    queryKey: ['continental-economic-overview', 'economy-v1'],
    queryFn: api.getContinentalOverview,
    staleTime: 12 * 60 * 60 * 1000,
  });

  if (query.isLoading) return <div className="mx-auto max-w-6xl animate-pulse px-5 py-16 sm:px-6"><div className="h-16 w-2/3 rounded-xl bg-navy/10"/><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-40 rounded-2xl bg-navy/5"/>)}</div><div className="mt-10 h-96 rounded-2xl bg-navy/5"/></div>;

  if (query.isError || !query.data) return <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-5 sm:px-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-navy/60">Official dataset request failed</p><h1 className="mt-3 font-serif text-4xl text-navy">The continental economic record could not be loaded.</h1><p className="mt-4 leading-7 text-muted-foreground">Retry the official-data dashboard or continue to individual country dossiers.</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={() => query.refetch()} className="rounded-md bg-navy px-5 py-3 text-sm font-semibold text-white">Retry dashboard</button><Link to="/countries" className="rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-navy">Country dossiers</Link></div></div>;

  const data = query.data;
  const indicators = Object.fromEntries(data.indicators.map(item => [item.indicator_code, item]));
  const headlineCodes = ['NY.GDP.MKTP.CD', 'SP.POP.TOTL', 'NY.GDP.MKTP.KD.ZG', 'BX.KLT.DINV.CD.WD'];
  const headlineIcons = [Landmark, Globe2, TrendingUp, Activity];

  return <div className="min-h-screen bg-background pb-24 text-foreground">
    <SEO title="Continental Economic Overview | BOA-Story" description="Official continental and regional economic, trade, investment and sector-performance indicators across Africa’s 54 markets."/>

    <header className="border-b border-white/10 bg-navy px-5 py-14 text-white sm:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <p className="text-[11px] font-bold uppercase tracking-[.22em] text-white/60">Continental economic overview</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[.95] tracking-tight md:text-7xl">Africa’s economy, explained with official data.</h1>
          <p className="mt-7 max-w-3xl text-base leading-7 text-white/70 md:text-lg">See the continent’s economic size, population, growth, inflation, investment and trade—then check the countries, years and limitations behind every figure.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/intelligence/sectors" className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-navy">Sector intelligence</Link><Link to="/countries" className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white">Country dossiers</Link></div>
        </motion.div>
      </div>
    </header>

    <IntelligenceTrustPanel updatedAt={data.retrieved_at} sourceLabel={data.source_name}/>

    <div className="page-container dashboard-shell mt-10 md:mt-14">
      <aside className="dashboard-rail" aria-label="Continental dashboard sections"><nav>{[['overview','Continental record'],['regions','Regional comparison'],['sectors','Sector performance']].map(([slug,label]) => <Link key={slug} to={`/dashboards/${slug}`} aria-current={view === slug ? 'page' : undefined}>{label}</Link>)}</nav></aside>

      <main className="page-stack min-w-0">
        <DataReadingGuide subject="the continental overview" />
        {view === 'overview' && <>
          <section className="page-section">
            <div className="max-w-3xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-navy/60">Official continental record</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">How large is the economy, and which way is it moving?</h2><p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">A total adds reported country values together. A median shows the middle country and gives every country equal weight. The cards state which method is used.</p></div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {headlineCodes.map((code,index) => { const item=indicators[code]; const Icon=headlineIcons[index]; return <article key={code} className="rounded-2xl border border-border bg-white p-5 md:p-6"><Icon size={18} className="text-navy/65"/><p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{item.label}</p><p className="mt-2 break-words font-serif text-3xl text-navy">{formatValue(item.value,item.unit)}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">{item.aggregation} · {item.countries_reported} countries · {period(item.period_start,item.period_end)}</p><p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-navy/75"><strong>In plain language:</strong> {item.interpretation}</p></article>; })}
            </div>
          </section>

          <section className="page-section">
            <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Trade, prices and investment</p><h2 className="mt-2 font-serif text-3xl text-navy">The other numbers needed for context</h2></div><span className="text-xs text-muted-foreground">{data.indicators.length} official measures in total</span></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {data.indicators.filter(item => !headlineCodes.includes(item.indicator_code)).map(item => <article key={item.indicator_code} className="rounded-xl border border-border bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{item.indicator_code}</p><h3 className="mt-1 font-serif text-2xl text-navy">{item.label}</h3></div><span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-navy/60">{item.aggregation}</span></div>
                <p className="mt-5 font-serif text-3xl text-navy">{formatValue(item.value,item.unit)}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.countries_reported} countries · observations {period(item.period_start,item.period_end)}</p>
                <p className="mt-5 text-sm leading-6 text-navy/80">{item.interpretation}</p><p className="mt-4 border-l-2 border-navy/20 pl-3 text-xs leading-5 text-muted-foreground"><strong className="text-navy">Limit:</strong> {item.caveat}</p>
                <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-navy underline decoration-navy/25 underline-offset-4">Official series <ExternalLink size={12}/></a>
              </article>)}
            </div>
          </section>

          <section className="page-section">
            <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Country comparison</p><h2 className="mt-2 font-serif text-3xl text-navy">Which countries record the largest values?</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">Each list ranks only the named measure. A country’s position does not mean it is the “best” market, safest investment or strongest overall economy.</p></div>
            <div className="mt-7 grid gap-5 lg:grid-cols-3">
              {[
                ['Largest economies', data.rankings.largest_economies, 'current US$'],
                ['Fastest real growth', data.rankings.fastest_growth, '%'],
                ['Largest net FDI inflows', data.rankings.largest_fdi_inflows, 'current US$'],
              ].map(([title, rows, unit]) => <article key={title as string} className="rounded-2xl border border-border bg-white p-5 md:p-6"><h3 className="font-serif text-2xl text-navy">{title as string}</h3><ol className="mt-5 space-y-3">{(rows as typeof data.rankings.largest_economies).map((row,index) => <li key={row.country_code} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 text-sm"><span className="text-muted-foreground">{index+1}.</span><div><Link to={`/countries/${row.country_code}`} className="font-semibold text-navy hover:underline">{row.country_name}</Link><p className="text-[10px] text-muted-foreground">{row.region} · {row.year}</p></div><span className="text-right tabular-nums text-navy">{formatValue(row.value,unit as string)}</span></li>)}</ol></article>)}
            </div>
          </section>
        </>}

        {view === 'regions' && <section className="page-section">
          <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Five-region comparison</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">How Africa’s regions differ</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">GDP, population and foreign investment are added across countries. Growth, inflation and investment use the middle country reading. Each card shows how many countries supplied the data.</p></div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {data.regions.map(region => <article key={region.region} className="rounded-2xl border border-border bg-white p-5 md:p-7">
              <div className="flex items-end justify-between gap-4 border-b border-border pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-navy/60">{region.country_count} countries</p><h3 className="mt-1 font-serif text-3xl text-navy">{region.region} Africa</h3></div><Link to={`/countries?region=${region.region}`} className="text-xs font-semibold text-navy">Open countries <ArrowRight size={12} className="inline"/></Link></div>
              <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
                {[
                  ['Recorded GDP', region.gdp, 'current US$'], ['Population', region.population, 'people'], ['Median real growth', region.growth, '%'],
                  ['Median inflation', region.inflation, '%'], ['Recorded net FDI', region.fdi, 'current US$'], ['Median fixed investment', region.investment, '% of GDP'],
                ].map(([label,reading,unit]) => { const metric=reading as typeof region.gdp; return <div key={label as string} className="min-w-0 bg-white p-4"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-muted-foreground">{label as string}</p><p className="mt-2 break-words font-serif text-xl text-navy">{formatValue(metric.value,unit as string)}</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">{metric.countries_reported} countries · {period(metric.period_start,metric.period_end)}</p></div>; })}
              </div>
            </article>)}
          </div>
        </section>}

        {view === 'sectors' && <section className="page-section">
          <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Official sector series</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">Sector performance across Africa</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Eight sector dossiers combine a primary performance proxy with three structural or operating dimensions. Incompatible units remain separate.</p></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {data.sector_performance.map(sector => <article key={sector.sector_id} className="rounded-2xl border border-border bg-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{sector.indicator_code}</p><h3 className="mt-1 font-serif text-2xl text-navy">{sector.sector_name}</h3></div><span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-navy">{sector.direction}</span></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.2fr]"><div><p className="text-[10px] uppercase tracking-[.1em] text-muted-foreground">{sector.headline_label}</p><p className="mt-2 font-serif text-3xl text-navy">{formatValue(sector.headline_value,sector.headline_unit)}</p><p className="mt-2 text-xs text-muted-foreground">{sector.countries_reported} countries · {period(sector.period_start,sector.period_end)}</p></div><div className="grid gap-2">{sector.dimensions.map(item => <div key={item.indicator_code} className="flex items-center justify-between gap-3 rounded-lg bg-navy/[.035] px-3 py-2"><div><p className="text-xs font-semibold text-navy">{item.label}</p><p className="text-[9px] text-muted-foreground">{item.coverage_pct.toFixed(0)}% coverage · {period(item.period_start,item.period_end)}</p></div><span className="text-right text-sm font-semibold text-navy">{formatValue(item.value,item.unit)}</span></div>)}</div></div>
              <Link to={`/sectors/${sector.sector_id}/trends`} className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-navy">Open full performance dossier <ArrowRight size={14}/></Link>
            </article>)}
          </div>
        </section>}

        <section className="page-section rounded-2xl border border-border bg-navy p-6 text-white md:p-8"><div className="flex items-start gap-4"><Scale className="mt-1 shrink-0" size={20}/><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/60">Method and comparability</p><p className="mt-3 text-sm leading-7 text-white/75">{view === 'sectors' ? data.sector_methodology : data.methodology}</p><a href={data.source_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white underline underline-offset-4">Inspect {data.source_name} <ExternalLink size={12}/></a></div></div></section>
      </main>
    </div>
  </div>;
};
