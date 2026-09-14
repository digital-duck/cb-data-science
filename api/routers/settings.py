import asyncio
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.config import settings
from api.services.adapters import ADAPTERS, SETTINGS_FIELD_ENV_VAR

router = APIRouter()

# Valid llm string prefixes — spl3's own adapter registry names plus the two
# backends that need no API key. A malformed value here isn't caught until a
# generate request fails deep inside the spl3 subprocess, so reject it up front.
_VALID_LLM_PREFIXES = ("ollama", "claude_cli", *ADAPTERS.keys())


def _key_set(field: str) -> bool:
    # A key already set via a bare (non-CB_-prefixed) env var — e.g. a shell
    # that exports ANTHROPIC_API_KEY directly — works for generation today,
    # since stream_generate's subprocess env starts from a full os.environ
    # copy; without this fallback the flag below would wrongly claim no key
    # is configured.
    return bool(getattr(settings, field) or os.environ.get(SETTINGS_FIELD_ENV_VAR[field]))


class SettingsResponse(BaseModel):
    llm: str
    spl_while_max_iter: int
    spl_max_llm_calls: int
    # Whether each adapter's API key is currently set — never the key
    # value itself, so it's safe to send back to the browser.
    anthropic_api_key_set: bool
    gemini_api_key_set: bool
    openai_api_key_set: bool
    openrouter_api_key_set: bool


class SettingsUpdate(BaseModel):
    llm: str | None = None
    spl_while_max_iter: int | None = None
    spl_max_llm_calls: int | None = None
    # Plaintext key values from the Settings form — only sent when the user
    # actually typed a new one; omitted/None leaves the stored key as-is.
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    openrouter_api_key: str | None = None


def _response() -> SettingsResponse:
    return SettingsResponse(
        llm=settings.llm,
        spl_while_max_iter=settings.spl_while_max_iter,
        spl_max_llm_calls=settings.spl_max_llm_calls,
        anthropic_api_key_set=_key_set("anthropic_api_key"),
        gemini_api_key_set=_key_set("gemini_api_key"),
        openai_api_key_set=_key_set("openai_api_key"),
        openrouter_api_key_set=_key_set("openrouter_api_key"),
    )


@router.get("/api/settings")
async def get_settings() -> SettingsResponse:
    return _response()


@router.put("/api/settings")
async def update_settings(body: SettingsUpdate) -> SettingsResponse:
    """Update in-memory settings, including API keys.

    Not persisted to disk: a `--reload` restart (or any process restart)
    wipes everything set here back to `.env`/environment defaults. This is a
    deliberate tradeoff — writing user-supplied API keys to a file on this
    machine is a bigger decision than the Settings page's own scope, so for
    now re-entering keys after a dev-server restart is expected. To make a
    key survive restarts, put it in `.env` (`CB_ANTHROPIC_API_KEY=...` etc.)
    directly instead.
    """
    if body.llm is not None:
        prefix = body.llm.split(":", 1)[0]
        if prefix not in _VALID_LLM_PREFIXES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid llm '{body.llm}': must start with one of {', '.join(_VALID_LLM_PREFIXES)} followed by ':<model>'",
            )
        settings.llm = body.llm
    if body.spl_while_max_iter is not None:
        settings.spl_while_max_iter = max(1, body.spl_while_max_iter)
    if body.spl_max_llm_calls is not None:
        settings.spl_max_llm_calls = max(1, body.spl_max_llm_calls)
    if body.anthropic_api_key is not None:
        settings.anthropic_api_key = body.anthropic_api_key.strip()
    if body.gemini_api_key is not None:
        settings.gemini_api_key = body.gemini_api_key.strip()
    if body.openai_api_key is not None:
        settings.openai_api_key = body.openai_api_key.strip()
    if body.openrouter_api_key is not None:
        settings.openrouter_api_key = body.openrouter_api_key.strip()
    return _response()


@router.get("/api/settings/ollama-models")
async def ollama_models() -> list[dict]:
    try:
        proc = await asyncio.create_subprocess_exec(
            "ollama", "list",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
        lines = stdout.decode().strip().split("\n")
        models = []
        for line in lines[1:]:
            parts = line.split()
            if parts:
                models.append({"value": parts[0], "label": parts[0]})
        models.sort(key=lambda m: m["label"])
        return models
    except Exception:
        return []
