export function drawTracks(x,active){
  x.font='bold 15px Inter,Arial';
  active.forEach(t=>{if(t.hits<2)return;const b=t.box,bad=t.cls===1,col=bad?'#ef4444':'#22c55e';
    x.strokeStyle=col;x.lineWidth=Math.max(3,x.canvas.width/200);x.strokeRect(b.x,b.y,b.w,b.h);
    const s=`#${t.id} ${bad?'NO HELMET':'HELMET'} ${Math.round(t.conf*100)}%`,w=x.measureText(s).width+14,y=Math.max(24,b.y);
    x.fillStyle=col;x.fillRect(b.x,y-24,w,24);x.fillStyle='#fff';x.fillText(s,b.x+7,y-7)});
}
export function snap(c,box){
  const k=320/c.width,t=document.createElement('canvas');t.width=320;t.height=Math.round(c.height*k);
  const x=t.getContext('2d');x.drawImage(c,0,0,t.width,t.height);x.strokeStyle='#ef4444';x.lineWidth=3;
  x.strokeRect(box.x*k,box.y*k,box.w*k,box.h*k);return t.toDataURL('image/jpeg',.75);
}
