import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, RotateCcw, Monitor, Smartphone, Download, X, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ScreenshotCropEditor } from "@/components/ScreenshotCropEditor";

interface Message {
  role: "user" | "assistant";
  content: string;
  screenshot?: string;
  pcScreenshot?: string;
  mobileScreenshot?: string;
}

const MaplePDP = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [cropEditorData, setCropEditorData] = useState<{
    pcScreenshot?: string;
    mobileScreenshot?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const isValidUrl = (text: string): boolean => {
    try {
      new URL(text.trim());
      return true;
    } catch {
      return false;
    }
  };

  const fetchPageContent = async (url: string, mode: string = "screenshot-both"): Promise<{ 
    pcScreenshot?: string;
    mobileScreenshot?: string;
  }> => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/maple-scrape`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ url, mode }),
      }
    );

    if (!response.ok) throw new Error("Failed to scrape page");

    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Scrape failed");

    return { 
      pcScreenshot: data.pcScreenshot,
      mobileScreenshot: data.mobileScreenshot,
    };
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    if (!isValidUrl(trimmedInput)) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Please enter a valid URL.\nExample: https://www.lg.com/us/product/..." },
      ]);
      return;
    }

    // Directly capture screenshots
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "Capturing PC & Mobile screenshots... 📸\nThis may take a moment." }]);

    try {
      const { pcScreenshot, mobileScreenshot } = await fetchPageContent(trimmedInput, "screenshot-both");
      
      if (pcScreenshot || mobileScreenshot) {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: `Screenshots captured! Click "Open Editor" to select and crop areas.`,
            pcScreenshot,
            mobileScreenshot,
          };
          return newMessages;
        });
      } else {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: "assistant", content: "Failed to capture screenshots. Please try again." };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "An error occurred. Please try again.", variant: "destructive" });
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
          newMessages[newMessages.length - 1] = { role: "assistant", content: "An error occurred. Please try again." };
        } else {
          newMessages.push({ role: "assistant", content: "An error occurred. Please try again." });
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setCropEditorData(null);
  };

  const handleDownloadScreenshot = (e: React.MouseEvent, screenshotUrl: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const link = document.createElement("a");
    link.href = screenshotUrl;
    link.download = `maple-screenshot-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCropEditor = (pcScreenshot?: string, mobileScreenshot?: string) => {
    setCropEditorData({ pcScreenshot, mobileScreenshot });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      {/* Crop Editor Modal */}
      {cropEditorData && (
        <ScreenshotCropEditor
          pcScreenshot={cropEditorData.pcScreenshot}
          mobileScreenshot={cropEditorData.mobileScreenshot}
          onClose={() => setCropEditorData(null)}
        />
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setFullscreenImage(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 left-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={(e) => {
              handleDownloadScreenshot(e, fullscreenImage);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PNG
          </Button>
          <img 
            src={fullscreenImage} 
            alt="Full size screenshot" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <img src="/lovable-uploads/maple-profile.png" alt="Maple" className="w-7 h-7 rounded-full" />
          <span className="font-semibold text-foreground">Maple</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleNewChat} className="text-muted-foreground hover:text-foreground">
          <RotateCcw className="w-5 h-5" />
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <img src="/lovable-uploads/maple-profile.png" alt="Maple" className="w-16 h-16 rounded-full mb-4" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">Maple Screenshot</h1>
            <p className="text-muted-foreground text-center max-w-md">
              Enter a product page URL to capture screenshots.<br />
              I'll capture both PC and Mobile versions! 📸
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4">
            {messages.map((message, index) => (
              <div key={index} className={`mb-6 ${message.role === "user" ? "flex justify-end" : ""}`}>
                {message.role === "assistant" ? (
                  <div className="flex gap-3">
                    <img src="/lovable-uploads/maple-profile.png" alt="Maple" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {message.content || <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      </div>

                      {/* Screenshot Both - Open Editor Button */}
                      {(message.pcScreenshot || message.mobileScreenshot) && (
                        <div className="mt-4 space-y-3">
                          <div className="flex gap-3 flex-wrap">
                            {message.pcScreenshot && (
                              <div className="flex-1 min-w-[200px]">
                                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                  <Monitor className="w-3 h-3" /> PC Preview
                                </p>
                                <div 
                                  className="rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setFullscreenImage(message.pcScreenshot!)}
                                >
                                  <img 
                                    src={message.pcScreenshot} 
                                    alt="PC Screenshot" 
                                    className="w-full h-32 object-cover object-top"
                                  />
                                </div>
                              </div>
                            )}
                            {message.mobileScreenshot && (
                              <div className="flex-1 min-w-[200px]">
                                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                  <Smartphone className="w-3 h-3" /> Mobile Preview
                                </p>
                                <div 
                                  className="rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setFullscreenImage(message.mobileScreenshot!)}
                                >
                                  <img 
                                    src={message.mobileScreenshot} 
                                    alt="Mobile Screenshot" 
                                    className="w-full h-32 object-cover object-top"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenCropEditor(message.pcScreenshot, message.mobileScreenshot)}
                            className="flex items-center gap-2"
                          >
                            <Layers className="w-4 h-4" />
                            Open Crop Editor
                          </Button>
                        </div>
                      )}

                      {/* Single Screenshot */}
                      {message.screenshot && !message.pcScreenshot && !message.mobileScreenshot && (
                        <div className="mt-3 space-y-2">
                          <div 
                            className="rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity inline-block"
                            onClick={() => setFullscreenImage(message.screenshot!)}
                          >
                            <img 
                              src={message.screenshot} 
                              alt="Page Screenshot" 
                              className="w-auto h-auto max-w-full"
                              style={{ maxHeight: "70vh" }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleDownloadScreenshot(e, message.screenshot!)}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download PNG
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFullscreenImage(message.screenshot!)}
                              className="text-muted-foreground"
                            >
                              View Full Size
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenCropEditor(message.screenshot, undefined)}
                              className="flex items-center gap-2"
                            >
                              <Layers className="w-4 h-4" />
                              Crop Editor
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-secondary rounded-2xl px-4 py-2.5 max-w-[85%]">
                    <p className="text-foreground whitespace-pre-wrap break-all">{message.content}</p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-secondary rounded-2xl px-4 py-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a PDP URL..."
              className="flex-1 bg-transparent border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground min-h-[24px] max-h-[200px] py-0"
              rows={1}
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaplePDP;
