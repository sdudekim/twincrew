import { supabase } from "@/integrations/supabase/client";

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal with Fotor API...');
    
    // Convert image to base64
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imageElement, 0, 0);
    
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    console.log('Image converted to base64, length:', base64.length);
    
    // Call edge function
    const { data, error } = await supabase.functions.invoke('fotor-background-removal', {
      body: { imageBase64: base64 },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to remove background');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    // Edge function returns base64 encoded result image
    const resultBase64 = data.imageBase64;
    if (!resultBase64) {
      console.error('Unexpected response:', data);
      throw new Error('No image returned from API');
    }

    console.log('Received result base64, length:', resultBase64.length);

    // Convert base64 back to blob
    const binaryString = atob(resultBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const resultBlob = new Blob([bytes], { type: 'image/png' });
    console.log('Background removal complete, blob size:', resultBlob.size);
    
    return resultBlob;
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
