/* Campaign content belongs in profiles; this factory contains no Echo Below story data. */
(() => {
 'use strict';
 function blank(name='Blank campaign') {
  return {format:'echo-below-campaign-v2',schemaVersion:3,installedPacks:[],campaign:{name:String(name).trim().slice(0,80)||'Blank campaign'},active:'session-01',
   sessions:[{id:'session-01',name:'Session 1',packId:'',state:{schemaVersion:3,contentProfile:'blank',preservePartyProgression:true,sessionKind:'custom',scene:'black',runbook:'all',scenes:[{id:'black',title:'Black screen',kind:'black',image:'',fog:false,grid:false}],encounters:[],runbookBeats:[],tokens:[],party:{},partyMeta:{marchingOrder:'',lightSources:'',travelPace:'normal',notes:''},grid:false,fog:[],sceneFog:{},assets:{},map:{scenes:{}},leaderTempHp:0}}],
   rules:{profile:'2014',exceptionCatalogVersion:4,exceptions:[],characterOptions:{},favorites:[],bookmarks:[]},combatLibrary:[],
   story:{contentProfile:'blank',npcs:[],sites:[],floors:[],routes:[],evidence:[],journal:[],wrapUps:[],waterdeep:{places:[],factions:[],leads:[],downtime:[],returns:[]},continuity:{seedVersion:1,events:[],quests:[],questGuide:{contentProfile:'blank',enabled:true,initialized:true,routingVersion:1,currentAct:'custom',customQuests:[],records:{}}}},
   presentation:{contentProfile:'blank',media:[],presets:[],handouts:[],cards:[],presetCatalogVersion:7,cueCatalogVersion:2,cuesByBeat:{}},ergonomics:{mode:'prep'},
   tableExtras:{settlements:{towns:[]},travel:{contentProfile:'blank',places:[],routes:[],position:{x:50,y:50,placeId:'',visible:false}}},mediaFiles:{}};
 }
 async function loadExample(){
  if(globalThis.ECHO_EXAMPLE_FACTORY)return;
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='packs/lantern-ferry/Template.js';script.onload=resolve;script.onerror=()=>reject(Error('The fictional example pack is missing. Keep the campaign files together.'));document.head.append(script);});
 }
 function example(...args){if(!globalThis.ECHO_EXAMPLE_FACTORY)throw Error('Load the fictional example pack first.');return ECHO_EXAMPLE_FACTORY(...args);}
 function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(blank(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Blank-Campaign-Template.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function chooseCopy(sourceName){return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='campaign-copy-dialog';
  const title=document.createElement('h2');title.textContent='Start a separate campaign';dialog.append(title);
  const label=document.createElement('label');label.textContent='Campaign name';const name=document.createElement('input');name.setAttribute('aria-label','Campaign name');name.maxLength=80;name.value='New group';label.append(name);dialog.append(label);
  const choices=document.createElement('label');choices.textContent='Starting point';const mode=document.createElement('select');mode.setAttribute('aria-label','Campaign starting point');for(const [value,text]of [['blank','New group · blank table'],['example','Fictional example · Lantern Ferry'],['copy','Private continuation · exact copy'],['practice','Rehearsal · practice copy']]){const o=document.createElement('option');o.value=value;o.textContent=text;mode.append(o);}choices.append(mode);dialog.append(choices);
  const summary=document.createElement('p');summary.setAttribute('role','status');dialog.append(summary);
  const update=()=>{summary.textContent=['blank','example'].includes(mode.value)?(mode.value==='example'?'Starts with two fictional characters, a ferry scene and three audience-routed quests. No Echo Below records.':'Starts with an empty party, history, quests and media library. Add your new group’s characters and prepared content.'):`Copies all of “${sourceName}”, including character records, discoveries, private clues and uploaded media. Phone assignments are released when you open the copy.`;name.value=mode.value==='example'?'Lantern Ferry · example':mode.value==='blank'?'New group':mode.value==='practice'?`PRACTICE · ${sourceName}`:`${sourceName} copy`;};mode.onchange=update;update();
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';cancel.onclick=()=>dialog.close();const submit=document.createElement('button');submit.type='button';submit.textContent='Create separate campaign';submit.className='primary';submit.onclick=()=>{if(!name.value.trim()){name.focus();return;}dialog.returnValue=JSON.stringify({mode:mode.value,name:name.value.trim().slice(0,80)});dialog.close();};dialog.append(cancel,submit);
  dialog.onclose=()=>{let answer=null;try{answer=JSON.parse(dialog.returnValue);}catch{}dialog.remove();resolve(answer);};document.body.append(dialog);dialog.showModal();
 });}
 globalThis.ECHO_TEMPLATES={blank,example,loadExample,download,chooseCopy};
})();
