import React, { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, RefreshCw, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { removeBackground, loadImage, downloadBlob } from "@/utils/backgroundRemoval";

interface KaiBackgroundRemovalPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const KaiBackgroundRemovalPopup: React.FC<KaiBackgroundRemovalPopupProps> = ({
  open,
  onOpenChange,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (processedBlob) {
      const url = URL.createObjectURL(processedBlob);
      setProcessedUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [processedBlob]);

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      console.log("=== Kai Background Removal ===");
      console.log("Processing file:", selectedFile.name);

      const imageElement = await loadImage(selectedFile);
      const resultBlob = await removeBackground(imageElement);
      
      setProcessedBlob(resultBlob);
      toast.success("Background removed successfully!");
    } catch (error) {
      console.error("=== Processing Error ===");
      console.error("Error details:", error);
      toast.error("Failed to remove background. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedBlob || !selectedFile) return;
    
    const originalName = selectedFile.name.replace(/\.[^/.]+$/, "");
    downloadBlob(processedBlob, `${originalName}_no_bg.png`);
    toast.success("Image downloaded!");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProcessedBlob(null);
      setProcessedUrl(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReselect = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProcessedBlob(null);
    setProcessedUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vmin] w-[90vmin] h-[90vmin] p-0 overflow-hidden border-none aspect-square">
        {/* Background Image */}
        <div
          className="relative w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/kai-background-removal-bg.png')`,
          }}
        >
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Content - Positioned inside the monitor screen */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
            {/* Monitor content area - adjusted to fit inside the screen */}
            <div className="flex flex-col items-center justify-center" style={{ marginTop: '-25%', marginLeft: '-5%' }}>
              
              {!selectedFile ? (
                <>
                  {/* Speech Bubble - Initial State */}
                  <div className="relative bg-background/95 backdrop-blur-sm rounded-lg p-5 mb-6 max-w-sm border border-primary/30 shadow-lg">
                    <p className="text-foreground text-center text-base leading-relaxed">
                      Hey there! 👋<br />
                      Upload an image you want<br />
                      the background removed from!<br />
                      <span className="text-sm text-muted-foreground mt-2 block">
                        I'll remove it instantly<br />
                        and you can download the result ✨
                      </span>
                    </p>
                  </div>

                  {/* Upload Button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    onClick={handleUploadClick}
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg px-6 py-5 text-base font-semibold rounded-lg transition-all hover:scale-105"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Image
                  </Button>
                </>
              ) : processedBlob ? (
                <>
                  {/* Success State with Result */}
                  <div className="bg-background/95 backdrop-blur-sm rounded-lg p-4 border border-primary/30 shadow-lg w-full max-w-sm text-center">
                    {/* Result Preview */}
                    <div className="mb-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZGRkIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNkZGQiLz48L3N2Zz4=')] rounded-md">
                      <img
                        src={processedUrl || ""}
                        alt="Result"
                        className="w-full h-32 object-contain rounded-md"
                      />
                    </div>
                    
                    {/* Success Message */}
                    <div className="mb-3">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                      <p className="text-foreground text-sm font-medium">
                        Background removed! 🎉
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReselect}
                        variant="outline"
                        className="flex-1 border-primary/30"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        New Image
                      </Button>
                      <Button
                        onClick={handleDownload}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Preview State */}
                  <div className="bg-background/95 backdrop-blur-sm rounded-lg p-4 border border-primary/30 shadow-lg w-full max-w-sm">
                    {/* Image Preview */}
                    <div className="mb-3">
                      <img
                        src={previewUrl || ""}
                        alt="Preview"
                        className="w-full h-32 object-contain rounded-md bg-muted/50"
                      />
                    </div>
                    
                    {/* Confirmation Message */}
                    <p className="text-foreground text-center text-sm mb-3">
                      Ready to remove background? 🤔
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReselect}
                        variant="outline"
                        className="flex-1 border-primary/30"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Re-upload
                      </Button>
                      <Button
                        onClick={handleProcess}
                        disabled={isProcessing}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Remove BG
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {isProcessing && (
                      <p className="text-muted-foreground text-xs text-center mt-2">
                        First time may take longer to load the model...
                      </p>
                    )}
                  </div>
                  
                  {/* Hidden file input for reselect */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KaiBackgroundRemovalPopup;
