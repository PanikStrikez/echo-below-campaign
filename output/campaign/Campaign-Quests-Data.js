(() => { 'use strict'; globalThis.ECHO_QUEST_CATALOG = {
  "version": 1,
  "acts": [
    {
      "id": "prologue",
      "title": "The Missing Rockseeker"
    },
    {
      "id": "home",
      "title": "A Foothold Below"
    },
    {
      "id": "guests",
      "title": "The Host’s Experiments"
    },
    {
      "id": "family",
      "title": "The Unfinished Home"
    },
    {
      "id": "cost",
      "title": "The Cost of Returning"
    },
    {
      "id": "ending",
      "title": "What Remains"
    }
  ],
  "quests": [
    {
      "id": "echo-below",
      "title": "The Echo Below",
      "kind": "main",
      "act": "all",
      "owner": "",
      "parent": "",
      "goal": "Investigate the discoveries connected to Phandalin and decide what to do as their consequences become clear.",
      "steps": [
        {
          "id": "echo-below-1",
          "title": "Investigate the Phandalin discoveries",
          "guide": "Follow Gundren and the Black Spider investigation; record the actual mine outcome."
        },
        {
          "id": "echo-below-2",
          "title": "Follow the Waterdeep connection",
          "guide": "Use surviving records, testimony, or comparison of actual observations. No specific object is compulsory."
        },
        {
          "id": "echo-below-3",
          "title": "Identify the experiments",
          "guide": "Compare local incidents and independent accounts before attributing them to Halaster."
        },
        {
          "id": "echo-below-4",
          "title": "Understand Looking Glass",
          "guide": "Establish the reconstruction behavior, family history, and limits of the evidence."
        },
        {
          "id": "echo-below-5",
          "title": "Protect the threatened district",
          "guide": "Verify the physical connection and prepare a chosen intervention with residents."
        },
        {
          "id": "echo-below-6",
          "title": "Resolve the project’s future",
          "guide": "Record the chosen combination of endings and the continuing consequences."
        }
      ],
      "leads": [
        "Continue the Redbrand investigation.",
        "Compare discovered records with independent witnesses."
      ],
      "dm": "Halaster seeks to restore Ilyra and Tavin. Environmental contradictions destabilize Looking Glass. The apparatus threatens the modern district; original souls versus reconstructed people remains unresolved.",
      "reward": "A resolved immediate threat and player-chosen futures.",
      "fallback": "No single clue, NPC, satellite, object, or character is mandatory.",
      "requires": [],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "act-prologue",
      "title": "The Missing Rockseeker",
      "kind": "act",
      "act": "prologue",
      "owner": "",
      "parent": "echo-below",
      "goal": "Resolve the rescue investigation and immediate conflict around the mine.",
      "steps": [
        {
          "id": "act-prologue-1",
          "title": "Trace Gundren’s abduction",
          "guide": "The party recovered Gundren and left him at an inn. Confirm his condition and what he can tell them when able; the castle destination remains private until learned."
        },
        {
          "id": "act-prologue-2",
          "title": "Resolve the rescue attempt",
          "guide": "Gundren is no longer a captive at the castle. Confirm his condition and safety at the inn; follow the gang, map, and mine leads only if the party chooses them."
        },
        {
          "id": "act-prologue-3",
          "title": "Address the mine conflict",
          "guide": "Resolve Nezznar and the Forge without assuming survival, ownership, or an automatic magical item."
        },
        {
          "id": "act-prologue-4",
          "title": "Return and settle promises",
          "guide": "Record Phandalin consequences, custody and two available Waterdeep leads."
        }
      ],
      "leads": [
        "Question a witness or examine Redbrand correspondence.",
        "Continue the prepared Phandelver runbook.",
        "Check the actual delivery and town business at Barthen’s Provisions before following a new lead."
      ],
      "dm": "Latest played Redbrand session: Glasstaff put Gundren to sleep; the party recovered him and left him at an unnamed inn. Trista holds the captured rat. The party stopped at Barthen’s Provisions. Glasstaff escaped to Cragmaw Castle, but the destination is DM-only. Gundren’s present condition is unreported. Nezznar is independent of Halaster.",
      "reward": "Phandalin relationships, earned rewards, and a route into the next chapter.",
      "fallback": "Resolve actual outcomes, including setbacks; use alternate sources when a lead is lost.",
      "requires": [],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "act-home",
      "title": "A Foothold Below",
      "kind": "act",
      "act": "home",
      "owner": "",
      "parent": "echo-below",
      "goal": "Establish a home and a dependable starting point for exploring Undermountain.",
      "steps": [
        {
          "id": "act-home-1",
          "title": "Find a place to return to",
          "guide": "Dracuseth introduces the courtyard; negotiate lodging and meet two residents."
        },
        {
          "id": "act-home-2",
          "title": "Undertake a bounded expedition",
          "guide": "Choose a Portal contract with a destination, return contact and turnaround conditions."
        },
        {
          "id": "act-home-3",
          "title": "Establish a useful connection",
          "guide": "Record an earned relationship or usable return route."
        },
        {
          "id": "act-home-4",
          "title": "Compare the first observations",
          "guide": "Investigate what the party actually observed without naming undiscovered projects."
        }
      ],
      "leads": [
        "Ask Dracuseth about lodging.",
        "Choose a short Portal contract."
      ],
      "dm": "Proposed courtyard name Mending Court. Run ordinary returns before the first anomaly. Start the main dungeon around appropriate level-5 readiness.",
      "reward": "A home, a reliable starting route and local trust.",
      "fallback": "Resolve actual outcomes, including setbacks; use alternate sources when a lead is lost.",
      "requires": [
        "act-prologue"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "act-guests",
      "title": "The Host’s Experiments",
      "kind": "act",
      "act": "guests",
      "owner": "",
      "parent": "echo-below",
      "goal": "Determine who is changing dungeon conditions and how explorers are affected.",
      "steps": [
        {
          "id": "act-guests-1",
          "title": "Compare changed routes",
          "guide": "Use dated maps, witnesses and physical evidence."
        },
        {
          "id": "act-guests-2",
          "title": "Hear the survivor",
          "guide": "Offer a voluntary meeting and corroborate one experiment."
        },
        {
          "id": "act-guests-3",
          "title": "Address the host",
          "guide": "Meet Halaster after credible attention and state boundaries if desired."
        },
        {
          "id": "act-guests-4",
          "title": "Choose a working relationship",
          "guide": "Record terms accepted, rejected, or left open; no requirement to cooperate."
        }
      ],
      "leads": [
        "Compare expedition logs.",
        "Follow a witness lead from Lantern House."
      ],
      "dm": "Halaster is a courteous host who considers guests available subjects. Show a concrete boundary violation with recoverable navigation.",
      "reward": "Evidence, agreements, and a basis for judging future offers.",
      "fallback": "Resolve actual outcomes, including setbacks; use alternate sources when a lead is lost.",
      "requires": [
        "act-home"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "act-family",
      "title": "The Unfinished Home",
      "kind": "act",
      "act": "family",
      "owner": "",
      "parent": "echo-below",
      "goal": "Identify the abandoned project and the people it concerns.",
      "steps": [
        {
          "id": "act-family-1",
          "title": "Identify the project",
          "guide": "Research an actual fragment or witnessed reconstruction."
        },
        {
          "id": "act-family-2",
          "title": "Find the family’s independent history",
          "guide": "Use repaired books, maps, letters and civic records."
        },
        {
          "id": "act-family-3",
          "title": "Test the reconstruction’s limits",
          "guide": "Compare predictions and observations under bounded conditions."
        },
        {
          "id": "act-family-4",
          "title": "Establish what remains unknown",
          "guide": "Distinguish private recognition from proof an original soul returned."
        }
      ],
      "leads": [
        "Compare research records.",
        "Seek an independent historical account."
      ],
      "dm": "Ilyra and Tavin have lives beyond Halaster. Reveal names when earned. The model roof discrepancy shows changed detail, not proof of non-personhood.",
      "reward": "A defensible explanation and new intervention leads.",
      "fallback": "Resolve actual outcomes, including setbacks; use alternate sources when a lead is lost.",
      "requires": [
        "act-guests"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "act-cost",
      "title": "The Cost of Returning",
      "kind": "act",
      "act": "cost",
      "owner": "",
      "parent": "echo-below",
      "goal": "Determine who is endangered and prepare informed alternatives.",
      "steps": [
        {
          "id": "act-cost-1",
          "title": "Understand the catastrophe",
          "guide": "Corroborate incompatible wards and the evacuation effort."
        },
        {
          "id": "act-cost-2",
          "title": "Survey the threatened district",
          "guide": "Pair local observations with actual apparatus connections."
        },
        {
          "id": "act-cost-3",
          "title": "Develop interventions",
          "guide": "Select useful site knowledge, local tests or independent research."
        },
        {
          "id": "act-cost-4",
          "title": "Prepare with residents",
          "guide": "Agree warnings, routes, assistance and a response to foreseeable failures."
        }
      ],
      "leads": [
        "Compare a building survey with apparatus records.",
        "Consult residents and people affected by earlier tests."
      ],
      "dm": "Physical apparatus anchors explain why the modern district is used. Historical location and initiating emergency are still open.",
      "reward": "Tested options, allies, and practical preparations.",
      "fallback": "Resolve actual outcomes, including setbacks; use alternate sources when a lead is lost.",
      "requires": [
        "act-family"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "act-ending",
      "title": "What Remains",
      "kind": "act",
      "act": "ending",
      "owner": "",
      "parent": "echo-below",
      "goal": "Carry out the party’s chosen response and record its consequences.",
      "steps": [
        {
          "id": "act-ending-1",
          "title": "Choose and review a plan",
          "guide": "Review the five supported approaches, uncertainty, consent and fallback."
        },
        {
          "id": "act-ending-2",
          "title": "Act on the apparatus and opposition",
          "guide": "Negotiation, force and technical intervention may overlap."
        },
        {
          "id": "act-ending-3",
          "title": "Protect people during the outcome",
          "guide": "Evacuation and containment remain meaningful even after activation."
        },
        {
          "id": "act-ending-4",
          "title": "Settle what follows",
          "guide": "Record research custody, continuing hazards and each player’s chosen future."
        }
      ],
      "leads": [
        "Review the verified intervention options.",
        "Ask allies what help they can actually provide."
      ],
      "dm": "Halaster rejuvenates under the published rules. Securing the apparatus is separate from defeating him. Do not presume the knot can be destroyed.",
      "reward": "A changed world and an ending grounded in player choices.",
      "fallback": "Resolve actual outcomes, including setbacks; use alternate sources when a lead is lost.",
      "requires": [
        "act-cost"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "gundren",
      "title": "Find Gundren",
      "kind": "side",
      "act": "prologue",
      "owner": "",
      "parent": "act-prologue",
      "goal": "Check on Gundren at the inn, learn what he knows, and decide how to respond to Glasstaff’s escape.",
      "steps": [
        {
          "id": "gundren-1",
          "title": "Establish the current situation",
          "guide": "Gundren is at an unnamed inn. Confirm his current condition, what he witnessed, and whether the party found any documents or other leads."
        },
        {
          "id": "gundren-2",
          "title": "Resolve the immediate objective",
          "guide": "Do not place Gundren at Cragmaw Castle. Glasstaff fled there; the party has not learned that destination."
        },
        {
          "id": "gundren-3",
          "title": "Record the outcome and follow-up",
          "guide": "Record Gundren’s condition at the inn, safety, promises, and who knows what; do not presume the objective is complete."
        }
      ],
      "leads": [
        "Ask Gundren what he remembers once he can speak; do not invent his answer.",
        "Compare the account with an independent record or witness."
      ],
      "dm": "The party left Gundren at an unnamed inn after Glasstaff put him to sleep. Glasstaff fled to Cragmaw Castle; the destination is DM-only. Trista holds his captured rat. The party stopped at Barthen’s Provisions. Gundren’s present condition is unreported.",
      "reward": "Record Gundren’s condition and safety at the inn, promises, and any earned leads before completing this quest.",
      "fallback": "Retreat, negotiation, a surviving document or a later witness can preserve progress.",
      "requires": [],
      "legacy": "gundren",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "sildar",
      "title": "Rescue Sildar",
      "kind": "side",
      "act": "prologue",
      "owner": "",
      "parent": "act-prologue",
      "goal": "Resolve Sildar’s captivity and immediate safety.",
      "steps": [
        {
          "id": "sildar-1",
          "title": "Establish the current situation",
          "guide": "Review the confirmed rescue record."
        },
        {
          "id": "sildar-2",
          "title": "Resolve the immediate objective",
          "guide": "Already rescued through the Yeemik bargain."
        },
        {
          "id": "sildar-3",
          "title": "Record the outcome and follow-up",
          "guide": "Sildar accompanied the party; his later actions follow what he knows."
        }
      ],
      "leads": [
        "Review the confirmed rescue record.",
        "Compare the account with an independent record or witness."
      ],
      "dm": "Already rescued through the Yeemik bargain.",
      "reward": "Sildar accompanied the party; his later actions follow what he knows.",
      "fallback": "Retreat, negotiation, a surviving document or a later witness can preserve progress.",
      "requires": [],
      "legacy": "sildar",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "redbrands",
      "title": "The Redbrand Threat",
      "kind": "side",
      "act": "prologue",
      "owner": "",
      "parent": "act-prologue",
      "goal": "Investigate the abduction and address the threat in Phandalin.",
      "steps": [
        {
          "id": "redbrands-1",
          "title": "Establish the current situation",
          "guide": "Review what actually happened in the hideout. Glasstaff escaped; Gundren is at an unnamed inn and Trista holds the captured rat. Confirm surviving prisoners, searched rooms, and recovered orders before using them."
        },
        {
          "id": "redbrands-2",
          "title": "Resolve the immediate objective",
          "guide": "Address surviving Redbrand pressure or pursue an earned lead. Do not respawn defeated occupants or return Glasstaff to the hideout."
        },
        {
          "id": "redbrands-3",
          "title": "Record the outcome and follow-up",
          "guide": "Record who survived, escaped or was rescued and how town responds."
        }
      ],
      "leads": [
        "Question a surviving witness or examine documents actually recovered from the hideout.",
        "Compare the account with an independent record or witness.",
        "Examine the captured rat with Trista’s consent; separate observed behavior from guesses about its nature."
      ],
      "dm": "The party entered the hideout and Glasstaff escaped. The fates of individual prisoners, searched rooms, and treasure were not supplied. Gundren was left at an unnamed inn, and Trista holds the rat. Glasstaff’s castle destination is DM-only until discovered.",
      "reward": "Record who survived, escaped or was rescued and how town responds.",
      "fallback": "Retreat, negotiation, a surviving document or a later witness can preserve progress.",
      "requires": [],
      "legacy": "redbrands",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "orc-camp",
      "title": "The Orc Camp",
      "kind": "side",
      "act": "prologue",
      "owner": "",
      "parent": "act-prologue",
      "goal": "Resolve the camp threat and account for any promised reward.",
      "steps": [
        {
          "id": "orc-camp-1",
          "title": "Establish the current situation",
          "guide": "Review the completed camp report; ask the actual employer about payment."
        },
        {
          "id": "orc-camp-2",
          "title": "Resolve the immediate objective",
          "guide": "Camp killed. Individual fates, quantities and reward collection are unknown."
        },
        {
          "id": "orc-camp-3",
          "title": "Record the outcome and follow-up",
          "guide": "Award only verified rewards; keep payment separate from combat completion."
        }
      ],
      "leads": [
        "Review the completed camp report; ask the actual employer about payment.",
        "Compare the account with an independent record or witness."
      ],
      "dm": "Camp killed. Individual fates, quantities and reward collection are unknown.",
      "reward": "Award only verified rewards; keep payment separate from combat completion.",
      "fallback": "Retreat, negotiation, a surviving document or a later witness can preserve progress.",
      "requires": [],
      "legacy": "orc-camp",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "black-spider",
      "title": "Investigate the Black Spider",
      "kind": "side",
      "act": "prologue",
      "owner": "",
      "parent": "act-prologue",
      "goal": "Establish the Spider’s aims and respond to the mine operation.",
      "steps": [
        {
          "id": "black-spider-1",
          "title": "Establish the current situation",
          "guide": "Compare captured correspondence; ask a credible witness."
        },
        {
          "id": "black-spider-2",
          "title": "Resolve the immediate objective",
          "guide": "Existence known; identity, location and full plan not confirmed."
        },
        {
          "id": "black-spider-3",
          "title": "Record the outcome and follow-up",
          "guide": "Surviving papers can preserve the lead if Nezznar dies or escapes."
        }
      ],
      "leads": [
        "Compare captured correspondence; ask a credible witness.",
        "Compare the account with an independent record or witness."
      ],
      "dm": "Existence known; identity, location and full plan not confirmed.",
      "reward": "Surviving papers can preserve the lead if Nezznar dies or escapes.",
      "fallback": "Retreat, negotiation, a surviving document or a later witness can preserve progress.",
      "requires": [],
      "legacy": "black-spider",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "old-owl",
      "title": "Old Owl Well",
      "kind": "side",
      "act": "prologue",
      "owner": "",
      "parent": "act-prologue",
      "goal": "Investigate the ruins and Kost’s disappearance if the party chooses.",
      "steps": [
        {
          "id": "old-owl-1",
          "title": "Establish the current situation",
          "guide": "Revisit a witnessed trace; ask an independent traveler."
        },
        {
          "id": "old-owl-2",
          "title": "Resolve the immediate objective",
          "guide": "Hamun Kost disappeared without fighting. Method and destination remain unknown."
        },
        {
          "id": "old-owl-3",
          "title": "Record the outcome and follow-up",
          "guide": "An accountable report; no compulsory pursuit or invented death."
        }
      ],
      "leads": [
        "Revisit a witnessed trace; ask an independent traveler.",
        "Compare the account with an independent record or witness."
      ],
      "dm": "Hamun Kost disappeared without fighting. Method and destination remain unknown.",
      "reward": "An accountable report; no compulsory pursuit or invented death.",
      "fallback": "Retreat, negotiation, a surviving document or a later witness can preserve progress.",
      "requires": [],
      "legacy": "old-owl",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "wave-echo",
      "title": "Wave Echo Cave",
      "kind": "side",
      "act": "prologue",
      "owner": "",
      "parent": "act-prologue",
      "goal": "Reach the mine, investigate Nundro’s fate and decide the Forge’s future.",
      "steps": [
        {
          "id": "wave-echo-1",
          "title": "Establish the current situation",
          "guide": "Follow earned directions; negotiate or explore the published cave."
        },
        {
          "id": "wave-echo-2",
          "title": "Resolve the immediate objective",
          "guide": "Do not presume Gundren, Nundro, Nezznar or the Forge outcome."
        },
        {
          "id": "wave-echo-3",
          "title": "Record the outcome and follow-up",
          "guide": "Agree custody and future access with actual survivors."
        }
      ],
      "leads": [
        "Follow earned directions; negotiate or explore the published cave.",
        "Compare the account with an independent record or witness."
      ],
      "dm": "Do not presume Gundren, Nundro, Nezznar or the Forge outcome.",
      "reward": "Agree custody and future access with actual survivors.",
      "fallback": "Retreat, negotiation, a surviving document or a later witness can preserve progress.",
      "requires": [],
      "legacy": "wave-echo",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "route",
      "title": "A Map Worth Paying For",
      "kind": "side",
      "act": "home",
      "owner": "",
      "parent": "act-home",
      "goal": "Survey a bounded section of the dungeon for an agreed fee.",
      "steps": [
        {
          "id": "route-1",
          "title": "Agree the scope",
          "guide": "Ilvara commissions an accurate route, including hazards and turnaround conditions."
        },
        {
          "id": "route-2",
          "title": "Investigate and choose an approach",
          "guide": "Prepare the entrywell and reachable rooms from the book. A report of a blocked route can satisfy an honest contract."
        },
        {
          "id": "route-3",
          "title": "Deliver an outcome",
          "guide": "Payment agreed before departure; a usable map and professional credibility."
        }
      ],
      "leads": [
        "Ilvara commissions an accurate route, including hazards and turnaround conditions.",
        "Seek an independent account or negotiate directly with the people affected."
      ],
      "dm": "Prepare the entrywell and reachable rooms from the book. A report of a blocked route can satisfy an honest contract. Pebble marks routes; Ringgo negotiates fair terms.",
      "reward": "Payment agreed before departure; a usable map and professional credibility.",
      "fallback": "A documented failure, compromise or alternative route can lead forward. Record unpaid rewards and unfinished promises separately.",
      "requires": [
        "act-home"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "instrument",
      "title": "The Missing Instrument",
      "kind": "side",
      "act": "home",
      "owner": "",
      "parent": "act-home",
      "goal": "Recover Orren’s instrument or establish its fate.",
      "steps": [
        {
          "id": "instrument-1",
          "title": "Agree the scope",
          "guide": "Orren gives a description and last reliable location; the current holder may have a salvage claim."
        },
        {
          "id": "instrument-2",
          "title": "Investigate and choose an approach",
          "guide": "Place the object only in a compatible room after reviewing the keyed map. Kestrel may have a competing contract."
        },
        {
          "id": "instrument-3",
          "title": "Deliver an outcome",
          "guide": "Agreed payment or workshop assistance; a resolved ownership question."
        }
      ],
      "leads": [
        "Orren gives a description and last reliable location; the current holder may have a salvage claim.",
        "Seek an independent account or negotiate directly with the people affected."
      ],
      "dm": "Place the object only in a compatible room after reviewing the keyed map. Kestrel may have a competing contract. Maker marks can introduce Pebble’s colleague; Donavan compares samples.",
      "reward": "Agreed payment or workshop assistance; a resolved ownership question.",
      "fallback": "A documented failure, compromise or alternative route can lead forward. Record unpaid rewards and unfinished promises separately.",
      "requires": [
        "act-home"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "passage",
      "title": "Terms of Passage",
      "kind": "side",
      "act": "home",
      "owner": "",
      "parent": "act-home",
      "goal": "Arrange dependable access through occupied territory.",
      "steps": [
        {
          "id": "passage-1",
          "title": "Agree the scope",
          "guide": "Ask the actual occupants what safe passage would require."
        },
        {
          "id": "passage-2",
          "title": "Investigate and choose an approach",
          "guide": "Use published faction interests. Clearing one group may attract another; safe access is not automatic."
        },
        {
          "id": "passage-3",
          "title": "Deliver an outcome",
          "guide": "Access under recorded terms and a relationship."
        }
      ],
      "leads": [
        "Ask the actual occupants what safe passage would require.",
        "Seek an independent account or negotiate directly with the people affected."
      ],
      "dm": "Use published faction interests. Clearing one group may attract another; safe access is not automatic. Pebble verifies the return route; Ringgo negotiates without compulsory violence.",
      "reward": "Access under recorded terms and a relationship.",
      "fallback": "A documented failure, compromise or alternative route can lead forward. Record unpaid rewards and unfinished promises separately.",
      "requires": [
        "act-home"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "second-opinion",
      "title": "An Honest Second Opinion",
      "kind": "side",
      "act": "guests",
      "owner": "",
      "parent": "act-guests",
      "goal": "Help the Gilded Compass evaluate a suspicious delivery.",
      "steps": [
        {
          "id": "second-opinion-1",
          "title": "Agree the scope",
          "guide": "Kestrel wants a discreet review before fulfilling an unopened-delivery contract."
        },
        {
          "id": "second-opinion-2",
          "title": "Investigate and choose an approach",
          "guide": "Neither crew must betray the other. Establish what examination is authorized and who owns the object."
        },
        {
          "id": "second-opinion-3",
          "title": "Deliver an outcome",
          "guide": "Trust, shared evidence or an honestly recorded disagreement."
        }
      ],
      "leads": [
        "Kestrel wants a discreet review before fulfilling an unopened-delivery contract.",
        "Seek an independent account or negotiate directly with the people affected."
      ],
      "dm": "Neither crew must betray the other. Establish what examination is authorized and who owns the object. Donavan tests a claim; Trista helps negotiate access.",
      "reward": "Trust, shared evidence or an honestly recorded disagreement.",
      "fallback": "A documented failure, compromise or alternative route can lead forward. Record unpaid rewards and unfinished promises separately.",
      "requires": [
        "act-guests"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "courtyard",
      "title": "A Place at the Table",
      "kind": "side",
      "act": "home",
      "owner": "",
      "parent": "act-home",
      "goal": "Help neighbors solve a practical problem they identify.",
      "steps": [
        {
          "id": "courtyard-1",
          "title": "Agree the scope",
          "guide": "Offer repairs, delivery help or a shared-workspace arrangement after asking what residents want."
        },
        {
          "id": "courtyard-2",
          "title": "Investigate and choose an approach",
          "guide": "Start with ordinary life. The proposed residents are Nessa, Orenna, Jori and Pellan, and Aven; introduce two first."
        },
        {
          "id": "courtyard-3",
          "title": "Deliver an outcome",
          "guide": "A visible improvement and neighbors who remember the party’s help."
        }
      ],
      "leads": [
        "Offer repairs, delivery help or a shared-workspace arrangement after asking what residents want.",
        "Seek an independent account or negotiate directly with the people affected."
      ],
      "dm": "Start with ordinary life. The proposed residents are Nessa, Orenna, Jori and Pellan, and Aven; introduce two first. Any character can choose a contribution; do not force social participation.",
      "reward": "A visible improvement and neighbors who remember the party’s help.",
      "fallback": "A documented failure, compromise or alternative route can lead forward. Record unpaid rewards and unfinished promises separately.",
      "requires": [
        "act-home"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "survivor",
      "title": "The Survivor’s Records",
      "kind": "side",
      "act": "guests",
      "owner": "",
      "parent": "act-guests",
      "goal": "Recover a former participant’s records and investigate another participant’s fate.",
      "steps": [
        {
          "id": "survivor-1",
          "title": "Agree the scope",
          "guide": "Lantern House can arrange a meeting; an independent expedition log offers another route."
        },
        {
          "id": "survivor-2",
          "title": "Investigate and choose an approach",
          "guide": "The survivor volunteered for a bounded test, asked to leave, and was kept inside. They know one experiment, not the entire project."
        },
        {
          "id": "survivor-3",
          "title": "Deliver an outcome",
          "guide": "Corroborated evidence and cooperation, without demanding forgiveness."
        }
      ],
      "leads": [
        "Lantern House can arrange a meeting; an independent expedition log offers another route.",
        "Seek an independent account or negotiate directly with the people affected."
      ],
      "dm": "The survivor volunteered for a bounded test, asked to leave, and was kept inside. They know one experiment, not the entire project. Aldric can compare evidence of consent; the survivor has their own present needs.",
      "reward": "Corroborated evidence and cooperation, without demanding forgiveness.",
      "fallback": "A documented failure, compromise or alternative route can lead forward. Record unpaid rewards and unfinished promises separately.",
      "requires": [
        "act-guests"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "ward-records",
      "title": "The Warnings Nobody Combined",
      "kind": "side",
      "act": "cost",
      "owner": "",
      "parent": "act-cost",
      "goal": "Reconstruct how the civic protection system failed.",
      "steps": [
        {
          "id": "ward-records-1",
          "title": "Agree the scope",
          "guide": "Compare maintenance changes, an independent account and evacuation notes."
        },
        {
          "id": "ward-records-2",
          "title": "Investigate and choose an approach",
          "guide": "Multiple incompatible protections activated during an emergency. Cause of that emergency, location and date remain open."
        },
        {
          "id": "ward-records-3",
          "title": "Deliver an outcome",
          "guide": "An explanation of compounding risks and evidence of the rescue."
        }
      ],
      "leads": [
        "Compare maintenance changes, an independent account and evacuation notes.",
        "Seek an independent account or negotiate directly with the people affected."
      ],
      "dm": "Multiple incompatible protections activated during an emergency. Cause of that emergency, location and date remain open. Pebble can recognize Tavin’s practical map; Donavan reviews conflicting records.",
      "reward": "An explanation of compounding risks and evidence of the rescue.",
      "fallback": "A documented failure, compromise or alternative route can lead forward. Record unpaid rewards and unfinished promises separately.",
      "requires": [
        "act-cost"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "district",
      "title": "A Door That Wasn’t There",
      "kind": "side",
      "act": "guests",
      "owner": "",
      "parent": "act-guests",
      "goal": "Document disturbances at home and help affected residents.",
      "steps": [
        {
          "id": "district-1",
          "title": "Agree the scope",
          "guide": "Sketch the doorway, ask witnesses separately and compare dates."
        },
        {
          "id": "district-2",
          "title": "Investigate and choose an approach",
          "guide": "Begin after normal homecomings. Escalation follows actual preparations, not arbitrary punishment."
        },
        {
          "id": "district-3",
          "title": "Deliver an outcome",
          "guide": "A trustworthy incident record and locally agreed precautions."
        }
      ],
      "leads": [
        "Sketch the doorway, ask witnesses separately and compare dates.",
        "Seek an independent account or negotiate directly with the people affected."
      ],
      "dm": "Begin after normal homecomings. Escalation follows actual preparations, not arbitrary punishment. Give each hero a concrete contribution; neighbors make their own decisions.",
      "reward": "A trustworthy incident record and locally agreed precautions.",
      "fallback": "A documented failure, compromise or alternative route can lead forward. Record unpaid rewards and unfinished promises separately.",
      "requires": [
        "act-guests"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "evacuation",
      "title": "Everyone Has a Way Home",
      "kind": "side",
      "act": "cost",
      "owner": "",
      "parent": "act-cost",
      "goal": "Prepare a district warning and evacuation plan with residents.",
      "steps": [
        {
          "id": "evacuation-1",
          "title": "Agree the scope",
          "guide": "Ask who needs assistance and survey two independent exit routes."
        },
        {
          "id": "evacuation-2",
          "title": "Investigate and choose an approach",
          "guide": "Test routes against actual apparatus boundaries. Plans help even if the party stops activation."
        },
        {
          "id": "evacuation-3",
          "title": "Deliver an outcome",
          "guide": "Available helpers, transport and fewer people trapped if conditions change."
        }
      ],
      "leads": [
        "Ask who needs assistance and survey two independent exit routes.",
        "Seek an independent account or negotiate directly with the people affected."
      ],
      "dm": "Test routes against actual apparatus boundaries. Plans help even if the party stops activation. Pebble can guide; Ringgo arranges access; Aldric builds trust through practical help.",
      "reward": "Available helpers, transport and fewer people trapped if conditions change.",
      "fallback": "A documented failure, compromise or alternative route can lead forward. Record unpaid rewards and unfinished promises separately.",
      "requires": [
        "act-cost"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "silent-library",
      "title": "The Library That Forgot",
      "kind": "side",
      "act": "family",
      "owner": "",
      "parent": "act-family",
      "goal": "Investigate the vanished society beneath the Second Margin.",
      "steps": [
        {
          "id": "silent-library-1",
          "title": "Verify the lead and prepare travel",
          "guide": "Selise’s missing-stair lead, a deed or independent archive correspondence."
        },
        {
          "id": "silent-library-2",
          "title": "Understand the local conflict",
          "guide": "The original society disappeared; current custodians and descendants have interests. The blank book must not require automatic ownership of a medallion."
        },
        {
          "id": "silent-library-3",
          "title": "Choose whom and how to help",
          "guide": "Ask affected people what they need; document ownership and access before collecting evidence."
        },
        {
          "id": "silent-library-4",
          "title": "Test what was learned",
          "guide": "Methods to detect gaps in reconstructed records; evidence of nine total sites."
        }
      ],
      "leads": [
        "Selise’s missing-stair lead, a deed or independent archive correspondence.",
        "Independent testimony or recovered records may supply a less complete alternative to travel."
      ],
      "dm": "The original society disappeared; current custodians and descendants have interests. The blank book must not require automatic ownership of a medallion.",
      "reward": "Methods to detect gaps in reconstructed records; evidence of nine total sites.",
      "fallback": "The site is optional. An allied expedition, independent record or smaller controlled test can preserve essential options.",
      "requires": [
        "act-family"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "observatory",
      "title": "Beneath Troubled Waters",
      "kind": "side",
      "act": "guests",
      "owner": "",
      "parent": "act-guests",
      "goal": "Help coastal communities investigate dangerous waters around the sunken observatory.",
      "steps": [
        {
          "id": "observatory-1",
          "title": "Verify the lead and prepare travel",
          "guide": "Vess’s tide notes, salvage records or an independent sailor’s account."
        },
        {
          "id": "observatory-2",
          "title": "Understand the local conflict",
          "guide": "Prepare maritime access and a return route. Halaster’s UNSUITABLE / DO NOT RETURN warning is evidence to investigate, not a solved explanation."
        },
        {
          "id": "observatory-3",
          "title": "Choose whom and how to help",
          "guide": "Ask affected people what they need; document ownership and access before collecting evidence."
        },
        {
          "id": "observatory-4",
          "title": "Test what was learned",
          "guide": "An early-instability detection method after independent testing."
        }
      ],
      "leads": [
        "Vess’s tide notes, salvage records or an independent sailor’s account.",
        "Independent testimony or recovered records may supply a less complete alternative to travel."
      ],
      "dm": "Prepare maritime access and a return route. Halaster’s UNSUITABLE / DO NOT RETURN warning is evidence to investigate, not a solved explanation.",
      "reward": "An early-instability detection method after independent testing.",
      "fallback": "The site is optional. An allied expedition, independent record or smaller controlled test can preserve essential options.",
      "requires": [
        "act-guests"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "scar",
      "title": "The Price of a Miracle",
      "kind": "side",
      "act": "family",
      "owner": "",
      "parent": "act-family",
      "goal": "Investigate unreliable healing and shared disturbances near the Scar.",
      "steps": [
        {
          "id": "scar-1",
          "title": "Verify the lead and prepare travel",
          "guide": "Anja’s patient accounts, a public survey or temple records."
        },
        {
          "id": "scar-2",
          "title": "Understand the local conflict",
          "guide": "Residents may depend on beneficial effects. The divine identity remains open; no forced magical cure or invented god."
        },
        {
          "id": "scar-3",
          "title": "Choose whom and how to help",
          "guide": "Ask affected people what they need; document ownership and access before collecting evidence."
        },
        {
          "id": "scar-4",
          "title": "Test what was learned",
          "guide": "Documented living consequences and safeguards that can be tested locally."
        }
      ],
      "leads": [
        "Anja’s patient accounts, a public survey or temple records.",
        "Independent testimony or recovered records may supply a less complete alternative to travel."
      ],
      "dm": "Residents may depend on beneficial effects. The divine identity remains open; no forced magical cure or invented god.",
      "reward": "Documented living consequences and safeguards that can be tested locally.",
      "fallback": "The site is optional. An allied expedition, independent record or smaller controlled test can preserve essential options.",
      "requires": [
        "act-family"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "frozen-door",
      "title": "The Door Left Closed",
      "kind": "side",
      "act": "cost",
      "owner": "",
      "parent": "act-cost",
      "goal": "Determine whether and how to investigate the sealed site.",
      "steps": [
        {
          "id": "frozen-door-1",
          "title": "Verify the lead and prepare travel",
          "guide": "Kestrel’s partial notes, caravan records or the earlier survivor."
        },
        {
          "id": "frozen-door-2",
          "title": "Understand the local conflict",
          "guide": "The seal predates Halaster. Present guardians and survivors need not agree; choosing not to open it can be a valid resolution."
        },
        {
          "id": "frozen-door-3",
          "title": "Choose whom and how to help",
          "guide": "Ask affected people what they need; document ownership and access before collecting evidence."
        },
        {
          "id": "frozen-door-4",
          "title": "Test what was learned",
          "guide": "A limited isolation principle, verified before using it on a district."
        }
      ],
      "leads": [
        "Kestrel’s partial notes, caravan records or the earlier survivor.",
        "Independent testimony or recovered records may supply a less complete alternative to travel."
      ],
      "dm": "The seal predates Halaster. Present guardians and survivors need not agree; choosing not to open it can be a valid resolution.",
      "reward": "A limited isolation principle, verified before using it on a district.",
      "fallback": "The site is optional. An allied expedition, independent record or smaller controlled test can preserve essential options.",
      "requires": [
        "act-cost"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "walking-tower",
      "title": "A Tower Without an Address",
      "kind": "side",
      "act": "cost",
      "owner": "",
      "parent": "act-cost",
      "goal": "Reach the tower and resolve its occupants’ problem before claiming discoveries.",
      "steps": [
        {
          "id": "walking-tower-1",
          "title": "Verify the lead and prepare travel",
          "guide": "Compare dated sightings, Pell’s routes and coastal witnesses."
        },
        {
          "id": "walking-tower-2",
          "title": "Understand the local conflict",
          "guide": "The tower contains a Looking Glass fragment; Halaster has not caught it. It is not a free party transport service."
        },
        {
          "id": "walking-tower-3",
          "title": "Choose whom and how to help",
          "guide": "Ask affected people what they need; document ownership and access before collecting evidence."
        },
        {
          "id": "walking-tower-4",
          "title": "Test what was learned",
          "guide": "A reversible disconnection point identified through study of the fragment."
        }
      ],
      "leads": [
        "Compare dated sightings, Pell’s routes and coastal witnesses.",
        "Independent testimony or recovered records may supply a less complete alternative to travel."
      ],
      "dm": "The tower contains a Looking Glass fragment; Halaster has not caught it. It is not a free party transport service.",
      "reward": "A reversible disconnection point identified through study of the fragment.",
      "fallback": "The site is optional. An allied expedition, independent record or smaller controlled test can preserve essential options.",
      "requires": [
        "act-cost"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "broken-star",
      "title": "A Route Through Impossible Space",
      "kind": "side",
      "act": "cost",
      "owner": "",
      "parent": "act-cost",
      "goal": "Help explorers establish a way out of unstable space.",
      "steps": [
        {
          "id": "broken-star-1",
          "title": "Verify the lead and prepare travel",
          "guide": "Compare a legitimately recovered sample, distant observations and route testimony."
        },
        {
          "id": "broken-star-2",
          "title": "Understand the local conflict",
          "guide": "Its exact origin remains open. Prepare normal travel limits and a bounded expedition, not unlimited teleportation."
        },
        {
          "id": "broken-star-3",
          "title": "Choose whom and how to help",
          "guide": "Ask affected people what they need; document ownership and access before collecting evidence."
        },
        {
          "id": "broken-star-4",
          "title": "Test what was learned",
          "guide": "Evidence of boundary failure useful for containment and evacuation."
        }
      ],
      "leads": [
        "Compare a legitimately recovered sample, distant observations and route testimony.",
        "Independent testimony or recovered records may supply a less complete alternative to travel."
      ],
      "dm": "Its exact origin remains open. Prepare normal travel limits and a bounded expedition, not unlimited teleportation.",
      "reward": "Evidence of boundary failure useful for containment and evacuation.",
      "fallback": "The site is optional. An allied expedition, independent record or smaller controlled test can preserve essential options.",
      "requires": [
        "act-cost"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "hollow-mountain",
      "title": "The Unfilled Circle",
      "kind": "side",
      "act": "ending",
      "owner": "",
      "parent": "act-ending",
      "goal": "Investigate the ninth site only when an earned personal connection gives it meaning.",
      "steps": [
        {
          "id": "hollow-mountain-1",
          "title": "Verify the lead and prepare travel",
          "guide": "Use a relationship, location or consequence the players actually create."
        },
        {
          "id": "hollow-mountain-2",
          "title": "Understand the local conflict",
          "guide": "Location intentionally unset; Halaster has never reached it. No mandatory final key and no automatic homeworld revelation."
        },
        {
          "id": "hollow-mountain-3",
          "title": "Choose whom and how to help",
          "guide": "Ask affected people what they need; document ownership and access before collecting evidence."
        },
        {
          "id": "hollow-mountain-4",
          "title": "Test what was learned",
          "guide": "A late option tailored to a real unresolved problem, with alternatives elsewhere."
        }
      ],
      "leads": [
        "Use a relationship, location or consequence the players actually create.",
        "Independent testimony or recovered records may supply a less complete alternative to travel."
      ],
      "dm": "Location intentionally unset; Halaster has never reached it. No mandatory final key and no automatic homeworld revelation.",
      "reward": "A late option tailored to a real unresolved problem, with alternatives elsewhere.",
      "fallback": "The site is optional. An allied expedition, independent record or smaller controlled test can preserve essential options.",
      "requires": [
        "act-ending"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "character-trista",
      "title": "What We Keep Hidden",
      "kind": "character",
      "act": "all",
      "owner": "pc-trista",
      "parent": "",
      "goal": "Choose how to handle a private discovery, an old relationship and the trust of companions.",
      "steps": [
        {
          "id": "character-trista-1",
          "title": "An Old Partner’s Warning",
          "guide": "Mara offers a job and warns that someone seeks the BELOW token. Give her a credible source; do not assume she knows its location."
        },
        {
          "id": "character-trista-2",
          "title": "The Missing Terms",
          "guide": "Compare Mara’s claims with an invoice or witness. Her buyer links to the existing Still Hand broker, not automatically Halaster."
        },
        {
          "id": "character-trista-3",
          "title": "A Pattern in the Dark",
          "guide": "Let observable effects support an investigation; essential information has alternative routes."
        },
        {
          "id": "character-trista-4",
          "title": "Terms of Trust",
          "guide": "Offer private, partial, shared or withheld disclosure. Record actual promises and permitted access."
        },
        {
          "id": "character-trista-5",
          "title": "The Keeper’s Choice",
          "guide": "Trista decides custody and her relationship with Mara; disclosure is not a required victory."
        }
      ],
      "leads": [
        "A discreet meeting with Mara or a documented observation near a site.",
        "Follow a related lead during an ordinary expedition or city return."
      ],
      "dm": "BELOW token is distinct from Echo’s Whisper. No compelled betrayal, theft or possession.",
      "reward": "A custody arrangement and relationships shaped by Trista’s decisions.",
      "fallback": "Allow another witness, letter or later opportunity; personal disclosures and player choices are never compulsory.",
      "requires": [],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "character-pebble",
      "title": "The Way Back",
      "kind": "character",
      "act": "all",
      "owner": "pc-pebble",
      "parent": "",
      "goal": "Follow the hammer-makers’ missing colleague and develop a dependable way through unfamiliar places.",
      "steps": [
        {
          "id": "character-pebble-1",
          "title": "A Familiar Maker’s Mark",
          "guide": "Compare a found mark with an independent message from the hammer-makers; names remain open."
        },
        {
          "id": "character-pebble-2",
          "title": "The Missing Craftsperson",
          "guide": "Follow workshop records and surviving associates; establish why they left before deciding their fate."
        },
        {
          "id": "character-pebble-3",
          "title": "Stone That Doesn’t Belong",
          "guide": "Compare texture and composition with provenance; unfamiliar minerals need not be tasted."
        },
        {
          "id": "character-pebble-4",
          "title": "Someone to Follow",
          "guide": "Let route notes guide a willing group through an actual hazard, with shared navigation available."
        },
        {
          "id": "character-pebble-5",
          "title": "A Map of His Own",
          "guide": "Decide what to preserve of the colleague’s work and what to bring home. Tavin’s map can provide a later connection."
        }
      ],
      "leads": [
        "A maker’s mark, legitimate sample or correspondence from home.",
        "Follow a related lead during an ordinary expedition or city return."
      ],
      "dm": "No compulsory disappearance of fear, eating unknown material or free weapon upgrades.",
      "reward": "Recovered knowledge, dependable routes and confidence built through choices.",
      "fallback": "Allow another witness, letter or later opportunity; personal disclosures and player choices are never compulsory.",
      "requires": [],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "character-donavan",
      "title": "Knowledge in Good Hands",
      "kind": "character",
      "act": "all",
      "owner": "pc-donavan",
      "parent": "",
      "goal": "Investigate with Dianna and a credible rival, then decide how to share the findings.",
      "steps": [
        {
          "id": "character-donavan-1",
          "title": "A Question for Home",
          "guide": "Send a bounded observation to Dianna and let her propose a mathematical test."
        },
        {
          "id": "character-donavan-2",
          "title": "A Different Conclusion",
          "guide": "The rival presents real evidence; decide together what observation would distinguish theories."
        },
        {
          "id": "character-donavan-3",
          "title": "Repeat the Experiment",
          "guide": "Record predictions, methods and results; either researcher can be wrong."
        },
        {
          "id": "character-donavan-4",
          "title": "Who Needs to Know?",
          "guide": "Present requests from residents, a sponsor and researchers. Separate warnings from reproducible methods and personal identities."
        },
        {
          "id": "character-donavan-5",
          "title": "The Published Record",
          "guide": "Choose disclosure, redaction, delay or correction and document who received what."
        }
      ],
      "leads": [
        "Dianna’s correspondence and an independently testable research claim.",
        "Follow a related lead during an ordinary expedition or city return."
      ],
      "dm": "Dianna retains her own work and opinions. The Archive is not in the Feywild; no invented father conspiracy.",
      "reward": "A defensible record, scholarly relationships and informed public choices.",
      "fallback": "Allow another witness, letter or later opportunity; personal disclosures and player choices are never compulsory.",
      "requires": [],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "character-ringgo",
      "title": "An Honest Name",
      "kind": "character",
      "act": "all",
      "owner": "pc-ringgo",
      "parent": "",
      "goal": "Build legitimate investigative work while deciding how to help an old contact leave their former life.",
      "steps": [
        {
          "id": "character-ringgo-1",
          "title": "A Proper Contract",
          "guide": "Negotiate and complete a fair investigation; recognize discretion and evidence gathering."
        },
        {
          "id": "character-ringgo-2",
          "title": "Someone from Before",
          "guide": "Agree the contact’s shared history with Cade; hear their present request."
        },
        {
          "id": "character-ringgo-3",
          "title": "The Part They Left Out",
          "guide": "Verify an omission through a witness or record. People pursuing them may have legitimate grievances."
        },
        {
          "id": "character-ringgo-4",
          "title": "Help with Conditions",
          "guide": "Offer protection, restitution, introductions or limits without erasing harm."
        },
        {
          "id": "character-ringgo-5",
          "title": "The Work He Chooses",
          "guide": "Resolve the immediate problem and choose the professional relationships he wants to keep."
        }
      ],
      "leads": [
        "A legitimate client or private message from an old contact.",
        "Follow a related lead during an ordinary expedition or city return."
      ],
      "dm": "No compulsory assassination, betrayal or public confession. Do not merge the contact with Mara’s employer by default.",
      "reward": "An earned reputation and a chosen balance between loyalty and accountability.",
      "fallback": "Allow another witness, letter or later opportunity; personal disclosures and player choices are never compulsory.",
      "requires": [],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "character-aldric",
      "title": "A Life Returned",
      "kind": "character",
      "act": "all",
      "owner": "pc-aldric",
      "parent": "",
      "goal": "Investigate the return, recover the family’s real history and choose what to do with a second life.",
      "steps": [
        {
          "id": "character-aldric-1",
          "title": "The Ring and the Record",
          "guide": "Pair a maker’s record with a separate appointment or identity record."
        },
        {
          "id": "character-aldric-2",
          "title": "Someone Who Remembers",
          "guide": "Arrange a voluntary meeting with a survivor of a specific Crown act. Their account can be checked; help does not buy forgiveness."
        },
        {
          "id": "character-aldric-3",
          "title": "The Return Ledger",
          "guide": "Corroborate an authenticated laboratory record with an intermediary and identifying evidence."
        },
        {
          "id": "character-aldric-4",
          "title": "Their Names, Their Lives",
          "guide": "Work with Bowman on family details. Letters and independent relationships reveal ordinary lives, not a compulsory magical reunion."
        },
        {
          "id": "character-aldric-5",
          "title": "A Life of His Choosing",
          "guide": "Offer a practical act of repair and let Aldric define his response to Halaster and a future of his own."
        }
      ],
      "leads": [
        "A discreet signet inquiry, family record or witness lead.",
        "Follow a related lead during an ordinary expedition or city return."
      ],
      "dm": "Halaster restored Aldric using identifiable remains and a recoverable soul; no control switch. Crown crimes were independent.",
      "reward": "Verified history and present relationships; complete memory and forgiveness are not required.",
      "fallback": "Allow another witness, letter or later opportunity; personal disclosures and player choices are never compulsory.",
      "requires": [],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "ending-shutdown",
      "title": "Stop the Apparatus",
      "kind": "side",
      "act": "ending",
      "owner": "",
      "parent": "act-ending",
      "goal": "Prepare one possible response to the project.",
      "steps": [
        {
          "id": "ending-shutdown-1",
          "title": "Establish prerequisites",
          "guide": "Identify interruption points and shutdown hazards, then secure unstable remnants."
        },
        {
          "id": "ending-shutdown-2",
          "title": "Review with affected people",
          "guide": "State tested limits and uncertainties; obtain participation from those directly involved."
        },
        {
          "id": "ending-shutdown-3",
          "title": "Carry out and record the outcome",
          "guide": "Record actual results, remaining hazards and commitments; combine approaches when useful."
        }
      ],
      "leads": [
        "Identify interruption points and shutdown hazards, then secure unstable remnants.",
        "Compare this approach with alternatives before committing."
      ],
      "dm": "Optional resolution branch. Selecting it does not silently cancel other approaches.",
      "reward": "A contribution to the chosen ending; no automatic artifact, restoration or reward.",
      "fallback": "If this approach fails, containment, evacuation and other tested interventions remain options.",
      "requires": [
        "act-cost"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "ending-persuade",
      "title": "Give Him a Chance to Stop",
      "kind": "side",
      "act": "ending",
      "owner": "",
      "parent": "act-ending",
      "goal": "Prepare one possible response to the project.",
      "steps": [
        {
          "id": "ending-persuade-1",
          "title": "Establish prerequisites",
          "guide": "Present corroborated evidence and require observable action, not a promise alone."
        },
        {
          "id": "ending-persuade-2",
          "title": "Review with affected people",
          "guide": "State tested limits and uncertainties; obtain participation from those directly involved."
        },
        {
          "id": "ending-persuade-3",
          "title": "Carry out and record the outcome",
          "guide": "Record actual results, remaining hazards and commitments; combine approaches when useful."
        }
      ],
      "leads": [
        "Present corroborated evidence and require observable action, not a promise alone.",
        "Compare this approach with alternatives before committing."
      ],
      "dm": "Optional resolution branch. Selecting it does not silently cancel other approaches.",
      "reward": "A contribution to the chosen ending; no automatic artifact, restoration or reward.",
      "fallback": "If this approach fails, containment, evacuation and other tested interventions remain options.",
      "requires": [
        "act-cost"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "ending-rescue",
      "title": "A Smaller Attempt",
      "kind": "side",
      "act": "ending",
      "owner": "",
      "parent": "act-ending",
      "goal": "Prepare one possible response to the project.",
      "steps": [
        {
          "id": "ending-rescue-1",
          "title": "Establish prerequisites",
          "guide": "Establish bounded methods, independent safeguards and willing participants; a lasting return is not guaranteed."
        },
        {
          "id": "ending-rescue-2",
          "title": "Review with affected people",
          "guide": "State tested limits and uncertainties; obtain participation from those directly involved."
        },
        {
          "id": "ending-rescue-3",
          "title": "Carry out and record the outcome",
          "guide": "Record actual results, remaining hazards and commitments; combine approaches when useful."
        }
      ],
      "leads": [
        "Establish bounded methods, independent safeguards and willing participants; a lasting return is not guaranteed.",
        "Compare this approach with alternatives before committing."
      ],
      "dm": "Optional resolution branch. Selecting it does not silently cancel other approaches.",
      "reward": "A contribution to the chosen ending; no automatic artifact, restoration or reward.",
      "fallback": "If this approach fails, containment, evacuation and other tested interventions remain options.",
      "requires": [
        "act-cost"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "ending-crisis",
      "title": "Protect the Living",
      "kind": "side",
      "act": "ending",
      "owner": "",
      "parent": "act-ending",
      "goal": "Prepare one possible response to the project.",
      "steps": [
        {
          "id": "ending-crisis-1",
          "title": "Establish prerequisites",
          "guide": "Activate agreed warnings, evacuate and isolate damage if prevention fails."
        },
        {
          "id": "ending-crisis-2",
          "title": "Review with affected people",
          "guide": "State tested limits and uncertainties; obtain participation from those directly involved."
        },
        {
          "id": "ending-crisis-3",
          "title": "Carry out and record the outcome",
          "guide": "Record actual results, remaining hazards and commitments; combine approaches when useful."
        }
      ],
      "leads": [
        "Activate agreed warnings, evacuate and isolate damage if prevention fails.",
        "Compare this approach with alternatives before committing."
      ],
      "dm": "Optional resolution branch. Selecting it does not silently cancel other approaches.",
      "reward": "A contribution to the chosen ending; no automatic artifact, restoration or reward.",
      "fallback": "If this approach fails, containment, evacuation and other tested interventions remain options.",
      "requires": [
        "act-cost"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    },
    {
      "id": "ending-preserve",
      "title": "Knowledge Worth Keeping",
      "kind": "side",
      "act": "ending",
      "owner": "",
      "parent": "act-ending",
      "goal": "Prepare one possible response to the project.",
      "steps": [
        {
          "id": "ending-preserve-1",
          "title": "Establish prerequisites",
          "guide": "Verify a limited safe application and agree custody, monitoring and a way to stop it."
        },
        {
          "id": "ending-preserve-2",
          "title": "Review with affected people",
          "guide": "State tested limits and uncertainties; obtain participation from those directly involved."
        },
        {
          "id": "ending-preserve-3",
          "title": "Carry out and record the outcome",
          "guide": "Record actual results, remaining hazards and commitments; combine approaches when useful."
        }
      ],
      "leads": [
        "Verify a limited safe application and agree custody, monitoring and a way to stop it.",
        "Compare this approach with alternatives before committing."
      ],
      "dm": "Optional resolution branch. Selecting it does not silently cancel other approaches.",
      "reward": "A contribution to the chosen ending; no automatic artifact, restoration or reward.",
      "fallback": "If this approach fails, containment, evacuation and other tested interventions remain options.",
      "requires": [
        "act-cost"
      ],
      "legacy": "",
      "source": "The Echo Below · DM-approved campaign direction; custom quest staging. Published locations retain their book room keys."
    }
  ]
}; })();
