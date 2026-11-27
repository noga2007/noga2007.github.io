/* Noga Adel — content-driven renderer. Content lives in /content/*.json */
(function(){
"use strict";
var html=document.documentElement, langBtn=document.getElementById('lang');
var L='en'; try{L=localStorage.getItem('l')||'en'}catch(e){}
var D={}; // loaded content

function t(o){ return (o&&typeof o==='object'&&(o.en||o.ar)) ? (o[L]||o.en||'') : (o||''); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function getJSON(p){ return fetch(p).then(function(r){ if(!r.ok) throw new Error(p); return r.json(); }); }

function setLang(l){
  L=l; html.lang=l; html.dir=(l==='ar')?'rtl':'ltr';
  langBtn.textContent=(l==='ar')?'English':'العربية';
  try{localStorage.setItem('l',l)}catch(e){}
  render();
}
langBtn.onclick=function(){ setLang(L==='en'?'ar':'en'); };

/* ---------- renderers ---------- */
function render(){
  if(!D.profile) return;
  renderHero(); renderWork(); renderVideos(); renderGallery();
  renderAbout(); renderServices(); renderContact(); observeReveals();
}

function renderHero(){
  var p=D.profile;
  document.getElementById('hero-roles').textContent=t(p.roles);
  document.getElementById('hero-lead').textContent=t(p.lead);
  var s=document.getElementById('stats'); s.innerHTML='';
  p.stats.forEach(function(st){
    var d=document.createElement('div'); d.className='stat reveal';
    d.innerHTML='<b>'+esc(st.value)+'</b><span>'+esc(t(st.label))+'</span>';
    s.appendChild(d);
  });
  document.getElementById('stats-note').textContent=t(p.statsNote);
  document.getElementById('cta-tiktok').href=p.socials.tiktok;
  var c2=document.getElementById('cta-tiktok2'); if(c2) c2.href=p.socials.tiktok;
}

function catLabel(id){
  var c=(D.projects.categories||[]).filter(function(c){return c.id===id;})[0];
  return c?t(c.label):id;
}

var activeCat='all';
function renderWork(){
  var data=D.projects, chips=document.getElementById('work-chips'), grid=document.getElementById('work-grid');
  chips.innerHTML='';
  var cats=[{id:'all',label:{en:'All',ar:'الكل'}}].concat(data.categories||[]);
  cats.forEach(function(c){
    var b=document.createElement('button'); b.type='button';
    b.className='chip'+(activeCat===c.id?' on':''); b.textContent=t(c.label);
    b.onclick=function(){ activeCat=c.id; renderWork(); };
    chips.appendChild(b);
  });
  grid.innerHTML='';
  var list=(data.projects||[]).filter(function(p){return activeCat==='all'||p.category===activeCat;});
  list.forEach(function(p,i){
    var a=document.createElement(p.video?'a':'div');
    a.className='work w'+((i%4)+1)+' reveal';
    if(p.video){a.href=p.video;a.target='_blank';a.rel='noopener';}
    var inner='<span class="tag">'+esc(catLabel(p.category))+'</span><small>'+esc(t(p.title))+'</small><b>'+esc(p.brand)+'</b>';
    if(p.metric) inner+='<span>'+esc(p.metric.value)+' '+esc(t(p.metric.label))+'</span>';
    if(p.video) inner+='<em>'+(L==='ar'?'شاهد على تيك توك ←':'Watch on TikTok →')+'</em>';
    a.innerHTML=inner;
    grid.appendChild(a);
  });
  document.getElementById('work-note').textContent=t(data.note);
}

function renderVideos(){
  var grid=document.getElementById('video-grid'); grid.innerHTML='';
  document.getElementById('videos-intro').textContent=t(D.videos.intro);
  var th=document.getElementById('themes'); th.innerHTML='';
  var tm=D.profile.themes;
  if(tm&&tm.items){ var lb=document.createElement('span'); lb.className='tlabel'; lb.textContent=t(tm.label); th.appendChild(lb);
    tm.items.forEach(function(it){ var s=document.createElement('span'); s.className='chip'; s.style.cursor='default'; s.textContent=t(it); th.appendChild(s); }); }
  (D.videos.videos||[]).forEach(function(v){
    var card=document.createElement('div'); card.className='video reveal';
    var head=document.createElement('div'); head.className='vhead';
    head.innerHTML=v.brand?'<div><b>'+esc(v.brand)+'</b><br><span>'+esc(t(v.title))+'</span></div>':'<div><b>'+esc(t(v.title))+'</b></div>';
    var body=document.createElement('div'); body.className='vbody';
    var btn=document.createElement('button'); btn.type='button'; btn.className='loadvid';
    btn.innerHTML='<span class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><small>'+(L==='ar'?'اضغط لتحميل الفيديو من تيك توك':'Tap to load the TikTok video')+'</small>';
    btn.onclick=function(){ loadTikTok(body,v); };
    body.appendChild(btn);
    card.appendChild(head); card.appendChild(body); grid.appendChild(card);
  });
}

function loadTikTok(container,v){
  container.innerHTML='';
  var bq=document.createElement('blockquote');
  bq.className='tiktok-embed'; bq.setAttribute('cite',v.url);
  bq.setAttribute('data-video-id',v.id);
  bq.style.maxWidth='325px'; bq.style.minWidth='300px';
  var sec=document.createElement('section'); bq.appendChild(sec);
  container.appendChild(bq);
  if(window.tiktokEmbedReady){ window.tiktokEmbedReady(); }
  else{
    var s=document.createElement('script'); s.async=true; s.src='https://www.tiktok.com/embed.js';
    document.body.appendChild(s);
    window.tiktokEmbedReady=function(){};
  }
}

var galCat='all', galList=[];
function renderGallery(){
  var wrap=document.getElementById('gallery-grid'), tabs=document.getElementById('gallery-tabs'); if(!wrap) return;
  var G=D.gallery||{}, photos=G.photos||[];
  var cats=[{id:'all',label:{en:'All',ar:'الكل'}}].concat(G.categories||[]);
  if(tabs){
    tabs.innerHTML='';
    cats.forEach(function(c){
      var b=document.createElement('button'); b.type='button';
      b.className='chip'+(galCat===c.id?' on':''); b.textContent=t(c.label);
      b.setAttribute('aria-pressed',galCat===c.id?'true':'false');
      b.onclick=function(){ galCat=c.id; renderGallery(); };
      tabs.appendChild(b);
    });
  }
  galList=photos.filter(function(p){ return galCat==='all'||p.cat===galCat; });
  wrap.innerHTML='';
  if(!galList.length){
    var e=document.createElement('p'); e.className='sub gal-empty';
    e.textContent=(L==='ar')?'صور جديدة قريب ✨':'New photos coming soon ✨'; wrap.appendChild(e); return;
  }
  galList.forEach(function(ph,i){
    var b=document.createElement('button'); b.type='button'; b.className='gal-item reveal';
    b.style.aspectRatio=ph.ratio||'3/4'; b.setAttribute('aria-label',t(ph.alt));
    var img=document.createElement('img');
    img.src=ph.src; img.alt=t(ph.alt); img.loading='lazy'; img.decoding='async';
    b.appendChild(img); b.onclick=function(){ openLightbox(i); };
    wrap.appendChild(b);
  });
}

/* lightbox: arrows, keyboard, swipe, close */
var lb=null, lbIdx=0, lbPrev=null;
function lbShow(i){
  if(!galList.length) return;
  lbIdx=(i+galList.length)%galList.length;
  var ph=galList[lbIdx], img=lb.querySelector('img');
  img.style.opacity=0; img.onload=function(){ img.style.opacity=1; };
  img.src=ph.src; img.alt=t(ph.alt);
  lb.querySelector('.lb-count').textContent=(lbIdx+1)+' / '+galList.length;
  var nx=galList[(lbIdx+1)%galList.length]; if(nx){ var pre=new Image(); pre.src=nx.src; }
}
function lbKey(e){
  if(e.key==='Escape') closeLightbox();
  else if(e.key==='ArrowRight') lbShow(lbIdx+1);
  else if(e.key==='ArrowLeft') lbShow(lbIdx-1);
}
function closeLightbox(){
  if(!lb) return;
  document.removeEventListener('keydown',lbKey);
  if(lb.parentNode) lb.parentNode.removeChild(lb); lb=null;
  document.body.classList.remove('joy-lock');
  try{ lbPrev&&lbPrev.focus&&lbPrev.focus(); }catch(e){}
}
function openLightbox(i){
  if(lb) return;
  lbPrev=document.activeElement;
  lb=document.createElement('div'); lb.className='lb'; lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true');
  lb.innerHTML='<button type="button" class="lb-x" aria-label="Close">\u00d7</button>'+
    '<button type="button" class="lb-nav lb-prev" aria-label="Previous">\u2039</button>'+
    '<img alt="">'+
    '<button type="button" class="lb-nav lb-next" aria-label="Next">\u203a</button>'+
    '<div class="lb-count"></div>';
  document.body.appendChild(lb); document.body.classList.add('joy-lock');
  lb.querySelector('.lb-x').onclick=closeLightbox;
  lb.querySelector('.lb-prev').onclick=function(e){ e.stopPropagation(); lbShow(lbIdx-1); };
  lb.querySelector('.lb-next').onclick=function(e){ e.stopPropagation(); lbShow(lbIdx+1); };
  lb.addEventListener('click',function(e){ if(e.target===lb) closeLightbox(); });
  var sx=null, sy=null;
  lb.addEventListener('touchstart',function(e){ if(e.touches.length===1){ sx=e.touches[0].clientX; sy=e.touches[0].clientY; } },{passive:true});
  lb.addEventListener('touchend',function(e){
    if(sx===null) return; var t0=e.changedTouches[0], dx=t0.clientX-sx, dy=t0.clientY-sy; sx=null;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){ lbShow(dx<0?lbIdx+1:lbIdx-1); }
  },{passive:true});
  document.addEventListener('keydown',lbKey);
  lbShow(i); lb.querySelector('.lb-x').focus();
}

function renderAbout(){
  var p=D.profile, box=document.getElementById('about-paras'); box.innerHTML='';
  (p.about[L]||p.about.en).forEach(function(txt){
    var el=document.createElement('p'); el.textContent=txt; box.appendChild(el);
  });
  document.getElementById('edu-title').textContent=t(p.education.title);
  document.getElementById('edu-detail').textContent=t(p.education.detail);
  var ch=document.getElementById('lang-chips'); ch.innerHTML='';
  p.languages.forEach(function(lg){
    var s=document.createElement('span'); s.className='chip'; s.style.cursor='default'; s.textContent=t(lg); ch.appendChild(s);
  });
}

function renderServices(){
  document.getElementById('services-intro').textContent=t(D.services.intro);
  var g=document.getElementById('services-grid'); g.innerHTML='';
  (D.services.services||[]).forEach(function(sv,i){
    var c=document.createElement('div'); c.className='card reveal';
    var li=(sv.items||[]).map(function(x){return '<li>'+esc(t(x))+'</li>';}).join('');
    if(sv.primary) c.className+=' primary';
    c.innerHTML='<div class="num">'+('0'+(i+1)).slice(-2)+(sv.primary?' · '+(L==='ar'?'الخدمة الأساسية':'Main service'):'')+'</div><h3>'+esc(t(sv.title))+'</h3><p>'+esc(t(sv.desc))+'</p>'+(li?'<ul class="bul">'+li+'</ul>':'');
    g.appendChild(c);
  });
  var df=document.getElementById('services-diff'); if(df) df.textContent=t(D.services.difference);
  var cb=document.getElementById('collab');
  if(cb){ cb.innerHTML=''; (D.services.collab||[]).forEach(function(x){
    var a=document.createElement('a'); a.href='#inquiry-form'; a.className='cc';
    a.innerHTML='<b>'+esc(t(x.title))+'</b><span>'+esc(t(x.desc))+'</span>';
    a.onclick=function(){ var s=document.getElementById('f-service'); if(s) s.value=x.id; };
    cb.appendChild(a); }); }
  var sel=document.getElementById('f-service');
  if(sel && !sel.options.length){
    var ph=document.createElement('option'); ph.value=''; ph.disabled=true; ph.selected=true;
    ph.setAttribute('data-en','Select a type'); ph.setAttribute('data-ar','اختار نوع التعاون');
    sel.appendChild(ph);
    (D.services.inquiryTypes||[]).forEach(function(sv){
      var o=document.createElement('option'); o.value=sv.id;
      o.setAttribute('data-en',sv.title.en); o.setAttribute('data-ar',sv.title.ar);
      sel.appendChild(o);
    });
  }
  if(sel){ for(var i=0;i<sel.options.length;i++){ var o=sel.options[i]; o.textContent=o.getAttribute('data-'+L)||o.getAttribute('data-en'); } }
}

function renderContact(){
  var p=D.profile;
  document.getElementById('c-linkedin').href=p.socials.linkedin;
  document.getElementById('c-tiktok').href=p.socials.tiktok;
  document.getElementById('c-instagram').href=p.socials.instagram;
  var em=document.getElementById('c-email'); em.href='mailto:'+p.socials.email; em.textContent=p.socials.email;
  document.getElementById('mk-note').textContent=t(p.mediaKit.note);
}

/* ---------- reveals ---------- */
var io;
function observeReveals(){
  if(!('IntersectionObserver' in window)){ document.querySelectorAll('.reveal').forEach(function(e){e.classList.add('in')}); return; }
  if(!io){ io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); },{threshold:.12}); }
  document.querySelectorAll('.reveal:not(.in)').forEach(function(e){ io.observe(e); });
}

