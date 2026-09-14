import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import generate, domains, settings, pdf


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="concept-book API", version="0.1.0", lifespan=lifespan)

# Narrow to the actual dev frontend origin(s) — this API now also holds
# user-supplied LLM API keys (Settings page) and has side-effecting GET
# endpoints (/api/generate, /api/pdf), so wildcard CORS would let any
# website the user's browser visits fire requests against it. DEV_PORT
# comes from .env / the environment, same source vite.config.js uses.
_dev_port = os.environ.get("DEV_PORT", "5173")
_allowed_origins = [f"http://localhost:{_dev_port}", f"http://127.0.0.1:{_dev_port}"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "PUT", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(generate.router)
app.include_router(domains.router)
app.include_router(settings.router)
app.include_router(pdf.router)
