
/* ================= icons (lucide 계열, stroke) ================= */
const PATHS={
  menu:'<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  search:'<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
  home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .7-1.53l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  grid:'<rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/><path d="M17.5 14v7"/><path d="M14 17.5h7"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  mega:'<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  user:'<circle cx="12" cy="8" r="4.5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  chevL:'<path d="m15 18-6-6 6-6"/>',
  chevR:'<path d="m9 18 6-6-6-6"/>',
  chevD:'<path d="m6 9 6 6 6-6"/>',
  pin:'<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  lock:'<rect width="16" height="11" x="4" y="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  copy:'<rect width="13" height="13" x="8" y="8" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
  pencil:'<path d="M21.17 6.81a1 1 0 0 0-3.98-3.98L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  ext:'<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  info:'<circle cx="12" cy="12" r="9.5"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  more:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  minus:'<path d="M6 12h12"/>',
  ring:'<circle cx="12" cy="12" r="5"/>',
  half:'<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  hash:'<path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="m16 3-2 18"/>',
  enter:'<path d="M9 10 4 15l5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>'
};
const GH='<path fill="currentColor" stroke="none" d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/>';
const ic=(n,s=16,sw=2)=>`<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${n==='github'?GH:PATHS[n]}</svg>`;

/* ================= shared pieces ================= */
const mark=`<span class="mark" aria-hidden="true"><i style="background:var(--h3)"></i><i style="background:var(--h1)"></i><i style="background:var(--h1)"></i><i style="background:var(--h3)"></i></span>`;
const logo=`<div class="logo">${mark}잔디로그</div>`;
const AV={'한':'#3B7A57','김':'#4B5FA8','이':'#9A5B3A','박':'#7A5A9A','서':'#4F7A86','정':'#4B5FA8','최':'#8A6A3A','박t':'#4F7A86'};
const av=(ch,cls='',col)=>`<span class="av ${cls}" style="background:${col||AV[ch]}">${ch}</span>`;

const PILL={
  pass:['p-ok','check','통과'], fail:['p-bad','x','미달'], exempt:['p-info','half','면제'],
  first:['p-mute','minus','첫 참가'], pending:['p-mute','ring','아직'], prog:['p-mute','clock','진행 중'],
  valid:['p-warn','alert','유효'], deducted:['p-ok','check','차감됨'], failw:['p-bad','x','미달 (경고)'],
  penalty:['p-solid','alert','벌칙 대상']
};
const pill=(k,t)=>{const[c,i,l]=PILL[k];return `<span class="pill ${c}">${ic(i,12,2.4)}${t||l}</span>`};

/* week strip — h: 잔디 단계 0~4 / r: 기록글(파란 모서리) / v: 인증일(밑줄) / st: past·today·future */
function sq(d,px,rc){
  const cls=['sq',d.st==='future'?'fut':'',d.st==='today'?'tod':''].join(' ');
  const bg=d.st==='future'?'transparent':`var(--h${d.h||0})`;
  return `<span class="${cls}" style="width:${px}px;height:${px}px;background:${bg};--rc:${rc}px">${d.r?'<i class="rc"></i>':''}</span>`;
}
function bigStrip(days,px=46,rc){
  rc=rc||Math.round(px*.3);
  return `<div class="bstrip">${days.map(d=>`<div class="bd">${sq(d,px,rc)}<span class="dl ${d.v?'on':''}">${d.n}</span><i class="ul ${d.v?'':'off'}"></i></div>`).join('')}</div>`;
}
const legend=`<div class="legend"><span><i class="lg-sq"></i>잔디</span><span><i class="lg-rc"></i>기록글</span><span><i class="lg-ul"></i>인증일</span></div>`;
const mstrip=(arr)=>`<span class="mstrip">${arr.map(v=>{
  if(v==='f')return sq({st:'future'},12,6);
  const r=String(v).includes('r');return sq({h:parseInt(v,10),r},12,6);
}).join('')}</span>`;
const wbar=n=>`<div class="wbar">${[0,1,2].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</div>`;

const HOME_DAYS=[{n:'월',h:3,v:1},{n:'화',h:1,r:1,v:1},{n:'수',h:0},{n:'목',h:0,st:'today'},{n:'금',st:'future'},{n:'토',st:'future'},{n:'일',st:'future'}];
const LOGIN_DAYS=[{n:'월',h:2,v:1},{n:'화',h:0,r:1,v:1},{n:'수',h:3,v:1},{n:'목',h:1,v:1},{n:'금',h:0},{n:'토',h:4,r:1,v:1},{n:'일',h:0}];

/* heatmap — 결정적 난수 */
function heat(cols,seed,px=12,gap=3){
  let s=seed;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647};
  let o=`<div style="display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,${px}px);gap:${gap}px">`;
  for(let c=0;c<cols;c++)for(let r=0;r<7;r++){const x=rnd();const l=x>.9?4:x>.76?3:x>.58?2:x>.38?1:0;o+=`<i style="display:block;width:${px}px;height:${px}px;border-radius:2.5px;background:var(--h${l})"></i>`}
  return o+'</div>';
}

/* ================= header search ================= */
function gsearch(state){
  if(state==='open') return `<div class="gs-wrap">
    <div class="gs open">${ic('search',16)}<span class="q">Redis</span><span class="caret"></span><kbd class="esc">Esc</kbd></div>
    <div class="gs-pop" role="listbox" aria-label="검색 제안">
      <div class="grp">
        <div class="gl">게시판에서 찾기</div>
        <div class="it on">${ic('search',16)}<b>Redis</b><span class="sub">트러블슈팅에서 검색</span><span class="kbd">${ic('enter',12,2.2)}</span></div>
        <div class="it">${ic('search',16)}<b>Redis</b><span class="sub">개발일지에서 검색</span></div>
      </div>
      <div class="grp" style="padding-top:0">
        <div class="gl">태그</div>
        <div class="it">${ic('hash',16)}<b>Redis</b><span class="sub">태그 글 모아보기</span></div>
      </div>
      <div class="ft"><span><span class="kbd">↑</span> <span class="kbd">↓</span> 이동</span><span><span class="kbd">Enter</span> 검색</span><span style="margin-left:auto">제목 · 내용 · 태그를 찾아요. 팀과 회원은 찾지 않아요.</span></div>
    </div></div>`;
  return `<div class="gs-wrap"><div class="gs" role="search" title="/ 키로 바로 검색">${ic('search',16)}<span><kbd>/</kbd> 를 눌러 글 검색</span></div></div>`;
}

/* ================= web frame ================= */
function webTop({menu=true,user=true,search=true,searchState}={}){
  return `<div class="wf-top">
    ${menu?`<button class="ib" aria-label="메뉴 열기">${ic('menu',20)}</button>`:''}
    ${logo}
    <span class="grow"></span>
    ${search?gsearch(searchState):''}
    ${search&&user?'<span class="top-sep" aria-hidden="true"></span>':''}
    ${user?`<div class="me">${av('한','sm')}<span>한동관</span></div>`:''}
  </div>`;
}
function wf(o){
  const h=o.header||{};
  return `<section class="shot" data-id="${o.id}" data-t="${o.title}">
    <div class="shot-h"><span class="sid">${o.id}</span><h2>${o.title}</h2>${o.badge==='new'?'<span class="new">신규</span>':o.badge==='chg'?'<span class="chg">검색창 추가</span>':''}${o.note?`<div class="shot-note"><p>${o.note}</p></div>`:''}</div>
    <div class="wf">${webTop(h)}<div class="wf-body${o.dim?' dim':''}"${o.minh?` style="min-height:${o.minh}px"`:''}><div class="wrap ${o.w||'w-lg'}">${o.body}</div></div>${o.overlay||''}</div>
  </section>`;
}

/* ================= web bodies ================= */
const homeBody=`
  <h1 class="pt">한동관님, 이번 주도 잔디 심어볼까요</h1>
  <div style="display:grid;grid-template-columns:1fr 1px 274px;gap:32px;margin-top:34px">
    <section>
      <div class="sh"><h2>이번 주 진행</h2><span class="r muted sm">9/28 월 ~ 10/4 일</span></div>
      <div style="display:flex;gap:40px;align-items:flex-start">
        <div>${bigStrip(HOME_DAYS,46)}${legend}</div>
        <div style="display:flex;gap:40px;padding-top:20px">
          <div><div class="kl">인증일</div><div class="big">2<small>/ 3일</small></div><div class="muted xs" style="margin-top:10px">오늘 오전 6시 기준</div></div>
          <div><div class="kl">기록글 <span style="color:var(--green)">${ic('check',15,2.4)}</span></div><div class="big">1<small>/ 1개</small></div></div>
        </div>
      </div>
      <p style="margin-top:22px;font-size:15px"><b>아직 통과 전이에요. 1일 더 인증하면 통과!</b> <span class="muted">다음 차감까지 1주 남았어요.</span></p>
    </section>
    <span style="background:var(--line)"></span>
    <aside>
      <div class="sh"><h2>내 경고</h2></div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between"><div class="big" style="font-size:32px">1<small>/ 3</small></div><button class="btn btn-o btn-sm">자세히</button></div>
      ${wbar(1)}
      <div class="box box-blue" style="margin-top:34px">${ic('users',15)}<b style="font-size:14px">받은 초대 2건</b><button class="btn btn-o btn-sm" style="margin-left:auto">보러 가기</button></div>
    </aside>
  </div>
  <div class="sh" style="margin-top:40px"><h2>공지</h2><a class="lnk r">전체보기</a></div>
  <ul class="rows">
    <li><span style="color:var(--amber)">${ic('pin',15)}</span><b>잔디 인정 규칙 안내</b><span class="d">9/1</span></li>
    <li><span style="width:15px"></span><b style="font-weight:600">10월 정기 모임은 10/8(목) 저녁 7시예요</b><span class="d">9/29</span></li>
    <li><span style="width:15px"></span><b style="font-weight:600">2학기 스터디 팀 모집</b><span class="d">9/22</span></li>
  </ul>`;

const drawer=`<div class="drawer-ov"></div>
  <nav class="drawer" aria-label="전체 메뉴">
    <div class="dh">${logo}<span class="grow"></span><button class="ib" aria-label="메뉴 닫기">${ic('x',20)}</button></div>
    <div class="dbody"><ul class="dnav">
      <li><div class="top on">${ic('home',18)}홈</div></li>
      <li class="grp"><div class="top">${ic('grid',18)}내 활동</div><div class="sub"><div>주간 활동</div><div>내 경고 · 벌칙</div></div></li>
      <li class="grp"><div class="top">${ic('users',18)}팀</div><div class="sub"><div>내 팀 목록</div><div>팀 만들기</div><div>팀 참가</div><div>받은 초대<span class="cnt">2</span></div></div></li>
      <li class="grp"><div class="top">${ic('file',18)}게시판</div><div class="sub"><div>트러블슈팅</div><div>개발일지</div></div></li>
      <li class="grp"><div class="top">${ic('mega',18)}공지사항</div><div class="sub"><div>공지 목록</div></div></li>
      <li class="grp"><div class="top">${ic('user',18)}프로필</div><div class="sub"><div>내 프로필</div></div></li>
    </ul></div>
    <div class="dft">로그아웃</div>
  </nav>`;

