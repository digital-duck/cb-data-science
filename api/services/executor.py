"""Stream spl3 run as a subprocess, yielding SSE-ready dicts.

Run the backend inside the spl123 conda env so that `spl3` is on PATH:
    conda activate spl123
    pip install -r requirements-api.txt
    uvicorn api.app:app --port 8200 --reload
"""
import asyncio
import json
import os
from pathlib import Path
from urllib.parse import unquote

from api.config import settings
from api.services.catalog_svc import get_catalog

_REPO_ROOT = Path(__file__).parent.parent.parent
_SPL_DIR = _REPO_ROOT / "spl"

# Maps short model names (used in folder paths and UI) to spl3 --llm strings.
# gemma3 is the default: runs locally via Ollama without GPU, zero cost.
_MODEL_TO_LLM: dict[str, str] = {
    "gemma3":  "ollama:gemma3",
    "gemma4":  "ollama:gemma4",
    "sonnet":  "claude_cli:claude-sonnet-4-6",
    "haiku":   "claude_cli:claude-haiku-4-5-20251001",
    "opus":    "claude_cli:claude-opus-4-8",
}

# Keep in sync with scripts/batch_generate.py's _LEVEL_TO_STYLE /
# _STEM_MATH_TAGS / _resolve_style: build_concept_book.spl's INPUT has no
# @lvl parameter, only @style — passing --param lvl=... is silently ignored
# by spl3 and every job generates at the hardcoded @style DEFAULT 'textbook'
# regardless of the level requested through the UI. This mirrors
# batch_generate.py's fix for the same issue so the web UI and the batch
# script produce the same style for the same level.
_LEVEL_TO_STYLE: dict[str, str] = {
    "intro":    "feynman",
    "core":     "core",
    "college":  "college",
    "research": "research",
}
_STEM_MATH_TAGS = {"math", "physics", "engineering"}


def _resolve_style(level: str, domain_id: str) -> str:
    style = _LEVEL_TO_STYLE.get(level, "college")
    if style != "research":
        return style
    tags = next((d.get("tags", []) for d in get_catalog() if d["id"] == domain_id), [])
    return style if (_STEM_MATH_TAGS & set(tags)) else "research_applied"


async def stream_generate(
    domain_id: str,
    target: str,
    level: str = "intro",
    language: str = "en",
    model: str = "gemma4",
    skip_cache: bool = False,
):
    domain_id = unquote(domain_id)
    spl_dir: Path = settings.spl_dir
    llm = _MODEL_TO_LLM.get(model, settings.llm)
    output_dir = settings.public_domains / domain_id / "output" / f"{level}.{language}" / model / "html"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Absolute path, not a bare "{domain_id}_graph.yaml" filename: bare names
    # are resolved by graph_lib.load_domain() relative to SPL.py's own
    # cookbook/74_concept_book directory, which requires every domain's graph
    # to also be hand-copied there. An absolute path is honored as-is and
    # works for domains synced from an external pipeline (e.g.
    # concept-book-press) that only ever exist under public/domains/.
    domain_yaml_path = settings.public_domains / domain_id / "input" / "graph.yaml"
    style = _resolve_style(level, domain_id)

    cmd = [
        "spl3", "run", str(_SPL_DIR / "build_concept_book.spl"),
        "--tools", str(_SPL_DIR / "tools.py"),
        "--llm", llm,
        "--param", f"domain_yaml={domain_yaml_path}",
        "--param", f"target={target}",
        "--param", f"style={style}",
        "--param", f"language={language}",
        "--param", f"output_dir={output_dir}",
        "--param", f"skip_cache={'yes' if skip_cache else 'no'}",
        "--param", f"llm={llm}",
    ]

    yield {"event": "started", "data": json.dumps({"domain": domain_id, "target": target, "model": model})}

    spl_env = {
        **os.environ,
        "SPL_WHILE_MAX_ITER": str(settings.spl_while_max_iter),
        "SPL_MAX_LLM_CALLS": str(settings.spl_max_llm_calls),
    }

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(spl_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=spl_env,
    )

    assert proc.stdout is not None
    async for raw in proc.stdout:
        line = raw.decode(errors="replace").rstrip()
        if line:
            yield {"event": "log", "data": json.dumps({"message": line})}

    await proc.wait()

    if proc.returncode == 0:
        from api.services.catalog_svc import mark_book_generated
        mark_book_generated(domain_id, target, level, language, model)
        yield {"event": "done", "data": json.dumps({"domain": domain_id, "target": target, "model": model})}
    else:
        yield {
            "event": "gen_error",
            "data": json.dumps({"message": f"spl3 exited {proc.returncode}"}),
        }
