from fastapi import FastAPI
from routers import upload, merge
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# Allow all origins (⚠️ for development only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # 👈 allow all domains
    allow_credentials=True,
    allow_methods=["*"],          # allow all methods: GET, POST, etc.
    allow_headers=["*"],          # allow all headers
)


app.include_router(upload.router, prefix="/upload")
app.include_router(merge.router, prefix="/merge") 