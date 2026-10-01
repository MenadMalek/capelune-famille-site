/* Android adapter: PDFs and JSON backups go through the system file picker.
 * In a browser this script has no effect. Native messages are restricted to the packaged origin.
 */
(()=>{
 'use strict';
 if(!window.CapeluneNative || typeof window.CapeluneNative.postMessage!=='function')return;
 window.CapeluneAndroid=true;
 const blobs=new Map(),create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
 URL.createObjectURL=blob=>{const url=create(blob);blobs.set(url,blob);return url;};
 URL.revokeObjectURL=url=>{blobs.delete(url);revoke(url);};
 async function save(blob,name){
  if(!['application/pdf','application/json'].includes(blob.type)){alert('Ce format ne peut pas être exporté sur Android.');return;}
  if(blob.size>32*1024*1024){alert('Ce fichier est trop volumineux pour être exporté.');return;}
  try{
   const data=await new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);
    reader.onerror=reject;reader.readAsDataURL(blob);
   });
   window.CapeluneNative.postMessage(JSON.stringify({action:'save',name,mime:blob.type,data}));
  }catch{alert('Impossible de préparer ce fichier. Réessayez.');}
 }
 function handleAnchor(anchor){
  if(!anchor || !anchor.hasAttribute('download'))return false;
  const blob=blobs.get(anchor.href);
  if(!blob)return false;
  void save(blob,anchor.download||'capelune-famille');return true;
 }
 // Programmatic downloads may use detached anchors (JSON backups).
 const originalClick=HTMLAnchorElement.prototype.click;
 HTMLAnchorElement.prototype.click=function(){
  if(!handleAnchor(this))return originalClick.call(this);
 };
 document.addEventListener('click',event=>{
  const anchor=event.target.closest?.('a[download]');
  if(handleAnchor(anchor)){event.preventDefault();event.stopImmediatePropagation();}
 },true);
 window.print=()=>window.CapeluneNative.postMessage(JSON.stringify({action:'print'}));
})();
