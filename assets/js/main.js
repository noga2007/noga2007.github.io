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
    if(p.video) inner+='<em>'+(L==='ar'?'شاهدي على تيك توك ←':'Watch on TikTok →')+'</em>';
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
    btn.innerHTML='<span class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><small>'+(L==='ar'?'اضغطي لتحميل الفيديو من تيك توك':'Tap to load the TikTok video')+'</small>';
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

function renderGallery(){
  var g=document.getElementById('gallery-grid'); g.innerHTML='';
  (D.gallery.photos||[]).forEach(function(ph){
    var d=document.createElement('div'); d.className='ph reveal';
    var img=document.createElement('img');
    img.src=ph.src; img.alt=t(ph.alt); img.loading='lazy';
    d.appendChild(img); g.appendChild(d);
  });
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
    ph.setAttribute('data-en','Select a type'); ph.setAttribute('data-ar','اختاري نوع التعاون');
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
    fetch('https://formsubmit.co/ajax/noga@nogaadel.co',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(data)
    }).then(function(r){ return r.json().then(function(j){ return {ok:r.ok,body:j}; }); })
    .then(function(res){
      btn.disabled=false;
      if(res.ok && res.body && String(res.body.success)==='true'){
        status.className='form-status ok';
        status.textContent=(L==='ar')?'وصلت! هنرد عليكي على الإيميل قريب.':'Received! We will reply to your email soon.';
        form.reset();
      }else{
        status.className='form-status err';
        status.textContent=(L==='ar')?'الإرسال ما نجحش. ابعتي إيميل مباشرة على noga@nogaadel.co':'Sending failed. Please email noga@nogaadel.co directly.';
      }
    }).catch(function(){
      btn.disabled=false;
      status.className='form-status err';
      status.textContent=(L==='ar')?'مفيش اتصال. ابعتي إيميل مباشرة على noga@nogaadel.co':'No connection. Please email noga@nogaadel.co directly.';
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
