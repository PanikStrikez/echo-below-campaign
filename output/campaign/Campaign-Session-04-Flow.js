/* DM-only revised future preparation. Loading changes no saved campaign. */
(()=>{'use strict';if(globalThis.location?.hash==='#player')return;const rows=[
  {
    "id": "evening4-start",
    "title": "Opening · outside Barthen’s Provisions",
    "scene": "lmop-barthen-exterior",
    "read": [
      "Barthen’s Provisions stands beside Phandalin’s worn street. Cart wheels pass over packed earth; farther off, a hammer strikes and stops. The shop’s doorway is in front of you, with the town stretching away in either direction.",
      "Gundren is at the inn where you left him. Glasstaff escaped, and Trista still has the captured rat. You have a moment to choose what matters first: go into the shop, check on Gundren, or attend to another unfinished concern."
    ],
    "ask": [
      "What do you want to accomplish first?"
    ],
    "run": [
      "Ask for a short player recap. Correct only established facts. Do not turn the preparation into a new event.",
      "If they enter, open Barthen. If they go to the inn, establish the existing lodging details privately before describing it. If they choose another aim, use the town hub."
    ],
    "private": [
      "DM-only: Glasstaff fled to Cragmaw Castle. The characters do not know his destination. Trista’s BELOW token remains private.",
      "Lost Mine of Phandelver (2014), pp. 14–19; actual checkpoint confirmed 9 October 2026."
    ],
    "choices": [
      "Enter Barthen’s shop",
      "Check on Gundren",
      "Attend to the captured rat",
      "Return to the town map",
      "Stop here and close the evening"
    ],
    "flowVersion": 1,
    "tv": "Private preview first. Show on TV only after selecting the observable scene. No automatic publication.",
    "flow": {
      "purpose": "Choose the party’s immediate priority.",
      "entry": "Start at the confirmed checkpoint. Entry, delivery and payment have not been established.",
      "reveal": [
        "No new clue is granted by the opening."
      ],
      "outcomes": [
        "Priority chosen: stage the selected scene.",
        "Priority undecided: remind them of the three immediate concerns without picking for them."
      ],
      "exits": [
        {
          "to": "s5-barthen",
          "label": "Enter Barthen’s shop",
          "when": "They choose to enter",
          "line": "You cross the threshold from the street into the provisions shop."
        },
        {
          "to": "s5-inn",
          "label": "Check on Gundren",
          "when": "They choose to return to the inn",
          "line": "You turn from the shop toward the inn where you left Gundren."
        },
        {
          "to": "s5-rat",
          "label": "Attend to the captured rat",
          "when": "Trista chooses to investigate or share it",
          "line": "Before heading elsewhere, you turn your attention to the rat and how it is being kept."
        },
        {
          "to": "evening4-route",
          "label": "Return to the town map",
          "when": "Whenever the party leaves or postpones this scene",
          "line": "You leave that matter as it stands and turn back toward the streets of Phandalin. Where do you go next?"
        },
        {
          "to": "next-session-4-review",
          "label": "Stop here and close the evening",
          "when": "The table is ready to stop; unfinished choices remain open",
          "line": "We will stop with that decision still in front of you. Let’s record exactly where everyone is and what remains unfinished."
        }
      ],
      "record": [
        "Record an actual chosen objective only if useful; do not mark the other leads completed."
      ],
      "source": "Lost Mine of Phandelver (2014), pp. 14–19; actual checkpoint confirmed 9 October 2026."
    }
  },
  {
    "id": "s5-barthen",
    "title": "Barthen · business and news",
    "scene": "barthen-art",
    "read": [
      "Coils of rope, trail rations and ordinary tools fill the shop. There is little grandeur here: the useful things are kept within reach, and the space between them is just wide enough for customers with packs. Barthen looks up from his work as you approach.",
      "His attention moves from your faces to anything you have brought with you. “What can I do for you?” he asks. Beyond the doorway, the street remains in view; you can explain your business, give him news, or ask what you need before your next journey."
    ],
    "ask": [
      "What do you tell Barthen, and what do you want from him?"
    ],
    "run": [
      "Ordinary buying and truthful news require no check. Barthen sells adventuring gear costing up to 25 gp per item; weapons and armor belong at Lionshield Coster. Review stock, costs and payment.",
      "Delivery: confirm that the agreed supplies arrived and that payment has not already happened. The published 10 gp per character is available only for a completed unpaid contract, not every return visit.",
      "If told Gundren is back: proposed response, “You brought him back? Where is he, and what do you need?” Do not narrate a visit or promise until made.",
      "Pebble can ask about practical mineral or trade contacts; Donavan can ask for a precise account; Ringgo can negotiate legitimate work. These are invitations, not compulsory hooks."
    ],
    "private": [
      "LMoP p. 16; PHB 2014 pp. 150–153; DMG 2014 pp. 244–245."
    ],
    "choices": [
      "Return to Gundren",
      "Ask Qelline about a regional guide",
      "Return to the town map",
      "Stop here and close the evening"
    ],
    "flowVersion": 1,
    "tv": "Private preview first. Show on TV only after selecting the observable scene. No automatic publication.",
    "flow": {
      "purpose": "Settle any actual business and decide what help to seek.",
      "entry": "The party has entered or deliberately approached Barthen. Confirm goods and prior payment before offering the contract reward.",
      "reveal": [
        "Published baseline: Gundren is his friend; Tharden and Nundro had been camping outside town. Their present fates are not Barthen’s knowledge.",
        "Barthen has no castle route or knowledge of Glasstaff’s unseen flight."
      ],
      "outcomes": [
        "Business completed: review money/items and any promise.",
        "Business partly settled: note what remains owed or undelivered.",
        "Business declined: no payment or transaction; move to a chosen lead."
      ],
      "exits": [
        {
          "to": "s5-inn",
          "label": "Return to Gundren",
          "when": "The party wants to check or help him",
          "line": "Leaving the shelves and counter behind, you head back to the inn."
        },
        {
          "to": "evening4-qelline",
          "label": "Ask Qelline about a regional guide",
          "when": "They seek someone with local knowledge; this is a prepared inquiry, not Barthen’s automatic referral",
          "line": "You set out to speak with Qelline Alderleaf about the surrounding country."
        },
        {
          "to": "evening4-route",
          "label": "Return to the town map",
          "when": "Whenever the party leaves or postpones this scene",
          "line": "You leave that matter as it stands and turn back toward the streets of Phandalin. Where do you go next?"
        },
        {
          "to": "next-session-4-review",
          "label": "Stop here and close the evening",
          "when": "The table is ready to stop; unfinished choices remain open",
          "line": "We will stop with that decision still in front of you. Let’s record exactly where everyone is and what remains unfinished."
        }
      ],
      "record": [
        "Actual goods delivered, payment, purchases, shared news and promises. Audience and linked rewards must be reviewed."
      ],
      "source": "LMoP p. 16; PHB 2014 pp. 150–153; DMG 2014 pp. 244–245."
    }
  },
  {
    "id": "s5-inn",
    "title": "Gundren · establish his condition",
    "scene": "phandalin-art",
    "read": [
      "You return to the place where you left Gundren. The familiar route through the inn brings you back toward his room, away from the passing voices of its public space. Before anyone asks about maps or captors, you have the chance to see how he is doing.",
      "At the doorway, you pause to look and listen. What you do next can be as simple as speaking to him, checking for a response, or asking whoever is present what they have observed. Who approaches him first, and what do you try?"
    ],
    "ask": [
      "Do you check his condition, speak to him, or arrange help?"
    ],
    "run": [
      "Establish and describe the condition actually chosen by the DM; this preparation assigns none. If awake and willing, proposed line: “Tell me what happened after he cast that spell.”",
      "If not responsive, describe observable signs and support care or an independent inquiry. No invented curse, forced new mystery or automatically recovered HP.",
      "Only if the 2014 Sleep spell is confirmed: normal duration is one minute; damage or an action to shake/slap can wake the target. Continued unresponsiveness needs another established reason.",
      "Medicine is for an uncertain assessment; obvious signs do not need a roll. Missing map custody or testimony remains unknown until established."
    ],
    "private": [
      "Actual checkpoint; PHB 2014 pp. 178, 276; SRD 5.1 p. 180."
    ],
    "choices": [
      "Pursue an available witness",
      "Return to the town map",
      "Stop here and close the evening"
    ],
    "flowVersion": 1,
    "tv": "Private preview first. Show on TV only after selecting the observable scene. No automatic publication.",
    "flow": {
      "purpose": "Find out how Gundren is doing and what help or questions are appropriate.",
      "entry": "The inn is unnamed in the actual record. Confirm its identity, where Gundren was left and any established caretaker. Decide observable condition before reading further.",
      "reveal": [
        "Ask about witnessed events, last contact with his brothers and any actual mine-map custody. Answers come from his established knowledge.",
        "He cannot report Glasstaff’s movements after losing consciousness merely because the DM knows them."
      ],
      "outcomes": [
        "Able and willing to speak: record the testimony actually given.",
        "Care needed or conversation postponed: record actual arrangements, not an assumed recovery.",
        "No useful information: keep the question open and pursue an independent source."
      ],
      "exits": [
        {
          "to": "s5-redbrand",
          "label": "Pursue an available witness",
          "when": "The party chooses a specific witness or existing record to investigate",
          "line": "With those questions in mind, you seek someone who might have seen a different part of the escape."
        },
        {
          "to": "evening4-route",
          "label": "Return to the town map",
          "when": "Whenever the party leaves or postpones this scene",
          "line": "You leave that matter as it stands and turn back toward the streets of Phandalin. Where do you go next?"
        },
        {
          "to": "next-session-4-review",
          "label": "Stop here and close the evening",
          "when": "The table is ready to stop; unfinished choices remain open",
          "line": "We will stop with that decision still in front of you. Let’s record exactly where everyone is and what remains unfinished."
        }
      ],
      "record": [
        "Gundren’s observed condition, spoken account, agreed care, actual map custody and who heard each fact."
      ],
      "source": "Actual checkpoint; PHB 2014 pp. 178, 276; SRD 5.1 p. 180."
    }
  },
  {
    "id": "s5-rat",
    "title": "Trista’s rat · choose what to investigate",
    "scene": "phandalin-art",
    "read": [
      "The rat’s small nose works at the air around it. Its claws shift as it feels for footing, and its head turns with the nearest movement. It is a living creature in your care, with ordinary needs you can see even before you decide what questions to ask about it.",
      "You can watch its behavior, offer food, examine it or decide that investigating it can wait. Trista, how are you keeping it, and whom—if anyone—do you bring into this?"
    ],
    "ask": [
      "What exactly do you try, and who is allowed to take part?"
    ],
    "run": [
      "Use the existing source-labeled rat and spell references. A standard familiar is celestial, fey or fiend; Speak with Animals does not ordinarily apply.",
      "Find Familiar’s telepathic link works within 100 ft. Possession grants no control or automatic tracking. Detect Magic is not memory, identity or destination detection.",
      "Arcana can interpret justified observations; an inconclusive check is not proof. Do not force disappearance as a scene ending.",
      "Iarno’s future response is a private proposal requiring cause/timing and DM review. If the rat vanishes, record the actual observation separately from an inference about why."
    ],
    "private": [
      "Published DM baseline: loyal to Iarno; rat AC 10, HP 1, speed 20 ft. No automatic rat combat.",
      "LMoP pp. 25–26; PHB 2014 pp. 177–178, 231, 240, 277; SRD pp. 134, 143, 181."
    ],
    "choices": [
      "Ask an available hideout witness",
      "Return to the town map",
      "Stop here and close the evening"
    ],
    "flowVersion": 1,
    "tv": "Private preview first. Show on TV only after selecting the observable scene. No automatic publication.",
    "flow": {
      "purpose": "Decide whether the rat offers useful evidence and what to do with it.",
      "entry": "Trista holds the captured rat. Confirm how it is held and who is present. Adapt description to the actual handling.",
      "reveal": [
        "Only observed behavior, a justified spell result or credible witness testimony. Familiar recognition remains unconfirmed until established."
      ],
      "outcomes": [
        "Useful observation: review what it supports and what it does not.",
        "Inconclusive: seeking a relevant witness or keeping it safely are valid next actions.",
        "Custody/release chosen: review the actual transfer or release and audience."
      ],
      "exits": [
        {
          "to": "s5-redbrand",
          "label": "Ask an available hideout witness",
          "when": "A suitable surviving witness exists and the party chooses to ask",
          "line": "You seek an account from someone who might recognize the animal or its keeper."
        },
        {
          "to": "evening4-route",
          "label": "Return to the town map",
          "when": "Whenever the party leaves or postpones this scene",
          "line": "You leave that matter as it stands and turn back toward the streets of Phandalin. Where do you go next?"
        },
        {
          "to": "next-session-4-review",
          "label": "Stop here and close the evening",
          "when": "The table is ready to stop; unfinished choices remain open",
          "line": "We will stop with that decision still in front of you. Let’s record exactly where everyone is and what remains unfinished."
        }
      ],
      "record": [
        "Observed evidence, recognition if actually established, custody and Trista’s deliberate sharing choices."
      ],
      "source": "LMoP pp. 25–26; PHB 2014 pp. 177–178, 231, 240, 277; SRD pp. 134, 143, 181."
    }
  },
  {
    "id": "s5-redbrand",
    "title": "Witnesses · follow a specific question",
    "scene": "town-phandalin",
    "read": [
      "Tresendar Manor stands above the town, its broken outlines visible beyond the ordinary streets. The place you entered before is still there, but what remains inside depends on what you left behind. The town offers other places to ask questions before you choose to climb back toward it.",
      "You can seek a particular person, compare an account with a document you already hold, or return by a route you know. Which question are you trying to answer, and what evidence do you expect to find?"
    ],
    "ask": [
      "Who or what do you investigate, and what do you ask?"
    ],
    "run": [
      "If alive, present and willing, Droop or a castle-aware bugbear can supply directions. Establish their basis of knowledge and any negotiated terms. Do not resurrect a witness to supply a clue.",
      "The Black Spider letter establishes a relationship with Iarno, not a route. A found custom transfer record concerns Gundren’s earlier transfer, not his present location.",
      "No available witness or inconclusive attempt: Qelline/Reidoth remains a separate credible inquiry. Do not turn a failure into a secret destination reveal.",
      "For hideout return, use Preview return or the original saved session. Preserve dead enemies, searched objects, prisoners, fog, doors and treasure. Conversation becomes combat only if a concrete surviving participant escalates; use existing encounter tools."
    ],
    "private": [
      "Glasstaff is absent from the hideout. His castle destination remains private until independently established.",
      "LMoP pp. 18, 24–28, 32, 35–41; reviewed actual outcomes override the published hostage situation."
    ],
    "choices": [
      "Prepare a chosen departure",
      "Ask Qelline about Reidoth",
      "Return to the town map",
      "Stop here and close the evening"
    ],
    "flowVersion": 1,
    "tv": "Private preview first. Show on TV only after selecting the observable scene. No automatic publication.",
    "flow": {
      "purpose": "Find a reliable next lead without confusing historical transfers with current whereabouts.",
      "entry": "Confirm which witnesses survived, where they are and what the party actually searched. A return to the hideout resumes its saved expedition.",
      "reveal": [
        "An earned castle route and evidence locating Glasstaff are separate discoveries. Neither automatically establishes a mine route."
      ],
      "outcomes": [
        "Credible directions earned: review source and disclosure before preparing travel.",
        "Partial lead: record the question it leaves open and a corroborating source to seek.",
        "No lead: keep it unresolved and offer the independent guide inquiry."
      ],
      "exits": [
        {
          "to": "evening4-ready",
          "label": "Prepare a chosen departure",
          "when": "A usable route is established and the party decides to follow it",
          "line": "With directions you are prepared to trust, you can decide what to carry and when to leave."
        },
        {
          "to": "evening4-qelline",
          "label": "Ask Qelline about Reidoth",
          "when": "The party wants an independent regional source",
          "line": "You leave the unanswered question open and seek Qelline’s knowledge of the surrounding country."
        },
        {
          "to": "evening4-route",
          "label": "Return to the town map",
          "when": "Whenever the party leaves or postpones this scene",
          "line": "You leave that matter as it stands and turn back toward the streets of Phandalin. Where do you go next?"
        },
        {
          "to": "next-session-4-review",
          "label": "Stop here and close the evening",
          "when": "The table is ready to stop; unfinished choices remain open",
          "line": "We will stop with that decision still in front of you. Let’s record exactly where everyone is and what remains unfinished."
        }
      ],
      "record": [
        "Actual witness survival/location, statements, searched records, negotiated promises and distinct route/whereabouts discoveries."
      ],
      "source": "LMoP pp. 18, 24–28, 32, 35–41; reviewed actual outcomes override the published hostage situation."
    }
  },
  {
    "id": "evening4-qelline",
    "title": "Qelline · an independent guide inquiry",
    "scene": "lmop-alderleaf-farm",
    "read": [
      "Alderleaf Farm gives you room to step away from the closer streets of Phandalin. A path leads toward the farmhouse, with the working ground around it providing a quieter place to speak. You can make your presence known before approaching farther.",
      "Qelline Alderleaf turns her attention to your inquiry. There is time to explain what you are looking for rather than merely name a destination. What do you tell her, and what help do you ask for?"
    ],
    "ask": [
      "Are you asking about a guide, a place or something you have witnessed?"
    ],
    "run": [
      "Published baseline: Qelline knows Reidoth and can suggest him for regional sites; he recently went to Thundertree. She does not automatically provide a precise castle map.",
      "If asked about regional knowledge: proposed reply, “Reidoth knows the country. He went toward Thundertree; ask him what he has actually seen.” A clear sensible question needs no mandatory persuasion roll.",
      "Share only the referral actually given. Reidoth’s aid, Venomfang and Thundertree discoveries remain future conversations and encounters.",
      "If declined, let the party return to a witness, their own evidence or ordinary preparations. The guide route is optional."
    ],
    "private": [
      "LMoP p. 18 (Qelline), p. 32 (Reidoth); original connective narration."
    ],
    "choices": [
      "Prepare to seek Reidoth",
      "Return to the town map",
      "Stop here and close the evening"
    ],
    "flowVersion": 1,
    "tv": "Private preview first. Show on TV only after selecting the observable scene. No automatic publication.",
    "flow": {
      "purpose": "Find someone who can help answer regional-location questions.",
      "entry": "The party chooses to visit Qelline. This is a future meeting, not an established referral or completed relationship.",
      "reveal": [
        "A possible guide and his reported destination. This locates a lead, not Glasstaff, the mine or every dangerous site."
      ],
      "outcomes": [
        "Referral accepted: prepare the Thundertree approach as the chosen lead.",
        "Information heard but departure postponed: record it without a visit.",
        "Referral declined: keep other available inquiries open."
      ],
      "exits": [
        {
          "to": "evening4-ready",
          "label": "Prepare to seek Reidoth",
          "when": "Qelline’s referral is actually heard and the party chooses it",
          "line": "With a person to seek and a reported destination, you turn to the practical question of the journey."
        },
        {
          "to": "evening4-route",
          "label": "Return to the town map",
          "when": "Whenever the party leaves or postpones this scene",
          "line": "You leave that matter as it stands and turn back toward the streets of Phandalin. Where do you go next?"
        },
        {
          "to": "next-session-4-review",
          "label": "Stop here and close the evening",
          "when": "The table is ready to stop; unfinished choices remain open",
          "line": "We will stop with that decision still in front of you. Let’s record exactly where everyone is and what remains unfinished."
        }
      ],
      "record": [
        "What Qelline actually said, who heard it, any lodging/help actually agreed and whether the party chose the lead."
      ],
      "source": "LMoP p. 18 (Qelline), p. 32 (Reidoth); original connective narration."
    }
  },
  {
    "id": "evening4-route",
    "title": "Town map · choose the next useful action",
    "scene": "town-phandalin",
    "read": [
      "Phandalin’s streets bring you back within reach of shops, familiar doors and the ways out of town. Somewhere nearby, ordinary work continues. You can take stock here without treating every unfinished matter as a demand to leave immediately.",
      "What you have learned may have changed your priorities; what remains uncertain can still be investigated. Which concern do you want to act on now, and what would count as useful progress?"
    ],
    "ask": [
      "What is your next aim, based on what you actually know?"
    ],
    "run": [
      "Recap only approved party-known information. Offer two or three relevant options, not every campaign marker.",
      "If they are stuck: repeat the immediate concerns; ask what question they want answered; offer an available independent source. Do not supply an unseen conclusion.",
      "If they go elsewhere, open the existing atlas/scene or make a private improv note. The cleared orc camp remains cleared and Kost absent; no automatic new threat.",
      "Use services or a reviewed rest when requested. Rest, purchases and promises remain explicit changes."
    ],
    "private": [
      "Lost Mine of Phandelver (2014), pp. 14–19; actual checkpoint confirmed 9 October 2026."
    ],
    "choices": [
      "Business at Barthen’s",
      "Check on Gundren",
      "Investigate the rat",
      "Investigate a witness or record",
      "Speak with Qelline",
      "Prepare departure",
      "Stop here and close the evening"
    ],
    "flowVersion": 1,
    "tv": "Private preview first. Show on TV only after selecting the observable scene. No automatic publication.",
    "flow": {
      "purpose": "Keep the next decision grounded in known information.",
      "entry": "Use between encounters or when a lead is postponed. This card grants no new knowledge.",
      "reveal": [
        "Only established knowledge; this is an organizing scene, not a source of testimony."
      ],
      "outcomes": [
        "Aim chosen: open its linked scene.",
        "No aim chosen: allow a pause or ordinary town activity.",
        "Evening ended: record the actual stop without forcing departure."
      ],
      "exits": [
        {
          "to": "s5-barthen",
          "label": "Business at Barthen’s",
          "when": "They choose supplies, news or a delivery",
          "line": "You make your way back to Barthen’s Provisions."
        },
        {
          "to": "s5-inn",
          "label": "Check on Gundren",
          "when": "They choose to see him",
          "line": "You return toward the inn where Gundren was left."
        },
        {
          "to": "s5-rat",
          "label": "Investigate the rat",
          "when": "Trista chooses it",
          "line": "You make space to attend to the rat and decide who should take part."
        },
        {
          "to": "s5-redbrand",
          "label": "Investigate a witness or record",
          "when": "A specific source is available or can be sought",
          "line": "You set out to test a particular account rather than rely on rumor."
        },
        {
          "to": "evening4-qelline",
          "label": "Speak with Qelline",
          "when": "They choose the regional-guide inquiry",
          "line": "You head toward Alderleaf Farm to ask about the surrounding land."
        },
        {
          "to": "evening4-ready",
          "label": "Prepare departure",
          "when": "A usable route or guide lead has been earned and chosen",
          "line": "You gather what you need for the journey you have chosen."
        },
        {
          "to": "next-session-4-review",
          "label": "Stop here and close the evening",
          "when": "The table is ready to stop; unfinished choices remain open",
          "line": "We will stop with that decision still in front of you. Let’s record exactly where everyone is and what remains unfinished."
        }
      ],
      "record": [
        "An actual chosen objective or improvised entry; browsing records no visit or discovery."
      ],
      "source": "Lost Mine of Phandelver (2014), pp. 14–19; actual checkpoint confirmed 9 October 2026."
    }
  },
  {
    "id": "evening4-ready",
    "title": "Departure · follow the lead they chose",
    "scene": "region-lmop",
    "read": [
      "Before leaving Phandalin, there is room to lay out what you intend to carry. Rope, provisions and light will each take space, and the way back matters as much as the direction ahead. You can settle those choices while familiar doors are still within reach.",
      "The next journey begins with the lead you chose. Who travels with you, who takes the front, and what will make you stop or turn back? Say what you are setting out to do before the town falls behind you."
    ],
    "ask": [
      "Which earned lead are you following, and what is your return plan?"
    ],
    "run": [
      "Review actual HP, supplies, spell slots and lights. Use existing rest/purchase reviews; opening the pack refills nothing.",
      "A castle route does not establish Glasstaff’s presence; Qelline’s referral leads to a conversation with Reidoth, not an automatic dungeon entrance.",
      "Use the existing regional journey and Session 5 package once departure is chosen. If an existing expedition is being resumed, use its saved state.",
      "This is a natural stopping point. Continuing tonight or delaying departure is equally valid."
    ],
    "private": [
      "Next package: Session 5 · Leads and Cragmaw Castle. Open it deliberately; it is not automatically launched or published.",
      "Lost Mine of Phandelver (2014), pp. 14–19; actual checkpoint confirmed 9 October 2026."
    ],
    "choices": [
      "Return to the town map",
      "Stop here and close the evening"
    ],
    "flowVersion": 1,
    "tv": "Private preview first. Show on TV only after selecting the observable scene. No automatic publication.",
    "flow": {
      "purpose": "Choose supplies, companions and return conditions for an earned journey.",
      "entry": "Confirm the route/guide lead, its source and player choice. If missing, return to inquiry; no destination is automatically unlocked.",
      "reveal": [
        "No information beyond the chosen approved route or referral."
      ],
      "outcomes": [
        "Ready and leaving: stage the relevant travel scene after reviewing the destination.",
        "Preparing but staying: retain the lead without recording travel.",
        "Lead unsubstantiated: return to the appropriate inquiry."
      ],
      "exits": [
        {
          "to": "evening4-route",
          "label": "Return to the town map",
          "when": "Whenever the party leaves or postpones this scene",
          "line": "You leave that matter as it stands and turn back toward the streets of Phandalin. Where do you go next?"
        },
        {
          "to": "next-session-4-review",
          "label": "Stop here and close the evening",
          "when": "The table is ready to stop; unfinished choices remain open",
          "line": "We will stop with that decision still in front of you. Let’s record exactly where everyone is and what remains unfinished."
        }
      ],
      "record": [
        "Actual destination choice, supplies bought/spent, companions, promises, actual departure and stopping position."
      ],
      "source": "Lost Mine of Phandelver (2014), pp. 14–19; actual checkpoint confirmed 9 October 2026."
    }
  },
  {
    "id": "next-session-4-review",
    "title": "Close · record this evening",
    "scene": "town-phandalin",
    "read": [
      "The evening’s choices have brought you to a stopping point. Some questions may have answers now; others may still be waiting on a person, a journey or a decision. Take a moment to say what your characters intend to do next.",
      "Where exactly do we leave everyone, and what is the first thing you want to attempt when we return? We will keep the unfinished matters open and begin from what actually happened."
    ],
    "ask": [
      "Where did play stop, and what do you want to attempt next?"
    ],
    "run": [
      "Use existing closing review and restore point. Record HP/resources, treasure/custody, discoveries, promises, NPC outcomes and unresolved requests.",
      "Review each audience and consequence. Main quest remains on TV, shared side quests on phones, character quests owner-only; retain Active and Completed views.",
      "Draft a recap only from reviewed events. Keep Glasstaff’s destination, Trista’s token and all unsupported conclusions private."
    ],
    "private": [
      "Lost Mine of Phandelver (2014), pp. 14–19; actual checkpoint confirmed 9 October 2026."
    ],
    "choices": [
      "Return to the town map"
    ],
    "flowVersion": 1,
    "tv": "Private preview first. Show on TV only after selecting the observable scene. No automatic publication.",
    "flow": {
      "purpose": "Capture actual changes and the next starting position.",
      "entry": "The table chooses to stop. No prepared outcome is presumed.",
      "reveal": [
        "Only an approved recap can become player-facing."
      ],
      "outcomes": [
        "Reviewed close: save the stopping point and next intended action.",
        "Unresolved item: carry it forward explicitly; no forced resolution."
      ],
      "exits": [
        {
          "to": "evening4-route",
          "label": "Return to the town map",
          "when": "Whenever the party leaves or postpones this scene",
          "line": "You leave that matter as it stands and turn back toward the streets of Phandalin. Where do you go next?"
        }
      ],
      "record": [
        "The stopping scene, character states, remaining decisions and next intended action."
      ],
      "source": "Lost Mine of Phandelver (2014), pp. 14–19; actual checkpoint confirmed 9 October 2026."
    }
  }
];for(const row of rows)for(const e of row.flow.exits)if(e.label==='Return to the town map'){e.navigation='map';e.mapId='town-phandalin';}const pack=globalThis.ECHO_CONTENT_PACKS?.find(p=>p.id==='next-session-4');if(pack){pack.runbook=rows.map(({flow,...b})=>structuredClone(b));pack.beats=rows.map(b=>b.id);pack.scenes=[...new Set([...pack.scenes,...rows.map(b=>b.scene)])];pack.description='Connected scene preparation: Arrive, Describe, Respond, Resolve, Continue. Private audit available; no events or rewards are assumed.';pack.preparationVersion=1;pack.preparationAudit='../audits/session4-flow/Audit.html';pack.preparationLabel='Session 4';}globalThis.ECHO_SESSION4_FLOW={version:1,rows,byId:Object.fromEntries(rows.map(b=>[b.id,b.flow]))};})();
