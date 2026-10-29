/* ============================================================
   مَدار | BWP401 — منطق التفاعل على الواجهة الأمامية
   لا توجد قاعدة بيانات أو خادم. الفعاليات والتسجيلات تجريبية.
   ============================================================ */
'use strict';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function safeLocal(action, key, value) {
  try { return action === 'get' ? localStorage.getItem(key) : localStorage.setItem(key, value); }
  catch (_err) { return null; }
}
function dateObj(dateStr) { return new Date(`${dateStr}T12:00:00`); }
function dateText(iso, style='long') {
  return new Intl.DateTimeFormat('ar-SY-u-nu-latn', style === 'short' ? {day:'numeric',month:'long'} : {weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(dateObj(iso));
}
function categoryFor(event) { return EVENT_CATEGORIES.find(cat=>cat.id===event.category) || EVENT_CATEGORIES[0]; }
function digits(value) { return String(value).replace(/\s+/g,' ').trim(); }
function normalizeArabic(value) {
  return String(value).toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g,'').replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ـ/g,'').trim();
}
function toast(text, kind='success') {
  const parent = $('#toast-container');
  if (!parent) return;
  const item = document.createElement('div'); item.className = `custom-toast ${kind==='error'?'error':''}`;
  item.textContent = text;
  item.setAttribute('role','status'); parent.append(item);
  setTimeout(()=>{ item.remove(); },4200);
}
function eventLink(event) { return `event.html?id=${encodeURIComponent(event.id)}`; }
function eventCard(event) {
  const cat=categoryFor(event);
  return `<div class="col-lg-4 col-md-6">
    <article class="event-card">
      <a href="${eventLink(event)}" class="event-thumb" aria-label="تفاصيل ${escapeText(event.title)}">
        <img src="assets/img/${escapeText(event.image)}" width="1200" height="760" loading="lazy" alt="لوحة توضيحية لفعالية ${escapeText(event.title)}">
        <span class="card-category">${escapeText(cat.name)}</span>
      </a>
      <div class="card-body-custom">
        <div class="event-date-label">${escapeText(dateText(event.date,'short'))} • ${escapeText(event.time)}</div>
        <h3><a href="${eventLink(event)}">${escapeText(event.title)}</a></h3>
        <p>${escapeText(event.teaser)}</p>
        <div class="card-bottom"><span class="card-place" title="${escapeText(event.location)}">⌖ ${escapeText(event.location)}</span><a href="${eventLink(event)}" class="card-link" aria-label="اقرأ تفاصيل ${escapeText(event.title)}">التفاصيل ↗</a></div>
      </div>
    </article>
  </div>`;
}
function teamInitials(name) { return String(name).trim().split(/\s+/).slice(0,2).map(t=>t[0]||'').join(''); }
function renderTeam() {
  const inline=$('#home-team');
  if (inline) inline.innerHTML=TEAM_MEMBERS.map(m=>`<div class="team-inline-member"><span class="member-avatar" aria-hidden="true">${escapeText(teamInitials(m.name))}</span><div><strong>${escapeText(m.name)}</strong><small>${escapeText(m.id)} • ${escapeText(m.section)}</small></div></div>`).join('');
  const about=$('#about-team');
  if (about) about.innerHTML=TEAM_MEMBERS.map(m=>`<article class="team-card"><div class="member-avatar" aria-hidden="true">${escapeText(teamInitials(m.name))}</div><div><h3>${escapeText(m.name)}</h3><p>${escapeText(m.role)}</p><small dir="ltr">${escapeText(m.id)} · ${escapeText(m.section)}</small></div></article>`).join('');
}

