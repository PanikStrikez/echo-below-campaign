const assert = require('node:assert/strict');
globalThis.ECHO_COMBAT_DATA = {
  CREATURES: {}, inShape: () => false,
  creatureDefense: () => ({ resistances: '', vulnerabilities: '', immunities: '', concentration: '' }),
  damagePreview: (token, amount, type, mode, defense) => {
    if (!Number.isFinite(Number(amount)) || Number(amount) < 0) throw Error('Invalid amount');
    const adjusted = mode === 'heal' ? Number(amount) : defense.immunities === type ? 0 :
      defense.resistances === type ? Math.floor(Number(amount) / 2) : Number(amount);
    const tempUsed = mode === 'heal' ? 0 : Math.min(token.tempHp || 0, adjusted);
    return { adjusted, tempUsed, hp: mode === 'heal' ? Math.min(token.maxHp, token.hp + adjusted) :
      Math.max(0, token.hp - adjusted + tempUsed), tempHp: (token.tempHp || 0) - tempUsed };
  }
};
require('../Session-01-Combat-Plus.js');
require('../Session-01-Commands.js');
const fresh = () => ({ commandRevision: 4, scene: 'map',
  tokens: [{ id:'a',name:'Hero',type:'human',team:'pc',placed:true,scene:'map',x:20,y:20,hp:12,maxHp:12,tempHp:2,conditions:[] },
    { id:'b',name:'Ally',type:'human',team:'pc',placed:true,scene:'map',x:25,y:20,hp:10,maxHp:10,tempHp:0,conditions:[] }],
  party:{ a:{id:'a',name:'Hero',hp:12,tempHp:2,resources:[{id:'ki',name:'Focus',current:2,max:2}]} },
  turn:{scene:'map',round:1,index:0,order:[]}, combatRun:{queue:{key:'',done:[],movementUsed:0}},
  combat:{tokens:{},creatures:{},effects:[]}, combatPlus:{calibration:{},areas:[],reminders:[],pauses:[],defenses:{},movement:null} });
const before=fresh();
const move=ECHO_COMMANDS.prepare(before,{type:'move-token',actorId:'a',x:30,y:30,groupIds:['a','b'],columns:24,expectedRevision:4},{pointValue:v=>Math.max(0,Math.min(100,v))});
assert.deepEqual(before.tokens.map(t=>[t.x,t.y]),[[20,20],[25,20]],'preview must not touch live positions');
assert.deepEqual(move.next.tokens.map(t=>[t.x,t.y]),[[30,30],[35,30]]);
assert.throws(()=>ECHO_COMMANDS.apply({...before,commandRevision:5},move),/table changed/);
const damage=ECHO_COMMANDS.prepare(before,{type:'reviewed-damage',expectedRevision:4,draft:{mode:'damage',type:'fire',amount:5,selected:['a','b'],overrides:{},amounts:{},conditions:{}}},{conditions:[]});
assert.equal(damage.next.party.a.hp,9);
assert.equal(damage.next.tokens[1].hp,5);
assert.equal(before.party.a.hp,12,'reviewed damage must not touch the live sheet');
assert.throws(()=>ECHO_COMMANDS.prepare(before,{type:'reviewed-damage',draft:{mode:'damage',type:'fire',amount:5,selected:['a','missing']}},{conditions:[]}),/target is no longer available/);
assert.equal(before.tokens[0].hp,12,'a failed multi-target command must leave every target alone');
const spend=ECHO_COMMANDS.prepare(before,{type:'spend-resource',characterId:'a',resourceId:'ki',cost:1});
assert.equal(spend.next.party.a.resources[0].current,1);
assert.equal(before.party.a.resources[0].current,2);
assert.throws(()=>ECHO_COMMANDS.prepare(before,{type:'spend-resource',characterId:'a',resourceId:'ki',cost:3}),/too few uses/);
const story={commandRevision:7,evidence:[{id:'clue',title:'Copper token',playerSaw:'Trista found a copper token.',published:false}],clueEvents:[],continuity:{events:[]}};
assert.throws(()=>ECHO_COMMANDS.prepareStory(story,{type:'publish-clue',id:'missing',published:true}),/no longer available/);
const publication=ECHO_COMMANDS.prepareStory(story,{type:'publish-clue',id:'clue',published:true,expectedRevision:7});
assert.equal(story.evidence[0].published,false);
assert.equal(publication.next.evidence[0].published,true);
assert.throws(()=>ECHO_COMMANDS.applyStory({...story,commandRevision:8},publication),/changed/);
const undo=ECHO_COMMANDS.prepareStory(publication.next,{type:'undo-clue-publication'});
assert.equal(undo.next.evidence[0].published,false);
globalThis.ECHO_OUTCOMES={apply:(continuity,id,review)=>{if(review!=='approved')throw Error('Review changed');continuity.events.push({id,title:'Rescue',status:'confirmed',share:'private',recipients:[]});return continuity.events.at(-1);}};
assert.throws(()=>ECHO_COMMANDS.prepareStory(story,{type:'confirm-outcome',draftId:'rescue',review:'stale'}),/Review changed/);
assert.equal(story.continuity.events.length,0,'failed outcome review leaves history alone');
const outcome=ECHO_COMMANDS.prepareStory(story,{type:'confirm-outcome',draftId:'rescue',review:'approved'});
assert.equal(outcome.next.continuity.events.length,1);
console.log('Stage 3 commands passed: movement, damage, resources, clue publication/undo, outcome review, stale rejection, and no partial mutation on failure.');
