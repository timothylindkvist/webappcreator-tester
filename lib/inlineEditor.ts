/**
 * Single source of truth for the inline editing toolbar.
 * Used by both the home page (main window) and custom pages (iframes).
 *
 * Before injecting on the home page, set window.__smRoot = <container element>
 * so that event handling and element marking are scoped to that container.
 * For custom pages the root defaults to document.body.
 */

export function buildEditorScript(palette: { brand: string; accent: string }): string {
  const brand = (palette.brand || '#7c3aed').replace(/['"\\]/g, '');
  const accent = (palette.accent || '#06b6d4').replace(/['"\\]/g, '');
  return `(function(){
var WIN=window,DOC=WIN.document;
// Hard singleton — if already initialised in this window, bail out.
// Call teardownEditorScript() first when a fresh init is required.
if(WIN.__smEditorActive)return;
WIN.__smEditorActive=true;
// ROOT scopes editable elements. Set WIN.__smRoot before injecting for home page.
var ROOT=WIN.__smRoot||DOC.body;
function isInRoot(el){return ROOT===DOC.body||ROOT.contains(el);}
// Mark editable elements within ROOT
var SELECTORS='h1,h2,h3,h4,h5,h6,p,span,li,button,td,th,label';
ROOT.querySelectorAll(SELECTORS).forEach(function(el){
  if(el.closest('nav'))return;
  el.contentEditable='true';
  el.setAttribute('data-editable','true');
});
ROOT.querySelectorAll('div,article').forEach(function(el){
  if(!el.children.length||el.closest('nav'))return;
  var bg=WIN.getComputedStyle(el).backgroundColor;
  if(bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent')el.setAttribute('data-sm-card','true');
});
// Edit-mode highlight styles
var st=DOC.createElement('style');
st.id='__sm_style';
st.textContent='[data-editable]:hover{outline:2px solid rgba(124,58,237,.5)!important;outline-offset:1px;cursor:text}[data-editable]:focus{outline:2px solid rgba(124,58,237,.9)!important;outline-offset:1px;outline-style:solid!important}[data-sm-card]:not([data-editable]):hover{outline:2px dashed rgba(124,58,237,.4)!important;outline-offset:2px;cursor:pointer}';
DOC.head.appendChild(st);
// Toolbar HTML
var PAL=['${brand}','${accent}','#ffffff','#111827','#ef4444','#22c55e'];
var SZ={S:'14px',M:'16px',L:'20px',XL:'28px'};
var SEP='<span style="display:inline-block;width:1px;height:14px;background:rgba(255,255,255,.12);flex-shrink:0"></span>';
var html='<span id="__sm_tc" style="display:flex;align-items:center;gap:3px">';
['S','M','L','XL'].forEach(function(s){html+='<button data-sz="'+s+'" style="padding:1px 5px;font-size:10px;font-weight:700;color:rgba(255,255,255,.5);background:none;border:none;cursor:pointer;border-radius:4px;line-height:1.7">'+s+'</button>';});
html+=SEP;
html+='<button data-bd="1" style="padding:1px 5px;font-size:11px;font-weight:900;color:rgba(255,255,255,.5);background:none;border:none;cursor:pointer;border-radius:4px;line-height:1.7">B</button>';
html+=SEP;
PAL.forEach(function(c){html+='<button data-tc="'+c+'" style="width:13px;height:13px;background:'+c+';border:1px solid rgba(255,255,255,.3);border-radius:50%;cursor:pointer;padding:0;flex-shrink:0"></button>';});
html+='<label style="width:14px;height:14px;border:1px solid rgba(255,255,255,.2);border-radius:3px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:8px;color:rgba(255,255,255,.4);flex-shrink:0;position:relative"><span style="pointer-events:none">✏</span><input type="color" data-tc-c="1" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%"></label>';
html+=SEP;
['L','C','R'].forEach(function(a,i){var al=['left','center','right'][i];html+='<button data-al="'+al+'" style="padding:1px 4px;font-size:11px;color:rgba(255,255,255,.5);background:none;border:none;cursor:pointer;border-radius:4px;line-height:1.7">'+a+'</button>';});
html+='</span>';
html+='<span id="__sm_bx" style="display:none;align-items:center;gap:3px">'+SEP+'<span style="font-size:9px;color:rgba(255,255,255,.3);padding:0 2px">Box</span>';
PAL.forEach(function(c){html+='<button data-bc="'+c+'" style="width:13px;height:13px;background:'+c+';border:1px solid rgba(255,255,255,.3);border-radius:3px;cursor:pointer;padding:0;flex-shrink:0"></button>';});
html+='<label style="width:14px;height:14px;border:1px solid rgba(255,255,255,.2);border-radius:3px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:8px;color:rgba(255,255,255,.4);flex-shrink:0;position:relative"><span style="pointer-events:none">✏</span><input type="color" data-bc-c="1" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%"></label>';
html+='</span>';
html+=SEP+'<button data-sm-close="1" style="background:none;border:none;color:rgba(255,255,255,.35);cursor:pointer;font-size:15px;padding:1px 5px;line-height:1;flex-shrink:0;border-radius:4px" title="Close">−</button>';
var tb=DOC.createElement('div');
tb.id='__sm_tb';
Object.assign(tb.style,{position:'fixed',top:'-200px',left:'8px',display:'none',alignItems:'center',gap:'3px',padding:'5px 8px',background:'#1e1e30',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',boxShadow:'0 8px 32px rgba(0,0,0,.5)',zIndex:'99999',fontFamily:'system-ui,sans-serif'});
tb.innerHTML=html;
DOC.body.appendChild(tb);
var ae=null,ce=null;
function findCard(el){var p=el.parentElement;while(p&&p.tagName!=='BODY'){var bg=WIN.getComputedStyle(p).backgroundColor;if(bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent'){var t=p.tagName;if(t!=='SECTION'&&t!=='MAIN'&&t!=='BODY'&&t!=='HTML'&&t!=='HEADER'&&t!=='FOOTER'&&t!=='NAV')return p;}p=p.parentElement;}return null;}
function closeTb(){tb.style.display='none';ae=null;ce=null;}
function showTb(el){
  tb.style.display='none';
  var r=el.getBoundingClientRect(),h=46,t=r.top-h-6;
  if(t<4)t=r.bottom+6;
  tb.style.top=Math.max(4,t)+'px';
  tb.style.left=Math.max(4,Math.min(WIN.innerWidth-360,r.left))+'px';
  tb.style.display='flex';
}
WIN.__smTbMd=function(e){
  if(tb.contains(e.target))return;
  var inRoot=ROOT===DOC.body||ROOT.contains(e.target);
  if(inRoot){
    var t=e.target;
    while(t&&t.tagName!=='BODY'){
      if((t.getAttribute&&t.getAttribute('data-editable'))||(t.getAttribute&&t.getAttribute('data-sm-card')))return;
      t=t.parentElement;
    }
  }
  closeTb();
};
DOC.addEventListener('mousedown',WIN.__smTbMd,true);
WIN.__smTbClick=function(e){
  if(tb.contains(e.target))return;
  var inRoot=ROOT===DOC.body||ROOT.contains(e.target);
  if(!inRoot){closeTb();return;}
  var t=e.target;
  while(t&&t.tagName!=='BODY'){
    if(t.getAttribute&&t.getAttribute('data-editable')){
      ae=t;ce=findCard(ae);
      var bx=DOC.getElementById('__sm_bx');
      var tc=DOC.getElementById('__sm_tc');
      if(bx)bx.style.display=ce?'flex':'none';
      if(tc)tc.style.display='flex';
      showTb(ae);
      ae.focus();
      return;
    }
    t=t.parentElement;
  }
  var c2=e.target;
  while(c2&&c2.tagName!=='BODY'){
    if(c2.getAttribute&&c2.getAttribute('data-sm-card')){
      ce=c2;ae=null;
      var bx2=DOC.getElementById('__sm_bx');
      var tc2=DOC.getElementById('__sm_tc');
      if(bx2)bx2.style.display='flex';
      if(tc2)tc2.style.display='none';
      showTb(c2);
      return;
    }
    c2=c2.parentElement;
  }
  closeTb();
};
DOC.addEventListener('click',WIN.__smTbClick,true);
tb.addEventListener('mousedown',function(e){e.preventDefault();var t=e.target;while(t&&t!==tb){if(t.dataset){if(t.dataset.smClose){closeTb();return;}if(t.dataset.sz&&ae&&SZ[t.dataset.sz])ae.style.fontSize=SZ[t.dataset.sz];if(t.dataset.bd&&ae){var fw=parseInt(WIN.getComputedStyle(ae).fontWeight)||400;ae.style.fontWeight=fw>=600?'normal':'bold';}if(t.dataset.tc&&ae)ae.style.color=t.dataset.tc;if(t.dataset.bc&&ce)ce.style.background=t.dataset.bc;if(t.dataset.al&&ae)ae.style.textAlign=t.dataset.al;}t=t.parentElement;}if(ae)ae.focus();});
tb.addEventListener('change',function(e){var t=e.target;if(!t||!t.dataset)return;if(t.dataset.tcC&&ae)ae.style.color=t.value;if(t.dataset.bcC&&ce)ce.style.background=t.value;});
WIN.__smTbBlur=function(e){
  if(!e.target.getAttribute||!e.target.getAttribute('data-editable'))return;
  if(!isInRoot(e.target))return;
  if(WIN===WIN.parent)return;
  try{WIN.parent.postMessage({type:'sidesmith:page-update',html:'<!DOCTYPE html>'+DOC.documentElement.outerHTML},'*');}catch(x){}
};
DOC.addEventListener('blur',WIN.__smTbBlur,true);
})();`;
}

export function teardownEditorScript(win: Window): void {
  const doc = win.document;
  const iwin = win as any;
  doc.querySelectorAll<HTMLElement>('[data-editable]').forEach((el) => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('data-editable');
  });
  doc.querySelectorAll<HTMLElement>('[data-sm-card]').forEach((el) => {
    el.removeAttribute('data-sm-card');
  });
  doc.getElementById('__sm_style')?.remove();
  doc.getElementById('__sm_tb')?.remove();
  if (iwin.__smTbClick) { doc.removeEventListener('click', iwin.__smTbClick, true); iwin.__smTbClick = null; }
  if (iwin.__smTbMd) { doc.removeEventListener('mousedown', iwin.__smTbMd, true); iwin.__smTbMd = null; }
  if (iwin.__smTbBlur) { doc.removeEventListener('blur', iwin.__smTbBlur, true); iwin.__smTbBlur = null; }
  iwin.__smEditorActive = false;
  iwin.__smRoot = null;
}
