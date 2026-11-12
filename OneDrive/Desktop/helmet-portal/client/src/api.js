import {useEffect,useState} from 'react';
export const auth={get:()=>localStorage.getItem('hl_token')||'',set:t=>localStorage.setItem('hl_token',t),clear:()=>localStorage.removeItem('hl_token')};
const BASE=(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
const call=async(u,m='GET',b)=>{
  const r=await fetch(BASE+'/api'+u,{method:m,headers:{'Content-Type':'application/json',Authorization:'Bearer '+auth.get()},body:b?JSON.stringify(b):undefined});
  if(r.status===401&&u!=='/login'){auth.clear();window.dispatchEvent(new Event('hl-logout'))}
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Request failed');return j};
export const qs=o=>Object.entries(o||{}).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
export const withToken=u=>BASE+u+(u.includes('?')?'&':'?')+'token='+encodeURIComponent(auth.get());
export const api={login:(user,pass)=>call('/login','POST',{user,pass}),me:()=>call('/me'),stats:()=>call('/stats'),
  incidents:f=>call('/incidents?'+qs(f)),analytics:f=>call('/analytics?'+qs(f)),cameras:()=>call('/cameras'),
  rider:(bad,camera)=>call('/riders','POST',{bad,camera}),incident:b=>call('/incidents','POST',b),clear:()=>call('/data','DELETE')};
export const rate=s=>s.ok+s.bad?Math.round(100*s.ok/(s.ok+s.bad))+'%':'–';
export function useStats(ms=2000){
  const [s,set]=useState({viol:0,ok:0,bad:0,today:0});
  useEffect(()=>{const f=()=>api.stats().then(set).catch(()=>{});f();const t=setInterval(f,ms);return()=>clearInterval(t)},[]);
  return s;
}
