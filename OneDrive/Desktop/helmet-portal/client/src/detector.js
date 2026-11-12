let sess=null,YS=640,buf=null,maxScore=0;
export const lastMax=()=>maxScore;
const yc=document.createElement('canvas'),yx=yc.getContext('2d',{willReadFrequently:true});
export async function loadModel(url,size=640,pref='auto'){
  const ort=window.ort;if(!ort)throw new Error('onnxruntime-web did not load (check internet)');
  ort.env.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/';
  ort.env.wasm.numThreads=Math.min(4,navigator.hardwareConcurrency||1);
  YS=size;yc.width=yc.height=YS;buf=new Float32Array(3*YS*YS);
  const res=await fetch(url);if(!res.ok)throw new Error('best.onnx not found');
  const bytes=new Uint8Array(await res.arrayBuffer()),o={graphOptimizationLevel:'all'};
  try{if(!navigator.gpu||pref==='cpu')throw 0;sess=await ort.InferenceSession.create(bytes,{...o,executionProviders:['webgpu']});return 'GPU (WebGPU)'}
  catch(e){sess=await ort.InferenceSession.create(bytes,{...o,executionProviders:['wasm']});return 'CPU (WASM)'}
}
/* returns [{x,y,w,h,s,c}] ; class 0 = Helmet, class 1 = NoHelmet */
async function run(src,W,H,thr){
  const ort=window.ort,r=Math.min(YS/W,YS/H),nw=Math.round(W*r),nh=Math.round(H*r),dx=(YS-nw)/2,dy=(YS-nh)/2;
  yx.fillStyle='#727272';yx.fillRect(0,0,YS,YS);yx.drawImage(src,dx,dy,nw,nh);
  const p=yx.getImageData(0,0,YS,YS).data,n=YS*YS;
  for(let i=0;i<n;i++){buf[i]=p[i*4]/255;buf[n+i]=p[i*4+1]/255;buf[2*n+i]=p[i*4+2]/255}
  const out=await sess.run({[sess.inputNames[0]]:new ort.Tensor('float32',buf,[1,3,YS,YS])});
  const o=out[sess.outputNames[0]],dm=o.dims,d=o.data;let N,C,get;
  if(dm[1]<dm[2]){C=dm[1];N=dm[2];get=(i,k)=>d[k*N+i]}else{N=dm[1];C=dm[2];get=(i,k)=>d[i*C+k]}
  const bx=[];maxScore=0;
  for(let i=0;i<N;i++){let b=0,bc=0;for(let k=0;k<C-4;k++){const v=get(i,4+k);if(v>b){b=v;bc=k}}
    if(b>maxScore)maxScore=b;
    if(b<thr)continue;const cx=get(i,0),cy=get(i,1),w=get(i,2),h=get(i,3);
    bx.push({x:(cx-w/2-dx)/r,y:(cy-h/2-dy)/r,w:w/r,h:h/r,s:b,c:bc,s0:get(i,4),s1:C>5?get(i,5):0})}
  bx.sort((a,b)=>b.s-a.s);const keep=[];
  bx.forEach(b=>{if(!keep.some(k=>{if(k.c!==b.c)return false;
    const iw=Math.min(k.x+k.w,b.x+b.w)-Math.max(k.x,b.x),ih=Math.min(k.y+k.h,b.y+b.h)-Math.max(k.y,b.y);
    if(iw<=0||ih<=0)return false;const i=iw*ih;return i/(k.w*k.h+b.w*b.h-i)>.45}))keep.push(b)});
  return keep;
}

let chain=Promise.resolve();
export const detect=(...a)=>{const p=chain.then(()=>run(...a));chain=p.catch(()=>{});return p};
