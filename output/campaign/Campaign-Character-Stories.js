/* Private DM prep. Original campaign proposals; never player display data. */
globalThis.ECHO_CHARACTER_STORIES = {
  "version": 1,
  "stages": [
    [
      "redbrand",
      "Redbrand hideout"
    ],
    [
      "aftermath",
      "Phandalin aftermath"
    ],
    [
      "forge",
      "Wave Echo Cave"
    ],
    [
      "waterdeep",
      "Waterdeep"
    ],
    [
      "depths",
      "Undermountain and the Nine"
    ],
    [
      "resolution",
      "Late-campaign decisions"
    ]
  ],
  "arcs": [
    {
      "id": "pc-trista",
      "name": "Trista",
      "question": "Who should hold a dangerous discovery, and what does trust require of its keeper?",
      "established": "Trista kept the BELOW token in Session 1. Donavan noticed concealment, not its identity. Gundren gave her a second chance. Her level-3 Shadow abilities come from her class; Echo’s Whisper is a separate, not-yet-awarded object.",
      "interests": [
        "secrecy",
        "trust",
        "Shadow abilities",
        "custody",
        "protecting others"
      ],
      "boundary": "No forced confession, theft, corruption, or party vote over her character. Refusing custody is a complete arc choice. The token does not grant new powers or make her class abilities an Echo effect.",
      "beats": [
        {
          "id": "pc-trista-redbrand",
          "stage": "redbrand",
          "title": "The place you choose to stand",
          "trigger": "Offer during the approach, then revisit only if the party actually finds prisoners or evidence.",
          "say": "There is room to keep watch, scout ahead, or stay close to the others. Trista, who would you want beside you if something unexpected turned up?",
          "dm": "Give a genuine scouting or protection role suited to her current Shadow tools. Do not put another BELOW token in this hideout. If she privately examines hers, repeat only its already-established appearance; invent no new compulsory reaction.",
          "choices": [
            "Keep the token private and ask for practical help: trust can grow without disclosure.",
            "Share a small observation with one chosen person: record precisely what they learn.",
            "Show the token voluntarily: let the group ask questions before discussing custody."
          ],
          "evidence": "A witnessed conversation establishes only what was actually shown or said. No Insight check identifies a concealed token automatically.",
          "followup": "Ask who should hold any newly recovered papers and who may copy them. Record an actual agreement only after the players make it.",
          "fallback": "If she avoids the subject, let her scouting, protection, or careful retreat be the spotlight. Carry the trust question forward. Do not count secrecy as failure.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-trista-aftermath",
          "stage": "aftermath",
          "title": "A favor with no price",
          "trigger": "Use a quiet moment after a real act of aid in Phandalin.",
          "say": "A person you helped offers a small place at their table. “I cannot repay everything. Is there one thing I can do for you?”",
          "dm": "Choose someone actually helped, not an invented rescued prisoner. Their help can be a message, safe meeting place, or witnessing an inventory. They do not know about the token unless told.",
          "choices": [
            "Accept practical help: establish a voluntary contact.",
            "Ask them to help someone else: let that person decide what aid they need.",
            "Decline payment but exchange names: gratitude need not become a debt."
          ],
          "evidence": "The NPC’s witnessed offer and any agreed terms become the record; do not manufacture a debt for charity.",
          "followup": "Let Gundren’s old act of trust become something Trista can pass on without copying his exact choices.",
          "fallback": "If no one was helped, offer a modest paid errand with a fair wage. Avoid rewarding an invented rescue.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-trista-forge",
          "stage": "forge",
          "title": "The keeper is a choice",
          "trigger": "Only after the party reaches the Forge and chooses to examine the actual discoveries.",
          "say": "You can keep this where it is, carry it away, or make a record before anyone touches it. What would make you willing to trust another person with the decision?",
          "dm": "If Echo’s Whisper is introduced, identify it separately from the BELOW token. No automatic transfer to Trista. Make any real handling danger explicit before the choice; no secret alignment test or invented attunement benefit.",
          "choices": [
            "Accept temporary custody with a witness and a return condition.",
            "Share custody through agreed storage and access rules.",
            "Decline and help choose another keeper or leave it secured."
          ],
          "evidence": "Inventory, location sketch, and a witnessed handover establish custody; resemblance alone does not establish a common maker.",
          "followup": "Write the chosen keeper, access rules, and next review point into continuity. Offer a later challenge to those terms, not an automatic theft.",
          "fallback": "A rubbing or sketch preserves the lead if the group leaves the object behind. Essential routes do not depend on Trista holding it.",
          "minutes": 8,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-trista-waterdeep",
          "stage": "waterdeep",
          "title": "Mara asks for the whole truth",
          "trigger": "After Mara is introduced and a genuine discovery or custody arrangement exists.",
          "say": "Mara says, “Tell me what you can promise. I would rather know the limit than find it later.”",
          "dm": "Use Mara’s established theft-contract pressure as an offer with a visible risk, not proof she betrays Trista. She must learn about any object through an actual conversation or source. Make a lawful transport/storage alternative available.",
          "choices": [
            "Disclose the risk but withhold the location: negotiate an honest limit.",
            "Show evidence under supervision: give Mara a chance to earn trust.",
            "Refuse the contract and offer another way out: neither friendship nor clues are locked behind theft."
          ],
          "evidence": "The written offer proves what was offered; Mara’s interpretation remains a claim until checked.",
          "followup": "Let the next meeting reflect the specific promise kept or broken. Trista may change custody with the other involved players’ agreement.",
          "fallback": "If Mara is avoided, Selise can present the storage question openly. No unseen theft punishes avoidance.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-trista-depths",
          "stage": "depths",
          "title": "Privacy without isolation",
          "trigger": "At the Silent Library or another site where copying and custody are genuinely in dispute.",
          "say": "One person wants the original sealed. Another wants a copy available to anyone in danger. Both ask what you would need before trusting them.",
          "dm": "Offer a concrete access agreement: who can inspect, who keeps the original, what can be copied, and when the arrangement is reviewed. Give Trista a useful route/scouting task in parallel; avoid making every Shadow scene a confession.",
          "choices": [
            "Keep the original private but release a checked warning.",
            "Use independent custodians and record access.",
            "Return it to affected people with an agreed inspection plan."
          ],
          "evidence": "Compare access logs with witnesses. A missing entry is a discrepancy, not automatic proof a friend stole something.",
          "followup": "Consequences concern speed, accountability, and relationships. Protection should have practical benefits as well as costs.",
          "fallback": "If the group rejects formal rules, record their simpler verbal agreement and revisit it after a real change.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-trista-resolution",
          "stage": "resolution",
          "title": "What you are willing to carry",
          "trigger": "When the party has enough evidence for a major decision about Looking Glass or an affected site.",
          "say": "You once kept a small thing because it was yours to understand. What, now, are you willing to keep—and what responsibility belongs with someone else?",
          "dm": "Offer an ending grounded in her choices: trusted keeper, shared steward, protector who refuses possession, or a new path she proposes. Do not force the medallion onto her or equate openness with moral goodness.",
          "choices": [
            "Keep custody under terms others can question.",
            "Establish shared stewardship and a right to withdraw.",
            "Hand it over or safely relinquish it while preserving the warnings."
          ],
          "evidence": "Use actual agreements and observed consequences. The late-campaign mystery does not erase prior custodians’ decisions.",
          "followup": "Epilogue: show one specific person or practice improved by her chosen form of trust.",
          "fallback": "If Trista never reveals the token, close the arc through another real decision about secrecy and care.",
          "minutes": 8,
          "source": "Custom Echo Below proposal; not an event that has happened"
        }
      ]
    },
    {
      "id": "pc-pebble",
      "name": "Pebble",
      "question": "Can you learn your own way through the world while still asking others for help?",
      "established": "Byron’s Goron comes from the mountains, loves rocks, fears getting lost, and follows a shiny-mineral story told by the dwarves who made his hammer. Champion, Crusher, and Interception remain his current sheet features.",
      "interests": [
        "hammer-makers",
        "mountain home",
        "minerals",
        "navigation",
        "belonging"
      ],
      "boundary": "No forced eating, damage from an unannounced tasting test, automatic mineral identification, or free weapon upgrades. Working names for new dwarves or his home remain editable until Byron establishes them.",
      "beats": [
        {
          "id": "pc-pebble-redbrand",
          "stage": "redbrand",
          "title": "Mark the way back",
          "trigger": "Offer at the entrance before anyone commits to a route.",
          "say": "Pebble, what would help you recognize the way back? You have chalk, familiar shapes, and friends who can check the route with you.",
          "dm": "Give him a real route-marking role if he wants it. Describe ordinary masonry or tool marks where supported by the room; the marks are practical information, not supernatural knowledge of every corridor.",
          "choices": [
            "Mark turns with a personal stone symbol: show those marks on the return.",
            "Pair up with a companion to verify each turn: shared navigation is progress.",
            "Choose a meeting point and ask someone else to lead: confidence can include delegating."
          ],
          "evidence": "A route sketch and physical marks can be checked by the party. Use normal checks only for genuinely uncertain terrain.",
          "followup": "On retreat, ask Pebble to point out a marker he placed. Record a success if the player enjoyed that moment.",
          "fallback": "If he does not want to navigate, offer him a protective role at a doorway and let someone else keep the map.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-pebble-aftermath",
          "stage": "aftermath",
          "title": "The makers’ mark",
          "trigger": "At a smith or trader only if Pebble shows his hammer.",
          "say": "The smith turns the hammer carefully. “Good work. Who made this for you? What would you want them to know you have done with it?”",
          "dm": "Let Byron name the makers first. Optional working names: Torra and Brennir Flintwell, two dwarven smiths, not secret Echo guardians. A trader can route a letter to them after Pebble supplies a real home/contact description.",
          "choices": [
            "Send a drawing of the hammer at work: invite a craft reply.",
            "Ask about the shiny mineral story: receive a lead, not a guaranteed location.",
            "Request a simple maintenance lesson: gain a relationship, not a new combat modifier."
          ],
          "evidence": "A maker’s reply can confirm their own workmanship and the original rumor’s source. The mineral’s properties still need independent testing.",
          "followup": "Prepare a return letter praising a choice to protect someone, with a small route sketch or ordinary repair tip.",
          "fallback": "If he keeps his home private, a local craftsperson can teach the same skill without contacting anyone.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-pebble-forge",
          "stage": "forge",
          "title": "Something better than a shiny rock",
          "trigger": "Offer when a safe, ordinary sample can be found during exploration; not in place of keyed treasure.",
          "say": "A seam catches the light. Some pieces shine more than others, but the marks around it show people once worked carefully here. What would you like to learn before you take a piece?",
          "dm": "Custom mineral proposal: sweetstone, a mundane calcite-like vein Byron may describe as a favored Goron food after safe identification. Distinguish it from charged residue at the Forge. No tasting is required and there is no permanent power reward.",
          "choices": [
            "Collect a small safe sample with location notes.",
            "Leave the seam and sketch it for the hammer-makers.",
            "Ask who owns the claim and arrange a fair share before extraction."
          ],
          "evidence": "Compare a known sample, a craftsperson’s identification, and the location record. Brightness alone does not prove safety or Echo resonance.",
          "followup": "Let the makers react to what he learned as well as what he brought. An unusual mineral may matter because of craft, beauty, or a community’s livelihood.",
          "fallback": "If the mine is unsafe or left unexplored, use a trader’s ordinary sample later; do not block his arc behind the dungeon.",
          "minutes": 8,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-pebble-waterdeep",
          "stage": "waterdeep",
          "title": "Your own route home",
          "trigger": "After the group establishes the Yawning Portal or another agreed meeting place.",
          "say": "The city is loud, but three landmarks now make sense: the place you left, the turn you remember, and where your friends will wait. Which route do you want to show them?",
          "dm": "Invite Byron to invent a harmless mnemonic and one favorite shop. A wrong turn costs a small detour with a helpful sign or resident, not separation, humiliation, or an ambush solely for failing navigation.",
          "choices": [
            "Lead the group along a familiar route.",
            "Build a pocket map with a companion and ask a local to verify it.",
            "Help another newcomer find their way."
          ],
          "evidence": "Let landmarks remain stable across visits; record new knowledge rather than quietly changing the streets.",
          "followup": "Pebble becomes someone another traveler can rely on. Return to the same route after a later expedition.",
          "fallback": "If urban navigation is not enjoyable, make the spotlight a warm craft-shop visit and keep routes simple.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-pebble-depths",
          "stage": "depths",
          "title": "A letter from the mountain",
          "trigger": "Once a correspondence route exists; deliver between expeditions, not mid-combat.",
          "say": "“We would like to know the places you have learned. Could you send a map someone else could follow? There is a young traveler here who is frightened of taking the first step.”",
          "dm": "The mountain home needs a useful connection, not compulsory rescue from destruction. Offer a trade-route question or a craft commission. Do not make his whole tribe vanish to create urgency.",
          "choices": [
            "Return for a visit with a practical route and samples.",
            "Arrange a trusted courier and a fair mineral trade.",
            "Invite a visitor and prepare a safe route through Waterdeep."
          ],
          "evidence": "Confirm sender, route, and the actual request. Rumors of a rare mineral remain rumors until examined.",
          "followup": "Connect one craft need to a site the party already chooses to visit; the home arc never assigns every expedition.",
          "fallback": "If travel home would derail the group, resolve correspondence during downtime and offer a later visit.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-pebble-resolution",
          "stage": "resolution",
          "title": "The one who knows the way",
          "trigger": "At a chosen homecoming, rescue route, or late expedition departure.",
          "say": "Someone asks you the question you once needed to ask: “How do I get there without losing everyone?” What do you tell them?",
          "dm": "Confidence is using preparation and asking for help, not deleting his fear. Let the hammer remain his makers’ work unless an actual upgrade is separately earned and approved.",
          "choices": [
            "Guide others and teach them to check the route themselves.",
            "Build a lasting connection between home and the wider world.",
            "Choose a smaller familiar life and visit his friends by reliable routes."
          ],
          "evidence": "Use real routes, correspondence, and acts of protection from the tracker.",
          "followup": "Epilogue: a new traveler recognizes Pebble’s trail mark, or the makers hang his map beside their forge.",
          "fallback": "If his interests shift, close with a craft or friendship accomplishment rather than a navigation speech.",
          "minutes": 8,
          "source": "Custom Echo Below proposal; not an event that has happened"
        }
      ]
    },
    {
      "id": "pc-donavan",
      "name": "Donavan Kemp",
      "question": "How can you make knowledge useful without surrendering the people it might harm?",
      "established": "Brodey’s researcher belongs to the Kemp Archive in an elven metropolis. Dianna, his wife, is a mathematician; Favian, Vivian, Lilian, Conner, and Nilla are family. Markus is dead, but the truth remains open. Donavan is now an Order of Scribes Wizard 2 / Knowledge Cleric 1.",
      "interests": [
        "research",
        "family letters",
        "rival interpretations",
        "publication",
        "provenance"
      ],
      "boundary": "Do not make every family member a hostage or every rival dishonest. The Archive is not in the Fey Realm. Publishing a claim does not make it true; Markus’s fate is not automatically tied to Halaster.",
      "beats": [
        {
          "id": "pc-donavan-redbrand",
          "stage": "redbrand",
          "title": "The useful discrepancy",
          "trigger": "Only when real hideout papers or testimony are found; an added scrap is clearly a custom prop.",
          "say": "Two accounts agree on a name but disagree about what it means. What would you need to record before deciding which one to trust?",
          "dm": "Use the distinction between the party’s Redbrand lead and any newly found transfer evidence. Do not place Gundren here or give a castle location without a credible discovered source. Let Donavan label who said what and when.",
          "choices": [
            "Copy exact wording and preserve the original separately.",
            "Ask another PC to independently inspect a seal or route.",
            "Keep the conclusion open and record the next check needed."
          ],
          "evidence": "Two copies of the same letter are one source. A witness with direct access and an independently dated record can corroborate a transfer.",
          "followup": "A correct uncertainty can protect the party from a rushed conclusion. Give the player the usable record even on a failed roll; a check may add context.",
          "fallback": "If the papers are destroyed, compare independent testimony later. The main Gundren rescue lead remains available through adventure routes.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-donavan-aftermath",
          "stage": "aftermath",
          "title": "Dianna’s first reply",
          "trigger": "During a quiet rest in town after a message could reasonably arrive.",
          "say": "“Donavan—send the ordinary details too. What did you eat, and who made you laugh? For the measurements, keep the result you expected separate from the one you found. I would like both versions. Love, Dianna.”",
          "dm": "This is an optional new letter from his established wife. Include a mundane family detail Brodey supplies. Her request is a matched comparison of an unusual site with an ordinary one, not a remote solution to the Nine.",
          "choices": [
            "Reply personally before writing the report.",
            "Send a cautious observation with the uncertainty intact.",
            "Ask Dianna a mathematical question and propose a safe comparison."
          ],
          "evidence": "Her calculation can test a submitted model, but it cannot verify an observation she did not witness.",
          "followup": "Let the reply cite Donavan’s actual question and one other PC’s contribution. Keep family correspondence reciprocal.",
          "fallback": "If the player dislikes letter scenes, summarize the message in a sentence and offer it for later reading.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-donavan-forge",
          "stage": "forge",
          "title": "A finding someone can reproduce",
          "trigger": "After an actual Forge investigation; avoid dangerous tuning merely to earn data.",
          "say": "You can record where you stood, what happened, and what changed. Which comparison would help someone distinguish an ordinary magical effect from your explanation?",
          "dm": "Keep the Forge’s published magic separate from the Echo overlay. Introduce a proposed academic rival, Ilyra Voss, through an earlier paper arguing residual enchantment explains such effects. She has a testable hypothesis, not secret villain status.",
          "choices": [
            "Send a narrow observation with no claim of cause.",
            "Arrange a safe repeat measurement with a witness.",
            "Write both hypotheses and a test that could prove your own wrong."
          ],
          "evidence": "Different observers, a control location, timestamps, and independent records strengthen a claim. Agreement between friends alone is not proof.",
          "followup": "The Archive can ask a follow-up that changes with the data. A disputed explanation need not invalidate the party’s observations.",
          "fallback": "If no repeat is safe, publish the limit explicitly. Not experimenting can be a defensible research result.",
          "minutes": 8,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-donavan-waterdeep",
          "stage": "waterdeep",
          "title": "The redacted report",
          "trigger": "When Ilvara, Selise, or an Archive correspondent requests the research.",
          "say": "“I can copy what you send,” the correspondent says. “Tell me who could be harmed by the details, and which conclusions you are ready to put your name beside.”",
          "dm": "Offer public summary, restricted review, and delayed publication. Give each a concrete cost: recognition/access, independent scrutiny, or speed of warning. No option is automatically the moral one.",
          "choices": [
            "Publish observations while redacting dangerous access instructions and witness identities.",
            "Invite independent reviewers under agreed handling terms.",
            "Delay release while sending a practical warning to affected people."
          ],
          "evidence": "Keep an original, date the release, credit collaborators, and distinguish redaction from altering evidence.",
          "followup": "Have a reader use the actual published version. Later requests must respect what was withheld and who received it.",
          "fallback": "If no one has requested a report, let Donavan initiate one; do not conjure a deadline or punishment for silence.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-donavan-depths",
          "stage": "depths",
          "title": "A rival changes one of your conclusions",
          "trigger": "At an appropriate field site or a Waterdeep return after new observations.",
          "say": "Ilyra sets two records beside yours. “This part supports you. This part does not. Will you help me find out why?”",
          "dm": "Prepare one bounded discrepancy, such as a clock offset or unmatched location. Decide the real cause before presenting it. Let independent checks show it. Ilyra can be wrong about the wider theory and right about a detail.",
          "choices": [
            "Correct the public claim and credit the correction.",
            "Run a jointly designed safe test with the party.",
            "Keep disagreement visible while acting on the facts both sides accept."
          ],
          "evidence": "A correction needs its own traceable evidence. Do not change the answer to defeat the player’s successful test.",
          "followup": "Trust can grow through honest disagreement. Family may celebrate his integrity without knowing every private expedition detail.",
          "fallback": "If the party avoids the rival, another independent review or their own notes can expose the discrepancy.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-donavan-resolution",
          "stage": "resolution",
          "title": "The archive you leave behind",
          "trigger": "Before the final consequential publication, sealing, or stewardship decision.",
          "say": "Your record could outlive everyone who remembers why it was written. What must a future reader be able to check—and what do they need permission to use?",
          "dm": "Offer an accountable public archive, a community-held collection with access rules, or a carefully limited warning. Keep independent records available so Donavan is not the sole arbiter of truth.",
          "choices": [
            "Publish with provenance, corrections, and safety limits.",
            "Place originals with multiple accountable custodians.",
            "Withhold a dangerous method while making its risks and the reason for withholding reviewable."
          ],
          "evidence": "Build the final record from actual evidence and credit each PC’s work. Do not manufacture a final proof about Markus or the Weave.",
          "followup": "Epilogue: a student, family member, or affected community uses his honest account to make their own decision.",
          "fallback": "If research stopped being his main interest, focus on one truthful letter home and a concrete person he helped.",
          "minutes": 8,
          "source": "Custom Echo Below proposal; not an event that has happened"
        }
      ]
    },
    {
      "id": "pc-ringgo",
      "name": "Ringgo Paul",
      "question": "Can your old skills create a life that does not demand another victim?",
      "established": "Cade’s tiefling rogue is a former assassin from Baldur’s Gate, now a level-3 Assassin with Stealth and Investigation Expertise. Cade has not established the specific contract that made him leave.",
      "interests": [
        "old contacts",
        "unfinished business",
        "honest work",
        "restraint",
        "chosen identity"
      ],
      "boundary": "No imposed murder contract, forced betrayal, automatic recognition, or requirement to kill for closure. Proposed contacts are new custom material until introduced. His class does not dictate his morals.",
      "beats": [
        {
          "id": "pc-ringgo-redbrand",
          "stage": "redbrand",
          "title": "The exit you leave open",
          "trigger": "When the party can scout a real room or speak to an opponent who has a credible reason to yield.",
          "say": "You notice where someone would run and what would make surrender believable. What would you need to offer for this to end without another body?",
          "dm": "Use actual sightlines and morale. Do not guarantee a surrender roll, but explain credible conditions: distance, disarmament, a clear exit, or a witness. Let Ringgo investigate a bluff rather than auto-detecting one.",
          "choices": [
            "Arrange a witnessed surrender with concrete terms.",
            "Create a diversion or escape route for a vulnerable person.",
            "Use force if necessary while choosing a limit and honoring it."
          ],
          "evidence": "Record what the opponent actually promised and whether they had the ability to keep it. Surrender does not make every statement true.",
          "followup": "An honest reputation can begin with one reliable agreement. Do not invent saved prisoners if none were found.",
          "fallback": "If negotiation is impossible, spotlight reconnaissance that reduces risk for the group. A combat outcome does not fail his story.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-ringgo-aftermath",
          "stage": "aftermath",
          "title": "A job with a receipt",
          "trigger": "When a townsperson who has reason to trust the party needs modest help.",
          "say": "“There is a price for the work, written here. Bring the goods back, and I pay you. No hidden part of the bargain.”",
          "dm": "Offer a fair security inspection, escort, or recovery of missing property with consent of the owner. The fee must be set and recorded before acceptance; do not grant unearned reward money.",
          "choices": [
            "Take the job openly and ask for a reference.",
            "Offer a safer plan that costs the client less.",
            "Decline but recommend another honest worker."
          ],
          "evidence": "A receipt, payment, and named witness establish the result; reputation grows from acts people actually know about.",
          "followup": "Use the reference later in Waterdeep as a door to lawful work, not a universal pardon.",
          "fallback": "If the group is leaving immediately, offer the job as later downtime, without penalizing him for the party’s schedule.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-ringgo-forge",
          "stage": "forge",
          "title": "An old method, a different purpose",
          "trigger": "During a real guard bypass, rescue approach, or withdrawal from the mine.",
          "say": "You know a way to approach without being seen. This time, who is that knowledge meant to keep alive?",
          "dm": "Use ordinary scouting and his current sheet. Let him choose whether to explain where he learned it. No past handler suddenly appears in the mine merely to force a confession.",
          "choices": [
            "Find a route for the whole group and teach the key steps.",
            "Take a personal risk to protect a noncombatant with the party’s support.",
            "Reject an efficient but needlessly cruel method and propose another."
          ],
          "evidence": "The group sees the method and result, not automatically his former employment history.",
          "followup": "Let another PC acknowledge the concrete help. Keep moral decisions collaborative, not a redemption score.",
          "fallback": "If there is no stealth opportunity, give him an investigative task that makes a retreat or bargain safer.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-ringgo-waterdeep",
          "stage": "waterdeep",
          "title": "The contact who offers a choice",
          "trigger": "After Cade accepts an old-contact hook; offer recognition privately first.",
          "say": "“I know work you used to do,” says the visitor. “I need something different now. Will you hear it before you decide?”",
          "dm": "Proposed contact: Sera Quill, a former courier now seeking a safe exit from the trade. Ask Cade whether this is a familiar person or a stranger using an old introduction. The proposal is document recovery with consent, witness transport, or removing a false debt—not an assassination.",
          "choices": [
            "Hear the account and verify it before promising help.",
            "Refer Sera to lawful protection with her consent.",
            "Decline involvement and state what contact is acceptable in future."
          ],
          "evidence": "Check a debt document against an independent witness or ledger. Sera’s fear is real to her, but her explanation is still a claim.",
          "followup": "Only establish a shared past that Cade endorses. An old employer’s connection to Halaster remains unsupported.",
          "fallback": "If Cade rejects the contact, use a new client seeking the same nonviolent skills with no retconned relationship.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-ringgo-depths",
          "stage": "depths",
          "title": "Finish a debt without creating another",
          "trigger": "After a specific piece of unfinished business is established and the relevant person can be reached safely.",
          "say": "“I want this to stop,” they tell you. “That does not mean I want someone else dead. What can you actually change?”",
          "dm": "Offer testimony, verified document recovery, repayment, safe relocation, or exposing a coercive contract. Let affected people choose whether to participate. Accountability may remain even after practical danger ends.",
          "choices": [
            "Build a case with independent records and protect witnesses.",
            "Negotiate release from a coercive obligation with terms the person accepts.",
            "Make restitution without demanding secrecy or forgiveness."
          ],
          "evidence": "A signed release is one piece of evidence; verify that practical leverage such as retained documents has actually been removed.",
          "followup": "An antagonist can survive the resolution. Record remaining risks rather than declaring every contact cleansed or friendly.",
          "fallback": "If institutions are unsafe, offer a community witness network and a negotiated exit; lawful work need not mean blind faith in officials.",
          "minutes": 8,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-ringgo-resolution",
          "stage": "resolution",
          "title": "The name on your door",
          "trigger": "When Ringgo has enough real choices behind him to define what comes next.",
          "say": "If someone comes looking for your help years from now, what work do you want them to believe you do?",
          "dm": "Offer endings as a trusted escort, investigator, security teacher, quiet tradesperson, or something Cade invents. He need not publicly confess everything or abandon the skills on his sheet.",
          "choices": [
            "Build legitimate work with clear limits and fair payment.",
            "Teach protective skills while refusing coercive contracts.",
            "Leave the trade entirely and keep chosen friendships."
          ],
          "evidence": "Use actual fulfilled promises, references, and restitution; an ending does not require victims to forgive him.",
          "followup": "Epilogue: a former client recommends his work without needing to conceal what the job was.",
          "fallback": "If past hooks were declined, celebrate the life built through present-day choices instead.",
          "minutes": 8,
          "source": "Custom Echo Below proposal; not an event that has happened"
        }
      ]
    },
    {
      "id": "pc-aldric",
      "name": "Aldric Vane",
      "question": "What does a second life let you repair, and who has the right to name its price?",
      "established": "Bowman’s Reborn wizard was a Crown battle mage and magistrate, obeyed atrocities under threats to his family, resisted, was killed, and returned with fragmented memories. His ring remains trapped on his finger. The DM now explicitly wants Halaster connected to his return.",
      "interests": [
        "corroborated memories",
        "signet ring",
        "surviving witnesses",
        "atonement",
        "Halaster and rebirth"
      ],
      "boundary": "Halaster’s role is a custom DM premise, not published lore or player knowledge. No mind control, automatic forgiveness, forced flashback behavior, reversible-life hostage switch, or surprise family resurrection. The Crown and family names remain open until established with Bowman.",
      "beats": [
        {
          "id": "pc-aldric-redbrand",
          "stage": "redbrand",
          "title": "A seal and a chance to act differently",
          "trigger": "When an actual captive, surrender, or document gives a natural opportunity; do not force all three.",
          "say": "A formal phrase catches at a memory: a desk, your hand, a seal pressed into wax. Nothing proves where it happened. What do you do with the feeling?",
          "dm": "Offer the image privately and let Bowman accept, alter, or decline it. A generic official phrase is not proof the Redbrands served his Crown. Give him a present choice such as protecting a surrender or asking a frightened person what help they want.",
          "choices": [
            "Document the memory without treating it as evidence.",
            "Ask a neutral question about the phrase without naming his past.",
            "Set the memory aside and make the immediate situation safer."
          ],
          "evidence": "Label this a subjective memory. Later documents or independent witnesses must corroborate any factual detail before it enters confirmed history.",
          "followup": "Record the present act separately from the memory. No clue requires him to repeat violence.",
          "fallback": "If Bowman does not want a memory scene, offer the ethical choice without the image.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-aldric-aftermath",
          "stage": "aftermath",
          "title": "The ring leaves an impression",
          "trigger": "Only if Aldric chooses to examine or show the ring to someone he trusts.",
          "say": "The crest is damaged, but a careful drawing can preserve what remains. Who, if anyone, would you trust with a copy?",
          "dm": "Create a rubbing or drawing without removing the ring or injuring the finger. Proposed craft clue: a small repaired notch inside the crest, distinct from a common Crown design. It suggests a commission that can later be checked; it grants no magic bonus.",
          "choices": [
            "Keep the copy private with a dated note.",
            "Send a limited image to an independent records specialist.",
            "Ask a companion to witness the examination without explaining everything."
          ],
          "evidence": "A crest match identifies a design or office, not its wearer or crimes. A maker’s commission and a separate appointment roll are needed to identify Aldric.",
          "followup": "A reply can point to Waterdeep’s copy trade. Do not invent the Crown’s nation, his family’s names, or a full recovered biography.",
          "fallback": "If he refuses an examination, a witness may later recognize his voice or an authenticated signature; the ring is not the only path.",
          "minutes": 6,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-aldric-forge",
          "stage": "forge",
          "title": "The echo in an old measurement",
          "trigger": "Only after the party actually investigates the Forge; this is the first possible recognition signal.",
          "say": "For a moment, a remembered rhythm lines up with the pulse beneath the stone. Then it slips away. It is familiar, but familiarity is not an explanation.",
          "dm": "DM premise: Halaster’s past return experiment used a resonance pattern from Undermountain. The Forge response can let Halaster recognize that his unidentified former subject is alive and traveling with this party. He was not following them from Session 1. This does not make Nezznar his agent.",
          "choices": [
            "Record the rhythm and ask another observer to describe it independently.",
            "Leave without investigating; a surviving record can provide the clue later.",
            "Tell one trusted companion the resemblance, without disclosing his whole history."
          ],
          "evidence": "The matching rhythm is an inference, not proof Halaster revived him. It needs an authenticated experiment record and a separate witness.",
          "followup": "Offer a later message that admits uncertainty: “A result I believed lost may have endured.” It is a claim to investigate, not an order or proof.",
          "fallback": "If no Forge interaction occurs, delay Halaster’s recognition until a credible Undermountain encounter or documented report reaches him.",
          "minutes": 8,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-aldric-waterdeep",
          "stage": "waterdeep",
          "title": "Two records and a living witness",
          "trigger": "After Aldric seeks records or consents to a contact; use a calm private meeting.",
          "say": "The archivist places a copy beside your sketch. “This tells us who held the office. It does not tell us what kind of person he was. For that, we need someone who was there.”",
          "dm": "Proposed witness: Mera Vale, a former records clerk who survived the Crown’s service. She can attest to one dated order and one real intervention Aldric attempted, not his entire guilt or innocence. Let Bowman settle the Crown and family names before the documents name them.",
          "choices": [
            "Hear testimony without asking for absolution.",
            "Investigate a surviving family record separately from military records.",
            "Offer practical help chosen by someone harmed, with no demand for cooperation in return."
          ],
          "evidence": "Corroborate the appointment roll with a maker’s commission; corroborate Mera’s dated detail with an independent civilian record. A remembered face alone is insufficient.",
          "followup": "Give one bounded recovered fact and one unresolved question. Atonement might fund aid, preserve testimony, escort a threatened witness, or return property after ownership is verified.",
          "fallback": "If the witness declines contact, accept that boundary. Independent records and an intermediary still permit progress.",
          "minutes": 10,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-aldric-depths",
          "stage": "depths",
          "title": "Halaster did bring you back",
          "trigger": "After enough evidence to make the revelation earned, at an optional research site chosen alongside the published dungeon.",
          "say": "An experiment record carries three details a public rumor would not: the broken ring finger, the uneven scar, and the moment your breathing did not return. A later entry reads, “Continuity achieved. Subject departed. Memory incomplete.”",
          "dm": "Custom DM truth: after the Crown disposed of Aldric, Halaster obtained his remains through an intermediary and used an experimental return lattice linked to Undermountain. The scorched signet helped identify the same individual during reconstruction; it is not a soul cage. The result was a Reborn with fragmented memory. Halaster studied survival of identity; he did not order the execution or the family’s murders. How the intermediary found the remains can be resolved later without rewriting the Crown.",
          "choices": [
            "Demand records and leave without accepting a debt.",
            "Negotiate a bounded exchange for further evidence with the party’s knowledge.",
            "Refuse contact and preserve independent proof of what happened."
          ],
          "evidence": "Use an authenticated dated lab record, corroboration from a separate surviving attendant or intermediary (proposed witness: a former mortal assistant, now independent), and a testable ring/record detail. Halaster’s testimony alone is not confirmation. Records grant no remote-control mechanism.",
          "followup": "Halaster may call Aldric a success or claim ownership; that is his attitude, not a magical contract. He cannot switch Aldric off. Refusing him must leave a real path forward.",
          "fallback": "If the party avoids Halaster, copies and an independent witness can establish his role. No forced audience is required.",
          "minutes": 12,
          "source": "Custom Echo Below proposal; not an event that has happened"
        },
        {
          "id": "pc-aldric-resolution",
          "stage": "resolution",
          "title": "A life that is yours",
          "trigger": "After the resurrection truth is supported and a concrete act of restitution is possible.",
          "say": "The cause of your return is no longer the only question. There are people alive now who can say what they need. Which promise are you willing to make without asking them to forgive you?",
          "dm": "Aldric can expose Crown records, protect witnesses, restore stolen property, help harmed communities on their terms, or refuse to recreate Halaster’s experiment. His restored life does not depend on continued service. Recovery may remain incomplete and meaningful.",
          "choices": [
            "Publish verified testimony with witness protection and acknowledge his own part.",
            "Commit to practical restitution chosen by affected people, without buying forgiveness.",
            "Secure or dismantle access to the experiment through an informed plan while preserving his independent existence."
          ],
          "evidence": "Use corroborated events, consent from living witnesses, and records of aid delivered. Do not promise that undoing a laboratory reverses death or restores his family.",
          "followup": "Epilogue: one person is safer because of a promise he kept; a family name recovered is honored without becoming a demand for impossible restoration.",
          "fallback": "If the group never reaches the experiment, let a smaller act of repair close the current chapter. His whole worth is not locked behind solving Halaster.",
          "minutes": 10,
          "source": "Custom Echo Below proposal; not an event that has happened"
        }
      ]
    }
  ],
  "halaster": {
    "status": "DM-approved custom direction; unrevealed and unplayed",
    "premise": "Halaster’s experimental return lattice restored Aldric as a Reborn after the Crown killed him. The ring was an identifying anchor, not a soul prison. Halaster’s experiment damaged continuity of memory; it did not create a right to control Aldric.",
    "limits": "The Crown caused the execution and family murders. Halaster did not arrange them. The Crown’s identity, family names, and the intermediary’s route remain open. The return does not depend on continued service, a worn ring, or a still-functioning machine.",
    "timeline": "Halaster remembers an unidentified experiment subject, not a tracked adventuring party. An actual Forge interaction may allow recognition; otherwise delay until a credible later contact. This revises only Aldric’s open resurrection cause and preserves the campaign’s earned Waterdeep transition.",
    "evidence": [
      "A ring sketch, maker’s commission, and appointment roll establish identity.",
      "A dated experiment record is authenticated independently of Halaster.",
      "A surviving independent attendant or intermediary corroborates a bounded detail.",
      "Only then treat Halaster’s role as confirmed in character knowledge; memories and boasts alone remain claims."
    ]
  }
};
