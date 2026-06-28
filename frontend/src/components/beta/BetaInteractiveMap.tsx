import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

// Bundled locally — the previous external GitHub URL 404'd, leaving the map blank.
const geoUrl = "/geo/africa.geojson";

interface MapData {
    country_code: string;
    country_name: string;
    score: number; // 0 to 100
}

interface BetaInteractiveMapProps {
    data: MapData[];
    onCountryClick?: (countryCode: string) => void;
}

export const BetaInteractiveMap: React.FC<BetaInteractiveMapProps> = ({ data, onCountryClick }) => {
    const [tooltipContent, setTooltipContent] = useState('');

    // Color scale from primary/10 to accent color
    const colorScale = scaleLinear<string>()
        .domain([0, 100])
        .range(["#f0f4f8", "#d4af37"]);

    const getScore = (geoName: string) => {
        // Simple mapping, might need more robust country name matching in production
        const countryData = data.find(d => 
            d.country_name.toLowerCase() === geoName.toLowerCase() ||
            d.country_name.toLowerCase().includes(geoName.toLowerCase()) ||
            geoName.toLowerCase().includes(d.country_name.toLowerCase())
        );
        return countryData ? countryData.score : 0;
    };

    return (
        <div className="relative w-full h-full bg-[#f8f9fa] rounded-2xl border border-primary/10 overflow-hidden">
            <ComposableMap
                projection="geoAzimuthalEqualArea"
                projectionConfig={{
                    rotate: [-20.0, -5.0, 0],
                    scale: 400
                }}
            >
                <ZoomableGroup zoom={1}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map(geo => {
                                const geoName = geo.properties.name || geo.properties.geounit;
                                const score = getScore(geoName);
                                
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onMouseEnter={() => {
                                            setTooltipContent(`${geoName}: ${score > 0 ? `Score ${score}` : 'No Data'}`);
                                        }}
                                        onMouseLeave={() => {
                                            setTooltipContent("");
                                        }}
                                        onClick={() => {
                                            if (onCountryClick && score > 0) {
                                                const countryData = data.find(d => 
                                                    d.country_name.toLowerCase() === geoName.toLowerCase() ||
                                                    d.country_name.toLowerCase().includes(geoName.toLowerCase()) ||
                                                    geoName.toLowerCase().includes(d.country_name.toLowerCase())
                                                );
                                                if (countryData) {
                                                    onCountryClick(countryData.country_code);
                                                }
                                            }
                                        }}
                                        style={{
                                            default: {
                                                fill: score > 0 ? colorScale(score) : "#e0e0e0",
                                                stroke: "#ffffff",
                                                strokeWidth: 0.5,
                                                outline: "none"
                                            },
                                            hover: {
                                                fill: "#0a2540", // primary color
                                                stroke: "#d4af37", // accent color
                                                strokeWidth: 1,
                                                outline: "none",
                                                cursor: score > 0 ? "pointer" : "default"
                                            },
                                            pressed: {
                                                fill: "#d4af37",
                                                outline: "none"
                                            }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            {tooltipContent && (
                <div className="absolute bottom-4 left-4 bg-background text-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-semibold pointer-events-none">
                    {tooltipContent}
                </div>
            )}
        </div>
    );
};
