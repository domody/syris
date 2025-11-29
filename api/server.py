from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .router import router as syris_router

def create_app():
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials = True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    app.include_router(syris_router, prefix="/syris")
    return app

# Only run the server if this file is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.server:create_app", host="127.0.0.1", port=4311, reload=True)
