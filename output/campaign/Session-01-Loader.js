(() => {
  'use strict';
  const player = location.hash === '#player';
  const load = file => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = file;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${file}`));
    document.head.appendChild(script);
  });
  (async () => {
    if (!player) { await load('Campaign-Module-Manifest.js'); await load('Campaign-Templates.js'); }
    await load('Session-01-Map-Data.js');
    await load('Session-01-Travel-View.js');
    await load('Campaign-Atlas-View.js');
    await load('Session-01-Dungeon-View.js');
    await load('Session-01-Atmosphere-View.js');
    await load('Session-01-TV-Text.js');
    await load('Voice-Subtitles.js');
    await load('LMOP-Visual-Catalog.js');
    await load('LMOP-Battle-Map-Catalog.js');
    const classic = (() => { try { return localStorage.getItem('echo-ui-classic') === 'true'; } catch { return false; } })();
    if (!player) for (const file of ECHO_MODULES.ordered)
      await load(classic && file === 'Session-01-Cockpit.js' ? 'Session-01-Cockpit-Classic.js' : file);
    await load('Session-01-Presentation.js');
    await load('Session-01-Table-Tools.js');
    if (!player) await load('Campaign-Engine-UI.js');
    await load('Session-01-Battleboard.js');
  })().catch(error => {
    const message = document.createElement('p');
    message.className = 'load-error';
    message.textContent = `The campaign table could not start: ${error.message}. Keep these files together and reload.`;
    document.body.prepend(message);
  });
})();
