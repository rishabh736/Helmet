import {useEffect,useRef,useState} from 'react';
import {detect,loadModel,lastMax} from '../detector';import {api} from '../api';import {Icon,PageHead} from '../Common';
import {Tracker} from '../tracker';import {faces,initFace} from '../face';import {fuse} from '../webcam';import {useZone,ZoneLayer,inZone} from '../zone.jsx';import {drawTracks,snap} from '../draw';
const SAMPLES=[1,2,3,4,5,6].map(i=>`/samples/s${i}.jpg`);

export default function Detect({hidden,live,setLive}){
  const cv=useRef(),vid=useRef(),L=useRef(live);L.current=live;
  const Z=useZone(),ZR=useRef(Z.zone);ZR.current=Z.zone;
  const R=useRef({run:false,busy:false,trk:new Tracker(6),active:[],none:0,fn:0,ft:performance.now()});
  const [cam,setCam]=useState(localStorage.getItem('hl_cam')||'Camera 1'),CR=useRef(cam);CR.current=cam;
  const [srcT,setSrcT]=useState('cam'),[esp,setEsp]=useState('http://192.168.1.50:81/stream');
  const [badge,setBadge]=useState(['wait','STANDBY']),[cnt,setCnt]=useState([0,0,0]),[tot,setTot]=useState({ok:0,bad:0});
  const [msg,setMsg]=useState('Loading model…'),[idle,setIdle]=useState(true),[best,setBest]=useState(0),[pref,setPref]=useState(localStorage.getItem('hl_backend')||'auto');
  const upd=p=>setLive(l=>({...l,...p}));

  const init=pr=>{upd({ready:false,backend:'–'});setMsg('Loading model…');
    loadModel('/best.onnx',640,pr).then(b=>{upd({ready:true,backend:b});setMsg('Model ready · '+b)}).catch(e=>setMsg('Model failed: '+e.message))};
  useEffect(()=>{init(pref)},[]);
  const changeBackend=v=>{setPref(v);localStorage.setItem('hl_backend',v);stop();init(v)};
  /* Beep-beep alarm: short sharp beeps, repeated for as long as a NO HELMET box is shown */
  const alarm=on=>{
    const r=R.current;
    if(on&&!r.osc){
      const a=r.actx;if(!a)return;if(a.state==='suspended')a.resume();
      const o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=1000;g.gain.value=0;
      o.connect(g);g.connect(a.destination);o.start();r.osc=o;
      const beep=()=>{const t=a.currentTime;g.gain.setValueAtTime(.15,t);g.gain.setValueAtTime(0,t+.18)};   // 0.18 s beep
      beep();r.sir=setInterval(beep,400);                                                                  // every 0.4 s
    }else if(!on&&r.osc){
      clearInterval(r.sir);try{r.osc.stop()}catch(e){}r.osc=null;
    }
  };

  function incident(tr){let image='';
    if(L.current.snap){try{image=snap(cv.current,tr.box)}catch(e){}}
    api.incident({confidence:Math.round((tr.badMax||tr.conf)*100),image,camera:CR.current,source:'live'}).catch(()=>{})}
  function handle(dets,w,h){
    const r=R.current,{active,events}=r.trk.update(dets.filter(d=>inZone(ZR.current,d,w,h)));
    r.active=active;const nb=active.filter(t=>t.cls===1).length;
    setCnt([active.length,active.length-nb,nb]);setBest(Math.round(lastMax()*100));r.none=active.length?0:r.none+1;
    setBadge(!active.length?['wait',ZR.current?'NO RIDER IN ZONE':'NO HEAD DETECTED']:nb?['bad','NO HELMET']:['ok','HELMET ON']);
    events.forEach(e=>{
      api.rider(e.type==='bad',CR.current).catch(()=>{});
      setTot(t=>({ok:t.ok+(e.type==='ok'?1:0),bad:t.bad+(e.type==='bad'?1:0)}));
      if(e.type==='bad')incident(e.tr)});
  }
  function loop(){
    const r=R.current;if(!r.run)return;
    const s=r.src,w=s.videoWidth||s.naturalWidth,h=s.videoHeight||s.naturalHeight,c=cv.current;
    if(w){if(c.width!==w||c.height!==h){c.width=w;c.height=h}
      const x=c.getContext('2d');x.drawImage(s,0,0);drawTracks(x,r.active);alarm(L.current.alarm&&r.active.some(t=>t.hits>=2&&t.cls===1));
      if(!r.busy){r.busy=true;const wc=r.kind==='cam'&&L.current.faceCheck;
        Promise.all([detect(s,w,h,L.current.conf/100),wc?faces(s,w,h):null]).then(([d0,f])=>{const d=wc?fuse(d0,f||[],w,h,L.current.strict/100):d0;handle(d,w,h);r.fn++;
          const n=performance.now();if(n-r.ft>=1000){upd({fps:r.fn});r.fn=0;r.ft=n}})
        .catch(e=>setBadge(['wait',e.name==='SecurityError'?'STREAM BLOCKED (enable CORS on ESP32)':'ERROR: '+e.message]))
        .finally(()=>{r.busy=false})}}
    requestAnimationFrame(loop)}
  async function begin(kind,payload){
    const r=R.current;
    if(!L.current.ready){alert('The model is still loading.');return}
    stop();
    try{r.actx=r.actx||new (window.AudioContext||window.webkitAudioContext)();
      const v=vid.current;r.kind=kind;if(kind==='cam'&&L.current.faceCheck)await initFace().catch(()=>{});
      if(kind==='cam'){r.stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480}});v.srcObject=r.stream;await v.play();r.src=v}
      else if(kind==='esp'){const im=new Image();im.crossOrigin='anonymous';im.src=payload;r.src=im}
      else if(kind==='img'){const im=new Image();im.src=payload;await im.decode();r.src=im}
      else{v.srcObject=null;v.src=payload;v.loop=true;await v.play();r.src=v}
      r.trk=new Tracker(6);r.active=[];r.none=0;setTot({ok:0,bad:0});
      r.run=true;setIdle(false);upd({running:true});loop()
    }catch(e){alert('Could not start: '+e.message)}}
  function stop(){const r=R.current;r.run=false;alarm(false);if(r.stream)r.stream.getTracks().forEach(t=>t.stop());r.stream=null;
    setIdle(true);setBadge(['wait','STANDBY']);setCnt([0,0,0]);upd({running:false,fps:0});
    const c=cv.current;if(c)c.getContext('2d').clearRect(0,0,c.width,c.height)}
  const onFile=e=>{const f=e.target.files[0];if(!f)return;begin(f.type.startsWith('video')?'vid':'img',URL.createObjectURL(f));e.target.value=''};
  const go=()=>begin(srcT,srcT==='esp'?esp:undefined);
  const showHint=!idle&&R.current.none>20;

  return <section style={{display:hidden?'none':'block'}}>
    <PageHead icon="camera" title="Live Detection" sub="Each rider gets an ID and is counted once. Draw a zone to count only the lane you care about."/>
    <div className="g2"><div className="stack">
      <div className="viewer"><div className="cw"><canvas ref={cv} width="640" height="480"/><ZoneLayer Z={Z}/></div>
        {idle&&<div className="idle"><Icon n="camera" s={54}/><p>Camera is off.<br/>Press <b>Start</b> or click a sample image.</p></div>}
        {!idle&&<div className="hud"><span className={'chip live '+badge[0]}><span className="dot"/>{badge[1]}</span><span className="chip">{live.fps||0} FPS · {live.backend}</span></div>}
        {showHint&&<div className="hint">No head found (best score {best}%). The model is trained on outdoor road scenes with riders on bikes. Try the sample images, a road video, or lower the confidence slider.</div>}</div>
      <div className="card stat"><div>In view<b>{cnt[0]}</b></div><div>With helmet<b style={{color:'var(--ok)'}}>{cnt[1]}</b></div><div>Without helmet<b style={{color:'var(--bad)'}}>{cnt[2]}</b></div>
        <div>Counted riders<b>{tot.ok+tot.bad}</b></div><div>Violations<b style={{color:'var(--bad)'}}>{tot.bad}</b></div></div>
      <div className="card"><h3><Icon n="image" s={18}/>Test on sample road images</h3><div className="thumbs">{SAMPLES.map(s=><img key={s} src={s} alt="Sample" onClick={()=>begin('img',s)}/>)}</div></div></div>
    <div className="stack">
      <div className="card"><h3><Icon n="cpu" s={18}/>AI model</h3><p style={{margin:0,fontWeight:600,color:live.ready?'var(--ok)':'var(--warn)'}}>{msg}</p>
        <label className="f">Processing</label><select value={pref} onChange={e=>changeBackend(e.target.value)}><option value="auto">Auto (GPU, then CPU)</option><option value="cpu">CPU only (most compatible)</option></select></div>
      <div className="card"><h3><Icon n="camera" s={18}/>Source</h3>
        <select value={srcT} onChange={e=>setSrcT(e.target.value)}><option value="cam">Laptop / USB webcam</option><option value="esp">ESP32-CAM stream</option></select>
        {srcT==='esp'&&<><label className="f">Stream URL</label><input type="text" value={esp} onChange={e=>setEsp(e.target.value)}/></>}
        <label className="f">Camera name / location</label><input type="text" value={cam} onChange={e=>{setCam(e.target.value);localStorage.setItem('hl_cam',e.target.value)}}/>
        <div style={{display:'flex',gap:10,marginTop:14}}><button className="btn p" onClick={go}><Icon n="play" s={16}/>Start</button><button className="btn g" onClick={stop}><Icon n="stop" s={16}/>Stop</button></div>
        <label className="f">Or upload a photo / video</label><input type="file" accept="image/*,video/*" onChange={onFile}/></div>
      <div className="card"><h3><Icon n="target" s={18}/>Detection zone</h3>
        <p style={{margin:'0 0 12px',fontSize:'.86rem',color:'var(--mut)'}}>{Z.zone?'Only riders inside the yellow box are counted.':'Whole frame is used. Draw a box to count one lane or stop-line area only.'}</p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button className={'btn '+(Z.draw?'y':'p')} onClick={()=>Z.setDraw(!Z.draw)}>{Z.draw?'Drag on the video…':'Draw zone'}</button>
          {Z.zone&&<button className="btn g" onClick={Z.clear}>Clear zone</button>}</div></div>
      <div className="card"><h3><Icon n="list" s={18}/>Controls</h3>
        <label className="f" style={{marginTop:0}}>Detection confidence: <b>{live.conf}%</b></label>
        <input type="range" min="5" max="80" value={live.conf} onChange={e=>upd({conf:+e.target.value})}/>
        <div className="sw"><span>Beep alarm while NO HELMET is shown</span><input type="checkbox" checked={live.alarm} onChange={e=>upd({alarm:e.target.checked})}/></div>
        <div className="sw"><span>Save evidence snapshot</span><input type="checkbox" checked={live.snap} onChange={e=>upd({snap:e.target.checked})}/></div>
        <div className="sw"><span>Webcam face check (stricter)</span><input type="checkbox" checked={live.faceCheck} onChange={e=>upd({faceCheck:e.target.checked})}/></div>
        {live.faceCheck&&<><label className="f">Helmet strictness (webcam): <b>{live.strict}%</b></label><input type="range" min="40" max="90" value={live.strict} onChange={e=>upd({strict:+e.target.value})}/></>}</div>
    </div></div>
    <video ref={vid} playsInline muted style={{display:'none'}}/>
  </section>;
}
