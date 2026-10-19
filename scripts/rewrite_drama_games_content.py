#!/usr/bin/env python3
"""Rewrite Drama Games description + activity_text into TipTap-friendly HTML.

Updates artifacts/ccd/src/data/demoSnapshot.json and writes
supabase/data-updates/2026-10-19_drama_games_content.sql
"""

from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "artifacts/ccd/src/data/demoSnapshot.json"
SQL_OUT = ROOT / "supabase/data-updates/2026-10-19_drama_games_content.sql"
BEFORE_OUT = Path("/tmp/drama-games/before_after_samples.json")

TITLE_FIXES = {
    # obvious typos only — leave intentional titles alone
}


def esc(text: str) -> str:
    return html.escape(text, quote=False)


def p(text: str) -> str:
    return f"<p>{esc(text)}</p>"


def strong_heading(label: str) -> str:
    return f"<p><strong>{esc(label)}</strong></p>"


def ul(items: list[str]) -> str:
    # TipTap-friendly list items (plain li text renders cleanly in prose + editor)
    lis = "".join(f"<li>{esc(i)}</li>" for i in items if i)
    return f"<ul>{lis}</ul>"


def ol(items: list[str]) -> str:
    lis = "".join(f"<li>{esc(i)}</li>" for i in items if i)
    return f"<ol>{lis}</ol>"


def brit(text: str) -> str:
    """Light British English normalisation for teacher copy."""
    replacements = [
        (r"\bhumor\b", "humour"),
        (r"\bHumor\b", "Humour"),
        (r"\bcharacterize\b", "characterise"),
        (r"\bCharacterize\b", "Characterise"),
        (r"\bcharacterization\b", "characterisation"),
        (r"\bCharacterization\b", "Characterisation"),
        (r"\bcolor\b", "colour"),
        (r"\bColor\b", "Colour"),
        (r"\bcolors\b", "colours"),
        (r"\bColors\b", "Colours"),
        (r"\bfavor\b", "favour"),
        (r"\bcenter\b", "centre"),
        (r"\bCenter\b", "Centre"),
        (r"\borganize\b", "organise"),
        (r"\borganizing\b", "organising"),
        (r"\bsynchronize\b", "synchronise"),
        (r"\bsynchronization\b", "synchronisation"),
        (r"\bsynchronisation\b", "synchronisation"),
        (r"\brecognize\b", "recognise"),
        (r"\bRecognize\b", "Recognise"),
        # Primary UK wording
        (r"\bstudents\b", "pupils"),
        (r"\bStudents\b", "Pupils"),
    ]
    out = text
    for pat, repl in replacements:
        out = re.sub(pat, repl, out)
    return out


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text or "")


def parse_description(raw: str) -> tuple[str, list[str]]:
    plain = re.sub(r"\s+", " ", strip_html(raw)).strip()
    parts = re.split(r"\s*•\s*", plain)
    rules = parts[0].strip()
    bullets = [brit(b.strip().rstrip(".")) for b in parts[1:] if b.strip()]
    # Deduplicate while preserving order
    seen = set()
    uniq = []
    for b in bullets:
        key = b.lower()
        if key not in seen:
            seen.add(key)
            uniq.append(b)
    return rules, uniq[:3]


def split_steps(rules: str, title: str = "", level: str = "KS1") -> list[str]:
    """Split rule prose into numbered how-to steps."""
    text = rules.strip()
    if not text:
        return []
    text = text.replace("…", "...")
    chunks = re.split(r"(?<=[.!?])\s+(?=[A-Z\"'(])", text)
    steps: list[str] = []
    for chunk in chunks:
        chunk = chunk.strip().rstrip(".")
        if not chunk:
            continue
        if "; " in chunk and len(chunk) > 90:
            for sub in chunk.split("; "):
                sub = sub.strip().rstrip(".")
                if sub:
                    steps.append(brit(sub[0].upper() + sub[1:]))
        else:
            steps.append(brit(chunk[0].upper() + chunk[1:]))

    if len(steps) == 1 and len(steps[0]) > 110:
        rest = steps[0]
        parts2 = re.split(r"(?=\b(?:Then|When|After|Next|Finally|On cue|On a cue)\b)", rest)
        if len(parts2) > 1:
            steps = [brit(p.strip().rstrip(".")) for p in parts2 if p.strip()]

    cleaned = []
    for s in steps:
        s = re.sub(r"\s+", " ", s).strip()
        if not s:
            continue
        if cleaned and len(s) < 28:
            cleaned[-1] = cleaned[-1].rstrip(".") + ". " + s
        else:
            cleaned.append(s)
    steps = cleaned[:6] or [brit(rules.rstrip("."))]

    # Expand thin single-step entries into a clear play sequence
    if len(steps) == 1:
        steps = expand_single_step(title, rules, level, steps[0])
    return steps[:6]


