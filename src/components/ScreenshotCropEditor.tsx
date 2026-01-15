import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Plus, Trash2, Monitor, Smartphone, Check, Move, Maximize2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface CropRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
}

interface ScreenshotCropEditorProps {
  pcScreenshot?: string;
  mobileScreenshot?: string;
  onClose: () => void;
  onDownloadRegions?: (regions: { image: string; name: string }[]) => void;
}

export const ScreenshotCropEditor = ({
  pcScreenshot,
  mobileScreenshot,
  onClose,
}: ScreenshotCropEditorProps) => {
  const [activeTab, setActiveTab] = useState<"pc" | "mobile">(pcScreenshot ? "pc" : "mobile");
  const [regions, setRegions] = useState<{ pc: CropRegion[]; mobile: CropRegion[] }>({
    pc: [],
    mobile: [],
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number; naturalWidth: number; naturalHeight: number }>({
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0,
  });
  const [dragState, setDragState] = useState<{
    regionId: string;
    startX: number;
    startY: number;
    originalRegion: CropRegion;
  } | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const currentScreenshot = activeTab === "pc" ? pcScreenshot : mobileScreenshot;
  const currentRegions = regions[activeTab];

  // Load image and set up canvas
  useEffect(() => {
    if (!currentScreenshot || !canvasRef.current || !containerRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      
      const container = containerRef.current!;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight - 60; // Account for tabs
      
      const scale = Math.min(
        containerWidth / img.naturalWidth,
        containerHeight / img.naturalHeight,
        1
      );
      
      const displayWidth = img.naturalWidth * scale;
      const displayHeight = img.naturalHeight * scale;
      
      setImageSize({
        width: displayWidth,
        height: displayHeight,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
      
      const canvas = canvasRef.current!;
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      drawCanvas();
    };
    img.src = currentScreenshot;
  }, [currentScreenshot, activeTab]);

  // Redraw canvas when regions change
  useEffect(() => {
    drawCanvas();
  }, [currentRegions, currentRect, imageSize]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imageRef.current;
    
    if (!canvas || !ctx || !img || imageSize.width === 0) return;

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, imageSize.width, imageSize.height);

    // Draw existing regions
    currentRegions.forEach((region, index) => {
      const scaleX = imageSize.width / imageSize.naturalWidth;
      const scaleY = imageSize.height / imageSize.naturalHeight;
      
      const x = region.x * scaleX;
      const y = region.y * scaleY;
      const w = region.width * scaleX;
      const h = region.height * scaleY;

      // Fill with semi-transparent color
      ctx.fillStyle = region.selected ? "rgba(59, 130, 246, 0.2)" : "rgba(147, 51, 234, 0.2)";
      ctx.fillRect(x, y, w, h);

      // Border
      ctx.strokeStyle = region.selected ? "#3b82f6" : "#9333ea";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, w, h);

      // Label
      ctx.fillStyle = region.selected ? "#3b82f6" : "#9333ea";
      ctx.fillRect(x, y - 24, 70, 24);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`Area ${index + 1}`, x + 8, y - 12);

      // Resize handles
      const handleSize = 8;
      ctx.fillStyle = region.selected ? "#3b82f6" : "#9333ea";
      // Corners
      ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
    });

    // Draw current selection rectangle
    if (currentRect) {
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.setLineDash([]);
    }
  }, [currentRegions, currentRect, imageSize]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    
    // Check if clicking on existing region
    const scaleX = imageSize.width / imageSize.naturalWidth;
    const scaleY = imageSize.height / imageSize.naturalHeight;
    
    for (let i = currentRegions.length - 1; i >= 0; i--) {
      const region = currentRegions[i];
      const rx = region.x * scaleX;
      const ry = region.y * scaleY;
      const rw = region.width * scaleX;
      const rh = region.height * scaleY;
      
      if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
        setDragState({
          regionId: region.id,
          startX: x,
          startY: y,
          originalRegion: { ...region },
        });
        return;
      }
    }
    
    // Start new selection
    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    
    if (dragState) {
      // Dragging existing region
      const deltaX = x - dragState.startX;
      const deltaY = y - dragState.startY;
      
      const scaleX = imageSize.naturalWidth / imageSize.width;
      const scaleY = imageSize.naturalHeight / imageSize.height;
      
      setRegions((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].map((r) =>
          r.id === dragState.regionId
            ? {
                ...r,
                x: Math.max(0, Math.min(imageSize.naturalWidth - r.width, dragState.originalRegion.x + deltaX * scaleX)),
                y: Math.max(0, Math.min(imageSize.naturalHeight - r.height, dragState.originalRegion.y + deltaY * scaleY)),
              }
            : r
        ),
      }));
      return;
    }
    
    if (!isDrawing || !startPoint) return;
    
    const width = x - startPoint.x;
    const height = y - startPoint.y;
    
    setCurrentRect({
      x: width < 0 ? x : startPoint.x,
      y: height < 0 ? y : startPoint.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    if (dragState) {
      setDragState(null);
      return;
    }
    
    if (!isDrawing || !currentRect) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentRect(null);
      return;
    }
    
    // Minimum size check (20x20 pixels on display)
    if (currentRect.width > 20 && currentRect.height > 20) {
      const scaleX = imageSize.naturalWidth / imageSize.width;
      const scaleY = imageSize.naturalHeight / imageSize.height;
      
      const newRegion: CropRegion = {
        id: crypto.randomUUID(),
        x: currentRect.x * scaleX,
        y: currentRect.y * scaleY,
        width: currentRect.width * scaleX,
        height: currentRect.height * scaleY,
        selected: true,
      };
      
      setRegions((prev) => ({
        ...prev,
        [activeTab]: [...prev[activeTab], newRegion],
      }));
    }
    
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  const toggleRegionSelection = (regionId: string) => {
    setRegions((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((r) =>
        r.id === regionId ? { ...r, selected: !r.selected } : r
      ),
    }));
  };

  const deleteRegion = (regionId: string) => {
    setRegions((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((r) => r.id !== regionId),
    }));
  };

  const clearAllRegions = () => {
    setRegions((prev) => ({
      ...prev,
      [activeTab]: [],
    }));
  };

  const selectAllRegions = () => {
    setRegions((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((r) => ({ ...r, selected: true })),
    }));
  };

  const downloadSelectedRegions = async () => {
    const selectedRegions = currentRegions.filter((r) => r.selected);
    if (selectedRegions.length === 0 || !imageRef.current) return;

    const img = imageRef.current;

    for (let i = 0; i < selectedRegions.length; i++) {
      const region = selectedRegions[i];
      const canvas = document.createElement("canvas");
      canvas.width = region.width;
      canvas.height = region.height;
      const ctx = canvas.getContext("2d")!;
      
      ctx.drawImage(
        img,
        region.x,
        region.y,
        region.width,
        region.height,
        0,
        0,
        region.width,
        region.height
      );
      
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `maple-${activeTab}-section-${i + 1}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Small delay between downloads
      if (i < selectedRegions.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  };

  const downloadFullScreenshot = () => {
    if (!currentScreenshot) return;
    
    const link = document.createElement("a");
    link.href = currentScreenshot;
    link.download = `maple-${activeTab}-full-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedCount = currentRegions.filter((r) => r.selected).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-border/50 bg-background/20 backdrop-blur flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Screenshot Crop Editor</h2>
          
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            {pcScreenshot && (
              <button
                onClick={() => setActiveTab("pc")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "pc"
                    ? "bg-white text-black"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Monitor className="w-4 h-4" />
                PC
                {regions.pc.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 rounded">
                    {regions.pc.length}
                  </span>
                )}
              </button>
            )}
            {mobileScreenshot && (
              <button
                onClick={() => setActiveTab("mobile")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "mobile"
                    ? "bg-white text-black"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile
                {regions.mobile.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 rounded">
                    {regions.mobile.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center p-4 overflow-auto"
        >
          {currentScreenshot ? (
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-crosshair shadow-2xl rounded-lg"
              style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
          ) : (
            <div className="text-white/50 text-center">
              <p>No screenshot available for {activeTab === "pc" ? "PC" : "Mobile"} view</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-border/50 bg-background/30 backdrop-blur flex flex-col">
          {/* Instructions */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <Move className="w-4 h-4" />
              <span>Drag to select area</span>
            </div>
            <p className="text-white/50 text-xs">
              Draw rectangles on the image to select areas for download. You can select multiple areas.
            </p>
          </div>

          {/* Region List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Selected Areas</h3>
              {currentRegions.length > 0 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllRegions}
                    className="h-7 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllRegions}
                    className="h-7 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {currentRegions.length === 0 ? (
              <div className="text-center text-white/40 text-sm py-8">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No areas selected</p>
                <p className="text-xs mt-1">Draw on the image to add areas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentRegions.map((region, index) => (
                  <div
                    key={region.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      region.selected
                        ? "bg-primary/10 border-primary/30"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <Checkbox
                      checked={region.selected}
                      onCheckedChange={() => toggleRegionSelection(region.id)}
                      className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">Area {index + 1}</p>
                      <p className="text-xs text-white/50 truncate">
                        {Math.round(region.width)} × {Math.round(region.height)} px
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRegion(region.id)}
                      className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border/30 space-y-2">
            <Button
              onClick={downloadSelectedRegions}
              disabled={selectedCount === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Selected ({selectedCount})
            </Button>
            <Button
              variant="outline"
              onClick={downloadFullScreenshot}
              className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Download Full Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
