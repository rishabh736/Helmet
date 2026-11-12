import {Icon} from './Common';
export const Logo=({s=84})=><img src="/logo.png" width={s} height={s} alt="Rider Kavach logo" style={{display:'block',borderRadius:'50%'}}/>;
export const Wordmark=({tag=true})=><div className="wm"><div className="wm1">RIDER</div><div className="wm2">KAVACH</div>
  {tag&&<div className="wm3"><i/>RIDE SAFE • RIDE SMART<i/></div>}</div>;
export const Masthead=()=><header className="gh"><div className="container ghi">
  <Logo s={92}/><Wordmark/>
  <div className="gt"><div className="gk">SMART HELMET COMPLIANCE MONITORING</div><div className="gs">AI-assisted road-safety enforcement support system</div></div></div></header>;
export const Notif=()=><div className="notif"><span className="nl"><Icon n="bell" s={14}/>Notice</span>
  <div className="nt"><span>Detections are decision support and <b>must be reviewed by a person</b> before any action is taken. &nbsp;•&nbsp; Wearing a helmet greatly reduces the risk of <b>fatal head injury</b>. &nbsp;•&nbsp; Violation evidence is stored on the server and is visible <b>only to signed-in users</b>.</span></div></div>;
