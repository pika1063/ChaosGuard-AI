import {useState} from 'react';import {Badge,Card} from '../ui';
type T=(string|number)[][];
// Demo report data. Replace with data from your backend or monitoring stack.
const R:Record<string,T>={
'Threat detection summary':[['metric','value','data_source'],['flows_analyzed',1840000,'demo'],['attacks_detected',129400,'demo'],['detection_rate','97.9%','demo'],['top_category','DoS','demo']],
'Model performance':[['metric','value','data_source'],['accuracy','98.7%','demo'],['precision','98.1%','demo'],['recall','97.9%','demo'],['f1','98.0%','demo'],['roc_auc',0.994,'demo']],
'Failure simulation':[['drill','detection','recovery_seconds','data_source'],['Data drift','Drift monitor alert',42,'simulated'],['Invalid input','Schema validation',3,'simulated'],['High latency','Latency SLO breach',18,'simulated'],['Model artifact','Health check failed',27,'simulated'],['API failure','Error-rate alert',22,'simulated'],['Traffic spike','Throughput alert',15,'simulated']],
'Reliability':[['metric','value','data_source'],['api_uptime','99.94%','demo'],['p95_latency_ms',41,'demo'],['error_rate','0.4%','demo'],['mean_recovery_s',25,'simulated']],
'Dataset analysis':[['metric','value','data_source'],['rows',2830743,'demo'],['benign_share','80.3%','demo'],['attack_share','19.7%','demo'],['dataset_version','v3','demo']]};
const csv=(t:T)=>t.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
export default function Reports(){const [k,setK]=useState('Threat detection summary');const t=R[k];
const dl=()=>{const u=URL.createObjectURL(new Blob([csv(t)],{type:'text/csv'}));const a=document.createElement('a');a.href=u;a.download=k.replace(/\W+/g,'_')+'.csv';a.click();URL.revokeObjectURL(u)};
return<div className="space-y-4"><div className="flex items-center gap-3"><h2 className="text-2xl font-bold">Reports</h2><Badge live={false}/></div>
<div className="no-print flex flex-wrap gap-2">{Object.keys(R).map(n=><button key={n} className={`btn ${n===k?'border-cg text-white':''}`} onClick={()=>setK(n)}>{n}</button>)}</div>
<Card title={k}><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-slate-400"><tr>{t[0].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{t.slice(1).map((r,i)=><tr key={i} className="border-t border-blue-400/10">{r.map((c,j)=><td key={j} className="py-1">{c}</td>)}</tr>)}</tbody></table></div><p className="mt-3 text-xs text-slate-400">Generated {new Date().toLocaleString()}</p>
<div className="no-print mt-4 flex gap-2"><button className="btn" onClick={dl}>Download CSV</button><button className="btn" onClick={()=>window.print()}>Print / save as PDF</button></div></Card></div>}