def expand_single_step(title: str, rules: str, level: str, core: str) -> list[str]:
    """Turn a one-line rule into Setup-ready numbered play steps."""
    r = rules.lower()
    core = brit(core.rstrip("."))
    out: list[str] = []

    if any(k in r for k in ("pairs", "pair", "partner")):
        out.append("Ask the class to find a partner and face each other with a little space around them.")
    elif "circle" in r:
        out.append("Bring the class into a circle so everyone can see and hear.")
    elif any(k in r for k in ("small groups", "groups of", "teams")):
        out.append("Organise the class into small groups and give them a clear playing space.")
    else:
        out.append("Gather attention and explain the game in one short sentence.")

    out.append(core + ".")

    if any(k in r for k in ("freeze", "statue", "tableau")):
        out.append("Use a clear freeze cue; hold the picture, then relax and reset.")
    elif any(k in r for k in ("guess", "guesses")):
        out.append("Take a few guesses, reveal the answer, then rotate so another child has a turn.")
    elif any(k in r for k in ("swap", "switch", "rotate", "next")):
        out.append("Swap roles or rotate turns so everyone leads at least once.")
    else:
        if level == "Reception":
            out.append("Repeat once or twice, celebrating clear choices, then stop while energy is still high.")
        else:
            out.append("Play a second round with a fresh prompt, then share one strong moment with the class.")

    normalised = []
    for s in out:
        s = brit(s.strip())
        if not s.endswith((".", "!", "?")):
            s += "."
        normalised.append(s)
    return normalised


def infer_setup(title: str, rules: str, level: str, time: int | None) -> str:
    r = (rules + " " + title).lower()
    bits: list[str] = []

    # Space
    if any(k in r for k in ("walk around", "room", "space", "obstacle", "escape", "relay", "bus stop")):
        bits.append("Open floor space with clear pathways.")
    elif "circle" in r:
        bits.append("Clear space so the class can sit or stand in a circle.")
    elif any(k in r for k in ("pairs", "pair", "partner")):
        bits.append("Clear floor space. Children work in pairs.")
    elif any(k in r for k in ("small groups", "groups of", "group of", "teams", "in groups")):
        bits.append("Open floor space. Work in small groups.")
    else:
        bits.append("Clear floor space for movement.")

    # Grouping detail
    if "3-5" in r or "3–5" in r:
        bits.append("Groups of 3–5.")
    elif "teams" in r:
        bits.append("Split into equal teams.")
    elif re.search(r"\bwhole class\b|\beveryone\b|\bgroup\b", r) and "pair" not in r and "small group" not in r:
        if "circle" not in bits[0].lower():
            bits.append("Whole class.")

    # Props / resources — only when the original text implies them
    prop_bits = []
    if "music" in r and "music box" not in r:
        prop_bits.append("optional music player")
    if "chair" in r or "hot seat" in r or "bus stop" in r:
        prop_bits.append("chairs")
    if "hat" in r and "emotion" in r:
        prop_bits.append("hat and emotion slips")
    if "paper" in r and "map" in r:
        prop_bits.append("large paper and pens")
    if "puppet" in r:
        prop_bits.append("simple puppets (socks or paper bags)")
    if "prop" in r and "imaginary" not in r and "invisible" not in r and "mime" not in r:
        if "scarf" in r or "hat" in r or "cup" in r:
            prop_bits.append("a few simple props (scarf, hat, cup)")
        elif "box" in r and "prop box" in r:
            prop_bits.append("a box of unusual props")
        elif "mundane object" in r or "everyday object" in r or "random" in r:
            prop_bits.append("one everyday object")
        elif "stick" in r:
            prop_bits.append("one simple object (e.g. a stick)")
    if "script" in r or "table read" in r:
        prop_bits.append("short scripts or student-written scenes")
    if "character profile" in r and "sheet" in r:
        prop_bits.append("blank character profile sheets")
    if "cards" in r and "story cards" in title.lower():
        prop_bits.append("character, setting and problem cards")
    if "object from home" in r:
        prop_bits.append("a brought-in object (optional)")
    if "lights" in r and "museum" in r:
        prop_bits.append("optional light switch or 'lights' cue")

    if prop_bits:
        # dedupe
        seen = []
        for x in prop_bits:
            if x not in seen:
                seen.append(x)
        bits.append("Props: " + ", ".join(seen) + ".")
    else:
        bits.append("No props needed.")

    if time:
        bits.append(f"About {time} minutes.")

    return brit(" ".join(bits))


