import {useEffect,useState} from 'react';import {api,qs,withToken} from '../api';import {Icon,PageHead} from '../Common';
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const back=n=>{const d=new Date();d.setDate(d.getDate()-n);return ymd(d)};

export default function Reports({me}){
  const [f,setF]=useState({from:back(6),to:back(0),camera:''}),[an,setAn]=useState(null),[rows,setRows]=useState([]),[cams,setCams]=useState([]);
  useEffect(()=>{api.analytics(f).then(setAn).catch(()=>{});api.incidents({...f,limit:24}).then(setRows).catch(()=>{});api.cameras().then(setCams).catch(()=>{})},[f]);
  const T=an?an.totals:{viol:0,ok:0,bad:0},tot=T.ok+T.bad,set=(k,v)=>setF(o=>({...o,[k]:v}));
  return <>
    <div className="noprint"><div className="dh"><PageHead icon="file" title="Reports" sub="Choose a period and camera, then print or save the report as a PDF."/>
      <div className="acts"><button className="btn p" onClick={()=>window.print()}><Icon n="download" s={16}/>Print / Save PDF</button>
        <a className="btn g" href={withToken('/api/incidents.csv?'+qs(f))}><Icon n="download" s={16}/>CSV</a></div></div>
      <div className="card fbar"><div className="ff"><label>From<input type="date" value={f.from} onChange={e=>set('from',e.target.value)}/></label>
        <label>To<input type="date" value={f.to} onChange={e=>set('to',e.target.value)}/></label>
        <label>Camera<select value={f.camera} onChange={e=>set('camera',e.target.value)}><option value="">All cameras</option>{cams.map(c=><option key={c}>{c}</option>)}</select></label></div></div></div>

    <div className="rep">
      <div className="rh"><div><div className="rt">Helmet Compliance Report</div><div className="rs">Rider Kavach · Smart Helmet Compliance Monitoring</div></div>
        <div className="rm"><div><b>Period:</b> {f.from} to {f.to}</div><div><b>Camera:</b> {f.camera||'All cameras'}</div><div><b>Generated:</b> {new Date().toLocaleString('en-IN')}</div><div><b>By:</b> {me.user}</div></div></div>
      <div className="kps">
        <div className="kp"><div className="kp-l">Riders counted</div><div className="kp-v">{tot}</div></div>
        <div className="kp"><div className="kp-l">With helmet</div><div className="kp-v" style={{color:'var(--ok)'}}>{T.ok}</div></div>
        <div className="kp"><div className="kp-l">Violations</div><div className="kp-v" style={{color:'var(--bad)'}}>{T.viol}</div></div>
        <div className="kp"><div className="kp-l">Compliance</div><div className="kp-v">{tot?Math.round(100*T.ok/tot)+'%':'–'}</div></div></div>
      <div className="card"><h3>Daily summary</h3><div style={{overflowX:'auto'}}><table><thead><tr><th>Date</th><th>Riders</th><th>With helmet</th><th>Violations</th><th>Compliance</th></tr></thead><tbody>
        {an&&an.daily.filter(d=>d.ok+d.bad+d.viol>0).map(d=><tr key={d.date}><td>{d.date}</td><td>{d.ok+d.bad}</td><td>{d.ok}</td><td>{d.viol}</td><td>{d.ok+d.bad?Math.round(100*d.ok/(d.ok+d.bad))+'%':'–'}</td></tr>)}
        {an&&!an.daily.some(d=>d.ok+d.bad+d.viol>0)&&<tr><td colSpan="5" className="empty">No activity in this period.</td></tr>}</tbody></table></div></div>
      {rows.length>0&&<div className="card" style={{marginTop:16}}><h3>Evidence (latest {rows.length})</h3><div className="evg">{rows.map(r=><div className="evc" key={r.id}>
        {r.image?<img src={withToken(r.image)} alt="Violation snapshot"/>:<div className="noimg"><Icon n="image" s={28}/></div>}
        <div className="m"><div><b>{new Date(r.t).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</b><span>{r.camera}</span></div><span className="cb">{r.confidence}%</span></div></div>)}</div></div>}
      <div className="sign"><div>Prepared by<br/><br/>_______________________</div><div>Verified by<br/><br/>_______________________</div></div>
      <p className="disc">Detections are produced by an AI model and are decision support only. Each violation must be reviewed by a person before any action is taken.</p>
    </div></>;
}
