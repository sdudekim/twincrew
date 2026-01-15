import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Download, Search, Sparkles, ZoomIn, Square, RectangleVertical, RectangleHorizontal, Film, RefreshCw, Camera, Smartphone, Pencil, Send, MessageCircle, Check, RotateCcw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { useIsMobile } from "@/hooks/use-mobile";
import { QRCodeSVG } from "qrcode.react";
import FeedbackDialog from "@/components/BenFeedbackDialog";

// State snapshot for revert functionality
interface StateSnapshot {
  url: string;
  carouselImages: string[];
  selectedImage: string | null;
  generatedImage: string | null;
  generatedVideoUrl: string | null;
  isUpscaled: boolean;
  currentAspectRatio: "16:9" | "1:1" | "9:16" | "custom";
  productName: string;
  productDimensions: { width?: string; height?: string; depth?: string; raw?: string } | null;
  tvMountInfo: { mountType: string | null; isTV: boolean } | null;
  showInput: boolean;
  inputType: "url" | "select" | "action" | "edit" | null;
}

// Chat message type
interface ChatMessage {
  id: string;
  type: "anita" | "user" | "system";
  content: string;
  component?: React.ReactNode;
  timestamp: Date;
  snapshot?: StateSnapshot; // Snapshot of state at this message
}

// Typing animation hook
const useTypingAnimation = (text: string, speed: number = 30, enabled: boolean = true) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    setDisplayedText("");
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayedText, isComplete };
};

// Anita message bubble component
const AnitaMessage = ({ content, showTyping = true, onComplete }: { content: string; showTyping?: boolean; onComplete?: () => void }) => {
  const { displayedText, isComplete } = useTypingAnimation(content, 25, showTyping);

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  return (
    <div className="flex gap-3 items-start">
      <img
        src="/lovable-uploads/anita-profile.png"
        alt="Anita"
        className="w-10 h-10 rounded-full border-2 border-white shadow-md flex-shrink-0"
      />
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[80%]">
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{displayedText}</p>
      </div>
    </div>
  );
};

// User message bubble component
const UserMessage = ({ content }: { content: string }) => (
  <div className="flex justify-end">
    <div className="bg-purple-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-[80%]">
      <p className="text-sm leading-relaxed">{content}</p>
    </div>
  </div>
);

