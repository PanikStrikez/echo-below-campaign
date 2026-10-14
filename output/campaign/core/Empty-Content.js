/* Empty content contracts for reusable tools. No private campaign catalogs. */
(() => {
 globalThis.ECHO_TABLE_CONTENT={SCENES:{black:{title:'Black screen',kind:'black'}},RUNBOOK:[],RUNBOOK_IDS:new Set(),SCENE_NOTES:{},ENCOUNTERS:[],STATS:{hero:'Use the editable character sheet',custom:'Use the editable combat card'},INIT_BONUSES:{},defaultTokens:()=>[],session2EnemyTokens:()=>[],session3EnemyTokens:()=>[]};
 globalThis.ECHO_RULES_DATA={books:{},characterOptions:[],references:[],creatures:[],spells:[],items:[],features:[]};
 globalThis.ECHO_RULES_INDEX={books:{},catalog:[]};
 globalThis.ECHO_QUEST_CATALOG={acts:[{id:'custom',title:'Your campaign'}],quests:[]};
 globalThis.ECHO_QUEST_PREP_DATA={records:{},groups:{},names:{}};
 globalThis.ECHO_ATLAS_DATA={schemaVersion:1,id:'custom-atlas',rootBoardId:'',title:'Your atlas',boards:[],locations:[],travelRoutes:[],proposals:[]};
 globalThis.ECHO_DOWNTIME_DATA={version:1,opportunities:[],plans:[],categories:['commissions','shopping','research','training','employment','repairs','relationships'].map(id=>({id,label:id})),boundaries:[],rulesReferences:[],sourceNotes:[]};
 globalThis.ECHO_CONTENT_PACKS=[];
})();
