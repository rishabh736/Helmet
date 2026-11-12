import {useEffect,useState} from 'react';
import {NavLink,Route,Routes,useLocation} from 'react-router-dom';
import Home from './pages/Home';import Detect from './pages/Detect';import Analyze from './pages/Analyze';
import Dashboard from './pages/Dashboard';import Reports from './pages/Reports';import Login from './pages/Login';
import {Features} from './pages/Info';import {Icon} from './Common';import {api,auth} from './api';
import {Masthead,Notif} from './Masthead';

const NAV=[['/','Home','home'],['/detect','Live Detection','camera'],['/analyze','Video Analysis','video'],['/dashboard','Dashboard','chart'],['/reports','Reports','file'],['/features','Features','list']];
const fs=d=>{const r=document.documentElement;r.style.fontSize=d===0?'16px':(parseFloat(getComputedStyle(r).fontSize)+d*2)+'px'};

export default function App(){
  const [me,setMe]=useState(null),[chk,setChk]=useState(!!auth.get());
  const [live,setLive]=useState({faceCheck:true,strict:60,ready:false,backend:'–',running:false,fps:0,conf:25,alarm:true,snap:true});
  const {pathname}=useLocation();
  useEffect(()=>{
    if(auth.get())api.me().then(m=>setMe({user:m.user,role:m.role})).catch(()=>auth.clear()).finally(()=>setChk(false));else setChk(false);
    const f=()=>setMe(null);window.addEventListener('hl-logout',f);return()=>window.removeEventListener('hl-logout',f)},[]);
  const logout=()=>{auth.clear();setMe(null)};
  if(chk)return null;
  if(!me)return <Login onLogin={setMe}/>;
  return <>
    <div className="util"><div className="container"><span>Road Safety Initiative</span>
      <span>Text size: <button onClick={()=>fs(-1)}>A-</button><button onClick={()=>fs(0)}>A</button><button onClick={()=>fs(1)}>A+</button></span></div></div>
    <Masthead/>
    <nav className="gnav" aria-label="Main"><div className="container">
      <div className="links">{NAV.map(([p,t,i])=><NavLink key={p} to={p} end className={({isActive})=>isActive?'on':''}><Icon n={i} s={16}/>{t}</NavLink>)}</div>
      <div className="stt"><span className={'chip '+(live.ready?'ok':'wait')}><span className="dot"/>{live.ready?'Model ready':'Loading model…'}</span>
        {live.running&&<span className="chip ok live"><span className="dot"/>Live</span>}</div>
      <span className="who">{me.user}<small>{me.role}</small></span>
      <button className="glogin" onClick={logout}><Icon n="logout" s={15}/>Logout</button>
    </div></nav>
    <Notif/>
    <main className={pathname==='/'?'home':''}><div className="container">
      <Detect hidden={pathname!=='/detect'} live={live} setLive={setLive}/>
      <Routes>
        <Route path="/" element={<Home live={live}/>}/><Route path="/detect" element={null}/>
        <Route path="/analyze" element={<Analyze live={live}/>}/>
        <Route path="/dashboard" element={<Dashboard live={live} me={me}/>}/>
        <Route path="/reports" element={<Reports me={me}/>}/>
        <Route path="/features" element={<Features/>}/><Route path="*" element={<Home live={live}/>}/>
      </Routes></div></main>
    <footer><div className="container">
      <div><h4>RIDER KAVACH</h4>Smart helmet compliance monitoring. AI-assisted detection of helmet use, with evidence capture and reporting.</div>
      <div><h4>Pages</h4>{NAV.map(([p,t])=><NavLink key={p} to={p}>{t}</NavLink>)}</div>
      <div><h4>Technology</h4><span>React · Node.js · Express</span><br/><span>YOLO11 · ONNX Runtime Web</span><br/><span>Dataset: Roboflow, CC BY 4.0</span></div></div>
      <div className="copy">© Rider Kavach. Ride Safe • Ride Smart. Detections are decision support and must be reviewed by a person.</div></footer>
  </>;
}
