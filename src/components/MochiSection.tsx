import React from "react";
import { MessageSquare, History } from "lucide-react";

interface MochiSectionProps {
  onRequestClick: () => void;
  onHistoryClick: () => void;
}

const MochiSection: React.FC<MochiSectionProps> = ({
  onRequestClick,
  onHistoryClick,
}) => {
  return (
    <div className="mt-8 pt-8 border-t border-border/30">
      <div className="text-center mb-6">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Request a New Crew
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Have a pain point or need a new AI crew member? Submit your request to Mochi.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="flex flex-col items-center group">
          <div 
            className="relative cursor-pointer"
            onClick={onRequestClick}
          >
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-2 border-dashed border-primary/50 hover:border-primary transition-colors">
              <img
                src="/lovable-uploads/mochi-profile.png"
                alt="Mochi - Request Handler"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <span className="absolute bottom-0 right-0 z-10 h-4 w-4 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center">
              <MessageSquare className="h-2.5 w-2.5 text-white" />
            </span>
          </div>
          <div className="mt-3 text-center">
            <div className="text-sm font-medium text-foreground">Mochi</div>
            <div className="text-xs text-muted-foreground">Request Handler</div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onRequestClick}
              className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Submit Request
            </button>
            <button
              onClick={onHistoryClick}
              className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center gap-1"
            >
              <History className="h-3 w-3" />
              History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MochiSection;
