import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ExternalLink, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Crawling = () => {
 const navigate = useNavigate();
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [email, setEmail] = useState<string>("");
  const { toast } = useToast();
 
  useEffect(() => {
    document.title = "Mateo - Crawler";
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "파일 선택 필요",
        description: "파일을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "이메일 입력 필요",
        description: "이메일을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!isValidEmail(email)) {
      toast({
        title: "이메일 형식 오류",
        description: "올바른 이메일 형식을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      // 엑셀 파일 읽기
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // 첫 번째 시트 가져오기
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // JSON으로 변환
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // 웹훅으로 데이터 전송 (GET 방식)
      const webhookUrl = 'https://dev.eaip.lge.com/n8n/webhook/lovable_api';
      const params = new URLSearchParams({
        email: email,
        data: JSON.stringify(jsonData)
      });
      
      const response = await fetch(`${webhookUrl}?${params}`);
      
      if (response.ok) {
        toast({
          title: "전송 완료",
          description: "파일이 성공적으로 전송되었습니다!"
        });
        setSelectedFile(null);
        setEmail("");
        // 파일 입력 초기화
        const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        toast({
          title: "전송 실패",
          description: "전송 중 오류가 발생했습니다. 다시 시도해주세요.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("파일 처리 오류:", error);
      toast({
        title: "파일 처리 오류",
        description: "파일 처리 중 오류가 발생했습니다. 파일 형식을 확인해주세요.",
        variant: "destructive"
      });
    }
  };



  return (
    <div className="min-h-screen p-6 relative overflow-hidden bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")} 
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-lg p-6 min-h-[600px] flex flex-col relative z-10">
          {/* Mateo Profile */}
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20">
              <img
                src="/lovable-uploads/mateo-profile.png"
                alt="Mateo crawler profile image"
                className="w-full h-full object-cover object-center scale-110"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              <h1 className="font-semibold text-lg text-foreground">Mateo</h1>
              <p className="text-sm text-muted-foreground">Crawler</p>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium text-foreground">
                엑셀 파일 첨부
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-file-input"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('excel-file-input')?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  파일 선택
                </Button>
                {selectedFile && (
                  <span className="text-sm text-muted-foreground">
                    {selectedFile.name}
                  </span>
                )}
              </div>
            </div>

            {/* Email Section */}
            <div className="flex flex-col gap-4">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력해주세요"
                className="w-full"
              />
            </div>

            {/* Submit Button Section */}
            <div className="flex flex-col gap-2">
              <Button 
                className="w-full"
                disabled={!selectedFile || !email}
                onClick={handleSubmit}
              >
                전송
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                결과는 10분내 이메일로 보내집니다.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Crawling;