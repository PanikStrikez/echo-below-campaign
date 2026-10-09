/* Private expedition preparation. Original guidance; source references are read-only.
   Nothing in this file is an event, an inhabitant spawn, or a timer that resolves itself. */
globalThis.ECHO_EXPEDITION_DATA = {
  version: 1,
  title: 'Expedition & return',
  principle: 'A return begins with the dungeon as the party left it. Propose only a specific change supported by a surviving actor, an observed process, an agreement, or another concrete cause. Approval never silently resets defeated foes, disarmed traps, emptied containers, explored ground, or completed objectives.',
  prepPrompts: [
    {id:'objectives',title:'Purpose and a useful stopping point',prompt:'Name the expedition’s objective, one optional lead, and a result that would count as useful even if the party retreats. Link an active quest only when relevant.'},
    {id:'supplies',title:'Supplies and carriers',prompt:'Review current light, food, water, rope, healing, tools and return fare. Record carriers and any actual cache. Estimates are planning notes; charge or consume supplies only through a reviewed change.'},
    {id:'known-routes',title:'Known route and its evidence',prompt:'Choose entry, reached passages and last verified exit. Separate traveled routes from another person’s claim or an unexplored connection. Record doors or obstacles that determine whether the route works.'},
    {id:'retreat',title:'Turn-back conditions and rally point',prompt:'Agree on warning signs such as depleted light, a missing companion or a threatened route. Choose a reachable rally point, a fallback, and what to do if separated.'},
    {id:'refuges',title:'Possible refuges',prompt:'Name the room, how it can be approached and secured, known occupants, permission if needed, and last check. Cleared does not automatically mean safe to rest; unknown does not mean occupied.'},
    {id:'return-conditions',title:'Expected return and city contact',prompt:'Record when a contact should become concerned, what help was actually promised, and the scope of that help. A late return proposes a contact response for review, not an automatic rescue or punishment.'},
    {id:'custody',title:'Discoveries and people',prompt:'Decide how to label discoveries, preserve testimony, escort rescued people, and seek permission before sampling. Keep a private discovery private until its owner deliberately shares it.'}
  ],
  checklists: {
    departure: [
      'Continue the saved dungeon and map records. A new expedition is another visit, not a fresh copy of its inhabitants.',
      'Read the last return report, unresolved dangers, promises and approved developments; confirm the starting position and usable exit.',
      'Choose objectives and abort conditions; review supplies and the actual character records without granting a rest or level.',
      'Stage only the first relevant scene and player-known routes. Keep private route evidence, inhabitants and unrevealed rooms off the TV.'
    ],
    retreat: [
      'Record the last actual positions, reachable return route and rally point. Do not teleport the party past unresolved danger.',
      'Identify who withdrew, who pursued, who remained, and how anyone learned of the retreat. An alert is a prompt, not proof every creature heard it.',
      'Preserve fog memory, door and trap states, searched containers, room outcomes, token HP and the agreed custody of discoveries.',
      'Record the actual elapsed time and supply changes once. Mark a blocked route only if the obstruction or actor has a concrete cause.',
      'Keep rescued people, defeated enemies and fulfilled promises recorded. Retreat alone reverses none of them.'
    ],
    rest: [
      'Choose the actual refuge and access route. Review doors, light, watches, current inhabitants and an exit before offering recovery.',
      'State the planned duration and known risk. A quiet room can remain quiet; do not add an interruption just because the party rests.',
      'Review source-specific timers and actual noise or pursuit. Propose any interruption and its evidence before changing the dungeon.',
      'Record actual elapsed time once. Use character rest review for recovery; an interrupted rest does not silently receive full benefits.',
      'If the party moves to another map, retain the saved return point and each map’s own explored areas and objects.'
    ],
    return: [
      'Restore the saved entry or retreat position and the party’s remembered ground. Previously hidden areas stay hidden.',
      'Compare the last state with approved changes. Describe a changed door, track, light or inhabitant only when the party can observe it.',
      'Keep cleared rooms cleared, disarmed traps disarmed and emptied containers empty unless a specific reviewed event changes that fact.',
      'Distinguish a route being remembered from it being currently passable. Recheck only where time, damage or inhabitants give a reason.',
      'Offer the current objective, one open question and a usable retreat plan; do not replay completed encounters or charge the same cost again.'
    ],
    debrief: [
      'Record accomplished objectives, observations, uncertain claims, survivors, unresolved dangers, promises and discovery custody.',
      'Review actual resource use with the party. Record missing quantities as unknown instead of inventing them.',
      'Separate a completed outcome from a proposed next move. Attach evidence and a reason to every faction, route or refuge development.',
      'Review changed targets individually. Preserve successes and avoid moving the same surviving creature into two places.',
      'Prepare a short return report for the DM. Publish only the facts deliberately approved for the intended audience.'
    ]
  },
  returnConditions: [
    {id:'same-state',title:'The same place unless something changed',text:'Old exploration, discoveries, disarmed traps and emptied containers remain. A completed encounter is history; a new occupant needs its own cause and record.'},
    {id:'survivors',title:'Account for survivors once',text:'A survivor can relocate only from a known prior position along a plausible route in the available time. Unknown whereabouts remain unknown until evidence or an approved DM development establishes more.'},
    {id:'noise',title:'An alert has a route',text:'Use the existing noise record, connected rooms, barriers and time to support a warning. Noise suggests what may be checked; it does not prove every inhabitant moved or heard it.'},
    {id:'safe-rest',title:'A refuge has conditions',text:'Record who controls it, what was cleared, the access route, defenses and any agreement. Keep the resting place’s established advantages until a concrete change affects them.'},
    {id:'wave-rest',title:'Wave Echo Cave resting references',text:'The existing room journal identifies area 7 as a secure resting location and area 20 as suitable after its threats are dealt with. Check actual access and outcomes; neither selection defeats anyone or recovers HP.',sourceNotes:'Lost Mine of Phandelver, pp.42, 45, 50–51; existing Session-04-Expedition.js rest guidance. Verify the relevant keyed area in the local book.'},
    {id:'wave-timers',title:'Specific effects retain their own rules',text:'Check the existing flameskull and temporary Forge reminders against actual elapsed time and any prevention used. Review the existing creature or item; do not duplicate a skull or make a temporary enchantment permanent.',sourceNotes:'Lost Mine of Phandelver, Wave Echo Cave; Session-04-Expedition.js persistent threats and Forge controls. Exact creature effects remain in the linked stat block.'},
    {id:'um1-well',title:'Undermountain return to the well',text:'The known entrywell is a return route once reached. Preserve the actual path to it and any arrangements above. A newly found stair or gate is a separate route with its own discovery and restrictions.',sourceNotes:'Dungeon of the Mad Mage, pp.6–12, 14; Waterdeep-Expedition-Data.js entrywell and route guidance.'}
  ],
  developments: [
    {
      id:'warning-delivered',title:'A surviving scout delivers a warning',category:'faction',scopes:['um1'],
      reason:'A specific survivor may carry knowledge to reachable allies; an alarm alone does not establish arrival or a response.',
      requiredEvidence:['A named or uniquely identified scout survived and left a recorded location.','The scout witnessed the information being carried.','A reachable destination, sufficient elapsed time and living recipients are established.'],
      proposal:'Review moving that same survivor to the recipient’s location and record exactly what the recipients learned. Choose a limited response such as a watch, a question, or no immediate action.',
      preserves:['The scout is not copied or restored if killed.','Previously defeated creatures and cleared rooms remain recorded.','Player knowledge changes only when the warning or response is witnessed or disclosed.'],
      alternatives:['The scout cannot complete the route; record the concrete obstruction.','The warning arrives but the recipients stay put.','Keep the destination uncertain and prepare evidence for a later encounter.'],
      sourceNotes:'Dungeon of the Mad Mage, Level 1 areas 1 and 2, p.14: lookout and surviving bugbear warning routes; existing Waterdeep-Expedition-Data.js. Response details here are original DM preparation.'
    },
    {
      id:'undertaker-retreat',title:'Surviving Undertakers consolidate',category:'faction',scopes:['um1'],
      reason:'Surviving gang members have existing fallback routes; their loss of territory can change their behavior without undoing the party’s success.',
      requiredEvidence:['Uktarl, Harria or specific gang members are recorded alive and able to withdraw.','The destination in areas 6, 7 or 8 is still reachable and usable.','Their movement fits recorded time and does not contradict an agreement or captured status.'],
      proposal:'Review relocating only those survivors to one named fallback. State their current aim: shelter, negotiation, warning allies or escape. Show the old and proposed positions together.',
      preserves:['Defeated Undertakers remain defeated.','The party keeps cleared ground, recovered items and an exposed disguise.','A fallback contains only existing survivors and its previously recorded occupants.'],
      alternatives:['Survivors offer terms instead of fighting.','They abandon the area through a verified route.','They remain where last seen until a concrete motive or opportunity develops.'],
      sourceNotes:'Dungeon of the Mad Mage, Level 1 areas 6–8, pp.17–18; existing Waterdeep-Expedition-Data.js. No automatic retreat or fresh gang is implied.'
    },
    {
      id:'vacant-post-interest',title:'A surviving faction investigates a vacant post',category:'faction',scopes:['um1'],
      reason:'Vacated territory creates an opportunity only if a surviving group learns of it and can reach it.',
      requiredEvidence:['A particular room was actually vacated or cleared.','A surviving Xanathar group or another established local group has learned that it is vacant.','Its route, available people, purpose and time to act are identified.'],
      proposal:'Review a reconnaissance visit first, or a small occupation by identified existing inhabitants. Record an observable sign and the reason they chose this place.',
      preserves:['The earlier victory stays completed.','Disarmed traps and emptied containers do not reset.','Moving inhabitants removes them from their prior location; it never creates replacements there.'],
      alternatives:['The group decides the post is not useful.','It asks for access or offers a trade.','A proposed occupation remains pending until motive, route or personnel are established.'],
      sourceNotes:'Dungeon of the Mad Mage, Level 1 aftermath, p.26; existing Waterdeep expedition guide. This is a contingent application, not a scripted respawn schedule.'
    },
    {
      id:'phandelver-agreement',title:'A surviving Phandelver contact honors or revisits an agreement',category:'faction',scopes:['phandelver'],
      reason:'Actual promises can provide continued access or a reason to talk; a later request need not erase a kept bargain.',
      requiredEvidence:['An approved bargain names the parties, its terms and whether it was fulfilled.','The relevant contact is alive or their present authority is independently established.','Any proposed new request has a concrete need and does not retroactively change the old terms.'],
      proposal:'Review a specific response to the existing agreement: permitted passage, a warning, requested help, or a meeting. Yeemik’s completed exchange for Sildar stays completed; add new terms only if actually accepted.',
      preserves:['Sildar’s recorded rescue and Klarg’s defeat are not reopened.','A fulfilled promise stays fulfilled.','This does not settle unplayed Redbrand, castle or mine outcomes.'],
      alternatives:['The contact has no new demand and honors the established terms.','A conversation clarifies an ambiguous limit.','An actual change of control creates a separate, evidenced problem.'],
      sourceNotes:'DM-confirmed Session 1 bargain in Campaign-Continuity.js; approved campaign outline. New responses are original contingent preparation, not additional published adventure facts.'
    },
    {
      id:'mine-guard-shift',title:'A surviving mine inhabitant changes a watch',category:'faction',scopes:['wave'],
      reason:'Someone who knows of an intrusion can choose a different watch position, but neither knowledge nor control is universal.',
      requiredEvidence:['A specific inhabitant in Wave Echo Cave is recorded alive and free to act.','That inhabitant learned of the party through an approved sighting, message or alarm.','The proposed post is reachable and the inhabitant’s motive and available time are stated.'],
      proposal:'Review one relocation or a limited defensive task. If Nezznar is the actor, establish his current fate and what he actually knows first. Leave unrelated rooms, prisoners and the Forge unchanged.',
      preserves:['Dead, captured or escaped characters are not quietly returned.','The same token retains its identity and saved injuries.','A changed watch does not repair a disarmed trap or refill treasure.'],
      alternatives:['The survivor negotiates, hides or withdraws.','A warning remains incomplete and the watch stays unchanged.','No development: their current plan still makes sense.'],
      sourceNotes:'Original return preparation using existing Wave Echo Cave room and outcome records. Consult the selected keyed room in Lost Mine of Phandelver for its actual occupants and motives; no new canonical tactic is asserted.'
    },
    {
      id:'route-obstruction',title:'An observed cause changes a passage',category:'route',scopes:['any'],
      reason:'A damaged support, water change, moved barricade or deliberate repair can alter a route when the cause and affected passage are known.',
      requiredEvidence:['The specific passage and its prior state are recorded.','There is a concrete physical process or identified actor capable of making this change.','Elapsed time, extent, warning signs and a way to assess or work around the change are stated.'],
      proposal:'Review the exact door or passage update: difficult, blocked, reopened or rerouted. Describe visible evidence, the cost of reassessment, and an alternative route if one is actually known.',
      preserves:['The party remembers the old route and its discoveries.','Unconnected doors, rooms and traps remain as saved.','A cleared room remains cleared even if reaching it becomes harder.'],
      alternatives:['The route remains usable with a visible warning.','Temporary shoring or an agreed repair restores access.','The process has not progressed far enough to change passage yet.'],
      sourceNotes:'Original DM preparation; use saved Dungeon passages, door barriers, room notes and approved travel outcomes. A blank map area or passage of time alone is not evidence of collapse.'
    },
    {
      id:'refuge-kept',title:'An agreed refuge becomes more reliable',category:'refuge',scopes:['any'],
      reason:'A kept agreement or completed repair should produce a practical benefit that survives the next visit.',
      requiredEvidence:['A specific refuge, custodian if any, and permission or control are established.','The repair, watch, cache or shelter agreement was actually completed.','The benefit and its limits can be checked without assuming new purchases or supplies.'],
      proposal:'Review a bounded improvement: a working latch, a maintained cache, an agreed warning, or a reserved sleeping space. Record who maintains it, its verified limits, and when it was last checked.',
      preserves:['Previously secured access and completed repairs stay effective until a concrete change affects them.','Supplies are not replenished for free or consumed twice.','A refuge grants only the protection recorded; character recovery still uses rest review.'],
      alternatives:['The improvement is incomplete but its progress remains.','The custodian offers a different benefit with reviewed terms.','Keep the existing refuge conditions unchanged.'],
      sourceNotes:'Original DM preparation connected to saved refuges, settlement commissions and approved promises. Exact rest recovery follows the campaign rules profile.'
    },
    {
      id:'verified-shortcut',title:'An earned route becomes a usable alternative',category:'route',scopes:['any'],
      reason:'Exploration, permission or a completed repair can turn a lead into a verified path and reduce repeated work.',
      requiredEvidence:['The connection was actually traversed, reliably surveyed or explicitly opened.','Both ends, relevant restrictions and a return direction are known.','Any owner’s permission, repair or toll terms were actually agreed.'],
      proposal:'Review marking the connection usable and saving its arrival and return positions. State its real advantage and limits; offer it next departure without replaying its solved obstacle.',
      preserves:['The original route remains known unless separately changed.','Nearby secret passages and unexplored endpoints remain hidden.','Discovering stairs or a gate does not bypass its rules or reveal later floors.'],
      alternatives:['Record it as located but unverified.','Keep a one-way or conditional limitation explicit.','The party declines the shortcut; preserve the discovery for later.'],
      sourceNotes:'Original DM preparation using existing paired passages and route records. For Undermountain gates and travel restrictions consult Dungeon of the Mad Mage pp.10–12 and the keyed area.'
    }
  ],
  readAloud: [
    {id:'departure',title:'Before setting out',when:'Use when the party has actually prepared a route and gathered at its chosen departure point.',text:'There is space on the route sheet for what you hope to find, and another line for the way home. Before you leave, what would make you turn back?'},
    {id:'retreat',title:'Choosing to withdraw',when:'Use after the party chooses withdrawal and can reach its recorded rally point. Describe any real pursuit separately.',text:'For now, the next step is back along the way you know. What have you learned that you want to remember, and what must be checked before you return?'},
    {id:'rest',title:'A pause in a checked refuge',when:'Use only after the party reaches and checks its chosen refuge; insert the actual light and surroundings. This text grants no rest benefit.',text:'For a while, you can stop moving. Who takes the first watch, what light do you keep, and what would wake the others?'},
    {id:'return',title:'Returning to familiar ground',when:'Use when the group reenters a place it has visited. Add only approved changes they can perceive.',text:'You have been here before. The route no longer begins as an empty page. Where do you pause to check your bearings before going farther?'},
    {id:'debrief',title:'Back at the agreed meeting place',when:'Use only when the party reaches its actual return destination. Do not presume a waiting contact or a safe journey.',text:'Set down the things you brought back. Which discovery matters most, who still needs help, and what do you want to do before the next descent?'}
  ]
};
