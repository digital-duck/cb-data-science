from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from api.services.executor import stream_generate
from api.services.path_safety import safe_segment, safe_optional_segment

router = APIRouter()


@router.get("/api/generate")
async def generate(domain: str, target: str, level: str = "intro", language: str = "en", model: str = "gemma4", skip_cache: bool = False):
    domain = safe_segment("domain", domain)
    target = safe_segment("target", target)
    level = safe_segment("level", level)
    language = safe_segment("language", language)
    model = safe_optional_segment("model", model)
    return EventSourceResponse(stream_generate(domain, target, level, language, model, skip_cache))
