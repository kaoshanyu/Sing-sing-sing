import os

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from result_response import ApiResponse, Error, ErrorCode
import traceback
import uvicorn

from database import init_db
from routers.ai_chat_router import router as ai_chat_router
from routers.auth_router import router as auth_router
from routers.files_router import router as files_router
from routers.quiz_sessions_router import router as quiz_sessions_router
from routers.singing_records_router import router as singing_records_router
from routers.songs_router import router as songs_router
from routers.users_router import router as users_router

STATIC_MOUNT_PATH = "/static"
STATIC_STORAGE_DIR = "static/"
os.makedirs(STATIC_STORAGE_DIR, exist_ok=True)
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield
app = FastAPI(
    title="API Service",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=f"{API_PREFIX}", tags=["auth"])
app.include_router(users_router, prefix=f"{API_PREFIX}", tags=["users"])
app.include_router(quiz_sessions_router, prefix=f"{API_PREFIX}", tags=["quiz_sessions"])
app.include_router(songs_router, prefix=f"{API_PREFIX}", tags=["songs"])
app.include_router(singing_records_router, prefix=f"{API_PREFIX}", tags=["singing_records"])
app.include_router(files_router, prefix=f"{API_PREFIX}", tags=["files"])
app.include_router(ai_chat_router, prefix=f"{API_PREFIX}", tags=["ai_chat"])
app.mount(STATIC_MOUNT_PATH, StaticFiles(directory=STATIC_STORAGE_DIR), name="static")
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    error = Error(
        code=ErrorCode.INTERNAL_ERROR,
        message="Internal server error",
        details={"trace": traceback.format_exc()},
    )
    response = ApiResponse.error(error)
    return JSONResponse(status_code=500, content=response.model_dump())
@app.get("/health")
async def health_check():
    return ApiResponse.success(data={"status": "healthy"})
@app.get("/")
async def root():
    return ApiResponse.success(data={"message": "Welcome to the API Service"})

# FastAPI MCP Integration
from fastapi_mcp import FastApiMCP
mcp = FastApiMCP(app)
mcp.mount_sse(mount_path="/mcp")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)