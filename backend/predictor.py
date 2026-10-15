import os
from pathlib import Path

from .google_traffic import GoogleRoutesTrafficProvider
from .graph import Edge, Node
from .traffic_profile import edge_speed, traffic_meta


class SpeedPredictor:
    def __init__(self, model_dir: Path, edges: list[Edge], nodes: list[Node]) -> None:
        self.model_source = "time_profile"
        self.checkpoint = next(model_dir.glob("*.pt"), None) if model_dir.exists() else None
        if self.checkpoint is not None:
            try:
                import torch  # noqa: F401
                import torch_geometric  # noqa: F401
            except ImportError:
                self.checkpoint = None
        if self.checkpoint is not None:
            self.model_source = "checkpoint"
        refresh_seconds = max(60, int(os.getenv("GOOGLE_TRAFFIC_REFRESH_SECONDS", "300")))
        self.traffic_provider = GoogleRoutesTrafficProvider(
            os.getenv("GOOGLE_MAPS_API_KEY"),
            cache_seconds=refresh_seconds + 30,
        )
        self.traffic_provider.start(edges, nodes, refresh_seconds)

    def predict_edge_speeds(self, edges: list[Edge], at_ms: int, day_type: str) -> dict[str, dict[str, int]]:
        def speeds_for(index_ms: int) -> dict[str, int]:
            meta = traffic_meta(index_ms, day_type)
            return {
                edge.id: edge_speed(edge.free_flow_speed_kmh, edge.current_speed_kmh, float(meta["index"]))
                for edge in edges
            }

        current = speeds_for(at_ms)
        predicted_15 = speeds_for(at_ms + 15 * 60 * 1000)
        predicted_30 = speeds_for(at_ms + 30 * 60 * 1000)
        live_speeds = self.traffic_provider.speeds_for_edges(edges, at_ms)
        self.model_source = self.traffic_provider.model_source
        return {
            edge.id: {
            "currentSpeedKmh": live_speeds.get(edge.id, current[edge.id]),
                "predicted15MinSpeedKmh": predicted_15[edge.id],
                "predicted30MinSpeedKmh": predicted_30[edge.id],
                "congestionLevel": self.congestion_level(edge, current[edge.id]),
            }
            for edge in edges
        }

    @staticmethod
    def congestion_level(edge: Edge, speed: int) -> str:
        ratio = speed / edge.free_flow_speed_kmh
        if ratio < 0.30:
            return "gridlock"
        if ratio < 0.45:
            return "severe"
        if ratio < 0.65:
            return "moderate"
        return "low"
