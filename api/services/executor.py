"""Stream spl3 run as a subprocess, yielding SSE-ready dicts.

Run the backend inside the spl123 conda env so that `spl3` is on PATH:
    conda activate spl123
    pip install -r requirements-api.txt
    uvicorn api.app:app --port 8200 --reload
"""
import asyncio
import json
import os
import shutil
import sys
from pathlib import Path

from api.config import settings
from api.services.adapters import ADAPTER_ENV_VAR as _ADAPTER_ENV_VAR
from api.services.adapters import ADAPTER_SETTINGS_FIELD as _ADAPTER_SETTINGS_FIELD
from api.services.catalog_svc import get_catalog

_REPO_ROOT = Path(__file__).parent.parent.parent
_SPL_DIR = _REPO_ROOT / "spl"

sys.path.insert(0, str(_REPO_ROOT / "scripts"))
from level_style import resolve_style  # noqa: E402


def _resolve_spl3() -> str:
    """Locate the spl3 binary without trusting inherited PATH.

    `uvicorn --reload` runs the actual app inside a supervisor/worker
    process pair, and depending on how that reload machinery spawns the
    worker, the conda-activated PATH from the launching shell doesn't
    always make it through intact — even though this very process is
    demonstrably running under the spl123 env's Python (that's the only
    place fastapi/uvicorn/sse-starlette are installed). So look for spl3
    as a sibling of `sys.executable` first — same env, no PATH involved —
    and only fall back to a PATH search.
    """
    sibling = Path(sys.executable).parent / "spl3"
    if sibling.is_file():
        return str(sibling)
    found = shutil.which("spl3")
    return found or "spl3"


# Maps short model names (used in folder paths and UI) to spl3 --llm strings.
# gemma3 is the default: runs locally via Ollama without GPU, zero cost.
_MODEL_TO_LLM: dict[str, str] = {
    "gemma3":  "ollama:gemma3",
    "gemma4":  "ollama:gemma4",
    "sonnet":  "claude_cli:claude-sonnet-5",
    "haiku":   "claude_cli:claude-haiku-4-5-20251001",
    "opus":    "claude_cli:claude-opus-4-8",
}

# SPL.py's own adapters (spl/adapters/{anthropic,openai,google,openrouter}.py)
# each read their key from exactly this environment variable, with no CLI
# param to pass one in directly — so a user-supplied key from the Settings
# page has to be injected into the subprocess env under the right name.
# claude_cli and ollama need no key (CLI auth / local respectively).


async def stream_generate(
    domain_id: str,
    target: str,
    level: str = "intro",
    language: str = "en",
    model: str = "gemma4",
    skip_cache: bool = False,
):
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

    # build_concept_book.spl has no @lvl input — only @style — so --param
    # lvl=... alone is a silent no-op; level_style.resolve_style() is what
    # actually maps the requested level to the @style the LLM prompt uses.
    # See scripts/level_style.py for the level->style map and math-tag
    # fallback rationale. Shared with scripts/batch_generate.py so the web
    # UI and the batch script produce the same style for the same level.
    tags: list[str] = next(
        (d.get("tags", []) for d in get_catalog() if d.get("id") == domain_id), []
    )
    style = resolve_style(level, tags)

    spl3_bin = _resolve_spl3()
    cmd = [
        spl3_bin, "run", str(_SPL_DIR / "build_concept_book.spl"),
        "--tools", str(_SPL_DIR / "tools.py"),
        "--llm", llm,
        "--param", f"domain_yaml={domain_yaml_path}",
        "--param", f"target={target}",
        "--param", f"style={style}",
        "--param", f"language={language}",
        "--param", f"output_dir={output_dir}",
        "--param", f"skip_cache={'yes' if skip_cache else 'no'}",
        "--param", f"model={model}",
    ]

    yield {"event": "started", "data": json.dumps({"domain": domain_id, "target": target, "model": model})}

    spl_env = {
        **os.environ,
        "SPL_WHILE_MAX_ITER": str(settings.spl_while_max_iter),
        "SPL_MAX_LLM_CALLS": str(settings.spl_max_llm_calls),
    }
    adapter = llm.split(":", 1)[0]
    env_var = _ADAPTER_ENV_VAR.get(adapter)
    if env_var:
        key = getattr(settings, _ADAPTER_SETTINGS_FIELD.get(adapter, ""), "")
        if key:
            spl_env[env_var] = key

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(spl_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=spl_env,
        )
    except FileNotFoundError:
        # spl3 couldn't be found even via _resolve_spl3()'s sys.executable
        # sibling lookup — meaning this Python process itself isn't running
        # under an env with spl3 installed alongside it (not just a PATH
        # issue). Report it as a normal gen_error SSE event rather than
        # letting the exception crash the stream: an uncaught exception here
        # kills the connection before any event is sent, which makes the
        # browser's EventSource silently auto-reconnect (and fail the same
        # way) forever, leaving the frontend's Generate button stuck on
        # "Generating…" indefinitely.
        yield {
            "event": "gen_error",
            "data": json.dumps({
                "message": (
                    f"spl3 not found (tried {spl3_bin!r} and PATH). "
                    "This API process's own interpreter is "
                    f"{sys.executable} — start it from inside the spl123 "
                    "conda env: conda activate spl123 && bash scripts/start-api.sh"
                ),
            }),
        }
        return

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
