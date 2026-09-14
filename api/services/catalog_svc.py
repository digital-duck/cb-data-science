import sys
from pathlib import Path

from api.config import settings

# scripts/ on sys.path so catalog_lock.py (the single locked read/write path,
# shared with scripts/batch_generate.py) is importable without duplicating it.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))
from catalog_lock import read_catalog, update_catalog  # noqa: E402

_CATALOG = settings.public_domains / "catalog.json"


def get_catalog() -> list[dict]:
    return read_catalog(_CATALOG)


def mark_book_generated(
    domain_id: str,
    target: str,
    level: str = "intro",
    language: str = "en",
    model: str = "gemma4",
) -> None:
    variant = f"{level}.{language}"
    html_dir = settings.public_domains / domain_id / "output" / variant / model / "html"
    # spl/tools.py's write_concept_html/build_book_index suffix every filename
    # with "_{language}" except English (kept unsuffixed for backward
    # compatibility with existing links/bookmarks) — match that convention
    # here, otherwise the recorded book_file points at a file that was never
    # written (e.g. "book_x.html" when spl actually wrote "book_x_zh.html"),
    # which the frontend then reports as "Content Not Available".
    suffix = f"_{language}" if language and language != "en" else ""
    # model_seg avoids a double slash ("output/variant//html/...") when
    # model="" — model is optional (falls back to CB_DEFAULT_MODEL).
    model_seg = f"{model}/" if model else ""
    new_concepts = []
    for p in html_dir.glob("concept_*.html"):
        stem = p.stem[len("concept_"):]
        # Strip the same "_{language}" suffix write_concept_html appends to
        # the filename — otherwise a Chinese "observation" concept gets
        # named/labeled "observation_zh"/"Observation Zh", a different
        # identity from the English "observation" entry rather than the
        # same concept in a different language. That mismatch produces
        # "Please generate the concept book for observation_zh first" even
        # though Model/Level/Language already show the correct selection —
        # the concept the user opened never truly existed under that
        # mangled name in any language.
        name = stem[:-len(suffix)] if suffix and stem.endswith(suffix) else stem
        new_concepts.append({
            "name": name,
            "label": name.replace("_", " ").title(),
            "file": f"output/{variant}/{model_seg}html/{p.name}",
            "model": model,
            "language": language,
        })

    def mutate(catalog: list[dict]) -> None:
        for d in catalog:
            if d["id"] != domain_id:
                continue
            books: list[dict] = d.setdefault("books", [])
            book_file = f"output/{variant}/{model_seg}html/book_{target}{suffix}.html"
            # Dedupe by the exact output file path (which already encodes
            # level/language/model) rather than the (target, model, language)
            # triple — that triple collided across levels: generating the
            # same target/model/language at a level different from an
            # earlier run matched the earlier run's entry and silently
            # skipped recording the new file at all.
            if not any(b.get("file") == book_file for b in books):
                books.append({"target": target, "file": book_file, "model": model, "language": language})
            d["has_book"] = True

            # Preserve every entry except the ones this exact directory glob
            # just superseded (same level/language/model). Filtering by
            # (model, language) alone — the old behavior — wiped out a
            # *different* level's already-generated concepts sharing the
            # same model/language: e.g. generating "research" level for
            # model=sonnet silently deleted the "college" level sonnet
            # entries an earlier run had recorded, even though those files
            # were untouched on disk.
            variant_dir_prefix = f"output/{variant}/{model_seg}html/"
            other = [
                c for c in d.get("generated_concepts", [])
                if not c.get("file", "").startswith(variant_dir_prefix)
            ]
            d["generated_concepts"] = sorted(
                other + new_concepts,
                key=lambda c: c["label"],
            )
            break

    update_catalog(mutate, _CATALOG)
