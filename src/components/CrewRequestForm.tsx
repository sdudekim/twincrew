import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type CrewFormData = {
  crewName: string;
  role: string;
  division: string;
  team: string;
  skills: string;
  description: string;
  agentUrl: string;
  comment: string;
  requestedBy: string;
  selectedImage: string;
};

type CrewRequestFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitSuccess?: (data: CrewFormData) => void;
};

const CrewRequestForm = ({ open, onOpenChange, onSubmitSuccess }: CrewRequestFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    crewName: "",
    role: "",
    division: "",
    team: "",
    skills: "",
    description: "",
    agentUrl: "",
    comment: "",
    requestedBy: "",
    selectedImage: ""
  });

  const teamsByDivision: Record<string, string[]> = {
    marketing: ["On-Site Marketing Team", "Content Team"],
    "digital-platform": ["Platform Operation Team", "Platform Development Team"],
    "data-intelligence": ["Data Analysis Team", "AI Development Team"],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const webhookUrl = "https://dev.eaip.lge.com/n8n/webhook/19da7f3f-019d-4618-a367-683c9e5c32b8";
      const params = new URLSearchParams({
        crewName: formData.crewName,
        role: formData.role,
        division: formData.division,
        team: formData.team,
        skills: formData.skills,
        description: formData.description,
        agentUrl: formData.agentUrl,
        comment: formData.comment,
        requestedBy: formData.requestedBy,
        selectedImage: formData.selectedImage
      });

      // Send GET request with no-cors mode to bypass CORS restrictions
      fetch(`${webhookUrl}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors'
      }).catch(() => {
        // Ignore errors - the request is still sent to the webhook
      });

      // Send email notification
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-crew-request-email', {
        body: formData,
      });

      if (emailError) {
        console.error('Email send error:', emailError);
        toast({
          title: "Request Submitted",
          description: "Your request has been sent, but email notification failed.",
          variant: "destructive"
        });
      } else {
        console.log('Email sent successfully:', emailData);
        toast({
          title: "Request Submitted",
          description: "Your crew registration request has been sent and email notification delivered.",
        });
        onSubmitSuccess?.(formData);
      }
      
      onOpenChange(false);
      setFormData({
        crewName: "",
        role: "",
        division: "",
        team: "",
        skills: "",
        description: "",
        agentUrl: "",
        comment: "",
        requestedBy: "",
        selectedImage: ""
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Crew Member</DialogTitle>
          <DialogDescription>
            Submit a request to add a new AI crew member to the team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Select Crew Image</Label>
              <ScrollArea className="h-32 w-full rounded-md border p-2">
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 30 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleChange("selectedImage", `image-${i + 1}`)}
                      className={`aspect-square rounded-md border-2 transition-all hover:border-primary overflow-hidden ${
                        formData.selectedImage === `image-${i + 1}` 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-muted"
                      }`}
                    >
                      {i === 0 ? (
                        <img 
                          src="/lovable-uploads/fiona-profile.png" 
                          alt="Fiona profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 1 ? (
                        <img 
                          src="/lovable-uploads/haruto-profile.png" 
                          alt="Haruto profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 2 ? (
                        <img 
                          src="/lovable-uploads/harvey-profile.png" 
                          alt="Harvey profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 3 ? (
                        <img 
                          src="/lovable-uploads/carmen-profile.png" 
                          alt="Carmen profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 4 ? (
                        <img 
                          src="/lovable-uploads/dan-profile.png" 
                          alt="Dan profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 5 ? (
                        <img 
                          src="/lovable-uploads/juno-profile.png" 
                          alt="Juno profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 6 ? (
                        <img 
                          src="/lovable-uploads/crew-image-7.png" 
                          alt="Crew image 7" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 7 ? (
                        <img 
                          src="/lovable-uploads/kofi-profile.png" 
                          alt="Kofi profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 8 ? (
                        <img 
                          src="/lovable-uploads/crew-image-9.png" 
                          alt="Crew image 9" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 9 ? (
                        <img 
                          src="/lovable-uploads/rosa-profile.png" 
                          alt="Rosa profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 10 ? (
                        <img 
                          src="/lovable-uploads/tango-profile.png" 
                          alt="Tango profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 11 ? (
                        <img 
                          src="/lovable-uploads/crew-image-12.png" 
                          alt="Crew image 12" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 12 ? (
                        <img 
                          src="/lovable-uploads/crew-image-13.png" 
                          alt="Crew image 13" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 13 ? (
                        <img 
                          src="/lovable-uploads/crew-image-14.png" 
                          alt="Crew image 14" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 14 ? (
                        <img 
                          src="/lovable-uploads/crew-image-15.png" 
                          alt="Crew image 15" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 15 ? (
                        <img 
                          src="/lovable-uploads/crew-image-16.png" 
                          alt="Crew image 16" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 16 ? (
                        <img 
                          src="/lovable-uploads/crew-image-17.png" 
                          alt="Crew image 17" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 17 ? (
                        <img 
                          src="/lovable-uploads/crew-image-18.png" 
                          alt="Crew image 18" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 18 ? (
                        <img 
                          src="/lovable-uploads/crew-image-19.png" 
                          alt="Crew image 19" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 19 ? (
                        <img 
                          src="/lovable-uploads/crew-image-20.png" 
                          alt="Crew image 20" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 20 ? (
                        <img 
                          src="/lovable-uploads/crew-image-21.png" 
                          alt="Crew image 21" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 21 ? (
                        <img 
                          src="/lovable-uploads/crew-image-22.png" 
                          alt="Crew image 22" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 22 ? (
                        <img 
                          src="/lovable-uploads/crew-image-23.png" 
                          alt="Crew image 23" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 23 ? (
                        <img 
                          src="/lovable-uploads/crew-image-24.png" 
                          alt="Crew image 24" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 24 ? (
                        <img 
                          src="/lovable-uploads/crew-image-25.png" 
                          alt="Crew image 25" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 25 ? (
                        <img 
                          src="/lovable-uploads/crew-image-26.png" 
                          alt="Crew image 26" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 26 ? (
                        <img 
                          src="/lovable-uploads/crew-image-27.png" 
                          alt="Crew image 27" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 27 ? (
                        <img 
                          src="/lovable-uploads/crew-image-28.png" 
                          alt="Crew image 28" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 28 ? (
                        <img 
                          src="/lovable-uploads/crew-image-29.png" 
                          alt="Crew image 29" 
                          className="w-full h-full object-cover"
                        />
                      ) : i === 29 ? (
                        <img 
                          src="/lovable-uploads/crew-image-30.png" 
                          alt="Crew image 30" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">{i + 1}</span>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div>
              <Label htmlFor="crewName">Crew Name *</Label>
              <Input
                id="crewName"
                value={formData.crewName}
                onChange={(e) => handleChange("crewName", e.target.value)}
                placeholder="e.g., Alex"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
                placeholder="e.g., Content Specialist"
                required
              />
            </div>

            <div>
              <Label htmlFor="division">Division *</Label>
              <Select value={formData.division} onValueChange={(value) => {
                handleChange("division", value);
                handleChange("team", "");
              }} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="digital-platform">Digital Platform</SelectItem>
                  <SelectItem value="data-intelligence">Data Intelligence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="team">Team *</Label>
              <Select value={formData.team} onValueChange={(value) => handleChange("team", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {formData.division && teamsByDivision[formData.division]?.map((team) => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                  <SelectItem value="new-team">+ Create New Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="skills">Key Skills *</Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) => handleChange("skills", e.target.value)}
                placeholder="e.g., Data Analysis, Python, SQL"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe the crew member's responsibilities and capabilities..."
                className="min-h-[100px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="agentUrl">Agent URL (Optional)</Label>
              <Input
                id="agentUrl"
                value={formData.agentUrl}
                onChange={(e) => handleChange("agentUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="comment">Comment to Reviewer (Optional)</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => handleChange("comment", e.target.value)}
                placeholder="검토자에게 전달하고 싶은 내용이 있다면 자유롭게 작성해주세요..."
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="requestedBy">Requested By *</Label>
              <Input
                id="requestedBy"
                value={formData.requestedBy}
                onChange={(e) => handleChange("requestedBy", e.target.value)}
                placeholder="Your EP e-mail"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CrewRequestForm;
