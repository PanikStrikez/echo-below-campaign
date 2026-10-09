/* Campaign content belongs in profiles; this factory contains no Echo Below story data. */
(() => {
 'use strict';
 function blank(name='Blank campaign') {
  return {format:'echo-below-campaign-v2',schemaVersion:2,campaign:{name},active:'session-01',
   sessions:[{id:'session-01',name:'Session 1',packId:'',state:{schemaVersion:2,contentProfile:'blank',preservePartyProgression:true,sessionKind:'custom',scene:'black',runbook:'all',scenes:[{id:'black',title:'Black screen',kind:'black',image:'',fog:false,grid:false}],encounters:[],runbookBeats:[],tokens:[],party:{},partyMeta:{marchingOrder:'',lightSources:'',travelPace:'normal',notes:''},grid:false,fog:[],sceneFog:{},assets:{},map:{scenes:{}},leaderTempHp:0}}],
   rules:{profile:'2014',exceptionCatalogVersion:4,exceptions:[],characterOptions:{},favorites:[],bookmarks:[]},combatLibrary:[],
   story:{contentProfile:'blank',npcs:[],sites:[],floors:[],routes:[],evidence:[],journal:[],wrapUps:[],waterdeep:{places:[],factions:[],leads:[],downtime:[],returns:[]},continuity:{seedVersion:1,events:[],quests:[],questGuide:{contentProfile:'blank',enabled:true,initialized:true,routingVersion:1,currentAct:'custom',customQuests:[],records:{}}}},
   presentation:{contentProfile:'blank',media:[],presets:[],handouts:[],cards:[],presetCatalogVersion:7,cueCatalogVersion:2,cuesByBeat:{}},ergonomics:{mode:'prep'},
   tableExtras:{settlements:{towns:[]},travel:{contentProfile:'blank',places:[],routes:[],position:{x:50,y:50,placeId:'',visible:false}}},mediaFiles:[]};
 }
 function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(blank(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Blank-Campaign-Template.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 globalThis.ECHO_TEMPLATES={blank,download};
})();
