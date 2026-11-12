import {useEffect,useState} from 'react';import {api,qs,withToken,useStats} from '../api';import {Icon,PageHead} from '../Common';

const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const back=n=>{const d=new Date();d.setDate(d.getDate()-n);return ymd(d)};
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const Trend=({daily})=>{
  const W=720,H=250,L=36,R=38,B=30,T=14,n=Math.max(daily.length,1),bw=(W-L-R)/n,mx=Math.max(4,...daily.map(d=>d.viol));
  const y=v=>H-B-(H-B-T)*v/mx,yp=p=>H-B-(H-B-T)*p/100,every=Math.ceil(n/7);
  const pts=daily.map((d,i)=>{const t=d.ok+d.bad;return t?[L+i*bw+bw/2,yp(100*d.ok/t)]:null}).filter(Boolean);
  return <svg viewBox={`0 0 ${W} ${H}`} className="chartsvg">
    {[0,.5,1].map(t=><g key={t}><line x1={L} x2={W-R} y1={y(mx*t)} y2={y(mx*t)} stroke="#eef2f7"/>
      <text x={L-8} y={y(mx*t)+4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(mx*t)}</text>
      <text x={W-R+8} y={yp(100*t)+4} fontSize="10" fill="#16a34a">{Math.round(100*t)}%</text></g>)}
    {daily.map((d,i)=><g key={d.date}><rect x={L+i*bw+Math.min(4,bw*.2)} y={y(d.viol)} width={Math.max(bw-2*Math.min(4,bw*.2),2)} height={d.viol?H-B-y(d.viol):0} rx="3" fill="#9db8f4"><title>{d.date}: {d.viol} violation(s), {d.ok+d.bad} riders</title></rect>
      {i%every===0&&<text x={L+i*bw+bw/2} y={H-10} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.date.slice(5)}</text>}</g>)}
    {pts.length>0&&<path d={pts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')} fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinejoin="round"/>}
    {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#16a34a"/>)}</svg>};

const Heat=({heat})=>{const mx=Math.max(1,...heat.flat()),cw=26,ch=24,L=36,T=18;
  return <svg viewBox={`0 0 ${L+24*cw} ${T+7*ch+4}`} className="chartsvg">
    {[0,3,6,9,12,15,18,21].map(h=><text key={h} x={L+h*cw+cw/2} y={11} textAnchor="middle" fontSize="10" fill="#94a3b8">{String(h).padStart(2,'0')}</text>)}
    {heat.map((row,r)=><g key={r}><text x={L-6} y={T+r*ch+ch/2+4} textAnchor="end" fontSize="10" fill="#64748b">{DAYS[r]}</text>
      {row.map((v,c)=><rect key={c} x={L+c*cw+1} y={T+r*ch+1} width={cw-2} height={ch-2} rx="4" fill={v?`rgba(37,99,235,${.18+.82*v/mx})`:'#f1f5f9'}><title>{DAYS[r]} {String(c).padStart(2,'0')}:00 – {v} violation(s)</title></rect>)}</g>)}</svg>};

const Donut=({p})=>{const r=54,C=2*Math.PI*r;return <svg viewBox="0 0 140 140" width="140" height="140">
  <circle cx="70" cy="70" r={r} fill="none" stroke={p==null?'#eef2f7':'#fecaca'} strokeWidth="14"/>
  <circle cx="70" cy="70" r={r} fill="none" stroke="#16a34a" strokeWidth="14" strokeDasharray={`${C*(p||0)/100} ${C}`} transform="rotate(-90 70 70)" strokeLinecap="round"/>
  <text x="70" y="76" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0f172a">{p==null?'–':p+'%'}</text>
  <text x="70" y="94" textAnchor="middle" fontSize="9" fill="#94a3b8">COMPLIANT</text></svg>};

const Kpi=({icon,tone,label,value,note})=><div className="kp"><div className={'kpi-ic ic '+tone}><Icon n={icon} s={20}/></div>
  <div className="kp-l">{label}</div><div className="kp-v">{value}</div><div className="kp-n">{note}</div></div>;

export default function Dashboard({live,me}){
  const [f,setF]=useState({from:back(6),to:back(0),camera:'',minConf:''}),[range,setRange]=useState(7);
  const [an,setAn]=useState(null),[rows,setRows]=useState([]),[cams,setCams]=useState([]),today=useStats(3000).today;
  const set=(k,v)=>{setF(o=>({...o,[k]:v}));setRange(0)};
  const quick=n=>{setF(o=>({...o,from:back(n-1),to:back(0)}));setRange(n)};
  useEffect(()=>{
    const load=()=>{api.analytics(f).then(setAn).catch(()=>{});api.incidents({...f,limit:24}).then(setRows).catch(()=>{});api.cameras().then(setCams).catch(()=>{})};
    load();const t=setInterval(load,3000);return()=>clearInterval(t)},[f]);
  const T=an?an.totals:{viol:0,ok:0,bad:0},tot=T.ok+T.bad,p=tot?Math.round(100*T.ok/tot):null;
  const wipe=async()=>{if(confirm('Delete ALL recorded violations, photos and statistics? This cannot be undone.')){await api.clear();setF({...f})}};
  const strip=[['AI model',live.ready?'Ready':'Loading',live.ready],['Processing',live.backend,live.ready],['Camera',live.running?'Running':'Stopped',live.running],
    ['Speed',live.running?live.fps+' FPS':'–',live.running],['Alarm',live.alarm?'On':'Off',live.alarm],['Snapshots',live.snap?'On':'Off',live.snap],['Confidence',live.conf+'%',true]];
  const camList=an?Object.entries(an.cams).sort((a,b)=>b[1]-a[1]):[],cmx=Math.max(1,...camList.map(c=>c[1]));
  return <>
    <div className="dh"><PageHead icon="chart" title="Monitoring Dashboard" sub="Filter by date, camera and confidence. All figures update automatically."/>
      <div className="acts"><span className="livepill"><span className="dot"/>Live</span>
        <a className="btn g" href={withToken('/api/incidents.csv?'+qs(f))}><Icon n="download" s={16}/>Export CSV</a>
        {me.role==='admin'&&<button className="btn d" onClick={wipe}><Icon n="trash" s={16}/>Clear data</button>}</div></div>

    <div className="card fbar"><div className="chips">{[[1,'Today'],[7,'7 days'],[30,'30 days'],[90,'90 days']].map(([n,t])=><button key={n} className={'cp'+(range===n?' on':'')} onClick={()=>quick(n)}>{t}</button>)}</div>
      <div className="ff"><label>From<input type="date" value={f.from} onChange={e=>set('from',e.target.value)}/></label>
        <label>To<input type="date" value={f.to} onChange={e=>set('to',e.target.value)}/></label>
        <label>Camera<select value={f.camera} onChange={e=>set('camera',e.target.value)}><option value="">All cameras</option>{cams.map(c=><option key={c}>{c}</option>)}</select></label>
        <label>Min. confidence %<input type="number" min="0" max="100" value={f.minConf} placeholder="0" onChange={e=>set('minConf',e.target.value)}/></label></div></div>

    <div className="kps">
      <Kpi icon="alert" tone="r" label="Violations" value={T.viol} note="In selected period"/>
      <Kpi icon="users" tone="b" label="Riders counted" value={tot} note={`${T.ok} with helmet · ${T.bad} without`}/>
      <Kpi icon="check" tone="g" label="Compliance" value={p==null?'–':p+'%'} note="Riders wearing helmets"/>
      <Kpi icon="clock" tone="y" label="Today" value={today} note="Violations since midnight"/></div>
    <div className="strip">{strip.map(([l,v,on])=><div className="si" key={l}><span className={'dt'+(on?' on':'')}/><div><small>{l}</small><b>{v}</b></div></div>)}</div>

    <div className="dg">
      <div className="card"><div className="ct"><h3>Daily trend</h3><span><i className="lgd" style={{background:'#9db8f4'}}/>Violations <i className="lgd" style={{background:'#16a34a'}}/>Compliance %</span></div>{an&&<Trend daily={an.daily}/>}</div>
      <div className="card"><div className="ct"><h3>Compliance</h3></div><div className="donut"><Donut p={p}/>
        <div className="lg"><span><i style={{background:'#16a34a'}}/>With helmet <b>{T.ok}</b></span><span><i style={{background:'#fecaca'}}/>Without helmet <b>{T.bad}</b></span></div></div></div></div>
    <div className="dg">
      <div className="card"><div className="ct"><h3>When do violations happen?</h3><span>Weekday × hour</span></div>{an&&<Heat heat={an.heat}/>}</div>
      <div className="card"><div className="ct"><h3>By camera</h3></div>
        {camList.length?camList.map(([c,n])=><div key={c} style={{marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',fontSize:'.88rem',fontWeight:600}}><span>{c}</span><span>{n}</span></div>
          <div className="bar2" style={{background:'#e2e8f0'}}><i style={{width:100*n/cmx+'%',background:'var(--blue)'}}/></div></div>):<div className="empty2" style={{padding:20}}>No data</div>}</div></div>

    <div className="card"><div className="ct"><h3>Recent violations</h3><span>{rows.length?`Latest ${rows.length} for this filter`:''}</span></div>
      {rows.length?<div className="evg">{rows.map(r=><div className="evc" key={r.id}>
        {r.image?<a href={withToken(r.image)} target="_blank" rel="noreferrer"><img src={withToken(r.image)} alt="Violation snapshot"/></a>:<div className="noimg"><Icon n="image" s={28}/></div>}
        <div className="m"><div><b>{new Date(r.t).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} · {new Date(r.t).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</b><span>{r.camera} · {r.source||'live'}</span></div>
          <span className="cb">{r.confidence}%</span></div></div>)}</div>
      :<div className="empty2"><Icon n="shield" s={40}/><div style={{fontWeight:600,color:'#334155'}}>No violations for this filter</div><div style={{fontSize:'.86rem'}}>Change the dates or camera, or run a detection.</div></div>}</div>
  </>;
}
