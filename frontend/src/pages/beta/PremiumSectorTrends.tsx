import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, FileSearch, Globe2, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';

const number = (value: number) => new Intl.NumberFormat('en').format(value);
const compactNumber = (value: number) => new Intl.NumberFormat('en', { notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
const metricValue = (value: number, unit: string) => unit === 'current US$' ? `$${compactNumber(value)}` : `${compactNumber(value)} ${unit}`;
const metricChange = (value: number, unit: string) => {
  const sign = value > 0 ? '+' : '';
  if (unit === 'percentage points') return `${sign}${value.toFixed(1)} pp`;
  if (unit === 'current US$') return `${sign}$${compactNumber(value)}`;
  return `${sign}${compactNumber(value)} ${unit}`;
};

export const PremiumSectorTrends: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['sector-trends', id],
    queryFn: () => api.getSectorTrends(id!),
    enabled: Boolean(id),
  });

  if (query.isLoading) return <div className="mx-auto max-w-6xl animate-pulse px-6 py-16"><div className="h-14 w-2/3 rounded-xl bg-navy/10"/><div className="mt-12 grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-navy/5"/>)}</div><div className="mt-8 h-96 rounded-2xl bg-navy/5"/></div>;

  if (query.isError || !query.data) return <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-navy/60">Request failed</p><h1 className="mt-3 font-serif text-4xl text-navy">The sector profile could not be loaded.</h1><p className="mt-4 leading-7 text-muted-foreground">Return to Market Intelligence and retry the official performance profile.</p><Link to="/intelligence/sectors" className="mt-8 inline-flex items-center gap-2 font-semibold text-navy"><ArrowLeft size={16}/> Market Intelligence</Link></div>;

  const { sector, market_performance: performance, weekly_coverage, country_coverage, summary, methodology, reporting_methodology, updated_at } = query.data;
  const period = performance.period_start === performance.period_end ? String(performance.period_end) : `${performance.period_start}–${performance.period_end}`;
  const kpis = [
    { label: performance.headline_label, value: `${performance.headline_value > 0 && performance.headline_unit === '%' ? '+' : ''}${performance.headline_value.toFixed(1)} ${performance.headline_unit}`, detail: `cross-country median · ${period}`, Icon: TrendingUp },
    { label: 'Change in performance', value: `${performance.comparison_value > 0 ? '+' : ''}${performance.comparison_value.toFixed(1)} pp`, detail: 'median versus each prior observation', Icon: FileSearch },
    { label: 'Markets moving higher', value: `${performance.improving_markets_pct.toFixed(0)}%`, detail: 'share with a positive period-to-period movement', Icon: TrendingUp },
    { label: 'Official country series', value: number(performance.countries_reported), detail: `${performance.continent_coverage_pct.toFixed(0)}% of 54 African markets`, Icon: Globe2 },
  ];

  return <div className="min-h-screen bg-background pb-24 text-foreground">
    <SEO title={`${sector.name} market performance | BOA-Story`} description={`Official market-performance indicators, country breadth and sourced context for ${sector.name} across Africa.`}/>
    <header className="border-b border-white/10 bg-navy px-4 py-16 text-white sm:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <Link to="/intelligence/sectors" className="inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white"><ArrowLeft size={15}/> Market Intelligence</Link>
        <p className="mt-12 text-[11px] font-bold uppercase tracking-[.22em] text-white/60">Official sector performance</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[.95] tracking-tight md:text-7xl">{sector.name}</h1>
        <p className="mt-7 max-w-3xl text-base leading-7 text-white/70 md:text-lg">{performance.scope} The performance series is kept separate from BOA newsroom activity.</p>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="relative -mt-8 grid overflow-hidden rounded-2xl border border-border bg-white shadow-[0_18px_60px_-30px_rgba(15,31,61,.35)] sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({label,value,detail,Icon}, index) => <motion.div key={label} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:index*.07}} className="border-b border-border p-6 last:border-0 sm:border-r lg:border-b-0">
          <Icon size={18} className="text-navy/70"/><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{label}</p><p className="mt-2 break-words font-serif text-3xl text-navy md:text-4xl">{value}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </motion.div>)}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-2xl border border-border bg-white p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">What the indicator measures</p>
          <h2 className="mt-2 font-serif text-3xl text-navy">{performance.indicator_name}</h2>
          <p className="mt-5 text-sm leading-7 text-navy/80">{performance.scope}</p>
          <div className="mt-5 rounded-lg bg-navy/[0.04] p-4 text-sm leading-6 text-muted-foreground"><strong className="text-navy">Interpretation limit.</strong> {performance.caveat}</div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
            <span>Middle 50%: {performance.dispersion_low.toFixed(1)}–{performance.dispersion_high.toFixed(1)} {performance.headline_unit}</span>
            <a href={performance.source_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline decoration-navy/25 underline-offset-4">{performance.source_name}</a>
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-white p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">Country distribution</p>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div><h3 className="text-sm font-bold text-navy">Highest readings</h3><ol className="mt-3 space-y-2 text-sm">{performance.leaders.map((market, index) => <li key={market.country_code} className="grid grid-cols-[1.25rem_1fr_auto] gap-2"><span className="text-muted-foreground">{index + 1}.</span><Link to={`/countries/${market.country_code}`} className="text-navy hover:underline">{market.country_name}</Link><span className="tabular-nums text-muted-foreground">{market.value.toFixed(1)}</span></li>)}</ol></div>
            <div><h3 className="text-sm font-bold text-navy">Lowest readings</h3><ol className="mt-3 space-y-2 text-sm">{performance.laggards.map((market, index) => <li key={market.country_code} className="grid grid-cols-[1.25rem_1fr_auto] gap-2"><span className="text-muted-foreground">{index + 1}.</span><Link to={`/countries/${market.country_code}`} className="text-navy hover:underline">{market.country_name}</Link><span className="tabular-nums text-muted-foreground">{market.value.toFixed(1)}</span></li>)}</ol></div>
          </div>
        </article>
      </section>

      <section className="mt-14 border-t border-border pt-10">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">Multi-indicator sector anatomy</p>
        <h2 className="mt-2 max-w-3xl font-serif text-3xl text-navy md:text-4xl">Market structure and operating conditions</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">The headline series cannot explain a sector by itself. These supporting indicators test scale, access, capacity or operating conditions from separate official country records. Their units are intentionally not blended into a score.</p>
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {performance.dimensions.map(dimension => {
            const dimensionPeriod = dimension.period_start === dimension.period_end ? String(dimension.period_end) : `${dimension.period_start}–${dimension.period_end}`;
            return <article key={dimension.indicator_code} className="flex flex-col rounded-2xl border border-border bg-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-navy/60">{dimension.label}</p><h3 className="mt-2 text-base font-bold leading-6 text-navy">{dimension.indicator_name}</h3></div><span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-navy">{dimension.movement}</span></div>
              <p className="mt-6 font-serif text-4xl leading-none text-navy">{metricValue(dimension.value, dimension.unit)}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Cross-country median from {dimension.countries_reported} markets · {dimensionPeriod}</p>
              <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border text-center">
                <div className="bg-white p-3"><strong className="block text-sm text-navy">{metricChange(dimension.comparison_value, dimension.comparison_unit)}</strong><span className="mt-1 block text-[8px] uppercase tracking-[.08em] text-muted-foreground">median change</span></div>
                <div className="bg-white p-3"><strong className="block text-sm text-navy">{dimension.markets_rising_pct.toFixed(0)}%</strong><span className="mt-1 block text-[8px] uppercase tracking-[.08em] text-muted-foreground">markets rising</span></div>
                <div className="bg-white p-3"><strong className="block text-sm text-navy">{dimension.coverage_pct.toFixed(0)}%</strong><span className="mt-1 block text-[8px] uppercase tracking-[.08em] text-muted-foreground">coverage</span></div>
              </div>
              <p className="mt-5 text-sm leading-6 text-navy/80">{dimension.interpretation}</p>
              <p className="mt-4 border-l-2 border-navy/20 pl-3 text-xs leading-5 text-muted-foreground"><strong className="text-navy">Limit:</strong> {dimension.caveat}</p>
              <a href={dimension.source_url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-5 text-xs font-semibold text-navy underline decoration-navy/25 underline-offset-4">Official series {dimension.indicator_code}</a>
            </article>;
          })}
        </div>
      </section>

      <section className="mt-10 grid overflow-hidden rounded-2xl border border-border bg-white lg:grid-cols-2">
        <div className="p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">What the evidence establishes</p>
          <h2 className="mt-2 font-serif text-3xl text-navy">Current performance readout</h2>
          <ul className="mt-6 space-y-4 text-sm leading-6 text-navy/80">
            <li><strong className="text-navy">Central tendency:</strong> the latest comparable country median is {performance.headline_value.toFixed(1)} {performance.headline_unit}, with a median change of {performance.comparison_value > 0 ? '+' : ''}{performance.comparison_value.toFixed(1)} percentage points.</li>
            <li><strong className="text-navy">Country spread:</strong> the middle half of reporting markets sits between {performance.dispersion_low.toFixed(1)} and {performance.dispersion_high.toFixed(1)} {performance.headline_unit}; the continental headline therefore hides material divergence.</li>
            <li><strong className="text-navy">Breadth:</strong> {performance.improving_markets_pct.toFixed(0)}% of comparable markets moved higher, based on {performance.countries_reported} official country series covering {performance.continent_coverage_pct.toFixed(0)}% of Africa.</li>
            <li><strong className="text-navy">Comparability:</strong> supporting indicators retain their own units, dates and coverage. A higher reading is not automatically favourable, particularly for costs, losses or concentration measures.</li>
          </ul>
        </div>
        <div className="border-t border-border bg-navy/[0.025] p-6 md:p-8 lg:border-l lg:border-t-0">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">Required next diligence</p>
          <h2 className="mt-2 font-serif text-3xl text-navy">Questions the data cannot answer alone</h2>
          <ol className="mt-6 space-y-4">
            {performance.diligence_questions.map((question, index) => <li key={question} className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-6 text-navy/80"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{index + 1}</span><span>{question}</span></li>)}
          </ol>
        </div>
      </section>

      <div className="mt-14 border-t border-border pt-10"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">Reporting context</p><h2 className="mt-2 font-serif text-3xl text-navy">What the newsroom is tracking</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">These charts explain BOA’s evidence footprint. They do not calculate the market-performance figures above.</p></div>
      <section className="mt-12 grid gap-8 lg:grid-cols-[1.45fr_.85fr]">
        <article className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">Eight-week record</p><h2 className="mt-2 font-serif text-3xl text-navy">Reporting activity over time</h2></div><p className="max-w-xs text-right text-xs leading-5 text-muted-foreground">Story counts are editorial coverage—not market growth.</p></div>
          <div className="mt-8 h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly_coverage}><defs><linearGradient id="coverage" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0F1F3D" stopOpacity={.32}/><stop offset="1" stopColor="#0F1F3D" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(15,31,61,.08)"/><XAxis dataKey="week_start" tickFormatter={v => new Date(`${v}T00:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'})} axisLine={false} tickLine={false} tick={{fontSize:11}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize:11}}/><Tooltip labelFormatter={v => `Week of ${new Date(`${v}T00:00:00`).toLocaleDateString()}`}/><Area type="monotone" dataKey="stories" name="Published stories" stroke="#0F1F3D" strokeWidth={3} fill="url(#coverage)"/></AreaChart></ResponsiveContainer></div>
        </article>

        <article className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">Country breadth</p><h2 className="mt-2 font-serif text-3xl text-navy">Where the reporting sits</h2>
          <div className="mt-8 h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={country_coverage} layout="vertical" margin={{left:8}}><CartesianGrid horizontal={false} stroke="rgba(15,31,61,.08)"/><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={85} axisLine={false} tickLine={false} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="stories" name="Published stories" fill="#0F1F3D" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-white p-6 md:flex md:items-start md:justify-between md:gap-12 md:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">Evidence discipline</p><h2 className="mt-2 font-serif text-2xl text-navy">Method, comparability and reporting context</h2></div><div className="mt-4 max-w-2xl space-y-3 md:mt-0"><p className="text-sm leading-7 text-muted-foreground">{methodology}</p><p className="text-sm leading-7 text-muted-foreground">{reporting_methodology}</p><p className="flex items-center gap-2 text-xs text-muted-foreground"><Eye size={14}/> Official snapshot retrieved {new Date(updated_at).toLocaleString()}</p></div></section>
    </main>
  </div>;
};
