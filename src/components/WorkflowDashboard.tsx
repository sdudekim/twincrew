import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, ExternalLink, AlertCircle, Play, BarChart3, Settings, User, Shield, MessageSquare, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RequestCheckForm } from "./RequestCheckForm";
import { KangarooAnimation } from "./KangarooAnimation";
import { WebhookSettings } from "./WebhookSettings";

type WorkflowStatus = "pending" | "running" | "completed" | "error";
type UserRole = "requestor" | "admin";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: WorkflowStatus;
  n8nUrl?: string;
  requiredRole?: UserRole;
  enabledAfter?: string;
}

interface ImageComment {
  id: string;
  imageId: string;
  comment: string;
  timestamp: Date;
}

const WorkflowDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("requestor");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showWebhookSettings, setShowWebhookSettings] = useState(false);
  const [imageComments, setImageComments] = useState<ImageComment[]>([]);
  const [requestorFeedback, setRequestorFeedback] = useState("");
  const [webhooks, setWebhooks] = useState<Record<string, string>>({
    "creation": "",
    "review": "",
    "get-outputs": ""
  });
  
  const [workflows, setWorkflows] = useState<WorkflowStep[]>([
    {
      id: "request",
      title: "Submit Request",
      description: "Submit the request form with project details",
      status: "pending",
      requiredRole: "requestor",
      n8nUrl: ""
    },
    {
      id: "creation",
      title: "Creation",
      description: "Automatically generate content based on the request",
      status: "pending",
      enabledAfter: "request",
      n8nUrl: ""
    },
    {
      id: "admin-review",
      title: "Admin Review",
      description: "Review and edit the generated content",
      status: "pending",
      requiredRole: "admin",
      enabledAfter: "creation",
      n8nUrl: ""
    },
    {
      id: "requestor-review",
      title: "Requestor Review",
      description: "Review the outputs and provide feedback",
      status: "pending",
      requiredRole: "requestor",
      enabledAfter: "admin-review",
      n8nUrl: ""
    },
    {
      id: "get-outputs",
      title: "Get Outputs",
      description: "Download all finalized files",
      status: "pending",
      enabledAfter: "requestor-review",
      n8nUrl: ""
    },
    {
      id: "done",
      title: "Archive",
      description: "Mark as complete and archive the project",
      status: "pending",
      requiredRole: "admin",
      enabledAfter: "get-outputs",
      n8nUrl: ""
    }
  ]);

  // Webhook listener simulation (in a real app, this would be handled by your backend)
  useEffect(() => {
    const handleWebhookMessage = (event: MessageEvent) => {
      if (event.data.type === 'webhook_received' && event.data.workflowId) {
        setWorkflows(prev => 
          prev.map(workflow => 
            workflow.id === event.data.workflowId 
              ? { ...workflow, status: "completed" }
              : workflow
          )
        );
        
        toast({
          title: "Workflow Completed",
          description: `${workflows.find(w => w.id === event.data.workflowId)?.title} has been completed automatically.`,
        });
      }
    };

    window.addEventListener('message', handleWebhookMessage);
    return () => window.removeEventListener('message', handleWebhookMessage);
  }, [workflows, toast]);

  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case "completed":
        return "workflow-success";
      case "running":
        return "workflow-pending";
      case "error":
        return "workflow-error";
      default:
        return "muted";
    }
  };

  const getStatusIcon = (status: WorkflowStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5" />;
      case "running":
        return <Clock className="h-5 w-5 animate-spin" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Play className="h-5 w-5" />;
    }
  };

  const handleWorkflowClick = (workflowId: string, n8nUrl?: string) => {
    if (workflowId === "request") {
      setShowRequestForm(true);
      return;
    }

    // For other workflows, just set them to running (no external popup)
    setWorkflows(prev => 
      prev.map(workflow => 
        workflow.id === workflowId 
          ? { ...workflow, status: "running" }
          : workflow
      )
    );

    toast({
      title: "Workflow Started",
      description: `${workflows.find(w => w.id === workflowId)?.title} workflow has been initiated.`,
    });
  };

  const handleRequestCheckComplete = () => {
    setWorkflows(prev => 
      prev.map(workflow => {
        if (workflow.id === "request") {
          return { ...workflow, status: "completed" };
        }
        if (workflow.id === "creation") {
          return { ...workflow, status: "running" };
        }
        return workflow;
      })
    );
    
    toast({
      title: "Creation Started",
      description: "Creation workflow has been automatically initiated.",
    });
  };

  const handleStepComplete = (stepId: string) => {
    setWorkflows(prev => {
      return prev.map(workflow => {
        if (workflow.id === stepId) {
          return { ...workflow, status: "completed" };
        }
        // Enable next step
        const nextStep = prev.find(w => w.enabledAfter === stepId);
        if (nextStep && workflow.id === nextStep.id) {
          return { ...workflow, status: "pending" };
        }
        return workflow;
      });
    });

    // Special handling for archiving
    if (stepId === "done") {
      toast({
        title: "Project Archived",
        description: "Project has been archived and moved to overview.",
      });
      // In a real app, this would save to database
    }
  };

  const handleRequestorConfirm = () => {
    handleStepComplete("requestor-review");
    toast({
      title: "Review Confirmed",
      description: "Your feedback has been submitted. Outputs are now ready.",
    });
  };

  const addImageComment = (imageId: string, comment: string) => {
    const newComment: ImageComment = {
      id: Date.now().toString(),
      imageId,
      comment,
      timestamp: new Date()
    };
    setImageComments(prev => [...prev, newComment]);
  };

  const handleWebhookUpdate = (workflowId: string, url: string) => {
    setWebhooks(prev => ({
      ...prev,
      [workflowId]: url
    }));
    
    setWorkflows(prev => 
      prev.map(workflow => 
        workflow.id === workflowId 
          ? { ...workflow, n8nUrl: url }
          : workflow
      )
    );
  };

  const currentStep = workflows.findIndex(w => w.status === "pending" || w.status === "running");
  const completedSteps = workflows.filter(w => w.status === "completed").length;
  const progress = (completedSteps / workflows.length) * 100;

  const getWorkflowsForRole = (role: UserRole) => {
    return workflows.filter(w => !w.requiredRole || w.requiredRole === role);
  };

  const isStepEnabled = (workflow: WorkflowStep) => {
    if (!workflow.enabledAfter) return true;
    const prerequisite = workflows.find(w => w.id === workflow.enabledAfter);
    return prerequisite?.status === "completed";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-between items-start mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div></div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Promotional Content Creation
          </h1>
          <p className="text-xl text-muted-foreground">
            Workflow Management Dashboard
          </p>
          
          {/* Header Controls */}
          <div className="flex justify-center gap-4 mt-4">
            <Button 
              onClick={() => navigate("/tasks")}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View All Tasks Overview
            </Button>
            
            <Button 
              onClick={() => setShowWebhookSettings(true)}
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Webhook Settings
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-workflow-bg rounded-full h-3 mt-6">
            <div 
              className="bg-gradient-workflow h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {completedSteps} of {workflows.length} steps completed
          </p>
        </div>

        {/* Role-based Tabs */}
        <Tabs value={currentUserRole} onValueChange={(value) => setCurrentUserRole(value as UserRole)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requestor" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Requestor View
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requestor" className="space-y-6">
            <div className="grid gap-6">
              {getWorkflowsForRole("requestor").map((workflow, index) => (
                <Card 
                  key={workflow.id}
                  className={`p-6 transition-all duration-300 hover:shadow-card-custom ${
                    !isStepEnabled(workflow) ? 'opacity-50' : 'cursor-pointer'
                  } ${
                    workflow.status === "running" ? 'ring-2 ring-primary shadow-workflow' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-workflow-bg">
                        <span className="text-lg font-bold text-foreground">
                          {index + 1}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold text-foreground">
                          {workflow.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {workflow.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant="outline" 
                        className={`bg-${getStatusColor(workflow.status)} text-${getStatusColor(workflow.status)}-foreground border-${getStatusColor(workflow.status)}`}
                      >
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(workflow.status)}
                          <span className="capitalize">{workflow.status}</span>
                        </span>
                      </Badge>

                      {workflow.id === "request" && workflow.status === "pending" && (
                        <Button 
                          onClick={() => setShowRequestForm(true)}
                          className="bg-gradient-workflow hover:opacity-90"
                        >
                          Submit Request
                        </Button>
                      )}

                      {workflow.id === "requestor-review" && workflow.status === "pending" && isStepEnabled(workflow) && (
                        <div className="space-y-4">
                          <div className="text-sm text-muted-foreground">
                            Review the outputs and leave feedback:
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Mock images for demonstration */}
                            {[1, 2, 3, 4].map((imageId) => (
                              <div key={imageId} className="space-y-2">
                                <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                                  <span className="text-muted-foreground">Image {imageId}</span>
                                </div>
                                <Textarea
                                  placeholder="Leave a comment..."
                                  className="text-sm"
                                  onBlur={(e) => {
                                    if (e.target.value.trim()) {
                                      addImageComment(imageId.toString(), e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleRequestorConfirm}
                              className="bg-gradient-workflow hover:opacity-90"
                            >
                              Confirm & Proceed
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {workflow.status === "running" && (
                    <div className="mt-4">
                      <KangarooAnimation 
                        workflowType={workflow.id as "creation" | "review" | "get-outputs"} 
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <div className="grid gap-6">
              {getWorkflowsForRole("admin").map((workflow, index) => (
                <Card 
                  key={workflow.id}
                  className={`p-6 transition-all duration-300 hover:shadow-card-custom ${
                    !isStepEnabled(workflow) ? 'opacity-50' : 'cursor-pointer'
                  } ${
                    workflow.status === "running" ? 'ring-2 ring-primary shadow-workflow' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-workflow-bg">
                        <span className="text-lg font-bold text-foreground">
                          A{index + 1}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold text-foreground">
                          {workflow.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {workflow.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant="outline" 
                        className={`bg-${getStatusColor(workflow.status)} text-${getStatusColor(workflow.status)}-foreground border-${getStatusColor(workflow.status)}`}
                      >
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(workflow.status)}
                          <span className="capitalize">{workflow.status}</span>
                        </span>
                      </Badge>

                      {workflow.status === "pending" && isStepEnabled(workflow) && (
                        <Button 
                          onClick={() => handleStepComplete(workflow.id)}
                          className="bg-gradient-workflow hover:opacity-90"
                        >
                          {workflow.id === "done" ? "Archive Project" : "Complete Review"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Show requestor feedback for admin review */}
                  {workflow.id === "admin-review" && imageComments.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Requestor Feedback
                      </h4>
                      {imageComments.map((comment) => (
                        <div key={comment.id} className="text-sm text-muted-foreground mb-2">
                          <strong>Image {comment.imageId}:</strong> {comment.comment}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>


        {/* Summary */}
        {completedSteps === workflows.length && (
          <Card className="p-6 text-center bg-gradient-workflow animate-fade-in">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-primary-foreground" />
            <h2 className="text-2xl font-bold text-primary-foreground mb-2">
              All Workflows Completed!
            </h2>
            <p className="text-primary-foreground/80">
              Your promotional content creation process has been successfully completed.
            </p>
          </Card>
        )}

        <RequestCheckForm
          open={showRequestForm}
          onOpenChange={setShowRequestForm}
          onComplete={handleRequestCheckComplete}
        />
        
        <WebhookSettings
          open={showWebhookSettings}
          onOpenChange={setShowWebhookSettings}
          webhooks={webhooks}
          onWebhookUpdate={handleWebhookUpdate}
        />
      </div>
    </div>
  );
};

export default WorkflowDashboard;