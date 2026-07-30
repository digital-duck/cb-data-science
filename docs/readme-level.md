# Evaluating `--level` Effectiveness Across intro → research

## Why data science, and why now

`data_science_ch{01..10}` is a good stress test for the level→style fix documented in
`concept-book-press/docs/projects/openstax/readme-Path_B.md` ("Bug found during the
Chapter 1 spot-check") because the book spans a genuinely wide difficulty range within
one domain — from "what is a dataset" to ARIMA models to legal/regulatory frameworks
(HIPAA/FERPA/GDPR) — rather than being uniformly math-heavy (like linalg) or uniformly
non-mathematical. That range makes it possible to test not just "does `--level` change
anything" but "does the *right kind* of change happen for the *right kind* of concept."

Four full-book runs exist (or are in progress) to compare, per
`scripts/README-test_gen.md`'s "Comparing Levels" log:

```bash
# before fixing prompt for level and math
python scripts/batch_generate.py --level college
python scripts/batch_generate.py --level intro
# after
python scripts/batch_generate.py --level core
python scripts/batch_generate.py --level research
```

## The three concepts and what each one tests

Rather than comparing levels on one concept (which only tests one point on the
difficulty spectrum), three concepts were chosen specifically because they sit at
different points relative to "is this concept intrinsically mathematical":

| Concept | Chapter | Nature | What it tests |
|---|---|---|---|
| `dataset` or `data_science` | Ch.1 | Genuinely simple, not mathematical | Does `intro` stay a plain analogy without forcing academic framing? Does `research` avoid over-formalizing something this basic just because the level is high? |
| `arima` / `seasonal_trend_decomposition_loess` | Ch.5 | Genuinely a statistical/mathematical result | Does `college` correctly *allow* math here (its profile is conditional, not "no math ever") — and does the concept get treated differently than `dataset` at the same level? |
| `hipaa` / `ferpa` / `gdpr_ccpa` | Ch.8 | Legal/regulatory, zero inherent mathematics | **The real litmus test.** `data_science_ch08`'s catalog tags are `["science", "math"]` — inherited book-wide, not chapter-specific. The `research_applied` fallback in `batch_generate.py`'s `_resolve_style()` checks for tag intersection with `_STEM_MATH_TAGS = {"math", "physics", "engineering"}`. If `research` on a regulation concept comes back notation-heavy, the fallback isn't firing as intended — see Open Question below. |

## What to look for at each level

Per `spl/style_profiles.py`'s current definitions:

| Level | Style profile | Expect |
|---|---|---|
| `intro` | `feynman` | Analogy/story-first, minimal formalization, "no prior university math" — should read the same regardless of which of the 3 concepts it is |
| `core` | `core` | Past the analogy into real structure, light notation only if the student is ready, ends with one short practice problem |
| `college` | `college` | Problem-solving application; formal notation **only if the concept is intrinsically mathematical** — `dataset`/`hipaa` should stay notation-light, `arima` should not |
| `research` | `research` or `research_applied` (tag-dependent) | Project-driven framing (literature, suggested investigation, report-writing note); full theorem/proof notation reserved for math/physics/engineering-tagged domains only — `hipaa` should land in `research_applied`, not `research` |

## Comparison table (fill in once all four levels complete)

| Concept | intro | core | college | research |
|---|---|---|---|---|
| `dataset` / `data_science` | ✅ generated | ✅ generated | ✅ generated | ⏳ pending |
| `arima` / `seasonal_trend_decomposition_loess` | ✅ generated | ✅ generated | ✅ generated | ⏳ pending |
| `hipaa` / `ferpa` / `gdpr_ccpa` | ✅ generated | ✅ generated | ✅ generated | ⏳ pending |

For each cell once `research` completes, note pass/fail against its row's expectation
above (not just "generated") — e.g. `hipaa` at `research`: pass = plain regulatory
prose at graduate rigor; fail = invented math/proof notation.

File paths (once found under each level):
```
public/domains/data_science_ch01/output/{level}.en/sonnet/html/concept_{name}.html
public/domains/data_science_ch05/output/{level}.en/sonnet/html/concept_{name}.html
public/domains/data_science_ch08/output/{level}.en/sonnet/html/concept_{name}.html
```

## Open question to resolve during this comparison

`data_science_ch08`'s catalog entry has `"tags": ["science", "math"]` — the same tags
every chapter in this book got from `sync_from_press.py --tags science,math`, applied
book-wide rather than per-chapter. `_STEM_MATH_TAGS = {"math", "physics", "engineering"}`
in `batch_generate.py` checks for intersection with a domain's tags, so **`ch08` may
incorrectly qualify for full `research` rigor on `hipaa`/`ferpa`/`gdpr_ccpa` purely
because the whole book was tagged `"math"`**, not because Chapter 8 (ethics/regulation)
actually is math. If the `hipaa` result at `research` comes back notation-heavy, this is
the likely root cause — the fix would be per-chapter tagging (e.g. only chapters 3–5
tagged `"math"`) rather than blanket book-level tags, or a finer-grained per-concept
signal instead of a domain-level tag check.
