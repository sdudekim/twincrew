import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Undo2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ConfirmationWithScreenshots from "@/components/ConfirmationWithScreenshots";
const benProfile = "/lovable-uploads/ben-profile-v2.png";

interface FormData {
  mainProductUrl: string;
  secondProductUrl: string;
  mainEnergyLabel?: string;
  secondEnergyLabel?: string;
}

interface ConversationItem {
  type: string;
  content: string;
  field?: string;
  exampleUrl?: string;
  showUrl?: boolean;
}

const PTOGallery = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    mainProductUrl: '',
    secondProductUrl: ''
  });
  const [mainUrlInput, setMainUrlInput] = useState('');
  const [secondUrlInput, setSecondUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'success' | 'failure' | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);
  const webhookUrl = 'https://dev.eaip.lge.com/n8n/webhook/0d1d1ae9-c63d-4402-b7a5-124a886eb108';
  const conversationRef = useRef<HTMLDivElement>(null);


  const conversations: ConversationItem[] = [
    {
      type: 'ben-message',
      content: "Hello! I'm Ben 🐕 I'll help you create a PTO gallery. Let me ask you a few questions to build the perfect gallery for you! 😊"
    },
    {
      type: 'ben-dual-url',
      content: "Please paste the PDP URLs for both products.\n\n• Main product (left side of gallery)\n• Second product (right side of gallery)",
      field: 'dualUrls',
      exampleUrl: "https://www.lg.com/es/tv-y-barras-de-sonido/oled-evo/oled83c5elb-esb/"
    },
    {
      type: 'ben-confirmation',
      content: "Let me confirm your information before we proceed:"
    },
    {
      type: 'ben-completion',
      content: "Perfect! I'll start working on your gallery right away! 🐕💻"
    }
  ];

  
  // Auto-scroll effect
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [currentStep, urlValidationError]);

  // Auto-proceed for Ben's messages
  useEffect(() => {
    const currentConversation = conversations[currentStep];
    if (currentConversation && 
        currentConversation.type === 'ben-message' && 
        currentStep < conversations.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, conversations.length]);

  const handleNext = () => {
    if (currentStep < conversations.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleGoBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleInputSubmit = () => {
    const currentConversation = conversations[currentStep];
    if (currentConversation.field === 'dualUrls') {
      // Validate both URLs
      if (!mainUrlInput?.startsWith('https://www.lg.com/')) {
        setUrlValidationError('Main product URL must start with "https://www.lg.com/"');
        return;
      }
      if (!secondUrlInput?.startsWith('https://www.lg.com/')) {
        setUrlValidationError('Second product URL must start with "https://www.lg.com/"');
        return;
      }
      
      setUrlValidationError(null);
      setFormData(prev => ({
        ...prev,
        mainProductUrl: mainUrlInput,
        secondProductUrl: secondUrlInput
      }));
      setTimeout(handleNext, 300);
    }
  };


  const handleSubmit = async () => {
    if (!webhookUrl || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // GET 방식으로 URL 파라미터 구성
      const params = new URLSearchParams({
        productAUrl: formData.mainProductUrl,
        productBUrl: formData.secondProductUrl,
      });
      const getUrl = `${webhookUrl}?${params.toString()}`;

      const response = await fetch(getUrl, {
        method: "GET",
      });

      if (response.ok) {
        setTimeout(() => {
          setSubmissionStatus('success');
          setIsSubmitting(false);
          // 2초 후 비디오 표시
          setTimeout(() => {
            setShowVideo(true);
          }, 2000);
        }, 2000);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error sending to n8n webhook:", error);
      setSubmissionStatus('failure');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setFormData({ mainProductUrl: '', secondProductUrl: '' });
    setMainUrlInput('');
    setSecondUrlInput('');
    setSubmissionStatus(null);
    setShowVideo(false);
    setUrlValidationError(null);
  };

  const currentConversation = conversations[currentStep];
  const isDualUrlInput = currentConversation?.type === 'ben-dual-url';
  const isConfirmation = currentConversation?.type === 'ben-confirmation';

  return (
    <div 
      className="min-h-screen p-6 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/lovable-uploads/486a0909-b1cd-4891-9d37-db02a935a89f.png)',
        backgroundSize: 'cover',
        backgroundPosition: '90% center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Completion overlay */}
      {showVideo && (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col items-center justify-center">
          {/* Circular video in center */}
          <div className="w-44 h-44 rounded-full overflow-hidden border-2 border-white shadow-xl mb-8">
            <video
              src="/completion-video.mp4"
              autoPlay
              loop
              muted
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="text-center text-white space-y-4 p-8">
            <h1 className="text-4xl font-bold mb-4">Perfect! I just started working!</h1>
            <p className="text-xl mb-2">You will receive it soon.</p>
            <p className="text-xl mb-8">You can close this window now.</p>
            <p className="text-lg mb-8">
              If you don't receive the email within 10 minutes,<br/>
              please contact <span className="font-bold">donguk.yim@lge.com</span>. He will assist you.
            </p>
            
            {/* CTA Button to go back home */}
            <Button 
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-black px-6 py-2 text-base transition-all duration-300"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}

      {/* Chat container - hidden when video is shown */}
      {!showVideo && (
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="mb-4 text-gray-400 hover:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 h-[600px] flex flex-col relative z-10">
            {/* Ben's Profile */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-400/50">
                <img 
                  src={benProfile} 
                  alt="Ben" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Ben</h3>
                <p className="text-sm text-muted-foreground">PTO Gallery Creator</p>
              </div>
            </div>

            {/* Conversation Flow */}
            <div ref={conversationRef} className="flex-1 overflow-y-auto space-y-6 pr-2" style={{ scrollBehavior: 'smooth' }}>
              {conversations.slice(0, currentStep + 1).map((conv, index) => (
                <div 
                  key={index}
                  className={`transition-all duration-500 ${
                    index === currentStep ? 'animate-fade-in' : ''
                  }`}
                >
                  {/* Ben's Message */}
                  <div className="flex gap-3 mb-4 items-start">
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm whitespace-pre-line">{conv.content}</p>
                      {conv.exampleUrl && (
                        <div className="mt-2 text-xs text-muted-foreground opacity-70 font-mono bg-muted/30 px-2 py-1 rounded">
                          For example: {conv.exampleUrl}
                        </div>
                      )}
                      {conv.showUrl && conv.field && formData[conv.field as keyof FormData] && typeof formData[conv.field as keyof FormData] === 'string' && (
                        <div className="mt-2 p-2 bg-background rounded text-xs text-muted-foreground">
                          URL: {formData[conv.field as keyof FormData] as string}
                        </div>
                      )}
                    </div>
                    {/* Go Back Button */}
                    {index > 0 && index === currentStep && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGoBack}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-gray-300 px-3 py-1.5 text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <Undo2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {/* Show confirmation summary with screenshots */}
                  {index === currentStep && conv.type === 'ben-confirmation' && (
                    <ConfirmationWithScreenshots 
                      formData={formData}
                      setFormData={setFormData}
                      onGoBack={handleGoBack}
                      onSubmit={handleSubmit}
                      onReset={handleReset}
                    />
                  )}

                  {/* User Response Display */}
                  {index < currentStep && conv.field && formData[conv.field as keyof FormData] && typeof formData[conv.field as keyof FormData] === 'string' && (
                    <div className="flex justify-end mb-2">
                      <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm">{formData[conv.field as keyof FormData] as string}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Ben Working Animation */}
              {isSubmitting && (
                <div className="text-center space-y-4 animate-fade-in">
                  <div className="w-40 h-40 mx-auto relative">
                    {/* Circular Chat Background */}
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 rounded-full flex items-center justify-center animate-pulse border-4 border-blue-200 dark:border-blue-800/50">
                      {/* Ben's Image */}
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg animate-[bounce_2s_ease-in-out_infinite]">
                        <img 
                          src={benProfile} 
                          alt="Ben working" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      {/* Working Indicator */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">💻</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-primary">I'm working on your request...</p>
                  <p className="text-sm text-muted-foreground">This should only take a moment!</p>
                </div>
              )}

              {/* Success Animation */}
              {submissionStatus === 'success' && !showVideo && (
                <div className="text-center space-y-4 animate-fade-in">
                  <div className="w-24 h-24 mx-auto">
                    <div className="w-full h-full bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center border-4 border-green-200 dark:border-green-800/50">
                      <Check className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400">Success!</p>
                  <p className="text-sm text-muted-foreground">Your request has been submitted successfully.</p>
                </div>
              )}

            </div>

            {/* URL Validation Error */}
            {urlValidationError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{urlValidationError}</p>
              </div>
            )}

            {/* Input Area - Dual URL Input */}
            {isDualUrlInput && !isSubmitting && !submissionStatus && (
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Main Product URL (Left)</label>
                  <Input
                    value={mainUrlInput}
                    onChange={(e) => setMainUrlInput(e.target.value)}
                    placeholder="https://www.lg.com/..."
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Second Product URL (Right)</label>
                  <Input
                    value={secondUrlInput}
                    onChange={(e) => setSecondUrlInput(e.target.value)}
                    placeholder="https://www.lg.com/..."
                    className="w-full"
                  />
                </div>
                <Button 
                  onClick={handleInputSubmit}
                  disabled={!mainUrlInput.trim() || !secondUrlInput.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PTOGallery;