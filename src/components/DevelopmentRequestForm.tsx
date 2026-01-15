import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export interface DevelopmentRequest {
  id: string;
  name: string;
  team: string;
  region: string;
  email: string;
  painPoint: string;
  improvementIdea: string;
  submittedAt: Date;
}

interface DevelopmentRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitSuccess?: (data: DevelopmentRequest) => void;
}

const DevelopmentRequestForm: React.FC<DevelopmentRequestFormProps> = ({
  open,
  onOpenChange,
  onSubmitSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    team: "",
    region: "",
    email: "",
    painPoint: "",
    improvementIdea: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.team || !formData.region || !formData.email || !formData.painPoint) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newRequest: DevelopmentRequest = {
      id: Date.now().toString(),
      ...formData,
      submittedAt: new Date(),
    };

    onSubmitSuccess?.(newRequest);
    
    toast({
      title: "Request Submitted",
      description: "Thank you for your request! The admin will review it and contact you if any additional information is needed.",
    });

    setFormData({
      name: "",
      team: "",
      region: "",
      email: "",
      painPoint: "",
      improvementIdea: "",
    });
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Development Request</DialogTitle>
          <DialogDescription>
            Submit your pain points or ideas for new AI crew members. We'll review your request and get back to you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team *</Label>
              <Input
                id="team"
                value={formData.team}
                onChange={(e) => handleChange("team", e.target.value)}
                placeholder="Your team"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => handleChange("region", e.target.value)}
                placeholder="Your region"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="your.email@lge.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="painPoint">Pain Point *</Label>
            <Textarea
              id="painPoint"
              value={formData.painPoint}
              onChange={(e) => handleChange("painPoint", e.target.value)}
              placeholder="Describe the challenge or issue you're facing in your work..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="improvementIdea">Improvement Idea (Optional)</Label>
            <Textarea
              id="improvementIdea"
              value={formData.improvementIdea}
              onChange={(e) => handleChange("improvementIdea", e.target.value)}
              placeholder="If you have any ideas on how this could be improved, please share them here..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DevelopmentRequestForm;
