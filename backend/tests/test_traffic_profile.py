import datetime
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient

from backend.main import app, graph, predictor
from backend.traffic_profile import traffic_index, traffic_meta

client = TestClient(app)
TZ = ZoneInfo("Africa/Lusaka")


def at(hour: int, minute: int, day: int = 24) -> int:
    return int(datetime.datetime(2026, 9, day, hour, minute, tzinfo=TZ).timestamp() * 1000)


def test_profile_bounds_and_day_types() -> None:
    weekday = [traffic_index(step * 5, "weekday") for step in range(288)]
    weekend = [traffic_index(step * 5, "weekend") for step in range(288)]
    assert all(0.03 <= value <= 1 for value in weekday + weekend)
    assert traffic_index(1050, "weekday") == 1.0
    assert max(weekend) < max(weekday)
    assert traffic_meta(at(17, 30), "weekday")["dayType"] == "weekday"
    assert traffic_meta(at(17, 30), "weekend")["dayType"] == "weekend"


def test_peak_calibration_and_night_speeds() -> None:
    peak = predictor.predict_edge_speeds(graph.edges, at(17, 30), "weekday")
    assert all(peak[edge.id]["currentSpeedKmh"] == round(edge.current_speed_kmh) for edge in graph.edges)
    night = predictor.predict_edge_speeds(graph.edges, at(3, 0), "weekday")
    assert all(night[edge.id]["currentSpeedKmh"] >= edge.free_flow_speed_kmh * 0.92 for edge in graph.edges)


def test_network_changes_by_time_but_preserves_geometry() -> None:
    early = client.get(f"/api/v1/network?at={at(3, 0)}&dayType=weekday").json()
    peak = client.get(f"/api/v1/network?at={at(17, 30)}&dayType=weekday").json()
    assert early["nodes"] == peak["nodes"]
    assert [edge["id"] for edge in early["edges"]] == [edge["id"] for edge in peak["edges"]]
    assert [edge["currentSpeedKmh"] for edge in early["edges"]] != [edge["currentSpeedKmh"] for edge in peak["edges"]]


def test_profile_endpoint_and_route_time_change() -> None:
    profile = client.get(f"/api/v1/traffic/profile?at={at(17, 30)}&dayType=weekday").json()
    assert len(profile["index"]) == 288
    assert profile["peaks"]
    early = client.post("/api/v1/route", json={"startNodeId": "cbd_depot", "destinationNodeIds": ["arcades", "unza_gate", "woodlands_mall"], "useAiAvoidance": True, "departureMs": at(3, 0), "dayType": "weekday"}).json()
    peak = client.post("/api/v1/route", json={"startNodeId": "cbd_depot", "destinationNodeIds": ["arcades", "unza_gate", "woodlands_mall"], "useAiAvoidance": True, "departureMs": at(17, 30), "dayType": "weekday"}).json()
    assert peak["durationMinutes"] > early["durationMinutes"]