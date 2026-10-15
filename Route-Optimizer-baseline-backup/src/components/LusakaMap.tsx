import React, { useState, useRef } from 'react';
import { RoadNode, RoadEdge } from '../types';
import { LUSAKA_NODES, LUSAKA_EDGES } from '../data/lusakaNetwork';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  MapPin,
  Plus,
  Trash2,
  Check,
  Compass,
  AlertTriangle,
  Layers,
  Radio,
  Truck,
  Gauge,
  Mountain,
  Activity,
  Crosshair,
  Play,
  Pause,
  FastForward,
  CheckCircle2
} from 'lucide-react';

export interface LiveCourierTrack {
  id: string;
  callsign: string;
  type: string;
  driver: string;
  x: number;
  y: number;
  speedKmh: number;
  headingDeg: number;
  status: string;
  destinationName: string;
  currentRoadName?: string;
  isUserCourier?: boolean;
  batteryFuelPct?: number;
  deliveriesCompleted?: number;
  totalDeliveries?: number;
}

interface LusakaMapProps {
  startNodeId: string;
  destinationNodeIds: string[];
  activeRouteNodes: string[];
  onToggleDestination: (nodeId: string) => void;
  onSetStartNode: (nodeId: string) => void;
  activeVehiclePosition?: { x: number; y: number; headingDeg: number } | null;
  predictionHorizon?: 'live' | '15min' | '30min';
  highlightedNodeId?: string | null;
  liveTrackingEnabled?: boolean;
  liveCouriers?: LiveCourierTrack[];
  theme?: 'dark' | 'light';
  mapView?: 'traffic' | 'terrain';
  onToggleMapView?: (view: 'traffic' | 'terrain') => void;
  onToggleCourierDriving?: () => void;
  onAdvanceCourierStop?: () => void;
  onCompleteDelivery?: () => void;
  onMoveCourierToNode?: (nodeId: string) => void;
  centerTrigger?: number;
}

