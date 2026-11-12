(()=>{
const guides={
baker:['五更炉火','帮饼摊完成制作。','依次点击画面提示的操作点：擀开面团、撒上芝麻、送入炉中；触屏轻点即可。','完成三步后回到人物对话。'],
boat:['虹桥通船','协助船夫平安过桥。','依次点击扶住船篙、调整船位、协力过桥的操作点；触屏轻点即可。','完成三步后回到船夫对话。'],
barber:['毫末之间','按步骤替客人整理须发。','按住并拖动工具，依次净发、向下梳发、夹住白发向外拔出；修须时点击须尾，修面时轻划杂毛。手机使用手指按住、拖动或轻点。','完成当前步骤后按页面提示继续，完成五道工序。'],
drinks:['一盏汴京凉','按客人的订单调制饮子。','先按配方顺序备料，再开张。选碗、加入原料和水，按订单添甜或镇凉，搅匀后点击客人交付；也可拖动已调好的碗交付。','按营业页面的目标经营至收摊，查看本次结果。'],
fortune:['一卦问浮生','写下挂心的事，体验三钱起卦。','输入问题或选择示例，开始起卦后依次点击掷钱，共六次；再请先生解卦，可继续追问。','点击“记下此番问答”将问卦记录收入行旅。'],
monk:['行脚辨路','根据线索替行脚僧辨认路线。','先查验草图线索，再从东侧起点依次选择渡水、入市、辨树和折向；可撤回一步或请师父提示。','提交正确路线，并继续对话，将这一程收入无名录。'],
toys:['街头小玩意','体验拨浪鼓、泥人和小风车。','点击一件玩具，拖动旋转、滚轮缩放，再点击下方试玩按钮；触屏轻点选择并拖动查看。','试玩动作会记入游玩记录，可切换其他玩具继续体验。']};
const dialog=document.createElement('dialog');dialog.className='play-help-dialog';dialog.setAttribute('aria-labelledby','play-help-title');document.body.append(dialog);let opener;
function close(){dialog.close();if(opener?.isConnected)opener.focus()}
function open(key,b){opener=b;const g=guides[key];dialog.replaceChildren();const title=document.createElement('h2');title.id='play-help-title';title.textContent=g[0]+' · 玩法说明';dialog.append(title);['游戏目标','操作方法','完成条件'].forEach((label,i)=>{const h=document.createElement('h3'),p=document.createElement('p');h.textContent=label;p.textContent=g[i+1];dialog.append(h,p)});const exit=document.createElement('button');exit.textContent='知道了 · 返回游戏';exit.onclick=close;dialog.append(exit);dialog.showModal();exit.focus()}
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog.open){e.preventDefault();e.stopImmediatePropagation();close()}},true);
function mount(){const root=app.firstElementChild;if(!root)return;const p=state.page,key=p==='game'?state.npc:p==='dialogue'&&['fortune','monk','merchant','drinks'].includes(state.npc)?(state.npc==='merchant'?'toys':state.npc):p;if(!guides[key]||root.querySelector('.play-help-entry'))return;
const host=root.querySelector('.barber-title,.drink-tools,.fortune-intro,.monk-mast,.toys-bar,.instruction')||root.querySelector('h1,h2')?.parentElement||root.querySelector('.fortune-shell,.monk-shell,.barber-shell');if(!host)return;
const b=document.createElement('button');b.className='play-help-entry';b.textContent='玩法说明';b.onclick=()=>open(key,b);host.append(b);}
mount();new MutationObserver(mount).observe(app,{childList:true,subtree:true});
})();
