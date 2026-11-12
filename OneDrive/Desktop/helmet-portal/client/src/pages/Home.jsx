import {Link} from 'react-router-dom';import {useStats,rate} from '../api';import {Icon} from '../Common';
const PTS=[['shield',<>An AI-assisted system that identifies riders <b>with and without helmets</b> from live camera feeds and recorded road video.</>],
['target',<>Every rider is <b>tracked and counted once</b>, inside a lane or zone you choose, with an alarm and an evidence photo for each violation.</>],
['chart',<>Review <b>trends, heatmaps and filters</b> on the dashboard, and print <b>PDF reports</b> for official review.</>],
['cpu',<>Runs in the browser with a <b>YOLO11 ONNX model</b>; violations are stored on the server behind a secure login.</>]];
const FEATS=[['cpu','b','Fast YOLO11 detector','Two-class ONNX model that runs on your GPU through WebGPU, with CPU fallback.'],
['bell','y','Instant alerts','Audible alarm as soon as a new violation is confirmed.'],
['image','r','Evidence capture','A snapshot of every violation is stored on the server for review.'],
['target','b','Rider tracking and zones','Every rider gets an ID and is counted once, inside a lane or zone you draw.'],
['chart','g','Analytics and reports','Trends, heatmap, filters, and printable PDF reports.'],
['lock','r','Login and roles','Admin and officer accounts; only admins can delete data.']];
export default function Home({live}){
  const s=useStats();
  return <>
    <section className="hero2" style={{'--bgimg':'url(/samples/s1.jpg)'}}><div className="h2in">
      <div><div className="eb">SMART HELMET COMPLIANCE MONITORING</div>
        <h1>RIDER <em>KAVACH</em></h1><div className="h2sub">Ride Safe • Ride Smart</div><div className="gl"/>
        {PTS.map(([i,t],k)=><div className="pt" key={k}><div className="pi"><Icon n={i} s={17}/></div><p>{t}</p></div>)}
        <div style={{marginTop:26,display:'flex',gap:12,flexWrap:'wrap'}}>
          <Link className="btn p big" to="/detect"><Icon n="play" s={18}/>Start Live Detection</Link>
          <Link className="btn ghost big" to="/analyze"><Icon n="video" s={18}/>Analyse a Video</Link></div></div>
      <div className="panel"><div style={{fontWeight:700,marginBottom:6,letterSpacing:'.08em',fontSize:'.8rem',color:'#7dd3fc'}}>SYSTEM STATUS</div>
        <div className="row"><span>AI model</span><b>{live.ready?'Ready':'Loading…'}</b></div>
        <div className="row"><span>Processing</span><b>{live.backend}</b></div>
        <div className="row"><span>Violations today</span><b>{s.today}</b></div>
        <div className="row"><span>Compliance rate</span><b>{rate(s)}</b></div>
        <Link className="btn g" style={{width:'100%',justifyContent:'center',marginTop:14}} to="/dashboard"><Icon n="chart" s={16}/>Open Dashboard</Link></div>
    </div></section>
    <div className="grid">
      <div className="card kpi"><div className="ic r"><Icon n="alert" s={24}/></div><div><small>Violations recorded</small><b>{s.viol}</b></div></div>
      <div className="card kpi"><div className="ic g"><Icon n="check" s={24}/></div><div><small>Compliance rate</small><b>{rate(s)}</b></div></div>
      <div className="card kpi"><div className="ic y"><Icon n="clock" s={24}/></div><div><small>Violations today</small><b>{s.today}</b></div></div>
      <div className="card kpi"><div className="ic b"><Icon n="users" s={24}/></div><div><small>Riders counted</small><b>{s.ok+s.bad}</b></div></div></div>
    <div className="sec">How it works</div>
    <div className="steps">{[['Capture','Video from a webcam, an ESP32-CAM stream, or an uploaded photo or video.'],['Detect','The model locates each head and classifies it as Helmet or NoHelmet.'],
      ['Track and alert','Each rider is tracked and counted once; a violation triggers the alarm and a snapshot.'],['Report','Filter the dashboard, export CSV, or print a PDF report.']]
      .map(([t,d],i)=><div className="card step" key={t}><div className="n">{i+1}</div><h3>{t}</h3><p>{d}</p></div>)}</div>
    <div className="sec">Key capabilities</div>
    <div className="grid">{FEATS.map(([i,c,t,d])=><div className="card fc" key={t}><div className={'ic '+c}><Icon n={i}/></div><h3>{t}</h3><p>{d}</p></div>)}</div>
  </>;
}