export const LusakaMap: React.FC<LusakaMapProps> = ({
  startNodeId,
  destinationNodeIds,
  activeRouteNodes,
  onToggleDestination,
  onSetStartNode,
  activeVehiclePosition = null,
  predictionHorizon = '30min',
  highlightedNodeId = null,
  liveTrackingEnabled = false,
  liveCouriers = [],
  theme = 'dark',
  mapView: externalMapView,
  onToggleMapView,
  onToggleCourierDriving,
  onAdvanceCourierStop,
  onCompleteDelivery,
  onMoveCourierToNode,
  centerTrigger
}) => {
  const [internalMapView, setInternalMapView] = useState<'traffic' | 'terrain'>('traffic');
  const mapView = externalMapView || internalMapView;

  const handleSetMapView = (view: 'traffic' | 'terrain') => {
    if (onToggleMapView) {
      onToggleMapView(view);
    } else {
      setInternalMapView(view);
    }
  };

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<RoadNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<RoadNode | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<LiveCourierTrack | null>(null);

  // Drag pan gesture state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const isDark = theme === 'dark';
  const getNodeById = (id: string) => LUSAKA_NODES.find(n => n.id === id);

  // Check if an edge is in the calculated route sequence
  const isEdgeInRoute = (edge: RoadEdge) => {
    for (let i = 0; i < activeRouteNodes.length - 1; i++) {
      if (
        (activeRouteNodes[i] === edge.from && activeRouteNodes[i + 1] === edge.to) ||
        (activeRouteNodes[i] === edge.to && activeRouteNodes[i + 1] === edge.from)
      ) {
        return true;
      }
    }
    return false;
  };

  const getEdgeSpeed = (edge: RoadEdge): number => {
    if (predictionHorizon === 'live') return edge.currentSpeedKmh;
    if (predictionHorizon === '15min') return edge.predicted15MinSpeedKmh;
    return edge.predicted30MinSpeedKmh;
  };

  const getEdgeColor = (edge: RoadEdge): string => {
    if (mapView === 'terrain') {
      return isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(30, 41, 59, 0.38)';
    }
    // Traffic view: color by speed
    const speed = getEdgeSpeed(edge);
    if (speed < 15) return '#f43f5e'; // Gridlock
    if (speed < 25) return '#f59e0b'; // Congestion
    return isDark ? '#71717a' : '#64748b'; // Standard road (high contrast)
  };

  // Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'button' || (e.target as HTMLElement).closest('.popover-card')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStartRef.current.x) / zoom;
    const dy = (e.clientY - dragStartRef.current.y) / zoom;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleCenterOnCourier = () => {
    const me = liveCouriers.find(c => c.isUserCourier) || liveCouriers[0];
    if (me) {
      setPan({
        x: 515 - me.x,
        y: 355 - me.y
      });
      setZoom(1.35);
    }
  };

  // Auto center on external trigger if requested
  React.useEffect(() => {
    if (centerTrigger && centerTrigger > 0) {
      handleCenterOnCourier();
    }
  }, [centerTrigger]);

  return (
    <div
      className={`relative w-full h-[clamp(360px,58svh,520px)] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden glass-panel select-none touch-none transition-colors duration-200 ${
        isDark ? 'border-white/10' : 'border-black/10'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: View Mode Badge & Map View Switcher */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 flex-wrap">
          
          {/* Map View Switcher: Traffic vs. Terrain */}
          <div className={`flex items-center p-0.5 rounded-xl border backdrop-blur-md shadow-lg ${
            isDark ? 'bg-black/85 border-white/15' : 'bg-white/90 border-black/10'
          }`}>
            <button
              onClick={() => handleSetMapView('traffic')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-11 sm:min-h-0 rounded-lg text-xs font-medium transition-all ${
                mapView === 'traffic'
                  ? 'bg-teal-700 text-white dark:bg-teal-300 dark:text-teal-950 font-semibold shadow-sm'
                  : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
              }`}
              title="Traffic Congestion & Velocities"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden min-[420px]:inline">Traffic</span>
            </button>

            <button
              onClick={() => handleSetMapView('terrain')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-11 sm:min-h-0 rounded-lg text-xs font-medium transition-all ${
                mapView === 'terrain'
                  ? 'bg-teal-700 text-white dark:bg-teal-300 dark:text-teal-950 font-semibold shadow-sm'
                  : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
              }`}
              title="Topography, Elevation Contours & Green Reserves"
            >
              <Mountain className="w-3.5 h-3.5" />
              <span className="hidden min-[420px]:inline">Terrain</span>
            </button>
          </div>

          {/* Status Badge */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs ${
            isDark ? 'bg-black/85 border-white/15 text-white' : 'bg-white/90 border-black/10 text-neutral-900'
          }`}>
            {liveTrackingEnabled ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold text-emerald-500 dark:text-emerald-400 text-xs">My Courier (Hancock Muna)</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="font-semibold text-xs">Lusaka Network</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Zoom, Center on Me & Reset Controls */}
        <div className={`pointer-events-auto flex items-center gap-1 backdrop-blur-md p-1 rounded-xl border shadow-lg ${
          isDark ? 'bg-black/85 border-white/15' : 'bg-white/90 border-black/10'
        }`}>
          {liveTrackingEnabled && (
            <button
              onClick={handleCenterOnCourier}
              className={`w-11 h-11 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-colors ${
                isDark ? 'text-emerald-400 hover:text-emerald-300 hover:bg-white/10' : 'text-emerald-600 hover:text-emerald-700 hover:bg-black/5'
              }`}
              title="Center Map on My Courier (Hancock Muna)"
              aria-label="Center map on my courier"
            >
              <Crosshair className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.25, 2.5))}
            className={`w-11 h-11 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-colors ${
              isDark ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-neutral-700 hover:text-black hover:bg-black/5'
            }`}
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.7))}
            className={`w-11 h-11 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-colors ${
              isDark ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-neutral-700 hover:text-black hover:bg-black/5'
            }`}
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className={`w-11 h-11 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-colors ${
              isDark ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-neutral-700 hover:text-black hover:bg-black/5'
            }`}
            title="Reset Map View"
            aria-label="Reset map view"
          >
            <RotateCcw className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <svg
        viewBox="190 110 650 490"
        className={`w-full h-full transition-colors duration-200 ${
          isDark ? 'bg-[#060609]' : 'bg-[#f1f5f9]'
        } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.12s ease-out'
        }}
      >
        <defs>
          {/* Subtle Grid */}
          <pattern id="canvas-grid" width="35" height="35" patternUnits="userSpaceOnUse">
            <path
              d="M 35 0 L 0 0 0 35"
              fill="none"
              stroke={isDark ? "rgba(255, 255, 255, 0.025)" : "rgba(0, 0, 0, 0.03)"}
              strokeWidth="0.8"
            />
          </pattern>
          
          {/* Topographic Hachure / Texture Pattern */}
          <pattern id="contour-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} strokeWidth="1" />
          </pattern>

          {/* Glow filter for route */}
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="courier-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect x="0" y="0" width="1000" height="800" fill="url(#canvas-grid)" />

        {/* ==================================================================== */}
        {/* TERRAIN VIEW LAYER: Lusaka Plateau Topography & Urban Green Reserves */}
        {/* ==================================================================== */}
        {mapView === 'terrain' && (
          <g id="terrain-features" className="pointer-events-none select-none">
            
            {/* 1. Lowland Basins (Chunga Catchment & Matero depression - 1,220m) */}
            <path
              d="M 180 180 Q 230 190 270 240 Q 290 300 240 340 Q 190 330 180 260 Z"
              fill={isDark ? "rgba(56, 189, 248, 0.04)" : "rgba(14, 165, 233, 0.06)"}
              stroke={isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(14, 165, 233, 0.2)"}
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text x="210" y="275" fill={isDark ? "#38bdf8" : "#0284c7"} fontSize="8" fontStyle="italic" opacity="0.6">
              Chunga River Catchment (1,220m)
            </text>

            {/* 2. Lusaka High Plateau & Ridgeway Spine (1,280m elevation) */}
            <path
              d="M 360 300 C 440 280, 520 290, 610 330 C 650 360, 640 430, 530 450 C 440 460, 370 420, 360 350 Z"
              fill={isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)"}
              stroke={isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.12)"}
              strokeWidth="1.2"
            />
            
            {/* 1,260m Intermediate Contour line */}
            <path
              d="M 330 270 C 460 240, 580 250, 710 270 C 760 330, 700 480, 480 530 C 370 540, 310 460, 330 350 Z"
              fill="none"
              stroke={isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.07)"}
              strokeWidth="1"
              strokeDasharray="4 2"
            />

            {/* 3. Green Reserves & Parks (Lusaka Golf Club, State House, UNZA) */}
            {/* Lusaka Golf Club & Showgrounds */}
            <path
              d="M 460 255 C 490 245, 530 250, 545 280 C 530 300, 480 305, 455 285 Z"
              fill={isDark ? "rgba(34, 197, 94, 0.08)" : "rgba(22, 163, 74, 0.12)"}
              stroke={isDark ? "rgba(34, 197, 94, 0.25)" : "rgba(22, 163, 74, 0.3)"}
              strokeWidth="0.8"
            />
            <text x="475" y="275" fill={isDark ? "#4ade80" : "#16a34a"} fontSize="7.5" fontWeight="600" opacity="0.8">
              Lusaka Golf Club
            </text>

            {/* State House Arboretum & Longacres Reserve */}
            <path
              d="M 480 335 C 520 330, 540 350, 530 380 C 500 395, 470 375, 480 335 Z"
              fill={isDark ? "rgba(34, 197, 94, 0.07)" : "rgba(22, 163, 74, 0.1)"}
              stroke={isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(22, 163, 74, 0.25)"}
              strokeWidth="0.8"
            />
            <text x="485" y="360" fill={isDark ? "#4ade80" : "#16a34a"} fontSize="7" opacity="0.75">
              State House Park
            </text>

            {/* UNZA Ecological Forest & Sports Complex */}
            <path
              d="M 605 195 C 640 185, 665 200, 655 235 C 630 245, 600 230, 605 195 Z"
              fill={isDark ? "rgba(34, 197, 94, 0.07)" : "rgba(22, 163, 74, 0.1)"}
              stroke={isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(22, 163, 74, 0.25)"}
              strokeWidth="0.8"
            />
            <text x="615" y="215" fill={isDark ? "#4ade80" : "#16a34a"} fontSize="7" opacity="0.75">
              UNZA Grounds
            </text>

            {/* 4. Elevation Benchmarks */}
            <g opacity="0.6" className="font-mono text-[8px]" fill={isDark ? "#d4d4d8" : "#475569"}>
              <text x="500" y="320">▲ 1,280m Ridgeway Plateau</text>
              <text x="620" y="360">▲ 1,265m Leopards Hill Ridge</text>
              <text x="730" y="150">▲ 1,220m Airport Flats</text>
              <text x="320" y="550">▲ 1,245m Lilayi Basin</text>
            </g>
          </g>
        )}

        {/* Road Corridor Text Labels */}
        <g
          opacity={isDark ? "0.4" : "0.55"}
          fill={isDark ? "#a1a1aa" : "#475569"}
          fontSize="9"
          fontWeight="600"
          className="pointer-events-none select-none font-mono"
        >
          <text x="540" y="215" transform="rotate(-12, 540, 215)">GREAT EAST ROAD (T4)</text>
          <text x="330" y="470" transform="rotate(78, 330, 470)">KAFUE ROAD (T2)</text>
          <text x="235" y="320" transform="rotate(82, 235, 320)">LUMUMBA ROAD</text>
          <text x="350" y="300" transform="rotate(90, 350, 300)">CAIRO ROAD</text>
          <text x="490" y="325" transform="rotate(25, 490, 325)">INDEPENDENCE AVE</text>
          <text x="470" y="515">RING ROAD BYPASS</text>
        </g>

        {/* 1. Road Edges */}
        <g id="road-edges">
          {LUSAKA_EDGES.map(edge => {
            const fromNode = getNodeById(edge.from);
            const toNode = getNodeById(edge.to);
            if (!fromNode || !toNode) return null;

            const inRoute = isEdgeInRoute(edge);
            const speed = getEdgeSpeed(edge);
            const baseColor = getEdgeColor(edge);

            return (
              <g key={edge.id}>
                {/* Background base road */}
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={baseColor}
                  strokeWidth={mapView === 'traffic' && speed < 15 ? "3.5" : "2"}
                  strokeOpacity={isDark ? (mapView === 'traffic' && speed < 15 ? "0.9" : "0.5") : (mapView === 'traffic' && speed < 15 ? "0.95" : "0.7")}
                  strokeLinecap="round"
                />

                {/* Active Calculated Route */}
                {inRoute && (
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={isDark ? "#ffffff" : "#09090b"}
                    strokeWidth="5"
                    strokeLinecap="round"
                    filter={isDark ? "url(#route-glow)" : undefined}
                    strokeOpacity="1"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* 2. Interactive Road Nodes (Destinations / Landmarks) */}
        <g id="road-nodes">
          {LUSAKA_NODES.map(node => {
            const isStart = node.id === startNodeId;
            const destIndex = destinationNodeIds.indexOf(node.id);
            const isDestination = destIndex !== -1;
            const inRoute = activeRouteNodes.includes(node.id);
            const isSelected = selectedNode?.id === node.id || hoveredNode?.id === node.id || highlightedNodeId === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Selection Halo */}
                {isSelected && (
                  <circle
                    r="16"
                    fill="none"
                    stroke={isDark ? "#ffffff" : "#09090b"}
                    strokeWidth="1.5"
                    strokeDasharray="2 3"
                    className="animate-spin"
                  />
                )}

                {/* Mobile Finger Touch Area */}
                <circle r="18" fill="transparent" />

                {/* Pin Geometry */}
                {isStart ? (
                  // START PIN (Depot)
                  <g>
                    <circle r="9" fill={isDark ? "#ffffff" : "#09090b"} stroke={isDark ? "#000000" : "#ffffff"} strokeWidth="2.5" />
                    <circle r="3.5" fill={isDark ? "#000000" : "#ffffff"} />
                    <text
                      y="-14"
                      textAnchor="middle"
                      fill={isDark ? "#ffffff" : "#09090b"}
                      fontSize="9"
                      fontWeight="800"
                      className="font-mono"
                    >
                      START
                    </text>
                  </g>
                ) : isDestination ? (
                  // NUMBERED DESTINATION PIN
                  <g>
                    <circle r="10" fill={isDark ? "#ffffff" : "#09090b"} stroke={isDark ? "#000000" : "#ffffff"} strokeWidth="2" />
                    <text
                      y="3.5"
                      textAnchor="middle"
                      fill={isDark ? "#000000" : "#ffffff"}
                      fontSize="10"
                      fontWeight="800"
                      className="font-mono"
                    >
                      {destIndex + 1}
                    </text>
                  </g>
                ) : (
                  // STANDARD LANDMARK
                  <circle
                    r={inRoute ? "4.5" : "3.5"}
                    fill={inRoute ? (isDark ? "#ffffff" : "#09090b") : (isDark ? "#3f3f46" : "#cbd5e1")}
                    stroke={inRoute ? (isDark ? "#ffffff" : "#09090b") : (isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)")}
                    strokeWidth="1.2"
                  />
                )}

                {/* Node Label */}
                <text
                  y={isStart ? "18" : isDestination ? "20" : "13"}
                  textAnchor="middle"
                  fill={isStart || isDestination ? (isDark ? "#ffffff" : "#0f172a") : (isDark ? "#d4d4d8" : "#1e293b")}
                  fontSize={isStart || isDestination ? "10" : "8.5"}
                  fontWeight={isStart || isDestination ? "700" : "600"}
                  paintOrder="stroke"
                  stroke={isDark ? "#060609" : "#f1f5f9"}
                  strokeWidth={isStart || isDestination ? "3" : "2"}
                  strokeLinejoin="round"
                  className="pointer-events-none select-none font-sans"
                >
                  {node.name.split(' (')[0]}
                </text>
              </g>
            );
          })}
        </g>

        {/* 3. Navigation Vehicle Marker */}
        {activeVehiclePosition && !liveTrackingEnabled && (
          <g transform={`translate(${activeVehiclePosition.x}, ${activeVehiclePosition.y})`}>
            <circle r="16" fill={isDark ? "#ffffff" : "#09090b"} opacity="0.25" className="animate-ping" />
            <circle r="8" fill={isDark ? "#ffffff" : "#09090b"} stroke={isDark ? "#000000" : "#ffffff"} strokeWidth="2" />
            <circle r="3" fill={isDark ? "#000000" : "#ffffff"} />
          </g>
        )}

        {/* 4. Functional Live Courier (Hancock Muna) */}
        {liveTrackingEnabled && liveCouriers.map((courier) => {
          const isMe = courier.isUserCourier || courier.driver?.toLowerCase().includes('hancock');
          return (
            <g
              key={courier.id}
              transform={`translate(${courier.x}, ${courier.y})`}
              className="cursor-pointer transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCourier(courier);
              }}
            >
              {/* Outer Radar Sonar Ring */}
              <circle r="22" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.4" className="animate-ping" />
              <circle
                r="15"
                fill={isMe ? "rgba(16, 185, 129, 0.15)" : "transparent"}
                stroke={isMe ? "#10b981" : (isDark ? "#ffffff" : "#09090b")}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="animate-spin"
              />

              {/* Courier Body */}
              <circle
                r="10"
                fill={isMe ? "#10b981" : (isDark ? "#ffffff" : "#09090b")}
                stroke={isDark ? "#000000" : "#ffffff"}
                strokeWidth="2.5"
                filter="url(#courier-glow)"
              />
              
              {/* Directional Heading Arrow */}
              <g transform={`rotate(${courier.headingDeg})`}>
                <polygon points="0,-5 4,4 0,2 -4,4" fill={isMe ? "#000000" : (isDark ? "#000000" : "#ffffff")} />
              </g>

              {/* Floating Callsign Label */}
              <g transform="translate(0, -18)" className="pointer-events-none select-none">
                <rect
                  x="-42"
                  y="-11"
                  width="84"
                  height="16"
                  rx="8"
                  fill={isDark ? "#000000" : "#ffffff"}
                  stroke={isMe ? "#10b981" : (isDark ? "#ffffff" : "#09090b")}
                  strokeWidth="1.5"
                  opacity="0.95"
                />
                <text
                  x="0"
                  y="0.5"
                  textAnchor="middle"
                  fill={isMe ? "#10b981" : (isDark ? "#ffffff" : "#09090b")}
                  fontSize="8"
                  fontWeight="800"
                  className="font-mono tracking-tight"
                >
                  {isMe ? "YOU · " : ""}{courier.speedKmh} km/h
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Floating On-Map Speed / Terrain Legend */}
      {!selectedCourier && (
        <div className={`absolute bottom-3 right-3 z-10 pointer-events-none hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl border backdrop-blur-md text-[10px] font-mono shadow-md ${
          isDark ? 'bg-black/75 border-white/10 text-neutral-300' : 'bg-white/85 border-black/10 text-neutral-700'
        }`}>
          {mapView === 'traffic' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Choke (&lt;15 km/h)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <span>Slow (15-25)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-zinc-500' : 'bg-slate-400'} shrink-0`}></span>
                <span>Normal Flow</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2 rounded-sm bg-emerald-500/30 border border-emerald-500 shrink-0"></span>
                <span>Green Reserves</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2 rounded-sm bg-sky-500/30 border border-sky-500 shrink-0"></span>
                <span>1,220m Basin</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-[9px]">▲</span>
                <span>1,280m Plateau</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Selected Courier Telemetry Popover */}
      {selectedCourier && liveTrackingEnabled && (
        <div className={`popover-card absolute bottom-3 inset-x-3 sm:bottom-auto sm:top-16 sm:inset-x-auto sm:right-4 z-30 p-4 rounded-2xl backdrop-blur-xl border text-xs shadow-2xl max-w-sm sm:max-w-xs mx-auto animate-in fade-in duration-150 space-y-3 ${
          isDark ? 'bg-black/95 border-emerald-500/30 text-white' : 'bg-white/95 border-emerald-500/40 text-black'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm">
                    {selectedCourier.driver}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-500 font-mono text-[9px] font-bold">
                    YOU
                  </span>
                </div>
                <div className={`text-[10px] font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {selectedCourier.callsign} · {selectedCourier.type}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedCourier(null)}
              className="p-1 text-xs opacity-60 hover:opacity-100 min-w-[28px] min-h-[28px] flex items-center justify-center"
              aria-label="Close courier details"
            >
              ✕
            </button>
          </div>

          <div className={`grid grid-cols-2 gap-2 pt-2 border-t font-mono text-[11px] ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <div>
              <span className="text-[10px] block text-neutral-400">SPEED</span>
              <span className="font-bold text-emerald-500">{selectedCourier.speedKmh} km/h</span>
            </div>
            <div>
              <span className="text-[10px] block text-neutral-400">STATUS</span>
              <span className="font-bold text-emerald-500">{selectedCourier.status}</span>
            </div>
            {selectedCourier.currentRoadName && (
              <div className={`col-span-2 pt-1 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <span className="text-[10px] block text-neutral-400">CURRENT CORRIDOR</span>
                <span className="truncate block font-medium">{selectedCourier.currentRoadName}</span>
              </div>
            )}
            <div className={`col-span-2 pt-1 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              <span className="text-[10px] block text-neutral-400">NEXT TARGET STOP</span>
              <span className="truncate block opacity-90">{selectedCourier.destinationName}</span>
            </div>
          </div>

          {/* Quick Courier Action Buttons inside popover */}
          <div className={`pt-2 border-t flex flex-wrap gap-1.5 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            {onToggleCourierDriving && (
              <button
                onClick={onToggleCourierDriving}
                className="flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold glass-button-secondary flex items-center justify-center gap-1"
              >
                {selectedCourier.speedKmh > 0 ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Drive</span>
                  </>
                )}
              </button>
            )}

            {onAdvanceCourierStop && (
              <button
                onClick={onAdvanceCourierStop}
                className="py-1.5 px-2.5 rounded-lg text-[11px] font-medium glass-button-secondary flex items-center gap-1"
                title="Advance to Next Waypoint"
              >
                <FastForward className="w-3 h-3" />
                <span>Next Stop</span>
              </button>
            )}

            {onCompleteDelivery && (
              <button
                onClick={onCompleteDelivery}
                className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-emerald-500 hover:bg-emerald-600 text-black flex items-center justify-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-3 h-3 text-black" />
                <span>Deliver Here</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Node Action Card */}
      {selectedNode && (
        <div className={`popover-card absolute bottom-3 inset-x-3 sm:inset-x-auto sm:left-4 sm:right-auto sm:max-w-md z-30 p-4 rounded-2xl backdrop-blur-xl border text-xs shadow-2xl animate-in fade-in duration-150 ${
          isDark ? 'bg-black/95 border-white/20 text-white' : 'bg-white/95 border-black/15 text-black'
        }`}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className={`text-[10px] font-mono uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {selectedNode.zone} District
              </div>
              <h4 className="font-bold text-sm">
                {selectedNode.name}
              </h4>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center opacity-60 hover:opacity-100"
              aria-label="Close landmark details"
            >
              ✕
            </button>
          </div>

          <div className={`flex flex-wrap items-center gap-2 pt-2 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            {/* Toggle destination */}
            {destinationNodeIds.includes(selectedNode.id) ? (
              <button
                onClick={() => {
                  onToggleDestination(selectedNode.id);
                  setSelectedNode(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[40px] ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-rose-300 border border-white/10' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Stop</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onToggleDestination(selectedNode.id);
                  setSelectedNode(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl glass-button-primary font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Destination</span>
              </button>
            )}

            {/* Set as Start */}
            {startNodeId !== selectedNode.id && (
              <button
                onClick={() => {
                  onSetStartNode(selectedNode.id);
                  setSelectedNode(null);
                }}
                className={`py-2.5 px-3 rounded-xl font-medium transition-colors min-h-[40px] border ${
                  isDark ? 'bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white border-white/10' : 'bg-black/[0.04] hover:bg-black/[0.08] text-neutral-700 hover:text-black border-black/10'
                }`}
              >
                Set as Start
              </button>
            )}

            {/* Move My Courier Here */}
            {onMoveCourierToNode && (
              <button
                onClick={() => {
                  onMoveCourierToNode(selectedNode.id);
                  setSelectedNode(null);
                }}
                className={`py-2.5 px-3 rounded-xl font-semibold transition-colors min-h-[40px] border flex items-center justify-center gap-1.5 ${
                  isDark ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
                title="Reposition My Courier to this landmark"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-500 fill-current" />
                <span>Move Me Here</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
