/* Fiches imprimables dédiées : texte et formes vectoriels, photos intégrées. */
(function(global){
'use strict';

const PAPER_INK='#34423d', ACCENTS=['#fff2d9','#e4f5e9','#ffe8e3','#e8f2fc','#f2ecfa'];
function rounded(ctx,x,y,w,h,stroke=false,r=18){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();stroke?ctx.stroke():ctx.fill()}
function sunshine(ctx,x,y){ctx.save();ctx.translate(x,y);ctx.strokeStyle='#d8ac58';ctx.lineWidth=3;for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*33,Math.sin(a)*33);ctx.lineTo(Math.cos(a)*43,Math.sin(a)*43);ctx.stroke()}ctx.fillStyle='#ffe19a';ctx.beginPath();ctx.arc(0,0,26,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#66564e';ctx.lineWidth=3;for(const eye of [-9,9]){ctx.beginPath();ctx.arc(eye,-5,2,0,Math.PI*2);ctx.stroke()}ctx.beginPath();ctx.arc(0,2,12,.15*Math.PI,.85*Math.PI);ctx.stroke();ctx.restore()}
function pageBackground(ctx,W,H){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff2dc';rounded(ctx,55,42,W-110,158);sunshine(ctx,110,H-65)}

function wrap(ctx,text,maxWidth){const words=String(text).split(/\s+/);const lines=[];let line='';for(const word of words){if(ctx.measureText(word).width>maxWidth){if(line){lines.push(line);line=''}let chunk='';for(const ch of word){if(ctx.measureText(chunk+ch).width>maxWidth&&chunk){lines.push(chunk);chunk=''}chunk+=ch}line=chunk;continue}const next=line?line+' '+word:word;if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word}else line=next}if(line)lines.push(line);return lines.length?lines:['']}
async function drawVisual(ctx,visual,x,y,w,h){if(!visual)return;if(visual.kind==='picto'){ctx.textAlign='center';ctx.font='60px FamilyPrint';ctx.fillText(visual.symbol,x+w/2,y+h*0.72);ctx.textAlign='left';return}if(['photo','local','mulberry'].includes(visual.kind)&&/^data:image\/(?:jpeg|png);base64,/.test(visual.data)){const image=new Image();image.src=visual.data;await image.decode();const scale=Math.min(w/image.naturalWidth,h/image.naturalHeight);const dw=image.naturalWidth*scale,dh=image.naturalHeight*scale;ctx.drawImage(image,x+(w-dw)/2,y+(h-dh)/2,dw,dh)}}
async function present(images,width,height,filename,preview){
 const paper=pdfPaper();
 const blob=await FamilyPdfRenderer.build(images,width,height,paper);
 if(!preview){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return blob.size}
 const dialog=document.createElement('dialog');dialog.className='cap-preview';if(width>height)dialog.dataset.landscape='true';dialog.setAttribute('aria-label','Aperçu avant impression');
 const bar=document.createElement('div');bar.className='cap-preview-bar';
 const title=document.createElement('strong');title.textContent='Aperçu avant impression · '+images.length+' page'+(images.length>1?'s':'');
 const print=document.createElement('button');print.type='button';print.textContent='Imprimer';print.onclick=()=>window.print();
 const download=document.createElement('button');download.type='button';download.textContent='Télécharger le PDF';download.onclick=()=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)};
 const close=document.createElement('button');close.type='button';close.textContent='Fermer';close.onclick=()=>dialog.close();
 bar.append(title,print,download,close);dialog.append(bar);
 const urls=[];for(const [i,bytes] of images.entries()){const url=URL.createObjectURL(new Blob([await previewPage(bytes,width,height,paper)],{type:'image/jpeg'}));urls.push(url);const page=document.createElement('img');page.className='cap-preview-page';page.src=url;page.alt='Page '+(i+1)+' sur '+images.length;dialog.append(page)}
 let pageStyle=document.createElement('style');pageStyle.textContent='@page{size:'+(paper==='letter'?'Letter':'A4')+(width>height?' landscape':' portrait')+';margin:8mm}@media print{.cap-preview .cap-preview-page{width:'+(width>height?(paper==='letter'?'263':'281'):(paper==='letter'?'199':'194'))+'mm!important}}';dialog.addEventListener('close',()=>{urls.forEach(URL.revokeObjectURL);pageStyle?.remove();dialog.remove()},{once:true});
 if(!document.getElementById('cap-preview-style')){const style=document.createElement('style');style.id='cap-preview-style';style.textContent='.cap-preview{width:min(900px,96vw);max-width:96vw;max-height:95vh;padding:0;border:1px solid #9eb2c5;border-radius:12px;background:#e8edf3;color:#302839}.cap-preview::backdrop{background:rgba(10,25,40,.65)}.cap-preview-bar{position:sticky;top:0;z-index:1;display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;padding:.8rem;background:white;border-bottom:1px solid #ccd8e4}.cap-preview-bar strong{margin-right:auto}.cap-preview-bar button{background:#503854;color:white;border:0;border-radius:7px;padding:.6rem .8rem;font:inherit;cursor:pointer}.cap-preview-page{display:block;width:min(100%,720px);height:auto;margin:1rem auto;box-shadow:0 2px 12px #9aa;object-fit:contain}@media print{body:has(.cap-preview[open]) > :not(.cap-preview){display:none!important}.cap-preview[open]{display:block!important;position:static!important;width:100%!important;max-width:none!important;max-height:none!important;overflow:visible!important;padding:0!important;margin:0!important;border:0!important;background:white!important}.cap-preview-bar{display:none!important}.cap-preview-page{display:block!important;width:190mm!important;max-width:none!important;height:auto!important;margin:0 auto!important;box-shadow:none!important;break-after:page}.cap-preview-page:last-child{break-after:auto}}';document.head.append(style)}
 document.head.append(pageStyle);document.body.append(dialog);dialog.showModal();return blob.size
}
function pdfDate(iso){const d=new Date(String(iso||'')+'T12:00:00');return Number.isNaN(d.getTime())?'':d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
function plusDays(iso,n){const d=new Date(String(iso||'')+'T12:00:00');if(Number.isNaN(d.getTime()))return '';d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
async function downloadWeekly(plan,preview){await FamilyPdfRenderer.ready();
 const W=1754,H=1240,days=Number(plan.weekDays)===5?5:7,names=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'],perDay=7;
 const count=Math.max(1,...Array.from({length:days},(_,d)=>Math.ceil(plan.items.filter(x=>Number(x.day||0)===d).length/perDay)));
 const rendererPage=FamilyPdfRenderer.createPage(W,H),canvas=rendererPage.canvas,ctx=rendererPage.ctx;const images=[];
 for(let page=0;page<count;page++){pageBackground(ctx,W,H);ctx.fillStyle=PAPER_INK;ctx.textAlign='center';ctx.font='bold 46px FamilyPrint';wrap(ctx,plan.title||'Ma semaine',W-140).slice(0,1).forEach(t=>ctx.fillText(t,W/2,95));ctx.font='25px FamilyPrint';ctx.fillText('Semaine du '+pdfDate(plan.weekStart)+' au '+pdfDate(plusDays(plan.weekStart,days-1)),W/2,145);ctx.textAlign='left';
 const gap=12,left=50,colW=(W-100-gap*(days-1))/days,maxShown=Math.max(1,...Array.from({length:days},(_,d)=>Math.min(perDay,Math.max(0,plan.items.filter(x=>Number(x.day||0)===d).length-page*perDay)))),rowH=Math.min(300,(H-290-100)/maxShown),cardH=rowH-10,stacked=rowH>=200;
 for(let d=0;d<days;d++){const x=left+d*(colW+gap),items=plan.items.filter(item=>Number(item.day||0)===d).slice(page*perDay,(page+1)*perDay);ctx.fillStyle='#eaf7ee';rounded(ctx,x,210,colW,65);ctx.fillStyle='#446657';ctx.font='bold 25px FamilyPrint';ctx.fillText(names[d],x+12,240);ctx.font='20px FamilyPrint';ctx.fillText(pdfDate(plusDays(plan.weekStart,d)),x+12,265);
 if(!items.length){ctx.fillStyle='#665e6f';ctx.font='18px FamilyPrint';ctx.fillText('—',x+12,322)}
 for(const [i,item] of items.entries()){const y=290+i*rowH;ctx.fillStyle=ACCENTS[i%ACCENTS.length];rounded(ctx,x,y,colW,cardH);ctx.strokeStyle='#dce5e2';rounded(ctx,x,y,colW,cardH,true);ctx.fillStyle='#446657';ctx.font='bold 19px FamilyPrint';ctx.fillText(item.time||' ',x+10,y+25);const size=stacked?Math.min(110,colW-35):58;if(item.visual)await drawVisual(ctx,item.visual,stacked?x+(colW-size)/2:x+8,stacked?y+40:y+38,size,size);ctx.fillStyle=PAPER_INK;ctx.font='19px FamilyPrint';ctx.textAlign=stacked?'center':'left';wrap(ctx,item.label,stacked?colW-24:colW-83).slice(0,3).forEach((line,k)=>ctx.fillText(line,stacked?x+colW/2:x+73,stacked?y+40+size+28+k*23:y+53+k*23));ctx.textAlign='left'}}
 ctx.textAlign='center';ctx.fillStyle='#665e6f';ctx.font='20px FamilyPrint';ctx.fillText('Page '+(page+1)+' / '+count,W/2,H-30);images.push(rendererPage.snapshot())}
 return present(images,W,H,'planning-semaine-capelune-famille.pdf',preview)
}

function sequenceHeading(ctx,sequence,W,decorated=false){
 ctx.textAlign='center';ctx.fillStyle=PAPER_INK;
 const name=String(sequence.childName||'').trim();
 if(name){ctx.font='bold 44px FamilyPrint';let size=44;while(ctx.measureText(name).width>W-200&&size>24)ctx.font='bold '+(--size)+'px FamilyPrint';ctx.fillText(name,W/2,95);ctx.font='bold 29px FamilyPrint';wrap(ctx,sequence.title||'Ma séquence',W-180).slice(0,2).forEach((line,i)=>ctx.fillText(line,W/2,140+i*35))}
 else {ctx.font='bold 44px FamilyPrint';wrap(ctx,sequence.title||'Ma séquence',W-180).slice(0,2).forEach((line,i)=>ctx.fillText(line,W/2,100+i*48))}
 ctx.textAlign='left';
}
function softEllipse(ctx,x,y,rx,ry,color){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);trainCircle(ctx,0,0,1,color);ctx.restore()}
function themedFrame(ctx,theme,x,y,w,h,color){
 if(theme==='garden'){
  ctx.fillStyle='#9fc3a6';rounded(ctx,x+w/2-6,y+h,12,95,false,5);softEllipse(ctx,x+w/2-23,y+h+75,25,12,'#bbd9b5');softEllipse(ctx,x+w/2+23,y+h+65,25,12,'#bbd9b5');
  for(const [px,py] of [[.18,.04],[.5,0],[.82,.04],[.03,.23],[.97,.23],[.02,.5],[.98,.5],[.03,.77],[.97,.77],[.18,.96],[.5,1],[.82,.96]])softEllipse(ctx,x+w*px,y+h*py,w*.12,h*.12,color);
 }else if(theme==='clouds'){
  for(const [px,py]of [[.2,.02],[.5,0],[.8,.04],[.01,.3],[.99,.35],[.02,.7],[.99,.7],[.23,.98],[.53,1],[.8,.95]])softEllipse(ctx,x+w*px,y+h*py,w*.12,h*.12,color);
 }else{
  softEllipse(ctx,x+w/2,y+h/2,w*.57,h*.52,color);
  ctx.save();ctx.translate(x+w/2,y+h*.55);ctx.scale(1,.3);ctx.strokeStyle='#a6cabb';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,w*.6,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 if(theme==='space'){softEllipse(ctx,x+w/2,y+h/2,w/2-18,h/2-40,'#fffdf7')}else{ctx.fillStyle=color;rounded(ctx,x,y,w,h,false,55);ctx.fillStyle='#fffdf7';rounded(ctx,x+18,y+55,w-36,h-75,false,40)}
}
async function downloadSoftTheme(sequence,preview){
 const landscape=sequence.layout==='horizontal',W=landscape?1754:1240,H=landscape?1240:1754,max=4,count=Math.max(1,Math.ceil(sequence.steps.length/max)),per=Math.max(1,Math.ceil(sequence.steps.length/count)),pageRenderer=FamilyPdfRenderer.createPage(W,H),ctx=pageRenderer.ctx,images=[],colors=['#d8efdf','#ffe4d8','#e8daf5','#d8ebfb'];
 for(let page=0;page<count;page++){
 ctx.fillStyle='#fffdf7';ctx.fillRect(0,0,W,H);sunshine(ctx,W-75,75);sequenceHeading(ctx,sequence,W,true);
 const shown=sequence.steps.slice(page*per,(page+1)*per),cols=landscape?Math.max(1,shown.length):Math.min(2,Math.max(1,shown.length)),rows=Math.max(1,Math.ceil(shown.length/cols)),rowH=Math.min(790,(H-390)/rows),gap=100,cardW=Math.min(600,(W-180-gap*(cols-1))/cols),cardH=Math.min(660,rowH-180),start=(W-(cols*cardW+(cols-1)*gap))/2;
 for(const [i,step]of shown.entries()){
 const x=start+(i%cols)*(cardW+gap),y=310+Math.floor(i/cols)*rowH,n=page*per+i+1;themedFrame(ctx,sequence.theme,x,y,cardW,cardH,colors[(n-1)%4]);
 trainCircle(ctx,x+cardW/2,y+20,30,'#fffdf7');ctx.fillStyle=PAPER_INK;ctx.textAlign='center';ctx.font='bold 34px FamilyPrint';ctx.fillText(String(n),x+cardW/2,y+32);
 const vs=Math.min(260,cardW-80,cardH-340);if(step.visual)await drawVisual(ctx,step.visual,x+(cardW-vs)/2,y+78,vs,vs);
 ctx.textAlign='center';ctx.fillStyle=PAPER_INK;let fs=29;ctx.font='bold '+fs+'px FamilyPrint';let lines=wrap(ctx,step.label,cardW-65);while(lines.length>5&&fs>16){ctx.font='bold '+(--fs)+'px FamilyPrint';lines=wrap(ctx,step.label,cardW-65)}lines.slice(0,5).forEach((line,k)=>ctx.fillText(line,x+cardW/2,y+78+vs+42+k*32));trainCircle(ctx,x+cardW/2,y+cardH-48,22,'#fffdf7','#567b68');
 }
 ctx.textAlign='center';ctx.font='22px FamilyPrint';ctx.fillStyle=PAPER_INK;ctx.fillText('Mon rythme, mes étapes',W/2,H-60);ctx.font='19px FamilyPrint';ctx.fillText('Page '+(page+1)+' / '+count,W/2,H-28);images.push(pageRenderer.snapshot());
 }
 return present(images,W,H,'sequence-personnalisee.pdf',preview)
}

async function downloadHorizontal(sequence,preview){await FamilyPdfRenderer.ready();
 const W=1754,H=1240,maxPerPage=6,count=Math.max(1,Math.ceil(sequence.steps.length/maxPerPage)),perPage=Math.max(1,Math.ceil(sequence.steps.length/count)),rendererPage=FamilyPdfRenderer.createPage(W,H),canvas=rendererPage.canvas,ctx=rendererPage.ctx;const images=[];
 for(let page=0;page<count;page++){pageBackground(ctx,W,H);sequenceHeading(ctx,sequence,W);
 const shown=sequence.steps.slice(page*perPage,(page+1)*perPage),columns=Math.max(1,shown.length),gap=24,cardW=(W-110-gap*(columns-1))/columns,visualSize=Math.min(300,cardW-60),cardH=Math.min(760,visualSize+460);
 for(const [i,step] of shown.entries()){const x=55+i*(cardW+gap),y=260;ctx.fillStyle=ACCENTS[i%ACCENTS.length];rounded(ctx,x,y,cardW,cardH);ctx.strokeStyle='#dce5e2';ctx.lineWidth=2;rounded(ctx,x,y,cardW,cardH,true);ctx.fillStyle='#446657';ctx.font='bold 35px FamilyPrint';ctx.fillText(String(page*perPage+i+1),x+20,y+55);if(step.visual)await drawVisual(ctx,step.visual,x+(cardW-visualSize)/2,y+95,visualSize,visualSize);ctx.fillStyle=PAPER_INK;ctx.textAlign='center';let fontSize=28;ctx.font='bold '+fontSize+'px FamilyPrint';let lines=wrap(ctx,step.label,cardW-35);while(lines.length>6&&fontSize>20){fontSize--;ctx.font='bold '+fontSize+'px FamilyPrint';lines=wrap(ctx,step.label,cardW-35)}lines.slice(0,6).forEach((line,k)=>ctx.fillText(line,x+cardW/2,y+95+visualSize+65+k*34));ctx.strokeStyle='#94b8a3';ctx.lineWidth=3;ctx.strokeRect(x+cardW/2-24,y+cardH-80,48,48);ctx.textAlign='left'}
 ctx.textAlign='center';ctx.fillStyle='#665e6f';ctx.font='20px FamilyPrint';ctx.fillText('Page '+(page+1)+' / '+count,W/2,H-40);images.push(rendererPage.snapshot())}
 return present(images,W,H,'sequence-horizontale-capelune-famille.pdf',preview)
}
async function downloadPlanning(plan,preview=false){await FamilyPdfRenderer.ready();if(!plan||!Array.isArray(plan.items))throw Error('Planning invalide');if(plan.mode==='week')return downloadWeekly(plan,preview);
const W=1240,H=1754,maxPerPage=12,count=Math.max(1,Math.ceil(plan.items.length/maxPerPage)),perPage=Math.max(1,Math.ceil(plan.items.length/count));const rendererPage=FamilyPdfRenderer.createPage(W,H),canvas=rendererPage.canvas,ctx=rendererPage.ctx;const images=[];
for(let page=0;page<count;page++){pageBackground(ctx,W,H);ctx.textAlign='center';ctx.fillStyle=PAPER_INK;ctx.font='bold 44px FamilyPrint';const title=wrap(ctx,plan.title||'Ma journée',W-150).slice(0,2);if(title.length>1){ctx.fillStyle='#fff2dc';rounded(ctx,55,42,W-110,200);ctx.fillStyle=PAPER_INK}title.forEach((line,i)=>ctx.fillText(line,W/2,110+i*52));ctx.font='28px FamilyPrint';let date='';if(plan.date){const d=new Date(plan.date+'T12:00:00');if(!Number.isNaN(d.getTime()))date=d.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}ctx.fillText((plan.mode==='half'?(plan.half||'Matin')+' · ':'')+date,W/2,165+Math.max(0,title.length-1)*52);ctx.textAlign='left';const top=255,shown=plan.items.slice(page*perPage,(page+1)*perPage),rowH=Math.min(340,(H-top-120)/Math.max(1,shown.length)),cardH=rowH-12,visualSize=Math.min(230,cardH-30);
for(const [i,item] of shown.entries()){const y=top+i*rowH;ctx.fillStyle=ACCENTS[i%ACCENTS.length];rounded(ctx,75,y,W-150,cardH);ctx.fillStyle='#446657';ctx.font='bold 28px FamilyPrint';ctx.fillText(item.time||'—',95,y+cardH/2+10);const centered=true,visualX=W/2-visualSize/2,labelX=W/2+visualSize/2+35;if(item.visual)await drawVisual(ctx,item.visual,visualX,y+(cardH-visualSize)/2,visualSize,visualSize);ctx.fillStyle=PAPER_INK;ctx.font=(centered?'26':'29')+'px FamilyPrint';const lines=wrap(ctx,item.label,W-labelX-75).slice(0,centered?3:2);lines.forEach((line,k)=>ctx.fillText(line,labelX,y+cardH/2-(lines.length-1)*15.5+8+k*31));ctx.strokeStyle='#dce5e2';ctx.beginPath();ctx.moveTo(75,y+cardH);ctx.lineTo(W-75,y+cardH);ctx.stroke()}
ctx.textAlign='center';ctx.font='20px FamilyPrint';ctx.fillStyle='#665e6f';ctx.fillText('Page '+(page+1)+' / '+count,W/2,H-55);images.push(rendererPage.snapshot())}
return present(images,W,H,'planning-capelune-famille.pdf',preview)}

function trainCircle(ctx,x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke()}}
function trainEngine(ctx,x,y,w,h){ctx.save();ctx.translate(x,y);ctx.scale(w/150,h/200);ctx.fillStyle='#bde9cc';rounded(ctx,8,95,95,72,false,28);ctx.fillStyle='#a8d9be';rounded(ctx,84,55,59,112,false,13);ctx.fillStyle='#e8f2fc';rounded(ctx,96,70,34,43,false,8);ctx.fillStyle='#86b99d';rounded(ctx,76,45,72,17,false,8);rounded(ctx,44,48,18,48,false,5);ctx.fillStyle='#e4f5e9';trainCircle(ctx,52,24,12,'#e4f5e9');for(const wx of [38,115]){trainCircle(ctx,wx,169,23,'#567b68');trainCircle(ctx,wx,169,10,'#ffe19a')}trainCircle(ctx,25,119,3,PAPER_INK);ctx.strokeStyle=PAPER_INK;ctx.beginPath();ctx.arc(25,126,10,.15*Math.PI,.85*Math.PI);ctx.stroke();ctx.restore()}
async function downloadTrain(sequence,preview){
 const landscape=sequence.layout==='horizontal',W=landscape?1754:1240,H=landscape?1240:1754,max=4,count=Math.max(1,Math.ceil(sequence.steps.length/max)),per=Math.max(1,Math.ceil(sequence.steps.length/count)),rendererPage=FamilyPdfRenderer.createPage(W,H),ctx=rendererPage.ctx,images=[];
 const colors=['#ffe4d8','#d8efdf','#e8daf5','#d8ebfb'];
 for(let page=0;page<count;page++){
 ctx.fillStyle='#fffdf7';ctx.fillRect(0,0,W,H);sunshine(ctx,W-90,85);sequenceHeading(ctx,sequence,W,true);ctx.textAlign='center';ctx.font='25px FamilyPrint';ctx.fillText('Une étape après l’autre',W/2,225);
 const shown=sequence.steps.slice(page*per,(page+1)*per),cols=landscape?Math.max(1,shown.length):Math.min(2,Math.max(1,shown.length)),rows=Math.max(1,Math.ceil(shown.length/cols)),rowH=Math.min(740,(H-390)/rows),gap=20,engineW=landscape?190:150,start=engineW+70,available=W-start-60,cardW=Math.min(620,(available-gap*(cols-1))/cols),cardH=Math.min(690,rowH-85);
 for(let row=0;row<rows;row++){
 const rowSteps=shown.slice(row*cols,(row+1)*cols),top=290+row*rowH,rail=top+cardH+38;
 ctx.strokeStyle='#a2b6aa';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(45,rail);ctx.lineTo(W-45,rail);ctx.stroke();
 for(let sx=55;sx<W-45;sx+=55){ctx.strokeStyle='#d6e2d9';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(sx,rail+5);ctx.lineTo(sx-8,rail+20);ctx.stroke()}
 trainEngine(ctx,55,top+cardH-190,engineW-10,220);
 for(const [col,step] of rowSteps.entries()){
 const i=row*cols+col,x=start+col*(cardW+gap),y=top,number=page*per+i+1;
 ctx.fillStyle=colors[(number-1)%4];rounded(ctx,x,y,cardW,cardH,false,32);
 ctx.fillStyle='#fffdf7';rounded(ctx,x+15,y+65,cardW-30,cardH-150,false,26);
 trainCircle(ctx,x+cardW/2,y+22,34,'#fffdf7');ctx.fillStyle=PAPER_INK;ctx.textAlign='center';ctx.font='bold 36px FamilyPrint';ctx.fillText(String(number),x+cardW/2,y+35);
 const visualSize=Math.min(260,cardW-65,cardH-295);if(step.visual)await drawVisual(ctx,step.visual,x+(cardW-visualSize)/2,y+88,visualSize,visualSize);
 ctx.textAlign='center';ctx.fillStyle=PAPER_INK;let fs=30;ctx.font='bold '+fs+'px FamilyPrint';let lines=wrap(ctx,step.label,cardW-50);while(lines.length>5&&fs>20){ctx.font='bold '+(--fs)+'px FamilyPrint';lines=wrap(ctx,step.label,cardW-50)}lines.slice(0,5).forEach((line,k)=>ctx.fillText(line,x+cardW/2,y+88+visualSize+43+k*34));
 trainCircle(ctx,x+cardW/2,y+cardH-44,23,'#fffdf7','#567b68');
 for(const wx of [x+40,x+cardW-40]){trainCircle(ctx,wx,y+cardH+7,30,'#567b68');trainCircle(ctx,wx,y+cardH+7,12,'#ffe19a')}
 ctx.fillStyle='#86a895';rounded(ctx,x-15,y+cardH-60,15,12,false,4);
 }
 }
 ctx.textAlign='center';ctx.fillStyle=PAPER_INK;ctx.font='24px FamilyPrint';ctx.fillText('Mon rythme, mes étapes',W/2,H-65);ctx.font='19px FamilyPrint';ctx.fillText('Page '+(page+1)+' / '+count,W/2,H-30);images.push(rendererPage.snapshot());
 }
 return present(images,W,H,'sequence-petit-train.pdf',preview)
}

async function downloadSequence(sequence,preview=false){await FamilyPdfRenderer.ready();if(!sequence||!Array.isArray(sequence.steps))throw Error('Séquence invalide');if(['garden','space','clouds'].includes(sequence.theme))return downloadSoftTheme(sequence,preview);if(sequence.theme==='train')return downloadTrain(sequence,preview);if(sequence.layout==='horizontal')return downloadHorizontal(sequence,preview);
const W=1240,H=1754,maxPerPage=8,count=Math.max(1,Math.ceil(sequence.steps.length/maxPerPage)),perPage=Math.max(1,Math.ceil(sequence.steps.length/count));const rendererPage=FamilyPdfRenderer.createPage(W,H),canvas=rendererPage.canvas,ctx=rendererPage.ctx;const images=[];
for(let page=0;page<count;page++){pageBackground(ctx,W,H);sequenceHeading(ctx,sequence,W);
const shown=sequence.steps.slice(page*perPage,(page+1)*perPage),rowH=Math.min(370,(H-230-120)/Math.max(1,shown.length)),cardH=rowH-15,visualSize=Math.min(245,cardH-35);
for(const [i,step] of shown.entries()){const number=page*perPage+i+1,y=230+i*rowH;ctx.fillStyle=ACCENTS[i%ACCENTS.length];rounded(ctx,75,y,W-150,cardH);ctx.strokeStyle='#dce5e2';rounded(ctx,75,y,W-150,cardH,true);ctx.fillStyle='#446657';ctx.font='bold 38px FamilyPrint';ctx.fillText(String(number),105,y+cardH/2+12);if(step.visual)await drawVisual(ctx,step.visual,175,y+(cardH-visualSize)/2,visualSize,visualSize);ctx.fillStyle=PAPER_INK;ctx.font='32px FamilyPrint';wrap(ctx,step.label,W-(210+visualSize)-195).slice(0,3).forEach((line,k,lines)=>ctx.fillText(line,210+visualSize,y+cardH/2-(lines.length-1)*20+10+k*40));ctx.strokeStyle='#94b8a3';ctx.strokeRect(W-175,y+cardH/2-24,48,48)}
ctx.textAlign='center';ctx.font='20px FamilyPrint';ctx.fillStyle='#665e6f';ctx.fillText('Page '+(page+1)+' / '+count,W/2,H-55);images.push(rendererPage.snapshot())}
return present(images,W,H,'sequence-capelune-famille.pdf',preview)}
async function downloadRecurrences(records,preview=false){await FamilyPdfRenderer.ready();if(!Array.isArray(records))throw Error('Suivi invalide');const sorted=[...records].sort((a,b)=>b.date.localeCompare(a.date));const W=1240,H=1754,perPage=7,count=Math.max(1,Math.ceil(sorted.length/perPage));const rendererPage=FamilyPdfRenderer.createPage(W,H),canvas=rendererPage.canvas,ctx=rendererPage.ctx;const images=[];
for(let page=0;page<count;page++){pageBackground(ctx,W,H);ctx.fillStyle=PAPER_INK;ctx.textAlign='center';ctx.font='bold 44px FamilyPrint';ctx.fillText('Suivi des récurrences',W/2,115);ctx.font='24px FamilyPrint';ctx.fillText(sorted.length+' observation(s) · export du '+new Date().toLocaleDateString('fr-FR'),W/2,165);ctx.textAlign='left';sorted.slice(page*perPage,(page+1)*perPage).forEach((r,i)=>{const y=225+i*205;ctx.fillStyle=ACCENTS[i%ACCENTS.length];rounded(ctx,75,y,W-150,190);ctx.strokeStyle='#dce5e2';rounded(ctx,75,y,W-150,190,true);ctx.fillStyle='#446657';ctx.font='bold 27px FamilyPrint';ctx.fillText(r.date+' · '+r.type.slice(0,55),95,y+42);ctx.fillStyle=PAPER_INK;ctx.font='25px FamilyPrint';wrap(ctx,'Contexte : '+r.context,W-210).slice(0,2).forEach((line,k)=>ctx.fillText(line,95,y+82+k*31));ctx.font='22px FamilyPrint';wrap(ctx,r.note||'',W-210).slice(0,2).forEach((line,k)=>ctx.fillText(line,95,y+145+k*27))});ctx.textAlign='center';ctx.font='20px FamilyPrint';ctx.fillStyle='#665e6f';ctx.fillText('Page '+(page+1)+' / '+count,W/2,H-55);images.push(rendererPage.snapshot())}
return present(images,W,H,'suivi-recurrences-capelune-famille.pdf',preview)}
async function downloadPassport(passport,preview=false){await FamilyPdfRenderer.ready();if(!passport||typeof passport!=='object')throw Error('Passeport invalide');const sections=[['Comment je communique',passport.communication],['Ce que j’aime',passport.likes],['Ce qui peut être difficile',passport.difficulties],['Ce qui m’aide',passport.helps],['Mes signes de surcharge',passport.signs],['Informations utiles à partager',passport.other]];const W=1240,H=1754,rendererPage=FamilyPdfRenderer.createPage(W,H),canvas=rendererPage.canvas,ctx=rendererPage.ctx;const images=[];let y=0;
function start(){pageBackground(ctx,W,H);ctx.textAlign='center';ctx.fillStyle=PAPER_INK;ctx.font='bold 42px FamilyPrint';ctx.fillText('Passeport de l’enfant',W/2,105);ctx.font='27px FamilyPrint';ctx.fillText(passport.nickname||'Mes repères',W/2,155);ctx.textAlign='left';y=215}
function finish(){ctx.textAlign='center';ctx.font='20px FamilyPrint';ctx.fillStyle='#665e6f';ctx.fillText('Mes repères au quotidien',W/2,H-55);images.push(rendererPage.snapshot())}
start();for(const [heading,value] of sections){if(!String(value||'').trim())continue;ctx.font='27px FamilyPrint';const lines=wrap(ctx,value,W-210);const height=84+lines.length*38;if(y+height>H-120){finish();start()}ctx.fillStyle='#eaf7ee';rounded(ctx,75,y,W-150,height);ctx.fillStyle='#446657';ctx.font='bold 28px FamilyPrint';ctx.fillText(heading,95,y+40);ctx.fillStyle=PAPER_INK;ctx.font='27px FamilyPrint';lines.forEach((line,i)=>ctx.fillText(line,95,y+82+i*38));y+=height+17}finish();
return present(images,W,H,'passeport-capelune-famille.pdf',preview)}
const PRINTABLES={
'maintenant-apres':{title:'Maintenant / Après',cards:['MAINTENANT','APRÈS'],hint:'Ajoutez une image ou une consigne dans chaque case après impression.'},
'choix-deux':{title:'Je choisis',cards:['CHOIX 1','CHOIX 2'],hint:'Présentez deux possibilités concrètes.'},
'demande-aide':{title:'Je demande de l’aide',cards:['J’AI BESOIN D’AIDE'],hint:'Découpez cette carte et gardez-la à portée de main.'},
'pause':{title:'Je fais une pause',cards:['J’AI BESOIN D’UNE PAUSE'],hint:'Choisissez ensemble un endroit et une durée adaptés.'},
'routine-vierge':{title:'Ma routine',cards:['ÉTAPE 1','ÉTAPE 2','ÉTAPE 3','ÉTAPE 4'],hint:'Dessinez ou collez une image dans chaque case.'}
};
async function downloadPrintable(key,preview=false){await FamilyPdfRenderer.ready();const model=PRINTABLES[key];if(!model)throw Error('Support inconnu');const W=1240,H=1754,rendererPage=FamilyPdfRenderer.createPage(W,H),canvas=rendererPage.canvas,ctx=rendererPage.ctx;pageBackground(ctx,W,H);ctx.fillStyle=PAPER_INK;ctx.textAlign='center';ctx.font='bold 48px FamilyPrint';ctx.fillText(model.title,W/2,120);ctx.font='25px FamilyPrint';wrap(ctx,model.hint,W-160).slice(0,2).forEach((line,i)=>ctx.fillText(line,W/2,175+i*35));const count=model.cards.length,columns=count===1?1:2,rows=Math.ceil(count/columns),gap=28,cellWidth=(W-150-(columns-1)*gap)/columns,cellHeight=Math.min(540,(H-360-(rows-1)*gap)/rows);model.cards.forEach((label,i)=>{const col=i%columns,row=Math.floor(i/columns),x=75+col*(cellWidth+gap),y=260+row*(cellHeight+gap);ctx.fillStyle='#eaf7ee';rounded(ctx,x,y,cellWidth,cellHeight);ctx.strokeStyle='#94b8a3';ctx.lineWidth=3;rounded(ctx,x,y,cellWidth,cellHeight,true);ctx.fillStyle='#446657';ctx.font='bold 35px FamilyPrint';ctx.fillText(label,x+cellWidth/2,y+60);ctx.strokeStyle='#dce5e2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+35,y+cellHeight-80);ctx.lineTo(x+cellWidth-35,y+cellHeight-80);ctx.stroke()});ctx.fillStyle='#665e6f';ctx.font='20px FamilyPrint';ctx.fillText('Mes repères au quotidien',W/2,H-55);return present([rendererPage.snapshot()],W,H,'outil-'+key+'-capelune-famille.pdf',preview)}

function pdfPaper(){return document.getElementById('pdf-paper')?.value==='letter'?'letter':'a4'}
async function previewPage(scene,W,H,paper){
 if(paper!=='letter')return scene.jpeg;
 const geo=FamilyPdfRenderer.pageGeometry(W,H,paper),canvas=document.createElement('canvas');
 canvas.width=Math.round(geo.pageW*2);canvas.height=Math.round(geo.pageH*2);
 const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 const url=URL.createObjectURL(new Blob([scene.jpeg],{type:'image/jpeg'})),img=new Image();
 try{img.src=url;await img.decode();ctx.drawImage(img,geo.left*2,geo.top*2,W*geo.scale*2,H*geo.scale*2);const data=atob(canvas.toDataURL('image/jpeg',.94).split(',')[1]);return Uint8Array.from(data,c=>c.charCodeAt(0))}finally{URL.revokeObjectURL(url)}
}
function installPaperChoice(){
 const button=document.getElementById('pdf')||document.querySelector('[data-pdf]');
 const host=button?.closest('.actions')||document.querySelector('main>.grid');
 if(!host||document.getElementById('pdf-paper'))return;
 const box=document.createElement('div');box.className='pdf-paper-choice controls';
 const label=document.createElement('label');label.htmlFor='pdf-paper';label.textContent='Format du PDF';
 const select=document.createElement('select');select.id='pdf-paper';
 for(const [value,text] of [['a4','A4'],['letter','Letter']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option)}
 box.append(label,select);host.before(box);
}
installPaperChoice();

global.CapelunePdf={downloadPlanning,downloadSequence,downloadRecurrences,downloadPassport,downloadPrintable};
})(window);
