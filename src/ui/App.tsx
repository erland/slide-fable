import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {applyUpdate,checkForUpdate,initializePwa,pwaStatus} from '../pwa/client';
import {updateSafety} from '../pwa/safety';

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
const titles=['En idé att berätta','Innehållet i centrum','Nästa kapitel'];
const initialTitle='Min första berättelse';

function Slide({index}:{index:number}){
  return <svg viewBox="0 0 1600 900" role="img" aria-label={titles[index]}>
    <rect width="1600" height="900" fill={index===1?'#173944':'#faf8f2'}/>
    {index===0?<><path d="M1100 0h500v900h-500z" fill="#eed7bf"/><path d="M1190 170h250v370h-250z" fill="#cf694c"/><path d="M1130 280h250v370h-250z" fill="#faf8f2"/><text x="105" y="180" fontSize="25" letterSpacing="5" fill="#93634e">SLIDE FABLE</text><text x="100" y="360" fontSize="95" fill="#183641" fontFamily="Georgia,serif">En idé.</text><text x="100" y="485" fontSize="95" fill="#183641" fontFamily="Georgia,serif">En berättelse.</text><text x="108" y="645" fontSize="30" fill="#5d6d71">Ge dina tankar en tydlig form.</text></>:index===1?<><text x="105" y="160" fontSize="25" fill="#a8c9c9" letterSpacing="4">INNEHÅLLET I CENTRUM</text><text x="100" y="340" fontSize="78" fill="#faf8f2" fontFamily="Georgia,serif">Börja med budskapet</text><path d="M105 410h1390" stroke="#6f9298"/><text x="105" y="525" fontSize="35" fill="#e0e9e6">01   Vad vill du säga?</text><text x="105" y="625" fontSize="35" fill="#e0e9e6">02   Vad ska publiken komma ihåg?</text><text x="105" y="725" fontSize="35" fill="#e0e9e6">03   Vad händer sedan?</text></>:<><text x="105" y="160" fontSize="25" fill="#93634e" letterSpacing="4">NÄSTA KAPITEL</text><text x="100" y="355" fontSize="83" fill="#183641" fontFamily="Georgia,serif">Låt idén ta plats</text><path d="M110 500h1300" stroke="#b6c3c1" strokeWidth="3"/>{['Idé','Struktur','Presentation'].map((t,i)=><g key={t}><circle cx={170+i*580} cy="500" r="20" fill="#cf694c"/><text x={110+i*580} y="595" fontSize="34" fill="#183641">{t}</text></g>)}</>}
  </svg>;
}

