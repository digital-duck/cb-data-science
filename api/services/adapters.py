"""Single source of truth for the adapter name <-> env var <-> Settings field mapping.

Previously duplicated across api/services/executor.py (_ADAPTER_ENV_VAR,
_ADAPTER_SETTINGS_FIELD) and api/routers/settings.py (_ADAPTER_BARE_ENV_VAR) —
all three tables carried the same four adapters and were liable to drift out
of sync (e.g. a new adapter added to one but not the others). Keyed by
spl3's own adapter registry name (spl3/adapters/__init__.py) — note that's
"google", not "gemini", even though the Settings UI and config field say
"Gemini" for the user-facing label.
"""

# adapter -> (env var spl3's own adapter reads its key from, api.config.Settings field name)
ADAPTERS: dict[str, tuple[str, str]] = {
    "anthropic": ("ANTHROPIC_API_KEY", "anthropic_api_key"),
    "openai": ("OPENAI_API_KEY", "openai_api_key"),
    "google": ("GOOGLE_API_KEY", "gemini_api_key"),
    "openrouter": ("OPENROUTER_API_KEY", "openrouter_api_key"),
}

ADAPTER_ENV_VAR: dict[str, str] = {k: v[0] for k, v in ADAPTERS.items()}
ADAPTER_SETTINGS_FIELD: dict[str, str] = {k: v[1] for k, v in ADAPTERS.items()}
SETTINGS_FIELD_ENV_VAR: dict[str, str] = {v[1]: v[0] for v in ADAPTERS.values()}
