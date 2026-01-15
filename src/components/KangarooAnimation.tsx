
import { useEffect, useState } from "react";

interface KangarooAnimationProps {
  workflowType: "creation" | "review" | "get-outputs";
}

const artTypes = {
  "creation": {
    title: "Creating Promotional Content",
    emoji: "🎨",
    description: "Getting template PSD, replacing images, adding text, and creating variations...",
    colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57"],
    elements: ["🌟", "✨", "🎯", "🔮", "💫"]
  },
  "review": {
    title: "Review Phase",
    emoji: "👀",
    description: "Preparing outputs for review and feedback...",
    colors: ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe"],
    elements: ["👁️", "📝", "💭", "🎯", "✨"]
  },
  "get-outputs": {
    title: "Finalizing Files",
    emoji: "📦",
    description: "Preparing downloads and final deliverables...",
    colors: ["#FFD93D", "#6BCF7F", "#4D96FF", "#FF6B9D", "#C44569"],
    elements: ["💎", "🎁", "🏆", "📁", "🎉"]
  }
};

export const KangarooAnimation = ({ workflowType }: KangarooAnimationProps) => {
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; element: string; delay: number }>>([]);
  const [creationStage, setCreationStage] = useState(0);
  const artType = artTypes[workflowType];

  useEffect(() => {
    const colorInterval = setInterval(() => {
      setCurrentColorIndex((prev) => (prev + 1) % artType.colors.length);
    }, 1000);

    const stageInterval = setInterval(() => {
      setCreationStage((prev) => (prev + 1) % 4);
    }, 1500);

    return () => {
      clearInterval(colorInterval);
      clearInterval(stageInterval);
    };
  }, [artType.colors.length]);

  useEffect(() => {
    const particleInterval = setInterval(() => {
      setParticles(prev => {
        const newParticles = [...prev];
        
        // Add new particle
        if (newParticles.length < 8) {
          newParticles.push({
            id: Date.now() + Math.random(),
            x: Math.random() * 100,
            y: Math.random() * 100,
            element: artType.elements[Math.floor(Math.random() * artType.elements.length)],
            delay: Math.random() * 2
          });
        }
        
        // Remove old particles
        if (newParticles.length > 8) {
          newParticles.shift();
        }
        
        return newParticles;
      });
    }, 800);

    return () => clearInterval(particleInterval);
  }, [artType.elements]);

  const getCreationPhase = () => {
    switch (creationStage) {
      case 0: return "Ideating...";
      case 1: return "Sketching...";
      case 2: return "Coloring...";
      case 3: return "Perfecting...";
      default: return "Creating...";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-4">
      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
          <span className="text-3xl animate-bounce" style={{ animationDelay: "0.5s" }}>
            {artType.emoji}
          </span>
          {artType.title}
        </h3>
        <p className="text-sm text-muted-foreground font-medium">
          {getCreationPhase()}
        </p>
      </div>
      
      {/* Main Creation Area */}
      <div className="relative w-48 h-32 bg-gradient-to-br from-background to-muted rounded-xl border-2 border-border shadow-lg overflow-hidden">
        {/* Background glow effect */}
        <div 
          className="absolute inset-0 opacity-20 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${artType.colors[currentColorIndex]}40, transparent 70%)`
          }}
        />
        
        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute text-lg animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: "3s"
            }}
          >
            {particle.element}
          </div>
        ))}
        
        {/* Central creation focus */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-12 h-12 rounded-full animate-pulse border-4 flex items-center justify-center text-2xl"
            style={{
              borderColor: artType.colors[currentColorIndex],
              backgroundColor: `${artType.colors[currentColorIndex]}20`
            }}
          >
            <span className="animate-spin">⚡</span>
          </div>
        </div>
        
        {/* Progress waves */}
        <div className="absolute bottom-0 left-0 right-0 h-2 overflow-hidden">
          <div 
            className="h-full animate-wave"
            style={{
              background: `linear-gradient(90deg, transparent, ${artType.colors[currentColorIndex]}60, transparent)`,
              width: "200%",
              transform: "translateX(-50%)"
            }}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground text-center animate-fade-in italic">
        {artType.description}
      </p>
      
      {/* Animated progress indicator */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i === creationStage 
                ? 'scale-150 animate-pulse' 
                : 'scale-100'
            }`}
            style={{
              backgroundColor: i <= creationStage ? artType.colors[currentColorIndex] : '#e5e7eb'
            }}
          />
        ))}
      </div>
    </div>
  );
};
