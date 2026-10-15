import logging
from pathlib import Path

from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

try:
    from .graph import RoadGraph
    from .predictor import SpeedPredictor
    from .schemas import NetworkResponse, OptimizeRouteResponse, RoadEdge, RoadNode, RouteRequest, RouteResponse
    from .solver import calculate_route
    from .traffic_profile import local_datetime, traffic_meta, traffic_profile
except ImportError:
    from graph import RoadGraph
    from predictor import SpeedPredictor
    from schemas import NetworkResponse, OptimizeRouteResponse, RoadEdge, RoadNode, RouteRequest, RouteResponse
    from solver import calculate_route
    from traffic_profile import local_datetime, traffic_meta, traffic_profile

graph = RoadGraph(ROOT / "data" / "lusaka_seed.json")
predictor = SpeedPredictor(ROOT / "models", graph.edges, graph.nodes)
app = FastAPI(title="Lusaka Route Optimizer API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger = logging.getLogger(__name__)


def _validate_nodes(request: RouteRequest) -> None:
    unknown = [node_id for node_id in [request.startNodeId, *request.destinationNodeIds] if node_id not in graph.node_ids]
    if unknown:
        raise HTTPException(status_code=422, detail={"error": "Unknown node id", "nodeIds": sorted(set(unknown))})


def _network_response(at_ms: int | None = None, day_type: str = "auto") -> NetworkResponse:
    request_ms = at_ms if at_ms is not None else round(datetime.now(timezone.utc).timestamp() * 1000)
    overrides = predictor.predict_edge_speeds(graph.edges, request_ms, day_type)
    live_speeds = predictor.traffic_provider.speeds_for_edges(graph.edges, request_ms)
    nodes = [RoadNode.model_validate(node.__dict__) for node in graph.nodes]
    edges = [
        RoadEdge(
            **{
                "id": edge.id,
                "from": edge.from_id,
                "to": edge.to,
                "name": edge.name,
                "lengthKm": edge.length_km,
                "freeFlowSpeedKmh": edge.free_flow_speed_kmh,
                "currentSpeedKmh": overrides[edge.id]["currentSpeedKmh"],
                "predicted15MinSpeedKmh": overrides[edge.id]["predicted15MinSpeedKmh"],
                "predicted30MinSpeedKmh": overrides[edge.id]["predicted30MinSpeedKmh"],
                "congestionLevel": overrides[edge.id]["congestionLevel"],
            }
        )
        for edge in graph.edges
    ]
    traffic = traffic_meta(request_ms, day_type)
    traffic["modelSource"] = predictor.model_source
    traffic["forecastSource"] = "time_profile"
    traffic["providerEdgeCount"] = len(live_speeds)
    traffic["liveEdgeIds"] = [edge.id for edge in graph.edges if edge.id in live_speeds]
    return NetworkResponse(nodes=nodes, edges=edges, traffic=traffic)


@app.get("/api/v1/health")
def health() -> dict[str, str | int | bool]:
    return {
        "status": "healthy",
        "modelSource": predictor.model_source,
        "trafficProviderConfigured": bool(predictor.traffic_provider.api_key),
        "trafficProviderEdgeCount": predictor.traffic_provider.successful_edge_count,
        "graphNodes": len(graph.nodes),
        "graphEdges": len(graph.edges),
        "timezone": "Africa/Lusaka",
        "serverLocalTime": local_datetime(round(datetime.now(timezone.utc).timestamp() * 1000)).strftime("%Y-%m-%d %H:%M:%S"),
    }


@app.get("/api/v1/network", response_model=NetworkResponse)
def network(at: int | None = Query(default=None), dayType: str = Query(default="auto")) -> NetworkResponse:
    return _network_response(at, dayType)


@app.get("/api/v1/traffic/profile")
def profile(at: int | None = Query(default=None), dayType: str = Query(default="auto")) -> dict[str, object]:
    request_ms = at if at is not None else round(datetime.now(timezone.utc).timestamp() * 1000)
    return traffic_profile(dayType, request_ms)


@app.post("/api/v1/route", response_model=RouteResponse)
def route(request: RouteRequest) -> RouteResponse:
    _validate_nodes(request)
    try:
        departure_ms = request.departureMs or round(datetime.now(timezone.utc).timestamp() * 1000)
        overrides = predictor.predict_edge_speeds(graph.edges, departure_ms, request.dayType)
        live_traffic = predictor.model_source.startswith("google_routes_traffic") and predictor.traffic_provider.successful_edge_count > 0
        metrics = calculate_route(graph, request.startNodeId, request.destinationNodeIds, request.useAiAvoidance, overrides, live_traffic)
        return RouteResponse(
            pathNodes=metrics.path_nodes,
            totalDistanceKm=metrics.total_distance_km,
            durationMinutes=metrics.duration_minutes,
            dijkstraBaselineMin=metrics.baseline_minutes,
            timeSavedMinutes=metrics.time_saved_minutes,
            fuelSavedLitres=metrics.fuel_saved_litres,
            algorithm="ortools_vrptw" if request.useAiAvoidance else "dijkstra_request_order",
            modelSource=predictor.model_source,
        )
    except Exception as exc:
        logger.exception("Route calculation failed")
        raise HTTPException(status_code=500, detail={"error": "Route calculation failed"}) from exc


@app.post("/api/v1/optimize-route", response_model=OptimizeRouteResponse)
def optimize_route(request: RouteRequest) -> OptimizeRouteResponse:
    result = route(request)
    return OptimizeRouteResponse(
        **result.model_dump(),
        slaComplianceRate=1.0 if result.durationMinutes <= 9 * 60 else 0.0,
        metadata={"destinationCount": len(request.destinationNodeIds)},
    )
