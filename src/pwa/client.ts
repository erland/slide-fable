import {updateSafety} from './safety';
type Status={offlineReady:boolean;waiting:boolean;message:string};
let status:Status={offlineReady:false,waiting:false,message:'Förbereder offline-stöd…'};
const listeners=new Set<()=>void>();
let registration:ServiceWorkerRegistration|undefined;
let releaseTimer:ReturnType<typeof setTimeout>|undefined;
let initialized=false;
const publish=(patch:Partial<Status>)=>{status={...status,...patch};for(const listener of listeners)listener();};
export const pwaStatus={subscribe:(listener:()=>void)=>{listeners.add(listener);return ()=>{listeners.delete(listener);};},getSnapshot:()=>status};

export async function initializePwa(){
  if(initialized)return;initialized=true;
  if(!('serviceWorker' in navigator)||!window.isSecureContext){publish({message:'Offline-stöd kräver HTTPS eller localhost.'});return;}
  const manifest=document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!;
  const workerUrl=new URL('sw.js',manifest.href).href;
  navigator.serviceWorker.addEventListener('message',event=>{
    if((event.source as ServiceWorker|null)?.scriptURL!==workerUrl){event.ports[0]?.postMessage({safe:true});return;}
    if(event.data?.type==='PREPARE_UPDATE'){
      const safe=updateSafety.prepare();
      if(safe){clearTimeout(releaseTimer);releaseTimer=setTimeout(()=>updateSafety.release(),5000);}
      event.ports[0]?.postMessage({safe});
    }
    if(event.data?.type==='ROLLBACK_UPDATE'){clearTimeout(releaseTimer);updateSafety.release();}
  });
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    const state=updateSafety.getSnapshot();
    // No reload for a new/unresponsive tab that did not participate in the lock.
    if(state.locked&&!state.dirty&&!state.busy)window.location.reload();
  });
  window.addEventListener('beforeunload',event=>{const s=updateSafety.getSnapshot();if(s.dirty||s.busy){event.preventDefault();event.returnValue='';}});
  try{
    registration=await navigator.serviceWorker.register(workerUrl,{updateViaCache:'none'});
    const inspect=()=>{const waiting=Boolean(registration?.waiting&&registration?.active);publish({waiting,...(waiting?{message:'En ny version är redo.'}:{})});};
    const watch=()=>{const worker=registration?.installing;worker?.addEventListener('statechange',()=>{inspect();if(worker.state==='redundant'&&!registration?.active)publish({message:'Offline-förberedelsen misslyckades. Prova igen när du är uppkopplad.'});});};
    inspect();watch();registration.addEventListener('updatefound',watch);
    if(registration.active?.state!=='activated')await new Promise<void>(resolve=>{const worker=registration?.installing??registration?.waiting??registration?.active;if(!worker||worker.state==='activated'){resolve();return;}worker.addEventListener('statechange',()=>{if(worker.state==='activated')resolve();});});
    publish({offlineReady:true,message:status.waiting?'En ny version är redo.':'Appen är redo att öppnas offline.'});
  }catch{publish({message:'Offline-förberedelsen misslyckades. Prova att ladda om när du är uppkopplad.'});}
}
export async function checkForUpdate(){
  if(!registration){publish({message:'Offline-stödet förbereds fortfarande.'});return;}
  try{await registration?.update();if(registration?.waiting)publish({waiting:true,message:'En ny version är redo.'});else publish({message:'Ingen ny version hittades.'});}catch{publish({message:'Det gick inte att söka efter uppdateringar just nu.'});}
}
export async function applyUpdate(){
  if(!registration?.waiting)return;
  const state=updateSafety.getSnapshot();
  if(state.dirty||state.busy){publish({message:'Avsluta pågående arbete före uppdatering.'});return;}
  const channel=new MessageChannel();
  const result=new Promise<boolean>(resolve=>{
    const timer=setTimeout(()=>{channel.port1.close();updateSafety.release();resolve(false);},4000);
    channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data?.activated===true);};
  });
  registration.waiting.postMessage({type:'TRY_ACTIVATE'},[channel.port2]);
  if(!await result)publish({message:'Uppdateringen väntar. Avsluta arbetet i alla öppna flikar och försök igen.'});
}
