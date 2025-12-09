from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.handlers.letters import letters_router


def create_app() -> FastAPI:
    app = FastAPI(title="Letters API", version="0.1.0", docs_url="/docs")

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    # cors
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(letters_router)

    return app


app = create_app()