export function App(){
  const [selected,setSelected]=useState(0);
  const [panel,setPanel]=useState('canvas');
  const [title,setTitle]=useState(initialTitle);
  const [dark,setDark]=useState(false);
  const [online,setOnline]=useState(navigator.onLine);
  const [install,setInstall]=useState<InstallEvent|null>(null);
  const [help,setHelp]=useState(false);
  const [installed,setInstalled]=useState(matchMedia('(display-mode: standalone)').matches);
  const dialog=useRef<HTMLDialogElement>(null);
  const safety=useSyncExternalStore(updateSafety.subscribe,updateSafety.getSnapshot);
  const pwa=useSyncExternalStore(pwaStatus.subscribe,pwaStatus.getSnapshot);
  useEffect(()=>{void initializePwa();const connection=()=>setOnline(navigator.onLine);const available=(event:Event)=>{event.preventDefault();setInstall(event as InstallEvent);};const done=()=>{setInstalled(true);setInstall(null);};window.addEventListener('online',connection);window.addEventListener('offline',connection);window.addEventListener('beforeinstallprompt',available);window.addEventListener('appinstalled',done);return ()=>{window.removeEventListener('online',connection);window.removeEventListener('offline',connection);window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',done);};},[]);
  const showHelp=()=>{setHelp(true);dialog.current?.showModal();};
  const installApp=async()=>{if(!install){showHelp();return;}const end=updateSafety.beginOperation();try{await install.prompt();await install.userChoice;setInstall(null);}finally{end();}};
  const reset=()=>{updateSafety.setDirty(false);setTitle(initialTitle);};
  return <div className={dark?'app dark':'app'} data-build={__BUILD_ID__}>
    <a className="skip" href="#workspace">Hoppa till arbetsytan</a>
    <header className="topbar"><a className="brand" href="#workspace"><img src="./icons/icon.svg" width="35" height="35" alt=""/><span>Slide <strong>Fable</strong></span></a><span className="top-title">{title}</span><div className="top-actions"><button onClick={()=>setDark(!dark)} aria-pressed={dark} aria-label="Mörkt gränssnitt">{dark?'Ljust läge':'Mörkt läge'}</button><button className="primary" disabled={safety.locked||safety.busy||installed} onClick={()=>void installApp()}>{installed?'Installerad':'Installera appen'}</button></div></header>
    <div className="intro"><div><p className="eyebrow">DITT ARBETSUTRYMME</p><h1>Ge din berättelse form.</h1></div><p>Bildöversikt, arbetsyta och dokumentpanel.<br/><span>Gränssnittsprov – filhantering och redigering kommer härnäst.</span></p></div>
    <div className="workspace-bar"><div className="workspace-name"><span className="document-symbol" aria-hidden="true">▤</span><strong>{title}</strong><span className="tag">Exempel</span></div><span className="connection" data-ready={pwa.offlineReady}>{online?'Uppkopplad':'Offline'}{pwa.offlineReady?' · redo för offline':''}</span></div>
    <nav className="compact-tabs" aria-label="Arbetsytans paneler">{[['slides','Bilder'],['canvas','Arbetsyta'],['properties','Dokument']].map(([value,label])=><button key={value} aria-pressed={panel===value} onClick={()=>setPanel(value)}>{label}</button>)}</nav>
    <main className="workspace" data-panel={panel} id="workspace" tabIndex={-1}>
      <aside className="slide-list" aria-label="Bilder"><div className="panel-heading"><h2>Bilder</h2><span>3</span></div><ol>{titles.map((t,i)=><li key={t}><button className={selected===i?'thumbnail selected':'thumbnail'} aria-current={selected===i?'true':undefined} onClick={()=>setSelected(i)}><span className="slide-number">0{i+1}</span><span className="thumb-image"><Slide index={i}/></span><span className="thumb-title">{t}</span></button></li>)}</ol><p className="quiet-note">En försmak av arbetsytan.<br/>Dina egna bilder kommer snart.</p></aside>
      <section className="canvas-pane" aria-label="Arbetsyta"><div className="canvas-toolbar"><span>{titles[selected]}</span><span>16:9</span></div><div className="canvas-surround"><div className="slide-preview"><Slide index={selected}/></div></div><div className="canvas-bottom"><button aria-label="Föregående bild" disabled={selected===0||safety.locked} onClick={()=>setSelected(selected-1)}>←</button><span>Bild {selected+1} av 3</span><button aria-label="Nästa bild" disabled={selected===2||safety.locked} onClick={()=>setSelected(selected+1)}>→</button></div><p className="canvas-caption">Innehållet ligger still. Verktygen anpassas efter din skärm.</p></section>
      <aside className="inspector" aria-label="Dokument"><div className="panel-heading"><h2>Dokument</h2><span>Inställningar</span></div><fieldset disabled={safety.locked||safety.busy}><label htmlFor="title">Arbetsnamn i provet</label><input id="title" value={title} maxLength={60} onChange={event=>{if(updateSafety.setDirty(event.target.value!==initialTitle))setTitle(event.target.value);}}/><p className="field-help">Prova ett namn. Ändringen sparas inte i den här versionen.</p><button className="reset" disabled={!safety.dirty} onClick={reset}>Återställ provet</button></fieldset><dl><div><dt>Bildformat</dt><dd>16:9</dd></div><div><dt>Arbetsläge</dt><dd>Lokalt</dd></div><div><dt>Lagring</dt><dd>Kommer senare</dd></div></dl><div className="next-note"><span className="eyebrow">NÄSTA STEG</span><p>Öppna en presentation<br/>och arbeta med ditt innehåll.</p></div></aside>
    </main>
    <section className="pwa-strip" aria-label="Appstatus"><div role="status">{safety.locked?'Förbereder en säker uppdatering…':pwa.message}{safety.dirty?' · Provet har osparade ändringar.':''}</div><div>{pwa.waiting?<button onClick={()=>void applyUpdate()} disabled={safety.dirty||safety.busy||safety.locked}>Uppdatera nu</button>:<button onClick={()=>void checkForUpdate()} disabled={!online}>Sök uppdatering</button>}<button onClick={showHelp}>Installationshjälp</button></div></section>
    <footer><span>Skapat för idéer som förtjänar att berättas.</span><span>Arbetsyta · version {__BUILD_ID__}</span></footer>
    <dialog ref={dialog} aria-labelledby="install-title" onClose={()=>setHelp(false)}><h2 id="install-title">Slide Fable som app</h2>{help&&<><p>Du kan alltid använda arbetsytan i webbläsaren.</p><p>På iPhone och iPad: öppna Dela-menyn och välj <strong>Lägg till på hemskärmen</strong>. På dator: använd webbläsarens installationsmeny, eller <strong>Lägg till i Dock</strong> i Safari där det finns.</p><p>Öppna appen uppkopplad första gången. När statusen visar redo för offline kan du öppna arbetsytan utan nät.</p><p>Det här är appens grund. Egna presentationer och sparande kommer i senare steg.</p></>}<button className="primary" onClick={()=>dialog.current?.close()}>Stäng</button></dialog>
  </div>;
}
