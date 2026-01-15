import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, MessageSquare, X, ArrowLeft, Send, Volume2 } from 'lucide-react';

const PipQA = () => {
  const navigate = useNavigate();
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'pip', content: string}>>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const handleStartVoiceChat = async () => {
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsVoiceActive(true);
      
      // Mock voice interaction for now
      setTimeout(() => {
        speak("안녕하세요! 저는 Pip입니다. 콘텐츠 품질 검토를 도와드리겠습니다. 어떤 콘텐츠를 검토해 드릴까요?");
      }, 1000);
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const handleEndVoiceChat = () => {
    setIsVoiceActive(false);
    setIsListening(false);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      alert('음성 인식이 지원되지 않는 브라우저입니다.');
    }
  };

  const handleVoiceInput = (transcript: string) => {
    // Process voice input and provide QA feedback
    const response = generateQAResponse(transcript);
    speak(response);
  };

  const generateQAResponse = (input: string) => {
    // Simple mock QA responses based on input
    if (input.includes('가이드라인') || input.includes('브랜드')) {
      return "브랜드 가이드라인 검토를 시작하겠습니다. 로고 사용, 색상, 폰트가 규정에 맞는지 확인해보세요.";
    } else if (input.includes('콘텐츠') || input.includes('내용')) {
      return "콘텐츠 품질을 검토하겠습니다. 정확성, 일관성, 브랜드 톤앤매너를 점검해보겠습니다.";
    } else {
      return "네, 이해했습니다. 해당 내용을 Content Creation Guideline과 Brand Guideline에 따라 검토해드리겠습니다.";
    }
  };

  const handleSendText = () => {
    if (textInput.trim()) {
      setChatMessages(prev => [...prev, { type: 'user', content: textInput }]);
      
      // Generate QA response
      setTimeout(() => {
        const response = generateQAResponse(textInput);
        setChatMessages(prev => [...prev, { 
          type: 'pip', 
          content: response
        }]);
      }, 1000);
      
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-white shadow-lg">
            <img 
              src="/lovable-uploads/2d6113a8-70c0-4d9e-a66a-88b336591e65.png" 
              alt="Pip Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pip - Content QA Specialist</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            콘텐츠가 Content Creation Guidelines와 Brand Guidelines에 적합한지 검토하고, 
            올바른 콘텐츠 방향으로 제작할 수 있도록 가이드해드립니다.
          </p>
        </div>
      </div>

      {/* Main Interface */}
      <div className="max-w-4xl mx-auto">
        {!isTextMode ? (
          /* Voice Mode */
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl text-gray-800">음성 상호작용 모드</CardTitle>
              <p className="text-gray-600">Pip과 음성으로 콘텐츠 품질에 대해 대화하세요</p>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="flex justify-center items-center space-x-4">
                {!isVoiceActive ? (
                  <Button
                    onClick={handleStartVoiceChat}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-full text-lg"
                  >
                    <Mic className="w-6 h-6 mr-2" />
                    음성 채팅 시작
                  </Button>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex space-x-4">
                      <Button
                        onClick={startListening}
                        disabled={isListening}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full"
                      >
                        <Volume2 className="w-5 h-5 mr-2" />
                        {isListening ? '듣는 중...' : '말하기'}
                      </Button>
                      <Button
                        onClick={handleEndVoiceChat}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full"
                      >
                        <MicOff className="w-5 h-5 mr-2" />
                        채팅 종료
                      </Button>
                    </div>
                    {isListening && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-green-700 font-medium animate-pulse">
                          🎙️ 음성을 듣고 있습니다... 말씀해주세요!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isVoiceActive && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-purple-700 font-medium">
                    🎙️ 음성 채팅이 활성화되었습니다. '말하기' 버튼을 눌러서 대화를 시작하세요.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsTextMode(true)}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  텍스트 모드로 전환
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Text Mode */
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-800">Pip과 텍스트 채팅</CardTitle>
                <p className="text-gray-600">콘텐츠 품질 검토를 위해 텍스트를 보내주세요</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setIsTextMode(false)}
                className="text-gray-500"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto mb-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>검토받고 싶은 콘텐츠를 공유해서 대화를 시작하세요</p>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-purple-500 text-white'
                            : 'bg-white text-gray-800 shadow-sm'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Text Input */}
              <div className="flex space-x-3">
                <Textarea
                  placeholder="가이드라인 검토를 위해 콘텐츠를 여기에 붙여넣어 주세요..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 min-h-[100px] resize-none"
                />
                <Button
                  onClick={handleSendText}
                  disabled={!textInput.trim()}
                  className="bg-purple-500 hover:bg-purple-600 text-white self-end px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PipQA;