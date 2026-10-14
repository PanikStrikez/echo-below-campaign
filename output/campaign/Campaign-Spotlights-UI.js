(() => {
  'use strict';
  let chosen='pc-trista',stage='redbrand',notes='',minutes='',noteKey='',history=false;
  const API=()=>globalThis.ECHO_SPOTLIGHTS;
  function selectCharacter(id){chosen=id;noteKey='';}
  function render(root,host){
    const d=host.spotlights(),session=host.sessionId(),roster=host.roster(),catalog=globalThis.ECHO_CHARACTER_STORIES;
    const arcs=catalog.arcs.filter(a=>roster.some(p=>p.id===a.id));
    const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;parent.append(n);return n;};
    const button=(p,label,fn)=>{const b=el('button',label,p);b.type='button';b.addEventListener('click',fn);return b;};
    const section=(title,note='')=>{const s=el('section',null,root,'story-section');el('h3',title,s);if(note)el('p',note,s,'help');return s;};
    const refresh=()=>globalThis.ECHO_STORY_UI.render();
    const save=label=>{host.save(label);refresh();};
    const mutate=(fn,label)=>{API().checkpoint(d);fn();save(label||'Updated character story');};
    const input=(p,label,value,change,multi=false)=>{const l=el('label',label,p,'story-field'),i=el(multi?'textarea':'input',null,l);i.value=value??'';i.maxLength=3000;if(multi)i.rows=3;else i.type='text';i.addEventListener('change',()=>change(i.value));return i;};
    const select=(p,label,value,options,change)=>{const l=el('label',label,p,'story-field'),i=el('select',null,l);for(const [id,title]of options){const o=el('option',title,i);o.value=id;}i.value=value;i.addEventListener('change',()=>change(i.value));return i;};
    const check=(p,label,value,change)=>{const l=el('label',null,p,'story-field'),i=el('input',null,l);i.type='checkbox';i.checked=value;el('span',label,l);i.addEventListener('change',()=>change(i.checked));};
    let s=section('Character stories & spotlight tracker','Private DM preparation. New scenes are plans. Counts begin with what you record; past sessions have not been scored. Offer invitations, let players pass, and use the suggestions as guidance.');
    if(!arcs.length){el('p','No matching characters from these five arcs are in this campaign’s current party.',s);return;}
    if(!arcs.some(a=>a.id===chosen))chosen=arcs[0].id;
    const nav=el('div',null,s,'button-row');
    button(nav,'Story cards',()=>{history=false;refresh();}).disabled=!history;
    button(nav,'Recorded moments',()=>{history=true;refresh();}).disabled=history;
    button(nav,'Undo spotlight change',()=>{if(API().restore(d))save('Undo spotlight change');}).disabled=!d.undo.length;
    button(nav,'Redo spotlight change',()=>{if(API().restore(d,true))save('Redo spotlight change');}).disabled=!d.redo.length;
    s=section(`Spotlight balance · ${host.sessionName()}`,'A played moment needs an actual outcome. Offered, deferred, and declined hooks do not count as played. Minutes are optional notes, not a competition.');
    const table=el('table',null,s,'spotlight-balance'),head=el('tr',null,el('thead',null,table));for(const name of ['Character','Played / offered','Last played','This session'])el('th',name,head);
    const body=el('tbody',null,table);
    for(const p of API().summary(d,session,roster)){
      const tr=el('tr',null,body),name=el('td',null,tr);button(name,p.name,()=>{selectCharacter(p.id);history=false;refresh();});
      el('td',`${p.played} / ${p.offered}${p.paused?' · paused':''}`,tr);el('td',p.last,tr);
      check(el('td',null,tr),'Present',p.present,v=>mutate(()=>{d.attendance[session]=(d.attendance[session]||[]).filter(id=>id!==p.id);if(!v)d.attendance[session].push(p.id);},'Updated spotlight attendance'));
    }
    if(history){
      s=section('Recorded moments','These are DM notes. Creating a continuity draft does not publish or approve it. Undoing a tracker change does not delete a separately reviewed continuity event.');
      for(const row of d.log.slice().reverse()){
        const box=el('article',null,s,'story-card');el('h4',`${row.sessionName} · ${arcs.find(a=>a.id===row.characterId)?.name||row.characterId} · ${row.status}`,box);el('p',row.title,box);el('p',row.note||'No outcome recorded.',box);if(row.minutes)el('small',`${row.minutes} minutes`,box);
        if(row.status==='played')button(box,'Create private continuity draft',()=>{
          const c=host.continuity(),draft=API().continuityDraft(row);
          if(c.events.some(e=>e.id===draft.id)){host.toast('This moment already has a continuity draft. Review it in Campaign continuity.');return;}
          globalThis.ECHO_CONTINUITY.checkpoint(c);c.events.push(draft);row.continuityId=draft.id;save('Created private spotlight continuity draft');host.toast('Private, unapproved draft created. Review the facts and who knows them before approval.');
        });
        button(box,'Correct outcome note',()=>{const changed=prompt('What actually happened?',row.note);if(changed===null)return;if(row.status==='played'&&!changed.trim()){host.toast('Played moments need an outcome. Remove the record to undo a mistaken mark.');return;}mutate(()=>row.note=changed.slice(0,2500),'Corrected spotlight note');if(row.continuityId)host.toast('The linked continuity record is separate; review it if this correction changes the facts.');});
        button(box,'Remove this tracker record',()=>{if(confirm('Remove this spotlight record? Spotlight Undo can restore it. Any separate continuity draft remains.'))mutate(()=>d.log=d.log.filter(l=>l.id!==row.id),'Removed spotlight record');});
      }
      if(!d.log.length)el('p','No moments recorded yet.',s);
      button(s,'Open campaign continuity',()=>globalThis.ECHO_STORY_UI.open('continuity'));
      return;
    }
    s=section('Choose a prepared moment');
    select(s,'Campaign chapter',stage,catalog.stages,v=>{stage=v;noteKey='';refresh();});
    const suggestions=API().suggest(d,session,stage,roster);
    if(suggestions.length){el('p',`Consider next: ${suggestions.slice(0,2).map(p=>p.name).join(' or ')}. Based on recorded opportunities, attendance, and paused arcs.`,s,'story-note');button(s,`Open ${suggestions[0].name}’s suggestion`,()=>{selectCharacter(suggestions[0].id);refresh();});}
    else el('p','No fresh suggestion in this chapter. You can revisit a card, choose another chapter, or record an improvised moment.',s,'help');
    select(s,'Character',chosen,arcs.map(a=>[a.id,a.name]),v=>{selectCharacter(v);refresh();});
    const a=arcs.find(a=>a.id===chosen),pref=API().profile(d,chosen),b=API().beat(d,a.beats.find(b=>b.stage===stage).id);
    if(pref.interests)el('p',`Player interests: ${pref.interests}`,s,'story-note');
    if(pref.avoid)el('p',`Handle with care / avoid: ${pref.avoid}`,s,'story-note');
    if(pref.paused)el('p','This personal arc is paused. Its cards remain available for reference.',s,'help');
    const info=el('details',null,s);el('summary','Character direction and player preferences',info);
    el('p',a.question,info);el('p',`Established: ${a.established}`,info);el('p',a.boundary,info);
    input(info,'Interests to emphasize',pref.interests||a.interests.join(', '),v=>mutate(()=>pref.interests=v.slice(0,800),'Updated player interests'),true);
    input(info,'Themes to avoid / handle privately',pref.avoid,v=>mutate(()=>pref.avoid=v.slice(0,800),'Updated story boundaries'),true);
    input(info,'Direction / follow-up notes',pref.notes,v=>mutate(()=>pref.notes=v.slice(0,2000),'Updated character direction'),true);
    check(info,'Pause personal story suggestions',pref.paused,v=>mutate(()=>pref.paused=v,'Updated arc pause'));
    s=section(b.title,`${catalog.stages.find(x=>x[0]===stage)[1]} · suggested ${b.minutes} minutes · ${b.source}`);
    for(const [label,value]of [['Trigger',b.trigger],['Optional words to say',b.say],['Private preparation',b.dm],['Evidence to check',b.evidence],['Follow-through',b.followup],['If declined or missed',b.fallback]]){el('h4',label,s);if(label==='Optional words to say'){const quote=el('blockquote',null,s);String(value||'').split(/\n\s*\n/).forEach(t=>el('p',t,quote));}else el('p',value,s);}
    el('h4','Choices and possible consequences',s);const choices=el('ul',null,s);for(const v of b.choices)el('li',v,choices);
    if(chosen==='pc-aldric'){
      const truth=el('details',null,s);el('summary','DM only · Aldric’s connection to Halaster',truth);el('p',catalog.halaster.status,truth);
      for(const k of ['premise','limits','timeline'])el('p',catalog.halaster[k],truth);for(const e of catalog.halaster.evidence)el('p',e,truth);
    }
    const edit=el('details',null,s);el('summary','Adapt this card for our campaign',edit);
    for(const key of API().editable)input(edit,({dm:'Private preparation',say:'Words to say',choices:'Choices (one per line)'})[key]||key,key==='choices'?b.choices.join('\n'):b[key],v=>mutate(()=>{d.overrides[b.id]||={};d.overrides[b.id][key]=key==='choices'?v.split('\n').filter(Boolean).slice(0,8):v.slice(0,key==='title'?140:3000);},'Edited prepared character card'),key!=='title');
    button(edit,'Restore the prepared card',()=>{if(confirm('Discard your overrides for this card? Spotlight Undo can restore them.'))mutate(()=>delete d.overrides[b.id],'Restored prepared card');}).disabled=!d.overrides[b.id];
    s=section('Record what happened','Nothing here sends text to players or changes their sheets. Use actual outcomes, not the prepared possibilities above.');
    const row=API().current(d,session,chosen,b.id),key=`${session}|${b.id}`;
    if(noteKey!==key){noteKey=key;notes=row?.note||'';minutes=row?.minutes||'';}
    el('p',row?`This session: ${row.status}`:'This session: not recorded',s,'story-note');
    const ni=input(s,'Actual outcome / player response',notes,v=>notes=v.slice(0,2500),true);ni.maxLength=2500;ni.addEventListener('input',()=>notes=ni.value.slice(0,2500));
    const mi=input(s,'Minutes (optional)',minutes,v=>minutes=v);mi.type='number';mi.min=0;mi.max=180;mi.addEventListener('input',()=>minutes=mi.value);
    for(const status of API().statuses)button(s,`Mark ${status}`,()=>{
      if(status==='played'&&!notes.trim()){host.toast('Write what actually happened before marking this played.');return;}
      try{mutate(()=>API().record(d,{characterId:chosen,beatId:b.id,title:b.title,sessionId:session,sessionName:host.sessionName(),status,note:notes,minutes}),'Recorded character spotlight');}catch(e){host.toast(e.message);}
    }).disabled=row?.status==='played'&&status!=='played';
    button(s,'Record an improvised played moment',()=>{
      const title=prompt('Name the improvised moment:');if(!title?.trim())return;
      const note=prompt('What did the player actually do or decide?');if(!note?.trim())return;
      mutate(()=>API().record(d,{characterId:chosen,beatId:`improv-${Date.now()}`,title:title.trim(),sessionId:session,sessionName:host.sessionName(),status:'played',note,minutes:0}),'Recorded improvised spotlight');
    });
  }
  globalThis.ECHO_SPOTLIGHTS_UI={render,selectCharacter};
})();
