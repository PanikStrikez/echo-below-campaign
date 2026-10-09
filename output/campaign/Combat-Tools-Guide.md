# Faster combat at the table

Refresh the DM app and phone pages after this update. In the right sidebar open **Turn → Combat tools**. The tools use the existing session saves and Undo/Redo history.

## Target directly on the map

Choose **Target** in the map toolbar or **Tap token to target** in the attack panel. Tap a creature to set the active attacker’s target. In an open phone-action review, the same tool adds a target to that review. Switch back to **Move / reveal** for ordinary map use.

On a phone, open an action request, then tap visible tokens on the map to select or deselect recipients. The target checkboxes remain available too.

## Move tokens directly

Drag any placed token on the DM map and release it where you want it. The position saves immediately, updates the TV, and can be reversed with **Undo**. This works for player characters, allies, and enemies, including when another map tool is selected. To move a selected group, check its members under **Maps → Tokens**, then drag one member; the others keep their relative positions.

The active-turn panel records approximate movement used from the straight drag. Movement beyond speed, movement outside the active turn, and possible opportunity attacks produce DM reminders; they do not block token placement. You decide how to handle those rules. Crossing a persistent spell area still creates its entry reminder.

On a phone, a player drags only their own token to request a destination. The DM sees **Place token** or **Dismiss**. Approving places it directly; phones cannot move enemy tokens. The DM may always place the token manually instead.

## Ask several players for saves

In **Saves**, choose the label, ability, DC, and targets. Choose each target’s roll mode or use the condition suggestions. **Send saving throws** puts a prominent request on each affected player’s phone. Players roll digitally or enter their physical-dice total including modifiers. The DM sees waiting/passed/failed, total, and roll method together.

Creature saves, disconnected players, automatic failures, and table rulings can be entered on the DM screen. **Request again / correct** reopens a result with a new revision, so an old phone response cannot overwrite it.

Use **Stage damage using these saves** to carry the selected targets and outcomes into damage review. A phone-action save step can also select a matching collected batch. Unresolved, mismatched, or stale results block application. The older area-effect panel has a shortcut to send its selected saves to phones.

## Pause for reactions

Use **Pause for reactions** after an attack roll or in staged damage. The turn cannot advance while a reaction window is open. Affected phones can pass or request a reaction; the DM resolves each response and closes the window. A direct token drag may create an opportunity-attack reminder; resolve it manually if it applies.

**Shield** is offered for characters with that spell available. Select the slot, then apply it: the slot and reaction are spent together, AC increases by 5, and the bonus expires at the caster’s next turn start. If another change alters AC before expiry, the app asks for a correction instead of overwriting it. The staged attack keeps its roll and compares against the new AC.

Other reactions remain deliberate decisions. Resolve an opportunity attack as a separate damage event, select the reacting creature, and review damage; mark the reaction spent. Account for any additional feature/resource cost in the character action review or sheet. Check reach, visibility, Disengage, forced movement, teleportation, and special abilities before allowing an attack.

For a phone action, **Pause for reactions; keep these rolls** keeps its prepared rolls. After closing the window, return to **Actions** and prepare the updated preview; matching rolls are reused, while changed dice or modifiers require new rolls.

## Review damage components

The active-turn attack flow now stages damage. In **Damage**, add separate amounts and types—for example slashing and fire. Mark attack damage, magical damage, silver, or adamantine as appropriate. Review each target’s resistance, vulnerability, immunity, temporary HP, and final HP before applying.

Recorded nonmagical-attack defenses check those properties. Add custom conditional defenses, or explicitly override an ambiguous defense for the particular component and target. Unknown conditional wording stops application and asks for a ruling. A successful save applies the chosen half/no-damage rule before component defenses.

One damage event may contain several components. Separate hits should be separate events, particularly for concentration and reaction timing. Concentration reminders use the total adjusted damage from the event. Full automation of unusual reductions, feature costs, death outcomes, and ongoing spell mechanics is not assumed—review them with the relevant card.

After previewing, **Apply reviewed damage** changes the selected targets and recorded action/reaction usage together. Changes to combat state invalidate the preview. Session **Undo** reverses the operation.

## Condition guidance

Attack and save panels explain relevant condition-based advantage/disadvantage, including cancellation when both apply. Fear, invisibility, senses, automatic failures, and special critical-hit cases show reminders when more context is needed. The roll selector remains the DM’s override. Guidance refers to the campaign’s 2014 condition baseline; check character-specific exceptions.

## Persistent spell areas

Draw a circle, square, cone, or line with the map tools. Under **Areas**, choose that template, name it, assign the caster/duration anchor, and select entry/start/end triggers. Set rounds and the owner’s start or end point for countdown; zero means manual expiry. Converting the template removes the loose drawing and stores an independent persistent area.

An area can be private, visible on TV, difficult terrain, and bound to the caster’s current concentration. Crossing it or reaching the selected turn point creates a reminder; duration expiry and lost concentration also create reminders. Entry reminders are limited to once per creature per turn. The app does not silently apply area damage or remove every lingering spell condition. Acknowledge the reminder after handling it.

## Boss phases and environment events

Under **Events**, prepare a name, trigger hint or HP threshold, changed tactics/instructions, optional boss, tokens to reveal/place, and areas to activate. Trigger manually when appropriate. The active-turn card shows the boss’s current phase. Repeating hazards can be marked repeatable.

Triggering an event records it and activates its prepared changes. Player announcements are separate: **Show player announcement** asks for the exact text to show. Private tactics and untriggered events stay off the TV and phones.

## Reliability and privacy

Combat settings, token positions, phone movement requests, staged damage, save results, reaction windows, spell areas, events, and reminders survive session save/restore and participate in normal Undo/Redo. A phone receives only its own save/reaction prompts, visible terrain geometry, and the existing player-safe map. DCs, enemy statistics, private event instructions, hidden areas, and other players’ prompts are excluded.

Verified with logic, control-interaction, save/restore, privacy, local phone-service, and large-map movement checks. Actual TV and phone hardware should still get the app’s normal table check before play.
