import {useState} from 'react';import {api,auth} from '../api';import {Icon} from '../Common';import {Masthead} from '../Masthead';
export default function Login({onLogin}){
  const [u,setU]=useState(''),[p,setP]=useState(''),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
  const go=async e=>{e.preventDefault();setBusy(true);setErr('');
    try{const r=await api.login(u.trim(),p);auth.set(r.token);onLogin({user:r.user,role:r.role})}
    catch(x){setErr(x.message)}setBusy(false)};
  return <div className="login">
    <Masthead/>
    <form className="card lbox" onSubmit={go}>
      <div className="lic"><Icon n="lock" s={26}/></div><h2>Sign in</h2><p>Authorised users only</p>
      <label className="f">Username</label><input type="text" value={u} onChange={e=>setU(e.target.value)} autoFocus autoComplete="username"/>
      <label className="f">Password</label><input type="password" value={p} onChange={e=>setP(e.target.value)} autoComplete="current-password"/>
      {err&&<div className="lerr">{err}</div>}
      <button className="btn p big" style={{width:'100%',justifyContent:'center',marginTop:18}} disabled={busy||!u||!p}>{busy?'Signing in…':'Sign in'}</button>
      <small className="lh">First-time accounts: admin / admin123 and officer / officer123. Change them (see README).</small>
    </form></div>;
}
