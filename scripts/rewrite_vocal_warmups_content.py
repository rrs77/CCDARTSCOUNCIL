#!/usr/bin/env python3
"""Rewrite Vocal Warm-Ups area content + colours; retarget Drama Games tips.

Updates:
  - artifacts/ccd/src/data/demoSnapshot.json (activities + custom_categories)
  - supabase/data-updates/2026-10-19_vocal_warmups_content.sql
  - artifacts/ccd/src/utils/systemCategories.ts (palette defaults)

Teacher tips are exercise-specific (no shared template bank reused across items).
"""

from __future__ import annotations

import html
import json
import re
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "artifacts/ccd/src/data/demoSnapshot.json"
SQL_OUT = ROOT / "supabase/data-updates/2026-10-19_vocal_warmups_content.sql"
SYSTEM_CATS = ROOT / "artifacts/ccd/src/utils/systemCategories.ts"

VOCAL_CATS = {
    "Breathing Exercises",
    "Facial Warm-Ups / Diction",
    "Physical Starters",
    "Pitch Exercises",
    "Vocal Warm-Ups",
}

# Harmonious "studio voice" palette — distinct from existing system colours
CATEGORY_COLORS = {
    "Breathing Exercises": "#0F766E",  # deep teal — calm breath
    "Facial Warm-Ups / Diction": "#C2410C",  # burnt orange — face/articulation
    "Physical Starters": "#A16207",  # ochre — body/energy
    "Pitch Exercises": "#1D4ED8",  # strong blue — pitch/range
    "Vocal Warmups": "#9D174D",  # deep rose — parent folder
    "Vocal Warm-Ups": "#9D174D",
}

DEFAULT_TIME = {
    "Breathing Exercises": 2,
    "Facial Warm-Ups / Diction": 2,
    "Physical Starters": 3,
    "Pitch Exercises": 3,
    "Vocal Warm-Ups": 3,
}

# Truncated Vocal Warm-Ups titles → proper short names
VW_TITLE_FIXES = {
    "Shake hands up in - Physical Starters": "Shake Hands Chant",
    "Rub hands together, shake - Physical Starters": "Rub and Shake Hands",
    "Put feet together and - Physical Starters": "Side Bend Stretch",
    "Check posture by making - Physical Starters": "Posture Check",
    "Sing My bonny lies - Physical Starters": "My Bonny Letter B",
    "Imagine you are having - Physical Starters": "Shower Tap Wake-Up",
    "Raise one arm over - Physical Starters": "Arm Overhead Swaps",
    "Turn head to left, - Physical Starters": "Apple Chin Head Turns",
    "Hold out both hands - Physical Starters": "Fingers Ten and Five",
    "Find a good standing - Physical Starters": "Shoulder Swimming",
    "Pretend you are wearing - Breathing Exercises": "Inflatable Ring Breathing",
    "Place your hands underneath - Breathing Exercises": "Hands Under Rib Cage",
    "Hold out one hand - Breathing Exercises": "Finger Candles",
    "Say Ssh, ssh, ssh, - Breathing Exercises": "Ssh Shower Countdowns",
    "Stretch one arm out - Breathing Exercises": "Single Flame Puffs",
    "Make your lips very - Facial Warm-ups/Diction": "Lip Roll Horse",
    "Loosen the face by - Facial Warm-ups/Diction": "Chew Toffee Face Loosen",
    "Say the words Diction - Facial Warm-ups/Diction": "Diction Sentence",
    "Chant the scat words - Facial Warm-ups/Diction": "Shabba Doo Chant",
    "Sing the phrase Mama - Facial Warm-ups/Diction": "Mama Made Me Mash M'n'M's",
    "Sirening is the best - Pitch Exercises": "Sing Ng Siren",
    "Say the word laughing - Pitch Exercises": "Laughing Ng Hand Follow",
    "Think of an animal - Pitch Exercises": "Draw an Animal on Ng",
    "Begin by humming mm - Pitch Exercises": "Mm Head Resonance Hum",
    "Juggling with your voice - Pitch Exercises": "Whoah Voice Juggling",
}


def esc(text: str) -> str:
    return html.escape(text, quote=False)


def brit(text: str) -> str:
    reps = [
        (r"\bstudents\b", "pupils"),
        (r"\bStudents\b", "Pupils"),
        (r"\bcolor\b", "colour"),
        (r"\bcenter\b", "centre"),
        (r"\bvisualize\b", "visualise"),
        (r"\bVisualize\b", "Visualise"),
        (r"\bpractice\b(?= [a-z])", "practise"),
        (r"\borganize\b", "organise"),
        (r"\brecognize\b", "recognise"),
    ]
    out = text
    for pat, repl in reps:
        out = re.sub(pat, repl, out)
    return out


