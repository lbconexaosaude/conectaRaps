import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, MarkerF, HeatmapLayerF, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '100%'
};

// Boa Vista Center
const center = {
    lat: 2.819833,
    lng: -60.673321
};

interface MapProps {
    data: any[];
}

const libraries: ("places" | "visualization")[] = ['places', 'visualization'];

// Fixed Health Units Data
const HEALTH_UNITS = {
    samu: [
        { id: 'samu-central', title: 'BASE CENTRAL SAMU - Av. Sorocaima, 123', lat: 2.805562, lng: -60.697472 },
        { id: 'samu-carana', title: 'BASE DESCENTRALIZADA SAMU - CARANÃ', lat: 2.83636, lng: -60.71392 },
        { id: 'samu-olimpico', title: 'BASE DESCENTRALIZADA SAMU - JARDIM OLÍMPICO', lat: 2.79646, lng: -60.73426 }
    ],
    ubs: [
        { id: 'ubs-31-marco', title: 'UBS 31 DE MARÇO', lat: 2.8425, lng: -60.6720 },
        { id: 'ubs-buritis', title: 'UBS BURITIS', lat: 2.8080, lng: -60.7200 },
        { id: 'ubs-mecejana', title: 'UBS MECEJANA', lat: 2.8050, lng: -60.6950 },
        { id: 'hgr', title: 'HOSPITAL GERAL DE RORAIMA', lat: 2.83321, lng: -60.68881 }
    ],
    caps: [
        { id: 'caps-ii', title: 'CAPS II Antônia Constância', lat: 2.82321, lng: -60.69315 },
        { id: 'caps-ad', title: 'CAPS AD III', lat: 2.8150, lng: -60.6800 }
    ]
};