def gist(rules: str, max_len: int = 140) -> str:
    """First sentence of rules, trimmed for a teacher frame."""
    text = brit(rules.strip())
    # Prefer first sentence
    m = re.split(r"(?<=[.!?])\s+", text)
    first = (m[0] if m else text).strip().rstrip(".")
    if len(first) > max_len:
        first = first[: max_len - 1].rsplit(" ", 1)[0] + "…"
    return first


def framing_sentences(title: str, rules: str, level: str) -> str:
    """1–2 short teacher-facing framing sentences (not the full rules dump)."""
    core = gist(rules, 150 if level == "Reception" else 160)
    if level == "Reception":
        return f"Let's play {title}. {core}."
    if level == "KS1":
        return f"Play {title} to get everyone listening and responding. {core}."
    return f"Use {title} to sharpen listening and bold offers. {core}."


def teacher_tips(title: str, rules: str, level: str) -> list[str]:
    r = (rules + " " + title).lower()
    tips: list[str] = []

    if any(k in r for k in ("freeze", "still", "statue", "tableau")):
        tips.append("Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.")
    if any(k in r for k in ("close their eyes", "eyes closed", "blind", "who's missing")):
        tips.append("Keep the space obstacle-free and use a soft safety word if anyone feels unsure.")
    if "wink" in r or "tag" in r:
        tips.append("Remind children to tag or wink gently — no pushing.")
    if any(k in r for k in ("pairs", "partner")):
        tips.append("Model one round first, then swap roles so everyone leads.")
    if "music" in r and "music box" not in r:
        tips.append("Keep tracks short so you can reset energy quickly.")
    if any(k in r for k in ("circle", "pass")):
        tips.append("Keep the circle tight enough that everyone can see and hear.")
    if any(k in r for k in ("improvise", "improvis", "scene", "dialogue")):
        tips.append("Side-coach with short prompts rather than stopping the scene unless safety needs it.")
    if "hot seat" in r:
        tips.append("Protect the performer: questions stay kind and in-role.")

    # Level defaults
    if level == "Reception":
        tips.append("Keep rounds short and celebrate big, clear choices.")
        tips.append("Use simple stop/go cues the class already knows.")
    elif level == "KS1":
        tips.append("Praise clear listening and inventive detail.")
        if len(tips) < 3:
            tips.append("If energy spikes, freeze the group and restart from stillness.")
    else:
        tips.append("Ask for precision: clear offers, strong focus, and respectful audience behaviour.")
        if len(tips) < 3:
            tips.append("Name what worked after a round (listening, commitment, ensemble timing).")

    # Dedupe / cap 3
    out = []
    seen = set()
    for t in tips:
        t = brit(t)
        key = t.lower()
        if key not in seen:
            seen.add(key)
            out.append(t)
        if len(out) >= 3:
            break
    return out


def differentiation(title: str, rules: str, level: str) -> tuple[str, str]:
    r = (rules + " " + title).lower()
    if level == "Reception":
        easier = "Teacher models first; children copy as a whole group before trying in pairs."
        harder = "Add a second cue (speed, size or emotion) once the basic game is secure."
    elif level == "KS1":
        easier = "Reduce choices and model the first round together."
        harder = "Add a time limit, a second rule, or ask pairs to share one polished moment."
    else:
        easier = "Give a clearer prompt or allow a short planning whisper before performing."
        harder = "Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit)."

    if "pairs" in r:
        easier = "Work as a whole class first, then try with a partner."
    if "mime" in r or "invisible" in r or "imaginary" in r:
        harder = "Demand clearer weight, size and texture so the audience can 'see' the object."
    if "story" in r or "scene" in r:
        harder = "Require a clear beginning, middle and end within the time limit."
    if "sound" in r:
        harder = "Layer dynamics (loud/soft, near/far) and keep a shared pulse."

    return brit(easier), brit(harder)


