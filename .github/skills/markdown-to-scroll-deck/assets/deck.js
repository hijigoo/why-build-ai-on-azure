/* ===========================================================
   1. 시트 스케일링
   슬라이드는 1920×1080으로 작성되어 있으므로, 시트 너비에 맞춰
   전체를 한 번의 transform으로 축소합니다. (내부 레이아웃 불변)
   =========================================================== */
const sheets = Array.from(document.querySelectorAll('.sheet'));
function fitSheets(){
  sheets.forEach(sh => {
    const slide = sh.firstElementChild;
    const f = sh.clientWidth / 1920;
    slide.style.transform = 'scale(' + f + ')';
  });
}
fitSheets();
window.addEventListener('resize', fitSheets);
if (window.ResizeObserver && sheets[0]) new ResizeObserver(fitSheets).observe(sheets[0].parentElement);
document.fonts && document.fonts.ready.then(fitSheets);

/* ===========================================================
   2. 등장 애니메이션 — 화면에 들어올 때 .visible 부여
   =========================================================== */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
document.querySelectorAll('.sheet .slide').forEach(s => io.observe(s));

/* ===========================================================
   3. 스크롤 스파이 — 현재 섹션을 목차에서 하이라이트
   =========================================================== */
const chapters = Array.from(document.querySelectorAll('.chapter'));
const links    = Array.from(document.querySelectorAll('.nav-link'));
const navBox   = document.getElementById('sbNav');
const linkOf   = id => links.find(a => a.dataset.target === id);
let activeId = null;

function syncSpy(){
  const line = window.innerHeight * 0.34;
  let cur = chapters[0];
  for (const c of chapters){
    if (c.getBoundingClientRect().top <= line) cur = c; else break;
  }
  if (!cur || cur.id === activeId) return;
  activeId = cur.id;
  links.forEach(a => a.classList.remove('active'));
  const a = linkOf(cur.id);
  if (a){
    a.classList.add('active');
    const ar = a.getBoundingClientRect(), nr = navBox.getBoundingClientRect();
    if (ar.top < nr.top + 8 || ar.bottom > nr.bottom - 8){
      navBox.scrollTop += (ar.top - nr.top) - navBox.clientHeight / 2 + ar.height;
    }
  }
}

function syncProgress(){
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const p = h > 0 ? (window.scrollY / h) * 100 : 0;
  document.getElementById('topProg').style.width = p + '%';
  document.getElementById('toTop').classList.toggle('show', window.scrollY > 700);
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { syncSpy(); syncProgress(); ticking = false; });
}, {passive:true});
syncSpy(); syncProgress();

/* ===========================================================
   4. 슬라이드 설명
   두 가지 조작이 함께 있다.
     · 사이드바 버튼 / N 키 — 설명란 전체 표시·숨김 (기존 동작)
     · 각 설명 헤더의 토글  — 그 장표의 설명만 접기·펼치기
   둘은 독립적이라, 전체를 껐다 켜도 장표별 접힘 상태는 그대로 남는다.
   =========================================================== */
const notesBtn = document.getElementById('notesBtn');
if (notesBtn){
  notesBtn.addEventListener('click', () => {
    const hidden = document.body.classList.toggle('notes-hidden');
    notesBtn.classList.toggle('on', !hidden);
    setTimeout(syncProgress, 60);
  });
}

const notes = Array.from(document.querySelectorAll('.note'));

function setNote(note, open){
  note.classList.toggle('collapsed', !open);
  const head = note.querySelector('.note-head');
  if (!head) return;
  head.setAttribute('aria-expanded', open ? 'true' : 'false');
  const label = head.querySelector('.note-toggle-t');
  if (label) label.textContent = open ? '접기' : '펼치기';
}

notes.forEach((note, i) => {
  const head = note.querySelector('.note-head');
  if (!head || head.querySelector('.note-toggle')) return;
  const body = note.querySelector('.note-body');
  if (body && !body.id) body.id = 'note-' + String(i + 1).padStart(2, '0');

  const btn = document.createElement('span');
  btn.className = 'note-toggle';
  btn.innerHTML = '<span class="note-toggle-t">접기</span><i class="note-caret" aria-hidden="true"></i>';
  head.appendChild(btn);

  head.setAttribute('role', 'button');
  head.setAttribute('tabindex', '0');
  head.setAttribute('aria-expanded', 'true');
  head.setAttribute('title', '이 장표의 설명 접기 / 펼치기');
  if (body) head.setAttribute('aria-controls', body.id);

  const toggle = () => { setNote(note, note.classList.contains('collapsed')); syncProgress(); };
  head.addEventListener('click', toggle);
  head.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){ e.preventDefault(); toggle(); }
  });
});

/* ===========================================================
   5. 섹션 단위 이동 · 모바일 서랍
   =========================================================== */
function goto(delta){
  const line = window.innerHeight * 0.34;
  let i = 0;
  chapters.forEach((c, k) => { if (c.getBoundingClientRect().top <= line + 2) i = k; });
  const t = chapters[Math.max(0, Math.min(i + delta, chapters.length - 1))];
  if (t) t.scrollIntoView({behavior:'smooth', block:'start'});
}

document.addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (e.key === 'j' || e.key === 'J'){ e.preventDefault(); goto(1); }
  if (e.key === 'k' || e.key === 'K'){ e.preventDefault(); goto(-1); }
  if (e.key === 'n' || e.key === 'N'){ if (notesBtn) notesBtn.click(); }
  if (e.key === 'm' || e.key === 'M'){
    if (isDesktop()) setCollapsed(!document.body.classList.contains('sb-collapsed'));
    else document.body.classList.toggle('sb-open');
  }
});

document.getElementById('toTop').addEventListener('click',
  () => window.scrollTo({top:0, behavior:'smooth'}));

const sbToggle = document.getElementById('sbToggle');
const sbClose  = document.getElementById('sbClose');
const sbScrim  = document.getElementById('sbScrim');
const SB_KEY   = 'wbaoa-sidebar-collapsed';
const isDesktop = () => window.innerWidth > 1100;

/* 접힘 상태는 다음 방문에도 유지됩니다 */
function setCollapsed(v){
  document.body.classList.toggle('sb-collapsed', v);
  try { localStorage.setItem(SB_KEY, v ? '1' : '0'); } catch(e){}
  setTimeout(() => { fitSheets(); syncProgress(); }, 330);
}
try { if (localStorage.getItem(SB_KEY) === '1') document.body.classList.add('sb-collapsed'); } catch(e){}
fitSheets();

sbToggle.addEventListener('click', () => {
  if (isDesktop()) setCollapsed(false);
  else document.body.classList.toggle('sb-open');
});
sbClose.addEventListener('click', () => {
  if (isDesktop()) setCollapsed(true);
  else document.body.classList.remove('sb-open');
});
sbScrim.addEventListener('click', () => document.body.classList.remove('sb-open'));
links.forEach(a => a.addEventListener('click', () => document.body.classList.remove('sb-open')));
