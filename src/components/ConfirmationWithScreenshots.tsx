import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, MessageCircle } from "lucide-react";
import BenFeedbackDialog from "./BenFeedbackDialog";

interface FormData {
  mainProductUrl: string;
  secondProductUrl: string;
  mainEnergyLabel?: string;
  secondEnergyLabel?: string;
}

interface ConfirmationWithScreenshotsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onGoBack: () => void;
  onSubmit: () => void;
  onReset?: () => void;
}

const ConfirmationWithScreenshots = ({ 
  formData, 
  onGoBack, 
  onSubmit,
  onReset 
}: ConfirmationWithScreenshotsProps) => {
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [secondImage, setSecondImage] = useState<string | null>(null);
  const [isLoadingMain, setIsLoadingMain] = useState(true);
  const [isLoadingSecond, setIsLoadingSecond] = useState(true);
  const [mainError, setMainError] = useState<string | null>(null);
  const [secondError, setSecondError] = useState<string | null>(null);
  
  // Size category state (L = Large, M = Medium, S = Small)
  const [mainSizeCategory, setMainSizeCategory] = useState<'L' | 'M' | 'S'>('M');
  const [secondSizeCategory, setSecondSizeCategory] = useState<'L' | 'M' | 'S'>('M');
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [pcImage, setPcImage] = useState<string | null>(null);
  const [mobileImage, setMobileImage] = useState<string | null>(null);
  
  // Background removed images state
  const [bgRemovedMain, setBgRemovedMain] = useState<string | null>(null);
  const [bgRemovedSecond, setBgRemovedSecond] = useState<string | null>(null);
  const [showBgRemovedPreview, setShowBgRemovedPreview] = useState(false);
  
  // Feedback dialog state
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  
  // Calculate scale ratios based on size categories
  const getScaleRatios = (
    mainSize: 'L' | 'M' | 'S', 
    secondSize: 'L' | 'M' | 'S'
  ): { mainScale: number; secondScale: number } => {
    const sizeValue = { L: 3, M: 2, S: 1 };
    const mainVal = sizeValue[mainSize];
    const secondVal = sizeValue[secondSize];
    
    if (mainVal === secondVal) {
      // Same size = equal display
      return { mainScale: 1.0, secondScale: 1.0 };
    } else if (mainVal > secondVal) {
      // Main is larger, scale down second
      // L-M: 0.75, L-S: 0.55, M-S: 0.7
      const ratioMap: Record<string, number> = {
        '3-2': 0.75,  // L-M
        '3-1': 0.55,  // L-S
        '2-1': 0.70,  // M-S
      };
      const key = `${mainVal}-${secondVal}`;
      return { mainScale: 1.0, secondScale: ratioMap[key] || 0.7 };
    } else {
      // Second is larger, scale down main
      const ratioMap: Record<string, number> = {
        '2-3': 0.75,  // M-L
        '1-3': 0.55,  // S-L
        '1-2': 0.70,  // S-M
      };
      const key = `${mainVal}-${secondVal}`;
      return { mainScale: ratioMap[key] || 0.7, secondScale: 1.0 };
    }
  };

  useEffect(() => {
    const extractImage = async (
      url: string, 
      setImage: (url: string | null) => void, 
      setLoading: (loading: boolean) => void, 
      setError: (error: string | null) => void,
      setSizeCategory: (size: 'L' | 'M' | 'S') => void
    ) => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase.functions.invoke('ben-extract-images', {
          body: { url },
        });

        if (error) {
          console.error('Error extracting image:', error);
          setError('Failed to extract image');
          return;
        }

        if (data.success && data.imageUrl) {
          setImage(data.imageUrl);
          setSizeCategory(data.sizeCategory || 'M');
          console.log(`Extracted image with size category: ${data.sizeCategory}`);
        } else {
          setError('No product image found');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to extract image');
      } finally {
        setLoading(false);
      }
    };

    if (formData.mainProductUrl) {
      extractImage(formData.mainProductUrl, setMainImage, setIsLoadingMain, setMainError, setMainSizeCategory);
    }
    if (formData.secondProductUrl) {
      extractImage(formData.secondProductUrl, setSecondImage, setIsLoadingSecond, setSecondError, setSecondSizeCategory);
    }
  }, [formData.mainProductUrl, formData.secondProductUrl]);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Crop transparent pixels from image and return trimmed base64
  const cropTransparentPixels = async (imageSrc: string): Promise<string> => {
    console.log('Starting crop transparent pixels...');
    const img = await loadImage(imageSrc);
    console.log(`Original image size: ${img.width}x${img.height}`);
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let hasVisiblePixels = false;
    
    // Find bounding box of non-transparent pixels (alpha > 20 for better detection)
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const alpha = data[idx + 3];
        // Check if pixel is visible (not fully transparent)
        if (alpha > 20) {
          hasVisiblePixels = true;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    console.log(`Bounding box found: (${minX}, ${minY}) to (${maxX}, ${maxY})`);
    
    // If no visible pixels found, return original
    if (!hasVisiblePixels || minX >= maxX || minY >= maxY) {
      console.log('No visible pixels found or invalid bounds, returning original');
      return imageSrc;
    }
    
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    
    console.log(`Cropping to: ${cropWidth}x${cropHeight} (removed ${img.width - cropWidth}x${img.height - cropHeight} transparent area)`);
    
    // Create cropped canvas
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    const croppedCtx = croppedCanvas.getContext('2d')!;
    
    croppedCtx.drawImage(
      canvas,
      minX, minY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    return croppedCanvas.toDataURL('image/png');
  };

  const createCompositeImage = async (
    mainImgSrc: string,
    secondImgSrc: string,
    width: number,
    height: number,
    mainScale: number = 1.0,
    secondScale: number = 1.0
  ): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // Load images
    const [mainImg, secondImg] = await Promise.all([
      loadImage(mainImgSrc),
      loadImage(secondImgSrc),
    ]);
    
    // Layout settings with safe margins
    const isPBP = width === 2010;
    const plusSize = isPBP ? 120 : 40;
    const safeMargin = isPBP ? 120 : 40;
    const plusGap = isPBP ? 40 : 15;
    
    // Determine layout for 450x450 based on product image orientation
    const mainIsLandscape = mainImg.width > mainImg.height;
    const secondIsLandscape = secondImg.width > secondImg.height;
    const useVerticalLayout = !isPBP && mainIsLandscape && secondIsLandscape;
    
    console.log(`Creating composite: mainScale=${mainScale}, secondScale=${secondScale}`);
    
    if (useVerticalLayout) {
      // Vertical layout: images stacked top-bottom with + in center
      const plusAreaHeight = plusSize + plusGap * 2;
      const availableHeight = height - (safeMargin * 2) - plusAreaHeight;
      const imgAreaHeight = availableHeight / 2;
      const imgAreaWidth = width - (safeMargin * 2);
      
      const mainRatio = mainImg.width / mainImg.height;
      const secondRatio = secondImg.width / secondImg.height;
      
      // Scale main image
      let mainDrawWidth = imgAreaWidth;
      let mainDrawHeight = mainDrawWidth / mainRatio;
      if (mainDrawHeight > imgAreaHeight) {
        mainDrawHeight = imgAreaHeight;
        mainDrawWidth = mainDrawHeight * mainRatio;
      }
      // Apply size category scale
      mainDrawWidth *= mainScale;
      mainDrawHeight *= mainScale;
      
      // Scale second image
      let secondDrawWidth = imgAreaWidth;
      let secondDrawHeight = secondDrawWidth / secondRatio;
      if (secondDrawHeight > imgAreaHeight) {
        secondDrawHeight = imgAreaHeight;
        secondDrawWidth = secondDrawHeight * secondRatio;
      }
      // Apply size category scale
      secondDrawWidth *= secondScale;
      secondDrawHeight *= secondScale;
      
      // Center each image within its respective half area (top and bottom)
      const topAreaStart = safeMargin;
      const mainX = (width - mainDrawWidth) / 2;
      const mainY = topAreaStart + (imgAreaHeight - mainDrawHeight) / 2;
      
      const bottomAreaStart = height - safeMargin - imgAreaHeight;
      const secondX = (width - secondDrawWidth) / 2;
      const secondY = bottomAreaStart + (imgAreaHeight - secondDrawHeight) / 2;
      
      ctx.drawImage(mainImg, mainX, mainY, mainDrawWidth, mainDrawHeight);
      ctx.drawImage(secondImg, secondX, secondY, secondDrawWidth, secondDrawHeight);
      
      // Draw + sign in center
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${plusSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', width / 2, height / 2);
    } else {
      // Horizontal layout: images side-by-side (default for PBP and non-landscape pairs)
      const plusAreaWidth = plusSize + plusGap * 2;
      const availableWidth = width - (safeMargin * 2) - plusAreaWidth;
      const imgAreaWidth = availableWidth / 2;
      const imgAreaHeight = height - (safeMargin * 2);
      
      const mainRatio = mainImg.width / mainImg.height;
      const secondRatio = secondImg.width / secondImg.height;
      
      let mainDrawWidth = imgAreaWidth;
      let mainDrawHeight = mainDrawWidth / mainRatio;
      if (mainDrawHeight > imgAreaHeight) {
        mainDrawHeight = imgAreaHeight;
        mainDrawWidth = mainDrawHeight * mainRatio;
      }
      // Apply size category scale
      mainDrawWidth *= mainScale;
      mainDrawHeight *= mainScale;
      
      let secondDrawWidth = imgAreaWidth;
      let secondDrawHeight = secondDrawWidth / secondRatio;
      if (secondDrawHeight > imgAreaHeight) {
        secondDrawHeight = imgAreaHeight;
        secondDrawWidth = secondDrawHeight * secondRatio;
      }
      // Apply size category scale
      secondDrawWidth *= secondScale;
      secondDrawHeight *= secondScale;
      
      // Center each image within its respective half area
      const leftAreaStart = safeMargin;
      const mainX = leftAreaStart + (imgAreaWidth - mainDrawWidth) / 2;
      const mainY = (height - mainDrawHeight) / 2;
      
      const rightAreaStart = width - safeMargin - imgAreaWidth;
      const secondX = rightAreaStart + (imgAreaWidth - secondDrawWidth) / 2;
      const secondY = (height - secondDrawHeight) / 2;
      
      ctx.drawImage(mainImg, mainX, mainY, mainDrawWidth, mainDrawHeight);
      ctx.drawImage(secondImg, secondX, secondY, secondDrawWidth, secondDrawHeight);
      
      // Draw + sign in center
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${plusSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', width / 2, height / 2);
    }
    
    return canvas.toDataURL('image/png');
  };

  const handleConfirmAndProcess = async () => {
    if (!mainImage || !secondImage) return;
    
    setIsProcessing(true);
    setProcessingStatus('Removing backgrounds...');
    
    try {
      // Step 1: Remove backgrounds using Fotor API
      const { data, error } = await supabase.functions.invoke('ben-process-images', {
        body: { 
          mainImageUrl: mainImage,
          secondImageUrl: secondImage,
        },
      });

      if (error || !data.success) {
        console.error('Error processing images:', error || data.error);
        setProcessingStatus('Failed to remove backgrounds. Using original images...');
        // Fall back to cropping original images
        setProcessingStatus('Scaling product images to fit...');
        const croppedMain = await cropTransparentPixels(mainImage);
        const croppedSecond = await cropTransparentPixels(secondImage);
        setBgRemovedMain(croppedMain);
        setBgRemovedSecond(croppedSecond);
        setShowBgRemovedPreview(true);
        setIsProcessing(false);
        return;
      }

      // Step 2: Scale to fit product images (crop transparent areas)
      setProcessingStatus('Scaling product images to fit...');
      const croppedMain = await cropTransparentPixels(data.mainImage);
      const croppedSecond = await cropTransparentPixels(data.secondImage);
      
      // Store cropped images and show preview
      setBgRemovedMain(croppedMain);
      setBgRemovedSecond(croppedSecond);
      setShowBgRemovedPreview(true);
      setIsProcessing(false);
      
    } catch (err) {
      console.error('Error:', err);
      setProcessingStatus('Error occurred.');
      setIsProcessing(false);
    }
  };

  const handleGenerateComposite = async () => {
    if (!bgRemovedMain || !bgRemovedSecond) return;
    
    setIsProcessing(true);
    
    try {
      // Get scale ratios based on product size categories
      const { mainScale, secondScale } = getScaleRatios(mainSizeCategory, secondSizeCategory);
      console.log(`Size categories: Main=${mainSizeCategory}, Second=${secondSizeCategory}`);
      console.log(`Scale ratios: Main=${mainScale}, Second=${secondScale}`);
      
      // Step 3: Analyze and place images in correct layout with size scaling
      setProcessingStatus('Analyzing layout and compositing...');
      const pcDataUrl = await createCompositeImage(bgRemovedMain, bgRemovedSecond, 2010, 1334, mainScale, secondScale);
      setPcImage(pcDataUrl);
      const mobileDataUrl = await createCompositeImage(bgRemovedMain, bgRemovedSecond, 450, 450, mainScale, secondScale);
      setMobileImage(mobileDataUrl);
      
      // Step 4: Finalizing
      setProcessingStatus('Finalizing...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStatus('✅ Complete!');
      setShowBgRemovedPreview(false);
      setIsProcessing(false);
      
    } catch (err) {
      console.error('Error creating composite images:', err);
      setProcessingStatus('Failed to create images');
      setIsProcessing(false);
    }
  };

  const createFinalImages = async (mainSrc: string, secondSrc: string) => {
    try {
      setProcessingStatus('Scaling product images to fit...');
      const croppedMain = await cropTransparentPixels(mainSrc);
      const croppedSecond = await cropTransparentPixels(secondSrc);
      
      setProcessingStatus('Analyzing layout and compositing...');
      const pcDataUrl = await createCompositeImage(croppedMain, croppedSecond, 2010, 1334);
      setPcImage(pcDataUrl);
      const mobileDataUrl = await createCompositeImage(croppedMain, croppedSecond, 450, 450);
      setMobileImage(mobileDataUrl);
      
      setProcessingStatus('Finalizing...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStatus('✅ Complete!');
      setIsProcessing(false);
    } catch (err) {
      console.error('Error creating composite images:', err);
      setProcessingStatus('Failed to create images');
      setIsProcessing(false);
    }
  };

  const getDateString = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show download UI if images are ready
  if (pcImage && mobileImage) {
    return (
      <div className="flex gap-3 mt-4 animate-fade-in">
        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 max-w-[95%] w-full">
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-4">
            ✅ Gallery Images Ready!
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">PBP (2010×1334)</p>
              <div className="border border-border rounded-lg overflow-hidden bg-white">
                <img src={pcImage} alt="PBP Gallery" className="w-full h-auto" />
              </div>
              <Button 
                onClick={() => downloadImage(pcImage, `${getDateString()}_2010x1334.png`)}
                className="w-full"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PBP
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-center">Home, Category, PLP, PDP, Compare, My LG, Search (450×450)</p>
              <div className="border border-border rounded-lg overflow-hidden bg-white">
                <img src={mobileImage} alt="Multi-purpose Gallery" className="w-full h-auto" />
              </div>
              <Button 
                onClick={() => downloadImage(mobileImage, `${getDateString()}_450x450.png`)}
                className="w-full"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          
          {/* Feedback section */}
          <div className="flex items-center justify-center gap-2 py-3 mb-3 border-t border-border">
            <span className="text-sm text-muted-foreground">결과물이 마음에 드셨나요?</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeedbackDialog(true)}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              피드백 남기기
            </Button>
          </div>
          
          <Button 
            variant="outline"
            onClick={() => {
              setPcImage(null);
              setMobileImage(null);
              setBgRemovedMain(null);
              setBgRemovedSecond(null);
              setShowBgRemovedPreview(false);
              if (onReset) {
                onReset();
              }
            }}
            className="w-full"
          >
            Create Another PTO Image
          </Button>
        </div>
        
        {/* Feedback Dialog */}
        <BenFeedbackDialog
          open={showFeedbackDialog}
          onOpenChange={setShowFeedbackDialog}
          crewName="Ben"
          productUrls={[formData.mainProductUrl, formData.secondProductUrl].filter(Boolean)}
        />
      </div>
    );
  }

  // Show background removed images preview
  if (showBgRemovedPreview && bgRemovedMain && bgRemovedSecond) {
    return (
      <div className="flex gap-3 mt-4 animate-fade-in">
        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 max-w-[95%] w-full">
          <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-4">
            🎨 Background Removed - Preview
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Main Product (Left)</p>
              <div className="aspect-square bg-[#f0f0f0] rounded-lg overflow-hidden flex items-center justify-center border border-border" style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
                <img 
                  src={bgRemovedMain} 
                  alt="Main product (BG removed)" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Second Product (Right)</p>
              <div className="aspect-square bg-[#f0f0f0] rounded-lg overflow-hidden flex items-center justify-center border border-border" style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
                <img 
                  src={bgRemovedSecond} 
                  alt="Second product (BG removed)" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Background removed and cropped to fit. Ready to generate composite images?
          </p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                setBgRemovedMain(null);
                setBgRemovedSecond(null);
                setShowBgRemovedPreview(false);
              }}
            >
              Back
            </Button>
            <Button 
              size="sm"
              onClick={handleGenerateComposite}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white flex-1"
            >
              Generate Composite Images
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show processing state
  if (isProcessing) {
    return (
      <div className="flex gap-3 mt-4 animate-fade-in">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 max-w-[95%] w-full text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium">{processingStatus}</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mt-4 animate-fade-in">
      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 max-w-[95%] w-full">
        <div className="space-y-3 text-sm">
          <div><strong>Main Product URL:</strong> <span className="text-xs text-muted-foreground break-all">{formData.mainProductUrl}</span></div>
          <div><strong>Second Product URL:</strong> <span className="text-xs text-muted-foreground break-all">{formData.secondProductUrl}</span></div>
        </div>

        {/* Image Previews */}
        <div className="mt-4">
          <p className="text-sm font-medium mb-3">Product Image Preview:</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Main Product Image */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Main Product (Left)</p>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-border">
                {isLoadingMain ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Extracting...</span>
                  </div>
                ) : mainError ? (
                  <span className="text-xs text-muted-foreground text-center px-2">{mainError}</span>
                ) : mainImage ? (
                  <img 
                    src={mainImage} 
                    alt="Main product" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No image</span>
                )}
              </div>
            </div>

            {/* Second Product Image */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Second Product (Right)</p>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-border">
                {isLoadingSecond ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Extracting...</span>
                  </div>
                ) : secondError ? (
                  <span className="text-xs text-muted-foreground text-center px-2">{secondError}</span>
                ) : secondImage ? (
                  <img 
                    src={secondImage} 
                    alt="Second product" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No image</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Is this information correct? Please confirm to proceed.
        </p>
        
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline"
            size="sm"
            onClick={onGoBack}
          >
            Edit Information
          </Button>
          <Button 
            size="sm"
            onClick={handleConfirmAndProcess}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            disabled={isLoadingMain || isLoadingSecond || !mainImage || !secondImage}
          >
            Confirm & Proceed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationWithScreenshots;
