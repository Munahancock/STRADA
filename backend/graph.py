import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Node:
    id: str
    name: str
    x: float
    y: float
    lat: float
    lng: float
    type: str
    zone: str


@dataclass(frozen=True)
class Edge:
    id: str
    from_id: str
    to: str
    name: str
    length_km: float
    free_flow_speed_kmh: float
    current_speed_kmh: float
    predicted_15_min_speed_kmh: float
    predicted_30_min_speed_kmh: float
    congestion_level: str


class RoadGraph:
    def __init__(self, seed_path: Path) -> None:
        data = json.loads(seed_path.read_text(encoding="utf-8"))
        self.nodes = [Node(**node) for node in data["nodes"]]
        self.edges = [
            Edge(
                id=edge["id"],
                from_id=edge["from"],
                to=edge["to"],
                name=edge["name"],
                length_km=edge["lengthKm"],
                free_flow_speed_kmh=edge["freeFlowSpeedKmh"],
                current_speed_kmh=edge["currentSpeedKmh"],
                predicted_15_min_speed_kmh=edge["predicted15MinSpeedKmh"],
                predicted_30_min_speed_kmh=edge["predicted30MinSpeedKmh"],
                congestion_level=edge["congestionLevel"],
            )
            for edge in data["edges"]
        ]
        self.node_ids = {node.id for node in self.nodes}
        self.edge_by_pair: dict[frozenset[str], Edge] = {}
        self.adjacency: dict[str, list[Edge]] = {node.id: [] for node in self.nodes}
        for edge in self.edges:
            self.edge_by_pair[frozenset((edge.from_id, edge.to))] = edge
            self.adjacency[edge.from_id].append(edge)
            self.adjacency[edge.to].append(edge)
        for neighbors in self.adjacency.values():
            neighbors.sort(key=lambda edge: (edge.id, edge.from_id, edge.to))

    def edge_between(self, first: str, second: str) -> Edge | None:
        return self.edge_by_pair.get(frozenset((first, second)))

    def shortest_path(self, source: str, destination: str, cost_kind: str, speed_overrides: dict[str, dict[str, int]] | None = None) -> tuple[list[str], float]:
        import heapq

        distances = {node_id: float("inf") for node_id in self.node_ids}
        previous: dict[str, str | None] = {node_id: None for node_id in self.node_ids}
        distances[source] = 0.0
        queue: list[tuple[float, str]] = [(0.0, source)]
        while queue:
            distance, current = heapq.heappop(queue)
            if distance != distances[current]:
                continue
            if current == destination:
                break
            for edge in self.adjacency[current]:
                speed = edge.free_flow_speed_kmh
                if cost_kind == "current":
                    speed = speed_overrides.get(edge.id, {}).get("currentSpeedKmh", edge.current_speed_kmh) if speed_overrides else edge.current_speed_kmh
                elif cost_kind == "predicted":
                    speed = speed_overrides.get(edge.id, {}).get("predicted30MinSpeedKmh", edge.predicted_30_min_speed_kmh) if speed_overrides else edge.predicted_30_min_speed_kmh
                cost = edge.length_km / max(speed, 5) * 60
                if cost_kind == "predicted" and speed < 15:
                    cost += 20
                neighbor = edge.to if edge.from_id == current else edge.from_id
                candidate = distance + cost
                if candidate < distances[neighbor]:
                    distances[neighbor] = candidate
                    previous[neighbor] = current
                    heapq.heappush(queue, (candidate, neighbor))
        if distances[destination] == float("inf"):
            return [destination], 0.0
        path: list[str] = []
        current: str | None = destination
        while current is not None:
            path.append(current)
            current = previous[current]
        path.reverse()
        return path, distances[destination]

    def expand_order(self, start: str, destinations: list[str], cost_kind: str, speed_overrides: dict[str, dict[str, int]] | None = None) -> list[str]:
        full_path = [start]
        current = start
        for destination in destinations:
            if destination == current:
                continue
            path, _ = self.shortest_path(current, destination, cost_kind, speed_overrides)
            full_path.extend(path[1:] if len(path) > 1 else [destination])
            current = destination
        return full_path
