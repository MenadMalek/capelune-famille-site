/* Shared picker. The offline family collection is shown first. */
(()=>{
 'use strict';
 const base=new URL('.',document.currentScript.src),data=window.CAPELUNE_PICTOGRAMS;
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/_/g,' ');
 const dialog=document.createElement('dialog');dialog.className='eap-picto-dialog';dialog.id='eapPictoDialog';dialog.setAttribute('aria-labelledby','eapPictoTitle');
 dialog.innerHTML=`<h2 id="eapPictoTitle">Choisir un pictogramme</h2><p>Disponible sans Internet. Choisis une image pour l’étape en cours.</p><div class="eap-picto-filters"><label>Recherche<input id="eapPictoSearch" type="search" placeholder="Repas, école, famille…"></label><label>Catégorie<select id="eapPictoCategory"><option value="">Toutes les catégories</option></select></label><label>Personnage<select id="eapPictoGender"><option value="all">Tous les personnages</option><option value="boy">Garçon</option><option value="girl">Fille</option></select></label><label>Rendu<select id="eapPictoRender"><option value="color">Couleur</option><option value="bw">Noir et blanc</option></select></label></div><div class="eap-picto-status" id="eapPictoStatus" role="status" aria-live="polite"></div><div class="eap-picto-grid" id="eapPictoGrid"></div><div class="eap-picto-actions"><button class="eap-picto-online" id="eapPictoOnline" type="button">Mulberry</button><button id="eapPictoPrev" type="button">Précédent</button><span id="eapPictoPage"></span><button id="eapPictoNext" type="button">Suivant</button><button id="eapPictoMulti" type="button" aria-pressed="false">Sélection multiple</button><button id="eapPictoAddSelected" type="button" hidden disabled>Ajouter les images sélectionnées</button><button id="eapPictoClose" type="button">Annuler</button></div>`;
 document.body.append(dialog);
 const el=id=>dialog.querySelector('#eapPicto'+id);let page=0,options=null,token=0,busy=false,source='local',queryToken=0,searchTimer,multiMode=false;
 const selected=new Map(),MAX_SELECTED=12;
 el('Title').textContent='Choisir un pictogramme';
 dialog.querySelector('p').textContent='Choisis une image, ou active la sélection multiple pour ajouter plusieurs images à la suite. 60 images locales sont disponibles sans Internet ; Mulberry nécessite une connexion.';
 const sources=document.createElement('div');sources.className='eap-picto-actions';sources.setAttribute('aria-label','Banques de pictogrammes');
 const local=document.createElement('button');local.type='button';local.id='eapPictoLocal';local.textContent='Banque locale';
 const both=document.createElement('button');both.type='button';both.id='eapPictoBoth';both.textContent='Les deux banques';
 sources.append(local,el('Online'),both);dialog.querySelector('p').after(sources);
 const onlineSection=document.createElement('section');onlineSection.id='eapPictoMulberry';onlineSection.hidden=true;
 const heading=document.createElement('h3');heading.textContent='Mulberry';
 const onlineStatus=document.createElement('p');onlineStatus.setAttribute('role','status');
 const onlineGrid=document.createElement('div');onlineGrid.className='eap-picto-grid';onlineGrid.id='eapPictoOnlineGrid';
 onlineSection.append(heading,onlineStatus,onlineGrid);el('Grid').after(onlineSection);
 const localHeading=document.createElement('h3');localHeading.textContent='Banque locale';el('Status').before(localHeading);
 function updateMultiUI(){
  el('Multi').textContent=multiMode?'Sélection multiple activée':'Sélection multiple';
  el('Multi').setAttribute('aria-pressed',String(multiMode));
  el('AddSelected').hidden=!multiMode;
  el('AddSelected').disabled=busy||selected.size===0;
  el('AddSelected').textContent=selected.size?'Ajouter '+selected.size+' image'+(selected.size>1?'s':''):'Choisis des images';
  dialog.querySelectorAll('.eap-picto-tile[data-selection-key]').forEach(button=>button.setAttribute('aria-pressed',String(selected.has(button.dataset.selectionKey))));
 }
 function selectionKey(item){return item.type==='mulberry'?'mulberry:'+item.id:'local:'+item.id+':'+item.variant}
 function toggleSelection(item){
  const key=selectionKey(item);
  if(selected.has(key))selected.delete(key);
  else if(selected.size>=MAX_SELECTED){(source==='mulberry'?onlineStatus:el('Status')).textContent='Tu peux sélectionner jusqu’à '+MAX_SELECTED+' images à la fois.';return}
  else selected.set(key,item);
  updateMultiUI();
 }
 function setMultiMode(value){multiMode=value;if(!value)selected.clear();updateMultiUI();render();}
 function setSource(value){
  source=value;queryToken++;clearTimeout(searchTimer);onlineGrid.replaceChildren();
  for(const [button,key] of [[local,'local'],[el('Online'),'mulberry'],[both,'both']])button.setAttribute('aria-pressed',String(value===key));
  const hideLocal=value==='mulberry';
  for(const item of [localHeading,el('Status'),el('Grid'),el('Prev'),el('Page'),el('Next')])item.hidden=hideLocal;
  for(const key of ['Category','Gender','Render'])el(key).closest('label').hidden=hideLocal;
  onlineSection.hidden=value==='local';
  // Mulberry does not display the local grid: do not build 24 hidden image tiles before the search field can receive input.
  if(value!=='mulberry')render();
  searchOnline();
 }
 async function searchOnline(){
  const request=++queryToken;clearTimeout(searchTimer);onlineGrid.replaceChildren();
  if(source==='local')return;
  const q=el('Search').value.trim();onlineStatus.textContent=q?'Recherche Mulberry…':'Saisis un mot en français ou en anglais (ex. école, goûter, mains).';
  if(!q)return;
  try{
   const results=await options.searchOnline(q,24);
   if(request!==queryToken||!dialog.open)return;
   onlineStatus.textContent=results.length?results.length+' résultat(s) Mulberry':'Aucun résultat Mulberry.';
   for(const result of results.slice(0,24)){
    const b=document.createElement('button');b.type='button';b.className='eap-picto-tile';b.dataset.source='mulberry';
    const item={type:'mulberry',id:result.id,label:result.label,url:result.url};b.dataset.selectionKey=selectionKey(item);
    const img=document.createElement('img');img.src=result.url;img.alt='';img.loading='lazy';
    const label=document.createElement('span');label.textContent=result.label;b.append(img,label);b.setAttribute('aria-pressed','false');
    b.onclick=()=>{if(multiMode){toggleSelection(item);return}options.onSelect(item);dialog.close();};onlineGrid.append(b);updateMultiUI();
   }
  }catch(error){if(request===queryToken)onlineStatus.textContent='Mulberry indisponible. La banque locale reste accessible sans Internet.';}
 }
 local.onclick=()=>setSource('local');both.onclick=()=>setSource('both');
 for(const c of data.categories){const group=document.createElement('optgroup');group.label=c.label_fr;for(const s of c.subcategories){const o=document.createElement('option');o.value=c.id+'/'+s.id;o.textContent=s.label_fr;group.append(o);}el('Category').append(group);}
 const records=data.pictograms.map(r=>({r,search:normalize([r.label_fr,r.slug,...r.keywords].join(' '))}));
 function variantFor(r){
  const gender=el('Gender').value,render=el('Render').value;
  const keys=gender==='all'?['neutral_'+render,'boy_'+render,'girl_'+render]:[gender+'_'+render,'neutral_'+render];
  return keys.find(key=>r.variants[key]);
 }
 function render(){
  const words=normalize(el('Search').value).trim().split(/\s+/).filter(Boolean),category=el('Category').value;
  const list=records.filter(({r,search})=>variantFor(r)&&(!category||r.category+'/'+r.subcategory===category)&&words.every(w=>search.includes(w)));
  const pages=Math.max(1,Math.ceil(list.length/24));page=Math.min(page,pages-1);el('Grid').replaceChildren();
  el('Status').textContent=list.length?list.length+' pictogramme(s)':'Aucun résultat. Essaie un autre mot ou une autre catégorie.';
  el('Page').textContent=(page+1)+' / '+pages;el('Prev').disabled=page===0;el('Next').disabled=page===pages-1;
  for(const {r} of list.slice(page*24,page*24+24)){
   const variant=variantFor(r);
   const item={type:'educactif-local',id:r.id,variant,libraryVersion:data.version,label:r.label_fr,url:new URL(r.variants[variant].path,base).href};
   const b=document.createElement('button');b.type='button';b.className='eap-picto-tile';b.dataset.id=r.id;b.dataset.selectionKey=selectionKey(item);b.setAttribute('aria-label',r.label_fr);
   const img=document.createElement('img');img.src=item.url;img.alt='';img.loading='lazy';
   const label=document.createElement('span');label.textContent=r.label_fr;b.append(img,label);b.setAttribute('aria-pressed','false');b.onclick=()=>multiMode?toggleSelection(item):choose(r,variant);el('Grid').append(b);
  }
 }
 async function readLocal(item){
  const response=await fetch(item.url);if(!response.ok)throw Error('image');const blob=await response.blob();
  const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
  return {...item,url};
 }
 async function choose(r,variant){
  if(busy)return;busy=true;const request=token,callback=options?.onSelect;updateMultiUI();
  el('Status').textContent='Chargement de l’image…';
  try{
   const visual=await readLocal({type:'educactif-local',id:r.id,variant,libraryVersion:data.version,label:r.label_fr,url:new URL(r.variants[variant].path,base).href});
   if(request!==token||!dialog.open)return;
   // Embed original PNG bytes: existing saves, duplicates and portable backups remain self-contained.
   callback(visual);dialog.close();
  }catch(_){if(request===token)el('Status').textContent='Image locale indisponible. Réessaie ou choisis une autre image.';}
  finally{if(request===token)busy=false;updateMultiUI();}
 }
 el('Multi').onclick=()=>setMultiMode(!multiMode);
 el('AddSelected').onclick=async()=>{
  if(busy||!selected.size||typeof options?.onSelectMany!=='function')return;
  busy=true;updateMultiUI();const request=token;
  try{const items=[];for(const item of selected.values())items.push(item.type==='educactif-local'?await readLocal(item):item);if(request!==token||!dialog.open)return;await options.onSelectMany(items);if(request===token&&dialog.open)dialog.close();}
  catch(_){(source==='mulberry'?onlineStatus:el('Status')).textContent='Impossible de charger toutes les images. Réessaie ou sélectionne moins d’images.';}
  finally{if(request===token)busy=false;updateMultiUI();}
 };
 el('Search').addEventListener('input',()=>{page=0;if(source!=='mulberry')render();});
 for(const key of ['Category','Gender','Render'])el(key).addEventListener('change',()=>{page=0;render();});
 el('Prev').onclick=()=>{page--;render();};el('Next').onclick=()=>{page++;render();};el('Close').onclick=()=>dialog.close();
 el('Online').onclick=()=>setSource('mulberry');
 el('Search').addEventListener('input',()=>{queryToken++;onlineGrid.replaceChildren();clearTimeout(searchTimer);if(source!=='local')searchTimer=setTimeout(searchOnline,350);});
 el('Search').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();searchOnline();}});
 dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();}});
 dialog.addEventListener('close',()=>{token++;queryToken++;clearTimeout(searchTimer);busy=false;options=null;selected.clear();multiMode=false;updateMultiUI();onlineGrid.replaceChildren();});
 window.CAPELUNE_PICTOGRAM_PICKER={open(config){token++;busy=false;options=config;page=0;multiMode=false;selected.clear();el('Search').value='';el('Category').value='';el('Gender').value='all';el('Render').value='color';updateMultiUI();if(!dialog.open)dialog.showModal();setSource('local');el('Search').focus();}};
})();

