import asyncio
import sys
from pathlib import Path

from api.config import settings
from api.services.path_safety import assert_within

_REPO_ROOT = Path(__file__).parent.parent.parent
_HTML2PDF = _REPO_ROOT / "scripts" / "html2pdf.js"

# Shared locked read/write path for catalog.json — see scripts/catalog_lock.py's
# module docstring. catalog_svc.py imports it the same way; duplicated here
# rather than re-exported from catalog_svc to keep the two services independent.
sys.path.insert(0, str(_REPO_ROOT / "scripts"))
from catalog_lock import update_catalog  # noqa: E402

_CATALOG = settings.public_domains / "catalog.json"


async def generate_pdf(
    domain_id: str, target: str, level: str = "intro", language: str = "en", model: str = ""
) -> dict:
    variant = f"{level}.{language}"
    variant_dir = settings.public_domains / domain_id / "output" / variant
    html_dir = variant_dir / model / "html" if model else variant_dir / "html"
    pdf_dir = variant_dir / model / "pdf" if model else variant_dir / "pdf"
    # Router-level validation (safe_segment) already rejects '/' and '..' in
    # every input that reaches this function; this is the belt-and-suspenders
    # check that the resolved path is still inside public_domains regardless.
    assert_within(html_dir, settings.public_domains)
    assert_within(pdf_dir, settings.public_domains)
    pdf_dir.mkdir(parents=True, exist_ok=True)

    # spl/tools.py's write_concept_html/build_book_index suffix every
    # filename with "_{language}" except English — match that convention
    # here, otherwise a non-English export always 404s even though the
    # concept was in fact generated (it just exists under the suffixed name).
    suffix = f"_{language}" if language and language != "en" else ""

    # The IDE displays per-node concept pages (concept_{id}.html), not the
    # full book index — export whichever one is actually on disk for this
    # node, preferring the concept page since that's what's shown/selected.
    concept_html = html_dir / f"concept_{target}{suffix}.html"
    book_html = html_dir / f"book_{target}{suffix}.html"
    if concept_html.exists():
        html_file, kind = concept_html, "concept"
    elif book_html.exists():
        html_file, kind = book_html, "book"
    else:
        # Filenames only, not full server paths — this error reaches the
        # browser verbatim.
        return {
            "ok": False,
            "not_found": True,
            "error": f"Not generated yet: {concept_html.name} (or {book_html.name}). Generate it first.",
        }
    pdf_file = pdf_dir / f"{kind}_{target}{suffix}.pdf"

    cmd = ["node", str(_HTML2PDF), "--input", str(html_file), "--output", str(pdf_file)]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
    )
    stdout, _ = await proc.communicate()

    if proc.returncode != 0:
        return {"ok": False, "not_found": False, "error": stdout.decode(errors="replace")}

    model_seg = f"{model}/" if model else ""
    rel_path = f"output/{variant}/{model_seg}pdf/{kind}_{target}{suffix}.pdf"
    _mark_pdf_generated(domain_id, target, level, language, model, rel_path)
    return {"ok": True, "file": rel_path}


def _mark_pdf_generated(
    domain_id: str, target: str, level: str, language: str, model: str, rel_path: str
) -> None:
    def mutate(catalog: list[dict]) -> None:
        for d in catalog:
            if d["id"] != domain_id:
                continue
            pdfs: list[dict] = d.setdefault("pdfs", [])
            # Dedup on the full (target, level, language, model) tuple, not
            # just target — otherwise the first PDF ever exported for a
            # target wins permanently and later exports at a different
            # level/language/model are silently dropped from the catalog.
            entry = {"target": target, "level": level, "language": language, "model": model, "file": rel_path}
            existing = next(
                (p for p in pdfs
                 if p.get("target") == target and p.get("level") == level
                 and p.get("language") == language and p.get("model") == model),
                None,
            )
            if existing is not None:
                existing.update(entry)
            else:
                pdfs.append(entry)
            break

    update_catalog(mutate, _CATALOG)
