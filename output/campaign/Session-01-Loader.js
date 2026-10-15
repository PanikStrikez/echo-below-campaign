(() => {
  'use strict';
  const player = location.hash === '#player';
  const preload = files => {
    const supported = document.createElement('link').relList?.supports?.('preload');
    if (!supported) return;
    for (const file of new Set(files)) { const link=document.createElement('link');link.rel='preload';link.as='script';link.href=file;document.head.appendChild(link); }
  };
  const classic = (() => { try { return localStorage.getItem('echo-ui-classic') === 'true'; } catch { return false; } })();
  const loaded=new Set();
  const load = file => loaded.has(file)?Promise.resolve():new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = file;
    script.onload = () => {loaded.add(file);resolve();};
    script.onerror = () => reject(new Error(`Could not load ${file}`));
    document.head.appendChild(script);
  });
  (async () => {
    if(!player){await load('Campaign-Module-Manifest.js');await load('Session-01-Storage.js');await load('Campaign-Boundary.js');}
    const boundary=player?{echo:false,installedPacks:[]}:await ECHO_BOUNDARY.inspect();
    globalThis.ECHO_BOOT=boundary;
    const selected=player?[]:ECHO_MODULES.select(boundary);
    document.body.dataset.contentProfile=boundary.echo?'echo-below':'blank';
    if(!player){preload(['Campaign-Templates.js',...selected.filter(f=>!classic||f!=='Session-01-Hybrid-UI.js').map(f=>classic&&f==='Session-01-Cockpit.js'?'Session-01-Cockpit-Classic.js':f),boundary.echo?'Campaign-Engine-UI.js':'core/Empty-Content.js',boundary.echo?'Echo-Below-Table-Content.js':'core/Empty-Content.js',boundary.echo?'Session-01-Presentation.js':'core/Presentation.js','Session-01-Table-Tools.js','Session-01-Battleboard.js']);await load('Campaign-Templates.js');if(boundary.installedPacks.some(p=>p.id==='lantern-ferry'))await load('packs/lantern-ferry/Template.js');}
    if(!boundary.echo&&!player)await load('core/Empty-Content.js');
    await load('Session-01-Map-Data.js');
    await load('Session-01-Travel-View.js');
    await load('Campaign-Atlas-View.js');
    await load('Session-01-Dungeon-View.js');
    await load('Session-01-Atmosphere-View.js');
    await load('Session-01-TV-Text.js');
    await load('Voice-Subtitles.js');
    if(boundary.echo){await load('LMOP-Visual-Catalog.js');await load('LMOP-Battle-Map-Catalog.js');}
    if (!player) for (const file of selected) {
      if (classic && file === 'Session-01-Hybrid-UI.js') continue;
      await load(classic && file === 'Session-01-Cockpit.js' ? 'Session-01-Cockpit-Classic.js' : file);
    }
    if(!player && boundary.installedPacks.some(p=>p.id==='lantern-ferry'))await load('packs/lantern-ferry/Content.js');
    await load(boundary.echo?'Session-01-Presentation.js':'core/Presentation.js');
    await load('Session-01-Table-Tools.js');
    if (!player && boundary.echo) await load('Campaign-Engine-UI.js');
    if (!player && boundary.echo) await load('Echo-Below-Table-Content.js');
    await load('Session-01-Battleboard.js');
  })().catch(error => {
    const message = document.createElement('p');
    message.className = 'load-error';
    message.textContent = `The campaign table could not start: ${error.message}. Keep these files together and reload.`;
    document.body.prepend(message);
  });
})();
