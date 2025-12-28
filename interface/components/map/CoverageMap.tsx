"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Request {
  id: number;
  requestId: number;
  title: string;
  locationLat: number;
  locationLng: number;
  budget: string;
  status: string;
  consumerAddress: string;
}

interface Provider {
  address: string;
  rating: number;
  lat: number;
  lng: number;
  radius?: number; // Optional per-provider radius in meters
  ratingCount?: number; // Optional rating count
}

interface ProviderProfile {
  droneModel?: string | null;
  specialization?: string | null;
  offersGroundImaging?: boolean;
  averageRating?: number;
  ratingCount?: number;
}

interface CoverageMapProps {
  center?: [number, number];
  zoom?: number;
  requests?: Request[];
  providers?: Provider[];
  onRequestClick?: (request: Request) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: [number, number] | null;
  coverageRadius?: number; // in meters
}

/**
 * Calculate appropriate zoom level based on radius in meters
 * Larger radius = lower zoom level (more zoomed out)
 * Formula based on Leaflet's scale: meters per pixel = 156543.03392 * cos(lat) / 2^zoom
 */
function calculateZoomFromRadius(radius: number, latitude: number = 40.7128): number {
  // We want to show approximately 2.5x the radius (diameter of 5x radius) to give padding
  const targetDiameter = radius * 5; // Show 5x radius total (2.5x on each side)
  
  // Convert to approximate degrees at this latitude
  // At equator: 1 degree ≈ 111,320 meters
  // Adjust for latitude: meters per degree = 111,320 * cos(latitude)
  const metersPerDegree = 111320 * Math.cos((latitude * Math.PI) / 180);
  const diameterInDegrees = targetDiameter / metersPerDegree;
  
  // Leaflet zoom calculation
  // At zoom level z, the world is divided into 2^z tiles
  // Each tile is 256x256 pixels
  // World width in degrees = 360
  // Pixels per degree at zoom z = (256 * 2^z) / 360
  // For a typical viewport of ~800px width, we want:
  // 800 pixels = diameterInDegrees * pixelsPerDegree
  // Solving for zoom: zoom = log2((800 * 360) / (256 * diameterInDegrees))
  const viewportWidthPixels = 800; // Approximate viewport width
  const zoom = Math.log2((viewportWidthPixels * 360) / (256 * diameterInDegrees));
  
  // Clamp between reasonable bounds (zoom 6 to 18)
  // Lower bound prevents too much zoom out, upper bound prevents too much zoom in
  return Math.max(6, Math.min(18, Math.round(zoom)));
}

function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);

  return null;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!onLocationSelect) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onLocationSelect]);

  return null;
}

