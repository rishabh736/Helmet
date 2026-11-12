/* Stricter decision for close-up webcam view.
   A helmet is only reported when the model is confident AND the helmet box sits around a face.
   A visible face with no confident helmet around it is reported as NO HELMET. */
const inside=(d,x,y)=>x>d.x&&x<d.x+d.w&&y>d.y&&y<d.y+d.h;
export function fuse(dets,faces,W,H,strict=.6){
  const helm=dets.filter(d=>d.c===0&&d.s0>=strict&&d.s0>d.s1*1.5);
  const bad=dets.filter(d=>d.c===1);
  if(!faces.length)return helm.concat(bad);            // no face visible: YOLO only, with the strict helmet rule
  return faces.map(f=>{
    const cx=f.x+f.w/2,cy=f.y+f.h/2;
    const h=helm.filter(d=>inside(d,cx,cy)&&d.w*d.h>=1.2*f.w*f.h&&d.y<f.y-.1*f.h).sort((a,b)=>b.s0-a.s0)[0];
    if(h)return {...h,s:h.s0};
    const b=bad.filter(d=>inside(d,cx,cy)).sort((a,b)=>b.s1-a.s1)[0];
    const w=f.w*1.35,hh=f.h*1.75,x0=Math.max(0,cx-w/2),y0=Math.max(0,f.y-.6*f.h);
    return {x:x0,y:y0,w:Math.min(W-x0,w),h:Math.min(H-y0,hh),s:b?b.s1:Math.max(f.s,.6),c:1,s0:0,s1:b?b.s1:0};
  });
}