function initHome() {
  if (document.body.dataset.page !== 'home') return;
  $('#stat-events').textContent = String(EVENTS.length);
  $('#stat-categories').textContent = String(EVENT_CATEGORIES.length);
  const lead=EVENTS[0];
  $('#hero-event-date').textContent=`${dateText(lead.date,'short')} · الساعة ${lead.time}`;
  $('#home-events').innerHTML=EVENTS.slice(0,6).map(eventCard).join('');
  $('#home-categories').innerHTML=EVENT_CATEGORIES.map(cat=>{
    const count=EVENTS.filter(ev=>ev.category===cat.id).length;
    return `<a href="events.html?category=${encodeURIComponent(cat.id)}" class="category-card" data-color="${cat.color}">
      <span class="category-symbol" aria-hidden="true">${cat.symbol}</span><div><h3>${escapeText(cat.name)}</h3><small>${count} ${count===1?'فعالية':'فعاليات'}</small></div></a>`;
  }).join('');
  const featured=EVENTS.slice(0,3);
  let current=0, task=null;
  const slider=$('#featured-slider');
  function paint(index) {
    current=(index+featured.length)%featured.length;
    const item=featured[current], cat=categoryFor(item);
    $('#featured-content').innerHTML=`<img src="assets/img/${item.image}" width="1200" height="760" alt="${escapeText(item.title)}">
      <div class="featured-body"><div class="feature-kicker">✦ ${escapeText(item.tag)} / ${escapeText(cat.name)}</div><h3>${escapeText(item.title)}</h3>
      <p>${escapeText(item.teaser)}</p><div class="featured-meta"><span>◷ ${escapeText(dateText(item.date,'short'))}</span><span>⌖ ${escapeText(item.location)}</span></div>
      <a href="${eventLink(item)}" class="btn btn-main">استكشف التفاصيل <span>↗</span></a></div>`;
    $('#featured-dots').innerHTML=featured.map((f,i)=>`<button type="button" data-slide="${i}" class="${current===i?'active':''}" aria-label="عرض الفعالية ${i+1}: ${escapeText(f.title)}" aria-current="${current===i?'true':'false'}"></button>`).join('');
  }
  function stop(){ if(task!==null){clearInterval(task);task=null;} }
  function start(){stop(); if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) task=setInterval(()=>{if(!document.hidden)paint(current+1);},6500);}
  $('#featured-prev').addEventListener('click',()=>{paint(current-1);start();});
  $('#featured-next').addEventListener('click',()=>{paint(current+1);start();});
  $('#featured-dots').addEventListener('click',evt=>{const btn=evt.target.closest('[data-slide]');if(btn){paint(Number(btn.dataset.slide));start();}});
  slider.addEventListener('mouseenter',stop);slider.addEventListener('mouseleave',start);
  slider.addEventListener('focusin',stop);slider.addEventListener('focusout',start);
  paint(0);start();
}

function initEvents() {
  if (document.body.dataset.page!=='events') return;
  const form=$('#events-filters'), query=$('#search-query'), category=$('#category-filter'), location=$('#location-filter'), date=$('#date-filter'), sort=$('#sort-filter');
  category.insertAdjacentHTML('beforeend',EVENT_CATEGORIES.map(c=>`<option value="${c.id}">${escapeText(c.name)}</option>`).join(''));
  const params=new URLSearchParams(locationSearch());
  const initial=params.get('category') || safeLocal('get','svu-category') || '';
  if (EVENT_CATEGORIES.some(c=>c.id===initial)) category.value=initial;
  query.value=params.get('q') || '';
  location.value=['online','onsite'].includes(params.get('location'))?params.get('location'):'';
  if (/^\d{4}-\d{2}-\d{2}$/.test(params.get('date')||'')) date.value=params.get('date');
  function render() {
    const q=normalizeArabic(query.value);
    let data=EVENTS.filter(e=>{
      const combined=normalizeArabic(`${e.title} ${e.teaser} ${e.location} ${categoryFor(e).name} ${e.highlights.join(' ')}`);
      return (!q || combined.includes(q)) && (!category.value || e.category===category.value)
        && (!location.value || e.locationType===location.value) && (!date.value || e.date>=date.value);
    });
    if(sort.value==='latest') data.sort((a,b)=>b.date.localeCompare(a.date));
    if(sort.value==='soonest') data.sort((a,b)=>a.date.localeCompare(b.date));
    if(sort.value==='title') data.sort((a,b)=>a.title.localeCompare(b.title,'ar'));
    $('#events-results').innerHTML=data.map(eventCard).join('');
    $('#results-count').textContent=`عرض ${data.length} من أصل ${EVENTS.length} فعالية`;
    $('#empty-results').classList.toggle('hidden',data.length>0);
    safeLocal('set','svu-category',category.value);
    const url=new URL(window.location.href);
    for (const [key,val] of [['q',query.value.trim()],['category',category.value],['location',location.value],['date',date.value]]) {
      if(val) url.searchParams.set(key,val); else url.searchParams.delete(key);
    }
    history.replaceState(null,'',url.pathname+url.search);
  }
  function reset() { form.reset();category.value='';query.value='';date.value='';location.value='';sort.value='soonest';render(); }
  for (const el of [query,category,location,date,sort]) el.addEventListener(el===query?'input':'change',render);
  $('#clear-filters').addEventListener('click',reset);
  $('#empty-clear').addEventListener('click',reset);
  form.addEventListener('submit',ev=>ev.preventDefault());
  render();
}
function locationSearch() {return window.location.search;}

