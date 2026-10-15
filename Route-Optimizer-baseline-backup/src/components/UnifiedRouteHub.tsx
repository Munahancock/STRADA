import React, { useState, useEffect } from 'react';
import { LusakaMap, LiveCourierTrack } from './LusakaMap';
import { RoadNode } from '../types';
import { LUSAKA_NODES, LUSAKA_EDGES, calculateRoute } from '../data/lusakaNetwork';
import {
  Search,
  Plus,
  Trash2,
  Navigation,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Fuel,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Radio,
  Truck,
  Activity,
  ListFilter,
  Maximize2,
  Crosshair,
  Bike,
  User,
  FastForward,
  Edit2,
  Check
} from 'lucide-react';

interface UnifiedRouteHubProps {
  isNavigating: boolean;
  setIsNavigating: (navigating: boolean) => void;
  startNodeId: string;
  setStartNodeId: (id: string) => void;
  destinationNodeIds: string[];
  setDestinationNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
  theme: 'dark' | 'light';
  mapView: 'traffic' | 'terrain';
  setMapView: (view: 'traffic' | 'terrain') => void;
}

export const UnifiedRouteHub: React.FC<UnifiedRouteHubProps> = ({
  isNavigating,
  setIsNavigating,
  startNodeId,
  setStartNodeId,
  destinationNodeIds,
  setDestinationNodeIds,
  theme,
  mapView,
  setMapView
}) => {
  const isDark = theme === 'dark';
  // Mobile responsive view mode: 'map' (default on mobile) or 'stops'
  const [mobileActiveTab, setMobileActiveTab] = useState<'map' | 'stops'>('map');

  // Planner states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [useAiAvoidance, setUseAiAvoidance] = useState<boolean>(true);
  
  // Mock Live Fleet Tracking Toggle
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState<boolean>(true);
  
  // Navigation simulation states
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentNodeIndex, setCurrentNodeIndex] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(44);
  const [showBottleneckAlert, setShowBottleneckAlert] = useState<boolean>(false);
  const [hasRerouted, setHasRerouted] = useState<boolean>(false);
  const [bypassActive, setBypassActive] = useState<boolean>(false);

  // Dynamic Route calculation
  const routeStats = calculateRoute(startNodeId, destinationNodeIds, useAiAvoidance);
  const activeRouteNodes = routeStats.pathNodes;

  // Active waypoint logic during navigation
  const currentTargetId = activeRouteNodes[Math.min(currentNodeIndex, activeRouteNodes.length - 1)] || startNodeId;
  const currentTargetNode = LUSAKA_NODES.find(n => n.id === currentTargetId) || LUSAKA_NODES[0];
  const nextTargetId = activeRouteNodes[Math.min(currentNodeIndex + 1, activeRouteNodes.length - 1)] || currentTargetId;
  const nextTargetNode = LUSAKA_NODES.find(n => n.id === nextTargetId) || currentTargetNode;

  // Functional Personal Courier State (Hancock Muna)
  const [driverName, setDriverName] = useState<string>('Hancock Muna');
  const [isEditingDriverName, setIsEditingDriverName] = useState<boolean>(false);
  const [courierCallsign, setCourierCallsign] = useState<string>('HANCOCK-01');
  const [vehicleType, setVehicleType] = useState<'Motorcycle Express' | 'Urban Delivery Van' | 'Cargo Light Truck'>('Motorcycle Express');
  
  // Real Movement State along activeRouteNodes
  const [courierRouteIndex, setCourierRouteIndex] = useState<number>(0);
  const [courierEdgeProgress, setCourierEdgeProgress] = useState<number>(0);
  const [isCourierDriving, setIsCourierDriving] = useState<boolean>(true);
  const [courierSpeedKmh, setCourierSpeedKmh] = useState<number>(45);
  const [completedStopIds, setCompletedStopIds] = useState<string[]>([]);
  const [courierBatteryFuel, setCourierBatteryFuel] = useState<number>(94);
  const [courierTotalKm, setCourierTotalKm] = useState<number>(3.8);
  const [centerTrigger, setCenterTrigger] = useState<number>(0);
  const [lastDeliveredNotice, setLastDeliveredNotice] = useState<string | null>(null);

  // Position calculation along activeRouteNodes
  const safeRouteIndex = Math.min(courierRouteIndex, Math.max(0, activeRouteNodes.length - 1));
  const currentCourierNodeId = activeRouteNodes[safeRouteIndex] || startNodeId;
  const nextCourierNodeId = activeRouteNodes[Math.min(safeRouteIndex + 1, activeRouteNodes.length - 1)] || currentCourierNodeId;

  const nodeA = LUSAKA_NODES.find(n => n.id === currentCourierNodeId) || LUSAKA_NODES[0];
  const nodeB = LUSAKA_NODES.find(n => n.id === nextCourierNodeId) || nodeA;

  const hasNextCourierNode = safeRouteIndex < activeRouteNodes.length - 1;

  let courierX = nodeA.x;
  let courierY = nodeA.y;
  let courierHeading = 45;

  if (hasNextCourierNode) {
    courierX = nodeA.x + (nodeB.x - nodeA.x) * courierEdgeProgress;
    courierY = nodeA.y + (nodeB.y - nodeA.y) * courierEdgeProgress;
    courierHeading = Math.atan2(nodeB.y - nodeA.y, nodeB.x - nodeA.x) * (180 / Math.PI) + 90;
  }

  // Active road corridor name
  const activeRoadEdge = LUSAKA_EDGES.find(e => 
    (e.from === nodeA.id && e.to === nodeB.id) || (e.from === nodeB.id && e.to === nodeA.id)
  );
  const currentRoadName = activeRoadEdge ? activeRoadEdge.name : `${nodeA.name} to ${nodeB.name}`;

  // Next target delivery stop
  const upcomingStopId = activeRouteNodes.slice(safeRouteIndex + 1).find(id => destinationNodeIds.includes(id));
  const upcomingStopNode = upcomingStopId ? LUSAKA_NODES.find(n => n.id === upcomingStopId) : null;

  // Active Courier Movement Loop
  useEffect(() => {
    if (!liveTrackingEnabled || !isCourierDriving) return;

    const interval = setInterval(() => {
      setCourierEdgeProgress(prevProgress => {
        if (!hasNextCourierNode) {
          setIsCourierDriving(false);
          return 0;
        }
        // Vehicle speed modifier (motorcycle is nimble, truck is heavier)
        const vehicleFactor = vehicleType === 'Motorcycle Express' ? 1.15 : vehicleType === 'Cargo Light Truck' ? 0.85 : 1.0;
        const step = (courierSpeedKmh / 45) * 0.08 * vehicleFactor;
        const nextProgress = prevProgress + step;

        if (nextProgress >= 1) {
          setCourierRouteIndex(prevIdx => {
            const nextIdx = prevIdx + 1;
            const reachedId = activeRouteNodes[nextIdx];
            if (destinationNodeIds.includes(reachedId)) {
              setCompletedStopIds(prev => prev.includes(reachedId) ? prev : [...prev, reachedId]);
              const nodeName = LUSAKA_NODES.find(n => n.id === reachedId)?.name || 'Destination Stop';
              setLastDeliveredNotice(`Reached Stop: ${nodeName}`);
              setTimeout(() => setLastDeliveredNotice(null), 4000);
            }
            if (nextIdx >= activeRouteNodes.length - 1) {
              setIsCourierDriving(false);
              return activeRouteNodes.length - 1;
            }
            return nextIdx;
          });
          setCourierBatteryFuel(prev => Math.max(10, +(prev - 0.25).toFixed(1)));
          setCourierTotalKm(prev => +(prev + 0.9).toFixed(1));
          return 0;
        }
        return nextProgress;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [liveTrackingEnabled, isCourierDriving, hasNextCourierNode, courierSpeedKmh, vehicleType, activeRouteNodes, destinationNodeIds]);

  // Courier Actions
  const handleToggleCourierDriving = () => {
    if (safeRouteIndex >= activeRouteNodes.length - 1) {
      setCourierRouteIndex(0);
      setCourierEdgeProgress(0);
      setIsCourierDriving(true);
      return;
    }
    setIsCourierDriving(prev => !prev);
  };

  const handleAdvanceCourierStop = () => {
    if (safeRouteIndex < activeRouteNodes.length - 1) {
      const nextIdx = safeRouteIndex + 1;
      setCourierRouteIndex(nextIdx);
      setCourierEdgeProgress(0);
      const reachedId = activeRouteNodes[nextIdx];
      if (destinationNodeIds.includes(reachedId)) {
        setCompletedStopIds(prev => prev.includes(reachedId) ? prev : [...prev, reachedId]);
      }
    }
  };

  const handleCompleteCurrentDelivery = () => {
    const target = upcomingStopId || currentCourierNodeId;
    if (target && !completedStopIds.includes(target)) {
      setCompletedStopIds(prev => [...prev, target]);
      const nodeName = LUSAKA_NODES.find(n => n.id === target)?.name || 'Stop';
      setLastDeliveredNotice(`Delivered: ${nodeName}`);
      setTimeout(() => setLastDeliveredNotice(null), 4000);
      handleAdvanceCourierStop();
    }
  };

  const handleMoveCourierToNode = (nodeId: string) => {
    const idx = activeRouteNodes.indexOf(nodeId);
    if (idx !== -1) {
      setCourierRouteIndex(idx);
      setCourierEdgeProgress(0);
    } else {
      setStartNodeId(nodeId);
      setCourierRouteIndex(0);
      setCourierEdgeProgress(0);
    }
    setCenterTrigger(prev => prev + 1);
  };

  const handleCenterOnMe = () => {
    setCenterTrigger(prev => prev + 1);
  };

  // Build the single functional Courier object representing Hancock Muna
  const myCourier: LiveCourierTrack = {
    id: 'courier-hancock',
    callsign: courierCallsign,
    type: vehicleType,
    driver: driverName,
    x: courierX,
    y: courierY,
    speedKmh: isCourierDriving ? courierSpeedKmh : 0,
    headingDeg: courierHeading,
    status: !isCourierDriving
      ? 'STANDBY'
      : safeRouteIndex >= activeRouteNodes.length - 1
      ? 'DELIVERED'
      : courierSpeedKmh < 20
      ? 'TRAFFIC CRAWL'
      : 'EN-ROUTE',
    destinationName: upcomingStopNode ? upcomingStopNode.name : (safeRouteIndex >= activeRouteNodes.length - 1 ? 'Trip Completed' : 'Next Node'),
    currentRoadName: currentRoadName,
    isUserCourier: true,
    batteryFuelPct: courierBatteryFuel,
    deliveriesCompleted: completedStopIds.length,
    totalDeliveries: destinationNodeIds.length
  };

  const liveCouriers: LiveCourierTrack[] = [myCourier];

  // Navigation simulation ticker
  useEffect(() => {
    if (!isNavigating || !isPlaying) return;
    const interval = setInterval(() => {
      setCurrentNodeIndex(prev => {
        const next = prev + 1;
        if (next >= activeRouteNodes.length) {
          setIsPlaying(false);
          return prev;
        }
        if (next === 2 && !hasRerouted && !bypassActive) {
          setShowBottleneckAlert(true);
        }
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isNavigating, isPlaying, activeRouteNodes.length, hasRerouted, bypassActive]);

  // Destination actions
  const handleToggleDestination = (nodeId: string) => {
    if (isNavigating) return;
    if (nodeId === startNodeId) return;
    setDestinationNodeIds(prev => {
      if (prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId);
      } else {
        return [...prev, nodeId];
      }
    });
  };

  const handleAddDestination = (nodeId: string) => {
    if (!destinationNodeIds.includes(nodeId) && nodeId !== startNodeId) {
      setDestinationNodeIds(prev => [...prev, nodeId]);
    }
  };

  const handleRemoveDestination = (nodeId: string) => {
    setDestinationNodeIds(prev => prev.filter(id => id !== nodeId));
  };

  const handleClearDestinations = () => {
    setDestinationNodeIds([]);
  };

  const applyPreset = (stops: string[]) => {
    if (isNavigating) return;
    setDestinationNodeIds(stops);
  };

  // Navigation controls
  const handleStartNavigation = () => {
    setIsNavigating(true);
    setIsPlaying(true);
    setCurrentNodeIndex(0);
    setSpeed(44);
    setShowBottleneckAlert(false);
    setHasRerouted(false);
    setMobileActiveTab('map'); // Always show map on mobile when starting navigation
  };

  const handleEndNavigation = () => {
    setIsNavigating(false);
    setIsPlaying(false);
    setShowBottleneckAlert(false);
  };

  const handleConfirmReroute = () => {
    setHasRerouted(true);
    setBypassActive(true);
    setShowBottleneckAlert(false);
    setSpeed(48);
  };

  const handleDismissReroute = () => {
    setShowBottleneckAlert(false);
    setSpeed(14);
  };

  // Filter destinations for search
  const searchResults = LUSAKA_NODES.filter(node => {
    if (node.id === startNodeId) return false;
    if (destinationNodeIds.includes(node.id)) return false;
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return node.name.toLowerCase().includes(q) || node.zone.toLowerCase().includes(q);
  });

  const selectedNodes = destinationNodeIds
    .map(id => LUSAKA_NODES.find(n => n.id === id))
    .filter((n): n is RoadNode => !!n);

  const startNode = LUSAKA_NODES.find(n => n.id === startNodeId) || LUSAKA_NODES[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Bar with Live Tracking Toggle & Presets */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 ${isNavigating ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'dark:bg-white bg-neutral-900'}`}></div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold tracking-tight dark:text-white text-neutral-900 flex items-center gap-2 truncate">
              <span className="truncate">{isNavigating ? 'Active En-Route Navigation' : 'Lusaka Courier Route Optimizer'}</span>
              {isNavigating && (
                <span className="text-[10px] sm:text-[11px] font-mono font-normal text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                  Live GPS
                </span>
              )}
            </h1>
            <p className="text-[11px] sm:text-xs dark:text-neutral-400 text-neutral-600 truncate">
              {isNavigating
                ? `En-route to ${destinationNodeIds.length} stops across Lusaka`
                : 'Click map landmarks or search below to plan optimal paths.'}
            </p>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* PERSONAL COURIER TRACKING TOGGLE */}
          <button
            onClick={() => setLiveTrackingEnabled(!liveTrackingEnabled)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 sm:gap-2 border ${
              liveTrackingEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'dark:bg-white/[0.04] bg-black/[0.04] dark:border-white/10 border-black/10 dark:text-neutral-400 text-neutral-600 hover:text-black dark:hover:text-white'
            }`}
            title="Toggle personal live courier tracking for Hancock Muna"
          >
            <Radio className={`w-3.5 h-3.5 shrink-0 ${liveTrackingEnabled ? 'text-emerald-500 dark:text-emerald-400 animate-pulse' : 'text-neutral-400'}`} />
            <span className="hidden min-[380px]:inline">My Courier (Hancock):</span>
            <span className="font-bold">{liveTrackingEnabled ? 'LIVE' : 'OFF'}</span>
          </button>

          {/* Quick Presets (Only visible when planning) */}
          {!isNavigating && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs py-0.5">
              <button
                onClick={() => applyPreset(['arcades', 'unza_gate', 'woodlands_mall'])}
                className="px-2 sm:px-2.5 py-1.5 rounded-lg dark:bg-white/[0.04] bg-black/[0.04] dark:hover:bg-white/10 hover:bg-black/10 dark:text-neutral-300 text-neutral-700 dark:hover:text-white hover:text-black border dark:border-white/10 border-black/10 transition-colors whitespace-nowrap text-[11px] sm:text-xs"
              >
                Commercial
              </button>
              <button
                onClick={() => applyPreset(['matero_ind', 'kabulonga_shop', 'makeni_mall'])}
                className="px-2 sm:px-2.5 py-1.5 rounded-lg dark:bg-white/[0.04] bg-black/[0.04] dark:hover:bg-white/10 hover:bg-black/10 dark:text-neutral-300 text-neutral-700 dark:hover:text-white hover:text-black border dark:border-white/10 border-black/10 transition-colors whitespace-nowrap text-[11px] sm:text-xs"
              >
                Cross-Town
              </button>
              <button
                onClick={() => applyPreset(['munali_jct', 'chelston_hub', 'airport_depot'])}
                className="px-2 sm:px-2.5 py-1.5 rounded-lg dark:bg-white/[0.04] bg-black/[0.04] dark:hover:bg-white/10 hover:bg-black/10 dark:text-neutral-300 text-neutral-700 dark:hover:text-white hover:text-black border dark:border-white/10 border-black/10 transition-colors whitespace-nowrap text-[11px] sm:text-xs hidden min-[540px]:block"
              >
                Airport
              </button>
            </div>
          )}

          {/* Navigation Mode Quick Actions */}
          {isNavigating && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="glass-button-secondary px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Resume'}</span>
              </button>

              <button
                onClick={() => { setCurrentNodeIndex(0); setSpeed(44); }}
                className="glass-button-secondary p-1.5 rounded-xl dark:text-neutral-400 dark:hover:text-white text-neutral-600 hover:text-black"
                title="Restart Route"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleEndNavigation}
                className="glass-button-primary px-3 py-1.5 rounded-xl text-xs font-semibold"
              >
                Exit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE SEGMENTED CONTROL (Visible only on screens < 1024px to toggle between Map & Stops) */}
      {!isNavigating && (
        <div className="lg:hidden flex rounded-xl p-1 dark:bg-white/[0.04] bg-black/[0.04] border dark:border-white/10 border-black/10 text-xs">
          <button
            onClick={() => setMobileActiveTab('map')}
            className={`flex-1 min-h-11 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 ${
              mobileActiveTab === 'map'
                ? 'bg-teal-700 text-white dark:bg-teal-300 dark:text-teal-950 font-semibold shadow-sm'
                : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Interactive Map</span>
          </button>
          <button
            onClick={() => setMobileActiveTab('stops')}
            className={`flex-1 min-h-11 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 ${
              mobileActiveTab === 'stops'
                ? 'bg-teal-700 text-white dark:bg-teal-300 dark:text-teal-950 font-semibold shadow-sm'
                : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Destinations ({destinationNodeIds.length})</span>
          </button>
        </div>
      )}

      {/* Main Unified Grid (Responsive across both desktop & mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* Left Column: Interactive Controls (Desktop: Always Visible, Mobile: Visible when on 'stops' or navigating) */}
        <div className={`lg:col-span-5 space-y-4 sm:space-y-5 order-2 lg:order-1 ${
          !isNavigating && mobileActiveTab === 'map' ? 'hidden lg:block' : 'block'
        }`}>
          
          {/* ============================================================ */}
          {/* MODE A: LIVE NAVIGATION CONTROLS (Active when isNavigating) */}
          {/* ============================================================ */}
          {isNavigating ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Turn-by-Turn Guidance Card */}
              <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl dark:bg-white dark:text-black bg-neutral-900 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <Navigation className="w-4 h-4 sm:w-5 sm:h-5 fill-current rotate-45" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase dark:text-neutral-400 text-neutral-500 block">
                      NEXT GUIDANCE STEP
                    </span>
                    <h3 className="text-sm sm:text-base font-bold dark:text-white text-neutral-900 mt-0.5 truncate">
                      Head toward {nextTargetNode.name}
                    </h3>
                    <div className="text-xs dark:text-neutral-400 text-neutral-600 mt-0.5 truncate">
                      Current: <span className="dark:text-white text-neutral-900 font-medium">{currentTargetNode.name}</span>
                    </div>
                  </div>
                </div>

                {/* Speed & ETA Gauge */}
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-2.5 sm:p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                    <div className="text-[9px] sm:text-[10px] dark:text-neutral-400 text-neutral-500">SPEED</div>
                    <div className="text-lg sm:text-xl font-bold dark:text-white text-neutral-900 mt-0.5">
                      {speed} <span className="text-[10px] font-normal dark:text-neutral-400 text-neutral-500">km/h</span>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                    <div className="text-[9px] sm:text-[10px] dark:text-neutral-400 text-neutral-500">ETA</div>
                    <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {routeStats.durationMinutes} <span className="text-[10px] font-normal dark:text-neutral-400 text-neutral-500">min</span>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                    <div className="text-[9px] sm:text-[10px] dark:text-neutral-400 text-neutral-500">REMAINING</div>
                    <div className="text-lg sm:text-xl font-bold dark:text-white text-neutral-900 mt-0.5">
                      {routeStats.totalDistanceKm} <span className="text-[10px] font-normal dark:text-neutral-400 text-neutral-500">km</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Downstream Bottleneck Alert */}
              {showBottleneckAlert && !hasRerouted && (
                <div className="p-4 sm:p-5 rounded-2xl dark:bg-black/95 bg-neutral-950 border-2 border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.3)] space-y-3.5 backdrop-blur-2xl animate-in zoom-in duration-150 text-white">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                      <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-bold tracking-wider text-rose-400 uppercase block">
                        DOWNSTREAM BOTTLENECK DETECTED (&lt;15 KM/H)
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                        Severe Congestion on Great East Corridor
                      </h4>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Predicted Delay:</span>
                      <span className="text-rose-400 font-bold">+22.0 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Proposed Bypass:</span>
                      <span className="text-white truncate ml-2">Addis Ababa Dr &amp; Longacres</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Net Time Saved:</span>
                      <span className="text-emerald-400 font-bold">-18.5 min</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleConfirmReroute}
                      className="glass-button-primary py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md min-h-[40px]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Bypass</span>
                    </button>
                    <button
                      onClick={handleDismissReroute}
                      className="glass-button-secondary py-2.5 px-3 rounded-xl text-xs font-medium text-neutral-300 min-h-[40px]"
                    >
                      Ignore &amp; Stay
                    </button>
                  </div>
                </div>
              )}

              {/* Reroute Active Confirmation Card */}
              {hasRerouted && (
                <div className="p-3.5 sm:p-4 rounded-xl dark:bg-white/[0.04] bg-black/[0.04] border dark:border-white/20 border-black/15 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-white shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold dark:text-white text-neutral-900">Dynamic Reroute Active</div>
                    <div className="text-[11px] dark:text-neutral-400 text-neutral-600 mt-0.5">
                      Bypassing Great East Road bottleneck. Traffic delay avoided: 22 minutes.
                    </div>
                  </div>
                </div>
              )}

              {/* Remaining Delivery Stops Checklist */}
              <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider dark:text-white text-neutral-900">
                  Trip Waypoints ({destinationNodeIds.length} Stops)
                </span>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {destinationNodeIds.map((id, idx) => {
                    const node = LUSAKA_NODES.find(n => n.id === id);
                    if (!node) return null;
                    const isPassed = currentNodeIndex > idx + 1;

                    return (
                      <div
                        key={id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          isPassed
                            ? 'dark:bg-white/[0.01] bg-black/[0.01] dark:border-white/5 border-black/5 dark:text-neutral-500 text-neutral-400'
                            : 'dark:bg-white/[0.04] bg-black/[0.03] dark:border-white/10 border-black/10 dark:text-white text-neutral-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0 ${
                            isPassed ? 'dark:bg-white/10 bg-black/10 dark:text-neutral-500 text-neutral-400' : 'dark:bg-white dark:text-black bg-neutral-900 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className={`truncate ${isPassed ? 'line-through' : 'font-medium'}`}>
                            {node.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono dark:text-neutral-400 text-neutral-500 shrink-0 ml-2">
                          {isPassed ? 'Completed' : 'Upcoming'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            /* ============================================================ */
            /* MODE B: ROUTE PLANNER CONTROLS (Active when !isNavigating)   */
            /* ============================================================ */
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
              
              {/* Destination Search Box */}
              <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full dark:bg-white bg-neutral-900"></span>
                    <span className="text-xs font-bold uppercase tracking-wider dark:text-white text-neutral-900">
                      Add Destinations
                    </span>
                  </div>
                  <span className="text-[11px] font-mono dark:text-neutral-400 text-neutral-500">
                    {destinationNodeIds.length} Stops Chosen
                  </span>
                </div>

                {/* Autocomplete Input */}
                <div className="relative">
                  <Search className="w-4 h-4 dark:text-neutral-400 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Lusaka landmarks (Arcades, UNZA, Woodlands)..."
                    className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs dark:text-white text-neutral-900 dark:placeholder:text-neutral-500 placeholder:text-neutral-400 min-h-[42px]"
                  />
                </div>

                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && (
                  <div className="p-2 rounded-xl dark:bg-black/95 bg-white/95 border dark:border-white/20 border-black/15 max-h-48 overflow-y-auto space-y-1 shadow-2xl backdrop-blur-xl">
                    {searchResults.map(node => (
                      <button
                        key={node.id}
                        onClick={() => {
                          handleAddDestination(node.id);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-2.5 rounded-lg dark:hover:bg-white/10 hover:bg-black/5 flex items-center justify-between text-xs dark:text-white text-neutral-900 transition-colors min-h-[40px]"
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold">{node.name}</span>
                          <span className="dark:text-neutral-400 text-neutral-500 text-[11px] ml-1.5">({node.zone})</span>
                        </div>
                        <Plus className="w-4 h-4 dark:text-white text-neutral-900 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Stops Itinerary */}
              <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider dark:text-white text-neutral-900">
                    Delivery Stops ({destinationNodeIds.length})
                  </span>
                  {destinationNodeIds.length > 0 && (
                    <button
                      onClick={handleClearDestinations}
                      className="text-[11px] dark:text-neutral-400 text-neutral-500 hover:text-rose-500 font-mono transition-colors p-1"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Origin Pin */}
                <div className="p-2.5 sm:p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <span className="w-5 h-5 rounded-full dark:bg-white dark:text-black bg-neutral-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      S
                    </span>
                    <div className="truncate">
                      <div className="font-semibold dark:text-white text-neutral-900 truncate">{startNode.name}</div>
                      <div className="text-[10px] dark:text-neutral-400 text-neutral-500 font-mono truncate">Origin Hub ({startNode.zone})</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono dark:text-neutral-400 text-neutral-600 uppercase px-2 py-0.5 rounded dark:bg-white/5 bg-black/5 shrink-0">
                    Start
                  </span>
                </div>

                {/* Destinations List */}
                {selectedNodes.length === 0 ? (
                  <div className="p-4 sm:p-5 rounded-xl border border-dashed dark:border-white/10 border-black/10 text-center space-y-1">
                    <MapPin className="w-4 h-4 text-neutral-400 mx-auto" />
                    <div className="text-xs font-medium dark:text-neutral-300 text-neutral-700">No destinations added yet</div>
                    <div className="text-[11px] dark:text-neutral-500 text-neutral-500">
                      Click any pin on the map or search above to add your stops.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 sm:max-h-52 overflow-y-auto pr-1">
                    {selectedNodes.map((node, index) => (
                      <div
                        key={node.id}
                        className="p-2.5 rounded-xl dark:bg-white/[0.04] dark:hover:bg-white/[0.08] bg-black/[0.03] hover:bg-black/[0.06] border dark:border-white/10 border-black/10 transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 mr-2">
                          <span className="w-5 h-5 rounded-full dark:bg-white dark:text-black bg-neutral-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="truncate">
                            <div className="font-semibold dark:text-white text-neutral-900 truncate">{node.name}</div>
                            <div className="text-[10px] dark:text-neutral-400 text-neutral-500 font-mono">{node.zone} District</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveDestination(node.id)}
                          className="p-1.5 dark:text-neutral-400 text-neutral-500 hover:text-rose-500 transition-colors shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                          title="Remove Stop"
                          aria-label={`Remove ${node.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Route Performance & Start Navigation Action */}
              <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider dark:text-white text-neutral-900">
                    Estimated Route
                  </span>

                  {/* AI Avoidance Toggle */}
                  <button
                    onClick={() => setUseAiAvoidance(!useAiAvoidance)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 border ${
                      useAiAvoidance
                        ? (isDark ? 'bg-white text-black font-semibold border-white shadow-sm' : 'bg-neutral-900 text-white font-semibold border-neutral-900 shadow-sm')
                        : 'dark:bg-white/[0.05] bg-black/[0.04] dark:text-neutral-400 text-neutral-600 dark:border-white/10 border-black/10 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <span>AI Bypass:</span>
                    <span className="font-bold">{useAiAvoidance ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Metrics 4-grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 sm:p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                    <div className="dark:text-neutral-400 text-neutral-500 text-[9px] sm:text-[10px]">DISTANCE</div>
                    <div className="text-base sm:text-lg font-bold dark:text-white text-neutral-900 mt-0.5">
                      {routeStats.totalDistanceKm} <span className="text-xs font-normal">km</span>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                    <div className="dark:text-neutral-400 text-neutral-500 text-[9px] sm:text-[10px]">DURATION</div>
                    <div className="text-base sm:text-lg font-bold dark:text-white text-neutral-900 mt-0.5">
                      {routeStats.durationMinutes} <span className="text-xs font-normal">min</span>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                    <div className="dark:text-neutral-400 text-neutral-500 text-[9px] sm:text-[10px]">TIME SAVED</div>
                    <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      -{routeStats.timeSavedMinutes} <span className="text-xs font-normal">min</span>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                    <div className="dark:text-neutral-400 text-neutral-500 text-[9px] sm:text-[10px]">FUEL SAVED</div>
                    <div className="text-base sm:text-lg font-bold dark:text-white text-neutral-900 mt-0.5">
                      {routeStats.fuelSavedLitres} <span className="text-xs font-normal">L</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={handleStartNavigation}
                  disabled={destinationNodeIds.length === 0}
                  className="w-full glass-button-primary py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:pointer-events-none min-h-[44px]"
                >
                  <Navigation className="w-4 h-4 fill-current" />
                  <span>Start Live Navigation</span>
                </button>
              </div>

            </div>
          )}

          {/* Real-time Functional Courier Cockpit (Hancock Muna) */}
          {liveTrackingEnabled && (
            <div className="glass-panel p-4 sm:p-5 rounded-2xl border dark:border-emerald-500/25 border-emerald-600/30 dark:bg-emerald-950/10 bg-emerald-500/5 space-y-3.5 animate-in fade-in duration-150">
              
              {/* Driver Profile Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-bold shadow-md">
                      {vehicleType === 'Motorcycle Express' ? (
                        <Bike className="w-5 h-5 text-black" />
                      ) : (
                        <Truck className="w-5 h-5 text-black" />
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 dark:border-black border-white animate-pulse"></span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isEditingDriverName ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="px-2 py-0.5 rounded text-xs font-bold glass-input text-neutral-900 dark:text-white"
                            autoFocus
                            onBlur={() => setIsEditingDriverName(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingDriverName(false)}
                          />
                          <button
                            onClick={() => setIsEditingDriverName(false)}
                            className="p-1 text-emerald-500 hover:text-emerald-400"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-bold text-sm sm:text-base dark:text-white text-neutral-900 flex items-center gap-1 truncate">
                            <span className="truncate">{driverName}</span>
                            <button
                              onClick={() => setIsEditingDriverName(true)}
                              className="p-1 opacity-50 hover:opacity-100 text-neutral-400"
                              title="Edit Name"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </h3>
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold shrink-0">
                            YOU
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] font-mono dark:text-neutral-400 text-neutral-600 truncate">
                      {courierCallsign} · {vehicleType}
                    </div>
                  </div>
                </div>

                {/* Center on Me Button */}
                <button
                  onClick={handleCenterOnMe}
                  className="px-2.5 py-1.5 rounded-xl border dark:border-emerald-500/30 border-emerald-600/30 dark:bg-emerald-500/10 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                  title="Center Map on My Position"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span className="hidden min-[400px]:inline text-[11px] font-mono">Center Me</span>
                </button>
              </div>

              {/* Vehicle Mode Switcher */}
              <div className="flex rounded-xl p-1 dark:bg-white/[0.04] bg-black/[0.04] border dark:border-white/10 border-black/10 text-xs">
                <button
                  onClick={() => setVehicleType('Motorcycle Express')}
                  className={`flex-1 py-1.5 rounded-lg transition-all font-medium flex items-center justify-center gap-1 ${
                    vehicleType === 'Motorcycle Express'
                      ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                      : 'dark:text-neutral-400 text-neutral-600 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Motorbike</span>
                </button>

                <button
                  onClick={() => setVehicleType('Urban Delivery Van')}
                  className={`flex-1 py-1.5 rounded-lg transition-all font-medium flex items-center justify-center gap-1 ${
                    vehicleType === 'Urban Delivery Van'
                      ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                      : 'dark:text-neutral-400 text-neutral-600 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Urban Van</span>
                </button>

                <button
                  onClick={() => setVehicleType('Cargo Light Truck')}
                  className={`flex-1 py-1.5 rounded-lg transition-all font-medium flex items-center justify-center gap-1 ${
                    vehicleType === 'Cargo Light Truck'
                      ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                      : 'dark:text-neutral-400 text-neutral-600 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Cargo Truck</span>
                </button>
              </div>

              {/* Live Gauges: Speedometer, Completed Stops, Battery */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 sm:p-2.5 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                  <div className="text-[9px] dark:text-neutral-400 text-neutral-500">SPEED</div>
                  <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {isCourierDriving ? courierSpeedKmh : 0} <span className="text-[10px] font-normal">km/h</span>
                  </div>
                </div>

                <div className="p-2 sm:p-2.5 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                  <div className="text-[9px] dark:text-neutral-400 text-neutral-500">DELIVERIES</div>
                  <div className="text-base sm:text-lg font-bold dark:text-white text-neutral-900 mt-0.5">
                    {completedStopIds.length} <span className="text-[10px] font-normal dark:text-neutral-400 text-neutral-500">/ {destinationNodeIds.length}</span>
                  </div>
                </div>

                <div className="p-2 sm:p-2.5 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                  <div className="text-[9px] dark:text-neutral-400 text-neutral-500">FUEL / BATT</div>
                  <div className="text-base sm:text-lg font-bold dark:text-white text-neutral-900 mt-0.5">
                    {courierBatteryFuel}%
                  </div>
                </div>
              </div>

              {/* Corridor & Target Waypoint */}
              <div className="p-2.5 sm:p-3 rounded-xl dark:bg-white/[0.02] bg-black/[0.02] border dark:border-white/10 border-black/10 space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="dark:text-neutral-400 text-neutral-500 shrink-0">Corridor:</span>
                  <span className="dark:text-white text-neutral-900 font-semibold truncate ml-2">{currentRoadName}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="dark:text-neutral-400 text-neutral-500 shrink-0">Target:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate ml-2">
                    {upcomingStopNode ? upcomingStopNode.name : 'All Stops Completed'}
                  </span>
                </div>
              </div>

              {/* Delivery notification banner */}
              {lastDeliveredNotice && (
                <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">{lastDeliveredNotice}</span>
                </div>
              )}

              {/* Throttle & Action Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                  <span className="dark:text-neutral-400 text-neutral-500 text-[10px]">THROTTLE:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCourierSpeedKmh(15)}
                      className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                        courierSpeedKmh === 15 ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-bold' : 'border-transparent dark:text-neutral-400 text-neutral-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      15k
                    </button>
                    <button
                      onClick={() => setCourierSpeedKmh(45)}
                      className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                        courierSpeedKmh === 45 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500 font-bold' : 'border-transparent dark:text-neutral-400 text-neutral-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      45k
                    </button>
                    <button
                      onClick={() => setCourierSpeedKmh(65)}
                      className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                        courierSpeedKmh === 65 ? 'bg-sky-500/20 border-sky-500 text-sky-500 font-bold' : 'border-transparent dark:text-neutral-400 text-neutral-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      65k
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={handleToggleCourierDriving}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                      isCourierDriving
                        ? 'glass-button-secondary text-neutral-800 dark:text-neutral-200'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-black font-bold'
                    }`}
                  >
                    {isCourierDriving ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Cruise</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleAdvanceCourierStop}
                    className="glass-button-secondary py-2 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1 dark:text-neutral-300 text-neutral-700"
                    title="Jump ahead to the next waypoint"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Next Stop</span>
                  </button>

                  <button
                    onClick={handleCompleteCurrentDelivery}
                    disabled={destinationNodeIds.length === 0 || completedStopIds.length >= destinationNodeIds.length}
                    className="py-2 px-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black flex items-center justify-center gap-1 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
                    title="Sign-off delivery at current waypoint"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span>Deliver</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Lusaka Map (Desktop: 7 cols, Mobile: Visible on 'map' tab or during navigation) */}
        <div className={`lg:col-span-7 space-y-3 sm:space-y-4 order-1 lg:order-2 ${
          !isNavigating && mobileActiveTab === 'stops' ? 'hidden lg:block' : 'block'
        }`}>
          
          <LusakaMap
            startNodeId={startNodeId}
            destinationNodeIds={destinationNodeIds}
            activeRouteNodes={activeRouteNodes}
            onToggleDestination={handleToggleDestination}
            onSetStartNode={(id) => {
              if (!isNavigating) setStartNodeId(id);
            }}
            activeVehiclePosition={
              isNavigating
                ? {
                    x: currentTargetNode.x,
                    y: currentTargetNode.y,
                    headingDeg: 45
                  }
                : null
            }
            predictionHorizon="30min"
            liveTrackingEnabled={liveTrackingEnabled}
            liveCouriers={liveCouriers}
            theme={theme}
            mapView={mapView}
            onToggleMapView={setMapView}
            onToggleCourierDriving={handleToggleCourierDriving}
            onAdvanceCourierStop={handleAdvanceCourierStop}
            onCompleteDelivery={handleCompleteCurrentDelivery}
            onMoveCourierToNode={handleMoveCourierToNode}
            centerTrigger={centerTrigger}
          />

          {/* Map Footer Bar with Fleet Sync Telemetry */}
          <div className="glass-panel p-3 sm:p-3.5 rounded-xl flex items-center justify-between text-xs dark:text-neutral-400 text-neutral-600">
            <div className="flex items-center gap-2 truncate mr-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${liveTrackingEnabled ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'dark:bg-white bg-neutral-900'}`}></span>
              <span className="dark:text-white text-neutral-900 font-medium truncate">Courier: {driverName} ({courierCallsign})</span>
              <span className="hidden sm:inline">· {vehicleType}</span>
            </div>
            <div className="font-mono dark:text-neutral-400 text-neutral-500 text-[10px] sm:text-[11px] shrink-0">
              {liveTrackingEnabled ? (
                <span className="text-emerald-600 dark:text-emerald-300">Live GPS Active · {completedStopIds.length}/{destinationNodeIds.length} Delivered</span>
              ) : isNavigating ? (
                <span>Vehicle En-Route</span>
              ) : (
                <span>Click pin to select stop</span>
              )}
            </div>
          </div>

          {/* MOBILE QUICK ACTION STRIP (When on mobile Map tab during planning mode) */}
          {!isNavigating && mobileActiveTab === 'map' && (
            <div className="lg:hidden glass-panel p-3 rounded-2xl flex items-center justify-between gap-3 border dark:border-white/20 border-black/15 shadow-lg">
              <div className="text-xs font-mono">
                <div className="dark:text-white text-neutral-900 font-bold">{routeStats.durationMinutes} min · {routeStats.totalDistanceKm} km</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400">-{routeStats.timeSavedMinutes} min AI saved</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileActiveTab('stops')}
                  className="px-3 py-2 min-h-11 rounded-xl dark:bg-white/[0.08] bg-black/[0.06] dark:text-white text-neutral-900 text-xs font-medium border dark:border-white/10 border-black/10"
                >
                  View Stops ({destinationNodeIds.length})
                </button>
                <button
                  onClick={handleStartNavigation}
                  disabled={destinationNodeIds.length === 0}
                  className="glass-button-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-40"
                >
                  <Navigation className="w-3.5 h-3.5 fill-current" />
                  <span>Start</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
