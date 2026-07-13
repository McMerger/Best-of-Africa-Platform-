import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Eye, FileSearch, Globe2, TrendingUp } from 'lucide-react';
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

  if (query.isError || !query.data) return <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-accent-ink">Request failed</p><h1 className="mt-3 font-serif text-4xl text-navy">The evidence profile could not be loaded.</h1><p className="mt-4 leading-7 text-muted-foreground">The rest of the intelligence desk remains accessible. Return to the sector index and retry this profile from there.</p><Link to="/intel" className="mt-8 inline-flex items-center gap-2 font-semibold text-navy"><ArrowLeft size={16}/> Market Intelligence</Link></div>;

  const { sector, weekly_coverage, country_coverage, summary, methodology, updated_at } = query.data;
  const change = summary.coverage_change;
  const kpis = [
    { label: 'Stories · 30 days', value: number(summary.stories_30d), detail: `${number(summary.previous_30d)} in the prior window`, Icon: BookOpen },
    { label: 'Coverage change', value: `${change > 0 ? '+' : ''}${number(change)}`, detail: 'stories versus prior 30 days', Icon: TrendingUp },
    { label: 'Countries evidenced', value: number(summary.countries_30d), detail: 'distinct country records', Icon: Globe2 },
    { label: 'Source records', value: number(summary.source_records_30d), detail: `${number(summary.views_30d)} tracked story views`, Icon: FileSearch },
  ];

  return <div className="min-h-screen bg-background pb-24 text-foreground">
    <SEO title={`${sector.name} evidence profile | BOA-Story`} description={`Observed BOA-Story reporting activity for ${sector.name} across Africa.`}/>
    <header className="border-b border-white/10 bg-navy px-4 py-16 text-white sm:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <Link to="/intel" className="inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white"><ArrowLeft size={15}/> Market Intelligence</Link>
        <p className="mt-12 text-[11px] font-bold uppercase tracking-[.22em] text-gold">Sector evidence profile</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[.95] tracking-tight md:text-7xl">{sector.name}</h1>
        <p className="mt-7 max-w-3xl text-base leading-7 text-white/70 md:text-lg">A transparent view of what BOA-Story has actually reported: publishing volume, geographic breadth, source-record breadth and how the evidence window is changing.</p>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="relative -mt-8 grid overflow-hidden rounded-2xl border border-border bg-white shadow-[0_18px_60px_-30px_rgba(15,31,61,.35)] sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({label,value,detail,Icon}, index) => <motion.div key={label} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:index*.07}} className="border-b border-border p-6 last:border-0 sm:border-r lg:border-b-0">
          <Icon size={18} className="text-accent-ink"/><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{label}</p><p className="mt-2 font-serif text-4xl text-navy">{value}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </motion.div>)}
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.45fr_.85fr]">
        <article className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent-ink">Eight-week record</p><h2 className="mt-2 font-serif text-3xl text-navy">Reporting activity over time</h2></div><p className="max-w-xs text-right text-xs leading-5 text-muted-foreground">Story counts are editorial coverage—not market growth.</p></div>
          <div className="mt-8 h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly_coverage}><defs><linearGradient id="coverage" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0F1F3D" stopOpacity={.32}/><stop offset="1" stopColor="#0F1F3D" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(15,31,61,.08)"/><XAxis dataKey="week_start" tickFormatter={v => new Date(`${v}T00:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'})} axisLine={false} tickLine={false} tick={{fontSize:11}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize:11}}/><Tooltip labelFormatter={v => `Week of ${new Date(`${v}T00:00:00`).toLocaleDateString()}`}/><Area type="monotone" dataKey="stories" name="Published stories" stroke="#0F1F3D" strokeWidth={3} fill="url(#coverage)"/></AreaChart></ResponsiveContainer></div>
        </article>

        <article className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent-ink">Country breadth</p><h2 className="mt-2 font-serif text-3xl text-navy">Where the reporting sits</h2>
          <div className="mt-8 h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={country_coverage} layout="vertical" margin={{left:8}}><CartesianGrid horizontal={false} stroke="rgba(15,31,61,.08)"/><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={85} axisLine={false} tickLine={false} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="stories" name="Published stories" fill="#0F1F3D" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-gold/25 bg-gold/5 p-6 md:flex md:items-start md:justify-between md:gap-12 md:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent-ink">Evidence discipline</p><h2 className="mt-2 font-serif text-2xl text-navy">What these numbers do—and do not—say</h2></div><div className="mt-4 max-w-2xl md:mt-0"><p className="text-sm leading-7 text-muted-foreground">{methodology}</p><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Eye size={14}/> Window refreshed {new Date(updated_at).toLocaleString()}</p></div></section>
    </main>
  </div>;
};
