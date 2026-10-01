/* Rendu PDF dédié : texte Unicode, formes vectorielles, images intégrées.
   Sans dépendance ni requête réseau. Le canvas sert aux mesures et à l'aperçu. */
(function(global){
'use strict';
const encoder=new TextEncoder(),ascii=s=>encoder.encode(s),n=v=>Number(v.toFixed(4));
function parseFont(base64,name){
 const binary=atob(base64),data=Uint8Array.from(binary,c=>c.charCodeAt(0)),v=new DataView(data.buffer),tables={};
 for(let i=0;i<v.getUint16(4);i++){const o=12+i*16;const tag=String.fromCharCode(...data.slice(o,o+4));tables[tag]=v.getUint32(o+8)}
 const head=tables.head,hhea=tables.hhea,units=v.getUint16(head+18),metrics=v.getUint16(hhea+34),cmap=tables.cmap;let sub=0;
 for(let i=0;i<v.getUint16(cmap+2);i++){const o=cmap+4+i*8,s=cmap+v.getUint32(o+4);if(v.getUint16(s)===12){sub=s;break}}
 if(!sub)throw Error('Police sans cmap Unicode');
 const groups=[];for(let i=0;i<v.getUint32(sub+12);i++){const o=sub+16+i*12;groups.push([v.getUint32(o),v.getUint32(o+4),v.getUint32(o+8)])}
 function glyph(code){for(const [a,b,g] of groups){if(code<a)return 0;if(code<=b)return g+code-a}return 0}
 function width(g){return Math.round(v.getUint16(tables.hmtx+Math.min(g,metrics-1)*4)*1000/units)}
 return {data,name,glyph,width,ascent:Math.round(v.getInt16(hhea+4)*1000/units),descent:Math.round(v.getInt16(hhea+6)*1000/units),bbox:[0,2,4,6].map(i=>Math.round(v.getInt16(head+36+i)*1000/units))}
}
let fontSet=null,fontReady=null;
function fonts(){if(!fontSet)fontSet={regular:parseFont(global.FamilyPdfFonts.regular,'DejaVuSans'),bold:parseFont(global.FamilyPdfFonts.bold,'DejaVuSans-Bold')};return fontSet}
function ready(){
 if(fontReady)return fontReady;
 fonts();fontReady=(async()=>{if(typeof FontFace==='undefined')return;for(const key of ['regular','bold']){const face=new FontFace('FamilyPrint',fonts()[key].data,{weight:key==='bold'?'700':'400'});await face.load();document.fonts.add(face)}})();return fontReady
}
function glyphText(text,bold){const font=fonts()[bold?'bold':'regular'];let encoded='',pairs=[];for(const c of String(text)){const code=c.codePointAt(0),g=font.glyph(code);if(code>65535||!g)return null;encoded+=g.toString(16).padStart(4,'0');pairs.push([g,code])}return {encoded,pairs}}
async function fontStream(data){if(typeof CompressionStream!=='undefined'){const stream=new Blob([data]).stream().pipeThrough(new CompressionStream('deflate'));return {data:new Uint8Array(await new Response(stream).arrayBuffer()),filter:' /Filter /FlateDecode'}}return {data,filter:''}}

function color(hex){const h=String(hex).replace('#','');if(!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(h))throw Error('Couleur PDF invalide');const full=h.length===3?h.split('').map(c=>c+c).join(''):h;return [0,2,4].map(i=>n(parseInt(full.slice(i,i+2),16)/255)).join(' ')}
function bytes(canvas){const url=canvas.toDataURL('image/jpeg',.94),binary=atob(url.slice(url.indexOf(',')+1));return Uint8Array.from(binary,c=>c.charCodeAt(0))}
function matrix(ctx){const m=ctx.getTransform();return [m.a,m.b,m.c,m.d,m.e,m.f]}
function jpegImage(source,width,height){const canvas=document.createElement('canvas');const scale=Math.min(1,1200/Math.max(width,height));canvas.width=Math.max(1,Math.ceil(width*scale));canvas.height=Math.max(1,Math.ceil(height*scale));const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,canvas.height);return {bytes:bytes(canvas),width:canvas.width,height:canvas.height}}
function createPage(W,H){
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const native=canvas.getContext('2d',{alpha:false});if(!native)throw Error('Canvas indisponible');
 let ops=[],path=[],point=null;
 const record=(type,data)=>ops.push({type,...data,m:matrix(native)});
 const move=(x,y)=>{path.push(n(x)+' '+n(y)+' m');point=[x,y]};
 const line=(x,y)=>{path.push(n(x)+' '+n(y)+' l');point=[x,y]};
 const methods={
 beginPath(){path=[];point=null},moveTo:move,lineTo:line,
 closePath(){path.push('h')},
 quadraticCurveTo(cx,cy,x,y){const p=point||[cx,cy];path.push([p[0]+2*(cx-p[0])/3,p[1]+2*(cy-p[1])/3,x+2*(cx-x)/3,y+2*(cy-y)/3,x,y].map(n).join(' ')+' c');point=[x,y]},
 arc(x,y,r,start,end,counter=false){let span=end-start;if(!counter&&span<0)span+=Math.PI*2;if(counter&&span>0)span-=Math.PI*2;const steps=Math.max(8,Math.ceil(Math.abs(span)*12));const first=[x+Math.cos(start)*r,y+Math.sin(start)*r];point?line(...first):move(...first);for(let i=1;i<=steps;i++){const a=start+span*i/steps;line(x+Math.cos(a)*r,y+Math.sin(a)*r)}},
 fill(){record('path',{path:path.join('\n'),fill:native.fillStyle})},
 stroke(){record('path',{path:path.join('\n'),stroke:native.strokeStyle,lineWidth:native.lineWidth})},
 fillRect(x,y,w,h){if(x===0&&y===0&&w===W&&h===H)ops=[];record('rect',{x,y,w,h,fill:native.fillStyle})},
 strokeRect(x,y,w,h){record('rect',{x,y,w,h,stroke:native.strokeStyle,lineWidth:native.lineWidth})},
 fillText(text,x,y){
  const metrics=native.measureText(String(text)),align=native.textAlign,left=x-(align==='center'?metrics.width/2:align==='right'?metrics.width:0),size=Number(native.font.match(/([\d.]+)px/)?.[1]||24);
  const isBold=/bold|[6-9]00/.test(native.font),glyphs=glyphText(text,isBold);
  if(glyphs!==null){record('text',{text:String(text),encoded:glyphs.encoded,pairs:glyphs.pairs,x:left,y,size,bold:isBold,fill:native.fillStyle});return}
  const imageCanvas=document.createElement('canvas');imageCanvas.width=Math.ceil(metrics.width+10);imageCanvas.height=Math.ceil(size*1.6);const c=imageCanvas.getContext('2d',{alpha:false});c.fillStyle='#fff';c.fillRect(0,0,imageCanvas.width,imageCanvas.height);c.font=native.font;c.fillStyle=native.fillStyle;c.fillText(String(text),5,size*1.1);record('image',{image:jpegImage(imageCanvas,imageCanvas.width,imageCanvas.height),x:left-5,y:y-size*1.1,w:imageCanvas.width,h:imageCanvas.height})
 },
 drawImage(source,x,y,w,h){record('image',{image:jpegImage(source,source.naturalWidth||source.width,source.naturalHeight||source.height),x,y,w,h})}
 };
 const ctx=new Proxy(native,{get(target,key){if(key in methods)return(...args)=>{const result=target[key](...args);methods[key](...args);return result};const v=target[key];return typeof v==='function'?v.bind(target):v},set(target,key,value){target[key]=value;return true}});
 return {canvas,ctx,snapshot(){return {ops:ops.slice(),jpeg:bytes(canvas)}}}
}
function pageGeometry(W,H,paper){const landscape=W>H,[pw,ph]=paper==='letter'?[612,792]:[595.2756,841.8898];const pageW=landscape?ph:pw,pageH=landscape?pw:ph,scale=Math.min(pageW/W,pageH/H);return {pageW,pageH,scale,left:(pageW-W*scale)/2,top:(pageH-H*scale)/2}}
async function build(pages,W,H,paper='a4'){
 const parts=[],offsets=[0];let length=0,next=1;const reserve=()=>next++;const objects=new Map();
 const catalog=reserve(),pageTree=reserve(),regular=reserve(),bold=reserve(),kids=[];

 for(const [key,fontId] of [['regular',regular],['bold',bold]]){
  const font=fonts()[key],descendant=reserve(),descriptor=reserve(),program=reserve(),unicode=reserve(),used=new Map();
  for(const scene of pages)for(const op of scene.ops)if(op.type==='text'&&op.bold===(key==='bold'))for(const [g,c]of op.pairs)used.set(g,c);
  const widths=[...used.keys()].sort((a,b)=>a-b).map(g=>g+' ['+font.width(g)+']').join(' ');
  const mappings=[...used].map(([g,c])=>'<'+g.toString(16).padStart(4,'0')+'> <'+c.toString(16).padStart(4,'0')+'>');
  let cmap='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /FamilyUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n';
  for(let i=0;i<mappings.length;i+=100){const chunk=mappings.slice(i,i+100);cmap+=chunk.length+' beginbfchar\n'+chunk.join('\n')+'\nendbfchar\n'}
  cmap+='endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
  const cmapData=ascii(cmap),packed=await fontStream(font.data);
  objects.set(fontId,[ascii('<< /Type /Font /Subtype /Type0 /BaseFont /'+font.name+' /Encoding /Identity-H /DescendantFonts ['+descendant+' 0 R] /ToUnicode '+unicode+' 0 R >>')]);
  objects.set(descendant,[ascii('<< /Type /Font /Subtype /CIDFontType2 /BaseFont /'+font.name+' /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor '+descriptor+' 0 R /CIDToGIDMap /Identity /DW 1000 /W ['+widths+'] >>')]);
  objects.set(descriptor,[ascii('<< /Type /FontDescriptor /FontName /'+font.name+' /Flags 32 /FontBBox ['+font.bbox.join(' ')+'] /ItalicAngle 0 /Ascent '+font.ascent+' /Descent '+font.descent+' /CapHeight '+font.ascent+' /StemV '+(key==='bold'?120:80)+' /FontFile2 '+program+' 0 R >>')]);
  objects.set(program,[ascii('<< /Length '+packed.data.length+' /Length1 '+font.data.length+packed.filter+' >>\nstream\n'),packed.data,ascii('\nendstream')]);
  objects.set(unicode,[ascii('<< /Length '+cmapData.length+' >>\nstream\n'),cmapData,ascii('\nendstream')])
 }
 const geo=pageGeometry(W,H,paper);
 for(const scene of pages){const page=reserve(),content=reserve(),images=[],commands=['q',n(geo.scale)+' 0 0 '+n(-geo.scale)+' '+n(geo.left)+' '+n(geo.pageH-geo.top)+' cm'];
  for(const op of scene.ops){commands.push('q',op.m.map(n).join(' ')+' cm');
   if(op.fill)commands.push(color(op.fill)+' rg');if(op.stroke)commands.push(color(op.stroke)+' RG',n(op.lineWidth)+' w');
   if(op.type==='rect')commands.push([op.x,op.y,op.w,op.h].map(n).join(' ')+' re',op.fill?'f':'S');
   if(op.type==='path')commands.push(op.path,op.fill?'f':'S');
   if(op.type==='text')commands.push('BT /'+(op.bold?'F2':'F1')+' '+n(op.size)+' Tf 1 0 0 -1 '+n(op.x)+' '+n(op.y)+' Tm <'+op.encoded+'> Tj ET');
   if(op.type==='image'){const id=reserve(),name='I'+images.length;images.push({id,name});objects.set(id,[ascii('<< /Type /XObject /Subtype /Image /Width '+op.image.width+' /Height '+op.image.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+op.image.bytes.length+' >>\nstream\n'),op.image.bytes,ascii('\nendstream')]);commands.push([op.w,0,0,-op.h,op.x,op.y+op.h].map(n).join(' ')+' cm /'+name+' Do')}
   commands.push('Q')
  }
  commands.push('Q');const data=ascii(commands.join('\n'));
  objects.set(content,[ascii('<< /Length '+data.length+' >>\nstream\n'),data,ascii('\nendstream')]);
  objects.set(page,[ascii('<< /Type /Page /Parent '+pageTree+' 0 R /MediaBox [0 0 '+n(geo.pageW)+' '+n(geo.pageH)+'] /Resources << /Font << /F1 '+regular+' 0 R /F2 '+bold+' 0 R >> /XObject << '+images.map(i=>'/'+i.name+' '+i.id+' 0 R').join(' ')+' >> >> /Contents '+content+' 0 R >>')]);kids.push(page+' 0 R')
 }
 objects.set(catalog,[ascii('<< /Type /Catalog /Pages '+pageTree+' 0 R >>')]);objects.set(pageTree,[ascii('<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+pages.length+' >>')]);
 const add=b=>{parts.push(b);length+=b.length};add(ascii('%PDF-1.4\n%Dedicated vector renderer\n'));
 for(let id=1;id<next;id++){offsets[id]=length;add(ascii(id+' 0 obj\n'));for(const b of objects.get(id))add(b);add(ascii('\nendobj\n'))}
 const start=length;add(ascii('xref\n0 '+next+'\n0000000000 65535 f \n'));for(let id=1;id<next;id++)add(ascii(String(offsets[id]).padStart(10,'0')+' 00000 n \n'));add(ascii('trailer\n<< /Size '+next+' /Root '+catalog+' 0 R >>\nstartxref\n'+start+'\n%%EOF\n'));return new Blob(parts,{type:'application/pdf'})
}
global.FamilyPdfRenderer={createPage,build,pageGeometry,ready};
})(window);
