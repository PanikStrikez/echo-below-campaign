/* Private, original preparation for the first three Undermountain expeditions.
   Reading or staging this module never establishes an event, sends a letter, or publishes a handout. */
(() => {
  'use strict';
  const custom = 'Original Echo Below preparation, following the approved campaign outline. Proposed until played and recorded by the DM.';
  const sources = [
    {id:'approved-outline',title:'Echo-Below-Campaign-Outline.md',section:'Act I: a place to return to; expeditions 1–3',authority:'Approved future direction; actual-play outcomes remain separate.'},
    {id:'gilded-hub',title:'../waterdeep/Waterdeep-Hub.md',section:'Kestrel Dane and the Gilded Compass; Orren, Ilvara, Vess and Durnan',authority:'Established custom NPC identities and existing relationships; later mystery hooks stay unrevealed.'},
    {id:'five-stories',title:'Five-Character-Stories.md',section:'Five character stories and spotlight guide',authority:'Character invitations, privacy boundaries and proposed personal contacts.'},
    {id:'courtyard',title:'Campaign-Courtyard-Data.js',section:'Mending Court residents, routines and ordinary returns',authority:'Prepared home and cast; availability and actual relationships depend on play.'},
    {id:'downtime',title:'Campaign-Downtime-Data.js',section:'Correspondence, commissions, research and relationships',authority:'Use existing reviewed time, cost, correspondence and relationship workflows.'},
    {id:'questbook',title:'Campaign-Quests-Data.js',section:'route, instrument and passage',authority:'Existing side-quest identities. These packages do not complete their objectives automatically.'}
  ];
  const rivals = [
    {
      id:'kestrel',name:'Kestrel Dane',title:'Captain of the Gilded Compass',status:'established-custom-npc; future meetings prepared',
      appearance:'A young adult human woman with freckled tan skin, tied-back red hair, a dented blue breastplate and a gold cloth strip at her shoulder. Her brass compass badge has one bent point.',
      role:'Negotiator and front-line fighter; the crew’s principal recurring face.',
      goal:'Earn enough reliable work to repair equipment and retain her crew, with the Gilded Compass credited for its own discoveries. Recognition matters to her; everyone returning matters more.',
      voice:'Competitive, brisk and generous when watched; she becomes specific and practical when Pell questions a risk. Let her admit one small uncertainty before offering a wager.',
      say:['“Exchange a measured stretch for a measured stretch. We keep each other’s names on the copies.”','“An empty space on a map is an honest answer. Tell me what stopped you.”','“If the bargain needs one of us dead to count as success, someone wrote a bad bargain.”'],
      relationships:[
        'Pell can call for a pause or retreat without being humiliated. Kestrel initially argues over the lost time, then asks him to identify the risk.',
        'Nym wants careful documentation before a sale; Kestrel wants the repair bill paid. They can negotiate a copying deadline and a minimum acceptable offer.',
        'Orren buys legitimate salvage. Their connection gives her a reason to check a claimed maker or owner, not permission to sell his known property.',
        'Vess once rescued the crew from a disastrous charter. She dislikes owing the story of her survival to him, but listens when he asks for an exit plan.',
        'Durnan tolerates bravado while stopping harassment of novices. Selise’s attention to the party may provoke envy only after Kestrel actually witnesses or credibly hears about it.'
      ],
      knowledge:[
        'Initially: her own intended contract, equipment constraints and routes personally walked or explicitly obtained. Copy only the dated routes the DM has established.',
        'After a map exchange: the particular annotations supplied, their survey date and reported limits. A map does not prove the current state of every room.',
        'After the instrument brief is shared: the description and claimed ownership actually provided. She does not already know where the object is.',
        'She knows neither the party’s private objects nor Aldric’s history by default. Her badge has no relationship to the Nine.'
      ],
      limits:[
        'She does not steal a climax, recover the instrument offscreen to force a chase, or arrive as an automatic rescue.',
        'No scouting report overrides a played cleared room, agreement or escape. Record a specific new visit and evidence before proposing a change.',
        'She cannot promise passage on behalf of dungeon inhabitants, guarantee a refuge or bind all future explorers to an agreement.',
        'Her crew’s northern journal, later sponsor pressure and distant site leads remain later private material. This arc does not reveal them.'
      ],
      offers:[
        {arc:'map',title:'A bounded map exchange',terms:'Exchange one measured route segment each, with the observer, date, scale and known gaps retained. Either party may redact a refuge or private location. No useful segment means no obligation to pretend otherwise.',decline:'She offers to compare one public landmark instead, or leaves on her own schedule without a penalty to the party.'},
        {arc:'instrument',title:'Expenses and credit before possession',terms:'If her crew actually contributed a lead, discuss a modest agreed expense reimbursement or joint credit. If it has a lawful competing claim, inspect the evidence with Orren rather than resolving ownership by initiative order.',decline:'Each crew can pursue a different verified branch. A later meeting compares actual results; possession and compensation remain unresolved until agreed.'},
        {arc:'passage',title:'One crew will follow a workable agreement',terms:'She may sign for her three-person crew if the actual occupants accept, with a named corridor, permitted load, warning method and exit condition. She requests that emergencies and changed guards have explicit rules.',decline:'She requests a one-time escorted visit or chooses a surveyed alternate route; she does not sabotage the party’s bargain.'}
      ],
      plans:[
        {id:'gilded-map-work',arc:'map',title:'Seek an independent surveying contract',trigger:'Before departure, if the DM wants the crew active this week.',evidence:'Prepare an actual offer from a local outfitter for dated clearance, load and return-time observations along a bounded accessible route. Establish the crew’s available supplies and its own turnaround condition.',proposal:'Kestrel can accept that commission and ask whether the party wants a paid or reciprocal copy afterward. Its observations serve logistics rather than claiming credit for the party’s whole survey.',preserves:'The player contract and unvisited rooms stay available. No map exists until a plausible expedition or purchased record supplies it.',alternatives:['The outfitter cannot agree a fee; the crew repairs equipment in town.','The crew surveys a different known branch.','A hazard causes an honest partial return.'],review:'DM review required; time passing alone does not complete the contract.'},
        {id:'gilded-salvage-claim',arc:'instrument',title:'Clarify a salvage commission',trigger:'Only if the DM stages a competing claim or a meeting on a mutually accessible route.',evidence:'Choose what equipment a prospective legitimate buyer requested, the ownership limits, and what the crew actually found. A buyer’s request alone proves no right to Orren’s instrument.',proposal:'Kestrel asks for credit or agreed expenses for an authentic contribution, while Nym compares serial marks and Pell preserves the known return route.',preserves:'The actual custodian, claimed owner and party choices. The item is not moved or sold merely because this proposal exists.',alternatives:['Exchange a location report without handling the object.','Accept Orren as a witness to a later ownership discussion.','Refuse the commission if it requires taking identified property.'],review:'DM review required; establish any possession or transfer through an approved outcome.'},
        {id:'gilded-route-test',arc:'passage',title:'Try the terms as a separate crew',trigger:'After an agreement actually names the Gilded Compass or allows independent visitors.',evidence:'An agreed route, dates, current occupants, warning procedure and the crew’s available supplies. Record any real conflicting claim before introducing it.',proposal:'On a later reviewed visit, the crew tests the agreement within its stated scope and returns a dated account. A refused passage becomes a report and negotiation opportunity.',preserves:'A kept agreement remains a success even if another group has never accepted it. A single obstruction does not erase the surveyed route.',alternatives:['They postpone for supplies.','They request an escort.','They use the established alternate and explain why.'],review:'DM review required; no automatic betrayal, casualty or faction takeover.'}
      ],source:custom,sourceIds:['approved-outline','gilded-hub']
    },
    {
      id:'pell',name:'Pell',title:'Gilded Compass scout and route keeper',status:'established-custom-npc; future meetings prepared',
      appearance:'A soft-spoken halfling in a moss-colored cloak, carrying folded route sketches. His brass compass badge has one bent point.',
      role:'Scout, mapper and the person who argues for retreat. Pell is not Pellan Fen of Mending Court.',
      goal:'Produce routes that another living person can follow in both directions, and build a reputation for returning when promised.',
      voice:'Quiet and exact; points to a landmark before making a claim. He asks “On the way back?” whenever a plan describes only entry.',
      say:['“Show me the landmark that still works when the lamp goes out.”','“I stopped there. Everything beyond that mark is somebody else’s story.”','“We can come back with more rope. That is what the rope is for.”'],
      relationships:[
        'Kestrel makes work possible; Pell makes her turn back before a contract consumes the crew. Their disagreements concern real risks, not a secret intention to abandon her.',
        'Nym’s catalog numbers help him mark where an object was found. He asks Nym to finish notes before the agreed withdrawal time.',
        'Vess’s earlier rescue is a practical lesson: leave an itinerary and allow someone to know when help might be necessary.',
        'Pebble can become a fellow route-maker through an actual comparison or journey. Ringgo can earn his confidence by preserving exits or admitting uncertainty; neither connection is assumed in advance.'
      ],
      knowledge:['His own dated sketches and observed tracks, plus explicitly attributed secondhand information. An old map gives directions, not current safety.','He can report a genuinely observed sentry change or obstruction; he cannot know private faction plans.','Later dated travel sketches may corroborate a distant tower lead. Do not introduce that subject during the three early jobs.'],
      limits:['He does not automatically find every trap or bypass every keyed danger. Use the published sightlines and the actual party’s approach.','He requests permission before marking occupied territory, a refuge or somebody else’s property.','No humiliation or compulsory anxiety cure for Pebble; asking for help and turning back are valid navigation choices.'],
      offers:[
        {arc:'map',title:'Check a return description',terms:'Invite Pebble or another willing PC to describe three stable landmarks in reverse order. Pell compares with his own observed stretch and labels disagreement for a revisit.',decline:'Leave a simple dated copy available if the party later wants it.'},
        {arc:'instrument',title:'A dated last-sighting note',terms:'Only if Pell actually saw the carrier or object: record appearance, place, time, direction and what he could not identify. A similar box is not a confirmed serial match.',decline:'The party can investigate Orren’s other evidence without buying his conclusion.'},
        {arc:'passage',title:'Write the exit clause',terms:'Describe how visitors announce arrival, who can revoke passage, where they can safely wait, and what changes require a fresh agreement.',decline:'He asks only for clear notice if the route should no longer be used.'}
      ],
      plans:[{id:'pell-correct-map',arc:'map',title:'Publish a bounded correction',trigger:'A played observation contradicts a map Pell supplied.',evidence:'The two actual route descriptions, observer and survey dates; establish whether the room changed or one account was wrong.',proposal:'Pell can give the affected users a corrected segment with the original version retained and the reason explained.',preserves:'Unaffected surveyed stretches, earned payment and honest limits. A correction is not proof the whole map is worthless.',alternatives:['Mark the segment disputed until checked.','Ask a willing crew for an independent revisit.'],review:'DM review required; choose recipients and exact shared details.'}],source:custom,sourceIds:['gilded-hub','five-stories']
    },
    {
      id:'nym',name:'Nym',title:'Gilded Compass cataloger and wizard',status:'established-custom-npc; future meetings prepared',
      appearance:'A copper-scaled dragonborn wizard in patched plum robes, carrying padded wraps and numbered labels. The bent-point compass badge is ordinary brass.',
      role:'Examines and catalogs objects; dislikes breaking something merely to discover what it did.',
      goal:'Keep a usable, credited catalog of finds and secure access to tools and records without selling evidence stripped of its context.',
      voice:'Patient with objects, impatient with unsupported certainty. Offers an observation, then says what it does not establish.',
      say:['“The scratch is new. That gives us an order of events, not a culprit.”','“May I make a drawing before anyone decides what to do with it?”','“A familiar mark deserves a comparison. It does not deserve a story invented around it.”'],
      relationships:[
        'Kestrel protects the crew’s pay; Nym negotiates enough examination time and fair credit before objects leave their hands.',
        'Pell’s place-and-date notes make the catalog useful. Nym can offer a shorter field record when the retreat deadline is near.',
        'Orren is a plausible craft and ownership contact because of his existing salvage relationship with Kestrel. An appointment and examination still require consent.',
        'Donavan can compare independent notes before either reads the other’s conclusion. Aldric may seek a narrow provenance question without revealing a biography.'
      ],
      knowledge:['Ordinary cataloging methods, observed construction and records actually available to the crew. Neither wizardry nor a shared ancestry grants knowledge of every object.','Recognizing a technique can suggest a workshop inquiry; it does not identify Pebble’s makers’ colleague or establish their fate.','A copied phrase or radial fragment remains incomplete. Nym cannot deduce Looking Glass, the Nine or Aldric’s return from these early finds.'],
      limits:['No automatic identification, repair, ritual or free spell service; use an actual capability, consent, time and any cost when relevant.','Never handles Aldric’s ring, Trista’s private property or another PC’s samples without permission.','A later blank-book lead stays later. Nym’s early catalog does not reveal hidden family or experiment history.'],
      offers:[
        {arc:'map',title:'A useful shared legend',terms:'Help label measured, reported, blocked and unvisited segments without inventing a universal symbol recognized by dungeon residents.',decline:'Provide only the meaning of the crew’s own marks.'},
        {arc:'instrument',title:'Compare identification marks',terms:'Compare Orren’s written description with an object or permitted drawing, noting matching and missing features before discussing compensation. Preserve the actual holder’s consent and the chain of custody.',decline:'Accept a witnessed description or offer a later workshop comparison.'},
        {arc:'passage',title:'Make a bargain readable',terms:'Offer one clear copy for each willing party, with scope, costs, exceptions, witnesses and an agreed review point. An inability to read does not invalidate an oral agreement explained in a shared language.',decline:'Ask for a spoken repeat-back with agreed witnesses instead.'}
      ],
      plans:[{id:'nym-second-comparison',arc:'instrument',title:'Check one uncertain attribution',trigger:'An actual find or permitted copy contains an ambiguous maker mark.',evidence:'The image, finder, permitted access, and at least one ordinary comparison specimen or catalog reference.',proposal:'Nym can arrange a bounded comparison with Orren and offer an attributed result with its uncertainty intact.',preserves:'The owner’s custody and all unanswered questions. Similarity does not prove common purpose or supernatural causation.',alternatives:['Retain the drawing for a later appointment.','Report that no adequate comparison was available.'],review:'DM review required; no automatic research success or disclosure.'}],source:custom,sourceIds:['gilded-hub','five-stories']
    }
  ];
  const returns = [
    {
      id:'arc-map-return',arc:'map',questId:'route',title:'Home with an honest map',scene:'mc-court',type:'conversation',status:'future-preparation',
      trigger:'After the party actually leaves the dungeon, whether it completes the bounded survey, renegotiates it or turns back with useful limits.',
      read:['The court is doing ordinary work when you return: a shutter creaks, a bucket rests beside the well, and Orenna is shifting a parcel away from the stair. She looks up and counts the faces she recognizes. “Back, then. Set the wet things where they can dry. Tell me what needs keeping.”'],
      run:[
        'Use residents already introduced. If Orenna is unavailable, let Nessa or an established host give the practical greeting. No illness, missing neighbor or magical disturbance is needed.',
        'At a separate agreed appointment, Ilvara receives the route with observer, date, measured segment, hazards, occupants, known return route and the exact stopping point. A documented obstacle can fulfill the contract if that was agreed before departure. Do not demand room clearance after accepting a survey.',
        'Review pay against the actual agreement. Record received money and carrier only after delivery and acceptance; unresolved fees remain an outstanding promise. If they never accepted the job, the map is theirs and can support a new offer.',
        'A mundane delivery can await them only if an order, sender or address has been established. Otherwise Orenna asks where future deliveries should go. Neither version puts an unexplained item into inventory.',
        'Invite one modest chosen improvement: a permitted drying rack, accessible storage label, lamp bracket or better route sheet. Agree owner, location, materials and cost before treating it as installed. This is ordinary home-making, not a reward that consumes money automatically.',
        'Stage the next job through a normal introduction or appointment with Orren. He has a missing instrument and asks whether the party wants to hear the terms. The map contract can conclude successfully even if they decline his work.'
      ],
      private:[
        'Focus this return on recognition and a dependable base. Do not show the changing doorway or a threatening message yet.',
        'Ilvara learns only the delivered report, not private notes or every object in the party’s possession. Remove refuge details or personal names if the agreed audience does not need them.',
        'A rival report, if offered, covers a different observed stretch. It cannot replace the party’s experience or establish an enemy response without a plausible source.'
      ],
      ask:['Which observation would help another crew return safely?','Who keeps the original map, and who may receive a copy?','What small change would make this feel easier to come home to?'],
      spotlight:[
        {characterId:'pc-pebble',offer:'Let Pebble explain the way back using landmarks he chose, with a willing neighbor following the explanation. Confidence comes from a usable route, including any place he asked for help.',fallback:'He can label one safe landmark or help decide where equipment belongs.'},
        {characterId:'pc-ringgo',offer:'Invite Ringgo to review the receipt, redactions and a client’s exact reference. Honest work can be specific without requiring his old history.',fallback:'He can identify one fair turnaround clause for the next job.'},
        {characterId:'pc-trista',offer:'Ask whether she wants a storage arrangement with private space and clear access. No inspection of her things is part of the lodging terms.',fallback:'She can choose an ordinary watch or scouting question for the next departure.'},
        {characterId:'pc-donavan',offer:'Offer a quiet place to separate measured facts from interpretations and draft one ordinary detail for Dianna.',fallback:'Keep the draft private and unsent until he chooses.'},
        {characterId:'pc-aldric',offer:'Nessa can accept practical help securing a loose cover or carrying a permitted parcel, if she actually wants it.',fallback:'He can rest without a personal scene; nobody demands his biography.'}
      ],
      outcomes:['Delivered survey and accepted limits','Money actually received or still owed','Specific map copies and their recipients','Supplies spent and return condition','Any resident promise or completed lodging improvement'],
      alternatives:['If injured or exhausted, let treatment and the reviewed rest come first; the debrief can wait.','If the map is lost, a bounded oral account or revised contract remains possible. Do not claim it is a complete survey.','If the party stays elsewhere, run the same recognition and debrief at its actual lodging. Mending Court remains an invitation.'],
      next:'Offer The Missing Instrument if interested; returning to finish an unmapped branch, a day of rest or ordinary paid work are equally valid choices.',
      source:custom,sourceIds:['approved-outline','courtyard','downtime','questbook']
    },
    {
      id:'arc-instrument-return',arc:'instrument',questId:'instrument',title:'What the instrument can tell you',scene:'mc-court',type:'conversation',status:'future-preparation',
      trigger:'After an actual recovery, a negotiated custody arrangement or a documented account of why the instrument could not be returned.',
      read:['A familiar chair has been left clear of the evening’s baskets. Nessa closes the book she was working on and makes room without reaching for your equipment. “Something to repair,” she asks, “or something you want left exactly as it is?”'],
      run:[
        'Use an introduced neighbor and begin with food, drying clothes or a repair someone actually needs. The entire return need not become an examination scene.',
        'At the agreed Ninepin Works appointment, Orren checks the description and marks with permission. If the instrument is present, record its actual condition; a recovered casing, functioning tool and written fate report are different deliveries. Apply the agreed reward for that result.',
        'If there is a salvage dispute, let each holder state their claim and evidence. Offer compensation, shared inspection, return with a paid contribution, or continued custody pending mediation. Do not confiscate an object from the party to end the scene.',
        'For Pebble, compare a visible maker’s mark with his hammer only if he permits it. A resemblance supports a drawing or message to the makers. It does not establish a name, whereabouts, death, magical upgrade or safe mineral food.',
        'Donavan may keep an ordinary sample only with the owner’s consent. Label what it is, where it came from, how it was stored and who can inspect it. A control measurement can be useful without any supernatural result.',
        'If Donavan previously sent an appropriate message and enough delivery time has passed, stage Dianna’s private reply. Her question compares an expected measurement, a recorded result and an ordinary control. If no letter was sent, offer a draft and a delivery quote instead.',
        'Mara can ask Trista for a private meeting only through an established contact route. Before an object-specific offer, name the actual disclosed fact or reliable source Mara knows. Without that basis, the message concerns a general bounded favor and says nothing about a hidden token.',
        'If a research fragment was legitimately recovered, discuss only the fragment and source actually available. A vague diagram and the phrase RESONANCE OBSERVED suggest a comparison; they do not identify a machine, its creator or its purpose.'
      ],
      private:[
        'Kestrel’s requested credit or expenses are a relationship choice, not a mandatory rival tax. The crew may have contributed nothing this time.',
        'Keep Donavan’s correspondence and Trista’s meeting on their owners’ phones if deliberately published. No shared journal entry follows from staging these drafts.',
        'Mara’s wider relationships, Halaster’s history and the family mystery remain private later preparation. Avoid giving every ordinary craft mark the same explanation.',
        'Use existing downtime review for copying, repair quotes, research time and sending a message. A possible letter is not a delivered event.'
      ],
      ask:['What did you recover, and what remains uncertain?','Who may handle, copy or keep the object now?','What comparison would change your current explanation?'],
      spotlight:[
        {characterId:'pc-donavan',offer:'Dianna’s testable question or a voluntary independent comparison with Nym gives him a result to investigate and a personal reply to make.',fallback:'Invite an ordinary family detail without requiring research.'},
        {characterId:'pc-trista',offer:'A private contact offers practical help on stated terms; she can choose disclosure, a limited inquiry or refusal.',fallback:'A straightforward lawful storage arrangement keeps the agency question without a secret meeting.'},
        {characterId:'pc-pebble',offer:'Choose a mark to preserve and a specific question for the hammer-makers, then decide whether to ask Orren or write home.',fallback:'An ordinary maintenance discussion can affirm the hammer’s history without inventing a new clue.'},
        {characterId:'pc-ringgo',offer:'Review ownership evidence or negotiate a disputed expense without threatening either claimant.',fallback:'Help describe an honest incomplete result or a safer recovery plan.'},
        {characterId:'pc-aldric',offer:'Ask Nym how catalogers distinguish an office’s emblem from one individual’s property; a hypothetical question need not reveal the ring.',fallback:'He can observe, decline or offer a practical workshop task.'}
      ],
      outcomes:['Actual instrument condition and custody','Each claimant’s evidence and any accepted agreement','Agreed reward delivered, deferred or changed','Permitted samples, copies and audiences','Letters actually sent or received; private meetings actually accepted'],
      alternatives:['If the object is lost or destroyed, a credible fate report can satisfy the stated contract and suggest repair or replacement work.','If the object stays with a custodian, record the agreed access and next appointment; do not mark recovery complete.','If a contact or courier is unavailable, preserve the draft and run an ordinary court evening.','If personal hooks are declined, offer the passage job through the route’s practical value to several crews.'],
      next:'Terms of Passage can grow from an actual bottleneck on the saved map. Choose its occupants and competing needs from the dungeon state; a familiar alternative route remains useful.',
      source:custom,sourceIds:['approved-outline','five-stories','downtime','gilded-hub']
    },
    {
      id:'arc-passage-return',arc:'passage',questId:'passage',title:'The route and the people at home',scene:'mc-court',type:'conversation',status:'future-preparation',
      trigger:'After negotiating passage, testing a limited arrangement, choosing an alternate route or returning with a well-defined unresolved conflict.',
      read:['There is an argument in the court about where a long basket should stand. It is a small, familiar argument: somebody needs the stair, somebody needs the basket, and supper will be late if neither of them moves. Then someone notices you at the gate and pulls another chair toward the table.'],
      run:[
        'Run an ordinary conversation first with residents already introduced. Ask about the actual route and one promise the party wants to keep; neighbors may be more interested in a late delivery or their own work than in every detail of the dungeon.',
        'Review the passage as a bounded agreement: exact stretch, parties who accepted it, price or service, permitted visitors, warning signal, review date and who can revoke it. A violent victory changes who is present; it does not guarantee a safe supply route.',
        'Give each consenting signatory a copy or witnessed oral summary, with private refuge locations omitted unless their holders agree. Present any new obstruction or rival objection as an evidence-backed proposed change for DM review.',
        'Offer Ringgo a private message only after Cade accepts the old-contact premise. Sera Quill is the existing proposed former courier seeking an exit from her trade; decide with Cade whether she is known personally or uses an old introduction. Her first request is to hear and verify an account, not perform an assassination.',
        'Offer Aldric a records contact only after he asks or agrees to an inquiry. Proposed specialist Edda Marr catalogs official seals and commission indexes by appointment. She is a new preparation detail, not a Crown witness. Dracuseth or Selise can arrange a discreet introduction only if they have accepted that task.',
        'Edda’s first service is a limited provenance plan: permitted sketch, access requirements, price quote and candidate records. A design match can identify an office or workshop; it cannot name Aldric’s family, establish guilt or explain his return.',
        'If the party wants a later expedition, choose one earned lead and an actual preparation need. A court supper, day of rest, correspondence or time spent fulfilling a promise can be the whole next scene.'
      ],
      private:[
        'Only after ordinary home life has had space, the approved first small anomaly is available: for several breaths one patched wall appears to contain a different doorway, then returns. Nobody is harmed, no route becomes traversable and no object is taken.',
        'Stage that anomaly only if two actual observers are present and can see it. Aven and a willing PC are possible if Aven is available; otherwise use two established observers or defer. Ask each for a separate description before comparing. Record perceived shape, duration and location, with uncertainty; do not claim an origin.',
        'Optional anomaly narration: “The patch beside the stair seems briefly deeper than the wall. A narrow doorframe stands where plaster should be. You have time to notice its shape; then the familiar crack is there again.” Do not read this unless the DM chooses to stage the event.',
        'The first courteous note from Halaster belongs to the expedition’s prepared attention beat only after he has a credible observation source. This return adds no second note or family revelation. If the attention beat was delayed, it remains delayed.',
        'Ringgo’s message is a claim to verify; no prior murder, debt or employer is invented. Aldric’s inquiry is private and his ring stays with him. Neither personal story requires a public confession.',
        'Edda Marr is a proposed cataloger, distinct from Mera Vale, the existing later proposed Crown witness. Do not silently turn one into the other.'
      ],
      ask:['Which promise from below needs a next date or a named person?','Who else should receive the route’s limits before they try it?','If something strange was actually seen, what did each witness observe independently?'],
      spotlight:[
        {characterId:'pc-ringgo',offer:'Privately choose whether to hear Sera’s account, verify it through an intermediary, suggest lawful help or decline.',fallback:'A new client can request the same protective skills without an imposed shared past.'},
        {characterId:'pc-aldric',offer:'Approve the exact question and drawing Edda may receive, ask for the terms privately, or stop the inquiry.',fallback:'A records appointment can wait; present acts of care remain meaningful without a revelation.'},
        {characterId:'pc-pebble',offer:'Explain the return route to a willing person who may use it and identify where changing conditions require new advice.',fallback:'He can choose one home landmark he now knows confidently.'},
        {characterId:'pc-trista',offer:'Help decide who should see a route copy or witness account, while keeping private property and unrelated personal notes separate.',fallback:'She can keep watch or enjoy a quiet evening without disclosing anything.'},
        {characterId:'pc-donavan',offer:'If an anomaly is staged and witnessed, preserve separate accounts before interpretation and propose a safe ordinary comparison.',fallback:'Review a normal contract or correspondence question; the scene need not produce research.'}
      ],
      outcomes:['Actual passage terms and who accepted them','Route copies, known restrictions and outstanding duties','Contact invitations accepted or declined','Provenance inquiry authorized, quoted or deferred','Only if played: anomaly witnesses, separate observations and chosen recipients'],
      alternatives:['If talks failed, a mapped alternate or precise account of competing demands is useful progress. Return without treating negotiation as a character failure.','If the court is not home, stage ordinary life at the actual lodging; preserve the planned court anomaly for a meaningful later visit.','If there are fewer than two observers or the party needs a quiet return, defer the anomaly.','If either personal hook is declined, respect that decision and use the other characters’ practical plans for the next scene.'],
      next:'Prepare the next earned expedition from the saved route, local faction interests and current character choices. Do not require every satellite site, assign a level or move the party to Skullport by narration.',
      source:custom,sourceIds:['approved-outline','five-stories','courtyard','downtime']
    }
  ];
  const handouts = [
    {
      id:'arc-map-brief',arc:'map',questId:'route',title:'A Map Worth Paying For · contract to agree',audience:'shared',owner:'',status:'draft',
      body:'Ilvara requests a reliable account of a bounded route beneath the Yawning Portal. Agree the section, payment, deadline and return conditions before accepting.\n\nDeliver a dated sketch with stable landmarks, hazards you actually observed, reported information marked as such, and the point where you turned back. You are not being hired to clear an entire floor. A blocked route can still be useful information.\n\nBefore departure: name who keeps the original, who may receive copies, what is private, and when the party will reconsider continuing. Record supplies and the route home.\n\nFee, route boundary and deadline: to be agreed with the DM before this draft becomes a contract.',
      publishWhen:'After the DM has previewed it and the offer is actually made. Replace the final line with the terms the players accept.',source:custom
    },
    {
      id:'arc-instrument-brief',arc:'instrument',questId:'instrument',title:'The Missing Instrument · recovery brief',audience:'shared',owner:'',status:'draft',
      body:'Orren at Ninepin Works wants his missing survey instrument recovered, or a reliable account of what happened to it. Before accepting, obtain its identifying description, last confirmed location, ownership evidence and the payment for each possible result.\n\nSomeone holding the instrument may have a claim worth hearing. You can investigate, negotiate, arrange a purchase, bring back a permitted drawing or report that recovery is currently unsafe. Do not assume a similar case contains the right device.\n\nRecord the place, date, condition, identifying marks and each transfer. If you recover it, agree who carries it and what inspection or repair is permitted.\n\nThe accepted identification details, recovery boundary, expenses and reward should be added before departure.',
      publishWhen:'After Orren makes the offer; include only description and evidence actually shared. Do not add a hidden current location.',source:custom
    },
    {
      id:'arc-passage-brief',arc:'passage',questId:'passage',title:'Terms of Passage · a route people can use',audience:'shared',owner:'',status:'draft',
      body:'Make one known stretch of occupied territory more dependable. Identify who actually controls it, who wants to use it, and what each group needs. A route can be useful before it reaches a famous destination.\n\nA workable agreement should name the stretch, permitted visitors and loads, costs or services, a way to announce arrival, an exit if talks fail, and when the terms will be reviewed. Ask who can speak for each side.\n\nYou can negotiate limited access, arrange an escort, test an alternate or return with an accurate account of the unresolved problem. Winning a fight does not by itself make the next journey safe.\n\nKeep the date and source with every route note. Share only the details the affected people agreed to disclose.',
      publishWhen:'After a route problem is actually introduced. Add the known stretch and invited parties without revealing unknown rooms or factions.',source:custom
    },
    {
      id:'arc-gilded-exchange',arc:'map',questId:'route',title:'Gilded Compass · suggested exchange terms',audience:'shared',owner:'',status:'draft',
      body:'Each crew offers one route segment it has actually surveyed or clearly labels the source of a purchased account. Copies retain the survey date, observer, scale and known gaps. No copy is a promise that a room has stayed unchanged.\n\nCredit remains with the observers. Either crew may withhold private lodgings, refuges and personal information. Expenses, escort work and physical salvage require separate agreement.\n\nIf a dangerous error is discovered, tell the people who received that segment and explain the correction. Turning back at an agreed limit is a completed return, not a forfeited wager.\n\nThese are proposed terms. Both crews can change or decline them before accepting.',
      publishWhen:'Only if Kestrel makes the exchange offer; amend to the agreement actually reached.',source:custom
    },
    {
      id:'arc-dianna-reply',arc:'instrument',questId:'instrument',title:'Dianna · one comparison to try',audience:'owner',owner:'pc-donavan',characterId:'pc-donavan',status:'draft',
      body:'Donavan,\n\nI would like one ordinary detail as well as the extraordinary ones. Tell me about a meal, a new neighbor, or a moment that made you laugh.\n\nFor the measurements you described, write down the result you would expect before you repeat anything. Can you take the same measurement somewhere ordinary, using the same instrument and method? Keep each observer’s notes separate until everyone has finished. If the difference disappears, that is useful too.\n\nSend only what the other people involved have agreed you may share. I can help compare a pattern; I cannot tell you what happened in a room I have never seen.\n\nLove,\nDianna',
      publishWhen:'Only after an actual suitable letter, a credible delivery interval and DM review. If no measurements were sent, edit the research paragraph or leave this unsent.',source:custom
    },
    {
      id:'arc-mara-invitation',arc:'instrument',questId:'instrument',title:'Mara · a private invitation',audience:'owner',owner:'pc-trista',characterId:'pc-trista',status:'draft',
      body:'Trista,\n\nIf you have time, I would like to discuss a practical favor. We can agree what is being asked, what either of us is willing to promise, and what stays between us before you decide.\n\nYou can bring someone you trust, ask for a written proposal, or say no. I would rather have a clear limit than a surprising obligation.\n\nMara',
      publishWhen:'Only through an established contact route. This general invitation discloses no token or discovery; make any later object-specific offer depend on a recorded credible source.',source:custom
    },
    {
      id:'arc-ringgo-contact',arc:'passage',questId:'passage',title:'A private request from Sera Quill',audience:'owner',owner:'pc-ringgo',characterId:'pc-ringgo',status:'draft',
      body:'Ringgo,\n\nI am looking for a way out of work I no longer want to do. I am asking for a conversation first. You need not promise help before you hear the account, and you should check it before you act.\n\nI need a safe way to discuss papers and obligations. I am not asking you to kill anyone. If you would rather use an intermediary, tell me whom you trust and what they are allowed to hear. If the answer is no, I will not treat silence as a promise.\n\nSera Quill',
      publishWhen:'Only after Cade accepts either a prior connection or an old introduction. Establish the sender’s actual reply route and situation privately; this letter proves a request, not the truth of every claim.',source:custom
    },
    {
      id:'arc-aldric-introduction',arc:'passage',questId:'passage',title:'A discreet records appointment',audience:'owner',owner:'pc-aldric',characterId:'pc-aldric',status:'draft',
      body:'Edda Marr can discuss a limited search of official-seal and commission indexes by appointment. Before any examination, she will state the access requirements, fee and what a first search can establish.\n\nYou may begin with a permitted drawing and omit names. A matching crest can point to an office or workshop; it does not identify a wearer on its own. No original needs to be surrendered for an initial conversation.\n\nPlease decide what description may be forwarded, who may see a reply and whether you want an intermediary present. A meeting is an offer, not an obligation.',
      publishWhen:'Only after Aldric approves the inquiry and an actual intermediary arranges access. Edda is a proposed specialist, not an established Crown witness or source on Aldric’s return.',source:custom
    }
  ];
  globalThis.ECHO_UNDERMOUNTAIN_ARC_CAST = {
    version:1,title:'Gilded Compass and the first three city returns',status:'future-preparation',rivals,returns,handouts,sources,
    notes:[
      'This is DM-only content. Nothing here publishes, sends, spends, advances time, changes custody or completes a quest. Use existing reviewed workflows for actual outcomes.',
      'Shared side-quest briefs belong on shared phones after deliberate approval. Personal correspondence belongs on its owner’s phone. The main quest’s TV role remains unchanged.',
      'Use one or two substantial character moments at a return, offer short invitations to others and rotate later. Offered, played, deferred and declined are different spotlight states.',
      'The Gilded Compass’s appearance and relationships come from the existing hub. The independent contracts, exact dialogue, Edda Marr and detailed return staging are new proposals.',
      'No creature statistics are invented for the rival crew. If combat becomes necessary, prepare appropriate source-labeled capabilities before rolling; they do not function as free party abilities.',
      'The three early jobs are not an automatic timetable. Preserve the saved dungeon, actual occupants, route history and contracts; postpone any return scene whose prerequisites are absent.',
      'Early observations remain bounded. Do not reveal Looking Glass, Halaster’s family, the Nine’s complete structure, or the cause of Aldric’s return through these drafts.',
      'The latest confirmed campaign outcome left Gundren at an inn and the party at Barthen’s Provisions after Glasstaff escaped. These Waterdeep expeditions and relationships are prepared future play.'
    ]
  };
})();
