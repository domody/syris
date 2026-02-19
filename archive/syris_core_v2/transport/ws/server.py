import uvicorn

async def run_ws_server(app, host: str = "0.0.0.0", port: int = 42315, log_level: str = "info"):
    config = uvicorn.Config(
        app=app,
        host=host,
        port=port,
        log_level=log_level,
        loop="asyncio",
        lifespan="on",
        ws="websockets",
    )
    server = uvicorn.Server(config)
    await server.serve()

