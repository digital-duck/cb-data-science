from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from api.services.pdf_svc import generate_pdf
from api.services.path_safety import safe_segment, safe_optional_segment

router = APIRouter()


@router.get("/api/pdf")
async def pdf(domain: str, target: str, level: str = "intro", language: str = "en", model: str = ""):
    domain = safe_segment("domain", domain)
    target = safe_segment("target", target)
    level = safe_segment("level", level)
    language = safe_segment("language", language)
    model = safe_optional_segment("model", model)
    result = await generate_pdf(domain, target, level, language, model)
    if result["ok"]:
        return JSONResponse({"file": result["file"]})
    status = 404 if result.get("not_found") else 500
    raise HTTPException(status_code=status, detail=result["error"])
