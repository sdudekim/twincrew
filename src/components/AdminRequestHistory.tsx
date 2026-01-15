import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Lock, Trash2, Mail, MapPin, Users, Calendar, MessageSquare, Lightbulb } from "lucide-react";
import { DevelopmentRequest } from "./DevelopmentRequestForm";
import { format } from "date-fns";

interface AdminRequestHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: DevelopmentRequest[];
  onDeleteRequest: (id: string) => void;
}

const ADMIN_PASSWORD = "1010";

const AdminRequestHistory: React.FC<AdminRequestHistoryProps> = ({
  open,
  onOpenChange,
  requests,
  onDeleteRequest,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<DevelopmentRequest | null>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    setPassword("");
    setError("");
    setSelectedRequest(null);
    onOpenChange(false);
  };

  const handleBack = () => {
    setSelectedRequest(null);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        {!isAuthenticated ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Admin Access Required
              </DialogTitle>
              <DialogDescription>
                Enter the admin password to view request history.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">Authenticate</Button>
              </div>
            </form>
          </>
        ) : selectedRequest ? (
          <>
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                Submitted on {format(new Date(selectedRequest.submittedAt), "MMM d, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Name
                    </div>
                    <div className="font-medium">{selectedRequest.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Team
                    </div>
                    <div className="font-medium">{selectedRequest.team}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Region
                    </div>
                    <div className="font-medium">{selectedRequest.region}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </div>
                    <a 
                      href={`mailto:${selectedRequest.email}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {selectedRequest.email}
                    </a>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Pain Point
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md text-sm">
                    {selectedRequest.painPoint}
                  </div>
                </div>

                {selectedRequest.improvementIdea && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Improvement Idea
                    </div>
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                      {selectedRequest.improvementIdea}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                Back to List
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  onDeleteRequest(selectedRequest.id);
                  handleBack();
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Development Request History</DialogTitle>
              <DialogDescription>
                {requests.length === 0 
                  ? "No requests have been submitted yet."
                  : `${requests.length} request${requests.length > 1 ? 's' : ''} submitted`
                }
              </DialogDescription>
            </DialogHeader>
            {requests.length > 0 ? (
              <ScrollArea className="max-h-[50vh] pr-4">
                <div className="space-y-3 mt-4">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{request.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {request.team}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {request.region}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {request.painPoint}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(request.submittedAt), "MMM d, yyyy")}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRequest(request.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No development requests yet.</p>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminRequestHistory;
