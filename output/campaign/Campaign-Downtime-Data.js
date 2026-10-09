/* Private DM preparation. These are proposed activities, quotes and message drafts, never recorded play. */
(() => {
  'use strict';
  const custom = 'Original Echo Below proposal. Time is an editable estimate of this bounded activity, not a printed downtime rule or travel/delivery time. Confirm costs, availability and any checks before resolution.';
  const opportunity = values => ({status:'proposed',rules:'custom-narrative',source:custom,...values});
  const opportunities = [
    opportunity({
      id:'dt-donavan-dianna',title:'Donavan · a letter with an ordinary detail',category:'relationships',town:'waterdeep',characterId:'pc-donavan',npcIds:[],
      summary:'Prepare a private letter to Dianna, or stage her next reply after an actual message and a plausible delivery interval. Give family life space beside the research.',durationMinutes:60,
      cost:{amountCp:null,label:'Writing supplies and delivery quote unconfirmed; using supplies already owned may cost nothing.'},
      prerequisites:['Donavan chooses whether and what to write.','Confirm an address, in-world delivery route and who may handle the sealed letter.','For a reply, review his actual message and elapsed delivery time. Brodey supplies any new family detail.'],
      uncertainty:'A courier estimate does not confirm delivery. Dianna can evaluate a stated model, but cannot authenticate observations she did not witness. Silence does not establish danger or estrangement.',
      consequences:['An approved delivered letter establishes only what its named recipient read.','An answer may suggest a comparison or ask an ordinary personal question; it does not solve the Nine or establish Markus’s fate.','The player may keep the exchange private, share an excerpt, or postpone it without a relationship penalty.'],
      steps:['Choose one personal detail and, optionally, one precise research question.','Separate observations, expectations and interpretations; redact other characters’ private information.','Review the message, recipient, cost and delivery plan.','Record an actual dispatch or receipt only when it happens in the fiction; a draft remains unsent.'],
      correspondence:{from:'Dianna · proposed reply',to:'Donavan Kemp',subject:'Something ordinary, and one question',body:'Donavan,\n\nTell me one ordinary thing from your week. I would like to know what made you laugh, as well as what kept you thinking.\n\nIf you want a second pair of eyes on the measurements, send me the result you expected alongside the result you found. What would the same measurement look like somewhere unremarkable? I can help compare those; I cannot supply the part only you were there to see.\n\nWrite when you have a quiet moment.\nLove,\nDianna',audience:'owner',characterId:'pc-donavan'},
      sourceNotes:['Five-Character-Stories.md: Donavan, Dianna’s first reply.','Echo-Below-Campaign-Outline.md: Expedition 2 homecoming; reciprocal correspondence is a future possibility.']
    }),
    opportunity({
      id:'dt-donavan-comparison',title:'Donavan · one comparison worth keeping',category:'research',town:'waterdeep',characterId:'pc-donavan',npcIds:['selise','aven-rusk'],
      summary:'Offer Selise a bounded research question, or invite Aven to take independent notes on an ordinary control measurement. Prepare a record someone else can check.',durationMinutes:240,
      cost:{amountCp:null,label:'Appointment, copying and materials require a quote; no assumed free laboratory or spell components.'},
      prerequisites:['An actual observation, permitted copy or freely offered question exists.','An available willing observer and a safe ordinary comparison can be arranged.','Agree who keeps the originals, sees the result and may publish it.'],
      uncertainty:'A useful result may be a discrepancy, a method that does not work, or a narrower question. Similar measurements alone do not establish a common creator or cause.',
      consequences:['An approved result can support a clue or journal entry with its uncertainty preserved.','A new test may become a research project with its own quote and consent.','No dangerous activation, spell access, automatic discovery or publication follows from spending the time.'],
      steps:['Write the question and what result would change Donavan’s view.','Choose a non-destructive comparison and name the observers.','Make separate notes before discussing interpretations.','Review the actual findings, credit and audience before recording them.'],
      sourceNotes:['Five-Character-Stories.md: Donavan, a finding someone can reproduce.','Campaign-Courtyard-Data.js: Aven’s observation service and boundaries.']
    }),
    opportunity({
      id:'dt-pebble-makers',title:'Pebble · a drawing for the hammer-makers',category:'commissions',town:'waterdeep',characterId:'pc-pebble',npcIds:['orren'],
      summary:'Ask Orren for help making a careful drawing or ordinary maintenance assessment of Pebble’s hammer, then prepare a message for its makers.',durationMinutes:90,
      cost:{amountCp:null,label:'Drawing, inspection and delivery are separate quotes; no repair or upgrade is included automatically.'},
      prerequisites:['Pebble chooses to show the hammer and sets handling limits.','Confirm a way to reach the makers before calling a letter dispatched.','Any sample is legally held, safe to handle and offered with permission.'],
      uncertainty:'Orren may recognize a technique without knowing the makers. A mark is a lead to compare, not proof of anyone’s whereabouts. The makers’ names, address and reply remain open until established.',
      consequences:['Pebble can preserve his makers’ work and ask a specific craft or mineral question.','A reply may offer a test or a contact after the DM prepares its basis; it cannot certify an unknown mineral as food from a sketch.','No magical enhancement, hammer replacement or new property appears merely because the commission is accepted.'],
      steps:['Choose a drawing, inspection, maintenance quote or letter rather than bundling every service.','Describe an actual journey detail Pebble wants the makers to know.','Review the quote and exact handling or copying permission.','Record work actually delivered and keep an unsent draft available if the address is unresolved.'],
      correspondence:{from:'Pebble · draft for Byron to edit',to:'The dwarves who made Pebble’s hammer',subject:'The hammer is seeing new places',body:'I would like to send you a drawing of the hammer and tell you where I have been.\n\n[Byron: add a place Pebble actually visited and one thing he wants his makers to know.]\n\nI still want to learn about the shiny minerals you told me about. How would you tell a promising piece from one I should leave alone? If there is someone I could ask, I would like a name and a way to find them.\n\nPebble',audience:'owner',characterId:'pc-pebble'},
      sourceNotes:['Five-Character-Stories.md: Pebble, the makers’ mark and mineral comparisons.','Echo-Below-Campaign-Outline.md: follow the maker; contacts and provenance arise through play.']
    }),
    opportunity({
      id:'dt-pebble-route',title:'Pebble · a route he can explain',category:'training',town:'waterdeep',characterId:'pc-pebble',npcIds:['orenna-pike'],
      summary:'Invite Orenna or another willing neighbor to walk a short route, choose stable landmarks, and let Pebble give the directions on the return.',durationMinutes:120,
      cost:{amountCp:null,label:'Agree whether this is an invited walk or paid instruction, plus any supplies. No training fee is presumed.'},
      prerequisites:['Both ends of the route are actually accessible.','The neighbor is willing and available, with the party’s return arrangements respected.','Agree the scope: ordinary route practice, not a new proficiency.'],
      uncertainty:'A delivery obstruction or changed sign can prompt a revised route; it does not erase landmarks already established. Asking for directions remains a successful way to navigate.',
      consequences:['An approved route note can support later travel and help another visitor.','Confidence can show in Pebble’s choices without deleting his anxiety.','No proficiency, feat, speed bonus or other sheet benefit is granted by this short practice.'],
      steps:['Choose two destinations and three memorable landmarks.','Walk outward with room for questions.','Let Pebble choose how to lead the return, including asking for help.','Review the route note and whether it belongs privately to Pebble or in a shared journal.'],
      sourceNotes:['Five-Character-Stories.md: Pebble, navigation and confidence.','Campaign-Courtyard-Data.js: Orenna’s independent routine and optional Pebble contribution.']
    }),
    opportunity({
      id:'dt-ringgo-receipt',title:'Ringgo · honest work with a receipt',category:'employment',town:'waterdeep',characterId:'pc-ringgo',npcIds:['nessa-brindle','orenna-pike'],
      summary:'Offer a client-authorized security inspection or a bounded daylight delivery. Write down the task, fee and limits before accepting.',durationMinutes:240,
      cost:{amountCp:null,label:'Agree expenses and a separate payment on completion; no wage, advance or reward has been granted.'},
      prerequisites:['Choose an actual willing client and lawful access to the property or goods.','The client agrees the fee, deadline, acceptable methods and what counts as completion.','Ringgo may decline; no old-contact recognition or public confession is required.'],
      uncertainty:'The inspection may identify a modest repair rather than wrongdoing. A blocked delivery can be reported honestly and renegotiated; success need not involve violence.',
      consequences:['Work actually accepted and completed can create a receipt or a specific reference.','A client’s reference covers the work they witnessed, not Ringgo’s entire history.','Payment, expenses and any discovered problem require review before inventory or relationships change.'],
      steps:['Choose an inspection or delivery and specify what is excluded.','Review the fee, expenses, time and safe alternatives.','Resolve the actual work using relevant current abilities where a check matters.','Review the receipt, actual payment and who may receive a reference.'],
      sourceNotes:['Five-Character-Stories.md: Ringgo, a job with a receipt and the name on your door.','Campaign-Courtyard-Data.js: Nessa and Orenna retain ordinary work and boundaries.']
    }),
    opportunity({
      id:'dt-ringgo-supplies',title:'Ringgo · an expedition order with clear terms',category:'shopping',town:'waterdeep',characterId:'pc-ringgo',npcIds:['jori-fen','pellan-fen'],
      summary:'Help the party compare a small food or packing order from the Fen siblings. Confirm who carries it and when it can be collected.',durationMinutes:120,
      cost:{amountCp:null,label:'Itemized quote required: quantities, unit prices, delivery and any deposit. No stock or party money changes at the quote stage.'},
      prerequisites:['The siblings have been introduced or a meeting is being arranged.','The party approves its actual needs and a spending limit.','Confirm current stock and dietary suitability; Pebble’s needs are discussed separately.'],
      uncertainty:'An item can be unavailable or ready later. Offer substitutions, another supplier or a smaller order; do not invent a shortage as a secret plot.',
      consequences:['An approved purchase can produce specific inventory and custody changes.','A future collection promise should have an agreed date and fallback.','A friendly relationship does not imply free food or an unlimited discount.'],
      steps:['List named items and quantities from actual party needs.','Review availability, price, collection and any substitution.','Approve each purchase and record its payer and carrier.','Keep unfilled requests as orders rather than owned inventory.'],
      sourceNotes:['Campaign-Courtyard-Data.js: Jori and Pellan’s services and independent stall plans.','Campaign-Settlements.js: stock, services, orders and reviewed changes.']
    }),
    opportunity({
      id:'dt-trista-contact',title:'Trista · a contact with a clear boundary',category:'relationships',town:'waterdeep',characterId:'pc-trista',npcIds:['mara','selise'],
      summary:'Arrange a private meeting with Mara about one bounded favor or contact request. Selise can be an alternative for an openly agreed research or storage inquiry.',durationMinutes:90,
      cost:{amountCp:null,label:'Any fee, favor or storage charge must be stated before acceptance; a conversation creates no debt.'},
      prerequisites:['Trista chooses the contact and what they are permitted to know.','An actual introduction, message route or agreed meeting is available.','Do not offer an object-specific bargain to an NPC who has not learned about that object.'],
      uncertainty:'A contact can refuse, negotiate or have incomplete information. Their offer is a claim to assess, not evidence of betrayal or a guaranteed solution.',
      consequences:['A precise promise can support trust without revealing the BELOW token.','If Trista chooses to share, record the exact information and recipient; no automatic party journal entry.','Declining a theft request leaves lawful transport, storage or a different contact available.'],
      steps:['Name the practical help Trista wants and one boundary she will state.','Choose a private meeting or a limited written inquiry.','Review the offer, risk, fee and credible alternatives.','Record only the agreement and disclosures that actually occurred.'],
      correspondence:{from:'Trista · private draft to edit',to:'Mara Vey',subject:'A conversation on agreed terms',body:'I would like to discuss a practical favor. Before either of us promises anything, I want us to agree what is being asked and what information may be passed on.\n\n[Trista: add only the request you want Mara to receive, then choose a meeting place or reply route.]\n\nIf that does not work for you, say so. I would rather know the limit before we begin.',audience:'owner',characterId:'pc-trista'},
      sourceNotes:['Five-Character-Stories.md: Trista, Mara asks for the whole truth; privacy without isolation.','Echo-Below-Campaign-Outline.md: Mara needs a credible source before an object-specific inquiry.']
    }),
    opportunity({
      id:'dt-trista-practice',title:'Trista · a quiet practice agreement',category:'training',town:'waterdeep',characterId:'pc-trista',npcIds:['orenna-pike','aven-rusk'],
      summary:'Find a permitted time and place for ordinary movement practice while keeping the passage and neighbors’ work usable. Invite a partner only if Trista wants one.',durationMinutes:120,
      cost:{amountCp:null,label:'Space or instruction costs remain unquoted; using an agreed shared space may be free.'},
      prerequisites:['Agree which space is available and when.','Use current sheet abilities; agree safe limits before any magical practice.','Shared access, quiet times and other residents’ consent still apply.'],
      uncertainty:'A schedule may need adjusting around deliveries or Aven’s study. Negotiating another time is a useful outcome rather than a failed training roll.',
      consequences:['An approved shared-space routine can make later home scenes more specific.','Practice can support a chosen relationship without teaching a spell or disclosing a secret.','Any desired mechanical training benefit needs a separate rules decision and full requirements; this card awards none.'],
      steps:['Ask what kind of practice Trista would enjoy.','Choose a suitable space and a time residents can agree to.','Keep activity bounded and record any invitation actually accepted.','Review whether to retain a recurring appointment or just this visit.'],
      sourceNotes:['Campaign-Courtyard-Data.js: shared access, Aven’s quiet period and Trista’s optional contribution.','Five-Character-Stories.md: Shadow abilities are class features, independent of the BELOW token.']
    }),
    opportunity({
      id:'dt-aldric-records',title:'Aldric · a discreet records inquiry',category:'research',town:'waterdeep',characterId:'pc-aldric',npcIds:['dracuseth','selise'],
      summary:'Ask for a records specialist or archive index capable of checking a limited description of Aldric’s signet. Begin with access and provenance, not a claim about his identity.',durationMinutes:240,
      cost:{amountCp:null,label:'Inquiry, copying, specialist examination and further searches need separate quotes. This estimate covers the first inquiry only.'},
      prerequisites:['Aldric consents to the inquiry and approves every detail sent.','Choose a reachable intermediary or archive and confirm its access requirements.','Bowman establishes any Crown or family names before a document names them.','The ring remains with Aldric unless he separately agrees a real custody change.'],
      uncertainty:'A crest match could identify an office or design without identifying its wearer. Missing records, a paid search or a witness’s refusal are possible; none proves guilt, death or Halaster’s role.',
      consequences:['An approved result may provide a catalog reference, a named specialist or a narrower next question.','Corroborate an appointment record with independent craft or civilian evidence before confirming a memory.','No public disclosure, removed signet, compelled witness, restored memory or family outcome follows automatically.'],
      steps:['Write the minimum question and permitted description.','Review who can read it and the cost of the first search.','Record the actual answer and its source; distinguish no result from evidence of absence.','Offer Aldric a choice to continue, use an intermediary or stop.'],
      correspondence:{from:'Aldric Vane · private draft to edit',to:'Dracuseth',subject:'A discreet introduction to a records specialist',body:'I would like an introduction to someone who can examine the provenance of an old official crest. For now, I am asking who holds useful records and what access requires.\n\nPlease pass on only the description I approve. I will decide separately whether to provide a drawing, meet a witness or discuss names.\n\n[Add the permitted description and a private reply route before using this message.]',audience:'owner',characterId:'pc-aldric'},
      sourceNotes:['Five-Character-Stories.md: Aldric, the signet’s provenance; two records and a living witness.','Echo-Below-Campaign-Outline.md: Expedition 3 records lead and later corroborated evidence.']
    }),
    opportunity({
      id:'dt-aldric-repair',title:'Aldric · a small repair someone actually wants',category:'repairs',town:'waterdeep',characterId:'pc-aldric',npcIds:['nessa-brindle'],
      summary:'Ask Nessa whether there is an ordinary notebook, loose cover or household record she would welcome help preserving. Let the owner choose the useful task and its limits.',durationMinutes:180,
      cost:{amountCp:null,label:'Owner-approved materials and any professional work need a quote; voluntary help is not an assumed rent payment.'},
      prerequisites:['The owner actually requests or accepts help and permits access to the item.','Nessa agrees which steps she can supervise and what is outside Aldric’s experience.','Private pages remain closed unless their owner authorizes reading.'],
      uncertainty:'The item may need a professional repair, replacement or more time. A careful assessment can be the whole useful result.',
      consequences:['Completed work can create a modest acknowledged act of care and a specific future interaction.','The recipient cannot absolve harms suffered by someone else, and help does not require Aldric to disclose his past.','No tool proficiency, recovered historical clue or magical repair is awarded by default.'],
      steps:['Ask what would help rather than choosing a task for the recipient.','Review the repair plan, cost, handling permission and stop point.','Perform only the work the DM and owner agreed was feasible.','Record the actual change and any thanks or follow-up that was expressed.'],
      sourceNotes:['Campaign-Courtyard-Data.js: Nessa’s craft, property boundaries and Aldric’s optional contribution.','Five-Character-Stories.md: Aldric’s atonement through present choices on recipients’ terms.']
    }),
    opportunity({
      id:'dt-donavan-notebook',title:'Donavan · commission a useful field notebook',category:'commissions',town:'waterdeep',characterId:'pc-donavan',npcIds:['nessa-brindle'],
      summary:'Describe the actual problems of recording an expedition and ask Nessa to quote a notebook or protective case suited to them.',durationMinutes:60,
      cost:{amountCp:null,label:'Custom quote pending: materials, deposit, final payment and collection time. The meeting estimate is not the manufacturing time.'},
      prerequisites:['Nessa is available and willing to consider the work.','Donavan specifies ordinary use, size and permission to inspect any existing notebook.','Agree what the commission excludes, especially magical protection or unrestricted access to private notes.'],
      uncertainty:'Available materials and other orders affect the quote and completion date. A less costly design, staged work or a declined commission are all possible.',
      consequences:['An accepted specification creates a bounded order, not an item already owned.','Delivery and payment can later be reviewed with the notebook’s actual features and custody.','No spellbook contents, spell access, waterproof guarantee or mechanical bonus is implied.'],
      steps:['Choose the problem: loose pages, crowded notes, carrying damage or organization.','Review Nessa’s proposed design, full price and availability.','Record any accepted deposit and promised completion date separately.','Review the finished ordinary item before marking the commission fulfilled.'],
      sourceNotes:['Campaign-Courtyard-Data.js: Nessa’s bindery service and independent order book.','Campaign-Settlements.js: commissions and orders await an actual approved result.']
    }),
    opportunity({
      id:'dt-pebble-phandalin-kit',title:'Pebble · supplies for the next known road',category:'shopping',town:'phandalin',characterId:'pc-pebble',npcIds:[],
      summary:'Use a willing local shopkeeper to price an ordinary route notebook, suitable packing supplies or another item Pebble actually wants before the party’s next journey.',durationMinutes:90,
      cost:{amountCp:null,label:'Use the current shop’s stock and itemized prices; negotiate custom work separately. No presumed discount for an unconfirmed rescue.'},
      prerequisites:['Select a shop that is actually open and an item available there.','Pebble chooses the item and an affordable spending limit.','Use only destinations the party has learned; unresolved Phandelver outcomes stay unresolved.'],
      uncertainty:'A shop may have a substitute, a lead to a supplier or no suitable item. Purchase of a map does not make every route accurate or every destination safe.',
      consequences:['An approved purchase establishes a specific item, payer and carrier.','An ordinary route sketch can distinguish confirmed landmarks from a shopkeeper’s claims.','No unknown mineral is sold as safe food and no purchase identifies the hammer-makers’ colleague.'],
      steps:['Ask what would help Pebble feel prepared.','Check stock, suitability, source and price with the selected shopkeeper.','Review the purchase and its actual inventory change.','Keep uncertain directions labeled as claims and leave undiscovered destinations hidden.'],
      sourceNotes:['Five-Character-Stories.md: Pebble’s navigation, mountain home and maker questions.','Latest-Redbrand-Session-Actual-Recap.md: Gundren was left at an inn; the party stopped at Barthen’s Provisions. Shopping remains a future option.']
    })
  ];
  const plans = [
    {id:'dt-plan-nessa-orders',title:'Nessa reviews space for an apprentice',town:'waterdeep',npcIds:['nessa-brindle'],kind:'plan',owner:'Nessa Brindle',dueAfterMinutes:4320,
      requirements:'Offer only once Nessa and the bindery have been introduced. Set or change the proposed review date with the DM; three days is a scheduling suggestion, not established history.',
      proposal:'Nessa could reorganize her own workroom and ask customers to use a shorter collection window while she considers teaching an apprentice. No trainee is hired, rent raised or party property moved automatically.',
      uncertainty:'Her order book, available help and actual agreements determine whether this is feasible.',
      consequences:['If approved, announce the actual collection arrangement to customers who need it.','Any shared-space change goes through the existing lodging or relationship review.'],source:custom},
    {id:'dt-plan-fen-route',title:'The Fen siblings compare a new stall route',town:'waterdeep',npcIds:['jori-fen','pellan-fen'],kind:'plan',owner:'Jori and Pellan Fen',dueAfterMinutes:2880,
      requirements:'Introduce the siblings and establish that they are considering a route. Choose a real day for comparison; two days is an editable preparation estimate.',
      proposal:'Jori and Pellan could try one trading day on a different ordinary route, then compare costs and sales before deciding anything about a lease. Their current stall and savings do not change until an actual result is approved.',
      uncertainty:'Weather, permission, customer turnout and transport may make the test inconclusive.',
      consequences:['An approved trial may alter one collection time or create a modest delivery request.','The siblings decide their own business terms; party help is optional and no unexplained debt appears.'],source:custom},
    {id:'dt-plan-aven-exam',title:'Aven asks about a workable study schedule',town:'waterdeep',npcIds:['aven-rusk'],kind:'deadline',owner:'Aven Rusk',dueAfterMinutes:7200,
      requirements:'An examination date must first be established through play. Five days is a proposed lead time for planning; reaching it does not establish a result.',
      proposal:'Aven could ask for a specific quiet study period and review which paid errands can wait. At the agreed deadline, prepare an outcome for the DM to review rather than deciding pass, failure or illness automatically.',
      uncertainty:'Aven’s own preparation and the examination’s actual demands matter. Help improves circumstances without guaranteeing success.',
      consequences:['An approved schedule can change when the landing is busy.','Aven may accept help, choose another arrangement or decline company; nobody acquires a teaching duty or a spell.'],source:custom},
    {id:'dt-plan-dracuseth-checkin',title:'Dracuseth reports on one agreed city task',town:'waterdeep',npcIds:['dracuseth'],kind:'deadline',owner:'Dracuseth',dueAfterMinutes:1440,
      requirements:'Use only after a specific task, recipients, limits and report time were actually agreed. Replace the one-day suggestion with that agreement.',
      proposal:'Review the accepted task and prepare what Dracuseth could credibly have learned or completed, with its source and remaining limits. He can report a delay or ask for clarification; no result is assumed while the party is away.',
      uncertainty:'An intermediary may be unavailable, a record restricted or a message still in transit.',
      consequences:['An approved private report can be sent only to the intended in-app recipient.','Additional work is a new choice, and Dracuseth retains his own responsibilities instead of joining an expedition.'],source:custom}
  ];
  globalThis.ECHO_DOWNTIME_DATA = {
    version:1,title:'Between expeditions',status:'future-preparation',
    authority:'Prepared from approved campaign direction. No newer play beyond the Redbrand-hideout stopping point is confirmed. Only reviewed actual outcomes establish work, spending, messages, promises or town changes.',
    categories:[{id:'commissions',label:'Commissions'},{id:'shopping',label:'Shopping'},{id:'research',label:'Research'},{id:'training',label:'Training'},{id:'employment',label:'Employment'},{id:'repairs',label:'Repairs'},{id:'relationships',label:'Relationships'}],
    opportunities,plans,
    rulesReferences:[{book:'dmg',page:127,label:'2014 DMG · Downtime activities',note:'Existing shelf reference for the DM to select a full rules procedure when appropriate.'},{book:'xan',page:123,label:'Xanathar’s Guide · Downtime Revisited',note:'Existing shelf reference; optional procedures require the DM to select them. These narrative proposals do not silently adopt them.'}],
    boundaries:['All durations and plan dates are editable story estimates until approved. Delivery, manufacturing and multi-day rules procedures may require additional time.','All unknown costs remain unquoted, not free. Confirm money, inventory, recipients and resources explicitly.','Messages are in-app drafts and records. No external email, text, notification or delivery is authorized.','Owner correspondence stays private until its owner or DM deliberately chooses a permitted audience. No NPC gains knowledge from being listed on a proposal.','Training offers practice and social opportunities. Mechanical benefits require a separate rules procedure and reviewed prerequisites.','Town plans propose consequences for review; dates alone never decide a person’s fate, alter a relationship or complete a quest.'],
    sourceNotes:['Echo-Below-Campaign-Outline.md: Phandalin transition, Act I home and expedition returns, later character inquiries.','Five-Character-Stories.md: verified five-character foundations and future opportunities.','Campaign-Courtyard-Data.js: established proposed cast, routines, services and boundaries.','Session-01-Story-Data.js: verified NPC IDs and existing Waterdeep contacts.','Session-01-Rules-Data.js: existing shelf links for 2014 DMG p.127 and optional Xanathar’s Guide p.123.','All new letters and activity descriptions are original campaign preparation.']
  };
})();
