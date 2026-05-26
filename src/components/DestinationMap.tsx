"use client";

import { useEffect } from "react";
import { APIProvider, Map as GoogleMap, Marker, useMap } from "@vis.gl/react-google-maps";
import { MapPinned } from "lucide-react";
import type { Destination, VisitorAreaId } from "@/lib/discovery/types";

const fallbackCenter = { lat: 10.7769, lng: 106.7009 };

function MapContents({ areaId, destinations }: { areaId: VisitorAreaId; destinations: Destination[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    let features: google.maps.Data.Feature[] = [];
    let cancelled = false;

    fetch("/data/visitor-areas.json")
      .then((response) => response.json())
      .then((geojson: object) => {
        if (cancelled) return;
        features = map.data.addGeoJson(geojson);
        map.data.setStyle((feature) => ({
          fillColor: feature.getProperty("id") === areaId ? "#16d9ff" : "#172641",
          fillOpacity: feature.getProperty("id") === areaId ? 0.2 : 0.04,
          strokeColor: feature.getProperty("id") === areaId ? "#16d9ff" : "#53627d",
          strokeOpacity: feature.getProperty("id") === areaId ? 0.9 : 0.25,
          strokeWeight: feature.getProperty("id") === areaId ? 2 : 1
        }));
        const bounds = new google.maps.LatLngBounds();
        features.forEach((feature) => {
          if (feature.getProperty("id") === areaId) {
            feature.getGeometry()?.forEachLatLng((position) => bounds.extend(position));
          }
        });
        if (!bounds.isEmpty()) map.fitBounds(bounds, 42);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      features.forEach((feature) => map.data.remove(feature));
    };
  }, [areaId, map]);

  useEffect(() => {
    if (!map) return;
    map.data.setStyle((feature) => ({
      fillColor: feature.getProperty("id") === areaId ? "#16d9ff" : "#172641",
      fillOpacity: feature.getProperty("id") === areaId ? 0.2 : 0.04,
      strokeColor: feature.getProperty("id") === areaId ? "#16d9ff" : "#53627d",
      strokeOpacity: feature.getProperty("id") === areaId ? 0.9 : 0.25,
      strokeWeight: feature.getProperty("id") === areaId ? 2 : 1
    }));
    const bounds = new google.maps.LatLngBounds();
    map.data.forEach((feature) => {
      if (feature.getProperty("id") === areaId) {
        feature.getGeometry()?.forEachLatLng((position) => bounds.extend(position));
      }
    });
    destinations.forEach((destination) => bounds.extend({ lat: destination.lat, lng: destination.lng }));
    if (!bounds.isEmpty()) map.fitBounds(bounds, 42);
  }, [areaId, destinations, map]);

  return (
    <>
      {destinations.map((destination, index) => (
        <Marker
          key={destination.placeId}
          position={{ lat: destination.lat, lng: destination.lng }}
          label={{ text: String(index + 1), color: "#071024", fontWeight: "700" }}
          title={destination.name}
          onClick={() => window.open(destination.googleMapsUri, "_blank", "noopener,noreferrer")}
        />
      ))}
    </>
  );
}

export function DestinationMap({ areaId, destinations }: { areaId: VisitorAreaId; destinations: Destination[] }) {
  const browserKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  if (!browserKey) {
    return (
      <div className="flex h-full min-h-[450px] flex-col items-center justify-center gap-3 bg-[#0a1326] px-8 text-center">
        <MapPinned className="h-10 w-10 text-cyanPulse" />
        <p className="text-sm font-semibold text-white">Interactive Google Map awaiting browser key</p>
        <p className="max-w-sm text-xs leading-5 text-slate-400">
          Add the referrer-restricted Maps JavaScript key to display live visitor-area boundaries and destination pins.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={browserKey} language="en" region="VN">
      <GoogleMap
        defaultCenter={fallbackCenter}
        defaultZoom={13}
        mapId={mapId}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        streetViewControl
        mapTypeControl={false}
        className="h-full min-h-[450px] w-full"
      >
        <MapContents areaId={areaId} destinations={destinations} />
      </GoogleMap>
    </APIProvider>
  );
}
