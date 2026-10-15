export interface RoadNode {
  id: string;
  name: string;
  x: number; // SVG coordinate 0 - 800
  y: number; // SVG coordinate 0 - 600
  lat: number;
  lng: number;
  type: 'depot' | 'intersection' | 'hub' | 'delivery_stop';
  zone: string;
}

export interface RoadEdge {
  id: string;
  from: string;
  to: string;
  name: string; // e.g. "Great East Road", "Kafue Road"
  lengthKm: number;
  freeFlowSpeedKmh: number;
  currentSpeedKmh: number;
  predicted15MinSpeedKmh: number;
  predicted30MinSpeedKmh: number;
  congestionLevel: 'low' | 'moderate' | 'severe' | 'gridlock';
}

export interface DeliveryStop {
  id: string;
  nodeId: string;
  recipientName: string;
  locationName: string;
  address: string;
  timeWindow: {
    start: string; // "08:30"
    end: string;   // "09:30"
  };
  packageWeightKg: number;
  priority: 'standard' | 'express' | 'critical';
  status: 'pending' | 'in_transit' | 'delivered';
  predictedArrival?: string;
  slaRisk?: 'on_time' | 'at_risk' | 'breached';
}

export interface CourierVehicle {
  id: string;
  callsign: string;
  type: 'Motorcycle Express' | 'Urban Van' | 'Cargo Light Truck';
  driver: string;
  maxPayloadKg: number;
  currentPayloadKg: number;
  speedFactor: number;
  fuelEfficiencyKmPerL: number;
  active: boolean;
}

export interface OptimizedRoute {
  vehicleId: string;
  stops: DeliveryStop[];
  totalDistanceKm: number;
  estimatedDurationMin: number;
  dijkstraBaselineMin: number;
  savingsMin: number;
  fuelSavedLitres: number;
  pathNodes: string[]; // sequence of node ids
}

export interface RerouteEvent {
  id: string;
  timestamp: string;
  edgeName: string;
  detectedSpeedKmh: number;
  predictedDelayMin: number;
  reason: string;
  alternativeRouteName: string;
  bypassNodes: string[];
  resolved: boolean;
}
