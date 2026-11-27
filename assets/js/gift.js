/* Noga Adel: floating gift box + free-video request form. */
(function(){
"use strict";
if(typeof document==='undefined') return;
var html=document.documentElement, body=document.body;
function L(){ return html.lang==='ar'?'ar':'en'; }
var T={
  badge:{ar:'ليك هديه هنا افتح الصندوق 🎁',en:'You have a gift here! Open the box 🎁'},
  aria:{ar:'صندوق الهدايا المغلق',en:'Closed gift box'},
  close:{ar:'إغلاق',en:'Close'},
  offerTag:{ar:'هدية ليك',en:'A gift for you'},
  offer:{ar:'فيديو مجاني لمنتجك ينزل على تيك توك نوجا — بدون أي تكلفة إنتاج ✨',en:"A FREE TikTok video for your product posted on Noga's account — zero production cost ✨"},
  name:{ar:'الاسم',en:'Full name'},
  company:{ar:'اسم الشركة / البراند',en:'Company / Brand name'},
  phone:{ar:'رقم الموبايل',en:'Mobile / WhatsApp number'},
  details:{ar:'تفاصيل الفيديو / المنتج',en:'Product & video details'},
  send:{ar:'ابعت الطلب 🎁',en:'Send my request 🎁'},
  sending:{ar:'بيتبعت…',en:'Sending…'},
  req:{ar:'من فضلك املأ كل الخانات.',en:'Please fill in every field.'},
  badPhone:{ar:'رقم الموبايل مش مظبوط، اكتبه بالأرقام.',en:'Please enter a valid phone number.'},
  fail:{ar:'الإرسال ما نجحش.',en:'Sending failed.'},
  offline:{ar:'مفيش اتصال.',en:'No connection.'},
  mail:{ar:'ابعته بالإيميل (البيانات جاهزة)',en:'Send it by email (details prefilled)'},
  done:{ar:'تم استلام طلبك بنجاح! متحمسين جدًا نشتغل على منتجك، هنتواصل معاك في أسرع وقت وشكرًا لثقتك ✨💖',en:"Your request has been received! We're super excited to work on your product—we'll contact you very soon. Thank you! ✨💖"}
};
function tx(k){ return T[k][L()]; }
function el(tag,cls,txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }

var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var COLORS=['#e9b8bf','#c2838e','#d9b46a','#f3dbda','#a95f6d','#f1d9a0','#fff'];

function giftSvg(p,open){
  return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">'+
  '<defs><linearGradient id="'+p+'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3a2ac"/><stop offset="1" stop-color="#b06a78"/></linearGradient>'+
  '<linearGradient id="'+p+'r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6c377"/><stop offset=".5" stop-color="#f6e2a8"/><stop offset="1" stop-color="#cfa24d"/></linearGradient>'+
  '<linearGradient id="'+p+'l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0b9c1"/><stop offset="1" stop-color="#c2838e"/></linearGradient>'+
  '<radialGradient id="'+p+'g"><stop offset="0" stop-color="#fff6d6"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></radialGradient></defs>'+
  (open?'<circle class="g-glow" cx="50" cy="46" r="40" fill="url(#'+p+'g)"/>':'')+
  '<g class="g-box"><rect x="17" y="47" width="66" height="46" rx="7" fill="url(#'+p+'b)"/>'+
  '<rect x="44" y="47" width="12" height="46" fill="url(#'+p+'r)"/>'+
  '<rect x="17" y="47" width="66" height="7" rx="3" fill="#000" opacity=".08"/>'+
  '<path d="M23 54v30" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/></g>'+
  '<g class="g-lid"><rect x="11" y="33" width="78" height="17" rx="6" fill="url(#'+p+'l)"/>'+
  '<rect x="44" y="33" width="12" height="17" fill="url(#'+p+'r)"/>'+
  '<path d="M50 33C40 14 24 18 30 27c4 6 14 5 20 6z" fill="url(#'+p+'r)" stroke="#b58a3c" stroke-width="1.2"/>'+
  '<path d="M50 33C60 14 76 18 70 27c-4 6-14 5-20 6z" fill="url(#'+p+'r)" stroke="#b58a3c" stroke-width="1.2"/>'+
  '<circle cx="50" cy="32" r="5.5" fill="#e6c377" stroke="#b58a3c" stroke-width="1.2"/>'+
  '<path d="M16 38h68" stroke="#fff" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/></g></svg>';
}

/* ---------- floating box ---------- */
var fab=el('button','gift-fab'); fab.type='button';
fab.innerHTML=giftSvg('f',false);
var badge=el('span','gift-badge'); fab.appendChild(badge);
body.appendChild(fab);
function fabLabels(){ badge.textContent=tx('badge'); fab.setAttribute('aria-label',tx('aria')+': '+tx('badge')); measure(); }

var x=20,y=120,vx=0,vy=0,w=210,h=110,minX=8,maxX=300,minY=72,maxY=500,paused=false,resumeAt=0,last=0,raf=0;
function measure(){
  var r=fab.getBoundingClientRect(); if(r.width) { w=r.width; h=r.height; }
  var vw=document.documentElement.clientWidth||window.innerWidth, vh=window.innerHeight;
  var sb=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sab'))||0;
  minX=8; maxX=Math.max(minX,vw-w-8);
  minY=70; maxY=Math.max(minY,vh-h-76);   // keeps clear of the bottom dock
  if(x>maxX) x=maxX; if(x<minX) x=minX; if(y>maxY) y=maxY; if(y<minY) y=minY;
  place();
}
function place(){ fab.style.transform='translate3d('+Math.round(x*10)/10+'px,'+Math.round(y*10)/10+'px,0)'; }
function startMotion(){
  var sp=22+Math.random()*8, a=Math.random()*Math.PI*2;
  vx=Math.cos(a)*sp; vy=Math.sin(a)*sp; if(Math.abs(vx)<10) vx=vx<0?-12:12; if(Math.abs(vy)<8) vy=vy<0?-9:9;
}
function tick(ts){
  raf=requestAnimationFrame(tick);
  if(!last){ last=ts; return; }
  var dt=Math.min(.05,(ts-last)/1000); last=ts;
  if(fab.classList.contains('is-hidden')||document.hidden) return;
  if(paused||(resumeAt&&ts<resumeAt)) return;
  resumeAt=0;
  x+=vx*dt; y+=vy*dt;
  if(x<minX){x=minX;vx=Math.abs(vx);} else if(x>maxX){x=maxX;vx=-Math.abs(vx);}
  if(y<minY){y=minY;vy=Math.abs(vy);} else if(y>maxY){y=maxY;vy=-Math.abs(vy);}
  place();
}
fab.addEventListener('mouseenter',function(){ paused=true; });
fab.addEventListener('mouseleave',function(){ paused=false; });
fab.addEventListener('focus',function(){ paused=true; });
fab.addEventListener('blur',function(){ paused=false; });
fab.addEventListener('touchstart',function(){ paused=true; },{passive:true});
function touchEnd(){ paused=false; resumeAt=performance.now()+3500; }
fab.addEventListener('touchend',touchEnd,{passive:true});
fab.addEventListener('touchcancel',touchEnd,{passive:true});
window.addEventListener('resize',measure);
window.addEventListener('orientationchange',function(){ setTimeout(measure,300); });

/* hide while any modal is open or a field is focused */
function fieldFocused(){ var a=document.activeElement; return !!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); }
function updateHide(){ fab.classList.toggle('is-hidden',body.classList.contains('joy-lock')||fieldFocused()); }
new MutationObserver(updateHide).observe(body,{attributes:true,attributeFilter:['class']});
document.addEventListener('focusin',updateHide);
document.addEventListener('focusout',function(){ setTimeout(updateHide,50); });
new MutationObserver(fabLabels).observe(html,{attributes:true,attributeFilter:['lang']});

/* ---------- modal ---------- */
var ov=null, opener=null;
function burst(host,n){
  var box=el('div','gift-confetti'); host.appendChild(box);
  for(var i=0;i<n;i++){
    var p=el('i',i%3===0?'s':''); var ang=(Math.random()*Math.PI)+Math.PI; var d=90+Math.random()*190;
    p.style.setProperty('--x',(Math.cos(ang)*d*1.1).toFixed(0)+'px');
    p.style.setProperty('--y',(Math.sin(ang)*d*.9+Math.random()*260).toFixed(0)+'px');
    p.style.setProperty('--r',((Math.random()*720)-360).toFixed(0)+'deg');
    p.style.background=COLORS[i%COLORS.length]; p.style.animationDelay=(Math.random()*.25).toFixed(2)+'s';
    box.appendChild(p);
  }
  setTimeout(function(){ if(box.parentNode) box.parentNode.removeChild(box); },2600);
}
function closeModal(){
  if(!ov) return;
  document.removeEventListener('keydown',onKey);
  if(ov.parentNode) ov.parentNode.removeChild(ov); ov=null;
  body.classList.remove('joy-lock'); updateHide(); measure();
  try{ (opener&&document.contains(opener)?opener:fab).focus(); }catch(e){}
}
function onKey(e){ if(e.key==='Escape') closeModal(); }
function openModal(){
  if(ov) return; opener=document.activeElement;
  ov=el('div','joy-overlay gift-overlay'); ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
  var m=el('div','joy-modal gift-modal'); ov.appendChild(m);
  var x1=el('button','joy-x','\u00d7'); x1.type='button'; x1.setAttribute('aria-label',tx('close')); x1.onclick=closeModal; m.appendChild(x1);
  var stage=el('div','gift-stage'); stage.innerHTML=giftSvg('m',true); m.appendChild(stage);
  var offer=el('div','gift-offer'); offer.appendChild(document.createTextNode(tx('offer'))); m.appendChild(offer);
  var form=buildForm(m, stage); form.className+=' gift-form'; m.appendChild(form);
  ov.addEventListener('click',function(e){ if(e.target===ov) closeModal(); });
  body.appendChild(ov); body.classList.add('joy-lock'); updateHide();
  document.addEventListener('keydown',onKey);
  setTimeout(function(){ stage.classList.add('open'); burst(m,46); },reduce?0:380);
  setTimeout(function(){ offer.classList.add('show'); },reduce?0:900);
  setTimeout(function(){ form.classList.add('show'); },reduce?0:1100);
  x1.focus();
}
function buildForm(m,stage){
  var f=el('form'); f.noValidate=true;
  function field(id,labelKey,tag,attrs){
    var d=el('div'); var l=el('label','',tx(labelKey)); l.htmlFor='gift-'+id; d.appendChild(l);
    var i=el(tag); i.id='gift-'+id; i.name=id; Object.keys(attrs||{}).forEach(function(k){ i.setAttribute(k,attrs[k]); });
    d.appendChild(i); f.appendChild(d); return i;
  }
  var iName=field('name','name','input',{type:'text',autocomplete:'name',required:'required',maxlength:'80'});
  var iCo=field('company','company','input',{type:'text',autocomplete:'organization',required:'required',maxlength:'100'});
  var iPh=field('phone','phone','input',{type:'tel',inputmode:'tel',autocomplete:'tel',required:'required',maxlength:'30',dir:'ltr'});
  var iDet=field('details','details','textarea',{required:'required',maxlength:'1500'});
  var note=el('p','gift-note'); note.setAttribute('role','status'); f.appendChild(note);
  var btn=el('button','btn-fan primary',tx('send')); btn.type='submit'; f.appendChild(btn);
  f.addEventListener('submit',function(ev){
    ev.preventDefault(); note.textContent=''; note.innerHTML='';
    var v={name:iName.value.trim(),company:iCo.value.trim(),phone:iPh.value.trim(),details:iDet.value.trim()};
    if(!v.name||!v.company||!v.phone||!v.details){ note.textContent=tx('req'); return; }
    if(v.phone.replace(/[^0-9\u0660-\u0669]/g,'').length<7){ note.textContent=tx('badPhone'); return; }
    btn.disabled=true; btn.textContent=tx('sending');
    var subject='[\u0637\u0644\u0628 \u0641\u064a\u062f\u064a\u0648 \u0645\u062c\u0627\u0646\u064a - '+v.company+']';
    var data={request_type:'free_tiktok_video',name:v.name,company:v.company,phone:v.phone,details:v.details,_subject:subject};
    function failed(msg){
      btn.disabled=false; btn.textContent=tx('send'); note.textContent=msg+' ';
      var lines=['Name: '+v.name,'Company / Brand: '+v.company,'Phone: '+v.phone,'','Product & video details:',v.details];
      var a=el('a','',tx('mail')); a.href='mailto:noga@nogaadel.co?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(lines.join('\n')); note.appendChild(a);
    }
    var ac=('AbortController' in window)?new AbortController():null, to=setTimeout(function(){ if(ac) ac.abort(); },20000);
    fetch('https://formspree.io/f/meagwqrk',{method:'POST',signal:ac?ac.signal:undefined,headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
    .then(function(r){ return r.json().then(function(j){ return {ok:r.ok,body:j}; }); })
    .then(function(res){
      clearTimeout(to);
      if(res.ok&&res.body&&res.body.ok===true){
        var d=el('div','gift-done'); d.appendChild(el('span','big','\ud83c\udf89')); d.appendChild(document.createTextNode(tx('done')));
        f.parentNode.replaceChild(d,f); burst(m,70); m.scrollTop=0;
      } else failed(tx('fail'));
    }).catch(function(){ clearTimeout(to); failed(tx('offline')); });
  });
  return f;
}
fab.addEventListener('click',openModal);

fabLabels(); updateHide();
if(reduce){ x=maxX; y=maxY; place(); }
else { startMotion(); raf=requestAnimationFrame(tick); }
window.addEventListener('load',measure);
})();
