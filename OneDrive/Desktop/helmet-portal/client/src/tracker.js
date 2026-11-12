/* Simple multi-object tracker: gives every rider an ID and decides Helmet/NoHelmet by majority vote. */
export class Tracker{
  constructor(minHits=6){this.t=[];this.n=1;this.min=minHits}
  update(dets){
    const pairs=[];
    this.t.forEach((tr,ti)=>dets.forEach((d,di)=>{
      const dist=Math.hypot(tr.box.x+tr.box.w/2-d.x-d.w/2,tr.box.y+tr.box.h/2-d.y-d.h/2)/Math.max(tr.box.w,tr.box.h,d.w,d.h,1);
      if(dist<1.1)pairs.push([dist,ti,di])}));
    pairs.sort((a,b)=>a[0]-b[0]);
    const ut=new Set(),ud=new Set();
    pairs.forEach(([,ti,di])=>{
      if(ut.has(ti)||ud.has(di))return;ut.add(ti);ud.add(di);
      const tr=this.t[ti],d=dets[di];tr.box=d;tr.miss=0;tr.hits++;tr.conf=d.s;
      if(d.c===1)tr.badMax=Math.max(tr.badMax||0,d.s);
      tr.votes.push(d.c);if(tr.votes.length>9)tr.votes.shift()});
    this.t.forEach((tr,ti)=>{if(!ut.has(ti))tr.miss++});
    dets.forEach((d,di)=>{if(!ud.has(di))this.t.push({id:this.n++,box:d,miss:0,hits:1,conf:d.s,badMax:d.c===1?d.s:0,votes:[d.c],counted:false,cls:d.c})});
    this.t=this.t.filter(tr=>tr.miss<=8);
    const events=[];
    this.t.forEach(tr=>{
      tr.cls=tr.votes.filter(v=>v===1).length*2>tr.votes.length?1:0;
      if(!tr.counted&&tr.hits>=this.min){tr.counted=true;events.push({type:tr.cls?'bad':'ok',tr})}});
    return {active:this.t.filter(tr=>tr.miss===0),events};
  }
}