// Component to handle provider tooltip with profile fetching
function ProviderCircleWithTooltip({ 
  provider, 
  coverageRadius 
}: { 
  provider: Provider; 
  coverageRadius: number;
}) {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = async () => {
    if (profile || isLoading) return; // Already fetched or fetching
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/provider-profiles?providerAddress=${provider.address}`);
      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Error fetching provider profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tooltipContent = () => {
    if (isLoading) {
      return <div className="text-sm p-1">Loading provider info...</div>;
    }

    const displayRating = profile?.averageRating ?? provider.rating;
    const ratingCount = profile?.ratingCount ?? provider.ratingCount ?? 0;

    return (
      <div className="min-w-[220px] max-w-[280px] p-2">
        <div className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">Provider</div>
        {profile?.droneModel && (
          <div className="text-xs text-gray-700 dark:text-gray-300 mb-1.5">
            <span className="font-medium">Drone:</span> {profile.droneModel}
          </div>
        )}
        {profile?.specialization && (
          <div className="text-xs text-gray-700 dark:text-gray-300 mb-1.5">
            <span className="font-medium">Specializes in:</span> {profile.specialization}
          </div>
        )}
        <div className="text-xs text-gray-700 dark:text-gray-300 mb-1.5">
          <span className="font-medium">Rating:</span> {displayRating.toFixed(1)}/5.0
          {ratingCount > 0 && <span className="text-gray-500 dark:text-gray-400"> ({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})</span>}
        </div>
        {profile?.offersGroundImaging && (
          <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5 mb-1">
            ✓ Offers ground imaging
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-2 pt-1.5 border-t border-gray-300 dark:border-gray-600">
          {provider.address.slice(0, 8)}...{provider.address.slice(-6)}
        </div>
      </div>
    );
  };

  return (
    <>
      <Circle
        center={[provider.lat, provider.lng]}
        radius={provider.radius || coverageRadius}
        pathOptions={{
          color: "green",
          fillColor: "green",
          fillOpacity: 0.15,
          weight: 2,
        }}
        eventHandlers={{
          mouseover: (e) => {
            fetchProfile();
            // Highlight the circle on hover
            const circle = e.target;
            circle.setStyle({
              fillOpacity: 0.25,
              weight: 3,
            });
          },
          mouseout: (e) => {
            // Reset circle style on mouse out
            const circle = e.target;
            circle.setStyle({
              fillOpacity: 0.15,
              weight: 2,
            });
          },
        }}
      >
        <Tooltip 
          permanent={false}
          interactive={true}
          className="custom-tooltip"
          direction="top"
          offset={[0, -10]}
        >
          {tooltipContent()}
        </Tooltip>
      </Circle>
      <Marker
        position={[provider.lat, provider.lng]}
        icon={icon}
      >
        <Popup>
          <div>
            <h3 className="font-semibold">Provider</h3>
            {profile?.droneModel && (
              <p className="text-sm text-gray-600">Drone: {profile.droneModel}</p>
            )}
            {profile?.specialization && (
              <p className="text-sm text-gray-600">Specializes in: {profile.specialization}</p>
            )}
            <p className="text-sm text-gray-600">
              Rating: {(profile?.averageRating ?? provider.rating).toFixed(1)}/5.0
            </p>
            {profile?.offersGroundImaging && (
              <p className="text-xs text-indigo-600">✓ Offers ground imaging</p>
            )}
            <p className="text-xs text-gray-500 font-mono mt-1">
              {provider.address.slice(0, 10)}...
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

export default function CoverageMap({
  center = [40.7128, -74.0060], // Default to NYC
  zoom,
  requests = [],
  providers = [],
  onRequestClick,
  onLocationSelect,
  selectedLocation,
  coverageRadius = 5000, // 5km default
}: CoverageMapProps) {
  // Calculate zoom based on the largest radius if zoom is not explicitly provided
  const calculatedZoom = React.useMemo(() => {
    if (zoom !== undefined) {
      return zoom;
    }
    
    // Find the largest radius from selectedLocation, providers, or default coverageRadius
    let maxRadius = coverageRadius || 5000; // Default to 5km if not provided
    
    if (selectedLocation && coverageRadius) {
      maxRadius = Math.max(maxRadius, coverageRadius);
    }
    
    if (providers.length > 0) {
      const maxProviderRadius = Math.max(
        ...providers.map((p) => p.radius || coverageRadius || 5000)
      );
      maxRadius = Math.max(maxRadius, maxProviderRadius);
    }
    
    // Use the center latitude for zoom calculation
    const lat = selectedLocation?.[0] || center[0];
    return calculateZoomFromRadius(maxRadius, lat);
  }, [zoom, coverageRadius, selectedLocation, providers, center]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
      <MapContainer
        center={center}
        zoom={calculatedZoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={calculatedZoom} />
        <MapClickHandler onLocationSelect={onLocationSelect} />

        {/* Selected location marker and coverage circle */}
        {selectedLocation && (
          <>
            <Marker position={selectedLocation} icon={icon}>
              <Popup>Selected Location</Popup>
            </Marker>
            <Circle
              center={selectedLocation}
              radius={coverageRadius}
              pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.1 }}
            />
          </>
        )}

        {/* Request markers with coverage circles */}
        {requests.flatMap((request) => [
          <Circle
            key={`request-circle-${request.id}`}
            center={[request.locationLat, request.locationLng]}
            radius={coverageRadius}
            pathOptions={{
              color: "orange",
              fillColor: "orange",
              fillOpacity: 0.15,
              weight: 2,
            }}
          />,
          <Marker
            key={`request-marker-${request.id}`}
            position={[request.locationLat, request.locationLng]}
            icon={icon}
            eventHandlers={{
              click: () => onRequestClick?.(request),
            }}
          >
            <Popup>
              <div>
                <h3 className="font-semibold">{request.title}</h3>
                <p className="text-sm text-gray-600">Budget: {request.budget} wei</p>
                <p className="text-sm text-gray-600">Status: {request.status}</p>
                {onRequestClick && (
                  <button
                    className="mt-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    onClick={() => onRequestClick(request)}
                  >
                    View Details
                  </button>
                )}
              </div>
            </Popup>
          </Marker>,
        ])}

        {/* Provider markers with coverage circles and tooltips */}
        {providers.map((provider, index) => (
          <ProviderCircleWithTooltip
            key={`provider-${provider.address || index}`}
            provider={provider}
            coverageRadius={coverageRadius}
          />
        ))}
      </MapContainer>
    </div>
  );
}