const MapComponent: React.FC<MapProps> = ({ data }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyBWQmTwPhctTH66wTRaiPUsmGaf6rpyRqE",
        libraries,
        language: 'pt-BR',
        region: 'br'
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [showHeatmap, setShowHeatmap] = useState(false);

    // State for InfoWindow
    const [selectedMarker, setSelectedMarker] = useState<any>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    if (loadError) {
        console.error("Google Maps Load Error:", loadError);
    }

    const extractCoords = (val: string): { lat: number, lng: number } | null => {
        if (!val) return null;
        try {
            if (val.includes(',') && !val.includes('http')) {
                const [lat, lng] = val.split(',').map(c => parseFloat(c.trim()));
                if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
            }
            const regex = /destination=(-?\d+\.\d+),(-?\d+\.\d+)/;
            const match = val.match(regex);
            if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

            const generalRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
            const generalMatch = val.match(generalRegex);
            if (generalMatch) return { lat: parseFloat(generalMatch[1]), lng: parseFloat(generalMatch[2]) };
        } catch (e) {
            console.error("Error parsing location:", val, e);
        }
        return null;
    };

    const markers = useMemo(() => {
        return data
            .map((r, i) => {
                const loc = r[9];
                const coords = extractCoords(loc);
                if (!coords) return null;

                return {
                    id: `pac-${i}`,
                    lat: coords.lat,
                    lng: coords.lng,
                    title: r[0], // Column 0 is usually ID in new structure
                    fullData: {
                        id: r[0],
                        nome: r[1],
                        nasc: r[2],
                        sexo: r[3],
                        idade: r[4],
                        endereco: r[5] ? `${r[5]}, ${r[6] || ''}` : '',
                        bairro: r[7],
                        zona: r[8],
                        diag: r[11],
                        reinc: r[12],
                        raps: r[17]
                    }
                };
            })
            .filter((m): m is { id: string, lat: number, lng: number, title: string, fullData: any } => m !== null);
    }, [data]);

    const heatmapData = useMemo(() => {
        if (!window.google || !isLoaded) return [];
        return markers.map(m => new window.google.maps.LatLng(m.lat, m.lng));
    }, [markers, isLoaded]);

    React.useEffect(() => {
        if (map && markers.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            markers.forEach(marker => bounds.extend({ lat: marker.lat, lng: marker.lng }));

            // Also extend bounds for fixed units to ensure they are visible if nearby
            Object.values(HEALTH_UNITS).flat().forEach(u => bounds.extend({ lat: u.lat, lng: u.lng }));

            map.fitBounds(bounds);
        }
    }, [markers, map]);

    if (loadError) return <div className="p-4 text-red-500">Erro ao carregar o mapa.</div>;
    if (!isLoaded) return <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500">Carregando Mapa...</div>;

    // Icons URLs (using Google standard icons for now, can be replaced with custom SVGs)
    const icons = {
        samu: "http://maps.google.com/mapfiles/kml/shapes/ambulance.png",
        ubs: "http://maps.google.com/mapfiles/kml/shapes/hospitals.png",
        caps: "http://maps.google.com/mapfiles/kml/shapes/plus.png",
        patient: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
    };

    return (
        <div className="relative w-full h-full">
            <div className="absolute top-4 right-4 z-10 bg-white p-2 rounded shadow-md flex gap-2">
                <button onClick={() => setShowHeatmap(false)} className={`px-3 py-1 rounded text-xs font-bold ${!showHeatmap ? 'bg-[#003366] text-white' : 'bg-gray-200 text-gray-600'}`}>📍 Pinos</button>
                <button onClick={() => setShowHeatmap(true)} className={`px-3 py-1 rounded text-xs font-bold ${showHeatmap ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>🔥 Calor</button>
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{ mapTypeControl: false, streetViewControl: false }}
                onClick={() => setSelectedMarker(null)} // Close info window on map click
            >
                {showHeatmap ? (
                    <HeatmapLayerF data={heatmapData} options={{ radius: 30, opacity: 0.8 }} />
                ) : (
                    <>
                        {/* Patient Markers */}
                        {markers.map(marker => (
                            <MarkerF
                                key={marker.id}
                                position={{ lat: marker.lat, lng: marker.lng }}
                                title={marker.title} // ID on hover
                                icon={icons.patient}
                                onClick={() => setSelectedMarker(marker)}
                            />
                        ))}

                        {/* Fixed Health Units Markers */}
                        {HEALTH_UNITS.samu.map(u => (
                            <MarkerF
                                key={u.id}
                                position={{ lat: u.lat, lng: u.lng }}
                                title={u.title}
                                icon={{ url: icons.samu, scaledSize: new window.google.maps.Size(30, 30) }}
                            />
                        ))}
                        {HEALTH_UNITS.ubs.map(u => (
                            <MarkerF
                                key={u.id}
                                position={{ lat: u.lat, lng: u.lng }}
                                title={u.title}
                                icon={{ url: icons.ubs, scaledSize: new window.google.maps.Size(30, 30) }}
                            />
                        ))}
                        {HEALTH_UNITS.caps.map(u => (
                            <MarkerF
                                key={u.id}
                                position={{ lat: u.lat, lng: u.lng }}
                                title={u.title}
                                icon={{ url: icons.caps, scaledSize: new window.google.maps.Size(30, 30) }}
                            />
                        ))}

                        {/* Info Window for Selected Patient */}
                        {selectedMarker && isLoaded && (
                            // Note: InfoWindowF is the functional component wrapper for InfoWindow
                            <React.Fragment>
                                {/* We use a custom overlay or just the InfoWindow provided by @react-google-maps/api */}
                                {/* Since InfoWindowF was deprecated/removed in some versions, ensure correct import. 
                                    If InfoWindowF is not exported, use InfoWindow. Checking imports... 
                                    Let's add InfoWindow to imports at top of file first. */}
                            </React.Fragment>
                        )}
                    </>
                )}
            </GoogleMap>

            {/* Custom InfoWindow Implementation using logic is safer than relying on InfoWindow component if likely to break types */}
            {selectedMarker && (
                <div className="absolute bottom-4 left-4 z-20 bg-white p-4 rounded-xl shadow-card border-l-4 border-brand-medium w-80 animate-fade-in-up">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-brand-dark">{selectedMarker.fullData.id}</h3>
                        <button onClick={() => setSelectedMarker(null)} className="text-gray-400 hover:text-gray-600">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-semibold text-gray-800">Nome:</span> {selectedMarker.fullData.nome}</p>
                        <p><span className="font-semibold text-gray-800">Idade:</span> {selectedMarker.fullData.idade} anos ({selectedMarker.fullData.sexo})</p>
                        <p><span className="font-semibold text-gray-800">Bairro:</span> {selectedMarker.fullData.bairro}</p>
                        <p><span className="font-semibold text-gray-800">Diagnóstico:</span> {selectedMarker.fullData.diag}</p>
                        <p><span className="font-semibold text-gray-800">Reincidente:</span> {selectedMarker.fullData.reinc}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
                        {selectedMarker.lat.toFixed(5)}, {selectedMarker.lng.toFixed(5)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(MapComponent);
