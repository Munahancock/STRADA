from pathlib import Path

import osmnx as ox

LUSAKA_URBAN_BBOX = (28.15, -15.55, 28.50, -15.30)
DEFAULT_GRAPH_PATH = Path(__file__).resolve().parent / "data" / "lusaka_driving.graphml"


def build_lusaka_driving_graph(output_path: Path = DEFAULT_GRAPH_PATH) -> Path:
    """Download the drivable OpenStreetMap network for the Lusaka urban area."""
    ox.settings.use_cache = True
    graph = ox.graph_from_bbox(
        LUSAKA_URBAN_BBOX,
        network_type="drive_service",
        simplify=True,
        retain_all=True,
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    ox.save_graphml(graph, filepath=output_path)
    return output_path


if __name__ == "__main__":
    print(build_lusaka_driving_graph())
