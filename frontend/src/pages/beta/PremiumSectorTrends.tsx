import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, FileSearch, Globe2, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';

const number = (value: number) => new Intl.NumberFormat('en').format(value);

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
    { label: 'Markets improving', value: `${performance.improving_markets_pct.toFixed(0)}%`, detail: 'of countries with comparable observations', Icon: TrendingUp },
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
            <div><h3 className="text-sm font-bold text-navy">Highest readings</h3><ol className="mt-3 space-y-2 text-sm">{performance.leaders.map(market => <li key={market.country_code} className="flex justify-between gap-3"><Link to={`/countries/${market.country_code}`} className="text-navy hover:underline">{market.country_name}</Link><span className="tabular-nums text-muted-foreground">{market.value.toFixed(1)}</span></li>)}</ol></div>
            <div><h3 className="text-sm font-bold text-navy">Lowest readings</h3><ol className="mt-3 space-y-2 text-sm">{performance.laggards.map(market => <li key={market.country_code} className="flex justify-between gap-3"><Link to={`/countries/${market.country_code}`} className="text-navy hover:underline">{market.country_name}</Link><span className="tabular-nums text-muted-foreground">{market.value.toFixed(1)}</span></li>)}</ol></div>
          </div>
        </article>
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
