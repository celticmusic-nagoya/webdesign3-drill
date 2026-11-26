/* Shared touch and mouse navigation for study readers. No external dependencies. */
(function(root){
'use strict';
function direction(dx,dy,elapsed){return elapsed<=900&&Math.abs(dx)>=56&&Math.abs(dx)>=Math.abs(dy)*1.6?(dx<0?1:-1):0}
function edgeDirection(x,width){
 if(!Number.isFinite(x)||!Number.isFinite(width)||width<160||x<0||x>=width)return 0;
 const edge=Math.min(64,Math.max(28,width*.12));
 return x<edge?-1:x>=width-edge?1:0;
}
// The displayed page can be much narrower than its scroll container in fit-page mode.
// Include both the image edge and the adjacent blank margin; preserve a neutral center.
function pageEdgeDirection(x,left,width){
 if(!Number.isFinite(x)||!Number.isFinite(left)||!Number.isFinite(width)||width<=0)return 0;
 const edge=Math.min(64,Math.max(28,width*.12),width*.25);
 return x<left+edge?-1:x>=left+width-edge?1:0;
}
function bind(surface,{previous,next,canTurn=()=>true,canPrevious=()=>true,canNext=()=>true,pageElement=()=>null}){
 if(!surface)return;
 let start=null,mouseStart=null,lastTouch=0,edgeHover=0;
 const available=dir=>dir===-1?canPrevious():dir===1?canNext():false;
 const turn=dir=>{if(!available(dir))return;if(dir===1)next();else previous()};
 const hasSelection=()=>{const selected=root.getSelection&&root.getSelection();return selected&&!selected.isCollapsed};
 const edgeAt=e=>{
  const rect=surface.getBoundingClientRect();
  const x=e.clientX-rect.left-surface.clientLeft,y=e.clientY-rect.top-surface.clientTop;
  if(y<0||y>=surface.clientHeight||x<0||x>=surface.clientWidth)return 0;
  const page=pageElement(),bounds=page?.getBoundingClientRect();
  if(bounds&&bounds.width>0&&bounds.height>0&&bounds.width<=surface.clientWidth+1){
   return pageEdgeDirection(e.clientX,bounds.left,bounds.width);
  }
  return edgeDirection(x,surface.clientWidth);
 };
 const hover=dir=>{
  if(edgeHover===dir)return;edgeHover=dir;
  surface.classList.toggle('study-edge-hover',dir!==0);
  if(dir)surface.style.cursor='pointer';else surface.style.removeProperty('cursor');
 };
 surface.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'){hover(0);return}
  if(mouseStart&&Math.hypot(e.clientX-mouseStart.x,e.clientY-mouseStart.y)>7)mouseStart=null;
  const dir=!interactive(e.target)&&canTurn(e.target)&&!e.buttons?edgeAt(e):0;
  hover(available(dir)?dir:0);
 },{passive:true});
 surface.addEventListener('pointerleave',()=>{hover(0);mouseStart=null},{passive:true});
 surface.addEventListener('pointercancel',()=>{hover(0);mouseStart=null},{passive:true});
 surface.addEventListener('pointerdown',e=>{
  mouseStart=null;
  if(e.pointerType!=='mouse'||e.button!==0||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||interactive(e.target)||!canTurn(e.target))return;
  const dir=edgeAt(e);if(available(dir))mouseStart={x:e.clientX,y:e.clientY,dir};
 },{passive:true});
 surface.addEventListener('click',e=>{
  const started=mouseStart;mouseStart=null;
  if(!started||e.button!==0||e.detail===0||Date.now()-lastTouch<500||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||interactive(e.target)||!canTurn(e.target)||hasSelection())return;
  const dir=edgeAt(e);
  if(dir!==started.dir||!available(dir)||Math.hypot(e.clientX-started.x,e.clientY-started.y)>7)return;
  e.preventDefault();e.stopImmediatePropagation();hover(0);turn(dir);
 },true);
 const reset=()=>{start=null};
 const interactive=target=>target.closest&&target.closest('a,button,input,select,textarea,label,[contenteditable=true]');
 surface.addEventListener('touchstart',e=>{
  lastTouch=Date.now();mouseStart=null;hover(0);reset();if(e.touches.length!==1||interactive(e.target)||!canTurn(e.target))return;
  const t=e.touches[0];if(t.clientX<24||t.clientX>root.innerWidth-24)return;
  start={id:t.identifier,x:t.clientX,y:t.clientY,time:Date.now()};
 },{passive:true});
 surface.addEventListener('touchmove',e=>{
  if(!start)return;if(e.touches.length!==1){reset();return}
  const t=e.touches[0];if(t.identifier!==start.id){reset();return}
  const dx=t.clientX-start.x,dy=t.clientY-start.y;
  if(Math.abs(dy)>18&&Math.abs(dy)>Math.abs(dx)){reset()}
 },{passive:true});
 surface.addEventListener('touchcancel',reset,{passive:true});
 surface.addEventListener('touchend',e=>{
  const s=start;reset();if(!s||e.touches.length||!canTurn(e.target))return;
  const t=Array.from(e.changedTouches).find(t=>t.identifier===s.id);if(!t)return;
  const selected=root.getSelection&&root.getSelection();if(selected&&!selected.isCollapsed)return;
  const dir=direction(t.clientX-s.x,t.clientY-s.y,Date.now()-s.time);
  turn(dir);
 },{passive:true});
}
root.StudySwipe={bind,direction,edgeDirection,pageEdgeDirection};
})(window);
