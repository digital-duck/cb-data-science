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

## Results (all four levels complete)

**Headline finding: the comparison is broken at the concept-section level by a real
caching bug, unrelated to the style/level design itself.** `concept_{name}.html` files
— the individual per-concept teaching sections, the bulk of what a reader actually
reads — are **byte-for-byte identical across all four levels**, confirmed via `diff`:

```
$ diff .../intro.en/.../concept_hipaa.html .../research.en/.../concept_hipaa.html
[ok] Files are identical
$ diff .../intro.en/.../concept_data_science.html .../research.en/.../concept_data_science.html
ch01 data_science: IDENTICAL across intro/research
$ diff .../intro.en/.../concept_arima.html .../research.en/.../concept_arima.html
ch05 arima: IDENTICAL across intro/research
```

**Root cause**, traced to `SPL.py/spl/stdlib.py`'s `cache_get`/`cache_put`: the Layer-2
content cache key is built from `concept` + `params` + `rubric_version`. In
`build_concept_book.spl`, the params JSON is built with:

```
CALL json_set("{}", "language", @language) INTO @_params_json
```

— **`style` is never included in the cache key.** Once a concept section is generated
and cached under any style (the first of the four runs, `college`, before this
comparison started), every subsequent run at a different `--level`/style hits the
cache and silently reuses that first run's content, regardless of what style was
actually requested. This is a bug in the shared SPL.py content-cache mechanism, not
specific to this book or `cb-data-science` — it affects every domain using
`build_concept_book.spl`'s Layer-2 cache pattern. **The fix belongs in
`concept-book-base`/SPL.py, not this app**, and is a prerequisite for any future
level comparison to mean anything at the concept-section level.

**What actually did vary correctly: the payoff (`book_{target}.html`) section.**
Payoff generation apparently isn't hit by the same caching gap (sizes and content
genuinely differ across levels — see below), and it demonstrates the redesigned
`research`/`research_applied` profiles working roughly as intended in structure:

- `book_hipaa.html`, `intro` (feynman): analogy-driven — *"Imagine you are rushed to
  an emergency room... that fear is exactly the problem HIPAA was built to solve"* —
  ends with "Now you try."
- `book_hipaa.html`, `research`: literature-and-investigation framing exactly matching
  the redesigned `research` structure (`Definition → Theorem/Proof → Literature
  context → Suggested investigation → Report-writing note`) — cites Sweeney's
  re-identification result, Dwork et al. composition theorems, proposes a concrete
  differential-privacy experiment (Gaussian mechanism, MIMIC-III, moments accountant),
  and closes with an explicit "a write-up of this investigation should establish..."
  section.

**But this surfaces the two real, distinct problems the concept-section caching bug
was masking:**

1. **The tag-inheritance bug (predicted in the Open Question, now confirmed).**
   `data_science_ch08`'s `research`-level `book_hipaa.html` is full theorem/proof
   differential-privacy notation ($(\varepsilon,\delta)$-DP, the Gaussian mechanism,
   formal adversary models) for a concept (HIPAA) that is fundamentally regulatory, not
   mathematical. Root cause confirmed: `ch08`'s catalog tags are `["science", "math"]`
   — inherited book-wide from `sync_from_press.py --tags science,math` — so
   `_resolve_style()`'s `_STEM_MATH_TAGS & set(tags)` check finds `"math"` present and
   never falls back to `research_applied`. **Fix: per-chapter tags, not one blanket
   `--tags` value for the whole book** — chapters like Ch.5 (Time Series, genuinely
   statistical) should keep `"math"`; Ch.8 (Ethics) should not.
2. **Even `intro`/`feynman` — which explicitly states "no prior university math" —
   leaks formal notation.** `book_hipaa.html` at `intro` still contains
   `$f \in F$` / `$f \notin F$` set-membership notation; `book_arima.html` at `intro`
   contains full LaTeX time-series equations ($X_t = \phi_1 X_{t-1} + \dots$). ARIMA
   arguably needs *some* formalism even at intro level to be honest about what it is,
   but the `feynman` profile's own instruction ("minimal formalisation") isn't being
   held to strongly by the model — this is a prompt-adherence gap, not a routing bug
   like #1, and worth a lighter-touch fix (e.g. explicitly telling `feynman` to avoid
   LaTeX display-math entirely, not just "minimal").

## Fixes needed before this comparison can be trusted

1. **(Blocking, shared codebase)** Add `style` to the cache-key params in
   `build_concept_book.spl`: `CALL json_set(@_params_json, "style", @style) INTO
   @_params_json` (after the existing `language` `json_set`). Lives in
   `concept-book-base`/SPL.py, propagates to every `cb-*` app the same way the earlier
   `--level` fix did. All content generated across the four runs so far should be
   treated as unreliable for concept-level comparison until this is fixed and the
   three concepts are regenerated with `--skip-cache`.
2. **(This app)** Re-tag `cb-data-science`'s chapters per-chapter instead of
   book-wide — re-run `sync_from_press.py` chapter-by-chapter with chapter-appropriate
   `--tags` (e.g. `ch03`–`ch05` keep `math`, `ch08` drops it) rather than one
   `--tags science,math` call across all 10 chapters.
3. **(Prompt tuning, lower priority)** Tighten `feynman`'s "minimal formalisation"
   instruction to explicitly discourage LaTeX display-math, based on the `hipaa`/
   `arima` intro-level leakage observed above.

## TODO

- [ ] Cache-key fix (item 1 above) is now implemented in `concept-book-base` and
  propagated to `cb-data-science/spl/build_concept_book.spl` (and all other `cb-*`
  forks). Regenerate the three test concepts (`data_science` ch1, `arima` ch5, `hipaa`
  ch8) across all four levels with `--skip-cache` and update the Results section above
  with the corrected comparison.

## File paths used in this comparison

```
public/domains/data_science_ch01/output/{level}.en/sonnet/html/{book,concept}_{name}.html
public/domains/data_science_ch05/output/{level}.en/sonnet/html/{book,concept}_{name}.html
public/domains/data_science_ch08/output/{level}.en/sonnet/html/{book,concept}_{name}.html
```