const ZoeLifestyle = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [inputType, setInputType] = useState<"url" | "select" | "action" | "edit" | null>(null);
  
  // Core state
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isCompositing, setIsCompositing] = useState(false);
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isUpscaled, setIsUpscaled] = useState(false);
  const [currentAspectRatio, setCurrentAspectRatio] = useState<"16:9" | "1:1" | "9:16" | "custom">("16:9");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [productName, setProductName] = useState("");
  const [productDimensions, setProductDimensions] = useState<{ width?: string; height?: string; depth?: string; raw?: string } | null>(null);
  const [tvMountInfo, setTvMountInfo] = useState<{ mountType: string | null; isTV: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // QR code dialog state
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isWaitingForMobile, setIsWaitingForMobile] = useState(false);
  
  // Edit prompt state
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Feedback dialog state
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  // Initialize chat with greeting
  useEffect(() => {
    const greeting: ChatMessage = {
      id: "greeting",
      type: "anita",
      content: "Hi there! I'm Anita. 🎨\nI can transform your product images into beautiful lifestyle images.\n\nCould you share the PDP URL of the product you'd like to transform?",
      timestamp: new Date(),
    };
    setMessages([greeting]);
    
    // Show URL input after greeting animation
    setTimeout(() => {
      setShowInput(true);
      setInputType("url");
    }, 2000);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showInput]);

  // Create a snapshot of current state
  const createSnapshot = (): StateSnapshot => ({
    url,
    carouselImages,
    selectedImage,
    generatedImage,
    generatedVideoUrl,
    isUpscaled,
    currentAspectRatio,
    productName,
    productDimensions,
    tvMountInfo,
    showInput,
    inputType,
  });

  // Revert to a specific message
  const handleRevertToMessage = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const targetMessage = messages[messageIndex];
    
    // Restore state from snapshot
    if (targetMessage.snapshot) {
      setUrl(targetMessage.snapshot.url);
      setCarouselImages(targetMessage.snapshot.carouselImages);
      setSelectedImage(targetMessage.snapshot.selectedImage);
      setGeneratedImage(targetMessage.snapshot.generatedImage);
      setGeneratedVideoUrl(targetMessage.snapshot.generatedVideoUrl);
      setIsUpscaled(targetMessage.snapshot.isUpscaled);
      setCurrentAspectRatio(targetMessage.snapshot.currentAspectRatio);
      setProductName(targetMessage.snapshot.productName);
      setProductDimensions(targetMessage.snapshot.productDimensions);
      setTvMountInfo(targetMessage.snapshot.tvMountInfo);
      setShowInput(targetMessage.snapshot.showInput);
      setInputType(targetMessage.snapshot.inputType);
    }

    // Remove messages after this point
    setMessages(prev => prev.slice(0, messageIndex + 1));
    
    toast.success("Reverted to this point");
  };

  const addMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
      snapshot: createSnapshot(), // Save state snapshot with each message
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  // Extract country code from URL
  const extractCountryFromUrl = (pdpUrl: string): string | null => {
    try {
      const urlObj = new URL(pdpUrl);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const countryCode = pathParts[0].toLowerCase();
        const countryMap: Record<string, string> = {
          'us': 'United States', 'kr': 'South Korea', 'de': 'Germany', 'uk': 'United Kingdom',
          'gb': 'United Kingdom', 'fr': 'France', 'it': 'Italy', 'es': 'Spain', 'br': 'Brazil',
          'mx': 'Mexico', 'au': 'Australia', 'in': 'India', 'jp': 'Japan', 'cn': 'China',
          'tw': 'Taiwan', 'hk': 'Hong Kong', 'sg': 'Singapore', 'my': 'Malaysia', 'th': 'Thailand',
          'id': 'Indonesia', 'ph': 'Philippines', 'vn': 'Vietnam', 'nl': 'Netherlands', 'be': 'Belgium',
          'at': 'Austria', 'ch': 'Switzerland', 'pl': 'Poland', 'se': 'Sweden', 'no': 'Norway',
          'dk': 'Denmark', 'fi': 'Finland', 'pt': 'Portugal', 'ru': 'Russia', 'tr': 'Turkey',
          'ae': 'United Arab Emirates', 'sa': 'Saudi Arabia', 'za': 'South Africa', 'ca': 'Canada',
          'ar': 'Argentina', 'cl': 'Chile', 'co': 'Colombia', 'pe': 'Peru', 'nz': 'New Zealand',
        };
        if (countryMap[countryCode]) return countryMap[countryCode];
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleUrlSubmit = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    // Add user message
    addMessage({ type: "user", content: url });
    setShowInput(false);
    setInputType(null);

    // Add Anita's response
    setTimeout(() => {
      addMessage({ type: "anita", content: "Great! Let me check the URL... Please wait a moment. ✨" });
    }, 300);

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("anita-extract-carousel", {
        body: { url },
      });

      if (error) throw error;
      if (!data.success || !data.images || data.images.length === 0) {
        addMessage({ type: "anita", content: "Oops, I couldn't find any product images from this URL. 😅\nCould you try another URL?" });
        setShowInput(true);
        setInputType("url");
        return;
      }

      setCarouselImages(data.images);
      setProductName(data.productName || "product");
      setProductDimensions(data.productDimensions || null);
      setTvMountInfo(data.tvMountInfo || null);

      const dimensionInfo = data.productDimensions?.raw ? `\n(Product dimensions: ${data.productDimensions.raw})` : '';
      const tvMountNote = data.tvMountInfo?.isTV && data.tvMountInfo?.mountType 
        ? `\n📺 TV Mount Type: ${data.tvMountInfo.mountType === 'stand' ? 'Stand Version' : 'Wall-mount Version'}` 
        : '';
      
      setTimeout(() => {
        addMessage({ 
          type: "anita", 
          content: `I found ${data.images.length} product images! 🎉${dimensionInfo}${tvMountNote}\n\nWhich image would you like me to use for the lifestyle image? Please select one below!` 
        });
        
        setTimeout(() => {
          setShowInput(true);
          setInputType("select");
        }, 1500);
      }, 500);
      
    } catch (error) {
      console.error("Error extracting images:", error);
      addMessage({ type: "anita", content: "An error occurred while analyzing the URL. 😢\nWould you like to try another URL?" });
      setShowInput(true);
      setInputType("url");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (img: string) => {
    setSelectedImage(img);
  };

  const handleImageConfirm = () => {
    if (!selectedImage) {
      toast.error("Please select an image");
      return;
    }

    // Add user selection message
    addMessage({ type: "user", content: "I'll go with this image!" });
    setShowInput(false);
    setInputType(null);

    setTimeout(() => {
      addMessage({ 
        type: "anita", 
        content: "Great choice! 👍\n\nWhat would you like me to do?\n• AI Lifestyle Generation - AI will create a beautiful background\n• Use My Photo - Composite onto your own photo" 
      });
      
      setTimeout(() => {
        setShowInput(true);
        setInputType("action");
      }, 1500);
    }, 300);
  };

  const handleGenerateLifestyle = async () => {
    addMessage({ type: "user", content: "Generate an AI lifestyle image!" });
    setShowInput(false);
    setInputType(null);

    setTimeout(() => {
      addMessage({ type: "anita", content: "Got it! AI is working hard on this... 🎨\nIt takes about 30 seconds. Please wait!" });
    }, 300);

    setIsGenerating(true);
    setIsUpscaled(false);
    setGeneratedVideoUrl(null);
    
    try {
      const country = extractCountryFromUrl(url);
      
      const { data, error } = await supabase.functions.invoke("anita-generate-lifestyle", {
        body: { imageUrl: selectedImage, aspectRatio: "16:9", country, productDimensions, tvMountInfo },
      });

      if (error) throw error;
      if (!data.success || !data.imageBase64) {
        throw new Error(data.error || "Failed to generate lifestyle image");
      }

      setGeneratedImage(`data:image/png;base64,${data.imageBase64}`);
      setCurrentAspectRatio("16:9");
      
      setTimeout(() => {
        addMessage({ 
          type: "anita", 
          content: "All done! ✨\nHow does it look? If you like it, download it. If you need any changes, select an option below!" 
        });
        
        setTimeout(() => {
          setShowInput(true);
          setInputType("edit");
        }, 1500);
      }, 500);
      
    } catch (error) {
      console.error("Error generating lifestyle image:", error);
      addMessage({ type: "anita", content: "An error occurred while generating the image. 😢\nWould you like to try again?" });
      setShowInput(true);
      setInputType("action");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCameraClick = async () => {
    addMessage({ type: "user", content: "Composite onto my photo!" });
    setShowInput(false);
    
    if (isMobile) {
      fileInputRef.current?.click();
    } else {
      const newSessionId = Math.random().toString(36).substring(2, 15);
      setSessionId(newSessionId);
      setShowQRDialog(true);
      setIsWaitingForMobile(true);
      
      addMessage({ type: "anita", content: "Scan the QR code with your smartphone to take a photo! 📱" });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedImage) return;

    addMessage({ type: "anita", content: "Got your photo! Compositing the product... 🔧\nThis may take about a minute." });
    
    setIsCompositing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const backgroundBase64 = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke("anita-photo-composite", {
          body: { 
            productImageUrl: selectedImage,
            backgroundImageBase64: backgroundBase64 
          },
        });

        if (error) throw error;
        if (!data.success || !data.imageBase64) {
          throw new Error(data.error || "Composite failed");
        }

        setGeneratedImage(`data:image/png;base64,${data.imageBase64}`);
        setCurrentAspectRatio("custom");
        
        addMessage({ type: "anita", content: "Composite complete! 🎉\nThe product fits naturally into your photo. What do you think?" });
        setShowInput(true);
        setInputType("edit");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error compositing:", error);
      addMessage({ type: "anita", content: "An error occurred during compositing. 😢\nWould you like to try again?" });
      setShowInput(true);
      setInputType("action");
    } finally {
      setIsCompositing(false);
    }
  };

  // QR dialog subscription effect
  useEffect(() => {
    if (!sessionId || !showQRDialog) return;

    const channel = supabase.channel(`anita-camera-${sessionId}`);

    channel
      .on("broadcast", { event: "photo-result" }, async (payload) => {
        const { compositeBase64 } = payload.payload;
        
        if (compositeBase64) {
          setGeneratedImage(`data:image/png;base64,${compositeBase64}`);
          setCurrentAspectRatio("custom");
          setShowQRDialog(false);
          setIsWaitingForMobile(false);
          
          addMessage({ type: "anita", content: "Composite complete with the photo from your mobile! 📱✨" });
          setShowInput(true);
          setInputType("edit");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, showQRDialog]);

  const handleUpscale = async () => {
    if (!generatedImage) return;
    
    addMessage({ type: "user", content: "Upscale to 4K!" });
    setShowInput(false);
    
    addMessage({ type: "anita", content: "Upscaling to 4K high resolution... 🔍\nThis takes about 30 seconds!" });
    
    setIsUpscaling(true);
    try {
      const { data, error } = await supabase.functions.invoke("anita-upscale", {
        body: { imageBase64: generatedImage },
      });

      if (error) throw error;
      if (!data.success || !data.imageBase64) {
        throw new Error(data.error || "Upscale failed");
      }

      setGeneratedImage(`data:image/png;base64,${data.imageBase64}`);
      setIsUpscaled(true);
      
      addMessage({ type: "anita", content: "4K upscale complete! 🎉\nYou can now download the ultra-high resolution image." });
      setShowInput(true);
      setInputType("edit");
    } catch (error) {
      console.error("Error upscaling:", error);
      addMessage({ type: "anita", content: "An error occurred during upscaling. 😢" });
      setShowInput(true);
      setInputType("edit");
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleResize = async (ratio: "16:9" | "1:1" | "9:16") => {
    if (!generatedImage || currentAspectRatio === ratio) return;
    
    const ratioLabels = { "16:9": "Landscape (16:9)", "1:1": "Square (1:1)", "9:16": "Portrait (9:16)" };
    addMessage({ type: "user", content: `Change to ${ratioLabels[ratio]}!` });
    setShowInput(false);
    
    addMessage({ type: "anita", content: `Resizing to ${ratioLabels[ratio]}... 📐` });
    
    setIsResizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("anita-resize-lifestyle", {
        body: { imageBase64: generatedImage.split(',')[1], aspectRatio: ratio },
      });

      if (error) throw error;
      if (!data.success || !data.imageBase64) {
        throw new Error(data.error || "Resize failed");
      }

      setGeneratedImage(`data:image/png;base64,${data.imageBase64}`);
      setCurrentAspectRatio(ratio);
      setIsUpscaled(false);
      
      addMessage({ type: "anita", content: "Resize complete! ✂️\nCreated the image with the new aspect ratio." });
      setShowInput(true);
      setInputType("edit");
    } catch (error) {
      console.error("Error resizing:", error);
      addMessage({ type: "anita", content: "An error occurred during resizing. 😢" });
      setShowInput(true);
      setInputType("edit");
    } finally {
      setIsResizing(false);
    }
  };

  const handleEditImage = async () => {
    if (!generatedImage || !editPrompt.trim()) return;
    
    addMessage({ type: "user", content: `Edit the image: "${editPrompt}"` });
    setShowInput(false);
    const currentPrompt = editPrompt;
    setEditPrompt("");
    
    addMessage({ type: "anita", content: "Editing the image as requested... ✏️\nThis takes about 30 seconds!" });
    
    setIsEditing(true);
    try {
      const { data, error } = await supabase.functions.invoke("anita-edit-lifestyle", {
        body: { imageBase64: generatedImage, editPrompt: currentPrompt },
      });

      if (error) throw error;
      if (!data.success || !data.imageBase64) {
        throw new Error(data.error || "Edit failed");
      }

      setGeneratedImage(`data:image/png;base64,${data.imageBase64}`);
      setIsUpscaled(false);
      
      addMessage({ type: "anita", content: "Edit complete! 🎨\nI've made the changes you requested. How does it look?" });
      setShowInput(true);
      setInputType("edit");
    } catch (error) {
      console.error("Error editing:", error);
      addMessage({ type: "anita", content: "An error occurred while editing the image. 😢\nWould you like to try again?" });
      setShowInput(true);
      setInputType("edit");
    } finally {
      setIsEditing(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!generatedImage) return;
    
    addMessage({ type: "user", content: "Create a video!" });
    setShowInput(false);
    
    addMessage({ type: "anita", content: "Converting the image to video... 🎬\nThis may take 2-3 minutes. Please wait!" });
    
    setGeneratedVideoUrl(null);
    setIsGeneratingVideo(true);
    try {
      const { data, error } = await supabase.functions.invoke("anita-generate-video", {
        body: { imageBase64: generatedImage },
      });

      if (error) throw error;
      if (!data.success || !data.videoUrl) {
        throw new Error(data.error || "Video generation failed");
      }

      setGeneratedVideoUrl(data.videoUrl);
      
      addMessage({ type: "anita", content: "Video generation complete! 🎉\nYou can preview and download the video below." });
      setShowInput(true);
      setInputType("edit");
    } catch (error) {
      console.error("Error generating video:", error);
      addMessage({ type: "anita", content: "An error occurred during video generation. 😢\nPlease try again later." });
      setShowInput(true);
      setInputType("edit");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleRegenerate = async () => {
    addMessage({ type: "user", content: "Generate a different style!" });
    setShowInput(false);
    
    await handleGenerateLifestyle();
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const sizeStr = isUpscaled ? "3840x2160" : (currentAspectRatio === "1:1" ? "1080x1080" : currentAspectRatio === "9:16" ? "1080x1920" : "1920x1080");
    const safeName = productName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);
    
    link.download = `Anita_${safeName}_${dateStr}_${sizeStr}.png`;
    link.href = generatedImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addMessage({ type: "anita", content: "Download complete! 📥\nLet me know if you need anything else." });
  };

  const handleDownloadVideo = () => {
    if (!generatedVideoUrl) return;
    
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const safeName = productName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);
    
    link.download = `Anita_${safeName}_${dateStr}_video.mp4`;
    link.href = generatedVideoUrl;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartOver = () => {
    setUrl("");
    setCarouselImages([]);
    setSelectedImage(null);
    setGeneratedImage(null);
    setGeneratedVideoUrl(null);
    setIsUpscaled(false);
    setMessages([]);
    setShowInput(false);
    setInputType(null);
    
    // Restart conversation
    setTimeout(() => {
      addMessage({
        type: "anita",
        content: "Shall we create a new image? 🎨\nPlease share the product PDP URL!",
      });
      setTimeout(() => {
        setShowInput(true);
        setInputType("url");
      }, 1500);
    }, 300);
  };

  const getQRCodeUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/zoe-camera/${sessionId}`;
  };

  const isAnyLoading = isLoading || isGenerating || isUpscaling || isResizing || isEditing || isCompositing || isGeneratingVideo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8D5E0] via-[#F0E6E8] to-[#E8D5E0] flex flex-col items-center justify-center p-4">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          size="sm"
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Feedback Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFeedbackDialog(true)}
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Chat Box */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "85vh" }}>
        {/* Header inside box */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <img
            src="/lovable-uploads/anita-profile.png"
            alt="Anita"
            className="w-10 h-10 rounded-full border-2 border-purple-200 shadow-sm"
          />
          <div className="text-left">
            <p className="text-base font-semibold text-gray-800">Anita</p>
            <p className="text-xs text-gray-500">Lifestyle Artist</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ minHeight: "300px" }}>
          {messages.map((msg, index) => (
            <div key={msg.id} className="group relative">
              {msg.type === "anita" ? (
                <AnitaMessage content={msg.content} showTyping={false} />
              ) : msg.type === "user" ? (
                <UserMessage content={msg.content} />
              ) : null}
              
              {/* Revert button - show on hover for messages after the first one */}
              {index > 0 && !isAnyLoading && (
                <button
                  onClick={() => handleRevertToMessage(msg.id)}
                  className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full p-1.5 shadow-sm border border-gray-200"
                  title="Revert to this point"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          
          {/* Loading indicator */}
          {isAnyLoading && (
            <div className="flex gap-3 items-start">
              <img
                src="/lovable-uploads/anita-profile.png"
                alt="Anita"
                className="w-10 h-10 rounded-full border-2 border-white shadow-md flex-shrink-0"
              />
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  <span className="text-sm text-gray-500">Working...</span>
                </div>
              </div>
            </div>
          )}

          {/* Generated Image Preview */}
          {generatedImage && !isGenerating && (
            <div className="flex gap-3 items-start">
              <img
                src="/lovable-uploads/anita-profile.png"
                alt="Anita"
                className="w-10 h-10 rounded-full border-2 border-white shadow-md flex-shrink-0"
              />
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-2 shadow-sm max-w-[90%]">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="rounded-lg max-w-full h-auto"
                />
                {isUpscaled && (
                  <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">4K</span>
                )}
              </div>
            </div>
          )}

          {/* Generated Video Preview */}
          {generatedVideoUrl && !isGeneratingVideo && (
            <div className="flex gap-3 items-start">
              <img
                src="/lovable-uploads/anita-profile.png"
                alt="Anita"
                className="w-10 h-10 rounded-full border-2 border-white shadow-md flex-shrink-0"
              />
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-2 shadow-sm max-w-[90%]">
                <video
                  src={generatedVideoUrl}
                  controls
                  className="rounded-lg max-w-full h-auto"
                />
                <Button
                  onClick={handleDownloadVideo}
                  size="sm"
                  className="mt-2 bg-indigo-500 hover:bg-indigo-600"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download Video
                </Button>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Area - inside the box */}
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          {/* URL Input */}
          {showInput && inputType === "url" && (
            <div className="flex gap-2">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter PDP URL..."
                className="flex-1 bg-white"
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
              />
              <Button
                onClick={handleUrlSubmit}
                disabled={isLoading || !url}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {/* Image Selection */}
          {showInput && inputType === "select" && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {carouselImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleImageSelect(img)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img ? "border-purple-500 ring-2 ring-purple-300" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img src={img} alt={`Product ${idx + 1}`} className="w-full h-16 object-contain bg-white" />
                    {selectedImage === img && (
                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-purple-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button
                onClick={handleImageConfirm}
                disabled={!selectedImage}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                Select This Image
              </Button>
            </div>
          )}

          {/* Action Selection */}
          {showInput && inputType === "action" && (
            <div className="flex gap-2 flex-wrap justify-center">
              <Button onClick={handleGenerateLifestyle} disabled={isAnyLoading} className="bg-purple-500 hover:bg-purple-600">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Lifestyle Generation
              </Button>
              <Button onClick={handleCameraClick} disabled={isAnyLoading} variant="outline" className="border-teal-300 text-teal-600">
                <Camera className="w-4 h-4 mr-2" />
                Use My Photo
              </Button>
            </div>
          )}

          {/* Edit Options */}
          {showInput && inputType === "edit" && (
            <div className="space-y-3">
              {/* Edit prompt */}
              <div className="flex gap-2">
                <Input
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Enter your edit request..."
                  className="flex-1 bg-white"
                  onKeyDown={(e) => e.key === "Enter" && editPrompt.trim() && handleEditImage()}
                />
                <Button
                  onClick={handleEditImage}
                  disabled={isAnyLoading || !editPrompt.trim()}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Quick actions */}
              <div className="flex gap-2 flex-wrap justify-center">
                <Button onClick={handleDownload} disabled={isAnyLoading} size="sm" className="bg-purple-500 hover:bg-purple-600">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                {!isUpscaled && (
                  <Button onClick={handleUpscale} disabled={isAnyLoading} size="sm" variant="outline">
                    <ZoomIn className="w-3 h-3 mr-1" />
                    4K Upscale
                  </Button>
                )}
                <Button onClick={handleRegenerate} disabled={isAnyLoading} size="sm" variant="outline">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
                <Button onClick={handleGenerateVideo} disabled={isAnyLoading} size="sm" variant="outline">
                  <Film className="w-3 h-3 mr-1" />
                  Video
                </Button>
              </div>

              {/* Resize options */}
              <div className="flex gap-2 justify-center items-center">
                <span className="text-xs text-gray-500">Ratio:</span>
                <Button 
                  size="sm" 
                  variant={currentAspectRatio === "16:9" ? "default" : "outline"} 
                  onClick={() => handleResize("16:9")}
                  disabled={isAnyLoading || currentAspectRatio === "16:9"}
                  className={currentAspectRatio === "16:9" ? "bg-purple-500 text-xs h-7" : "text-xs h-7"}
                >
                  <RectangleHorizontal className="w-3 h-3 mr-1" />16:9
                </Button>
                <Button 
                  size="sm" 
                  variant={currentAspectRatio === "1:1" ? "default" : "outline"} 
                  onClick={() => handleResize("1:1")}
                  disabled={isAnyLoading || currentAspectRatio === "1:1"}
                  className={currentAspectRatio === "1:1" ? "bg-purple-500 text-xs h-7" : "text-xs h-7"}
                >
                  <Square className="w-3 h-3 mr-1" />1:1
                </Button>
                <Button 
                  size="sm" 
                  variant={currentAspectRatio === "9:16" ? "default" : "outline"} 
                  onClick={() => handleResize("9:16")}
                  disabled={isAnyLoading || currentAspectRatio === "9:16"}
                  className={currentAspectRatio === "9:16" ? "bg-purple-500 text-xs h-7" : "text-xs h-7"}
                >
                  <RectangleVertical className="w-3 h-3 mr-1" />9:16
                </Button>
              </div>

              {/* Start over */}
              <div className="flex justify-center">
                <Button onClick={handleStartOver} size="sm" variant="ghost" className="text-gray-500">
                  Start Over
                </Button>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Take Photo on Mobile
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your smartphone to take a photo
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-4">
            {sessionId && (
              <div className="bg-white p-4 rounded-lg shadow-inner">
                <QRCodeSVG value={getQRCodeUrl()} size={200} />
              </div>
            )}
            {isWaitingForMobile && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Waiting for mobile connection...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        crewName="Anita"
        productUrls={[url].filter(Boolean)}
      />
    </div>
  );
};

export default ZoeLifestyle;