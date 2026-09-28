import asyncio
import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class QueryWebSocketManager:
    """
    Thread-safe WebSocket Connection Manager for real-time Helpdesk & Application Queries.
    Supports room subscriptions by application ID and global broadcast to table observers.
    """
    def __init__(self):
        # Map application_id (str) -> List of WebSocket connections
        self.app_rooms: Dict[str, List[WebSocket]] = {}
        # List of global connections (e.g., table observers listening for query counts/badges)
        self.global_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, app_id: str = "global"):
        await websocket.accept()
        app_id_str = str(app_id).strip()
        async with self._lock:
            if app_id_str == "global":
                if websocket not in self.global_connections:
                    self.global_connections.append(websocket)
            else:
                if app_id_str not in self.app_rooms:
                    self.app_rooms[app_id_str] = []
                if websocket not in self.app_rooms[app_id_str]:
                    self.app_rooms[app_id_str].append(websocket)
        logger.info(f"[WS] Client connected to room: {app_id_str}")

    async def disconnect(self, websocket: WebSocket, app_id: str = "global"):
        app_id_str = str(app_id).strip()
        async with self._lock:
            if app_id_str == "global":
                if websocket in self.global_connections:
                    self.global_connections.remove(websocket)
            else:
                if app_id_str in self.app_rooms and websocket in self.app_rooms[app_id_str]:
                    self.app_rooms[app_id_str].remove(websocket)
                    if not self.app_rooms[app_id_str]:
                        del self.app_rooms[app_id_str]
        logger.info(f"[WS] Client disconnected from room: {app_id_str}")

    async def broadcast_to_app(self, app_id: str, message: dict):
        """
        Broadcasts an event message to all clients listening to a specific application ID,
        as well as all global table observers.
        """
        app_id_str = str(app_id).strip()
        payload = message if isinstance(message, dict) else {"data": message}

        # 1. Broadcast to app-specific room
        targets: List[WebSocket] = []
        async with self._lock:
            if app_id_str in self.app_rooms:
                targets.extend(list(self.app_rooms[app_id_str]))
            targets.extend(list(self.global_connections))

        # Deduplicate
        unique_targets = set(targets)

        for ws in unique_targets:
            try:
                await ws.send_json(payload)
            except Exception as exc:
                logger.debug(f"[WS] Error sending payload to client: {exc}")

    async def broadcast_global(self, message: dict):
        """
        Broadcasts a message to all connected clients.
        """
        payload = message if isinstance(message, dict) else {"data": message}
        targets: List[WebSocket] = []
        async with self._lock:
            targets.extend(list(self.global_connections))
            for conns in self.app_rooms.values():
                targets.extend(conns)

        unique_targets = set(targets)
        for ws in unique_targets:
            try:
                await ws.send_json(payload)
            except Exception:
                pass


query_ws_manager = QueryWebSocketManager()
