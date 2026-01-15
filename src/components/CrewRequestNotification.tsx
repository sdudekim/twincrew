import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export type CrewRequest = {
  id: string;
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
  submittedAt: Date;
};

type CrewRequestNotificationProps = {
  requests: CrewRequest[];
  onClearRequest: (id: string) => void;
};

const divisionLabels: Record<string, string> = {
  marketing: "Marketing",
  "digital-platform": "Digital Platform",
  "data-intelligence": "Data Intelligence",
};

const imageMap: Record<string, string> = {
  "image-1": "/lovable-uploads/fiona-profile.png",
  "image-2": "/lovable-uploads/haruto-profile.png",
  "image-3": "/lovable-uploads/harvey-profile.png",
  "image-4": "/lovable-uploads/carmen-profile.png",
  "image-5": "/lovable-uploads/dan-profile.png",
  "image-6": "/lovable-uploads/juno-profile.png",
  "image-7": "/lovable-uploads/crew-image-7.png",
  "image-8": "/lovable-uploads/kofi-profile.png",
  "image-9": "/lovable-uploads/crew-image-9.png",
  "image-10": "/lovable-uploads/rosa-profile.png",
  "image-11": "/lovable-uploads/tango-profile.png",
  "image-12": "/lovable-uploads/crew-image-12.png",
  "image-13": "/lovable-uploads/crew-image-13.png",
  "image-14": "/lovable-uploads/crew-image-14.png",
  "image-15": "/lovable-uploads/crew-image-15.png",
  "image-16": "/lovable-uploads/crew-image-16.png",
  "image-17": "/lovable-uploads/crew-image-17.png",
  "image-18": "/lovable-uploads/crew-image-18.png",
  "image-19": "/lovable-uploads/crew-image-19.png",
  "image-20": "/lovable-uploads/crew-image-20.png",
  "image-21": "/lovable-uploads/crew-image-21.png",
  "image-22": "/lovable-uploads/crew-image-22.png",
  "image-23": "/lovable-uploads/crew-image-23.png",
  "image-24": "/lovable-uploads/crew-image-24.png",
  "image-25": "/lovable-uploads/crew-image-25.png",
  "image-26": "/lovable-uploads/crew-image-26.png",
  "image-27": "/lovable-uploads/crew-image-27.png",
  "image-28": "/lovable-uploads/crew-image-28.png",
  "image-29": "/lovable-uploads/crew-image-29.png",
  "image-30": "/lovable-uploads/crew-image-30.png",
};

const CrewRequestNotification = ({ requests, onClearRequest }: CrewRequestNotificationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CrewRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleNotificationClick = () => {
    if (requests.length === 1) {
      setSelectedRequest(requests[0]);
      setDetailOpen(true);
    } else {
      setIsOpen(true);
    }
  };

  const handleRequestClick = (request: CrewRequest) => {
    setSelectedRequest(request);
    setIsOpen(false);
    setDetailOpen(true);
  };

  if (requests.length === 0) return null;

  return (
    <>
      {/* Notification Bell Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="relative bg-background/80 backdrop-blur-sm border-border hover:bg-accent"
          onClick={handleNotificationClick}
        >
          <Bell className="h-5 w-5" />
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground"
          >
            {requests.length}
          </Badge>
        </Button>
      </div>

      {/* Request List Dialog (when multiple requests) */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submitted Requests</DialogTitle>
            <DialogDescription>
              Click on a request to view details.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {requests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => handleRequestClick(request)}
                  className="w-full p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left flex items-center gap-3"
                >
                  {request.selectedImage && imageMap[request.selectedImage] && (
                    <img 
                      src={imageMap[request.selectedImage]} 
                      alt={request.crewName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{request.crewName}</p>
                    <p className="text-sm text-muted-foreground truncate">{request.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {request.submittedAt.toLocaleTimeString()}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedRequest?.selectedImage && imageMap[selectedRequest.selectedImage] && (
                <img 
                  src={imageMap[selectedRequest.selectedImage]} 
                  alt={selectedRequest.crewName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <span>Request Submitted</span>
                <Badge variant="secondary" className="ml-2">Completed</Badge>
              </div>
            </DialogTitle>
            <DialogDescription>
              Your crew registration request has been submitted successfully.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Crew Name</p>
                  <p className="font-medium">{selectedRequest.crewName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">{selectedRequest.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Division</p>
                  <p className="font-medium">{divisionLabels[selectedRequest.division] || selectedRequest.division}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Team</p>
                  <p className="font-medium">{selectedRequest.team}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Skills</p>
                <p className="font-medium">{selectedRequest.skills}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium text-sm">{selectedRequest.description}</p>
              </div>
              
              {selectedRequest.agentUrl && (
                <div>
                  <p className="text-sm text-muted-foreground">Agent URL</p>
                  <a 
                    href={selectedRequest.agentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline text-sm break-all"
                  >
                    {selectedRequest.agentUrl}
                  </a>
                </div>
              )}
              
              {selectedRequest.comment && (
                <div>
                  <p className="text-sm text-muted-foreground">Comment</p>
                  <p className="font-medium text-sm">{selectedRequest.comment}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Requested By</p>
                <p className="font-medium">{selectedRequest.requestedBy}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Submitted At</p>
                <p className="font-medium">{selectedRequest.submittedAt.toLocaleString()}</p>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onClearRequest(selectedRequest.id);
                    setDetailOpen(false);
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CrewRequestNotification;
