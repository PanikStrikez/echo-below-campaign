/* DM resource links only; no quest is activated or completed by loading these. */
(() => {
 'use strict';const D=globalThis.ECHO_COURTYARD_DATA,P=globalThis.ECHO_QUEST_PREP_DATA;
 for(const n of D.cast)P.names[n.id]=n.name;
 for(const id of ['courtyard','act-home']){const p=P.records[id];p.beats=[...new Set([...p.beats,...D.beats.filter(b=>id==='courtyard'||b.questIds?.includes(id)).map(b=>b.id)])];p.scenes=[...new Set([...p.scenes,...D.staging.scenes])];p.npcs=[...new Set([...p.npcs,...D.cast.map(n=>n.id)])];p.media=[...new Set([...p.media,...D.staging.media])];}
})();
