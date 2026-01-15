import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crewName: "Ben" | "Anita";
  productUrls: string[];
}

const FeedbackDialog = ({
  open,
  onOpenChange,
  crewName,
  productUrls,
}: FeedbackDialogProps) => {
  const [feedbackType, setFeedbackType] = useState<'like' | 'dislike' | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackType) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('ben-feedback-email', {
        body: {
          crewName,
          feedbackType,
          comment: feedbackType === 'dislike' ? comment : '',
          productUrls,
        },
      });

      if (error) {
        console.error('Error sending feedback:', error);
        toast.error('Failed to send feedback.');
        return;
      }

      setSubmitted(true);
      toast.success('Thank you for your feedback!');
      
      setTimeout(() => {
        onOpenChange(false);
        setTimeout(() => {
          setFeedbackType(null);
          setComment("");
          setSubmitted(false);
        }, 300);
      }, 1500);
    } catch (err) {
      console.error('Error:', err);
      toast.error('An error occurred while sending feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = () => {
    setFeedbackType('like');
  };

  const handleDislike = () => {
    setFeedbackType('dislike');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            How was {crewName}'s work?
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center py-8">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-lg font-medium text-green-600">Thank you!</p>
            <p className="text-sm text-muted-foreground">Your feedback has been submitted.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Feedback buttons */}
            <div className="flex justify-center gap-6 py-4">
              <button
                onClick={handleLike}
                className={`flex flex-col items-center p-4 rounded-xl transition-all ${
                  feedbackType === 'like'
                    ? 'bg-green-100 dark:bg-green-900/40 ring-2 ring-green-500'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <ThumbsUp
                  className={`h-10 w-10 mb-2 ${
                    feedbackType === 'like' ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                />
                <span className={`text-sm font-medium ${
                  feedbackType === 'like' ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  Like
                </span>
              </button>

              <button
                onClick={handleDislike}
                className={`flex flex-col items-center p-4 rounded-xl transition-all ${
                  feedbackType === 'dislike'
                    ? 'bg-red-100 dark:bg-red-900/40 ring-2 ring-red-500'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <ThumbsDown
                  className={`h-10 w-10 mb-2 ${
                    feedbackType === 'dislike' ? 'text-red-600' : 'text-muted-foreground'
                  }`}
                />
                <span className={`text-sm font-medium ${
                  feedbackType === 'dislike' ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  Dislike
                </span>
              </button>
            </div>

            {/* Comment textarea - only show when dislike is selected */}
            {feedbackType === 'dislike' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-medium">
                  What could be improved?
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Please share your feedback..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            )}

            {/* Submit button */}
            {feedbackType && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (feedbackType === 'dislike' && !comment.trim())}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
