/* Shared navigation, notifications and accessible layout refinements. */
let uiNoticeTimer,uiLastPage='';
function uiCurrentSection(){return ['dialogue','game','barber','drinks','fortune','monk','toys','opening','delivery','ending'].includes(state.page)?'scroll':state.page}
header=function(light=false){
 const bar=div('topbar ui-topbar'+(light?' light':''));
 bar.append(btn('汴京一日',()=>go('home'),'brand'));
 const nav=document.createElement('nav');nav.className='ui-nav';nav.id='site-navigation';nav.setAttribute('aria-label','主导航');
 const current=uiCurrentSection();
 for(const [label,page]of [['游卷','scroll'],['无名录','book'],['汴京拾遗','history']]){
  const b=btn(label,()=>go(page),current===page?'active':'');if(current===page)b.setAttribute('aria-current','page');if(page==='book')b.setAttribute('aria-label','无名录 · 人物与行旅记录');nav.append(b);
 }
 const toggle=btn('菜单',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.dataset.open=String(open);if(open)nav.querySelector('[aria-current]')?.focus()},'ui-menu-toggle');
 toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',nav.id);
 bar.append(div('spacer'),toggle,nav);return bar;
};
function uiAnnounce(text){let live=document.getElementById('ui-announcer');if(!live){live=document.createElement('div');live.id='ui-announcer';live.className='ui-sr-only';live.setAttribute('role','status');live.setAttribute('aria-live','polite');document.body.append(live)}live.textContent=text}
toast=function(text){
 uiAnnounce(text);document.querySelectorAll('.toast,.ui-inline-notice').forEach(n=>n.remove());clearTimeout(uiNoticeTimer);
 // Meeting a person is already represented by the notebook; do not obscure their dialogue.
 if(text.startsWith('认识了一位画中人'))return;
 const root=app.firstElementChild;
 const target=root?.querySelector('.right,.fortune-panel,.monk-talk,.story-card,.barber-aside,.book-shell,.five-shell,.hero-content');
 if(!target)return;
 const note=div('ui-inline-notice');note.textContent=text;target.prepend(note);uiNoticeTimer=setTimeout(()=>note.remove(),6500);
};
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const nav=document.querySelector('.ui-nav[data-open="true"]');if(!nav)return;e.preventDefault();e.stopImmediatePropagation();nav.dataset.open='false';const toggle=nav.closest('.topbar').querySelector('.ui-menu-toggle');toggle.setAttribute('aria-expanded','false');toggle.focus()},true);
document.addEventListener('pointerdown',e=>{const nav=document.querySelector('.ui-nav[data-open="true"]');if(nav&&!nav.closest('.topbar').contains(e.target)){nav.dataset.open='false';nav.closest('.topbar').querySelector('.ui-menu-toggle').setAttribute('aria-expanded','false')}},true);
function uiRefinePage(){
 const root=app.firstElementChild;if(!root||root.dataset.uiReady)return;root.dataset.uiReady='true';
 root.classList.toggle('ui-light',['collection','barber','toys','bio'].includes(state.page));
 const guide=root.querySelector('.story-guide');if(guide){
  const content=div('ui-task-content');while(guide.firstChild)content.append(guide.firstChild);
  const toggle=btn(state.dayStory?.taskCollapsed?'展开行程提示':'收起行程提示',()=>{const collapsed=!content.hidden;content.hidden=collapsed;toggle.textContent=collapsed?'展开行程提示':'收起行程提示';toggle.setAttribute('aria-expanded',String(!collapsed));dayStory().taskCollapsed=collapsed;save()},'ui-task-toggle');
  toggle.setAttribute('aria-expanded',String(!state.dayStory?.taskCollapsed));content.hidden=!!state.dayStory?.taskCollapsed;guide.append(toggle,content);
  const art=root.querySelector('.scroll-actions button');art?.addEventListener('click',()=>{guide.hidden=root.classList.contains('is-art-only')});
 }
 for(const [i,b]of [...root.querySelectorAll('.group-person')].entries()){
  const label=b.getAttribute('aria-label')?.replace(/^查看/,'');if(label){const caption=document.createElement('span');caption.className='ui-person-caption';caption.textContent=label;b.append(caption)}
 }
 const book=root.querySelector('.book-head p');if(book&&state.page==='book')book.textContent='《无名录》是你的行旅记录册，收录相遇的人与他们之间的羁绊。';
 const key=state.page+':'+(state.npc||'');if(uiLastPage!==key){uiLastPage=key;window.scrollTo(0,0);}
}
const uiAppNode=document.getElementById('app');
if(uiAppNode)new MutationObserver(()=>uiRefinePage()).observe(uiAppNode,{childList:true,subtree:true});
