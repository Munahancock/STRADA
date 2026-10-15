import sys
from dataclasses import dataclass

from .graph import RoadGraph

IDLE_FUEL_LITRES_PER_HOUR = 4.2


@dataclass(frozen=True)
class RouteMetrics:
    path_nodes: list[str]
    total_distance_km: float
    duration_minutes: int
    baseline_minutes: int
    time_saved_minutes: int
    fuel_saved_litres: float


def _route_time(graph: RoadGraph, path_nodes: list[str], speed_kind: str, speed_overrides: dict[str, dict[str, int]] | None = None) -> float:
    total = 0.0
    for first, second in zip(path_nodes, path_nodes[1:]):
        edge = graph.edge_between(first, second)
        if edge is None:
            continue
        speed = {"current": edge.current_speed_kmh, "predicted": edge.predicted_30_min_speed_kmh}[speed_kind]
        if speed_overrides and edge.id in speed_overrides:
            field = "currentSpeedKmh" if speed_kind == "current" else "predicted30MinSpeedKmh"
            speed = speed_overrides[edge.id][field]
        total += edge.length_km / max(speed, 5) * 60
    return total


def _route_distance(graph: RoadGraph, path_nodes: list[str]) -> float:
    total = 0.0
    for first, second in zip(path_nodes, path_nodes[1:]):
        edge = graph.edge_between(first, second)
        if edge is not None:
            total += edge.length_km
    return total


def _choose_order(
    graph: RoadGraph,
    start: str,
    destinations: list[str],
    speed_overrides: dict[str, dict[str, int]] | None = None,
    speed_kind: str = "predicted",
) -> list[str]:
    if len(destinations) < 2:
        return destinations
    # The current OR-Tools wheel crashes natively on Python 3.14. Keep the
    # deterministic request-order fallback until a compatible wheel is used.
    if sys.version_info >= (3, 14):
        return destinations
    try:
        from ortools.constraint_solver import pywrapcp, routing_enums_pb2
    except ImportError:
        return destinations
    locations = [start, *destinations]
    matrix = [[0] * len(locations) for _ in locations]
    for row, source in enumerate(locations):
        for column, target in enumerate(locations):
            if row != column:
                _, cost = graph.shortest_path(source, target, speed_kind, speed_overrides)
                matrix[row][column] = max(0, round(cost))
    manager = pywrapcp.RoutingIndexManager(len(locations), 1, [0], [len(locations) - 1])
    routing = pywrapcp.RoutingModel(manager)

    def transit(from_index: int, to_index: int) -> int:
        return matrix[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]

    transit_index = routing.RegisterTransitCallback(transit)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_index)
    routing.AddDimension(transit_index, 24 * 60, 24 * 60, False, "Time")
    time_dimension = routing.GetDimensionOrDie("Time")
    for index in range(1, len(locations)):
        location_index = manager.NodeToIndex(index)
        time_dimension.CumulVar(location_index).SetRange(0, 9 * 60)
        time_dimension.SetCumulVarSoftUpperBound(location_index, 9 * 60, 10)
    search = pywrapcp.DefaultRoutingSearchParameters()
    search.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search.time_limit.FromMilliseconds(900)
    solution = routing.SolveWithParameters(search)
    if solution is None:
        return destinations
    order: list[str] = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        if node > 0:
            order.append(locations[node])
        index = solution.Value(routing.NextVar(index))
    return order if len(order) == len(destinations) else destinations


def calculate_route(
    graph: RoadGraph,
    start: str,
    destinations: list[str],
    use_ai_avoidance: bool,
    speed_overrides: dict[str, dict[str, int]] | None = None,
    live_traffic: bool = False,
) -> RouteMetrics:
    unique_destinations = list(dict.fromkeys(destination for destination in destinations if destination != start))
    if not unique_destinations:
        return RouteMetrics([start], 0.0, 0, 0, 0, 0.0)
    if live_traffic:
        chosen_order = _choose_order(graph, start, unique_destinations, speed_overrides, "current") if use_ai_avoidance else unique_destinations
        path = graph.expand_order(start, chosen_order, "current", speed_overrides)
        baseline_path = graph.expand_order(start, unique_destinations, "free_flow", speed_overrides)
        duration = _route_time(graph, path, "current", speed_overrides)
        baseline = _route_time(graph, baseline_path, "current", speed_overrides)
        saved = max(0, round(baseline) - round(duration))
        return RouteMetrics(
            path,
            round(_route_distance(graph, path), 1),
            round(duration),
            round(baseline),
            saved,
            round(saved / 60 * IDLE_FUEL_LITRES_PER_HOUR, 1),
        )
    if not use_ai_avoidance:
        if speed_overrides is None:
            return RouteMetrics([start, *unique_destinations], 0.0, 0, 0, 0, 0.0)
        path = graph.expand_order(start, unique_destinations, "free_flow", speed_overrides)
        duration = _route_time(graph, path, "current", speed_overrides)
        return RouteMetrics(path, round(_route_distance(graph, path), 1), round(duration), round(duration), 0, 0.0)
    chosen_order = _choose_order(graph, start, unique_destinations, speed_overrides)
    path = graph.expand_order(start, chosen_order, "predicted", speed_overrides)
    baseline_path = graph.expand_order(start, unique_destinations, "free_flow", speed_overrides)
    duration = _route_time(graph, path, "predicted", speed_overrides)
    baseline = _route_time(graph, baseline_path, "predicted", speed_overrides)
    saved = max(0, round(baseline) - round(duration))
    return RouteMetrics(
        path,
        round(_route_distance(graph, path), 1),
        round(duration),
        round(baseline),
        saved,
        round(saved / 60 * IDLE_FUEL_LITRES_PER_HOUR, 1),
    )