/* ---------- thank-you popup (shown only after a confirmed successful send) ---------- */
function thanksPopup(name){
  var ar=(document.documentElement.lang||'ar').slice(0,2)==='ar';
  var prev=document.activeElement;
  var ov=document.createElement('div'); ov.className='joy-overlay';
  var d=document.createElement('div'); d.className='joy-modal'; d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true');
  var star=document.createElement('div'); star.className='joy-star'; star.textContent='\uD83D\uDC96'; star.setAttribute('aria-hidden','true');
  var h=document.createElement('h3'); h.className='joy-msg'; h.style.marginBottom='8px'; h.style.minHeight='0';
  h.textContent=ar?('شكراً يا '+(name||'')+' \u2728').replace('  ',' '):('Thank you'+(name?', '+name:'')+' \u2728');
  var p=document.createElement('p'); p.className='joy-msg'; p.style.fontSize='1rem';
  p.textContent=ar?'رسالتك وصلت نوجا، وسعيدة جداً باهتمامكم بالتعاون معاها \uD83D\uDC95 هتتواصل معاكم على الإيميل في أقرب وقت. يوم جميل ليكم!':'Your message reached Noga. She is so happy about your interest in working together \uD83D\uDC95 She will get back to you by email very soon. Have a lovely day!';
  p.dir=ar?'rtl':'ltr'; h.dir=ar?'rtl':'ltr';
  var b=document.createElement('button'); b.type='button'; b.className='btn-fan primary'; b.textContent=ar?'تمام \uD83D\uDC96':'Lovely \uD83D\uDC96';
  var row=document.createElement('div'); row.className='joy-actions'; row.appendChild(b);
  d.appendChild(star); d.appendChild(h); d.appendChild(p); d.appendChild(row); ov.appendChild(d); document.body.appendChild(ov);
  function close(){ document.removeEventListener('keydown',key); if(ov.parentNode) ov.parentNode.removeChild(ov); try{prev&&prev.focus&&prev.focus();}catch(e){} }
  function key(e){ if(e.key==='Escape') close(); }
  b.addEventListener('click',close); ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
  document.addEventListener('keydown',key); b.focus();
}

