import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, UserPlus, MessageSquare, Heart, Calendar, Users, MapPin, Mail, TrendingUp, Trash2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DevelopmentRequest } from "./DevelopmentRequestForm";
import { CrewRequest } from "./CrewRequestNotification";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  crew_name: string;
  reviewer_name: string;
  review_text: string;
  created_at: string;
}

interface FionaAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crewRequests: CrewRequest[];
  developmentRequests: DevelopmentRequest[];
}

interface CrewLikeStat {
  crew_name: string;
  like_count: number;
  likes: { id: string; created_at: string }[];
}

const ADMIN_PASSWORD = "1010";

const FionaAdminDialog: React.FC<FionaAdminDialogProps> = ({
  open,
  onOpenChange,
  crewRequests,
  developmentRequests,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [likeStats, setLikeStats] = useState<CrewLikeStat[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (isAuthenticated && open) {
      fetchLikeStats();
      fetchReviews();
    }
  }, [isAuthenticated, open]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("crew_reviews")
      .select("*")
      .order("created_at", { ascending: false });
    setReviews(data || []);
  };

  const fetchLikeStats = async () => {
    setIsLoadingStats(true);
    // Fetch all likes with dates and group by crew_name
    const { data } = await supabase
      .from("crew_likes")
      .select("id, crew_name, created_at")
      .order("created_at", { ascending: false });

    if (data) {
      const grouped: Record<string, { id: string; created_at: string }[]> = {};
      data.forEach((like) => {
        if (!grouped[like.crew_name]) {
          grouped[like.crew_name] = [];
        }
        grouped[like.crew_name].push({ id: like.id, created_at: like.created_at });
      });
      
      const stats = Object.entries(grouped)
        .map(([crew_name, likes]) => ({ 
          crew_name, 
          like_count: likes.length,
          likes 
        }))
        .sort((a, b) => b.like_count - a.like_count);
      
      setLikeStats(stats);
    }
    setIsLoadingStats(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase
      .from("crew_reviews")
      .delete()
      .eq("id", reviewId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete review.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Review has been deleted.",
      });
      fetchReviews();
    }
  };

  const handleResetCrewLikes = async (crewName: string) => {
    const { error } = await supabase
      .from("crew_likes")
      .delete()
      .eq("crew_name", crewName);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to reset likes.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset Complete",
        description: `All likes for ${crewName} have been reset.`,
      });
      fetchLikeStats();
    }
  };

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
    onOpenChange(false);
  };

  // Combine and sort all activities by date
  const allActivities = [
    ...crewRequests.map((req) => ({
      type: "crew_request" as const,
      date: req.submittedAt,
      data: req,
    })),
    ...developmentRequests.map((req) => ({
      type: "dev_request" as const,
      date: req.submittedAt,
      data: req,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        {!isAuthenticated ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full overflow-hidden">
                  <img
                    src="/lovable-uploads/fiona-admin-profile.png"
                    alt="Fiona"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Admin Access Required
                  </DialogTitle>
                  <DialogDescription>
                    Enter the admin password to access Fiona's dashboard.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="fiona-password">Password</Label>
                <Input
                  id="fiona-password"
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
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden">
                  <img
                    src="/lovable-uploads/fiona-admin-profile.png"
                    alt="Fiona"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <DialogTitle>Fiona's Admin Dashboard</DialogTitle>
                  <DialogDescription>
                    Overview of all activities and crew engagement
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="timeline" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="timeline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="requests" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Requests
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-2">
                  <Users className="h-4 w-4" />
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="likes" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Likes
                </TabsTrigger>
              </TabsList>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {allActivities.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No activities recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allActivities.map((activity, index) => (
                        <div
                          key={`${activity.type}-${index}`}
                          className="relative pl-6 pb-4 border-l-2 border-border last:border-l-0"
                        >
                          <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            {activity.type === "crew_request" ? (
                              <UserPlus className="h-2 w-2 text-primary-foreground" />
                            ) : (
                              <MessageSquare className="h-2 w-2 text-primary-foreground" />
                            )}
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={activity.type === "crew_request" ? "default" : "secondary"}>
                                {activity.type === "crew_request" ? "Crew Registration" : "Development Request"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(activity.date), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            </div>
                            {activity.type === "crew_request" ? (
                              <div>
                                <p className="font-medium">{(activity.data as CrewRequest).crewName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(activity.data as CrewRequest).role} - {(activity.data as CrewRequest).team}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium">{(activity.data as DevelopmentRequest).name}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {(activity.data as DevelopmentRequest).painPoint}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {/* Crew Registration Requests */}
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <UserPlus className="h-4 w-4" />
                        Crew Registration Requests ({crewRequests.length})
                      </h4>
                      {crewRequests.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No crew registration requests.</p>
                      ) : (
                        <div className="space-y-2">
                          {crewRequests.map((req) => (
                            <div key={req.id} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{req.crewName}</span>
                                <Badge variant="outline">{req.division}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{req.role} - {req.team}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                By {req.requestedBy} • {format(new Date(req.submittedAt), "MMM d, yyyy")}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Mochi Development Requests */}
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <MessageSquare className="h-4 w-4" />
                        Mochi Development Requests ({developmentRequests.length})
                      </h4>
                      {developmentRequests.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No development requests.</p>
                      ) : (
                        <div className="space-y-2">
                          {developmentRequests.map((req) => (
                            <div key={req.id} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{req.name}</span>
                                <Badge variant="secondary">{req.team}</Badge>
                                <Badge variant="outline">{req.region}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{req.painPoint}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {req.email}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">All Reviews ({reviews.length})</h4>
                  </div>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No reviews yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="capitalize">{review.crew_name}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(review.created_at), "MMM d, yyyy h:mm a")}
                                </span>
                              </div>
                              <p className="text-sm font-medium">{review.reviewer_name}</p>
                              <p className="text-sm text-muted-foreground mt-1">{review.review_text}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Likes Tab */}
              <TabsContent value="likes" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Crew Popularity Dashboard</h4>
                  </div>
                  {isLoadingStats ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Loading...
                    </div>
                  ) : likeStats.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No likes recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {likeStats.map((stat, index) => (
                        <div
                          key={stat.crew_name}
                          className="bg-muted/50 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium capitalize">{stat.crew_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                              <span className="font-semibold">{stat.like_count}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                              onClick={() => handleResetCrewLikes(stat.crew_name)}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reset
                            </Button>
                          </div>
                          {/* Like dates */}
                          <div className="pl-12 space-y-1">
                            <p className="text-xs text-muted-foreground mb-2">Like History:</p>
                            <div className="flex flex-wrap gap-2">
                              {stat.likes.slice(0, 10).map((like) => (
                                <Badge key={like.id} variant="outline" className="text-xs">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {format(new Date(like.created_at), "MMM d, yyyy h:mm a")}
                                </Badge>
                              ))}
                              {stat.likes.length > 10 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{stat.likes.length - 10} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

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

export default FionaAdminDialog;
