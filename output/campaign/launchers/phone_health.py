"""Connection observations; a joined cookie alone is not evidence of a live phone."""
import time


def seen(table, character):
    table.setdefault('phone_health', {}).setdefault(character, {})['seen'] = time.time()


def acknowledge(table, character, revision):
    if not isinstance(revision, int) or isinstance(revision, bool) or not 0 <= revision <= table['revision']:
        raise ValueError('Invalid update acknowledgement')
    seen(table, character)
    row = table['phone_health'][character]
    row.update(ack=revision, ack_at=time.time())


def claims(table, now=None):
    now = time.time() if now is None else now
    result = []
    for character in table['claims'].values():
        row = table.setdefault('phone_health', {}).get(character, {})
        age = now - row.get('seen', 0)
        stale = row.get('ack', -1) < table['revision'] and now - row.get('ack_at', 0) > 10
        result.append(dict(id=character, name=next((p['name'] for p in table['roster'] if p['id']==character), character),
            lastSeen=row.get('seen', 0), updatedAt=row.get('ack_at', 0), acknowledged=row.get('ack', -1),
            revision=table['revision'], status='offline' if age > 15 else 'stale' if stale else 'current'))
    return result


def manage(table, character, operation, target=None):
    tokens = [t for t, c in table['claims'].items() if c == character]
    if not tokens:
        raise ValueError('That phone is no longer joined')
    if operation == 'resync':
        table['revision'] += 1
        table.setdefault('phone_health', {}).setdefault(character, {}).update(ack=-1, ack_at=0)
        return
    if operation not in ('release', 'reassign'):
        raise ValueError('Unknown phone action')
    if operation == 'reassign':
        if target == character or target not in {p['id'] for p in table['roster']} or target in table['claims'].values():
            raise ValueError('Choose an unclaimed character')
    for token in tokens:
        if operation == 'release':
            del table['claims'][token]
        else:
            table['claims'][token] = target
    table.setdefault('phone_health', {}).pop(character, None)
    if target:
        table['phone_health'][target] = {'reassigned': True}
    # Queued actions from the old assignment must not execute after reassignment.
    table['events'] = [e for e in table['events'] if e.get('characterId') != character]
    table['revision'] += 1