function parseEventId() {
  return new URLSearchParams(locationSearch()).get('id');
}
function renderEventDetails() {
  if(document.body.dataset.page!=='event')return;
  const id=parseEventId();
  const event=id?EVENTS.find(e=>e.id===id):EVENTS[0];
  const container=$('#event-detail-content');
  if (!event){
    container.innerHTML=`<div class="not-found"><div class="empty-visual">?</div><h1>لم نجد هذه الفعالية</h1><p>قد يكون الرابط غير صحيح. يمكنك الرجوع إلى قائمة الفعاليات.</p><a href="events.html" class="btn btn-main">العودة إلى كل الفعاليات ↗</a></div>`;
    return;
  }
  document.title=`${event.title} | دليل فعاليات الجامعة الافتراضية`;
  $('#event-crumb').textContent=event.title;
  const cat=categoryFor(event);
  const related=EVENTS.filter(e=>e.id!==event.id).sort((a,b)=>Number(b.category===event.category)-Number(a.category===event.category)).slice(0,3);
  const gallery=[event, ...related.slice(0,2)];
  container.innerHTML=`<div class="event-layout"><div class="event-main">
      <span class="event-category-label">${escapeText(cat.name)} • ${escapeText(event.tag)}</span>
      <h1>${escapeText(event.title)}</h1><p class="event-summary">${escapeText(event.teaser)}</p>
      <div class="event-hero-image"><img src="assets/img/${event.image}" width="1200" height="760" alt="تصميم توضيحي لـ ${escapeText(event.title)}"><span class="image-ribbon">فعالية تجريبية</span></div>
      <section class="content-section"><h2>عن الفعالية</h2><p>${escapeText(event.description)}</p><ul class="highlights-list">${event.highlights.map(s=>`<li>✦ ${escapeText(s)}</li>`).join('')}</ul></section>
      <section class="content-section"><h2>برنامج الفعالية</h2><p>مسار توضيحي للجلسات والأنشطة خلال الفعالية.</p><div class="agenda-list">${event.agenda.map((line,i)=>`<div class="agenda-row"><span>${String(i+1).padStart(2,'0')}</span><strong>${escapeText(line)}</strong></div>`).join('')}</div></section>
      <section class="content-section"><h2>معرض صور توضيحي</h2><p>رسوم أصلية تعكس موضوع الفعالية وفعاليات أخرى قريبة منها.</p><div class="event-gallery">${gallery.map(e=>`<img src="assets/img/${e.image}" width="1200" height="760" loading="lazy" alt="رسم توضيحي: ${escapeText(e.title)}">`).join('')}</div></section>
    </div><aside><div class="info-card"><h2>تفاصيل الموعد والمشاركة</h2>
      <div class="info-entry"><span class="info-entry-symbol">▦</span><div><small>التاريخ</small><strong>${escapeText(dateText(event.date))}</strong></div></div>
      <div class="info-entry"><span class="info-entry-symbol">◷</span><div><small>الوقت</small><strong>${escapeText(event.time)} · المدة ${event.duration} ${event.duration===1?'ساعة':'ساعات'}</strong></div></div>
      <div class="info-entry"><span class="info-entry-symbol">⌖</span><div><small>الموقع</small><strong>${escapeText(event.location)}</strong><small>${event.locationType==='online'?'فعالية عبر الإنترنت (تجريبية)':'مكان حضوري افتراضي'}</small></div></div>
      <div class="info-entry"><span class="info-entry-symbol">♙</span><div><small>السعة التوضيحية</small><strong>${event.seats} مقعداً</strong></div></div>
      <button type="button" class="btn btn-main btn-full" id="open-booking">احجز مقعداً تجريبياً <span>↗</span></button>
      <div class="secondary-action-row"><button type="button" id="calendar-button">▦ أضف للتقويم</button><button type="button" id="share-event">↗ شارك</button></div>
      <p class="info-tip">الحجز محاكاة محلية، ولا يتصل بخدمة تسجيل فعلية.</p>
      <div class="map-box"><img src="assets/img/map.svg" loading="lazy" width="700" height="440" alt="خريطة ثابتة رمزية وليست موقعاً جغرافياً حقيقياً"><small>خريطة توضيحية غير مرتبطة بموقع فعلي.</small></div>
    </div></aside></div>
    <section class="related-events"><div class="related-header"><h2>فعاليات ذات صلة</h2><a class="text-link" href="events.html?category=${encodeURIComponent(event.category)}">استكشف المزيد ↗</a></div><div class="row g-4 cards-row">${related.map(eventCard).join('')}</div></section>`;
  $('#calendar-button').addEventListener('click',()=>downloadCalendar(event));
  $('#share-event').addEventListener('click',()=>shareUrl(window.location.href, event.title));
  $('#open-booking').addEventListener('click',()=>openBooking(event));
  const form=$('#booking-form');
  form.addEventListener('submit',evt=>{
    evt.preventDefault();
    const name=$('#booking-name').value.trim(), email=$('#booking-email').value.trim();
    const validName=name.length>=3, validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    $('#booking-name').classList.toggle('is-invalid',!validName);
    $('#booking-email').classList.toggle('is-invalid',!validEmail);
    const alert=$('#booking-alert');
    if(!validName||!validEmail){alert.innerHTML='<div class="alert alert-danger" role="alert">يرجى إدخال اسم صحيح وبريد إلكتروني صالح.</div>';return;}
    safeLocal('set',`svu-booking-${event.id}`,JSON.stringify({name,email,date:event.date}));
    alert.innerHTML='<div class="alert alert-success" role="alert">تم تسجيل حجز تجريبي على هذا الجهاز فقط. لم يتم إرسال معلوماتك إلى أي جهة.</div>';
    toast('تم حفظ الحجز التجريبي محلياً.');
  });
}
function openBooking(event) {
  $('#bookingTitle').textContent=`حجز تجريبي: ${event.title}`;
  $('#booking-form').reset();
  $('#booking-alert').innerHTML='';
  $$('.is-invalid',$('#booking-form')).forEach(el=>el.classList.remove('is-invalid'));
  const node=$('#bookingModal');
  if(window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(node).show();
  else {node.classList.add('show');node.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
}
function closeFallbackModal() {
  if(window.bootstrap?.Modal) return;
  const node=$('#bookingModal');if(!node)return;
  node.classList.remove('show');node.setAttribute('aria-hidden','true');document.body.style.overflow='';
}
function downloadCalendar(event) {
  // ICS floating local time; لا يحدّد منطقة زمنية بشكل خاطئ.
  const date=event.date.replace(/-/g,'');
  const startM=event.time.replace(':','');
  const endHour=Number(event.time.slice(0,2))+event.duration;
  const endM=`${String(endHour%24).padStart(2,'0')}${event.time.slice(3)}`;
  const endDate=new Date(dateObj(event.date)); if(endHour>=24)endDate.setDate(endDate.getDate()+1);
  const clean=s=>String(s).replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\r?\n/g,'\\n');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MADAR//BWP401 Event Guide//AR','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${event.id}-${event.date}@madar-bwp401.local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART:${date}T${startM}00`,`DTEND:${calendarDateISO(endDate).replace(/-/g,'')}T${endM}00`,`SUMMARY:${clean(event.title)}`,`DESCRIPTION:${clean(event.teaser + ' — موعد تجريبي ضمن مشروع أكاديمي.')}`,`LOCATION:${clean(event.location)}`,'END:VEVENT','END:VCALENDAR'];
  const blob=new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url;a.download=`madar-${event.id}.ics`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('تم إنشاء ملف الموعد وإضافته للتنزيل.');
}
function calendarDateISO(d) {return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

async function shareUrl(url,title='دليل الفعاليات الطلابية') {
  if(navigator.share){try {await navigator.share({title,text:'اكتشف هذه الفعالية في مَدار',url});return;}catch(e){if(e.name==='AbortError')return;}}
  try {
    if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(url);toast('تم نسخ رابط المشاركة.');return;}
  } catch (_e) {}
  const input=document.createElement('textarea');input.value=url;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();
  const ok=document.execCommand('copy');input.remove();toast(ok?'تم نسخ رابط المشاركة.':'تعذر النسخ التلقائي؛ انسخ الرابط من شريط العنوان.',ok?'success':'error');
}
function initSocialShare() {
  $$('[data-share]').forEach(btn=>btn.addEventListener('click',()=>{
    const url=window.location.href;const kind=btn.dataset.share;
    if(kind==='copy'){shareUrl(url);return;}
    const link=kind==='facebook'?`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`:`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(link,'_blank','noopener,noreferrer,width=720,height=570');
  }));
}

function initContact() {
  if(document.body.dataset.page!=='contact')return;
  const form=$('#contact-form'), name=$('#contact-name'),email=$('#contact-email'),message=$('#contact-message'),out=$('#contact-alert');
  const fields=[name,email,message];
  const checks=new Map([[name,()=>name.value.trim().length>=3],[email,()=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())],[message,()=>message.value.trim().length>=10]]);
  message.addEventListener('input',()=>{$('#message-count').textContent=String(message.value.length)});
  fields.forEach(field=>field.addEventListener('input',()=>{if(checks.get(field)())field.classList.remove('is-invalid')}));
  form.addEventListener('submit',evt=>{
    evt.preventDefault();let valid=true;
    fields.forEach(field=>{const ok=checks.get(field)();field.classList.toggle('is-invalid',!ok);field.setAttribute('aria-invalid',String(!ok));if(!ok)valid=false;});
    if(!valid){out.innerHTML='<div class="alert alert-danger" role="alert">تعذر قبول النموذج: تحقّق من الاسم والبريد الإلكتروني والرسالة، ثم حاول مجدداً.</div>';fields.find(f=>f.classList.contains('is-invalid'))?.focus();return;}
    out.innerHTML='<div class="alert alert-success" role="status"><strong>البيانات صحيحة!</strong> تم التحقق من النموذج بنجاح على هذه الصفحة. هذه محاكاة تعليمية؛ لم تُرسل أي رسالة إلكترونية فعلياً.</div>';
    toast('نجح التحقق من البيانات.');
    form.reset();$('#message-count').textContent='0';fields.forEach(f=>{f.classList.remove('is-invalid');f.removeAttribute('aria-invalid')});
  });
}
function initCommon() {
  const year=$('#year');if(year)year.textContent=String(new Date().getFullYear());
  const top=$('#back-to-top');
  if(top){const set=()=>top.classList.toggle('visible',window.scrollY>420);window.addEventListener('scroll',set,{passive:true});set();top.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));}
  const toggle=$('.custom-toggle');if(toggle) toggle.addEventListener('click',()=>{if(window.bootstrap?.Collapse)return;const n=$('#siteNav');const opened=n.classList.toggle('show');toggle.setAttribute('aria-expanded',String(opened));});
  $$('#siteNav .nav-link').forEach(link=>link.addEventListener('click',()=>{if(window.bootstrap?.Collapse)return;$('#siteNav').classList.remove('show');toggle?.setAttribute('aria-expanded','false');}));
  const modal=$('#bookingModal');if(modal){$$('[data-bs-dismiss="modal"]',modal).forEach(b=>b.addEventListener('click',closeFallbackModal));modal.addEventListener('click',e=>{if(e.target===modal)closeFallbackModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFallbackModal();});}
  initSocialShare();renderTeam();
}
document.addEventListener('DOMContentLoaded',()=>{initCommon();initHome();initEvents();renderEventDetails();initContact();});
