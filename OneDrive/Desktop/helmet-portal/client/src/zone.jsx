import {useRef,useState} from 'react';
export const inZone=(z,d,w,h)=>{if(!z)return true;const cx=(d.x+d.w/2)/w,cy=(d.y+d.h/2)/h;return cx>=z.x&&cx<=z.x+z.w&&cy>=z.y&&cy<=z.y+z.h};
export function useZone(){
  const [zone,setZone]=useState(()=>{try{return JSON.parse(localStorage.getItem('hl_zone'))}catch(e){return null}});
  const [draw,setDraw]=useState(false),[tmp,setTmp]=useState(null),st=useRef(null),tr=useRef(null);
  const save=z=>{setZone(z);if(z)localStorage.setItem('hl_zone',JSON.stringify(z));else localStorage.removeItem('hl_zone')};
  const pt=e=>{const r=e.currentTarget.getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))]};
  const h={onMouseDown:e=>{st.current=pt(e)},
    onMouseMove:e=>{if(!st.current)return;const p=pt(e),s=st.current;tr.current={x:Math.min(s[0],p[0]),y:Math.min(s[1],p[1]),w:Math.abs(p[0]-s[0]),h:Math.abs(p[1]-s[1])};setTmp(tr.current)},
    onMouseUp:()=>{if(!st.current)return;st.current=null;const t=tr.current;tr.current=null;setTmp(null);setDraw(false);if(t&&t.w>.05&&t.h>.05)save(t)}};
  return {zone,tmp,draw,setDraw,clear:()=>save(null),h};
}
export const ZoneBox=({z,light})=>z?<div style={{position:'absolute',left:z.x*100+'%',top:z.y*100+'%',width:z.w*100+'%',height:z.h*100+'%',border:'2px dashed #fbbf24',boxShadow:light?'none':'0 0 0 9999px rgba(2,6,23,.45)',pointerEvents:'none'}}/>:null;
export const ZoneLayer=({Z})=><><ZoneBox z={Z.zone}/><ZoneBox z={Z.tmp} light/>{Z.draw&&<div style={{position:'absolute',inset:0,cursor:'crosshair'}} {...Z.h}/>}</>;
