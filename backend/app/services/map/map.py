import csv
import os
from schemas.JSON.map import MapResponse


DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
CSV_PATH = os.path.join(DATA_DIR, "map.csv")


class MapService:
    def __init__(self):
        self._csv_path = CSV_PATH

    def _read_csv(self) -> dict:
        """CSV fájl beolvasása: minden sor egy csempéket tartalmazó lista."""
        grid: dict[str, list[str]] = {}
        with open(self._csv_path, mode="r", encoding="utf-8") as file:
            reader = csv.reader(file)
            for row_idx, row in enumerate(reader):
                tiles = [cell.strip() for cell in row if cell.strip() != ""]
                if tiles:
                    grid[str(row_idx)] = tiles
        return grid

    def get_map(self) -> MapResponse:
        """Térkép adatok lekérése JSON formátumban."""
        grid = self._read_csv()
        rows = len(grid)
        cols = max((len(v) for v in grid.values()), default=0)
        return MapResponse(map=grid, rows=rows, cols=cols)