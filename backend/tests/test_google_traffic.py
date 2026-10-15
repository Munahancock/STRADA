from time import time

from backend.graph import Edge, Node
from backend.google_traffic import GoogleRoutesTrafficProvider


def test_google_routes_traffic_uses_live_intervals_and_caches(monkeypatch) -> None:
    requests = []

    class Response:
        def raise_for_status(self) -> None:
            pass

        def json(self) -> dict:
            return {
                "routes": [{
                    "duration": "120s",
                    "distanceMeters": 1000,
                    "travelAdvisory": {"speedReadingIntervals": [{"speed": "SLOW"}]},
                }]
            }

    def post(url: str, **kwargs) -> Response:
        requests.append((url, kwargs))
        return Response()

    monkeypatch.setattr("backend.google_traffic.httpx.post", post)
    provider = GoogleRoutesTrafficProvider("test-key")
    edge = Edge("edge-1", "a", "b", "Road", 1, 60, 40, 30, 20, "moderate")
    nodes = [
        Node("a", "A", 0, 0, -15.4, 28.2, "hub", "Central"),
        Node("b", "B", 0, 0, -15.41, 28.21, "hub", "Central"),
    ]
    at_ms = round(time() * 1000)

    provider.refresh([edge], nodes, at_ms)
    first = provider.speeds_for_edges([edge], at_ms)
    second = provider.speeds_for_edges([edge], at_ms)

    assert first == second == {"edge-1": 30}
    assert provider.model_source == "google_routes_traffic"
    assert len(requests) == 1
    assert requests[0][1]["headers"]["X-Goog-Api-Key"] == "test-key"
    assert requests[0][1]["json"]["routingPreference"] == "TRAFFIC_AWARE"


def test_google_routes_without_live_intervals_falls_back(monkeypatch) -> None:
    class Response:
        def raise_for_status(self) -> None:
            pass

        def json(self) -> dict:
            return {"routes": [{"duration": "120s", "distanceMeters": 1000}]}

    monkeypatch.setattr("backend.google_traffic.httpx.post", lambda *args, **kwargs: Response())
    provider = GoogleRoutesTrafficProvider("test-key")
    edge = Edge("edge-1", "a", "b", "Road", 1, 60, 40, 30, 20, "moderate")
    nodes = [
        Node("a", "A", 0, 0, -15.4, 28.2, "hub", "Central"),
        Node("b", "B", 0, 0, -15.41, 28.21, "hub", "Central"),
    ]

    at_ms = round(time() * 1000)
    provider.refresh([edge], nodes, at_ms)

    assert provider.speeds_for_edges([edge], at_ms) == {}
    assert provider.model_source == "time_profile"