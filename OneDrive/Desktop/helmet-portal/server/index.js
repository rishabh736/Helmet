const express=require('express'),cors=require('cors'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const app=express();
app.use(cors());
app.use((q,r,n)=>{r.set({'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'credentialless'});n()});
app.use(express.json({limit:'6mb'}));
const D=process.env.DATA_DIR||path.join(__dirname,'data'),EV=path.join(D,'evidence'),DB=path.join(D,'db.json'),UF=path.join(D,'users.json'),KF=path.join(D,'secret.key');
fs.mkdirSync(EV,{recursive:true});

/* ---------- users, login, tokens ---------- */
const hp=(p,s)=>crypto.scryptSync(p,s,32).toString('hex');
const mk=(user,p,role)=>{const salt=crypto.randomBytes(8).toString('hex');return {user,salt,hash:hp(p,salt),role}};
let users;try{users=JSON.parse(fs.readFileSync(UF,'utf8'))}catch(e){
  users=[mk('admin',process.env.ADMIN_PASSWORD||'admin123','admin'),mk('officer',process.env.OFFICER_PASSWORD||'officer123','officer')];
  fs.writeFileSync(UF,JSON.stringify(users,null,1));}
let secret;try{secret=fs.readFileSync(KF,'utf8')}catch(e){secret=crypto.randomBytes(32).toString('hex');fs.writeFileSync(KF,secret)}
const sig=b=>crypto.createHmac('sha256',secret).update(b).digest('base64url');
const sign=o=>{const b=Buffer.from(JSON.stringify(o)).toString('base64url');return b+'.'+sig(b)};
const verify=t=>{try{const [b,s]=String(t).split('.');if(!s||sig(b)!==s)return null;const o=JSON.parse(Buffer.from(b,'base64url').toString());return o.exp>Date.now()?o:null}catch(e){return null}};
const fails={};
app.post('/api/login',(q,r)=>{
  const ip=q.ip,now=Date.now(),f=(fails[ip]=(fails[ip]||[]).filter(t=>now-t<60000));
  if(f.length>=10)return r.status(429).json({error:'Too many attempts. Wait a minute.'});
  const {user,pass}=q.body||{},u=users.find(x=>x.user===user);
  if(!u||!crypto.timingSafeEqual(Buffer.from(hp(String(pass||''),u.salt),'hex'),Buffer.from(u.hash,'hex'))){f.push(now);return r.status(401).json({error:'Wrong username or password'})}
  r.json({token:sign({u:u.user,role:u.role,exp:now+12*3600e3}),user:u.user,role:u.role});
});
const auth=(q,r,n)=>{const t=(q.headers.authorization||'').replace('Bearer ','')||q.query.token,p=verify(t);
  if(!p)return r.status(401).json({error:'unauthorized'});q.user=p;n()};
const admin=(q,r,n)=>q.user.role==='admin'?n():r.status(403).json({error:'Admin only'});
app.use('/api',(q,r,n)=>q.path==='/login'?n():auth(q,r,n));
app.use('/evidence',auth,express.static(EV));

/* ---------- data ---------- */
const fresh=()=>({incidents:[],days:{}});
let db=fresh();try{db={...fresh(),...JSON.parse(fs.readFileSync(DB,'utf8'))}}catch(e){}
const save=()=>fs.writeFileSync(DB,JSON.stringify(db));
const ymd=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const filt=q=>{const {from,to,minConf,camera}=q;
  return db.incidents.filter(i=>(!from||ymd(i.t)>=from)&&(!to||ymd(i.t)<=to)&&(!minConf||i.confidence>=+minConf)&&(!camera||i.camera===camera))};
const dayTotals=(date,camera)=>{const d=db.days[date]||{};let ok=0,bad=0;
  for(const c in d){if(camera&&c!==camera)continue;ok+=d[c].ok;bad+=d[c].bad}return {ok,bad}};
let seq=0;

app.get('/api/me',(q,r)=>r.json({user:q.user.u,role:q.user.role}));
app.get('/api/stats',(q,r)=>{
  let ok=0,bad=0;for(const dt in db.days){const t=dayTotals(dt);ok+=t.ok;bad+=t.bad}
  r.json({viol:db.incidents.length,ok,bad,today:db.incidents.filter(i=>ymd(i.t)===ymd(Date.now())).length});
});
app.post('/api/riders',(q,r)=>{
  const cam=String(q.body.camera||'Camera 1').slice(0,40),d=ymd(Date.now());
  db.days[d]=db.days[d]||{};const x=db.days[d][cam]=db.days[d][cam]||{ok:0,bad:0};
  q.body.bad?x.bad++:x.ok++;save();r.json({ok:true});
});
app.post('/api/incidents',(q,r)=>{
  const id=Date.now()*1000+(seq++%1000);let image='';
  const m=/^data:image\/jpeg;base64,(.+)$/.exec(q.body.image||'');
  if(m){fs.writeFileSync(path.join(EV,id+'.jpg'),Buffer.from(m[1],'base64'));image='/evidence/'+id+'.jpg'}
  db.incidents.unshift({id,t:Date.now(),confidence:Number(q.body.confidence)||0,image,
    camera:String(q.body.camera||'Camera 1').slice(0,40),source:String(q.body.source||'live').slice(0,12)});
  save();r.json({ok:true,id});
});
app.get('/api/incidents',(q,r)=>r.json(filt(q.query).slice(0,Math.min(+q.query.limit||60,500))));
app.get('/api/incidents.csv',(q,r)=>{
  const rows=filt(q.query),e=s=>'"'+String(s).replace(/"/g,'""')+'"';
  r.set({'Content-Type':'text/csv','Content-Disposition':'attachment; filename=helmet_violations.csv'})
   .send(['No,Date and time,Camera,Source,Confidence %'].concat(rows.map((i,n)=>[rows.length-n,e(new Date(i.t).toLocaleString('en-IN')),e(i.camera),i.source||'live',i.confidence].join(','))).join('\n'));
});
app.get('/api/cameras',(q,r)=>{
  const s=new Set(db.incidents.map(i=>i.camera));for(const d in db.days)Object.keys(db.days[d]).forEach(c=>s.add(c));
  r.json([...s].filter(Boolean).sort());
});
app.get('/api/analytics',(q,r)=>{
  const {camera}=q.query,to=q.query.to||ymd(Date.now()),P=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
  const end=P(to);let start;
  if(q.query.from)start=P(q.query.from);else{start=new Date(end);start.setDate(start.getDate()-13)}
  const min=new Date(end);min.setDate(min.getDate()-119);if(start<min)start=min;
  const from=ymd(start),inc=filt({from,to,camera}),daily=[];
  for(const d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const k=ymd(d),t=dayTotals(k,camera);daily.push({date:k,viol:inc.filter(i=>ymd(i.t)===k).length,ok:t.ok,bad:t.bad});
  }
  const heat=Array.from({length:7},()=>Array(24).fill(0)),cams={};
  inc.forEach(i=>{const d=new Date(i.t);heat[(d.getDay()+6)%7][d.getHours()]++;cams[i.camera]=(cams[i.camera]||0)+1});
  const totals=daily.reduce((a,x)=>({viol:a.viol+x.viol,ok:a.ok+x.ok,bad:a.bad+x.bad}),{viol:0,ok:0,bad:0});
  r.json({from,to,daily,heat,cams,totals});
});
app.delete('/api/data',admin,(q,r)=>{
  fs.readdirSync(EV).forEach(f=>fs.unlinkSync(path.join(EV,f)));db=fresh();save();r.json({ok:true});
});

const dist=path.join(__dirname,'..','client','dist');
if(fs.existsSync(dist)){app.use(express.static(dist));app.get('*',(q,r)=>r.sendFile(path.join(dist,'index.html')))}
const PORT=process.env.PORT||5050;
app.listen(PORT,()=>console.log('Helmet portal API on http://localhost:'+PORT));
