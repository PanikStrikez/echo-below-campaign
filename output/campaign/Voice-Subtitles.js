/* TV receives only explicitly approved display text, never scripts/takes/profile libraries. */
(() => {
 function render(value){let box=document.getElementById('voice-subtitles');if(!box){box=document.createElement('section');box.id='voice-subtitles';box.setAttribute('aria-live','polite');const title=document.createElement('strong'),text=document.createElement('div');box.append(title,text);document.getElementById('player-app')?.append(box);}const ok=value&&['playing','paused','subtitles'].includes(value.status);box.hidden=!ok;if(!ok){box.replaceChildren(document.createElement('strong'),document.createElement('div'));return;}const title=String(value.title||'').slice(0,120)+(value.status==='paused'?' · paused':'');if(box.firstChild.textContent!==title)box.firstChild.textContent=title;const text=String(value.text||'').slice(0,5000);if(box.lastChild.textContent!==text)box.lastChild.textContent=text;}
 globalThis.ECHO_VOICE_SUBTITLES={render};
})();
