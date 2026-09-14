"""Maps a content level to a spl/style_profiles.py style name.

Shared by scripts/batch_generate.py and api/services/executor.py so the two
generation paths (CLI batch runs and the web app's Generate button) can't
drift apart — build_concept_book.spl has no @lvl input parameter, only
@style, so --param level=... alone is a silent no-op; @style is what
actually controls the LLM prompt's depth and rigor. Extracted from
batch_generate.py, which discovered and documented this the hard way (see
the level->style map's own comment below).
"""

# Maps content levels (intro/core/college/research, per CLAUDE.md's learner-
# progression axis) to a spl/style_profiles.py profile name. build_concept_book.spl
# has no @lvl input parameter — only @style — so passing --param lvl=... alone
# is silently ignored by spl3 and every job generates at the hardcoded @style
# DEFAULT 'textbook' (university/calculus-background audience) regardless of
# the requested level. This map is what --level actually controls.
#
# college -> "college" (not "textbook"): "textbook"'s structure forces a "Key
# theorem" + notation-heavy treatment on every concept regardless of whether the
# concept is actually mathematical (e.g. it produced relational-algebra notation
# and a forced "Key Theorem (ACID Guarantees)" for a systems concept like DBMS).
# "college" makes that formalism conditional on the concept's own nature; forced
# rigorous math/proof notation is reserved for "research".
LEVEL_TO_STYLE: dict[str, str] = {
    "intro":    "feynman",
    "core":     "core",
    "college":  "college",
    "research": "research",
}

# Domain catalog "tags" values for which full mathematical/proof-notation rigor
# (the "research" style profile) is appropriate at research level. Any other
# domain — technology, chemistry, biology, etc. — falls back to
# "research_applied" instead: same graduate-level depth and citation-readiness,
# but without inventing math/proof notation for concepts that aren't themselves
# mathematical results (systems, protocols, regulations, biological mechanisms,
# chemical processes). Math/proof notation is otherwise reserved for these three
# tags at research level; "college" level is separately conditional per-concept
# (see the "college" style profile's own depth instruction).
STEM_MATH_TAGS = {"math", "physics", "engineering"}


def resolve_style(level: str, tags: list[str]) -> str:
    style = LEVEL_TO_STYLE.get(level, "college")
    if style == "research" and not (STEM_MATH_TAGS & set(tags)):
        return "research_applied"
    return style
