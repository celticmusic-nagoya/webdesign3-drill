/* Shared touch navigation for study readers. No dependency on external scripts. */
(function(root){
'use strict';
function direction(dx,dy,elapsed){return elapsed<=900&&Math.abs(dx)>=56&&Math.abs(dx)>=Math.abs(dy)*1.6?(dx<0?1:-1):0}
function bind(surface,{previous,next,canTurn=()=>true}){
 if(!surface)return;
 let start=null;
 const reset=()=>{start=null};
 const interactive=target=>target.closest&&target.closest('a,button,input,select,textarea,label,[contenteditable=true]');
 surface.addEventListener('touchstart',e=>{
  reset();if(e.touches.length!==1||interactive(e.target)||!canTurn(e.target))return;
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
  if(dir===1)next();else if(dir===-1)previous();
 },{passive:true});
}
root.StudySwipe={bind,direction};
})(window);
