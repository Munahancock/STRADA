from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from threading import Event, Lock, Thread
from time import monotonic, time

import httpx

from .graph import Edge, Node


class GoogleRoutesTrafficProvider:
    endpoint = "https://routes.googleapis.com/directions/v2:computeRoutes"
    field_mask = "routes.duration,routes.distanceMeters,routes.travelAdvisory.speedReadingIntervals"

    def __init__(self, api_key: str | None, cache_seconds: int = 240, timeout_seconds: float = 5) -> None:
        self.api_key = api_key.strip() if api_key else ""
        self.cache_seconds = cache_seconds
        self.timeout_seconds = timeout_seconds
        self._cache: dict[str, tuple[float, int]] = {}
        self._cache_lock = Lock()
        self._stop = Event()
        self._thread: Thread | None = None
        self.model_source = "time_profile"
        self.successful_edge_count = 0

    def start(self, edges: list[Edge], nodes: list[Node], refresh_seconds: int = 300) -> None:
        if not self.api_key or self._thread is not None:
            return

        def poll() -> None:
            while not self._stop.is_set():
                self.refresh(edges, nodes, round(time() * 1000))
                self._stop.wait(refresh_seconds)

        self._thread = Thread(target=poll, name="google-traffic-refresh", daemon=True)
        self._thread.start()

    def speeds_for_edges(self, edges: list[Edge], at_ms: int) -> dict[str, int]:
        if not self.api_key:
            self.model_source = "time_profile"
            self.successful_edge_count = 0
            return {}

        if abs(at_ms - int(time() * 1000)) > 5 * 60 * 1000:
            self.model_source = "time_profile"
            self.successful_edge_count = 0
            return {}

        current = monotonic()
        with self._cache_lock:
            speeds = {
                edge.id: self._cache[edge.id][1]
                for edge in edges
                if edge.id in self._cache and current - self._cache[edge.id][0] < self.cache_seconds
            }
        self._set_source(len(speeds), len(edges))
        return speeds

    def refresh(self, edges: list[Edge], nodes: list[Node], at_ms: int) -> None:
        if not self.api_key or abs(at_ms - int(time() * 1000)) > 5 * 60 * 1000:
            return

        now = monotonic()
        nodes_by_id = {node.id: node for node in nodes}
        missing: list[Edge] = []
        with self._cache_lock:
            for edge in edges:
                cached = self._cache.get(edge.id)
                if not cached or now - cached[0] >= self.cache_seconds:
                    missing.append(edge)

        def fetch(edge: Edge) -> tuple[str, int] | None:
            origin = nodes_by_id.get(edge.from_id)
            destination = nodes_by_id.get(edge.to)
            if not origin or not destination:
                return None
            try:
                speed = self._fetch_speed(origin, destination)
            except (httpx.HTTPError, IndexError, KeyError, TypeError, ValueError):
                return None
            return (edge.id, speed) if speed is not None else None

        with ThreadPoolExecutor(max_workers=8) as executor:
            for result in executor.map(fetch, missing):
                if result is not None:
                    edge_id, speed = result
                    with self._cache_lock:
                        self._cache[edge_id] = (monotonic(), speed)

        self.speeds_for_edges(edges, at_ms)

    def _set_source(self, successful_edges: int, total_edges: int) -> None:
        self.successful_edge_count = successful_edges
        if successful_edges:
            self.model_source = "google_routes_traffic" if successful_edges == total_edges else "google_routes_traffic_partial"
        else:
            self.model_source = "time_profile"

    def _fetch_speed(self, origin: Node, destination: Node) -> int | None:
        response = httpx.post(
            self.endpoint,
            headers={
                "X-Goog-Api-Key": self.api_key,
                "X-Goog-FieldMask": self.field_mask,
                "Content-Type": "application/json",
            },
            json={
                "origin": {"location": {"latLng": {"latitude": origin.lat, "longitude": origin.lng}}},
                "destination": {"location": {"latLng": {"latitude": destination.lat, "longitude": destination.lng}}},
                "travelMode": "DRIVE",
                "routingPreference": "TRAFFIC_AWARE",
                "extraComputations": ["TRAFFIC_ON_POLYLINE"],
            },
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        route = response.json()["routes"][0]
        intervals = route.get("travelAdvisory", {}).get("speedReadingIntervals", [])
        if not intervals:
            return None

        duration_seconds = float(route["duration"].removesuffix("s"))
        distance_km = float(route["distanceMeters"]) / 1000
        if duration_seconds <= 0 or distance_km <= 0:
            return None
        return max(5, min(130, round(distance_km / duration_seconds * 3600)))