const POSTS=[
  {t:'Redis TTL이 적용되지 않던 문제',tags:['Redis','Spring'],team:'사이드 프로젝트 A팀',by:'한동관',d:'9/29',c:3},
  {t:'GraphQL N+1을 @BatchMapping으로 해결하기',nr:1,tags:['GraphQL','Spring'],by:'김철수',d:'9/28',c:0},
  {t:'Expo 딥링크가 안드로이드에서만 열리지 않을 때',tags:['Expo','ReactNative'],team:'사이드 프로젝트 A팀',by:'박민수',d:'9/26',c:5},
  {t:'Flyway 체크섬 불일치로 서버가 안 뜨는 문제',tags:['Flyway','MariaDB'],by:'이영희',d:'9/24',c:2},
];
const postItem=(p,hi)=>{const t=hi?p.t.replace(hi,`<mark>${hi}</mark>`):p.t;return `<div class="pi">
  <h3>${t}${p.nr?' <span class="pill p-mute" style="font-weight:500">인증 미포함</span>':''}</h3>
  <div class="meta">${p.tags.map(g=>`<span class="tag">#${g}</span>`).join('')}${p.team?`<span class="team-tag">${ic('users',13)}${p.team}</span>`:''}</div>
  <div class="by"><b>${p.by}</b>${p.d}&nbsp;&nbsp;댓글 ${p.c}</div></div>`};
const TAGS=['Spring','Redis','GraphQL','React','Expo','MariaDB','Docker','배포','Flyway','MongoDB'];

const W=[];

W.push(wf({id:'W-01',title:'로그인',header:{menu:false,user:false,search:false},minh:640,
  note:'로그인 전이라 헤더에 검색창을 두지 않는다.',
  body:`<div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:14px">
    ${bigStrip(LOGIN_DAYS,32,10)}
    <h1 style="font-size:46px;font-weight:800;letter-spacing:-.04em;margin:20px 0 10px">잔디로그</h1>
    <p style="font-size:16px;color:var(--ink-2)">꾸준함과 기록을 남기는 곳</p>
    <button class="btn btn-dark" style="width:400px;height:52px;margin-top:42px;font-size:16px">${ic('github',18)}GitHub으로 로그인</button>
    <p class="muted" style="font-size:13.5px;margin-top:14px">첫 로그인 후에는 관리자 승인이 필요해요</p>
    <a class="lnk" style="margin-top:22px">잔디 인정 규칙 보기</a>
  </div>`}));

W.push(wf({id:'W-02',title:'홈',badge:'chg',
  note:'헤더 오른쪽에 검색창을 넣었다. GitHub처럼 입력칸 안에 <span class="kbd">/</span> 단축키를 적어 둬 누르면 바로 들어간다는 걸 알려준다. 검색창과 사용자 메뉴 사이는 세로선으로 나눈다.',
  body:homeBody}));

W.push(wf({id:'W-03',title:'전체 메뉴 (드로어)',
  note:'햄버거 버튼으로 여는 전체 메뉴. 검색은 헤더에 따로 있으므로 드로어에는 넣지 않는다.',
  body:homeBody,overlay:drawer}));

W.push(wf({id:'W-04',title:'헤더 검색 — 입력 중',badge:'new',header:{searchState:'open'},dim:true,
  note:'<span class="kbd">/</span>를 누르거나 검색창을 누르면 넓어지며 제안 목록이 열린다. 찾는 곳은 <b>게시판뿐</b>이다 — 트러블슈팅 · 개발일지 제목·내용 검색과 태그 모아보기. 목록 아래에 “팀과 회원은 찾지 않아요”를 적어 전역 검색으로 오해하지 않게 한다. 글을 쓰는 중(입력칸에 커서가 있을 때)에는 <span class="kbd">/</span>가 글자로 입력되고 검색창이 열리지 않는다.',
  body:homeBody}));

W.push(wf({id:'W-05',title:'헤더 검색 — 결과',badge:'new',
  note:'Enter를 누르면 게시판 목록으로 이동해 결과를 보여준다. 게시판 안 검색창에 같은 검색어가 채워져 있어 여기서 이어서 고칠 수 있다. 기본 탭은 트러블슈팅이며, 개발일지 결과 수도 탭에 함께 보여 준다 <span class="muted">(제안)</span>.',
  body:`<div style="display:flex;align-items:center">
      <div class="seg"><span class="on">트러블슈팅 <b style="margin-left:6px;color:var(--green)">3</b></span><span>개발일지 <b style="margin-left:6px;color:var(--ink-3)">1</b></span></div>
      <button class="btn btn-p" style="margin-left:auto">${ic('pencil',15)}글쓰기</button></div>
    <div class="inp" style="max-width:560px;margin-top:22px;border-color:#B5C0B9">${ic('search',17)}<span style="font-weight:600">Redis</span><span style="margin-left:auto;color:var(--ink-3)">${ic('x',16)}</span></div>
    <p style="margin-top:14px;font-size:14px"><b>‘Redis’</b> <span class="muted">검색 결과 3건 · 제목 · 내용 · 태그에서 찾았어요</span></p>
    <div class="plist" style="margin-top:6px">
      ${postItem(POSTS[0],'Redis')}
      ${postItem({t:'Upstash Redis 명령 수가 갑자기 늘어난 이유',tags:['Redis','Upstash'],by:'이영희',d:'9/19',c:1},'Redis')}
      ${postItem({t:'헬스체크에서 캐시 서버를 뺀 이유',tags:['Redis','Actuator'],team:'사이드 프로젝트 A팀',by:'한동관',d:'9/15',c:0})}
    </div>
    <p class="foot">세 번째 글은 제목에는 없고 태그 <b>#Redis</b>로 찾은 결과예요.</p>`}));

W.push(wf({id:'W-06',title:'내 주간 활동',
  body:`<h1 class="pt">내 주간 활동</h1><p class="pt-sub">판정은 월요일 오전에 개인 단위로 한 번만 이뤄져요</p>
    <div style="display:flex;align-items:center;gap:14px;margin:26px 0 28px;font-size:16px;font-weight:700">${ic('chevL',18)}9월 28일 ~ 10월 4일<span style="color:var(--ink-4)">${ic('chevR',18)}</span></div>
    <div style="display:grid;grid-template-columns:1fr 340px;gap:40px;align-items:start">
      <section>
        <div class="sh"><h2>날짜별 인증</h2><span class="r muted xs">오늘 오전 6시 기준</span></div>
        <div style="margin-bottom:16px">${bigStrip(HOME_DAYS,54)}</div>
        <div class="tb"><table>
          <thead><tr><th>날짜</th><th>GitHub 잔디</th><th>기록글</th><th>인증일</th><th>내역</th></tr></thead>
          <tbody>
            <tr><td><b>9/28 월</b></td><td><span class="mstrip">${sq({h:3},12,6)}${sq({h:3},12,6)}${sq({h:3},12,6)}</span> <span class="muted xs">3칸</span></td><td class="muted">—</td><td>${pill('pass','1일')}</td><td class="sm">잔디 3칸</td></tr>
            <tr><td><b>9/29 화</b></td><td>${sq({h:1},12,6)} <span class="muted xs">1칸</span></td><td><span class="pill p-info" style="font-weight:600">기록글 1개</span></td><td>${pill('pass','1일')}</td><td class="sm">잔디 1칸 + 기록글 1개</td></tr>
            <tr><td><b>9/30 수</b></td><td class="muted">—</td><td class="muted">—</td><td class="muted sm">0일</td><td class="sm">활동 없음</td></tr>
            <tr><td><b>10/1 목</b></td><td class="muted">—</td><td class="muted">—</td><td class="muted sm">0일</td><td class="sm">오늘</td></tr>
            <tr><td class="muted">10/2 금</td><td colspan="4" class="muted sm">아직 오지 않은 날이에요</td></tr>
            <tr><td class="muted">10/3 토</td><td colspan="4" class="muted sm">아직 오지 않은 날이에요</td></tr>
            <tr><td class="muted">10/4 일</td><td colspan="4" class="muted sm">아직 오지 않은 날이에요</td></tr>
          </tbody></table></div>
        <p class="foot">잔디와 기록글이 둘 다 있어도 인증일은 1일로만 세요. 하루에 여러 번 활동해도 인증일은 하루예요.</p>
      </section>
      <aside class="card" style="padding:22px 24px">
        <h2 style="font-size:17px;margin-bottom:16px">이번 주 판정</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
          <div><div class="kl" style="font-size:13px">인증일 3일 이상</div><div class="big" style="font-size:30px">2<small>/ 3일</small></div></div>
          <div><div class="kl" style="font-size:13px">기록글 1개 이상 <span style="color:var(--green)">${ic('check',14,2.4)}</span></div><div class="big" style="font-size:30px">1<small>/ 1개</small></div></div>
        </div>
        <p style="margin-top:18px;font-size:14px;font-weight:700">아직 통과 전이에요. 1일 더 인증하면 통과!</p>
        <p class="muted xs" style="margin-top:4px">월요일 오전 판정에서 확정돼요.</p>
      </aside>
    </div>
    <div class="sh" style="margin-top:44px"><h2>지난 판정</h2></div>
    <div class="tb"><table>
      <thead><tr><th style="width:36%">주차</th><th>인증일</th><th>기록글</th><th>결과</th></tr></thead>
      <tbody>
        <tr><td>9/21 ~ 9/27</td><td>4일</td><td>1개</td><td>${pill('pass')}</td></tr>
        <tr><td>9/14 ~ 9/20</td><td>1일</td><td>0개</td><td>${pill('fail')}</td></tr>
        <tr><td>9/7 ~ 9/13</td><td>—</td><td>—</td><td>${pill('exempt')}</td></tr>
        <tr><td>8/31 ~ 9/6</td><td>3일</td><td>2개</td><td>${pill('pass')}</td></tr>
        <tr><td>8/24 ~ 8/30</td><td>—</td><td>—</td><td>${pill('first')}</td></tr>
      </tbody></table></div>
    <p class="foot">확정된 판정은 글을 지워도 바뀌지 않아요. 관리자 정정으로만 바꿀 수 있어요.</p>`}));

W.push(wf({id:'W-07',title:'내 경고 · 벌칙',
  body:`<h1 class="pt">내 경고 · 벌칙</h1><p class="pt-sub">경고는 사람 단위로 쌓이고, 어느 팀에서 받았는지는 카테고리로 붙어요</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px">
      <div><div class="kl">누적 경고</div><div class="big">1<small>/ 3회</small></div>${wbar(1)}<p style="margin-top:14px;font-size:14px;font-weight:700">벌칙까지 2회 남았어요</p></div>
      <div><div class="kl">연속 통과</div><div class="big">1<small>/ 2주</small></div><p class="muted" style="margin-top:22px;font-size:14px">이번 주를 통과하면 경고 1개가 차감되고 연속 횟수는 0으로 돌아가요.</p></div>
    </div>
    <div class="sh" style="margin-top:40px"><h2>경고 이력</h2></div>
    <div class="tb"><table>
      <thead><tr><th>발생 주차</th><th>사유</th><th>팀 카테고리</th><th>상태</th></tr></thead>
      <tbody>
        <tr><td>9/14 ~ 9/20</td><td>인증일 1일 · 기록글 0개</td><td>사이드 프로젝트 A팀, 비공개 팀</td><td>${pill('valid')}</td></tr>
        <tr><td>7/13 ~ 7/19</td><td>인증일 2일 · 기록글 0개</td><td>웹 프로젝트 B팀</td><td>${pill('deducted')}</td></tr>
      </tbody></table></div>
    <p class="foot">비공개 팀은 팀 이름 대신 “비공개 팀”으로 보여요. 팀에서 추방되거나 팀이 삭제되면 그 카테고리가 빠지고, 남은 카테고리가 없으면 경고가 사라져요.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px">
      <div><h2 style="font-size:17px;margin-bottom:14px">경고가 쌓이는 기준</h2>
        <div style="border-top:1px solid var(--line)">
          ${[['주간 미달','인증일 3일 미만이거나 기록글이 0개면 경고 1회'],['2주 연속 통과','가장 오래된 경고 1개 차감, 연속 횟수 초기화'],['경고 3회','벌칙 대상이 되고 차감이 멈춰요'],['면제 주간','판정하지 않고 연속 횟수도 그대로예요']].map(([k,v])=>`<div style="display:grid;grid-template-columns:114px 1fr;padding:12px 0;border-bottom:1px solid var(--line);font-size:14px"><b>${k}</b><span class="muted">${v}</span></div>`).join('')}
        </div></div>
      <div><h2 style="font-size:17px;margin-bottom:14px">벌칙 대상이 되면</h2><p class="muted" style="font-size:14px;line-height:1.75">경고가 3회에 도달하면 벌칙 대상이 되고, 그 뒤로는 연속 통과해도 차감되지 않아요. 운영진이 오프라인에서 벌칙 이행을 확인하고 체크하면 경고가 초기화돼요.</p></div>
    </div>`}));

W.push(wf({id:'W-08',title:'내 팀',
  body:`<div style="display:flex;align-items:flex-start"><h1 class="pt">내 팀</h1><div style="margin-left:auto;display:flex;gap:8px"><button class="btn btn-o">초대코드 입력</button><button class="btn btn-p">팀 만들기</button></div></div>
    <div class="box box-blue" style="margin-top:24px">${ic('users',15)}<b>받은 초대 2건</b><button class="btn btn-o btn-sm" style="margin-left:auto">보러 가기</button></div>
    ${[['사이드 프로젝트 A팀',`<span class="pill p-dark">팀장</span><span class="pill p-line">공개</span>`,'팀원 4명','1','0','3'],
       ['알고리즘 스터디',`<span class="pill p-line">${ic('lock',12)}비공개</span>`,'팀원 6명','3','0','3']].map(([n,b,m,p,f,w])=>`
      <div class="card" style="display:flex;align-items:center;padding:20px 22px;margin-top:12px">
        <div><div style="display:flex;align-items:center;gap:8px;font-size:17px;font-weight:700">${n}${b}</div>
        <div class="muted" style="margin-top:6px;font-size:13.5px">${m}&nbsp;&nbsp; 이번 주 통과 <b style="color:var(--ink)">${p}명</b>&nbsp;&nbsp; 미달 <b style="color:var(--ink)">${f}명</b>&nbsp;&nbsp; 아직 <b style="color:var(--ink)">${w}명</b></div></div>
        <span style="margin-left:auto;color:var(--ink-4)">${ic('chevR',20)}</span></div>`).join('')}`}));

const TEAM=[
  {n:'한동관',c:'한',me:1,s:['3','1r','0','0','f','f','f'],d:2,p:1,w:1,st:'pending'},
  {n:'김철수',c:'김',s:['2','0r','3','1r','f','f','f'],d:4,p:2,w:0,st:'pass'},
  {n:'이영희',c:'이',s:['0','0','0','0','f','f','f'],d:0,p:0,w:2,st:'pending'},
  {n:'박민수',c:'박',s:['4','2','3','1','f','f','f'],d:4,p:0,w:0,st:'pending'},
];
W.push(wf({id:'W-09',title:'팀 현황판',
  body:`<div style="display:flex;align-items:center;gap:10px"><h1 class="pt">사이드 프로젝트 A팀</h1><span class="pill p-line">공개</span>
      <div style="margin-left:auto;display:flex;align-items:center;gap:10px"><span class="muted xs">팀장 전용</span><button class="btn btn-o">팀원 관리</button><button class="btn btn-o">개인 면제 요청</button></div></div>
    <div class="sh" style="margin-top:28px"><h2>이번 주 <span style="font-weight:500;color:var(--ink-2)">(9/28 월 ~ 10/4 일)</span></h2><span class="r muted xs">인증일은 오늘 오전 6시 기준이에요</span></div>
    <div class="tb"><table>
      <thead><tr><th>이름</th><th>인증일</th><th>기록글</th><th>경고</th><th>상태</th></tr></thead>
      <tbody>${TEAM.map(t=>`<tr class="${t.me?'hl':''}">
        <td><div style="display:flex;align-items:center;gap:10px">${av(t.c)}<b style="font-size:15px">${t.n}</b>${t.me?'<span class="muted xs">나</span>':''}</div></td>
        <td>${mstrip(t.s)} <b style="margin-left:8px;font-size:15px">${t.d}일</b></td>
        <td>${t.p}개</td><td class="num">${t.w}</td><td>${pill(t.st)}</td></tr>`).join('')}</tbody></table></div>
    <p class="foot">경고는 이 팀에서 받은 것만 세요. “아직”은 조건을 채우지 못했지만 주가 끝나지 않아 만회할 수 있다는 뜻이에요.</p>
    <div class="sh" style="margin-top:40px"><h2>이 팀의 기록글</h2><a class="lnk r">전체보기</a></div>
    <ul class="rows">${[['트러블슈팅','Redis TTL이 적용되지 않던 문제','한동관','9/29'],['개발일지','GraphQL 스키마 초안 정리','김철수','9/29'],['트러블슈팅','Expo 딥링크가 안드로이드에서만 열리지 않을 때','박민수','9/26'],['개발일지','Docker Compose로 로컬 DB 통일','한동관','9/22'],['개발일지','팀 현황판 표 컴포넌트 만들기','김철수','9/21']].map(([c,t,b,d])=>`
      <li><span class="cat">${c}</span><span style="font-weight:600">${t}</span><span class="d">${b}&nbsp;&nbsp; ${d}</span></li>`).join('')}</ul>`}));

W.push(wf({id:'W-10',title:'팀 관리',w:'w-md',
  body:`<h1 class="pt">팀 관리</h1><p class="pt-sub">사이드 프로젝트 A팀</p>
    <h2 style="font-size:17px;margin:34px 0 14px">초대코드</h2>
    <div style="display:flex;align-items:center;gap:14px"><span style="font-size:23px;font-weight:800;letter-spacing:.14em">JD7K-Q2MA</span><button class="btn btn-o btn-sm">${ic('copy',14)}복사</button></div>
    <p class="hint">다시 발급할 수 없어요. 이 영역을 보여줄지는 정해지지 않았어요 (미결 Q-01).</p>
    <h2 style="font-size:17px;margin:34px 0 14px">아이디로 초대</h2>
    <div style="display:flex;gap:8px"><div class="inp ph">${ic('search',16)}GitHub 아이디</div><button class="btn btn-p" style="height:46px">초대</button></div>
    <p class="hint">가입한 회원만 초대할 수 있어요</p>
    <ul class="rows" style="margin-top:14px"><li><b>@seoyeon-lee</b><span class="muted xs">대기 중</span><span class="d" style="color:var(--ink);font-weight:600">취소</span></li></ul>
    <div class="sh" style="margin-top:40px"><h2>팀원</h2><span class="r muted sm">4명</span></div>
    <ul class="rows">
      <li>${av('한')}<b>한동관</b><span class="muted xs">@handong-gwan</span><span class="pill p-dark">팀장</span></li>
      ${[['김','김철수','@chulsoo-kim'],['이','이영희','@younghee-dev'],['박','박민수','@minsu-park']].map(([c,n,h])=>`<li>${av(c)}<b>${n}</b><span class="muted xs">${h}</span><span style="margin-left:auto;display:flex;gap:6px"><button class="btn btn-o btn-xs">팀장 넘기기</button><button class="btn btn-dg btn-xs">추방</button></span></li>`).join('')}
    </ul>
    <h2 style="font-size:17px;margin:40px 0 14px">공개 설정</h2>
    <div class="card" style="display:flex;align-items:center;padding:18px 20px"><div><b>공개</b><p class="muted sm" style="margin-top:3px">프로필과 게시글에 팀 이름이 보여요. 끄면 이름만 숨기고 글은 그대로 전체 공개예요.</p></div>
      <span style="margin-left:auto;width:46px;height:28px;border-radius:14px;background:var(--h3);position:relative;flex:none"><i style="position:absolute;right:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff"></i></span></div>
    <h2 style="font-size:17px;margin:40px 0 14px">팀 글 관리</h2>
    <ul class="rows">${[['글','Redis TTL이 적용되지 않던 문제','한동관'],['글','GraphQL 스키마 초안 정리','김철수'],['댓글','저도 같은 문제 겪었어요','이영희']].map(([k,t,b])=>`<li><span class="cat">${k}</span><div><b style="font-weight:600">${t}</b><div class="muted xs">${b}</div></div><button class="btn btn-o btn-xs" style="margin-left:auto">수정</button></li>`).join('')}</ul>
    <p class="hint">삭제는 관리자에게 문의해 주세요.</p>
    <h2 style="font-size:17px;margin:40px 0 10px">팀 나가기 · 삭제</h2>
    <p style="font-size:14px;color:var(--ink-2)">팀장은 다른 팀원에게 팀장을 넘긴 뒤에 나갈 수 있어요.</p>
    <div style="margin-top:18px;border:1px solid var(--red-line);background:#FFF7F6;border-radius:12px;padding:18px 20px;display:flex;align-items:center">
      <div><b style="color:var(--red)">팀 삭제</b><p class="sm" style="margin-top:3px;color:var(--ink-2)">되돌릴 수 없어요. 글은 남지만 팀 이름은 사라져요.</p></div>
      <button class="btn btn-dg" style="margin-left:auto">팀 삭제</button></div>`}));

W.push(wf({id:'W-11',title:'게시판',
  note:'게시판 안 검색창은 그대로 둔다. 헤더 검색은 여기로 들어오는 지름길이다.',
  body:`<div style="display:flex;align-items:center"><div class="seg"><span class="on">트러블슈팅</span><span>개발일지</span></div><button class="btn btn-p" style="margin-left:auto">${ic('pencil',15)}글쓰기</button></div>
    <div class="inp ph" style="max-width:560px;margin-top:22px">${ic('search',17)}제목, 내용, 태그로 검색</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">${TAGS.map(t=>`<span class="tag">#${t}</span>`).join('')}</div>
    <div class="plist" style="margin-top:8px">${POSTS.map(p=>postItem(p)).join('')}</div>
    <div style="text-align:center;margin-top:20px"><button class="btn btn-o">더 보기</button></div>`}));

W.push(wf({id:'W-12',title:'글 상세',w:'w-md',
  body:`<span class="cat">트러블슈팅</span>
    <h1 class="pt" style="font-size:32px;margin-top:12px">Redis TTL이 적용되지 않던 문제</h1>
    <div style="display:flex;align-items:center;gap:10px;margin-top:18px">${av('한')}<b>한동관</b><span class="muted xs">9/29 14:20</span><span style="margin-left:auto;display:flex;gap:6px"><button class="btn btn-o btn-sm">수정</button><button class="btn btn-dg btn-sm">삭제</button></span></div>
    <div style="display:flex;gap:8px;align-items:center;margin-top:14px"><span class="tag">#Redis</span><span class="tag">#Spring</span><span class="team-tag">${ic('users',13)}사이드 프로젝트 A팀</span></div>
    <div style="border-top:1px solid var(--line);margin-top:22px">
      ${[['문제','TTL을 걸었는데 키가 사라지지 않았어요. 캐시가 계속 남아서 새 잔디 데이터가 화면에 반영되지 않았어요.'],
         ['원인','set 다음에 expire를 따로 호출했는데, 두 명령 사이에 다른 요청이 set을 한 번 더 실행하면서 TTL이 풀려 버렸어요.'],
         ['해결','set 명령에 ex 옵션을 같이 넘겨서 저장과 만료 설정을 한 번에 하도록 바꿨어요. 같은 문제가 생기지 않게 캐시 저장은 한 곳에서만 하도록 모았어요.']].map(([h,b],i)=>`
        <div style="padding:22px 0;${i<2?'border-bottom:1px solid var(--line-2)':''}"><div style="font-size:14px;font-weight:800;color:var(--green);margin-bottom:10px">${h}</div><p style="font-family:var(--serif);font-size:16px;line-height:1.95;color:#27302B">${b}</p></div>`).join('')}
    </div>
    <div class="card" style="display:flex;align-items:center;gap:12px;padding:16px 18px">${ic('github',20)}<div><div class="muted xs">관련 커밋</div><b style="font-weight:600">jandilog/server · a1b2c3d</b></div><span style="color:var(--ink-3)">${ic('ext',15)}</span></div>
    <div class="sh" style="margin-top:36px"><h2>댓글 2</h2></div>
    <ul class="rows">
      <li style="align-items:flex-start">${av('김')}<div><div><b>김철수</b> <span class="muted xs">9/29 15:02</span></div><div style="margin-top:4px">저도 같은 문제 겪었어요. ex 옵션 몰랐는데 덕분에 알았어요.</div></div></li>
      <li style="align-items:flex-start">${av('한')}<div><div><b>한동관</b> <span class="muted xs">9/29 15:30</span></div><div style="margin-top:4px">저도 한참 헤맸어요. 커밋 링크 참고해 주세요!</div></div><span style="margin-left:auto;display:flex;gap:18px;font-size:14px;font-weight:600"><span>수정</span><span style="color:var(--red)">삭제</span></span></li>
    </ul>
    <div style="display:flex;gap:8px;margin-top:16px"><div class="inp ph">댓글을 입력하세요</div><button class="btn btn-p" style="height:46px" disabled>등록</button></div>`}));

W.push(wf({id:'W-13',title:'글쓰기',w:'w-md',
  note:'“배운 점” 입력칸 안내 문구의 “을(를)”을 “을”로 바로잡았다.',
  body:`<div style="display:flex;align-items:center"><h1 class="pt">글쓰기</h1><div class="seg" style="margin-left:auto"><span>트러블슈팅</span><span class="on">개발일지</span></div></div>
    <div class="field" style="margin-top:26px"><label>제목<span class="req">*</span></label><div class="inp strong">팀 현황판 표 컴포넌트 만들기</div></div>
    <div class="field"><label>한 일<span class="req">*</span></label><div class="inp ta">팀 현황판 표를 만들고 요일 7칸 점 표시를 붙였어요.</div></div>
    <div class="field"><label>배운 점<span class="req">*</span></label><div class="inp ta" style="color:var(--ink-4)">배운 점을 적어 주세요</div></div>
    <div class="box box-mute">${ic('info',16)}필수 항목을 다 채우면 인증에 들어가요 (1 / 2)</div>
    <div class="hr"></div>
    <div class="field"><label>태그<span class="opt">최대 5개</span></label><div class="inp"><span class="tag" style="height:26px">#React ${ic('x',12)}</span><span class="muted">태그 입력 후 Enter</span></div></div>
    <div class="field"><label>관련 커밋<span class="opt">선택</span></label><div class="inp ph">https://github.com/소유자/저장소/commit/…</div></div>
    <div class="field"><label>소속 팀<span class="opt">선택</span></label><div class="inp">사이드 프로젝트 A팀<span style="margin-left:auto">${ic('chevD',16)}</span></div></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn btn-t">취소</button><button class="btn btn-p" style="height:52px;padding:0 24px">등록</button></div>`}));

W.push(wf({id:'W-14',title:'프로필',
  body:`<div style="display:flex;gap:26px;align-items:flex-start">
      <span style="width:88px;height:88px;border-radius:50%;background:#D8DFDB;display:grid;place-items:center;color:#6F7A74">${ic('user',40,1.6)}</span>
      <div><h1 class="pt">한동관</h1><div class="muted sm" style="display:flex;gap:5px;align-items:center;margin-top:4px">@handong-gwan ${ic('ext',12)}</div>
        <div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-o btn-sm">프로필 수정</button><button class="btn btn-o btn-sm">${ic('shield',15)}관리자 메뉴</button></div></div>
    </div>
    <div style="display:flex;gap:26px;margin-top:22px;font-size:13.5px"><span class="muted">게시글 <b style="font-size:18px;color:var(--ink);margin-left:6px">12</b></span><span class="muted">댓글 <b style="font-size:18px;color:var(--ink);margin-left:6px">34</b></span></div>
    <div class="sh" style="margin-top:44px"><h2>GitHub 잔디</h2><span class="r muted xs">오늘 오전 6시 기준</span></div>
    <div class="card" style="padding:18px;overflow:hidden">${heat(53,7,11.6,3.2)}</div>
    <div style="display:grid;grid-template-columns:320px 1fr;gap:40px;margin-top:44px;align-items:start">
      <div><h2 style="font-size:17px">경고</h2><div class="big" style="font-size:32px;margin:12px 0 16px">1<small>/ 3</small></div>
        <ul class="rows"><li><span>사이드 프로젝트 A팀</span><b class="d" style="color:var(--ink)">1회</b></li><li><span>비공개 팀</span><b class="d" style="color:var(--ink)">1회</b></li></ul>
        <p class="foot">경고 1개에 여러 팀이 함께 붙을 수 있어서, 팀별 합계는 누적 경고 수와 다를 수 있어요.</p></div>
      <div><h2 style="font-size:17px;margin-bottom:14px">주간 판정 이력</h2>
        <div class="tb"><table><thead><tr><th>주차</th><th>인증일</th><th>기록글</th><th>결과</th></tr></thead><tbody>
          <tr><td>9/28 ~ 10/4</td><td>2일</td><td>1개</td><td>${pill('prog')}</td></tr>
          <tr><td>9/21 ~ 9/27</td><td>4일</td><td>1개</td><td>${pill('pass')}</td></tr>
          <tr><td>9/14 ~ 9/20</td><td>1일</td><td>0개</td><td>${pill('failw')}</td></tr>
          <tr><td>9/7 ~ 9/13</td><td>—</td><td>—</td><td>${pill('exempt')}</td></tr>
          <tr><td>8/31 ~ 9/6</td><td>3일</td><td>2개</td><td>${pill('pass')}</td></tr>
        </tbody></table></div>
        <div style="text-align:center;margin-top:14px"><button class="btn btn-o btn-sm">더 보기</button></div></div>
    </div>
    <h2 style="font-size:17px;margin:34px 0 12px">소속 팀</h2>
    <span class="cat" style="height:32px;padding:0 12px;gap:6px">${ic('users',13)}사이드 프로젝트 A팀</span>`}));

const atabs=(on)=>`<div class="atabs">${[['관리자 대시보드'],['경고 복구 · 벌칙',2],['가입 승인',3],['면제 관리',2],['공지 관리'],['게시물 관리']].map(([t,c],i)=>`<span class="${i===on?'on':''}">${t}${c?`<i class="c">${c}</i>`:''}</span>`).join('')}</div>`;
const adminHead=`<div style="display:flex;align-items:baseline"><h1 class="pt">관리자</h1><span class="muted sm" style="margin-left:auto">2026년 10월 1일 목요일</span></div>`;

W.push(wf({id:'W-15',title:'관리자 — 대시보드 · 판정 정정',w:'w-xl',
  body:`${adminHead}${atabs(0)}
    <div class="kpi"><div class="card">승인 대기<b>3</b></div><div class="card">이번 주 미달<b>4</b></div><div class="card">벌칙 대상<b class="red">2</b></div><div class="card">면제 요청 대기<b>2</b></div></div>
    <div class="sh"><h2>판정 결과</h2></div>
    <div style="display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start">
      <div class="card" style="padding:18px">
        <div style="display:flex;gap:8px"><span class="sel" style="width:186px">9/21 ~ 9/27 (지난 주)${ic('chevD',15)}</span><div class="inp ph" style="height:40px;font-size:13.5px">${ic('search',15)}닉네임 또는 GitHub 아이디</div><span class="sel" style="width:92px">전체${ic('chevD',15)}</span></div>
        <p class="sm" style="margin:12px 0 14px;color:var(--ink-2)">통과 <b>18</b>&nbsp;&nbsp; 미달 <b>4</b>&nbsp;&nbsp; 면제 <b>2</b>&nbsp;&nbsp; 첫 참가 <b>1</b>&nbsp;&nbsp;&nbsp;&nbsp;<span class="muted">9/28 07:00 실행</span></p>
        <div class="tb"><table><thead><tr><th>회원</th><th>인증일</th><th>기록글</th><th>결과</th><th>누적 경고</th><th class="r">처리</th></tr></thead><tbody>
          <tr class="hl-b"><td><div style="display:flex;align-items:center;gap:9px">${av('박','','#4F7A86')}<b>박지훈</b></div></td><td>0일</td><td>0개</td><td>${pill('fail')}</td><td>3 ${pill('penalty')}</td><td class="r" style="color:var(--blue);font-weight:600">정정 중</td></tr>
          ${[['김','김철수','4일','1개','pass',0],['이','이영희','2일','0개','fail',2],['박','박민수','5일','3개','pass',0],['한','한동관','4일','1개','pass',1],['서','서연','—','—','first',0]].map(([c,n,d,p,s,w])=>`<tr><td><div style="display:flex;align-items:center;gap:9px">${av(c)}<b>${n}</b></div></td><td>${d}</td><td>${p}</td><td>${pill(s)}</td><td>${w}</td><td class="r" style="font-weight:600">정정</td></tr>`).join('')}
        </tbody></table></div>
        <div style="display:flex;justify-content:center;gap:6px;margin-top:14px"><span class="btn btn-dark btn-xs" style="width:34px">1</span><span class="btn btn-o btn-xs" style="width:34px">2</span></div>
      </div>
      <aside class="card" style="padding:22px">
        <div style="display:flex;align-items:center"><h2 style="font-size:17px">판정 정정</h2><span style="margin-left:auto;color:var(--ink-2)">${ic('x',20)}</span></div>
        <div style="display:flex;align-items:center;gap:10px;margin:18px 0 20px">${av('박','','#4F7A86')}<div><b>박지훈</b><div class="muted xs">9/21 ~ 9/27 · 인증일 0일, 기록글 0개</div></div></div>
        <div class="kl" style="font-size:14px">결과</div>
        <div class="radio-c"><span class="rdo"></span><div><b>미달</b><div class="muted xs">지금 결과</div></div></div>
        <div class="radio-c on"><span class="rdo"></span><b>통과로 정정</b></div>
        <div class="radio-c"><span class="rdo"></span><b>면제로 정정</b></div>
        <div class="kl" style="font-size:14px;margin-top:16px">사유 <span style="color:var(--red)">*</span></div>
        <div class="inp ta" style="height:76px;font-family:var(--sans);font-size:14px">GitHub 비공개 기여 설정이 꺼져 있었던 것을 확인했어요</div>
        <div class="kl" style="font-size:13.5px;margin-top:18px">재계산 미리보기</div>
        <div class="tb"><table><tbody>
          <tr><td>경고</td><td class="r"><b>3회 → 2회</b></td></tr>
          <tr><td>벌칙 대상</td><td class="r" style="color:var(--green);font-weight:700">해제</td></tr>
          <tr><td>다시 계산되는 주차</td><td class="r"><b>1주</b></td></tr>
        </tbody></table></div>
        <p class="hint">아직 아무것도 바뀌지 않았어요. 아래 버튼을 눌러야 반영돼요.</p>
        <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:16px"><button class="btn btn-t">취소</button><button class="btn btn-p">정정하고 재계산</button></div>
      </aside>
    </div>`}));

W.push(wf({id:'W-16',title:'관리자 — 경고 복구 · 벌칙',w:'w-xl',
  body:`${adminHead}${atabs(1)}
    <h2 style="font-size:20px;margin-bottom:22px">경고 복구 · 벌칙</h2>
    <div class="sh"><h2>벌칙 대상</h2><span class="r muted sm">2명</span></div>
    <div class="tb"><table><thead><tr><th>회원</th><th>경고</th><th>도달</th><th>경고가 붙은 팀</th><th class="r">처리</th></tr></thead><tbody>
      <tr><td><div style="display:flex;align-items:center;gap:9px">${av('박','','#4F7A86')}<b>박지훈</b></div></td><td>3 ${pill('penalty')}</td><td>9/28</td><td>사이드 프로젝트 A팀, 알고리즘 스터디 <span class="muted xs">(비공개)</span></td><td class="r"><button class="btn btn-p btn-sm">이행 완료</button></td></tr>
      <tr><td><div style="display:flex;align-items:center;gap:9px">${av('정')}<b>정하늘</b></div></td><td>3 ${pill('penalty')}</td><td>9/21</td><td>웹 프로젝트 B팀</td><td class="r"><button class="btn btn-p btn-sm">이행 완료</button></td></tr>
    </tbody></table></div>
    <p class="foot">벌칙을 누구에게 통보할지 판단할 수 있도록, 이 화면에서만 비공개 팀 이름도 그대로 보여요.</p>
    <div class="sh" style="margin-top:38px"><h2>삭제된 경고</h2><span class="r muted xs">추방 · 팀 삭제로 카테고리가 모두 빠진 경고</span></div>
    <div class="tb"><table><thead><tr><th>회원</th><th>부여 주차</th><th>삭제 사유</th><th>복구 후 카테고리</th><th class="r">처리</th></tr></thead><tbody>
      <tr><td><div style="display:flex;align-items:center;gap:9px">${av('이')}<b>이영희</b></div></td><td>9/14 ~ 9/20</td><td>추방</td><td>웹 프로젝트 B팀</td><td class="r"><button class="btn btn-o btn-sm">복구</button></td></tr>
      <tr><td><div style="display:flex;align-items:center;gap:9px">${av('최')}<b>최유진</b></div></td><td>9/7 ~ 9/13</td><td>팀 삭제</td><td class="muted">삭제된 팀</td><td class="r"><button class="btn btn-o btn-sm">복구</button></td></tr>
    </tbody></table></div>
    <p class="foot">판정 정정이나 소급 면제로 회수된 경고는 여기에 나오지 않아요.</p>`}));

document.getElementById('v-web').innerHTML=W.join('');

/* ================= app ================= */
const stBar=`<div class="p-st"><span>9:41</span><span class="ic"><span class="sig"><i style="height:5px"></i><i style="height:7px"></i><i style="height:9px"></i></span><span class="bat"></span></span></div>`;
function phone(o){
  const tabs=[['home','홈'],['users','팀'],['file','게시판'],['user','프로필']];
  const nav=o.nav?`<div class="p-nav">${o.nav.back?ic('chevL',24):''}<span>${o.nav.title||''}</span><span class="grow"></span>${o.nav.right||''}</div>`:'';
  return `<div class="pw" data-id="${o.id}" data-t="${o.title}"><div class="phone">${stBar}${nav}<div class="p-body">${o.body}</div>
    ${o.tab==null?'':`<div class="p-tab">${tabs.map(([i,l],n)=>`<div class="${n===o.tab?'on':''}">${ic(i,22,n===o.tab?2.2:1.8)}${l}</div>`).join('')}</div>`}</div>
    <p class="cap"><b>${o.id} · ${o.title}</b>${o.cap?`<br>${o.cap}`:''}</p></div>`;
}
const A=[];
A.push(phone({id:'A-01',title:'홈',tab:0,body:`
  <h1 style="font-size:24px;font-weight:800;letter-spacing:-.035em;line-height:1.35;margin-top:6px">한동관님,<br>이번 주도 잔디 심어볼까요</h1>
  <div class="sh" style="margin-top:22px;margin-bottom:10px"><h2 style="font-size:16px">이번 주 진행</h2><span class="r muted xs">9/28 월 ~ 10/4 일</span></div>
  ${bigStrip(HOME_DAYS,40)}${legend}
  <div style="display:flex;gap:40px;margin-top:20px"><div><div class="kl">인증일</div><div class="big">2<small>/ 3일</small></div></div><div><div class="kl">기록글 <span style="color:var(--green)">${ic('check',14,2.4)}</span></div><div class="big">1<small>/ 1개</small></div></div></div>
  <p class="muted xs" style="margin-top:10px">오늘 오전 6시 기준</p>
  <p style="margin-top:18px;font-size:15px;line-height:1.6"><b>아직 통과 전이에요. 1일 더 인증하면 통과!</b><br><span class="muted">다음 차감까지 1주 남았어요.</span></p>
  <div class="hr" style="margin:22px 0"></div>
  <h2 style="font-size:16px">내 경고</h2>
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-top:10px"><div class="big" style="font-size:32px">1<small>/ 3</small></div><button class="btn btn-o btn-sm">자세히</button></div>${wbar(1)}
  <div class="box box-blue" style="margin-top:20px">${ic('users',15)}<b>받은 초대 2건</b><button class="btn btn-o btn-sm" style="margin-left:auto">보러 가기</button></div>`}));

A.push(phone({id:'A-02',title:'팀 현황판',tab:1,nav:{back:1,title:'사이드 프로젝트 A팀',right:ic('more',22)},body:`
  <span class="pill p-line">공개</span>
  <h2 style="font-size:17px;margin:14px 0 4px">이번 주 <span style="font-weight:500;color:var(--ink-2)">(9/28 월 ~ 10/4 일)</span></h2>
  <p class="muted xs" style="margin-bottom:12px">인증일은 오늘 오전 6시 기준이에요</p>
  ${TEAM.map(t=>`<div class="mcard ${t.me?'me-row':''}"><div style="display:flex;align-items:center;gap:9px">${av(t.c,'sm')}<b>${t.n}</b>${t.me?'<span class="muted xs">나</span>':''}<span style="margin-left:auto">${pill(t.st)}</span></div>
    <div style="display:flex;align-items:center;margin-top:10px">${mstrip(t.s)}<span class="xs" style="margin-left:auto;color:var(--ink-2)">인증일 <b>${t.d}일</b>&nbsp; 기록글 <b>${t.p}개</b>&nbsp; 경고 <b>${t.w}</b></span></div></div>`).join('')}
  <div class="sh" style="margin-top:22px"><h2 style="font-size:16px">이 팀의 기록글</h2><a class="lnk r">전체보기</a></div>
  <ul class="rows"><li><span class="cat">트러블슈팅</span><span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Redis TTL이 적용되지 않던 문제</span><span class="d">9/29</span></li></ul>`}));

A.push(phone({id:'A-03',title:'내 주간 활동',tab:0,nav:{back:1,title:'내 주간 활동'},body:`
  <div style="display:flex;align-items:center;gap:14px;font-size:16px;font-weight:700;margin:4px 0 22px">${ic('chevL',18)}<span style="flex:1;text-align:center">9월 28일 ~ 10월 4일</span><span style="color:var(--ink-4)">${ic('chevR',18)}</span></div>
  <div class="sh" style="margin-bottom:10px"><h2 style="font-size:16px">날짜별 인증</h2><span class="r muted xs">오늘 오전 6시 기준</span></div>
  ${bigStrip(HOME_DAYS,40)}
  <ul class="rows" style="margin-top:16px">
    ${[['9/28','월','잔디 3칸',1],['9/29','화','잔디 1칸 + 기록글 1개',1],['9/30','수','활동 없음',0],['10/1','목','오늘',0],['10/2','금','예정'],['10/3','토','예정'],['10/4','일','예정']].map(([d,w,m,v])=>`<li style="min-height:44px"><b style="width:56px">${d} <span style="font-weight:500;color:var(--ink-3)">${w}</span></b><span class="sm" style="color:var(--ink-2)">${m}</span><span class="d">${v===1?pill('pass','1일'):v===0?'0일':''}</span></li>`).join('')}
  </ul>
  <p class="foot">잔디와 기록글이 둘 다 있어도 인증일은 1일로만 세요. 하루에 여러 번 활동해도 인증일은 하루예요.</p>
  <div class="card" style="padding:18px;margin-top:18px"><h2 style="font-size:16px">이번 주 판정</h2></div>`}));

A.push(phone({id:'A-04',title:'게시판',tab:2,cap:'앱은 상단 헤더가 없어 헤더 검색창을 넣지 않는다. 이 탭 안 검색이 유일한 검색이다.',body:`
  <h1 style="font-size:24px;font-weight:800;letter-spacing:-.035em;margin:6px 0 16px">게시판</h1>
  <div class="seg" style="display:flex"><span class="on" style="flex:1">트러블슈팅</span><span style="flex:1">개발일지</span></div>
  <div class="inp ph" style="margin-top:12px">${ic('search',17)}제목, 내용, 태그로 검색</div>
  <div style="display:flex;gap:8px;margin-top:12px;overflow:hidden">${TAGS.slice(0,5).map(t=>`<span class="tag" style="flex:none">#${t}</span>`).join('')}</div>
  <div class="plist">${POSTS.map(p=>`<div class="pi"><h3 style="font-size:15.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${p.t}</h3>
    <div class="meta">${p.tags.map(g=>`<span class="tag">#${g}</span>`).join('')}${p.team?`<span class="team-tag">${ic('users',13)}${p.team}</span>`:''}</div>
    <div class="by"><b>${p.by}</b>${p.d}&nbsp;&nbsp;댓글 ${p.c}</div></div>`).join('')}</div>
  <span class="fab" aria-label="글쓰기">${ic('pencil',22)}</span>`}));

A.push(phone({id:'A-05',title:'글쓰기',nav:{back:1,title:'글쓰기',right:'<b style="color:var(--green);font-size:16px">등록</b>'},body:`
  <div class="seg" style="display:flex"><span class="on" style="flex:1">트러블슈팅</span><span style="flex:1">개발일지</span></div>
  <div class="field" style="margin-top:16px;margin-bottom:12px"><label>제목<span class="req">*</span></label><div class="inp strong">Redis TTL이 적용되지 않던 문제</div></div>
  <div class="acc"><div class="ah">문제<span style="color:var(--red);margin-left:3px">*</span><span class="st">작성함</span></div><div class="inp ta" style="margin-top:10px;height:104px;font-size:14px">TTL을 걸었는데 키가 사라지지 않았어요. 캐시가 계속 남아 새 잔디 데이터가 안 보였어요.</div></div>
  <div class="acc"><div class="ah">원인<span style="color:var(--red);margin-left:3px">*</span><span class="st">작성함</span></div></div>
  <div class="acc"><div class="ah">해결<span style="color:var(--red);margin-left:3px">*</span><span class="st">작성함</span></div></div>
  <div class="box box-ok" style="margin-top:4px">${ic('check',16,2.4)}<span><b>필수 항목을 다 채웠어요.</b> 이 글은 인증에 들어가요</span></div>
  <div class="hr" style="margin:20px 0"></div>
  <div class="field"><label>태그<span class="opt">최대 5개</span></label><div class="inp" style="font-size:13.5px"><span class="tag">#Redis ${ic('x',11)}</span><span class="tag">#Spring ${ic('x',11)}</span><span class="muted" style="white-space:nowrap">태그 입력 후 Enter</span></div></div>
  <div class="field"><label>관련 커밋<span class="opt">선택</span></label></div>`}));

A.push(phone({id:'A-06',title:'글 상세',nav:{back:1,right:ic('more',22)},body:`
  <span class="cat">트러블슈팅</span>
  <h1 style="font-size:25px;font-weight:800;letter-spacing:-.035em;line-height:1.35;margin-top:10px">Redis TTL이 적용되지 않던 문제</h1>
  <div style="display:flex;align-items:center;gap:9px;margin-top:14px">${av('한','sm')}<b>한동관</b><span class="muted xs">9/29 14:20</span></div>
  <div style="display:flex;gap:8px;margin-top:12px;align-items:center"><span class="tag">#Redis</span><span class="tag">#Spring</span><span class="team-tag">${ic('users',13)}사이드 프로젝트 A팀</span></div>
  <div style="border-top:1px solid var(--line);margin-top:18px">
    ${[['문제','TTL을 걸었는데 키가 사라지지 않았어요. 캐시가 계속 남아서 새 잔디 데이터가 화면에 반영되지 않았어요.'],['원인','set 다음에 expire를 따로 호출했는데, 두 명령 사이에 다른 요청이 set을 한 번 더 실행하면서 TTL이 풀려 버렸어요.'],['해결','set 명령에 ex 옵션을 같이 넘겨서 저장과 만료 설정을 한 번에 하도록 바꿨어요.']].map(([h,b],i)=>`<div style="padding:18px 0;${i<2?'border-bottom:1px solid var(--line-2)':''}"><div style="font-size:14px;font-weight:800;color:var(--green);margin-bottom:8px">${h}</div><p style="font-family:var(--serif);font-size:15.5px;line-height:1.9">${b}</p></div>`).join('')}
  </div>
  <div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);padding:12px 16px;display:flex;gap:8px"><div class="inp ph" style="height:48px">댓글을 입력하세요</div><button class="btn btn-p" style="height:48px;width:68px" disabled>등록</button></div>`}));

A.push(phone({id:'A-07',title:'프로필',tab:3,body:`
  <h1 style="font-size:24px;font-weight:800;letter-spacing:-.035em;margin:6px 0 20px">프로필</h1>
  <div style="display:flex;gap:18px;align-items:flex-start">
    <span style="width:88px;height:88px;border-radius:50%;background:#D8DFDB;display:grid;place-items:center;color:#6F7A74;flex:none">${ic('user',40,1.6)}</span>
    <div><b style="font-size:21px">한동관</b><div class="muted sm" style="display:flex;gap:5px;align-items:center;margin-top:2px">@handong-gwan ${ic('ext',12)}</div><button class="btn btn-o btn-sm" style="margin-top:12px">프로필 수정</button></div>
  </div>
  <div style="display:flex;gap:26px;margin-top:20px;font-size:13.5px"><span class="muted">게시글 <b style="font-size:18px;color:var(--ink);margin-left:6px">12</b></span><span class="muted">댓글 <b style="font-size:18px;color:var(--ink);margin-left:6px">34</b></span></div>
  <div class="sh" style="margin-top:32px;margin-bottom:12px"><h2 style="font-size:16px">GitHub 잔디</h2><span class="r muted xs">오늘 오전 6시 기준</span></div>
  <div class="card" style="padding:16px;overflow:hidden">${heat(21,5,11,3)}</div>
  <h2 style="font-size:16px;margin-top:32px">경고</h2><div class="big" style="font-size:32px;margin:10px 0 12px">1<small>/ 3</small></div>
  <ul class="rows"><li style="min-height:44px"><span>사이드 프로젝트 A팀</span><b class="d" style="color:var(--ink)">1회</b></li><li style="min-height:44px"><span>비공개 팀</span><b class="d" style="color:var(--ink)">1회</b></li></ul>
  <p class="foot">경고 1개에 여러 팀이 함께 붙을 수 있어서, 팀별 합계는 누적 경고 수와 다를 수 있어요.</p>`}));

A.push(phone({id:'A-08',title:'관리자 기능 안내',cap:'앱에는 관리자 기능이 없다. 딥링크로 관리자 경로에 들어오면 이 화면을 보여준다.',body:`
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding-bottom:80px">
    <span style="width:64px;height:64px;border-radius:16px;background:#E6EBE8;display:grid;place-items:center;color:var(--ink-2)">${ic('shield',28,1.8)}</span>
    <h1 style="font-size:21px;font-weight:800;letter-spacing:-.03em;line-height:1.4;margin-top:20px">관리자 기능은 웹에서만<br>제공해요</h1>
    <p class="muted" style="font-size:14px;line-height:1.6;margin-top:10px">PC나 휴대폰 브라우저에서 잔디로그 웹으로<br>들어와 주세요.</p>
    <button class="btn btn-p" style="margin-top:22px;height:48px">홈으로</button>
  </div>`}));

document.getElementById('v-app').innerHTML=`<div class="phones">${A.join('')}</div>`;

/* ================= tabs + print mode ================= */
const tabsEl=document.getElementById('tabs');
tabsEl.addEventListener('click',e=>{
  const b=e.target.closest('button[data-v]');if(!b)return;
  [...tabsEl.children].forEach(x=>x.setAttribute('aria-selected',String(x===b)));
  document.getElementById('v-web').hidden=b.dataset.v!=='web';
  document.getElementById('v-app').hidden=b.dataset.v!=='app';
});
/* "/" 단축키 시연 — 입력칸에 있지 않을 때만 검색창 상태 화면으로 스크롤 */
document.addEventListener('keydown',e=>{
  if(e.key!=='/'||/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
  e.preventDefault();
  const t=[...document.querySelectorAll('.shot')].find(s=>s.querySelector('.gs.open'));
  if(t){document.getElementById('v-web').hidden=false;document.getElementById('v-app').hidden=true;t.scrollIntoView({behavior:'smooth',block:'start'})}
});
(function(){
  const p=new URLSearchParams(location.search).get('p');
  if(p!=='web'&&p!=='app')return;
  document.body.classList.add(p==='web'?'pm-web':'pm-app');
  const st=document.createElement('style');
  st.textContent=p==='web'?'@page{size:A3 portrait;margin:10mm}':'@page{size:A4 landscape;margin:10mm}';
  document.head.appendChild(st);
  document.getElementById('v-web').hidden=p!=='web';
  document.getElementById('v-app').hidden=p!=='app';
  if(p==='app')document.getElementById('intro').hidden=true;
})();
(function(){
  const x=new URLSearchParams(location.search).get('x');
  if(!x)return;
  document.body.classList.add('xm');
  document.getElementById('v-web').hidden=false;
  document.getElementById('v-app').hidden=false;
  const items=[...document.querySelectorAll('.shot[data-id],.pw[data-id]')];
  if(x==='heights'){
    document.fonts.ready.then(()=>{
      const out=items.map(el=>({id:el.dataset.id,t:el.dataset.t,w:Math.ceil(el.getBoundingClientRect().width),h:Math.ceil(el.getBoundingClientRect().height)}));
      const pre=document.createElement('pre');pre.id='hs';pre.textContent=JSON.stringify(out);document.body.appendChild(pre);
    });
    return;
  }
  items.forEach(el=>{el.hidden=el.dataset.id!==x});
})();
