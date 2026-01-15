import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import InteractiveWorldMap from '@/components/InteractiveWorldMap';
const AllenQA = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Load ElevenLabs ConvAI widget script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    document.head.appendChild(script);
    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);
  return <div className="min-h-screen bg-background">
      {/* Logo - reusing existing component */}
      <Logo />
      
      {/* Home button */}
      <div className="fixed top-4 right-4 z-50">
        <Button onClick={() => navigate('/')} variant="outline" size="sm" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Home
        </Button>
      </div>

      {/* Main content area */}
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="space-y-12">
          {/* Allen QA Assistant Section */}
          <div className="text-center space-y-6">
            
            
            <div className="flex justify-center">
              <elevenlabs-convai agent-id="agent_5701k4cze7cqff9vf8nz8hz7akaf"></elevenlabs-convai>
            </div>
          </div>

          {/* World Map Section */}
          <div className="mt-16 w-full">
            <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#3C3C3C' }}>
              Select a country to run promotional banner QA
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Type a country name to add pins and start QA workflows
            </p>
            <InteractiveWorldMap />
          </div>
        </div>
      </div>
    </div>;
};
export default AllenQA;