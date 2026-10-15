from typing import Any

from pydantic import BaseModel, Field


class RoadNode(BaseModel):
    id: str
    name: str
    x: float
    y: float
    lat: float
    lng: float
    type: str
    zone: str


class RoadEdge(BaseModel):
    id: str
    from_: str = Field(alias="from")
    to: str
    name: str
    lengthKm: float
    freeFlowSpeedKmh: float
    currentSpeedKmh: float
    predicted15MinSpeedKmh: float
    predicted30MinSpeedKmh: float
    congestionLevel: str

    model_config = {"populate_by_name": True}


class NetworkResponse(BaseModel):
    nodes: list[RoadNode]
    edges: list[RoadEdge]
    traffic: dict[str, Any] | None = None


class RouteRequest(BaseModel):
    startNodeId: str
    destinationNodeIds: list[str] = Field(default_factory=list)
    useAiAvoidance: bool = True
    departureMs: int | None = None
    dayType: str = "auto"


class RouteResponse(BaseModel):
    pathNodes: list[str]
    totalDistanceKm: float
    durationMinutes: int
    dijkstraBaselineMin: int
    timeSavedMinutes: int
    fuelSavedLitres: float
    algorithm: str | None = None
    modelSource: str | None = None


class OptimizeRouteResponse(RouteResponse):
    slaComplianceRate: float
    metadata: dict[str, Any] = Field(default_factory=dict)
