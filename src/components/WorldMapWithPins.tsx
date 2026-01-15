import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import worldMap from '@/assets/world-map-illustrated.png';
interface Country {
  name: string;
  x: number; // percentage from left
  y: number; // percentage from top
  nameKo: string;
}
const countries: Country[] = [{
  name: 'Peru',
  nameKo: '페루',
  x: 25,
  y: 58
}, {
  name: 'Argentina',
  nameKo: '아르헨티나',
  x: 29,
  y: 75
}, {
  name: 'Thailand',
  nameKo: '태국',
  x: 73,
  y: 48
}, {
  name: 'Egypt',
  nameKo: '이집트',
  x: 54,
  y: 38
}, {
  name: 'Panama',
  nameKo: '파나마',
  x: 24,
  y: 49
}, {
  name: 'Japan',
  nameKo: '일본',
  x: 84,
  y: 36
}, {
  name: 'United Kingdom',
  nameKo: '영국',
  x: 50,
  y: 25
}, {
  name: 'Australia',
  nameKo: '호주',
  x: 82,
  y: 72
}, {
  name: 'Canada',
  nameKo: '캐나다',
  x: 18,
  y: 22
}, {
  name: 'Brazil',
  nameKo: '브라질',
  x: 30,
  y: 65
}, {
  name: 'Germany',
  nameKo: '독일',
  x: 52,
  y: 27
}, {
  name: 'Turkey',
  nameKo: '터키',
  x: 56,
  y: 35
}];
const WorldMapWithPins = () => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    toast
  } = useToast();
  const handlePinClick = (country: Country) => {
    setSelectedCountry(country);
    setIsDialogOpen(true);
  };
  const handleConfirm = async () => {
    if (!selectedCountry) return;
    setIsProcessing(true);

    // Use different webhook URL based on country
    let webhookUrl = 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44';
    
    if (selectedCountry.name === 'Thailand') {
      webhookUrl = 'https://dev.eaip.lge.com/n8n/webhook/48fc6796-3dcd-458a-9652-4b246d9c7cfe';
    } else if (selectedCountry.name === 'Egypt') {
      webhookUrl = 'https://dev.eaip.lge.com/n8n/webhook/f58e7420-82ad-4a71-a986-98e64ec0b17e';
    }
    
    // Add country information as query parameters
    const params = new URLSearchParams({
      country: selectedCountry.name,
      countryKo: selectedCountry.nameKo,
      timestamp: new Date().toISOString()
    });
    
    try {
      // n8n workflow trigger using GET method
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
  return <>
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-full max-w-6xl">
          <img 
            src={worldMap} 
            alt="World Map" 
            className="w-full h-auto"
          />
          
          {countries.map(country => <button key={country.name} onClick={() => handlePinClick(country)} className="absolute transform -translate-x-1/2 -translate-y-full hover:scale-125 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary rounded-full" style={{
          left: `${country.x}%`,
          top: `${country.y}%`
        }} aria-label={`${country.nameKo} 선택`}>
              <MapPin className="w-8 h-8 text-red-500 drop-shadow-lg" fill="currentColor" />
            </button>)}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Promotional Banner QA</DialogTitle>
            <DialogDescription>
              {selectedCountry && <>
                  Would you like to proceed with the promotional banner QA for{' '}
                  <span className="font-semibold text-foreground">{selectedCountry.name}</span>?
                </>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? 'Running...' : 'Run'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
};
export default WorldMapWithPins;