def strip_html(text: str) -> str:
    t = re.sub(r"<br\s*/?>", "\n", text or "", flags=re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    t = t.replace("&nbsp;", " ").replace("&amp;", "&")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def p(text: str) -> str:
    return f"<p>{esc(brit(text))}</p>"


def strong_h(label: str) -> str:
    return f"<p><strong>{esc(label)}</strong></p>"


def ul(items: list[str]) -> str:
    return "<ul>" + "".join(f"<li>{esc(brit(i))}</li>" for i in items if i) + "</ul>"


def ol(items: list[str]) -> str:
    return "<ol>" + "".join(f"<li>{esc(brit(i))}</li>" for i in items if i) + "</ol>"


def build_desc(framing: str, benefits: list[str]) -> str:
    bens = [b for b in benefits if b][:3]
    while len(bens) < 2:
        bens.append("Builds focus and confident vocal technique.")
    return p(framing) + strong_h("Why it works") + ul(bens)


def build_activity(
    setup: str,
    steps: list[str],
    tips: list[str],
    easier: str,
    harder: str,
    extension: str | None = None,
) -> str:
    parts = [
        strong_h("Setup"),
        p(setup),
        strong_h("How to do it"),
        ol(steps),
        strong_h("Teacher tips"),
        ul(tips[:3]),
        strong_h("Make it easier"),
        p(easier),
        strong_h("Make it harder"),
        p(harder),
    ]
    if extension:
        parts += [strong_h("Extension"), p(extension)]
    return "".join(parts)


def first_sentences(text: str, n: int = 2, max_len: int = 220) -> str:
    plain = strip_html(text)
    if not plain:
        return ""
    parts = re.split(r"(?<=[.!?])\s+", plain)
    out = " ".join(parts[:n]).strip()
    if len(out) > max_len:
        out = out[: max_len - 1].rsplit(" ", 1)[0] + "…"
    return out.rstrip(".")


def split_steps(rules: str, max_steps: int = 5) -> list[str]:
    text = strip_html(rules).strip()
    if not text:
        return ["Follow the teacher’s model, then try as a class."]
    chunks = re.split(r"(?<=[.!?])\s+(?=[A-Z\"'(])", text)
    steps = []
    for c in chunks:
        c = brit(c.strip().rstrip("."))
        if not c:
            continue
        if "; " in c and len(c) > 100:
            for sub in c.split("; "):
                sub = brit(sub.strip().rstrip("."))
                if sub:
                    steps.append(sub[0].upper() + sub[1:] if sub else sub)
        else:
            steps.append(c[0].upper() + c[1:] if c else c)
    if len(steps) == 1 and len(steps[0]) > 120:
        parts = re.split(r"(?=\b(?:Then|Next|After|Finally|Repeat)\b)", steps[0])
        steps = [brit(p.strip().rstrip(".")) for p in parts if p.strip()]
    cleaned = []
    for s in steps:
        s = re.sub(r"\s+", " ", s).strip()
        if not s:
            continue
        if not s.endswith((".", "!", "?")):
            s += "."
        cleaned.append(s)
        if len(cleaned) >= max_steps:
            break
    return cleaned or [brit(text.rstrip(".") + ".")]


# ---------- Vocal-specific benefits / setup / tips ----------


def vocal_benefits(cat: str, title: str, desc: str) -> list[str]:
    d = (title + " " + desc).lower()
    if cat == "Breathing Exercises":
        bens = [
            "Builds awareness of supported, low breath",
            "Prepares steady airflow for singing phrases",
        ]
        if "candle" in d or "blow" in d or "ssh" in d:
            bens.append("Practises controlled release of air without strain")
        elif "posture" in d or "rib" in d or "diaphragm" in d or "tummy" in d:
            bens.append("Links posture and breathing muscles for clearer tone")
        else:
            bens.append("Calms the class and focuses listening before repertoire")
        return bens
    if cat.startswith("Facial"):
        bens = [
            "Wakes facial muscles for clear diction",
            "Improves articulation without forcing the voice",
        ]
        if "tongue" in d:
            bens.append("Strengthens tongue agility for consonants")
        elif "lip" in d or "brrr" in d or "roll" in d:
            bens.append("Loosens lips for freer onset and buzz")
        else:
            bens.append("Makes warm-up playful so diction feels low-stakes")
        return bens
    if cat == "Physical Starters":
        bens = [
            "Releases tension before singing",
            "Aligns posture for freer breath and tone",
        ]
        if "shake" in d or "shower" in d or "tap" in d:
            bens.append("Raises energy and group focus quickly")
        elif "posture" in d or "shoulder" in d or "head" in d:
            bens.append("Checks alignment so the voice isn’t blocked")
        else:
            bens.append("Gets the whole class moving as one ensemble")
        return bens
    # Pitch
    bens = [
        "Explores pitch range safely and playfully",
        "Builds listening and pitch-matching accuracy",
    ]
    if "siren" in d or "ng" in d or "slide" in d:
        bens.append("Smooths register transitions without pushing")
    elif "scale" in d or "octave" in d or "arpeggio" in d:
        bens.append("Reinforces scale patterns used in repertoire")
    else:
        bens.append("Encourages bold but controlled vocal play")
    return bens


def vocal_setup(cat: str, time: int) -> str:
    base = {
        "Breathing Exercises": "Stand or sit tall with free shoulders. Whole class. No props needed.",
        "Facial Warm-Ups / Diction": "Standing or seated circle so everyone can see mouths. No props needed.",
        "Physical Starters": "Open floor space with room to stretch and turn. Whole class. No props needed.",
        "Pitch Exercises": "Standing circle or open rows facing the leader. Optional: piano or pitch reference.",
        "Verbal": "Clear space; whole class.",
    }.get(cat, "Clear space; whole class. No props needed.")
    if cat == "Vocal Warm-Ups":
        base = "Standing circle with space to move arms. Whole class. No props needed."
    return f"{base} About {time} minutes."


def vocal_framing(title: str, desc: str, cat: str) -> str:
    gist = first_sentences(desc, 1, 150)
    if cat == "Breathing Exercises":
        lead = f"Use {title} to settle breath and posture before singing."
    elif cat.startswith("Facial"):
        lead = f"Warm the face and diction with {title}."
    elif cat == "Physical Starters":
        lead = f"Start the session with {title} to wake the body."
    elif cat == "Pitch Exercises":
        lead = f"Explore pitch and listening with {title}."
    else:
        lead = f"Try {title} as part of your vocal warm-up."
    if gist:
        return f"{lead} {gist}."
    return lead


def _has(pattern: str, text: str) -> bool:
    return re.search(pattern, text, flags=re.I) is not None


def vocal_tips(title: str, desc: str, cat: str) -> list[str]:
    """Exercise-specific tips — keyed off this activity’s own wording (word-bounded)."""
    d = (title + " " + strip_html(desc)).lower()
    tips: list[str] = []

    if _has(r"\b(candle|flame|candles)\b", d):
        tips.append(
            f"For {title}, keep the imaginary flame small — if air blasts, reset to a gentle stream on one finger."
        )
    if _has(r"inflatable|rubber ring|hot-air balloon|fill the glass|hot air balloon", d):
        tips.append(
            f"In {title}, cue ‘fill from the bottom’ and watch shoulders: if they lift, mime pushing the ring/balloon lower."
        )
    if _has(r"\b(rib|ribs|diaphragm|tummy|belly)\b", d):
        tips.append(
            f"During {title}, hands on ribs/tummy stay light — expansion should be sideways/forwards, not a heaved chest."
        )
    if _has(r"\b(ssh|sss|hiss|zzz)\b|buzzing bee|\bbee breath\b", d):
        tips.append(
            f"Keep the airflow in {title} quiet and even; stop if throats tighten and rematch on a softer ‘sss’."
        )
    if _has(r"\bposture\b|ears are over|lock knees|standing position", d):
        tips.append(
            f"Model the {title} posture check once, then let pairs self-check: ears over shoulders, soft knees."
        )
    if _has(r"\blip[s]?\b|brrr|lip-roll|lip roll|\bhorse\b", d):
        tips.append(
            f"If the lip buzz in {title} won’t start, add a tiny voiced ‘b’ or ‘v’ underneath — never force dry lips."
        )
    if _has(r"\btongue\b|\bdiction\b|\bteeth\b", d):
        tips.append(
            f"For {title}, exaggerate tip-of-tongue consonants slowly first; only speed up when every syllable stays clear."
        )
    if _has(r"\bchew|\btoffee\b|\bharibo\b|magic pea", d):
        tips.append(
            f"In {title}, keep the chew huge and silent for two beats before adding voice — floppy face, not clenched jaw."
        )
    if _has(r"\bscat\b|shabba|boom chicka", d):
        tips.append(
            f"Teach one {title} phrase call-and-response before chaining; clap a pulse underneath so timing stays shared."
        )
    if _has(r"\bshake\b|\bshower\b|\btap\b", d) and cat == "Physical Starters":
        tips.append(
            f"Keep {title} taps light and musical — if energy spikes, freeze on a silent three then restart softer."
        )
    if _has(r"\bbonny\b|letter b\b", d):
        tips.append(
            f"Spot every B in {title} spoken once, then sing; celebrate clean sit/stand changes without collapsing posture."
        )
    if _has(r"\bsiren|\bwhoah\b|\bng\b|\bhumming\b|\bhum\b|\bmm\b", d):
        tips.append(
            f"Aim for a continuous buzz in {title} with almost no air leak; if tone thins, drop the range and widen the smile slightly."
        )
    if _has(r"conductor|follow(?:ing)? the|hand direction|voice walking", d):
        tips.append(
            f"In {title}, the leader’s hand must move smoothly — practise the gesture silently once so voices don’t jump."
        )
    if _has(r"\bscale\b|\boctave\b|\barpeggio\b|\bsemitone\b", d):
        tips.append(
            f"Give a clear starting pitch each repeat of {title}; if top notes shout, narrow to a gentle ‘ng’ slide first."
        )
    if _has(r"\banimal\b|draw(?:ing)? (?:this |an )?animal", d):
        tips.append(
            f"Keep drawn shapes in {title} large and slow so pitch can travel; switch animals only when the buzz stays connected."
        )
    if _has(r"\bpercussion\b|\bfinger clicks\b", d):
        tips.append(
            f"Sync {title} steps and clicks to a shared slow pulse before adding voice layers — clarity over speed."
        )
    if _has(r"forehead|chewing gum.*legato|legato.*chewing gum", d):
        tips.append(
            f"Mime a long gum strand in {title} — voices should feel pulled smoothly, never punched note to note."
        )
    if _has(r"\bvowel|\bpo-pa-ca\b|sing up the first 4 notes|'ee'|'oh'", d):
        tips.append(
            f"On vowel changes in {title}, keep the jaw released; spot-check one row if sounds collapse into a muffled schwa."
        )
    if _has(r"\blaugh", d) and cat in ("Breathing Exercises", "Pitch Exercises"):
        tips.append(
            f"Keep theatrical laughs in {title} supported from the middle — fun, not scraped from the throat."
        )
    if _has(r"\bpant|\bmonkey|\brocket", d):
        tips.append(
            f"Alternate sound effects in {title} with a recovery breath so the class doesn’t get dizzy."
        )

    # Title-specific fallbacks (still unique per activity via title insertion)
    if len(tips) < 2:
        if cat == "Breathing Exercises":
            tips.append(
                f"In {title}, pause after the first full cycle and ask one pupil what they felt move — name that sensation."
            )
        elif cat.startswith("Facial"):
            tips.append(
                f"For {title}, contrast a muddy version with a crystal-clear version so the diction target is obvious."
            )
        elif cat == "Physical Starters":
            tips.append(
                f"During {title}, use one short posture cue only (‘soft knees’ or ‘long spine’) so movement stays musical."
            )
        else:
            tips.append(
                f"On {title}, isolate the hardest pitch gesture once, then rejoin the full pattern at a slower tempo."
            )
    if len(tips) < 3:
        closers = {
            "Breathing Exercises": [
                f"Leave {title} on a silent shared inhale — then speak the first lyric on that same breath feeling.",
                f"After {title}, ask ‘where did the air go?’ and point to ribs/tummy before repertoire.",
                f"Repeat {title} once seated if standing posture collapsed — compare the two sensations.",
            ],
            "Facial Warm-Ups / Diction": [
                f"Land {title} on a whispered clear sentence, then the same sentence sung.",
                f"After {title}, spot one consonant that still smudges and drill only that word.",
                f"Close {title} by mouthing the pattern silently, then add voice — clarity first.",
            ],
            "Physical Starters": [
                f"End {title} in a tall still shape for three counts so energy settles into posture.",
                f"After {title}, shake out once, then find ‘singer’s feet’ before the first note.",
                f"Freeze the last shape of {title} and check ears-over-shoulders as a class.",
            ],
            "Pitch Exercises": [
                f"Resolve {title} onto a comfortable mid-range hum before repertoire.",
                f"After {title}, sing the first phrase of the song on ‘ng’ using the same freedom.",
                f"Finish {title} descending into speaking range so nobody carries tension upward.",
            ],
        }
        bank = closers.get(cat) or closers["Pitch Exercises"]
        tips.append(bank[sum(ord(c) for c in title) % len(bank)])

    seen = set()
    out = []
    for t in tips:
        key = re.sub(r"\b" + re.escape(title.lower()) + r"\b", "TITLE", t.lower())[:56]
        if key in seen:
            continue
        seen.add(key)
        out.append(brit(t))
        if len(out) >= 3:
            break
    return out


def vocal_diff(cat: str, desc: str) -> tuple[str, str, str | None]:
    d = desc.lower()
    if cat == "Breathing Exercises":
        easier = "Teacher models one slow cycle; class joins on the out-breath only."
        harder = "Add a longer counted exhale or link straight into the first phrase of a song."
        ext = "Transfer the same breath feeling into the opening line of today’s repertoire."
    elif cat.startswith("Facial"):
        easier = "Speak the pattern slowly in unison before any pitch or speed challenge."
        harder = "Raise the tempo or move the pattern up by semitones while keeping every consonant."
        ext = "Drop the warm-up consonants into a tricky lyric from the song."
    elif cat == "Physical Starters":
        easier = "Do the movement without chant/song first, then add the voice."
        harder = "Add an opposite pattern or faster swap on a shared cue."
        ext = "Freeze in the final aligned posture and take one supported breath together."
    else:
        easier = "Narrow the pitch range and let the class echo the leader phrase by phrase."
        harder = "Widen the range, add a dynamic swell, or run as a short canon."
        ext = "Improvise a four-beat answer after the set pattern, still matching the leader’s vowel."
    if "candle" in d:
        harder = "Extend the gentle stream to 8 then 16 beats without the shoulders rising."
    if "siren" in d or "ng" in d:
        harder = "Siren through a wider interval, then land softly on a sung ‘ah’."
    return brit(easier), brit(harder), brit(ext)


def rewrite_vocal(item: dict) -> tuple[str, int, str, str]:
    cat = item.get("category") or ""
    raw_title = item.get("activity") or "Warm-Up"
    title = VW_TITLE_FIXES.get(raw_title, raw_title)
    # Strip leftover " - Category" if any slipped through
    if " - " in title and any(
        title.endswith(s)
        for s in (
            "Physical Starters",
            "Breathing Exercises",
            "Facial Warm-ups/Diction",
            "Facial Warm-Ups / Diction",
            "Pitch Exercises",
        )
    ):
        title = title.rsplit(" - ", 1)[0].strip()
        title = VW_TITLE_FIXES.get(raw_title, title)

    desc_src = item.get("description") or ""
    plain = strip_html(desc_src)
    time = int(item.get("time") or 0)
    if time <= 0:
        time = DEFAULT_TIME.get(cat, 3)
        # Technique-heavy pitch items
        if cat == "Pitch Exercises" and any(
            k in title.lower() for k in ("percussion", "octave", "scale", "vowel")
        ):
            time = max(time, 3)

    # Map Vocal Warm-Ups rows to tip logic of their suffix category when possible
    tip_cat = cat
    if cat == "Vocal Warm-Ups":
        low = raw_title.lower()
        if "breathing" in low:
            tip_cat = "Breathing Exercises"
        elif "facial" in low or "diction" in low:
            tip_cat = "Facial Warm-Ups / Diction"
        elif "physical" in low:
            tip_cat = "Physical Starters"
        elif "pitch" in low:
            tip_cat = "Pitch Exercises"

    framing = vocal_framing(title, plain, tip_cat if tip_cat != "Vocal Warm-Ups" else cat)
    benefits = vocal_benefits(tip_cat if tip_cat in DEFAULT_TIME else "Pitch Exercises", title, plain)
    setup = vocal_setup(tip_cat if tip_cat in DEFAULT_TIME else cat, time)
    steps = split_steps(plain)
    # Ensure at least 2 steps
    if len(steps) == 1:
        steps = [
            "Gather focus and watch the teacher model once in silence.",
            steps[0],
            "Repeat together, then try once more with greater clarity.",
        ]
    tips = vocal_tips(title, plain, tip_cat)
    easier, harder, ext = vocal_diff(tip_cat, plain)

    # John Kanaka is a song snippet inside Vocal Warm-Ups — keep song framing
    if title == "John Kanaka" or "kanaka" in plain.lower():
        framing = (
            "Use John Kanaka as a lively call-and-response sea shanty warm-up. "
            "Keep the ‘Hoo!’ / refrain crisp and the beat steady."
        )
        benefits = [
            "Warms group singing with strong shared pulse",
            "Builds call-and-response listening",
            "Lifts energy before repertoire",
        ]
        tips = [
            "Teach the refrain first so every ‘John Kanaka-naka too-rye-ay’ lands together.",
            "Keep the ‘Hoo!’ short and supported — no shouted throat sound.",
            "If words tangle, speak one verse in rhythm before singing.",
        ]
        time = max(time, 5)

    desc_html = build_desc(framing, benefits)
    at_html = build_activity(setup, steps, tips, easier, harder, ext)
    return title, time, desc_html, at_html


# ---------- Drama Games tip retarget ----------


def drama_specific_tips(title: str, rules: str, level: str) -> list[str]:
    r = (title + " " + rules).lower()
    tips: list[str] = []

    if _has(r"\bmirror", r):
        tips.append(
            "If leaders race, freeze the pair and restart in exaggerated slow motion so mirrors can match."
        )
    if _has(r"yes,\s*and|yes and", r):
        tips.append(
            "Side-coach only with ‘accept and add’ — block any ‘no’ / ‘but’ and replay the last offer."
        )
    if _has(r"\bfreeze\b|\bstatue\b|\btableau\b", r):
        tips.append(
            f"Use one sharp freeze cue for {title}; hold three silent counts before you speak so stillness sticks."
        )
    if _has(r"hot seat", r):
        tips.append(
            "Protect the hot-seat player: questions stay kind, in-role, and you may veto anything personal."
        )
    if _has(r"\bwink\b|\btag\b|\btaggers?\b", r):
        tips.append("Remind taggers to use gentle contact or a clear wink — no pushing or chasing into furniture.")
    if _has(r"soundscape|sound picture|\borchestra\b", r):
        tips.append(
            "Layer one sound at a time; conductor cuts with a flat hand so the texture doesn’t turn to noise."
        )
    if _has(r"\bmime\b|\binvisible\b|\bimaginary\b", r):
        tips.append(
            "Demand clear weight and size: if the audience can’t ‘see’ it, freeze and remime the first handle."
        )
    if _has(r"\bemotion\b|\bmood\b", r):
        tips.append(
            "Name the emotion once, then coach body not face — ‘show it in your spine/hands’ keeps it performable."
        )
    if _has(r"\bcircle\b", r) and _has(r"\bpass\b|\bwhisper\b|\btelephone\b", r):
        tips.append(
            "Keep the circle tight enough to hear; if the pass breaks, rewind two people and restart the chain."
        )
    if _has(r"\bimprov|\bscene\b|\bdialogue\b", r):
        tips.append(
            f"For {title}, allow one planning whisper only; then commit — stop the scene solely for safety or a clear reset."
        )
    if _has(r"\banimal", r):
        tips.append(
            "Choose animals the class knows; cue changes with a clear word so transitions stay sharp, not chaotic."
        )
    if _has(r"\bmusic\b", r) and not _has(r"music box", r):
        tips.append("Keep tracks short and fade early so freezes land on silence, not a long outro.")
    if _has(r"\bblind\b|close(?:s|d)? their eyes|who.?s missing", r):
        tips.append("Clear obstacles first and agree a soft safety word before anyone closes their eyes.")
    if _has(r"\bgibberish\b|\btranslator\b", r):
        tips.append(
            "Push emotion and intention in the gibberish; translator must answer the feeling, not invent a random plot."
        )
    if _has(r"\bconscience\b|\balley\b|\btunnel\b", r):
        tips.append(
            "Voices in the alley stay at advice volume — no shouting in the walker’s ears; swap the walker often."
        )
    if _has(r"\bmachine\b", r):
        tips.append(
            "Each new part must connect physically to the last; pause to tighten rhythm before adding more pupils."
        )

    if not tips:
        # Highly title-specific fallback — still not a shared template sentence
        tips.append(
            f"Before {title}, model the first ten seconds yourself so the rule is visible, not only explained."
        )
    if len(tips) < 2:
        if "pair" in r or "partner" in r:
            tips.append(
                f"In {title}, swap leaders halfway so both partners make offers, not just the confident one."
            )
        elif level == "Reception":
            tips.append(
                f"Keep {title} to two short rounds; stop while faces are still bright and name one clear success."
            )
        else:
            tips.append(
                f"After {title}, ask for one concrete example of good listening or a bold offer before you reset."
            )
    if len(tips) < 3:
        # Vary the third tip by hashing the title so it isn’t identical across games
        variants = [
            f"Scan the edges of the room in {title} and bring a quieter pupil in to lead the next micro-round.",
            f"Name one precise success after {title} (‘clear freeze’, ‘brave offer’) before you reset.",
            f"If {title} frays, shrink the group size for one round, then rebuild to whole class.",
        ]
        tips.append(variants[sum(ord(c) for c in title) % len(variants)])

    seen = set()
    out = []
    for t in tips:
        k = t.lower()[:40]
        if k in seen:
            continue
        seen.add(k)
        out.append(brit(t))
        if len(out) >= 3:
            break
    return out


def drama_rules_from_fields(description: str, activity_html: str) -> str:
    """Prefer How-to steps so 'Why it works' benefit words don’t trigger wrong tips."""
    how = re.search(r"How to play</strong></p>\s*<ol>(.*?)</ol>", activity_html or "", re.I | re.S)
    if how:
        return strip_html(how.group(1))
    # Framing paragraph only (before Why it works)
    desc = description or ""
    if "Why it works" in desc:
        desc = desc.split("Why it works")[0]
    return strip_html(desc)


def replace_drama_tips(activity_html: str, title: str, description: str, level: str) -> str:
    rules = drama_rules_from_fields(description, activity_html or "")
    tips = drama_specific_tips(title, rules, level or "KS1")
    new_ul = ul(tips)
    pattern = re.compile(
        r"(<p><strong>Teacher tips</strong></p>)\s*<ul>.*?</ul>",
        re.I | re.S,
    )
    if pattern.search(activity_html or ""):
        return pattern.sub(rf"\1{new_ul}", activity_html, count=1)
    return activity_html


def ensure_categories(cats: list[dict]) -> list[dict]:
    by_name = {c.get("name"): c for c in cats}
    # Update / add palette
    year_groups_default = {"Reception": True, "KS1": True, "KS2": True, "LKG": True, "UKG": True}
    year_groups_named = {
        "Reception Drama": True,
        "Year 1 Drama": True,
        "Year 2 Drama": True,
        "Year 3 Drama": True,
        "Year 4 Drama": True,
        "Year 5 Drama": True,
        "Year 6 Drama": True,
    }
    specs = [
        ("Breathing Exercises", CATEGORY_COLORS["Breathing Exercises"], 17),
        ("Facial Warm-Ups / Diction", CATEGORY_COLORS["Facial Warm-Ups / Diction"], 18),
        ("Physical Starters", CATEGORY_COLORS["Physical Starters"], 19),
        ("Pitch Exercises", CATEGORY_COLORS["Pitch Exercises"], 20),
    ]
    for name, color, pos in specs:
        if name in by_name:
            by_name[name]["color"] = color
            by_name[name]["updated_at"] = "2026-10-19T18:00:00.000Z"
        else:
            by_name[name] = {
                "id": str(uuid.uuid4()),
                "name": name,
                "color": color,
                "position": pos,
                "created_at": "2026-10-19T18:00:00.000Z",
                "updated_at": "2026-10-19T18:00:00.000Z",
                "yearGroups": year_groups_default,
                "groups": [],
                "group": None,
                "year_groups": year_groups_named,
            }
    # Parent Vocal Warmups colour
    for key in ("Vocal Warmups", "Vocal Warm-Ups"):
        if key in by_name:
            by_name[key]["color"] = CATEGORY_COLORS["Vocal Warmups"]
            by_name[key]["updated_at"] = "2026-10-19T18:00:00.000Z"
    return list(by_name.values())


def patch_system_categories_ts() -> None:
    text = SYSTEM_CATS.read_text(encoding="utf-8")
    # Update Vocal Warmups colour
    text2 = re.sub(
        r"(\{\s*name:\s*'Vocal Warmups',\s*color:\s*')#[0-9A-Fa-f]+(')",
        rf"\g<1>{CATEGORY_COLORS['Vocal Warmups']}\2",
        text,
        count=1,
    )
    insert_block = f"""  {{ name: 'Breathing Exercises', color: '{CATEGORY_COLORS['Breathing Exercises']}', position: 17, yearGroups: {{}}, source: 'system' }},
  {{ name: 'Facial Warm-Ups / Diction', color: '{CATEGORY_COLORS['Facial Warm-Ups / Diction']}', position: 18, yearGroups: {{}}, source: 'system' }},
  {{ name: 'Physical Starters', color: '{CATEGORY_COLORS['Physical Starters']}', position: 19, yearGroups: {{}}, source: 'system' }},
  {{ name: 'Pitch Exercises', color: '{CATEGORY_COLORS['Pitch Exercises']}', position: 20, yearGroups: {{}}, source: 'system' }},
]"""
    if "Breathing Exercises" not in text2:
        text2 = text2.replace(
            "{ name: 'Vocal Warmups', color: '%s', position: 16, yearGroups: {}, source: 'system' },\n];"
            % CATEGORY_COLORS["Vocal Warmups"],
            "{ name: 'Vocal Warmups', color: '%s', position: 16, yearGroups: {}, source: 'system' },\n"
            % CATEGORY_COLORS["Vocal Warmups"]
            + insert_block.lstrip(),
        )
        # Fallback if colour wasn't substituted yet
        if "Breathing Exercises" not in text2:
            text2 = re.sub(
                r"(\{\s*name:\s*'Vocal Warmups',.*?source:\s*'system'\s*\},)\s*\]",
                rf"\1\n{insert_block}",
                text2,
                count=1,
                flags=re.S,
            )
    SYSTEM_CATS.write_text(text2, encoding="utf-8")


def sql_escape(value: str) -> str:
    return value.replace("'", "''")


def main() -> int:
    data = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    activities = data["tables"]["activities"]

    vocal_updates = []
    drama_tip_updates = []

    for a in activities:
        cat = a.get("category")
        if cat in VOCAL_CATS:
            before_title = a.get("activity")
            title, time, desc, at = rewrite_vocal(a)
            a["activity"] = title
            a["time"] = time
            a["description"] = desc
            a["activity_text"] = at
            a["description_heading"] = a.get("description_heading") or "Introduction/Context"
            a["activity_heading"] = a.get("activity_heading") or "Activity"
            a["updated_at"] = "2026-10-19T18:00:00.000Z"
            vocal_updates.append((a["id"], title, time, desc, at, before_title, cat))
        elif cat == "Drama Games" and a.get("activity_text"):
            new_at = replace_drama_tips(
                a["activity_text"],
                a.get("activity") or "",
                a.get("description") or "",
                a.get("level") or "KS1",
            )
            # Always write refreshed tips (even if similar) so SQL includes them
            if new_at != a.get("activity_text"):
                a["activity_text"] = new_at
                a["updated_at"] = "2026-10-19T18:00:00.000Z"
                drama_tip_updates.append((a["id"], a.get("activity"), new_at))
            else:
                # Force regenerate into list for SQL when tips already match pattern
                a["activity_text"] = new_at
                drama_tip_updates.append((a["id"], a.get("activity"), new_at))

    data["tables"]["custom_categories"] = ensure_categories(
        data["tables"].get("custom_categories") or []
    )

    SNAPSHOT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    json.loads(SNAPSHOT.read_text(encoding="utf-8"))  # validate

    patch_system_categories_ts()

    # SQL
    lines = [
        "-- Vocal Warm-Ups area content + category colours + Drama Games tip refresh",
        "-- Generated 2026-10-19. Apply manually to live Supabase — do not run from CI.",
        "",
        "BEGIN;",
        "",
        "-- ----- Activities: Vocal Warm-Ups area -----",
        "",
    ]
    for aid, title, time, desc, at, _, cat in vocal_updates:
        lines.append(f"-- [{cat}] {title}")
        lines.append(
            "UPDATE activities\n"
            f"SET activity = '{sql_escape(title)}',\n"
            f"    time = {int(time)},\n"
            f"    description = '{sql_escape(desc)}',\n"
            f"    activity_text = '{sql_escape(at)}',\n"
            f"    updated_at = NOW()\n"
            f"WHERE id = '{aid}';"
        )
        lines.append("")

    lines.append("-- ----- Drama Games: teacher tips made exercise-specific -----")
    lines.append("")
    for aid, title, at in drama_tip_updates:
        lines.append(f"-- Drama tip refresh: {title}")
        lines.append(
            "UPDATE activities\n"
            f"SET activity_text = '{sql_escape(at)}',\n"
            f"    updated_at = NOW()\n"
            f"WHERE id = '{aid}';"
        )
        lines.append("")

    lines.append("-- ----- Category colours (system catalog in branding_settings) -----")
    lines.append("-- Review in System Categories admin, or merge into system:categories JSON:")
    for name, color in CATEGORY_COLORS.items():
        if name == "Vocal Warm-Ups":
            continue
        lines.append(f"--   {name}: {color}")
    lines.append("")
    # Attempt a SQL jsonb update helpers comment — actual merge is environment-specific
    lines.append(
        "-- Optional: if you store the catalog under branding_settings.key = 'system:categories',\n"
        "-- merge the four subcategory colours + updated Vocal Warmups colour into data->categories.\n"
        "-- Prefer the in-app System Categories admin for safety.\n"
    )
    lines.append(f"-- Vocal rows updated: {len(vocal_updates)}")
    lines.append(f"-- Drama tip rows updated: {len(drama_tip_updates)}")
    lines.append("COMMIT;")
    lines.append("")
    SQL_OUT.parent.mkdir(parents=True, exist_ok=True)
    SQL_OUT.write_text("\n".join(lines), encoding="utf-8")

    # Sanity
    reloaded = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    vocal = [a for a in reloaded["tables"]["activities"] if a.get("category") in VOCAL_CATS]
    assert len(vocal) == 278, len(vocal)
    trunc = [a["activity"] for a in vocal if " - " in a["activity"] and a["activity"].endswith(("Starters", "Exercises", "Diction"))]
    assert not trunc, trunc[:5]
    zero = [a["activity"] for a in vocal if not a.get("time")]
    assert not zero, zero[:5]
    for a in vocal:
        assert "Why it works" in (a.get("description") or ""), a["activity"]
        assert "How to do it" in (a.get("activity_text") or ""), a["activity"]
        assert "Teacher tips" in (a.get("activity_text") or ""), a["activity"]

    # Tip uniqueness check — Drama
    drama = [a for a in reloaded["tables"]["activities"] if a.get("category") == "Drama Games"]
    tip_set = []
    for a in drama:
        m = re.search(r"Teacher tips</strong></p><ul>(.*?)</ul>", a.get("activity_text") or "", re.S)
        if m:
            tip_set.append(re.sub(r"<[^>]+>", " ", m.group(1)))
    # The old generic phrase should be rare/gone
    generic = sum(1 for t in tip_set if "Keep rounds short and celebrate big, clear choices" in t)
    print(f"Vocal updated: {len(vocal_updates)}")
    print(f"Drama tips updated: {len(drama_tip_updates)}")
    print(f"Drama still with old generic tip: {generic}")
    print(f"SQL -> {SQL_OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
