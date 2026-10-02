let installPrompt=null;
const installPanel=document.getElementById('install-prompt');
const installButton=document.getElementById('install-button');
const installStatus=document.getElementById('install-status');
const isStandalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
if(!window.CapeluneAndroid&&installPanel&&installButton&&!isStandalone){
  installPanel.hidden=false;
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt=event;
    installStatus.textContent='Chrome vous demandera de confirmer l’installation.';
  });
  installButton.addEventListener('click',async()=>{
    if(!installPrompt){
      installStatus.textContent='Chrome ne permet pas de lancer l’installation directement pour le moment. Ouvrez le menu ⋮, puis choisissez « Installer l’application ».';
      return;
    }
    const promptEvent=installPrompt;
    installPrompt=null;
    installButton.disabled=true;
    try{
      await promptEvent.prompt();
      const choice=await promptEvent.userChoice;
      if(choice.outcome==='accepted'){
        installPanel.hidden=true;
      }else{
        installStatus.textContent='Installation non confirmée. Vous pourrez réessayer plus tard.';
        installButton.hidden=true;
      }
    }catch{
      installStatus.textContent='L’invite d’installation n’a pas pu s’ouvrir. Ouvrez le menu ⋮ de Chrome et choisissez « Installer l’application ».';
      installButton.hidden=true;
    }
  });
  window.addEventListener('appinstalled',()=>{
    installPanel.hidden=true;
    installPrompt=null;
  });
}
if(!window.CapeluneAndroid&&'serviceWorker'in navigator&&location.protocol==='https:'){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
