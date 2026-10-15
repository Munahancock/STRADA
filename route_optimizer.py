from importlib import import_module

try:
    ox = import_module("osmnx")
except ImportError as exc:
    raise ImportError(
        "The 'osmnx' package is required. Install it with: pip install osmnx"
    ) from exc
import random

def build_lusaka_traffic_graph():
    print(" [1/4] Fetching Lusaka drive network from OpenStreetMap...")
    # Pull Lusaka road network (driveable roads only)
    G = ox.graph_from_place("Lusaka, Zambia", network_type="drive")
    
    # Project to meter-based CRS for accurate distance & spatial math
    G = ox.project_graph(G)
    print(f"Downloaded graph with {len(G.nodes)} nodes and {len(G.edges)} road segments.")

    print(" [2/4] Setting speed limits & calculating base travel times...")
    # Default speeds (km/h) for Lusaka road types if OSM tags are missing
    default_speeds = {
        'trunk': 80,          # High-speed connectors
        'primary': 60,        # Great East Rd, Kafue Rd, Lumumba Rd
        'secondary': 50,      # Addis Ababa Dr, Great North Rd urban segments
        'tertiary': 40,       # Feeder roads in areas like Northmead/Kalingalinga
        'residential': 30,    # Neighborhood roads
    }
    
    # Fill missing maxspeed values and calculate free-flow travel time (in seconds)
    G = ox.routing.add_edge_speeds(G, hwy_speeds=default_speeds)
    G = ox.routing.add_edge_travel_times(G)
 
    print(" [3/4] Generating hourly traffic congestion matrix (00:00 - 23:00)...")
    
    # Hourly congestion multipliers (1.0 = free flow, 2.5 = 150% slower due to traffic)
    # Peak hours modeled around Lusaka CBD commute times:
    # 07:00-09:00 (Morning Rush) & 16:30-18:30 (Evening Rush)
    hourly_congestion_profile = {
        0: 1.0,  1: 1.0,  2: 1.0,  3: 1.0,  4: 1.0,  5: 1.1,
        6: 1.3,  7: 2.2,  8: 2.5,  9: 1.8, 10: 1.4, 11: 1.3,
        12: 1.5, 13: 1.4, 14: 1.4, 15: 1.6, 16: 2.1, 17: 2.6,
        18: 2.3, 19: 1.6, 20: 1.2, 21: 1.1, 22: 1.0, 23: 1.0
    }

    # Inject dynamic speed variations per edge based on highway type
    for u, v, k, data in G.edges(keys=True, data=True):
        hwy = data.get('highway', 'unclassified')
        if isinstance(hwy, list):
            hwy = hwy[0]

        # Primary arteries (Great East, Kafue, Lumumba) suffer higher congestion penalties
        corridor_factor = 1.3 if hwy in ['primary', 'trunk'] else 1.0
        
        # Attach hourly time-series speeds array to every edge
        base_travel_time = data['travel_time']
        hourly_travel_times = []
        
        for hour in range(24):
            mult = hourly_congestion_profile[hour] * corridor_factor
            # Add small random noise to mimic real-world jitter
            noise = random.uniform(0.95, 1.05)
            dynamic_time = round(base_travel_time * mult * noise, 2)
            hourly_travel_times.append(dynamic_time)
            
        data['hourly_travel_times'] = hourly_travel_times

    print(" [4/4] Saving processed graph to file...")
    # Save as GraphML format for Phase 2 GNN model training
    ox.save_graphml(G, "lusaka_traffic_network.graphml")
    print(" Phase 1 Complete! 'lusaka_traffic_network.graphml' is ready.")

if __name__ == "__main__":
    build_lusaka_traffic_graph()