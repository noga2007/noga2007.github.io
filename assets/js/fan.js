/* Noga Adel — fan zone: Joy Capsule + Noga Bestie Meter.
   Data lives in content/joy.json and content/bestie.json. */
(function(){
"use strict";

/* ---------- pure helpers (also used by the build/test script) ---------- */
function normalize(s){
  s=String(s==null?'':s).toLowerCase();
  s=s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'');            // tashkeel + tatweel
  s=s.replace(/[\u0623\u0625\u0622]/g,'\u0627');                          // أ إ آ -> ا
  s=s.replace(/\u0629/g,'\u0647');                                         // ة -> ه
  s=s.replace(/\u0649/g,'\u064A');                                         // ى -> ي
  s=s.replace(/[\u0660-\u0669]/g,function(c){return String(c.charCodeAt(0)-0x660);}); // ٠-٩ -> 0-9
  s=s.replace(/['\u2019\u2018`\u00B4]/g,'');                              // apostrophes
  s=s.replace(/[^\u0600-\u06FFa-z0-9\s]/g,' ');                            // other punctuation/emoji -> space
  return s.replace(/\s+/g,' ').trim();
}
function hex(buf){ var a=new Uint8Array(buf),o=''; for(var i=0;i<a.length;i++){o+=(a[i]<16?'0':'')+a[i].toString(16);} return o; }
function sha16(salt,qi,text){
  var c=(typeof crypto!=='undefined'&&crypto.subtle)?crypto:require('crypto').webcrypto;
  return c.subtle.digest('SHA-256',new TextEncoder().encode(salt+'|'+qi+'|'+text)).then(function(b){return hex(b).slice(0,16);});
}
/* whole-word phrases of the normalized input (optionally without a leading Arabic "و") */
function candidates(norm,min,max){
  var w=norm.split(' ').filter(Boolean), out={};
  for(var i=0;i<w.length&&i<40;i++){
    for(var j=i;j<w.length&&j<i+6;j++){
      var p=w.slice(i,j+1).join(' ');
      if(p.length>max) break;
      if(p.length>=min) out[p]=1;
      if(w[i].charAt(0)==='\u0648'&&w[i].length>1){ var q=[w[i].slice(1)].concat(w.slice(i+1,j+1)).join(' '); if(q.length>=min&&q.length<=max) out[q]=1; }
    }
  }
  return Object.keys(out);
}
function isCorrect(data,qi,answer){
  var q=data.questions[qi], norm=normalize(answer); if(!norm) return Promise.resolve(false);
  if(q.deny){ var ws=norm.split(' '); for(var d=0;d<q.deny.length;d++){ if(ws.indexOf(q.deny[d])>-1) return Promise.resolve(false); } }
  var set={}; q.h.forEach(function(h){set[h]=1;});
  return Promise.all(candidates(norm,q.min,q.max).map(function(c){return sha16(data.salt,qi,c);}))
    .then(function(hs){return hs.some(function(h){return set[h]===1;}); });
}
function tierTitle(data,pct){ for(var i=0;i<data.tiers.length;i++){ if(pct>=data.tiers[i].min&&pct<=data.tiers[i].max) return data.tiers[i].title; } return ''; }

var api={normalize:normalize,sha16:sha16,candidates:candidates,isCorrect:isCorrect,tierTitle:tierTitle};
if(typeof module==='object'&&module.exports){ module.exports=api; }
if(typeof document==='undefined') return;

/* ---------- UI ---------- */
var html=document.documentElement;
function L(){ return html.lang==='ar'?'ar':'en'; }
var T={
  capsule:{ar:'كبسولة الفرحة ✨',en:'Joy Capsule ✨'},
  again:{ar:'افتح كبسولة تانية ✨',en:'Open another capsule ✨'},
  copy:{ar:'نسخ الرسالة 📋',en:'Copy message 📋'},
  copied:{ar:'اتنسخت ✅',en:'Copied ✅'},
  close:{ar:'إغلاق',en:'Close'},
  loadErr:{ar:'مش قادرة أفتح الكبسولة دلوقتي، جربي تاني بعد شوية.',en:'Could not open the capsule right now. Please try again.'},
  bestieBtn:{ar:'مقياس الصداقة 👯‍♀️',en:'Bestie Meter 👯‍♀️'},
  bLoadErr:{ar:'مش قادرة أفتح المقياس دلوقتي، جربي تاني بعد شوية.',en:'Could not open the Bestie Meter right now. Please try again.'},
  title:{ar:'مقياس التوافق: إنتِ ونوجا Besties بنسبة كام؟ 👯‍♀️💯',en:'Noga Bestie Meter: how much of a bestie are you? 👯‍♀️💯'},
  sub:{ar:'جاوبي ١٠ أسئلة عن نوجا بكتابتك إنتي، وشوفي نسبتك.',en:'Answer 10 questions about Noga in your own words and see your score. (Questions are in Arabic.)'},
  nameQ:{ar:'اسمك إيه؟',en:'What is your name?'},
  start:{ar:'يلا نبدأ',en:'Start'},
  next:{ar:'التالي',en:'Next'},
  finish:{ar:'اعرفي النتيجة',en:'See my result'},
  yourAns:{ar:'اكتبي إجابتك هنا',en:'Type your answer here'},
  qOf:{ar:'سؤال',en:'Question'},
  retry:{ar:'جرّب تاني 🔄',en:'Try again 🔄'},
  copyRes:{ar:'شارك النتيجة 📤',en:'Share your result 📤'},
  score:{ar:'النتيجة',en:'Score'},
  checking:{ar:'بحسب نتيجتك…',en:'Calculating…'},
  noteName:{ar:'اكتبي اسمك الأول.',en:'Please type your name.'},
  noteAns:{ar:'اكتبي إجابة الأول.',en:'Please type an answer first.'}
};
function tx(k){ return T[k][L()]; }
function el(tag,cls,txt){ var e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; return e; }
function getJSON(p){ return fetch(p).then(function(r){ if(!r.ok) throw new Error(p); return r.json(); }); }
function copyText(text){
  if(navigator.clipboard&&window.isSecureContext){ return navigator.clipboard.writeText(text); }
  return new Promise(function(res,rej){ try{
    var ta=document.createElement('textarea'); ta.value=text; ta.setAttribute('readonly',''); ta.style.cssText='position:fixed;opacity:0;top:0';
    document.body.appendChild(ta); ta.select(); var ok=document.execCommand('copy'); document.body.removeChild(ta); ok?res():rej();
  }catch(e){rej(e);} });
}

function drawCard(name,pct,score,title,ok){
  var W=1080,H=1350,c=document.createElement('canvas'); c.width=W; c.height=H; var x=c.getContext('2d');
  var g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,'#fbeee8'); g.addColorStop(1,'#f3d9d6'); x.fillStyle=g; x.fillRect(0,0,W,H);
  x.strokeStyle='#c98f94'; x.lineWidth=6; x.strokeRect(40,40,W-80,H-80);
  x.textAlign='center'; x.textBaseline='middle'; var F='"Segoe UI","Noto Sans Arabic","Noto Color Emoji","Apple Color Emoji",Tahoma,sans-serif';
  x.fillStyle='#8a4f57'; x.font='600 44px '+F; x.fillText('Noga Bestie Meter \uD83D\uDC6F\u200D\u2640\uFE0F',W/2,150);
  x.fillStyle='#3a2327'; x.font='700 70px '+F; x.direction='auto'; x.fillText(String(name).slice(0,30),W/2,290);
  x.fillStyle='#b56a75'; x.font='800 260px '+F; x.direction='ltr'; x.fillText(pct+'%',W/2,520);
  x.fillStyle='#3a2327'; x.font='700 90px '+F; x.fillText(score+'/10',W/2,720);
  x.direction='rtl'; x.fillStyle='#8a4f57'; x.font='700 56px '+F; x.fillText(title,W/2,850);
  x.direction='ltr'; x.font='54px '+F;
  for(var i=0;i<10;i++){ var cx=W/2+((i%5)-2)*170, cy=1010+Math.floor(i/5)*120; x.fillStyle='#3a2327'; x.font='600 40px '+F; x.fillText(String(i+1),cx-45,cy); x.font='54px '+F; x.fillText(ok[i]?'\u2705':'\u274C',cx+25,cy); }
  x.fillStyle='#8a4f57'; x.font='600 44px '+F; x.fillText('nogaadel.co',W/2,1255);
  return new Promise(function(res){ c.toBlob(function(b){res(b);},'image/png'); });
}
function shareResult(text,card,btn){
  var done=function(){ btn.textContent=tx('copied'); };
  var fallback=function(){ copyText(text).then(done).catch(function(){}); };
  if(!navigator.share) return fallback();
  card().then(function(blob){
    var data={text:text};
    try{ if(blob&&window.File){ var f=new File([blob],'noga-bestie.png',{type:'image/png'}); if(navigator.canShare&&navigator.canShare({files:[f]})) data={files:[f],text:text}; } }catch(e){}
    if(!data.files) data.url='https://nogaadel.co/';
    return navigator.share(data);
  }).catch(function(e){ if(e&&e.name==='AbortError') return; fallback(); });
}
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Joy Capsule ---------- */
var joy=null, deck=[], last=-1, current='', opener=null;
var cap=el('button','joy-capsule'); cap.type='button'; cap.id='joy-capsule';
var ov=el('div','joy-overlay'); ov.hidden=true;
var dlg=el('div','joy-modal'); dlg.setAttribute('role','dialog'); dlg.setAttribute('aria-modal','true'); dlg.setAttribute('aria-live','polite');
var xBtn=el('button','joy-x','×'); xBtn.type='button';
var sparkBox=el('div','joy-sparks'); sparkBox.setAttribute('aria-hidden','true');
var star=el('div','joy-star','✨'); star.setAttribute('aria-hidden','true');
var msg=el('p','joy-msg'); msg.lang='ar'; msg.dir='rtl';
var row=el('div','joy-actions');
var againBtn=el('button','btn-fan primary'); againBtn.type='button';
var copyBtn=el('button','btn-fan ghost'); copyBtn.type='button';
row.appendChild(againBtn); row.appendChild(copyBtn);
dlg.appendChild(xBtn); dlg.appendChild(sparkBox); dlg.appendChild(star); dlg.appendChild(msg); dlg.appendChild(row);
ov.appendChild(dlg);
function labels(){ bpill.textContent=tx('bestieBtn'); bx.setAttribute('aria-label',tx('close')); bdlg.setAttribute('aria-label',tx('bestieBtn')); cap.textContent=tx('capsule'); againBtn.textContent=tx('again'); copyBtn.textContent=tx('copy'); xBtn.setAttribute('aria-label',tx('close')); dlg.setAttribute('aria-label',tx('capsule')); }
function shuffle(n){ var a=[],i,j,t; for(i=0;i<n;i++)a.push(i); for(i=n-1;i>0;i--){ j=Math.floor(Math.random()*(i+1)); t=a[i];a[i]=a[j];a[j]=t; } return a; }
function draw(){
  if(!deck.length){ deck=shuffle(joy.length); if(deck.length>1&&deck[deck.length-1]===last){ var t=deck[0]; deck[0]=deck[deck.length-1]; deck[deck.length-1]=t; } }
  last=deck.pop(); current=joy[last]; return current;
}
function sparkle(){
  if(reduce) return; sparkBox.innerHTML='';
  var cols=['#c2838e','#e9b8bf','#f3dbda','#d9b99b','#fff'];
  for(var i=0;i<22;i++){ var s=el('span','spark'); var a=Math.random()*Math.PI*2, d=60+Math.random()*130;
    s.style.setProperty('--x',Math.round(Math.cos(a)*d)+'px'); s.style.setProperty('--y',Math.round(Math.sin(a)*d)+'px');
    s.style.background=cols[i%cols.length]; s.style.animationDelay=(Math.random()*.25)+'s'; sparkBox.appendChild(s); }
  setTimeout(function(){ sparkBox.innerHTML=''; },1800);
}
function showMsg(){
  msg.classList.remove('pop'); void msg.offsetWidth; msg.textContent=draw(); msg.classList.add('pop'); copyBtn.textContent=tx('copy'); sparkle();
}
function openCapsule(){
  opener=document.activeElement; labels(); ov.hidden=false; document.body.classList.add('joy-lock'); updateDock();
  var go=function(){ showMsg(); againBtn.focus(); };
  if(joy){ go(); return; }
  msg.textContent='…';
  getJSON('content/joy.json').then(function(j){ joy=j.messages; go(); }).catch(function(){ msg.textContent=tx('loadErr'); });
}
function closeCapsule(){ ov.hidden=true; if(bov.hidden) document.body.classList.remove('joy-lock'); updateDock(); if(opener&&opener.focus) opener.focus(); else cap.focus(); }
cap.addEventListener('click',openCapsule);
xBtn.addEventListener('click',closeCapsule);
ov.addEventListener('click',function(e){ if(e.target===ov) closeCapsule(); });
againBtn.addEventListener('click',function(){ if(joy) showMsg(); });
copyBtn.addEventListener('click',function(){ if(!current) return; copyText(current).then(function(){ copyBtn.textContent=tx('copied'); }).catch(function(){}); });
document.addEventListener('keydown',function(e){
  if(ov.hidden) return;
  if(e.key==='Escape'){ closeCapsule(); }
  if(e.key==='Tab'){ var f=[xBtn,againBtn,copyBtn]; var i=f.indexOf(document.activeElement); if(e.shiftKey&&i<=0){ e.preventDefault(); f[f.length-1].focus(); } else if(!e.shiftKey&&i===f.length-1){ e.preventDefault(); f[0].focus(); } }
});
var dock=el('div','fan-dock');
var bpill=el('button','joy-capsule bestie-pill'); bpill.type='button';
dock.appendChild(cap); dock.appendChild(bpill);
document.body.appendChild(dock); document.body.appendChild(ov);

/* ---------- Bestie Meter ---------- */
var bov=el('div','joy-overlay'); bov.hidden=true;
var bdlg=el('div','joy-modal bestie-modal'); bdlg.setAttribute('role','dialog'); bdlg.setAttribute('aria-modal','true');
var bx=el('button','joy-x','×'); bx.type='button';
var root=el('div','bestie-root');
bdlg.appendChild(bx); bdlg.appendChild(root); bov.appendChild(bdlg); document.body.appendChild(bov);
var bOpener=null;
var B=null, st={step:'name',name:'',i:0,ans:[],res:null};
function bestieHead(box){
  box.appendChild(el('h2','',tx('title')));
  box.appendChild(el('p','fan-sub',tx('sub')));
}
function renderBestie(){
  root.innerHTML=''; var box=el('div','bestie-box'); root.appendChild(box);
  if(st.step==='name'){
    bestieHead(box);
    var f=el('form','bestie-form'); var lab=el('label','',tx('nameQ')); lab.htmlFor='b-name';
    var inp=el('input'); inp.id='b-name'; inp.type='text'; inp.maxLength=30; inp.autocomplete='given-name'; inp.value=st.name;
    var note=el('p','bestie-note'); note.setAttribute('role','alert');
    var go=el('button','btn-fan primary',tx('start')); go.type='submit';
    f.appendChild(lab); f.appendChild(inp); f.appendChild(note); f.appendChild(go); box.appendChild(f);
    f.addEventListener('submit',function(e){ e.preventDefault(); var v=inp.value.trim(); if(!v){ note.textContent=tx('noteName'); inp.focus(); return; } st.name=v.slice(0,30); st.step='q'; st.i=0; st.ans=[]; renderBestie(); });
  } else if(st.step==='q'){
    var total=B.questions.length;
    box.appendChild(el('span','fan-tag',tx('qOf')+' '+(st.i+1)+' / '+total));
    var bar=el('div','bestie-bar'); var fill=el('i'); fill.style.width=Math.round(st.i/total*100)+'%'; bar.appendChild(fill); box.appendChild(bar);
    var q=el('h3','bestie-q',B.questions[st.i].q); q.lang='ar'; q.dir='rtl'; box.appendChild(q);
    var f2=el('form','bestie-form'); var inp2=el('input'); inp2.type='text'; inp2.maxLength=80; inp2.value=st.ans[st.i]||''; inp2.placeholder=tx('yourAns'); inp2.setAttribute('aria-label',B.questions[st.i].q); inp2.autocomplete='off'; inp2.autocapitalize='off'; inp2.dir='auto';
    var note2=el('p','bestie-note'); note2.setAttribute('role','alert');
    var nx=el('button','btn-fan primary',st.i===total-1?tx('finish'):tx('next')); nx.type='submit';
    f2.appendChild(inp2); f2.appendChild(note2); f2.appendChild(nx); box.appendChild(f2);
    f2.addEventListener('submit',function(e){ e.preventDefault(); var v=inp2.value.trim(); if(!v){ note2.textContent=tx('noteAns'); inp2.focus(); return; } st.ans[st.i]=v;
      if(st.i<total-1){ st.i++; renderBestie(); } else { st.step='calc'; renderBestie(); calc(); } });
    setTimeout(function(){ try{inp2.focus({preventScroll:true});}catch(e){inp2.focus();} },30);
  } else if(st.step==='calc'){
    box.appendChild(el('p','bestie-calc',tx('checking')));
  } else if(st.step==='res'){
    var r=st.res, pct=r.score*10, title=tierTitle(B,pct);
    var card=el('div','result-card'); card.id='bestie-card';
    card.appendChild(el('div','rc-brand','Noga Bestie Meter 👯‍♀️'));
    var nm=el('div','rc-name',st.name); nm.dir='auto'; card.appendChild(nm);
    card.appendChild(el('div','rc-pct',pct+'%'));
    card.appendChild(el('div','rc-score',r.score+'/10'));
    var tt=el('div','rc-title',title); tt.lang='ar'; tt.dir='rtl'; card.appendChild(tt);
    var grid=el('div','rc-grid'); grid.dir='ltr';
    r.ok.forEach(function(ok,i){ var c=el('span','rc-q'+(ok?' y':' n')); c.appendChild(el('b','',String(i+1))); c.appendChild(document.createTextNode(ok?'✅':'❌')); grid.appendChild(c); });
    card.appendChild(grid); card.appendChild(el('div','rc-url','nogaadel.co'));
    box.appendChild(card);
    var acts=el('div','joy-actions');
    var rt=el('button','btn-fan ghost',tx('retry')); rt.type='button';
    var cp=el('button','btn-fan primary',tx('copyRes')); cp.type='button';
    acts.appendChild(rt); acts.appendChild(cp); box.appendChild(acts);
    rt.addEventListener('click',function(){ st={step:'name',name:st.name,i:0,ans:[],res:null}; renderBestie(); });
    var pre=drawCard(st.name,pct,r.score,title,r.ok); pre.catch(function(){});
    cp.addEventListener('click',function(){
      var text='مقياس نوجا Besties 👯‍♀️\n'+st.name+': '+pct+'% ('+r.score+'/10)\n'+title+'\n'+r.ok.map(function(o,i){return (i+1)+(o?'✅':'❌');}).join(' ')+'\nجرّبي إنتي كمان: https://nogaadel.co/';
      shareResult(text,function(){return pre;},cp);
    });
  }
}
function calc(){
  Promise.all(st.ans.map(function(a,i){ return isCorrect(B,i,a); })).then(function(ok){
    st.res={ok:ok,score:ok.filter(Boolean).length}; st.step='res'; renderBestie();
    var c=document.getElementById('bestie-card'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'});
  });
}
function openBestie(){
  bOpener=document.activeElement; labels(); bov.hidden=false; document.body.classList.add('joy-lock'); updateDock();
  if(B){ renderBestie(); return; }
  root.textContent='…';
  getJSON('content/bestie.json').then(function(j){ B=j; renderBestie(); }).catch(function(){ root.textContent=tx('bLoadErr'); });
}
function closeBestie(){ bov.hidden=true; if(ov.hidden) document.body.classList.remove('joy-lock'); updateDock(); if(bOpener&&bOpener.focus&&document.contains(bOpener)) bOpener.focus(); else bpill.focus(); }
bpill.addEventListener('click',openBestie);
bx.addEventListener('click',closeBestie);
bov.addEventListener('click',function(e){ if(e.target===bov) closeBestie(); });

/* dock: hidden while a modal is open or any field is focused */
function fieldFocused(){ var a=document.activeElement; return !!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); }
function updateDock(){ dock.classList.toggle('is-hidden',!ov.hidden||!bov.hidden||fieldFocused()); }
document.addEventListener('focusin',updateDock);
document.addEventListener('focusout',function(){ setTimeout(updateDock,60); });
document.addEventListener('keydown',function(e){
  if(bov.hidden) return;
  if(e.key==='Escape'){ closeBestie(); return; }
  if(e.key==='Tab'){ var f=[].slice.call(bdlg.querySelectorAll('button,input,a[href]')).filter(function(x){return !x.disabled;}); if(!f.length) return; var i=f.indexOf(document.activeElement);
    if(e.shiftKey&&i<=0){ e.preventDefault(); f[f.length-1].focus(); } else if(!e.shiftKey&&i===f.length-1){ e.preventDefault(); f[0].focus(); } }
});

/* language switch: main.js sets <html lang>; re-render labels when it changes */
new MutationObserver(function(){ labels(); if(!ov.hidden) copyBtn.textContent=tx('copy'); if(B&&!bov.hidden) renderBestie(); }).observe(html,{attributes:true,attributeFilter:['lang']});
labels(); updateDock();
})();
