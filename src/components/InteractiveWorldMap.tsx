import React, { useState, useRef, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { MapPin, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { countryCoordinates, getAllCountryNames, CountryData } from '@/data/countryCoordinates';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface PinnedCountry extends CountryData {
  id: string;
}

const InteractiveWorldMap = () => {
  const [pinnedCountries, setPinnedCountries] = useState<PinnedCountry[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<PinnedCountry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20]);
  const [zoom, setZoom] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Filter countries based on search input
  useEffect(() => {
    if (searchInput.trim()) {
      const filtered = getAllCountryNames().filter(country =>
        country.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredCountries(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredCountries([]);
      setShowSuggestions(false);
    }
  }, [searchInput]);

  const addCountryPin = (countryName: string) => {
    const countryData = countryCoordinates[countryName];
    if (!countryData) return;

    // Check if country is already pinned
    if (pinnedCountries.some(c => c.name === countryName)) {
      toast({
        title: 'Already pinned',
        description: `${countryName} is already on the map.`,
        variant: 'destructive'
      });
      return;
    }

    const newPin: PinnedCountry = {
      ...countryData,
      id: `${countryName}-${Date.now()}`
    };

    setPinnedCountries(prev => [...prev, newPin]);
    setSearchInput('');
    setShowSuggestions(false);

    // Zoom to the new country
    setMapCenter(countryData.coordinates);
    setZoom(2);

    toast({
      title: 'Country added',
      description: `${countryName} has been pinned on the map.`
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredCountries.length > 0) {
      addCountryPin(filteredCountries[0]);
    }
  };

  const handlePinClick = (country: PinnedCountry) => {
    setSelectedCountry(country);
    setIsDialogOpen(true);
  };

  const handleReset = () => {
    setPinnedCountries([]);
    setMapCenter([0, 20]);
    setZoom(1);
    toast({
      title: 'Map reset',
      description: 'All pins have been removed.'
    });
  };

  const handleConfirm = async () => {
    if (!selectedCountry) return;
    setIsProcessing(true);

    const webhookUrl = selectedCountry.webhookUrl || 
      'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44';
    
    const params = new URLSearchParams({
      country: selectedCountry.name,
      countryKo: selectedCountry.nameKo,
      timestamp: new Date().toISOString()
    });
    
    try {
      await fetch(`${webhookUrl}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors'
      });
      
      toast({
        title: 'Promotional Banner QA Started',
        description: `Promotional banner QA for ${selectedCountry.name} has been initiated.`
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error triggering workflow:', error);
      toast({
        title: 'Error Occurred',
        description: 'Unable to start QA workflow.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center" style={{ backgroundColor: '#FCF8F3' }}>
      {/* Search and Controls */}
      <div className="w-full max-w-4xl px-4 py-6 space-y-4">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a country name (e.g., Brazil, Mexico)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="w-full text-lg shadow-lg border-2 focus:border-[#E63946] transition-colors"
            style={{ backgroundColor: '#FFFFFF' }}
          />
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && filteredCountries.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country}
                  onClick={() => addCountryPin(country)}
                  className="w-full px-4 py-3 text-left hover:bg-[#FCF8F3] transition-colors border-b last:border-b-0 flex items-center justify-between"
                >
                  <span className="font-medium" style={{ color: '#3C3C3C' }}>{country}</span>
                  <span className="text-sm text-gray-500">{countryCoordinates[country].nameKo}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3 justify-between items-center">
          <div className="text-sm" style={{ color: '#3C3C3C' }}>
            {pinnedCountries.length} {pinnedCountries.length === 1 ? 'country' : 'countries'} pinned
          </div>
          
          {pinnedCountries.length > 0 && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              style={{ borderColor: '#E63946', color: '#E63946' }}
            >
              <X className="w-4 h-4" />
              Reset Map
            </Button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-[600px] relative rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#FFFFFF' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 147
          }}
        >
          <ZoomableGroup center={mapCenter} zoom={zoom}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#3C3C3C"
                    stroke="#FCF8F3"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#5C5C5C', outline: 'none' },
                      pressed: { outline: 'none' }
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Render Pins */}
            {pinnedCountries.map((country) => (
              <Marker
                key={country.id}
                coordinates={country.coordinates}
                onClick={() => handlePinClick(country)}
              >
                <g
                  className="cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
                  style={{ animation: 'fadeIn 0.5s ease-out' }}
                >
                  <circle
                    r={8}
                    fill="#E63946"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                  />
                  <circle
                    r={12}
                    fill="transparent"
                    stroke="#E63946"
                    strokeWidth={1.5}
                    opacity={0.4}
                    className="animate-pulse"
                  />
                </g>
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Promotional Banner QA</DialogTitle>
            <DialogDescription>
              {selectedCountry && (
                <>
                  Would you like to proceed with the promotional banner QA for{' '}
                  <span className="font-semibold text-foreground">{selectedCountry.name}</span>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? 'Running...' : 'Run'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default InteractiveWorldMap;
