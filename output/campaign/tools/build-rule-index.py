"""Build a page-finding index from temporary OCR and the official SRD 5.1 PDF.

The app receives only word-to-page links and catalog metadata, not copied handbook prose.
Run with the bundled Python that has pypdf installed.
"""
from __future__ import annotations

import argparse
import glob
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

from pypdf import PdfReader


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).lower()
    value = "".join(c for c in value if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def words(value: str) -> set[str]:
    return {word for word in normalize(value).split() if 3 <= len(word) <= 28}


def ocr_pages(pattern: str) -> dict[int, str]:
    pages = {}
    for filename in glob.glob(pattern):
        with open(filename, encoding="utf-8") as stream:
            for line in stream:
                try:
                    entry = json.loads(line)
                    pages[int(entry["page"])] = entry["text"]
                except (ValueError, KeyError, TypeError):
                    continue
    return dict(sorted(pages.items()))


def inverted(pages: dict[int, str]) -> dict[str, list[int]]:
    result = defaultdict(list)
    for page, text in pages.items():
        for word in words(text):
            result[word].append(page)
    return dict(sorted(result.items()))


def srd_lines(reader: PdfReader, page: int) -> list[str]:
    text = unicodedata.normalize("NFKD", reader.pages[page - 1].extract_text() or "").replace("\r", "")
    return [re.sub(r"\s+", " ", line).strip() for line in text.splitlines() if line.strip()]


def find_book_page(pages: dict[int, str], title: str, start: int, end: int) -> int | None:
    # OCR often blends the two book columns into one line. Prefer a heading in
    # small caps to an earlier passing mention in a spell or treasure table.
    best = (0, None)
    pattern = re.compile(rf"\b{re.escape(title)}\b", re.I)
    for page in range(start, end + 1):
        for line in pages.get(page, "").splitlines():
            match = pattern.search(line)
            if not match:
                continue
            letters = [c for c in match.group() if c.isalpha()]
            uppercase = sum(c.isupper() for c in letters) / max(1, len(letters))
            if uppercase < 0.55:
                continue
            clean_line = normalize(line)
            clean_title = normalize(title)
            if clean_line == clean_title:
                score = 100
            elif clean_line.startswith(clean_title):
                score = 90
            elif clean_line.endswith(clean_title):
                score = 80
            else:
                score = 60
            if score > best[0]:
                best = (score, page)
    return best[1]


PHB_PRINTED_TO_PDF = {
    11: 8, 17: 13, 45: 39, 76: 70, 77: 71, 78: 72, 79: 73, 82: 76, 84: 78,
    85: 79, 94: 88, 95: 89, 96: 90, 112: 106, 114: 108, 115: 109, 121: 114, 143: 134,
    163: 152, 173: 160, 174: 161, 175: 162, 177: 164, 179: 166, 181: 167,
    182: 168, 183: 169, 185: 171, 186: 172, 189: 173, 190: 174, 192: 176,
    194: 178, 195: 179, 196: 180, 197: 181, 198: 182, 201: 183, 203: 185,
    204: 186, 207: 188, 211: 192, 290: 267, 291: 268, 292: 269, 293: 270,
    300: 277,
}


def catalog(reader: PdfReader, phb: dict[int, str], dmg: dict[int, str]) -> list[dict]:
    entries = []
    seen = set()
    for page in range(114, 195):
        lines = srd_lines(reader, page)
        for title, details in zip(lines, lines[1:]):
            if len(title) > 65 or not re.match(r"^[A-Z][A-Za-z]", title):
                continue
            level_match = re.match(r"^([1-9])(?:st|nd|rd|th).*level\s+([a-z]+)", details, re.I)
            cantrip_match = re.match(r"^([A-Za-z]+) cantrip", details, re.I)
            if not (level_match or cantrip_match) or title in seen:
                continue
            seen.add(title)
            level = int(level_match.group(1)) if level_match else 0
            school = (level_match.group(2) if level_match else cantrip_match.group(1)).lower()
            found = find_book_page(phb, title, 192, 267)
            entry = {
                "id": "spell-" + re.sub(r"[^a-z0-9]+", "-", normalize(title)).strip("-"),
                "title": title, "category": "spell", "book": "srd",
                "pdfPage": page, "printedPage": page,
                "alternateBook": "phb" if found else None, "alternatePdfPage": found,
                "tags": ["Cantrip" if level == 0 else f"Level {level}", school],
                "summary": "", "audience": "player", "edition": "2014",
                "source": f"SRD 5.1 printed p. {page}" + (f" · PHB scan candidate PDF p. {found}" if found else ""),
                "confidence": "SRD heading verified; check full spell text"
            }
            if "ritual" in details.lower():
                entry["tags"].append("ritual")
            entries.append(entry)

    for page in range(208, 261):
        lines = srd_lines(reader, page)
        for title, details in zip(lines, lines[1:]):
            if len(title) > 80 or title.endswith(".") or not re.match(r"^[A-Z][A-Za-z]", title):
                continue
            if not re.match(r"^(Armor \(|Weapon \(|Wondrous item,|Potion,|Ring,|Rod,|Scroll,|Staff,|Wand,)", details):
                continue
            key = f"item:{title}"
            if key in seen:
                continue
            seen.add(key)
            found = find_book_page(dmg, title, 135, 260)
            rarity = re.search(r"\b(very rare|uncommon|common|rare|legendary|artifact)\b", details, re.I)
            entry = {
                "id": "item-" + re.sub(r"[^a-z0-9]+", "-", normalize(title)).strip("-"),
                "title": title, "category": "item", "book": "srd",
                "pdfPage": page, "printedPage": page,
                "alternateBook": "dmg" if found else None, "alternatePdfPage": found,
                "tags": [details.split(" ")[0].strip("(,"), rarity.group(1).lower() if rarity else "magic item"],
                "summary": "", "audience": "dm", "edition": "2014",
                "source": f"SRD 5.1 printed p. {page}" + (f" · DMG scan candidate PDF p. {found}" if found else ""),
                "confidence": "SRD heading verified; check full item text"
            }
            entries.append(entry)
    return entries


CLASS_FEATURES = {
    "Barbarian": (8, 10, "Rage|Unarmored Defense|Reckless Attack|Danger Sense|Primal Path|Extra Attack|Fast Movement|Feral Instinct|Brutal Critical|Relentless Rage|Persistent Rage|Indomitable Might|Primal Champion"),
    "Bard": (11, 14, "Spellcasting|Bardic Inspiration|Jack of All Trades|Song of Rest|Bard College|Expertise|Font of Inspiration|Countercharm|Magical Secrets|Superior Inspiration"),
    "Cleric": (15, 18, "Spellcasting|Divine Domain|Channel Divinity|Destroy Undead|Divine Intervention"),
    "Druid": (19, 23, "Druidic|Spellcasting|Wild Shape|Druid Circle|Timeless Body|Beast Spells|Archdruid"),
    "Fighter": (24, 25, "Fighting Style|Second Wind|Action Surge|Martial Archetype|Ability Score Improvement|Extra Attack|Indomitable"),
    "Monk": (26, 29, "Unarmored Defense|Martial Arts|Ki|Unarmored Movement|Deflect Missiles|Monastic Tradition|Slow Fall|Extra Attack|Stunning Strike|Ki-Empowered Strikes|Evasion|Stillness of Mind|Purity of Body|Tongue of the Sun and Moon|Diamond Soul|Timeless Body|Empty Body|Perfect Self"),
    "Paladin": (30, 34, "Divine Sense|Lay on Hands|Fighting Style|Spellcasting|Divine Smite|Divine Health|Sacred Oath|Extra Attack|Aura of Protection|Aura of Courage|Improved Divine Smite|Cleansing Touch"),
    "Ranger": (35, 38, "Favored Enemy|Natural Explorer|Fighting Style|Spellcasting|Ranger Archetype|Primeval Awareness|Extra Attack|Land’s Stride|Hide in Plain Sight|Vanish|Feral Senses|Foe Slayer"),
    "Rogue": (39, 41, "Expertise|Sneak Attack|Thieves’ Cant|Cunning Action|Roguish Archetype|Uncanny Dodge|Evasion|Reliable Talent|Blindsense|Slippery Mind|Elusive|Stroke of Luck"),
    "Sorcerer": (42, 45, "Spellcasting|Sorcerous Origin|Font of Magic|Metamagic|Sorcerous Restoration"),
    "Warlock": (46, 51, "Otherworldly Patron|Pact Magic|Eldritch Invocations|Pact Boon|Mystic Arcanum|Eldritch Master"),
    "Wizard": (52, 55, "Spellcasting|Arcane Recovery|Arcane Tradition|Spell Mastery|Signature Spells"),
}


def feature_catalog(reader: PdfReader) -> list[dict]:
    result = []
    for klass, (first, last, names) in CLASS_FEATURES.items():
        pages = {page: normalize(reader.pages[page - 1].extract_text() or "") for page in range(first, last + 1)}
        for title in names.split("|"):
            phrase = normalize(title)
            heading = re.compile(rf"\b{re.escape(phrase)}\b\s+(?:at|starting|beginning|you|your|when|whenever|in|as|the|a|once|from|after|while|this|by|on|upon|if)\b")
            found = next((page for page, text in pages.items() if heading.search(text)), None)
            precise = found is not None
            if not found:
                found = next((page for page, text in pages.items() if re.search(rf"\b{re.escape(phrase)}\b", text)), None)
            if not found:
                continue
            result.append({
                "id": "feature-" + re.sub(r"[^a-z0-9]+", "-", normalize(f"{klass} {title}")).strip("-"),
                "title": title, "category": "feature", "book": "srd", "printedPage": found,
                "pdfPage": found, "tags": [klass, "2014 core"],
                "summary": "", "audience": "player", "edition": "2014",
                "source": f"SRD 5.1 printed p. {found}",
                "confidence": "SRD feature heading match" if precise else "SRD class section match; find feature text on this or nearby page"
            })
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--phb", required=True, help="Glob for temporary PHB OCR JSONL chunks")
    parser.add_argument("--dmg", required=True, help="Glob for temporary DMG OCR JSONL chunks")
    parser.add_argument("--srd", required=True, help="Official SRD 5.1 PDF")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    phb = ocr_pages(args.phb)
    dmg = ocr_pages(args.dmg)
    reader = PdfReader(args.srd)
    srd_pages = {i + 1: page.extract_text() or "" for i, page in enumerate(reader.pages)}
    entries = catalog(reader, phb, dmg) + feature_catalog(reader)
    payload = {
        "books": {
            "phb": {"terms": inverted(phb), "printedToPdf": PHB_PRINTED_TO_PDF,
                    "pdfToPrinted": {v: k for k, v in PHB_PRINTED_TO_PDF.items()}, "indexedPages": len(phb)},
            "dmg": {"terms": inverted(dmg), "printedToPdf": {i: i for i in range(1, 322)},
                    "pdfToPrinted": {i: i for i in range(1, 322)}, "indexedPages": len(dmg)},
            "srd": {"terms": inverted(srd_pages), "printedToPdf": {i: i for i in range(1, 404)},
                    "pdfToPrinted": {i: i for i in range(1, 404)}, "indexedPages": len(srd_pages)},
        },
        "catalog": entries,
    }
    Path(args.output).write_text("globalThis.ECHO_RULES_INDEX = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Indexed {len(phb)} PHB pages, {len(dmg)} DMG pages, {len(srd_pages)} SRD pages; {len(entries)} catalog entries")


if __name__ == "__main__":
    main()
