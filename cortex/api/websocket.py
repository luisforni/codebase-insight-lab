import asyncio
import json
import re
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from agents.orchestrator import Orchestrator

ws_router = APIRouter()
orchestrator = Orchestrator()

_camel_re = re.compile(r'(?<=[a-z0-9])([A-Z])')

def _to_snake(obj):
    """Recursively convert camelCase dict keys to snake_case."""
    if isinstance(obj, dict):
        return {_camel_re.sub(r'_\1', k).lower(): _to_snake(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_snake(i) for i in obj]
    return obj


class ConnectionManager:
    def __init__(self):
        self._active: list[WebSocket] = []

    def add(self, ws: WebSocket) -> None:
        self._active.append(ws)

    def remove(self, ws: WebSocket) -> None:
        self._active.remove(ws)

    async def close_all(self) -> None:
        for ws in list(self._active):
            try:
                await ws.close(code=1001)
            except Exception:
                pass
        self._active.clear()


manager = ConnectionManager()


@ws_router.websocket("/ws/analysis")
async def analysis_ws(websocket: WebSocket):
    await websocket.accept()
    manager.add(websocket)

    async def send(data: dict):
        try:
            await websocket.send_text(json.dumps(data))
        except Exception:
            pass

    try:
        while True:
            raw = await websocket.receive_text()
            msg = _to_snake(json.loads(raw))

            if msg.get("action") == "analyze":
                await orchestrator.run(msg, send)
    except WebSocketDisconnect:
        pass
    except asyncio.CancelledError:
        raise
    except Exception as e:
        await send({"type": "error", "error": str(e), "timestamp": 0})
    finally:
        manager.remove(websocket)
