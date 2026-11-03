export const Gauge=({v,label}:{v:number;label:string})=>{const a=Math.PI*(1-v/100),x=100+80*Math.cos(a),y=100-80*Math.sin(a);
return<svg viewBox="0 0 200 120" className="mx-auto max-h-40 w-full"><defs><linearGradient id="gg"><stop offset="0" stopColor="#8b5cf6"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs>
<path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#ffffff14" strokeWidth="12" strokeLinecap="round"/>
<path d={`M20 100A80 80 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`} fill="none" stroke="url(#gg)" strokeWidth="12" strokeLinecap="round" style={{filter:'drop-shadow(0 0 6px #22d3ee)'}}/>
<text x="100" y="88" textAnchor="middle" fill="#e8eeff" fontSize="30" fontWeight="700">{v}%</text><text x="100" y="110" textAnchor="middle" fill="#8a97bd" fontSize="11">{label}</text></svg>};
export const Donut=({parts,label}:{parts:[number,string][];label:string})=>{const C=2*Math.PI*40;let o=0;
return<svg viewBox="0 0 120 120" className="mx-auto max-h-40 w-full"><g transform="rotate(-90 60 60)" fill="none" strokeWidth="14">{parts.map(([v,c],i)=>{const e=<circle key={i} cx="60" cy="60" r="40" stroke={c} strokeDasharray={`${(v/100*C).toFixed(1)} ${C}`} strokeDashoffset={(-o/100*C).toFixed(1)}/>;o+=v;return e})}</g>
<text x="60" y="64" textAnchor="middle" fill="#e8eeff" fontSize="14" fontWeight="700">{label}</text></svg>};
export const Bars=({items}:{items:[string,number,string][]})=><div>{items.map(([n,v,c])=><div key={n} className="my-2 grid grid-cols-[100px_1fr_40px] items-center gap-2 text-sm"><span className="text-slate-400">{n}</span><i className="h-2 overflow-hidden rounded bg-white/10"><b className="block h-full rounded" style={{width:v+'%',background:c}}/></i><em className="text-right not-italic text-slate-400">{v}%</em></div>)}</div>;
const N:[number,number,string][]=[[300,40,'Gateway'],[130,110,'Firewall A'],[470,110,'Firewall B'],[60,200,'Web-01'],[200,200,'App-02'],[400,200,'DB-03'],[540,200,'Host-77']];
const L=[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[4,5]];
export const Topology=()=><svg viewBox="0 0 600 250" className="h-64 w-full" role="img" aria-label="Network topology with one compromised host">
{L.map(([a,b],i)=><line key={i} x1={N[a][0]} y1={N[a][1]} x2={N[b][0]} y2={N[b][1]} stroke={b===6?'#f43f5e':'#22d3ee'} strokeOpacity=".5" strokeDasharray={b===6?'5 4':undefined}/>)}
{N.map(([x,y,n],i)=>{const c=i===6?'#f43f5e':i<3?'#8b5cf6':'#22d3ee';return<g key={n}><circle cx={x} cy={y} r="15" fill="#0c1330" stroke={c} strokeWidth="2" style={{filter:`drop-shadow(0 0 7px ${c})`}}/><text x={x} y={y+32} textAnchor="middle" fill="#8a97bd" fontSize="11">{n}</text></g>})}</svg>;
