import {useEffect,useState} from 'react';import {Area,AreaChart,ResponsiveContainer,Tooltip,XAxis} from 'recharts';import {Card} from '../ui';import {Bars,Topology} from '../charts';
const rnd=(a:number,b:number)=>Math.round(a+Math.random()*(b-a));
interface Rec{id:number;src:string;dst:string;proto:string;bytes:number;bad:boolean}
let n=0;const rec=():Rec=>({id:++n,src:`10.2.${rnd(1,9)}.${rnd(2,200)}`,dst:`10.0.0.${rnd(2,50)}`,proto:['TCP','TCP','UDP','ICMP'][rnd(0,3)],bytes:rnd(200,90000),bad:Math.random()<.12});
const pt=(i:number)=>({t:i,in:rnd(40,90),out:rnd(20,50)});
export default function Traffic(){const [d,setD]=useState(()=>Array.from({length:30},(_,i)=>pt(i)));const [rs,setRs]=useState<Rec[]>(()=>Array.from({length:8},rec));
useEffect(()=>{const t=setInterval(()=>{setD(a=>[...a.slice(1),pt(a[a.length-1].t+1)]);setRs(a=>[rec(),...a].slice(0,8))},1200);return()=>clearInterval(t)},[]);
const ch=(k:'in'|'out',c:string)=><div className="h-48"><ResponsiveContainer><AreaChart data={d}><XAxis dataKey="t" hide/><Tooltip contentStyle={{background:'#0c1330',border:'1px solid #334'}}/><Area dataKey={k} stroke={c} fill={c+'33'} isAnimationActive={false}/></AreaChart></ResponsiveContainer></div>;
return<div className="space-y-4"><div className="flex items-center gap-3"><h2 className="text-2xl font-bold">Live Traffic</h2><span className="rounded-full border border-amber-400/50 px-2 py-0.5 text-xs text-amber-300">Simulated stream</span></div>
<Card title="Network map"><Topology/></Card>
<div className="grid gap-4 md:grid-cols-2"><Card title="Incoming (Mbps)">{ch('in','#22d3ee')}</Card><Card title="Outgoing (Mbps)">{ch('out','#8b5cf6')}</Card>
<Card title="Protocol distribution"><Bars items={[['TCP',62,'#3b82f6'],['UDP',24,'#22d3ee'],['ICMP',9,'#fbbf24'],['Other',5,'#8b5cf6']]}/></Card>
<Card title="Suspicious alerts">{rs.filter(r=>r.bad).length===0?<p className="text-sm text-slate-400">No suspicious flows in the latest window.</p>:rs.filter(r=>r.bad).map(r=><p key={r.id} className="text-sm text-rose-400">Flow {r.id}: {r.src} to {r.dst} ({r.proto})</p>)}</Card></div>
<Card title="Recent traffic records"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-slate-400"><tr><th>ID</th><th>Source</th><th>Destination</th><th>Protocol</th><th>Bytes</th><th>Flag</th></tr></thead><tbody>{rs.map(r=><tr key={r.id} className="border-t border-blue-400/10"><td>{r.id}</td><td>{r.src}</td><td>{r.dst}</td><td>{r.proto}</td><td>{r.bytes}</td><td className={r.bad?'text-rose-400':'text-emerald-400'}>{r.bad?'Suspicious':'Normal'}</td></tr>)}</tbody></table></div></Card></div>}
