/* MediaPipe face detector: finds the person in close-up webcam view */
let fd=null,res=null;
export async function initFace(){
  if(fd)return true;const FD=window.FaceDetection;if(!FD)return false;
  fd=new FD({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${f}`});
  fd.setOptions({model:'short',minDetectionConfidence:.5});fd.onResults(r=>{res=r});
  await fd.initialize();return true;
}
export async function faces(src,W,H){
  if(!fd)return [];res=null;await fd.send({image:src});
  return ((res&&res.detections)||[]).map(x=>{const b=x.boundingBox;
    return {x:(b.xCenter-b.width/2)*W,y:(b.yCenter-b.height/2)*H,w:b.width*W,h:b.height*H,s:0.85}});
}