def extension(title: str, rules: str, level: str) -> str | None:
    r = (rules + " " + title).lower()
    if level == "Reception":
        if "emotion" in r or "feel" in r:
            return "Link to a story book face or feeling word of the day."
        if "animal" in r:
            return "Choose animals from a class topic or story."
        return None
    if "tableau" in r or "freeze-frame" in r or "freeze frame" in r:
        return "Bring one statue to life for five seconds, then freeze again."
    if "soundscape" in r or "sound picture" in r:
        return "Perform the soundscape under a short narrated story."
    if "hot seat" in r:
        return "Write a diary entry or thought-track in role afterwards."
    if level == "KS2" and ("improv" in r or "scene" in r):
        return "Replay the strongest 20 seconds and polish one offer."
    return None


# Curated full rewrites where source text is empty/thin or needs special handling.
CURATED: dict[str, dict] = {
    "Bubble Gum Warm Up": {
        "level": "Reception",
        "description": (
            "Let's wake up our faces and imaginations with Bubble Gum Warm Up. "
            "We mime a huge piece of chewing gum, pass it around the circle in funny ways, and keep the silliness controlled."
        ),
        "benefits": [
            "Warms up facial expression and mime",
            "Builds turn-taking in a circle",
            "Encourages playful exaggeration without props",
        ],
        "setup": "Sit or stand in a circle with clear floor space. No props needed — the gum is imaginary. About 10 minutes.",
        "steps": [
            "Mime taking a piece of chewing gum from your pocket and putting it in your mouth (invent a silly flavour together).",
            "Chew with big, clear exaggeration so everyone can see.",
            "Stick the imaginary gum onto the person next to you in a new place each time (nose, shoe, hair, elbow).",
            "Pass the gum around the circle, each child finding a different way to stick and peel it off.",
            "Optional finish: stretch the gum between two children, then 'snap' it and freeze.",
        ],
        "tips": [
            "Keep it hygiene-friendly: remind children it is pretend gum only.",
            "Model one clear pass before the circle continues independently.",
            "Use a freeze cue if the energy gets too wild.",
        ],
        "easier": "Teacher leads the first full circuit while children copy the chew together.",
        "harder": "Add a rule: no repeating a stick-spot that has already been used.",
        "extension": "Invent a tiny story about where the gum came from before you pass it on.",
    },
}


def build_description_html(framing: str, benefits: list[str]) -> str:
    parts = [p(brit(framing))]
    parts.append(strong_heading("Why it works"))
    # Ensure 2–3 benefits
    bens = [brit(b) for b in benefits if b][:3]
    while len(bens) < 2:
        bens.append("Builds focus, listening and confidence in drama.")
    parts.append(ul(bens))
    return "".join(parts)


def build_activity_html(
    setup: str,
    steps: list[str],
    tips: list[str],
    easier: str,
    harder: str,
    extension: str | None = None,
    variation: str | None = None,
) -> str:
    parts = [
        strong_heading("Setup"),
        p(brit(setup)),
        strong_heading("How to play"),
        ol([brit(s) for s in steps]),
        strong_heading("Teacher tips"),
        ul([brit(t) for t in tips[:3]]),
        strong_heading("Make it easier"),
        p(brit(easier)),
        strong_heading("Make it harder"),
        p(brit(harder)),
    ]
    if extension:
        parts.append(strong_heading("Extension"))
        parts.append(p(brit(extension)))
    if variation:
        parts.append(strong_heading("Variation"))
        parts.append(p(brit(variation)))
    return "".join(parts)


def rewrite_activity(item: dict) -> tuple[str, str, str]:
    """Return (title, description_html, activity_text_html)."""
    title = TITLE_FIXES.get(item["activity"], item["activity"])
    level = item.get("level") or "KS1"
    time = item.get("time")
    raw_desc = item.get("description") or ""
    raw_at = item.get("activity_text") or ""

    if title in CURATED:
        c = CURATED[title]
        desc = build_description_html(c["description"], c["benefits"])
        at = build_activity_html(
            c["setup"],
            c["steps"],
            c["tips"],
            c["easier"],
            c["harder"],
            c.get("extension"),
            c.get("variation"),
        )
        return title, desc, at

    rules, bullets = parse_description(raw_desc)
    if not rules and raw_at:
        # Fall back to plain activity_text as rules source
        rules = re.sub(r"\s+", " ", strip_html(raw_at)).strip()
        bullets = bullets or [
            "Builds focus and ensemble awareness",
            "Develops mime and imaginative play",
            "Warm-up for creative expression",
        ]

    if not bullets:
        bullets = [
            "Builds focus and confidence",
            "Develops listening and response",
            "Supports creative drama skills",
        ]

    framing = framing_sentences(title, rules, level)
    # Keep framing to roughly 1–2 sentences (already structured that way)
    desc = build_description_html(framing, bullets)

    setup = infer_setup(title, rules, level, time)
    steps = split_steps(rules, title=title, level=level)
    # If we had detailed activity_text with numbered steps, prefer splitting that
    if raw_at and "<p>" in raw_at and re.search(r"\d+\.", strip_html(raw_at)):
        plain = strip_html(raw_at)
        numbered = re.findall(r"\d+\.\s*([^0-9]+?)(?=\d+\.|$)", plain)
        if len(numbered) >= 2:
            steps = [brit(re.sub(r"\s+", " ", n).strip().rstrip(".")) for n in numbered][:6]

    tips = teacher_tips(title, rules, level)
    easier, harder = differentiation(title, rules, level)
    ext = extension(title, rules, level)

    at = build_activity_html(setup, steps, tips, easier, harder, ext)
    return title, desc, at


