import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AnitaCamera = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState<string>("");

  useEffect(() => {
    if (!sessionId) {
      toast.error("Invalid session");
      return;
    }

    // Subscribe to session channel to get product image info
    const channel = supabase.channel(`zoe-camera-${sessionId}`);
    
    channel
      .on("broadcast", { event: "product-info" }, (payload) => {
        console.log("Received product info:", payload);
        setProductImageUrl(payload.payload.productImageUrl);
        setProductName(payload.payload.productName || "product");
      })
      .subscribe((status) => {
        console.log("Channel status:", status);
        if (status === "SUBSCRIBED") {
          // Request product info from PC
          channel.send({
            type: "broadcast",
            event: "mobile-ready",
            payload: { ready: true }
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !productImageUrl || !sessionId) return;

    e.target.value = "";
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const backgroundImageBase64 = reader.result as string;

      try {
        const { data, error } = await supabase.functions.invoke("anita-photo-composite", {
          body: {
            productImageUrl,
            backgroundImageBase64,
          },
        });

        if (error) throw error;
        if (!data.success || !data.imageBase64) {
          throw new Error(data.error || "Failed to composite image");
        }

        // Send result back to PC via broadcast
        const channel = supabase.channel(`zoe-camera-${sessionId}`);
        await channel.subscribe();
        
        channel.send({
          type: "broadcast",
          event: "photo-result",
          payload: {
            imageBase64: data.imageBase64,
            productName,
          },
        });

        setIsComplete(true);
        toast.success("Photo sent to your PC!");
      } catch (error) {
        console.error("Error compositing photo:", error);
        toast.error(error instanceof Error ? error.message : "Failed to composite image");
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8D5E0] via-[#F0E6E8] to-[#E8D5E0] p-6 flex items-center justify-center">
        <Card className="p-8 bg-white/90 backdrop-blur-sm text-center max-w-sm">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Complete!</h2>
          <p className="text-gray-600 mb-4">
            Your photo has been sent to your PC. You can close this page now.
          </p>
          <Button
            onClick={() => window.close()}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Close
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8D5E0] via-[#F0E6E8] to-[#E8D5E0] p-6">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="/lovable-uploads/zoe-profile.png"
              alt="Zoe"
              className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
            />
            <div className="text-left">
              <h1 className="text-xl font-bold text-gray-800">Zoe</h1>
              <p className="text-xs text-gray-600">Lifestyle Artist</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Take a photo to composite your product
          </p>
        </div>

        {/* Product Preview */}
        {productImageUrl ? (
          <Card className="p-4 bg-white/80 backdrop-blur-sm mb-6">
            <p className="text-sm text-gray-600 mb-2 text-center">Selected Product</p>
            <img
              src={productImageUrl}
              alt="Product"
              className="w-32 h-32 object-contain mx-auto bg-white rounded-lg"
            />
          </Card>
        ) : (
          <Card className="p-6 bg-white/80 backdrop-blur-sm mb-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-500" />
            <p className="text-sm text-gray-600">Waiting for product info from PC...</p>
          </Card>
        )}

        {/* Camera Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          className="hidden"
        />

        <Button
          onClick={handleCameraClick}
          disabled={!productImageUrl || isUploading}
          className="w-full h-16 bg-teal-500 hover:bg-teal-600 text-white text-lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              Processing...
            </>
          ) : (
            <>
              <Camera className="w-6 h-6 mr-3" />
              Take Photo
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          The product will be composited into your photo automatically
        </p>
      </div>
    </div>
  );
};

export default AnitaCamera;
