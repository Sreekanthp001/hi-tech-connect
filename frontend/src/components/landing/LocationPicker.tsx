import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Fix for default Leaflet icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
    onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
    initialAddress?: string;
}

const NELLORE_COORDS: [number, number] = [14.4426, 79.9865];

// Map component to handle click events
const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// Auto-center map when position changes
const MapController = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (map) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ onLocationSelect, initialAddress }: LocationPickerProps) => {
    const [position, setPosition] = useState<[number, number]>(NELLORE_COORDS);
    const [address, setAddress] = useState(initialAddress || "");
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        setIsReverseGeocoding(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'Hi-Tech-Connect-App'
                    }
                }
            );
            const data = await response.json();
            if (data && data.display_name) {
                setAddress(data.display_name);
                onLocationSelect({ lat, lng, address: data.display_name });
            } else {
                onLocationSelect({ lat, lng, address: address || "Unknown Location" });
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            onLocationSelect({ lat, lng, address: address || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}` });
        } finally {
            setIsReverseGeocoding(false);
        }
    }, [onLocationSelect, address]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ", Nellore")}&limit=1`,
                {
                    headers: {
                        'User-Agent': 'Hi-Tech-Connect-App'
                    }
                }
            );
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
                setPosition(newPos);
                reverseGeocode(newPos[0], newPos[1]);
            } else {
                toast.error("Location not found. Try a more specific search.");
            }
        } catch (error) {
            toast.error("Search failed. Please try again later.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPos: [number, number] = [latitude, longitude];
                setPosition(newPos);
                reverseGeocode(latitude, longitude);
            },
            () => {
                toast.error("Unable to retrieve your location");
            }
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search area in Nellore..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                        className="pl-10"
                    />
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSearch}
                    disabled={isSearching}
                >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseMyLocation}
                    title="Use My Location"
                >
                    <Navigation className="h-4 w-4" />
                </Button>
            </div>

            <div className="relative h-[300px] w-full rounded-xl overflow-hidden border border-secondary shadow-inner">
                <MapContainer
                    center={position}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                        position={position}
                        draggable={true}
                        eventHandlers={{
                            dragend: (e) => {
                                const marker = e.target;
                                const { lat, lng } = marker.getLatLng();
                                setPosition([lat, lng]);
                                reverseGeocode(lat, lng);
                            }
                        }}
                    />
                    <MapEvents onMapClick={(lat, lng) => {
                        setPosition([lat, lng]);
                        reverseGeocode(lat, lng);
                    }} />
                    <MapController center={position} />
                </MapContainer>
            </div>

            <div className="bg-secondary/30 p-4 rounded-lg border border-secondary/50">
                <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selected Address</p>
                        <p className="text-sm font-medium leading-tight">
                            {isReverseGeocoding ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Identifying location...
                                </span>
                            ) : (
                                address || "Click on the map to select a location"
                            )}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                            Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;