def sql_escape(value: str) -> str:
    return value.replace("'", "''")


def main() -> int:
    data = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    activities = data["tables"]["activities"]
    drama = [a for a in activities if a.get("category") == "Drama Games"]
    print(f"Drama Games activities: {len(drama)}")

    samples = []
    updates = []
    for a in drama:
        before_desc = a.get("description") or ""
        before_at = a.get("activity_text") or ""
        title, desc, at = rewrite_activity(a)
        a["activity"] = title
        a["description"] = desc
        a["activity_text"] = at
        # Ensure headings stay consistent for editor
        if not a.get("description_heading"):
            a["description_heading"] = "Introduction/Context"
        if not a.get("activity_heading"):
            a["activity_heading"] = "Activity"
        a["updated_at"] = "2026-10-19T12:00:00.000Z"
        updates.append((a["id"], title, desc, at, before_desc, before_at))

    # Validate JSON round-trip
    SNAPSHOT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    json.loads(SNAPSHOT.read_text(encoding="utf-8"))

    # SQL script
    SQL_OUT.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "-- Drama Games content refresh (description + activity_text)",
        "-- Generated 2026-10-19 for Studio Score / CCDesigner",
        "-- Apply manually to the live Supabase database. Do not run from CI.",
        "-- Updates by activity id; titles/time/category/year groups unchanged",
        "-- (apart from any obvious title typo fixes applied in the snapshot).",
        "",
        "BEGIN;",
        "",
    ]
    for aid, title, desc, at, _, _ in updates:
        lines.append(f"-- {title}")
        lines.append(
            "UPDATE activities\n"
            f"SET description = '{sql_escape(desc)}',\n"
            f"    activity_text = '{sql_escape(at)}',\n"
            f"    updated_at = NOW()\n"
            f"WHERE id = '{aid}';"
        )
        lines.append("")
    lines.append(f"-- Expected rows updated: {len(updates)}")
    lines.append("COMMIT;")
    lines.append("")
    SQL_OUT.write_text("\n".join(lines), encoding="utf-8")

    # Sample before/after for the PR report
    pick_titles = ["Mirror Twins", "Ten-Second Objects", "Yes, and..."]
    by_title = {t: None for t in pick_titles}
    for aid, title, desc, at, before_desc, before_at in updates:
        if title in by_title and by_title[title] is None:
            by_title[title] = {
                "title": title,
                "before_description": before_desc,
                "before_activity_text": before_at,
                "after_description": desc,
                "after_activity_text": at,
            }
    samples = [by_title[t] for t in pick_titles if by_title[t]]
    BEFORE_OUT.parent.mkdir(parents=True, exist_ok=True)
    BEFORE_OUT.write_text(json.dumps(samples, indent=2, ensure_ascii=False), encoding="utf-8")

    # Sanity: every drama game has both fields, HTML structure markers present
    reloaded = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    drama2 = [a for a in reloaded["tables"]["activities"] if a.get("category") == "Drama Games"]
    assert len(drama2) == 163
    for a in drama2:
        assert a.get("description") and "Why it works" in a["description"], a.get("activity")
        assert a.get("activity_text") and "How to play" in a["activity_text"], a.get("activity")
        assert "Setup" in a["activity_text"]
        assert "Make it easier" in a["activity_text"]
        assert "Make it harder" in a["activity_text"]
    print(f"Updated {len(updates)} activities")
    print(f"Wrote {SQL_OUT}")
    print(f"Samples -> {BEFORE_OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
