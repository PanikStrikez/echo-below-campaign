(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const BASE = 'http://127.0.0.1:48262';
  let host, enabled = false, serverStatus = '', joinUrl = '', claims = [], roster = [], qrUrl = '', qrObject = '',
    syncTimer = 0, polling = false, syncing = false;
  const rollResults = {};

  async function request(path, value) {
    let response;
    try {
      response = await fetch(`${BASE}${path}`, value === undefined ? { cache: 'no-store' } :
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    } catch { throw new Error('Phone service is unavailable. Open The Echo Below from its desktop app.'); }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Phone connection failed.');
    return data;
  }

  function render() {
    const drawer = $('phones-drawer'), badge = $('phone-request-count');
    if (!drawer) return;
    $('phones-status').textContent = serverStatus || (enabled ? 'Phone access is on.' : 'Phone access is off.');
    $('phones-start').hidden = enabled;
    $('phones-reset').hidden = !enabled;
    $('phones-stop').hidden = !enabled;
    $('phones-join').hidden = !enabled || !joinUrl;
    $('phones-url').textContent = joinUrl || 'No Wi-Fi address detected. Connect this computer to the table Wi-Fi.';
    $('phones-url').href = joinUrl || '#';
    const list = $('phones-claims'); list.replaceChildren();
    if (!claims.length) list.textContent = 'No phones joined yet.';
    else for (const claim of claims) {
      const row = document.createElement('div'); row.className='phone-health-row';
      const age=claim.lastSeen?Math.max(0,Math.round(Date.now()/1000-claim.lastSeen))+'s ago':'never';
      const label=document.createElement('p');label.textContent=`${claim.name} · ${claim.status||'unverified'} · last seen ${age} · update ${claim.acknowledged??'?'}/${claim.revision??'?'}`;row.append(label);
      const button=(text,operation,target)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=async()=>{b.disabled=true;try{await request('/api/dm/phone',{id:claim.id,operation,target:typeof target==='function'?target():target});await status();}catch(e){host.toast(e.message);b.disabled=false;}};row.append(b);};
      button('Resync this phone','resync');button('Release to rejoin','release');
      const select=document.createElement('select');for(const p of roster.filter(p=>!claims.some(c=>c.id===p.id))){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;select.append(o);}if(select.options.length){select.setAttribute('aria-label','New character for '+claim.name);row.append(select);button('Reassign phone','reassign',()=>select.value);}list.append(row);
    }
    const stale=claims.filter(c=>c.status!=='current').length;const warning=$('phone-health-warning');if(warning){warning.hidden=!enabled||!stale;warning.textContent=stale+' phone'+(stale===1?'':'s')+' stale / offline — Connect phones to review';}
    const count = host?.requestCount() || 0;
    badge.hidden = !count; badge.textContent = String(count);
  }

  async function loadQR() {
    if (!joinUrl || qrUrl === joinUrl) return;
    try {
      const response = await fetch(`${BASE}/api/dm/qr`, { cache: 'no-store' });
      if (!response.ok) throw new Error('QR code unavailable. Use the join link.');
      const url = URL.createObjectURL(await response.blob());
      if (qrObject) URL.revokeObjectURL(qrObject);
      qrObject = url; qrUrl = joinUrl; $('phones-qr').src = url;
    } catch (error) { serverStatus = error.message; render(); }
  }

  async function status() {
    try {
      const data = await request('/api/dm/status');
      enabled = data.active === true; joinUrl = data.url || ''; claims = data.claims || []; roster=data.roster||[];
      serverStatus = enabled ? `${claims.filter(c=>c.status==='current').length}/${claims.length} phones up to date. Keep this DM screen open.` : 'Phone access is off.';
      render();
      if (enabled) { await loadQR(); sync(); }
      return { service: true, enabled, connected: claims.filter(c=>c.status==='current').length, stale:claims.filter(c=>c.status!=='current').length, claims, url: joinUrl };
    } catch (error) { enabled = false; serverStatus = error.message; render(); return { service: false, enabled: false, connected: 0, error: error.message }; }
  }

  async function pushSnapshot() {
    if (!enabled || !host || syncing) return;
    syncing = true;
    try {
      await request('/api/dm/state', { snapshot: { ...host.snapshot(), rollResults } });
      serverStatus = `${claims.filter(c=>c.status==='current').length}/${claims.length} phones up to date. Keep this DM screen open.`;
    } catch (error) {
      serverStatus = error.message;
      if (/closed/i.test(error.message)) enabled = false;
    }
    finally { syncing = false; render(); }
  }

  function sync() {
    if (!enabled) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => { void pushSnapshot(); }, 180);
  }

  async function poll() {
    if (!enabled || polling) return;
    polling = true;
    try {
      const result = await request('/api/dm/events');
      if (result.events?.length) {
        let last = 0;
        for (const event of result.events) {
          await host.onAction(event);
          last = event.sequence;
        }
        await request('/api/dm/ack', { sequence: last });
      }
    } catch (error) { serverStatus = error.message; render(); }
    finally { polling = false; }
  }

  async function start() {
    try {
      const data = await request('/api/dm/open', {});
      enabled = true; joinUrl = data.url || ''; serverStatus = joinUrl ? 'Phone access is on.' : 'Connect this computer to the table Wi-Fi, then refresh.';
      await pushSnapshot(); await status();
    } catch (error) { serverStatus = error.message; render(); }
  }

  async function reset() {
    try {
      const data = await request('/api/dm/reset', {});
      joinUrl = data.url || ''; claims = []; qrUrl = ''; serverStatus = 'New code ready. Previous phone joins were removed.';
      await pushSnapshot(); await status();
    } catch (error) { serverStatus = error.message; render(); }
  }

  async function stop() {
    try { await request('/api/dm/close', {}); enabled = false; claims = []; joinUrl = ''; serverStatus = 'Phone access stopped.'; }
    catch (error) { serverStatus = error.message; }
    render();
  }

  async function disconnectForCampaignSwitch() {
    const was=enabled;enabled=false;clearTimeout(syncTimer);
    try { const until=Date.now()+10000;while(polling||syncing){if(Date.now()>until)throw Error('Phone update is still running; try switching again.');await new Promise(r=>setTimeout(r,40));}
      await request('/api/dm/close', {});claims=[];joinUrl='';serverStatus='Campaign changed. Start phone access and scan the new QR code.';render();
    }catch(error){if(!was&&/unavailable/.test(error.message))return;enabled=was;throw error;}
  }
  function open() { $('phones-drawer').hidden = false; $('phones-scrim').hidden = false; render(); void status(); }
  function closeDrawer() { $('phones-drawer').hidden = true; $('phones-scrim').hidden = true; }
  function setRollResult(characterId, entry) {
    rollResults[characterId] = { id: entry.id, label: entry.label, notation: entry.notation,
      parts: entry.parts, total: entry.total };
  }
  function refresh() { render(); }
  function init(context) {
    host = context;
    $('open-phones').addEventListener('click', open);
    $('close-phones').addEventListener('click', closeDrawer);
    $('phones-scrim').addEventListener('click', closeDrawer);
    $('phones-start').addEventListener('click', () => { void start(); });
    $('phones-reset').addEventListener('click', () => { void reset(); });
    $('phones-stop').addEventListener('click', () => { void stop(); });
    window.addEventListener('beforeunload', () => { if (qrObject) URL.revokeObjectURL(qrObject); });
    setInterval(() => { if (enabled) void poll(); }, 650);
    setInterval(() => { if (enabled) void pushSnapshot(); }, 3500);
    setInterval(() => { if (enabled || !$('phones-drawer').hidden) void status(); }, 6000);
    void status();
  }
  globalThis.ECHO_PHONE = { init, sync, open, refresh, setRollResult, checkStatus: status, start, disconnectForCampaignSwitch };
})();
