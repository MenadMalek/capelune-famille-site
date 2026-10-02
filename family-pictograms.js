/* Adaptation familiale du sélecteur 0.9.7. Mulberry © Steve Lee, CC BY-SA 4.0. */
(()=>{'use strict';
const catalog=window.CAPELUNE_MULBERRY_FR;
const ROOT=catalog?'https://raw.githubusercontent.com/mulberrysymbols/mulberry-symbols/'+catalog.revision+'/':'';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const words={
 'ecole':['school','class','classroom'],'classe':['class','classroom'],'enseignant':['teacher'],'maitresse':['teacher'],'cartable':['school bag','bag'],
 'repas':['meal','eat','food'],'manger':['eat','food'],'petit dejeuner':['breakfast'],'dejeuner':['lunch'],'diner':['dinner','meal'],'gouter':['snack','food'],'collation':['snack'],'cuisine':['kitchen','cook'],'cuisiner':['cook'],
 'hygiene':['brush teeth','toothbrush','toothpaste','wash hands','wash face','soap','shower','bathe','dry hands','towel','shampoo'],'rincer':['rinse'],'cheveux':['hair','shampoo'],'visage':['wash face','dry face'],'ongles':['nail'],'douche':['shower'],'bain':['bath'],'toilettes':['toilet'],'wc':['toilet'],'pipi':['toilet','urinate'],'laver les mains':['wash hands','washing hands','handwashing'],'se laver les mains':['wash hands','washing hands','handwashing'],'mains':['hands','hand'],'savon':['soap'],'secher':['dry'],'serviette':['towel'],'brosser les dents':['brush teeth','toothbrush','teeth'],'brossage des dents':['brush teeth','toothbrush','teeth'],'dents':['toothbrush','teeth'],'dentifrice':['toothpaste'],
 'habiller':['dress','clothes'],'vetements':['clothes'],'pantalon':['trousers','pants'],'chaussures':['shoes'],'chaussettes':['socks'],'veste':['coat','jacket'],'manteau':['coat'],'pyjama':['pyjamas'],
 'coucher':['bed','sleep'],'dormir':['sleep','bed'],'sieste':['sleep','bed'],'reveiller':['wake up'],'maison':['home','house'],'retour maison':['home','house'],'chambre':['bedroom'],'salon':['living room'],'lit':['bed'],
 'voiture':['car'],'bus':['bus'],'transport':['transport','bus','car'],'train':['train'],'velo':['bicycle','bike'],'marche':['walk','walking'],'sortir':['go out','outside'],'rentrer':['home'],'dehors':['outside'],
 'rendez vous':['appointment','calendar'],'medecin':['doctor'],'hopital':['hospital'],'dentiste':['dentist'],'psychologue':['psychologist'],'medicament':['medicine','tablet'],
 'activite':['activity','play'],'jeu':['play','game'],'jouer':['play','game'],'temps libre':['leisure','relax'],'temps calme':['quiet','relax','rest'],'pause':['break','rest'],'sport':['sport'],'piscine':['swimming','pool'],'nager':['swim','swimming'],'promenade':['walk','walking'],'parc':['park'],
 'musique':['music'],'television':['television','tv'],'tablette':['tablet','computer'],'ordinateur':['computer'],'telephone':['mobile','telephone'],'lire':['read','book'],'lecture':['read','book'],'livre':['book'],'devoirs':['homework','study'],'travail':['work'],'courses':['shopping','shop'],'dessiner':['draw'],'peindre':['paint'],
 'boire':['drink'],'eau':['water'],'jus':['juice'],'lait':['milk'],'pain':['bread'],'fruit':['fruit'],'pomme':['apple'],
 'educateur':['support worker','carer','person'],'famille':['family'],'maman':['mother','mum'],'papa':['father','dad'],'ami':['friend'],'frere':['brother'],'soeur':['sister'],
 'content':['happy'],'triste':['sad'],'colere':['angry'],'peur':['afraid','scared'],'calme':['calm'],'fatigue':['tired'],'aide':['help'],'attendre':['wait'],'terminer':['finish','finished'],'fini':['finished','finish']
};

const stopWords=new Set(['a','au','aux','de','du','des','le','la','les','un','une','en','se','s','d','l','the','to']);
const tokens=s=>norm(s).split(' ').filter(w=>w&&!stopWords.has(w));
const singular=w=>w.length>3?w.replace(/[sx]$/,''):w;
const includesWords=(text,term)=>{
 const hay=tokens(text).map(singular),need=tokens(term).map(singular);
 return need.length>0&&need.every(w=>hay.some(h=>h===w));
};
const records=catalog?Object.entries(catalog.labels).map(([key,label])=>({
 key,label,french:norm(label.replace(/\s*\(variante[^)]*\)/g,'')),
 english:norm(key.replace(/_,_to(?:_\d+)?$/,'').replace(/_\d+[a-z]?$/,''))
})):[];
async function search(query,limit=24){
 if(!catalog)throw Error('Catalogue français Mulberry absent');
 const q=norm(query);if(!q)return [];
 const terms=new Set([q]);
 const directMatch=records.some(r=>includesWords(r.french,q)||includesWords(r.english,q));
 const exactAliases=words[q];
 if(exactAliases)exactAliases.forEach(x=>terms.add(x));
 else if(!directMatch||tokens(q).length===1)for(const [fr,en]of Object.entries(words))if(includesWords(q,fr))en.forEach(x=>terms.add(x));
 return records.map(r=>{
  let score=0;
  if(r.french===q)score=120;
  else if(includesWords(r.french,q))score=100;
  if(r.english===q)score=Math.max(score,90);
  else if(includesWords(r.english,q))score=Math.max(score,75);
  for(const term of terms)if(term!==q){
   if(r.english===term)score=Math.max(score,85);
   else if(includesWords(r.english,term))score=Math.max(score,60);
  }
  return {...r,score};
 }).filter(r=>r.score).sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label,'fr')||a.key.localeCompare(b.key))
 .slice(0,Math.max(0,Math.min(3436,Number(limit)||24))).map(r=>{
  const path='EN/'+r.key+'.svg';return {id:path,label:r.label,url:ROOT+path.split('/').map(encodeURIComponent).join('/')};
 });
}
async function mulberryData(result){
 const response=await fetch(result.url);if(!response.ok)throw Error('Image Mulberry indisponible');
 const blob=await response.blob(),url=URL.createObjectURL(blob);
 try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,256,256);const scale=Math.min(240/img.naturalWidth,240/img.naturalHeight);ctx.drawImage(img,(256-img.naturalWidth*scale)/2,(256-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);const data=canvas.toDataURL('image/jpeg',.82);if(data.length>400000)throw Error('Image trop volumineuse');return data}finally{URL.revokeObjectURL(url)}
}
async function resolveVisual(result){
 if(result.type==='mulberry')return {kind:'mulberry',id:result.id,label:result.label,data:await mulberryData(result)};
 if(result.type==='educactif-local'){if(result.url.length>400000)throw Error('Image trop volumineuse');return {kind:'local',id:result.id,variant:result.variant,libraryVersion:result.libraryVersion,label:result.label,data:result.url}}
 throw Error('Pictogramme inconnu');
}
window.CapelunePictograms={searchMulberry:search,labelFor:id=>catalog?.labels[String(id||'').replace(/^EN\//,'').replace(/\.svg$/i,'')]||null,open(onSelect,onError,onSelectMany){
 window.CAPELUNE_PICTOGRAM_PICKER.open({searchOnline:search,
  onSelect:async result=>{try{onSelect(await resolveVisual(result))}catch{onError('Impossible de charger ce pictogramme. Réessayez ou choisissez une image locale.')}},
  onSelectMany:async results=>{
   try{
    const visuals=await Promise.all(results.map(resolveVisual));
    if(onSelectMany)await onSelectMany(visuals);else visuals.forEach(onSelect);
   }catch(error){onError('Impossible de charger les pictogrammes sélectionnés. Réessayez ou choisissez des images locales.');throw error}
  }
 });
}};
})();
