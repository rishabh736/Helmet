import {Icon,PageHead} from '../Common';
const F=[['cpu','b','YOLO11 ONNX detector','Fast two-class model: Helmet and NoHelmet, in the browser.'],['zap','y','GPU acceleration','WebGPU when available, automatic CPU fallback.'],
['users','g','Rider tracking','Every rider gets an ID and is counted once; majority vote removes flicker.'],['target','b','Detection zone','Draw a box so only one lane or stop-line area is counted.'],
['video','b','Video analysis','Upload recorded footage and get a full violation report.'],['camera','b','Multiple sources','Webcam, ESP32-CAM stream, uploaded photo or video.'],
['bell','y','Audible alarm','Beeps when a new violation is confirmed.'],['image','r','Evidence snapshots','Photo with the rider boxed, stored on the server.'],
['filter','b','Dashboard filters','By date range, camera and minimum confidence.'],['chart','g','Trends and heatmap','Daily trend, compliance line, weekday x hour heatmap, per-camera totals.'],
['file','g','PDF reports','Printable report with summary, daily table and evidence photos.'],['lock','r','Login and roles','Admin and officer accounts; only admins can delete data.']];
export const Features=()=><><PageHead icon="list" title="Features" sub="Everything this system provides"/>
  <div className="grid">{F.map(([i,c,t,d])=><div className="card fc" key={t}><div className={'ic '+c}><Icon n={i}/></div><h3>{t}</h3><p>{d}</p></div>)}</div></>;