/* ---------- form ---------- */
function initForm(){
  var form=document.getElementById('inquiry-form'); if(!form) return;
  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var status=document.getElementById('form-status');
    status.className='form-status'; status.textContent='';
    var btn=document.getElementById('form-submit'); btn.disabled=true;
    var data={
      brand: form.brand.value.trim(),
      contact_person: form.contact_person.value.trim(),
      email: form.email.value.trim(),
      service: form.service.options[form.service.selectedIndex]?form.service.options[form.service.selectedIndex].text:'',
      country: form.country.value.trim(),
      deliverables: form.deliverables.value.trim(),
      budget: form.budget.value.trim()||'—',
      message: form.message.value.trim(),
      _subject: 'Brand inquiry: '+form.brand.value.trim()+' (nogaadel.co)'
    };
    var ac=('AbortController' in window)?new AbortController():null; var to=setTimeout(function(){ if(ac) ac.abort(); },20000);
    function fail(msg){
      btn.disabled=false;
      status.className='form-status err';
      var lines=['Brand / company: '+data.brand,'Contact person: '+data.contact_person,'Email: '+data.email,'Service: '+data.service,'Country: '+data.country,'Deliverables: '+data.deliverables,'Budget: '+data.budget,'','Campaign description:',data.message];
      var href='mailto:noga@nogaadel.co?subject='+encodeURIComponent(data._subject)+'&body='+encodeURIComponent(lines.join('\n'));
      status.textContent=msg+' ';
      var a=document.createElement('a'); a.href=href; a.style.textDecoration='underline'; a.style.color='inherit'; a.textContent=(L==='ar')?'ابعته بالإيميل (البيانات جاهزة)':'Send it by email (details prefilled)';
      status.appendChild(a);
    }
    fetch('https://formspree.io/f/meagwqrk',{
      method:'POST', signal: ac?ac.signal:undefined,
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(data)
    }).then(function(r){ return r.json().then(function(j){ return {ok:r.ok,body:j}; }); })
    .then(function(res){
      clearTimeout(to);
      if(res.ok && res.body && res.body.ok===true){
        btn.disabled=false;
        status.className='form-status ok';
        status.textContent=(L==='ar')?'وصلت! هنرد عليك على الإيميل قريب.':'Received! We will reply to your email soon.';
        var who=data.contact_person; form.reset(); thanksPopup(who);
      }else{
        fail((L==='ar')?'الإرسال ما نجحش.':'Sending failed.');
      }
    }).catch(function(){
      clearTimeout(to);
      fail((L==='ar')?'مفيش اتصال.':'No connection.');
    });
  });
}

/* ---------- boot ---------- */
Promise.all([
  getJSON('content/profile.json').then(function(j){D.profile=j;}),
  getJSON('content/projects.json').then(function(j){D.projects=j;}),
  getJSON('content/videos.json').then(function(j){D.videos=j;}),
  getJSON('content/gallery.json').then(function(j){D.gallery=j;}),
  getJSON('content/services.json').then(function(j){D.services=j;})
]).then(function(){
  setLang(L); initForm();
}).catch(function(err){
  var w=document.createElement('div');
  w.style.cssText='max-width:680px;margin:40px auto;padding:20px;text-align:center;color:#93343f';
  w.textContent='Content failed to load. Please email noga@nogaadel.co.';
  document.body.appendChild(w);
});
})();
