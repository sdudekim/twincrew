import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Settings, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebhookSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhooks: Record<string, string>;
  onWebhookUpdate: (workflowId: string, url: string) => void;
}

const workflows = [
  { id: "creation", title: "Creation", description: "Get template PSD, replace images, add text, and create size variations" },
  { id: "review", title: "Review", description: "See all outputs - review the results and leave comments if anything needs to be fixed" },
  { id: "get-outputs", title: "Get Outputs", description: "Click to download all the finalized files" }
];

export const WebhookSettings = ({ open, onOpenChange, webhooks, onWebhookUpdate }: WebhookSettingsProps) => {
  const { toast } = useToast();
  const [localWebhooks, setLocalWebhooks] = useState(webhooks);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateWebhookUrl = (workflowId: string) => {
    return `${window.location.origin}/api/webhook/${workflowId}`;
  };

  const handleCopyWebhook = async (workflowId: string) => {
    const webhookUrl = generateWebhookUrl(workflowId);
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedId(workflowId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Webhook URL has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    Object.entries(localWebhooks).forEach(([workflowId, url]) => {
      onWebhookUpdate(workflowId, url);
    });
    
    toast({
      title: "Settings Saved",
      description: "Webhook configurations have been updated.",
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Webhook Configuration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">How it works:</h3>
            <p className="text-sm text-muted-foreground">
              Configure your N8N workflows to send POST requests to the webhook URLs below when they complete. 
              This will automatically update the workflow status to "completed" in this dashboard.
            </p>
          </div>

          {workflows.map((workflow) => (
            <Card key={workflow.id} className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{workflow.title}</h3>
                  <p className="text-sm text-muted-foreground">{workflow.description}</p>
                </div>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor={`webhook-${workflow.id}`}>Webhook URL (Copy this to your N8N workflow)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id={`webhook-${workflow.id}`}
                        value={generateWebhookUrl(workflow.id)}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyWebhook(workflow.id)}
                        className="px-3"
                      >
                        {copiedId === workflow.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`n8n-${workflow.id}`}>N8N Workflow URL (Optional - for manual access)</Label>
                    <Input
                      id={`n8n-${workflow.id}`}
                      value={localWebhooks[workflow.id] || ""}
                      onChange={(e) => setLocalWebhooks(prev => ({
                        ...prev,
                        [workflow.id]: e.target.value
                      }))}
                      placeholder="https://your-n8n-instance.com/workflow/..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">N8N Configuration Instructions:</h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Copy the webhook URL for each workflow</li>
              <li>In your N8N workflow, add an HTTP Request node at the end</li>
              <li>Set the method to POST and paste the webhook URL</li>
              <li>Add a JSON body with: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{"{"}"status": "completed"{"}"}</code></li>
              <li>Test your workflow to ensure the webhook is triggered</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};