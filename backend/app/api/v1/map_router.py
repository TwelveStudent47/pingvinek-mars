from fastapi import APIRouter
app = APIRouter(prefix="/map", tags=["map"])

class MapRouter:
    def __init__(self):
        self._registerroute()

    def _registerroute(self):
        app.get("/map")
        def get_map():
            pass

MapRouter()