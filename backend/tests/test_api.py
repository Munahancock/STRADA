import json
from pathlib import Path

from fastapi.testclient import TestClient

from backend.graph import RoadGraph
from backend.main import app
from backend.solver import calculate_route

client = TestClient(app)
SEED_PATH = Path(__file__).parents[1] / "data" / "lusaka_seed.json"


def test_health_and_network_match_seed() -> None:
    health = client.get("/api/v1/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"
    assert health.json()["modelSource"] == "time_profile"
    network = client.get("/api/v1/network")
    assert network.status_code == 200
    seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    assert network.json()["nodes"] == seed["nodes"]
    assert [
        {key: edge[key] for key in ["id", "from", "to", "name", "lengthKm", "freeFlowSpeedKmh"]}
        for edge in network.json()["edges"]
    ] == [
        {key: edge[key] for key in ["id", "from", "to", "name", "lengthKm", "freeFlowSpeedKmh"]}
        for edge in seed["edges"]
    ]
    assert network.json()["traffic"]["modelSource"] == "time_profile"
    assert network.json()["traffic"]["liveEdgeIds"] == []
    assert len(network.json()["nodes"]) == 23
    assert len(network.json()["edges"]) == 50


def test_network_reports_edges_with_live_traffic(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.main.predictor.traffic_provider.speeds_for_edges",
        lambda edges, at_ms: {"e_ger_2": 31, "e_kafue_1": 22},
    )

    response = client.get("/api/v1/network")

    assert response.status_code == 200
    assert response.json()["traffic"]["liveEdgeIds"] == ["e_ger_2", "e_kafue_1"]
    assert response.json()["traffic"]["providerEdgeCount"] == 2


def test_ai_off_route_is_computed_at_departure_time() -> None:
    request = {"startNodeId": "cbd_depot", "destinationNodeIds": ["arcades"], "useAiAvoidance": False, "departureMs": 1790288100000, "dayType": "weekday"}
    response = client.post("/api/v1/route", json=request)
    assert response.status_code == 200
    assert response.json()["pathNodes"][0] == "cbd_depot"
    assert "arcades" in response.json()["pathNodes"]
    assert response.json()["durationMinutes"] > 0
    assert response.json()["timeSavedMinutes"] == 0


def test_ai_route_invariants_and_determinism() -> None:
    cases = [
        ("cbd_depot", ["arcades", "unza_gate", "woodlands_mall"]),
        ("cbd_depot", ["arcades"]),
        ("longacres", ["makeni_mall", "crossroads"]),
        ("arcades", ["cbd_depot", "airport_depot"]),
        ("matero_ind", ["lilayi_jct", "chelston_hub"]),
        ("unza_gate", ["george_compound", "woodlands_mall"]),
        ("ring_road_south", ["cairo_rd_north", "munali_jct"]),
        ("airport_depot", ["cbd_depot", "makeni_mall"]),
        ("chawama_turn", ["arcades", "crossroads"]),
        ("cairo_rd_south", ["arcades", "lilayi_jct"]),
    ]
    for start, destinations in cases:
        payload = {"startNodeId": start, "destinationNodeIds": destinations, "useAiAvoidance": True}
        first = client.post("/api/v1/route", json=payload)
        second = client.post("/api/v1/route", json=payload)
        assert first.status_code == 200
        assert first.json() == second.json()
        path = first.json()["pathNodes"]
        assert path[0] == start
        assert set(destinations).issubset(path)
        for first_node, second_node in zip(path, path[1:]):
            assert any({edge["from"], edge["to"]} == {first_node, second_node} for edge in client.get("/api/v1/network").json()["edges"])


def test_empty_start_duplicate_and_unknown_inputs() -> None:
    empty = client.post("/api/v1/route", json={"startNodeId": "cbd_depot", "destinationNodeIds": [], "useAiAvoidance": True})
    assert empty.status_code == 200
    assert empty.json()["pathNodes"] == ["cbd_depot"]
    assert all(empty.json()[field] == 0 for field in ["totalDistanceKm", "durationMinutes", "dijkstraBaselineMin", "timeSavedMinutes", "fuelSavedLitres"])

    duplicate = client.post("/api/v1/route", json={"startNodeId": "cbd_depot", "destinationNodeIds": ["cbd_depot", "arcades", "arcades"], "useAiAvoidance": False})
    assert duplicate.status_code == 200
    assert duplicate.json()["pathNodes"][0] == "cbd_depot"
    assert duplicate.json()["pathNodes"].count("arcades") == 1

    unknown = client.post("/api/v1/route", json={"startNodeId": "missing", "destinationNodeIds": [], "useAiAvoidance": True})
    assert unknown.status_code == 422


def test_all_destinations_returns_in_time() -> None:
    nodes = client.get("/api/v1/network").json()["nodes"]
    destinations = [node["id"] for node in nodes if node["id"] != "cbd_depot"]
    response = client.post("/api/v1/route", json={"startNodeId": "cbd_depot", "destinationNodeIds": destinations, "useAiAvoidance": True})
    assert response.status_code == 200
    assert set(destinations).issubset(response.json()["pathNodes"])


def test_live_traffic_routes_around_slow_edges(tmp_path) -> None:
    graph_path = tmp_path / "traffic_graph.json"
    graph_path.write_text(json.dumps({
        "nodes": [
            {"id": "start", "name": "Start", "x": 0, "y": 0, "lat": -15.4, "lng": 28.2, "type": "hub", "zone": "Lusaka"},
            {"id": "fast_a", "name": "Fast A", "x": 1, "y": 1, "lat": -15.41, "lng": 28.21, "type": "junction", "zone": "Lusaka"},
            {"id": "slow_b", "name": "Slow B", "x": 1, "y": 2, "lat": -15.42, "lng": 28.22, "type": "junction", "zone": "Lusaka"},
            {"id": "finish", "name": "Finish", "x": 2, "y": 0, "lat": -15.43, "lng": 28.23, "type": "stop", "zone": "Lusaka"},
        ],
        "edges": [
            {"id": "fast_1", "from": "start", "to": "fast_a", "name": "Fast 1", "lengthKm": 1, "freeFlowSpeedKmh": 60, "currentSpeedKmh": 50, "predicted15MinSpeedKmh": 50, "predicted30MinSpeedKmh": 50, "congestionLevel": "low"},
            {"id": "fast_2", "from": "fast_a", "to": "finish", "name": "Fast 2", "lengthKm": 1, "freeFlowSpeedKmh": 60, "currentSpeedKmh": 50, "predicted15MinSpeedKmh": 50, "predicted30MinSpeedKmh": 50, "congestionLevel": "low"},
            {"id": "slow_1", "from": "start", "to": "slow_b", "name": "Slow 1", "lengthKm": 1, "freeFlowSpeedKmh": 60, "currentSpeedKmh": 50, "predicted15MinSpeedKmh": 50, "predicted30MinSpeedKmh": 50, "congestionLevel": "low"},
            {"id": "slow_2", "from": "slow_b", "to": "finish", "name": "Slow 2", "lengthKm": 1, "freeFlowSpeedKmh": 60, "currentSpeedKmh": 50, "predicted15MinSpeedKmh": 50, "predicted30MinSpeedKmh": 50, "congestionLevel": "low"},
        ],
    }), encoding="utf-8")
    graph = RoadGraph(graph_path)
    overrides = {
        "fast_1": {"currentSpeedKmh": 10, "predicted30MinSpeedKmh": 50},
        "fast_2": {"currentSpeedKmh": 10, "predicted30MinSpeedKmh": 50},
        "slow_1": {"currentSpeedKmh": 50, "predicted30MinSpeedKmh": 10},
        "slow_2": {"currentSpeedKmh": 50, "predicted30MinSpeedKmh": 10},
    }

    forecast_route = calculate_route(graph, "start", ["finish"], True, overrides)
    current_route = calculate_route(graph, "start", ["finish"], True, overrides, live_traffic=True)

    assert forecast_route.path_nodes == ["start", "fast_a", "finish"]
    assert current_route.path_nodes == ["start", "slow_b", "finish"]
