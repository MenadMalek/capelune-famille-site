let installPrompt=null;
const installPanel=document.getElementById('install-prompt');
const installButton=document.getElementById('install-button');
const installStatus=document.getElementById('install-status');
const isStandalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const installHelp=()=>{
  if(isIOS)return 'Sur iPhone ou iPad : ouvrez cette page dans Safari, touchez Partager, puis « Sur l’écran d’accueil » pour installer l’icône.';
  if(/Android/i.test(navigator.userAgent))return 'Ouvrez le menu ⋮ de Chrome, puis touchez « Installer l’application ».';
  return 'Ouvrez le menu de votre navigateur et choisissez « Installer l’application ».';
};
if(!window.CapeluneAndroid&&installPanel&&installButton&&!isStandalone){
  installPanel.hidden=false;
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt=event;
    installStatus.textContent='Chrome vous demandera de confirmer l’installation.';
  });
  installButton.addEventListener('click',async()=>{
    if(!installPrompt){
      installStatus.textContent=installHelp();
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
      installStatus.textContent='L’invite d’installation n’a pas pu s’ouvrir. '+installHelp();
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
