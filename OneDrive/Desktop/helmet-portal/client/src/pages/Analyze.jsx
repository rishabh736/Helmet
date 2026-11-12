import {useRef,useState} from 'react';
import {detect} from '../detector';import {api} from '../api';import {Icon,PageHead} from '../Common';
import {Tracker} from '../tracker';import {useZone,ZoneLayer,inZone} from '../zone.jsx';import {drawTracks,snap} from '../draw';
const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');
const seek=(v,t)=>new Promise(res=>{const f=()=>{v.removeEventListener('seeked',f);res()};v.addEventListener('seeked',f);v.currentTime=t});

export default function Analyze({live}){
  const cv=useRef(),vid=useRef(),stopR=useRef(false),Z=useZone();
  const [url,setUrl]=useState(''),[name,setName]=useState(''),[step,setStep]=useState(.2),[cam,setCam]=useState(localStorage.getItem('hl_cam')||'Camera 1');
  const [run,setRun]=useState(false),[prog,setProg]=useState(0),[res,setRes]=useState(null),[live2,setLive2]=useState([0,0]),[saved,setSaved]=useState(''),[msg,setMsg]=useState('');

  const pick=e=>{const f=e.target.files[0];if(!f)return;if(url)URL.revokeObjectURL(url);setUrl(URL.createObjectURL(f));setName(f.name);setRes(null);setSaved('');setProg(0);setLive2([0,0])};
  const first=()=>{const v=vid.current,c=cv.current;c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0)};

  async function analyze(){
    if(!live.ready){setMsg('The AI model is still loading. Wait for "Model ready" in the header.');return}
    const v=vid.current,c=cv.current,x=c.getContext('2d'),w=v.videoWidth,h=v.videoHeight,dur=v.duration;
    stopR.current=false;setRun(true);setRes(null);setSaved('');setMsg('');c.width=w;c.height=h;
    const trk=new Tracker(3),viol=[];let ok=0,bad=0;
    try{
      for(let t=.05;t<dur&&!stopR.current;t+=step){
        await seek(v,t);x.drawImage(v,0,0);
        const d=(await detect(v,w,h,live.conf/100)).filter(q=>inZone(Z.zone,q,w,h));
        const {active,events}=trk.update(d);drawTracks(x,active);
        events.forEach(e=>{if(e.type==='bad'){bad++;viol.push({id:e.tr.id,t,conf:Math.round((e.tr.badMax||e.tr.conf)*100),img:snap(c,e.tr.box)})}else ok++});
        setProg(Math.min(100,Math.round(100*t/dur)));setLive2([ok,bad]);
      }
      setRes({ok,bad,viol,dur,cam,name,at:new Date().toLocaleString('en-IN'),stopped:stopR.current,zone:!!Z.zone});
    }catch(e){setMsg('Analysis failed: '+e.message)}
    setRun(false);
  }
  async function saveAll(){
    setSaved('Saving…');
    try{for(let i=0;i<res.ok;i++)await api.rider(false,res.cam);
      for(const q of res.viol){await api.rider(true,res.cam);await api.incident({confidence:q.conf,image:q.img,camera:res.cam,source:'video'})}
      setSaved('Saved to the dashboard.')}catch(e){setSaved('Could not save: '+e.message)}
  }
  const csv=()=>{const rows=['Rider ID,Video time,Confidence %'].concat(res.viol.map(q=>`${q.id},${fmt(q.t)},${q.conf}`));
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));a.download='video_violations.csv';a.click()};
  const tot=res?res.ok+res.bad:0;

  return <>
    <div className="noprint"><PageHead icon="video" title="Video Analysis" sub="Upload recorded CCTV or road footage. The whole video is scanned and a violation report is produced."/></div>
    <div className="g2 noprint"><div className="stack">
      <div className="viewer"><div className="cw"><canvas ref={cv} width="640" height="360"/><ZoneLayer Z={Z}/></div>
        {!url&&<div className="idle"><Icon n="video" s={54}/><p>Upload a video to begin.</p></div>}
        {run&&<div className="hud"><span className="chip live"><span className="dot"/>Analysing {prog}%</span><span className="chip">{live2[0]+live2[1]} riders · {live2[1]} violations</span></div>}</div>
      {run&&<div className="card"><div className="bar2" style={{margin:0}}><i style={{width:prog+'%',background:'var(--blue)'}}/></div></div>}
      {msg&&<div className="card" style={{color:'var(--bad)',fontWeight:600}}>{msg}</div>}</div>
    <div className="stack">
      <div className="card"><h3><Icon n="video" s={18}/>1. Video</h3><input type="file" accept="video/*" onChange={pick}/>
        <label className="f">Camera name / location</label><input type="text" value={cam} onChange={e=>setCam(e.target.value)}/>
        <label className="f">Scan quality</label><select value={step} onChange={e=>setStep(+e.target.value)}>
          <option value=".1">High (every 0.1 s, slowest)</option><option value=".2">Normal (every 0.2 s)</option><option value=".5">Fast (every 0.5 s)</option></select></div>
      <div className="card"><h3><Icon n="target" s={18}/>2. Zone (optional)</h3>
        <p style={{margin:'0 0 12px',fontSize:'.86rem',color:'var(--mut)'}}>{Z.zone?'Only riders inside the yellow box are counted.':'Whole frame is used.'}</p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button className={'btn '+(Z.draw?'y':'p')} disabled={!url||run} onClick={()=>Z.setDraw(!Z.draw)}>{Z.draw?'Drag on the video…':'Draw zone'}</button>{Z.zone&&<button className="btn g" onClick={Z.clear}>Clear zone</button>}</div></div>
      <div className="card"><h3><Icon n="play" s={18}/>3. Analyse</h3>
        <div style={{display:'flex',gap:10}}><button className="btn p" disabled={!url||run} onClick={analyze}><Icon n="play" s={16}/>Start analysis</button>
          <button className="btn g" disabled={!run} onClick={()=>{stopR.current=true}}><Icon n="stop" s={16}/>Stop</button></div></div>
    </div></div>
    <video ref={vid} src={url} muted playsInline preload="auto" onLoadedData={first} style={{display:'none'}}/>

    {res&&<div style={{marginTop:24}}>
      <div className="printonly"><h2>Video Analysis Report</h2></div>
      <div className="card"><h3><Icon n="file" s={18}/>Report summary{res.stopped?' (stopped early)':''}</h3>
        <div className="meta"><span><b>Video</b>{res.name}</span><span><b>Camera</b>{res.cam}</span><span><b>Length</b>{fmt(res.dur)}</span><span><b>Analysed</b>{res.at}</span><span><b>Zone</b>{res.zone?'Custom zone':'Whole frame'}</span></div></div>
      <div className="kps" style={{marginTop:16}}>
        <div className="kp"><div className="kp-l">Riders detected</div><div className="kp-v">{tot}</div></div>
        <div className="kp"><div className="kp-l">With helmet</div><div className="kp-v" style={{color:'var(--ok)'}}>{res.ok}</div></div>
        <div className="kp"><div className="kp-l">Without helmet</div><div className="kp-v" style={{color:'var(--bad)'}}>{res.bad}</div></div>
        <div className="kp"><div className="kp-l">Compliance</div><div className="kp-v">{tot?Math.round(100*res.ok/tot)+'%':'–'}</div></div></div>
      <div className="card"><div className="ct"><h3>Violations found</h3><span className="noprint" style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <button className="btn g" onClick={()=>window.print()}><Icon n="download" s={16}/>Print / Save PDF</button>
        <button className="btn g" onClick={csv} disabled={!res.viol.length}><Icon n="download" s={16}/>CSV</button>
        <button className="btn p" onClick={saveAll} disabled={!tot}><Icon n="server" s={16}/>Save to dashboard</button></span></div>
        {saved&&<div className="noprint" style={{marginBottom:12,fontWeight:600,color:'var(--ok)'}}>{saved}</div>}
        {res.viol.length?<div className="evg">{res.viol.map(q=><div className="evc" key={q.id}><img src={q.img} alt="Violation"/>
          <div className="m"><div><b>Rider #{q.id}</b><span>at {fmt(q.t)}</span></div><span className="cb">{q.conf}%</span></div></div>)}</div>
        :<div className="empty2"><Icon n="shield" s={40}/><div style={{fontWeight:600,color:'#334155'}}>No violations found</div></div>}</div></div>}
  </>;
}
