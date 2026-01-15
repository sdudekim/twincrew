import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

type TaskStatus = "pending" | "in-progress" | "completed" | "failed";

interface Task {
  id: string;
  title: string;
  requestor: string;
  date: string;
  volume: number;
  status: TaskStatus;
  description: string;
}

const TaskOverview = () => {
  const navigate = useNavigate();
  
  const [tasks] = useState<Task[]>([
    {
      id: "task-001",
      title: "Summer Campaign KV",
      requestor: "Marketing Team",
      date: "2024-01-15",
      volume: 12,
      status: "completed",
      description: "Summer promotional campaign key visuals for social media"
    },
    {
      id: "task-002", 
      title: "Product Launch Materials",
      requestor: "John Smith",
      date: "2024-01-20",
      volume: 8,
      status: "in-progress",
      description: "New product launch promotional materials"
    },
    {
      id: "task-003",
      title: "Holiday Sale Banners",
      requestor: "Sarah Johnson",
      date: "2024-01-22",
      volume: 15,
      status: "pending",
      description: "Holiday sale promotional banners in multiple sizes"
    },
    {
      id: "task-004",
      title: "Brand Refresh Content",
      requestor: "Creative Team",
      date: "2024-01-18",
      volume: 6,
      status: "failed",
      description: "Brand refresh promotional content creation"
    }
  ]);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "workflow-success";
      case "in-progress":
        return "workflow-pending";
      case "failed":
        return "workflow-error";
      default:
        return "muted";
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case "in-progress":
        return "In Progress";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workflow
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Task Overview
              </h1>
              <p className="text-xl text-muted-foreground">
                All promotional content creation tasks
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-workflow-success">
              {tasks.filter(t => t.status === "completed").length}
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-workflow-pending">
              {tasks.filter(t => t.status === "in-progress").length}
            </div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {tasks.filter(t => t.status === "pending").length}
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-workflow-error">
              {tasks.filter(t => t.status === "failed").length}
            </div>
            <p className="text-sm text-muted-foreground">Failed</p>
          </Card>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Recent Tasks</h2>
          
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card key={task.id} className="p-6 hover:shadow-card-custom transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-foreground">
                        {task.title}
                      </h3>
                      <Badge 
                        variant="outline"
                        className={`bg-${getStatusColor(task.status)} text-${getStatusColor(task.status)}-foreground border-${getStatusColor(task.status)}`}
                      >
                        {getStatusText(task.status)}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{task.requestor}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(task.date).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4" />
                        <span>{task.volume} assets</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6">
                    <Button 
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskOverview;