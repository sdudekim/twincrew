import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, Mail, Calendar, Play, ExternalLink } from "lucide-react";

interface Newsletter {
  id: string;
  date: string;
  title: string;
  category: "Team Update" | "Announcement" | "Product News" | "Tips & Tricks";
  summary: string;
  content: string;
}

interface MellNewsletterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const newsletters: Newsletter[] = [
  {
    id: "2",
    date: "2026-01-14",
    title: "Twin Crew Update | Ben's Evolution: Smarter Scaling✨",
    category: "Product News",
    summary: "Ben just got smarter with product-aware scaling for realistic composition.",
    content: `Hello Team!

Great news on Twin Crew! Our PTO image creator, **Ben**, just got smarter.

---

**🏷️ WHAT'S NEW WITH BEN?**

**Smart Scaling & Realistic Composition**

Now Ben can identify each product's characteristics and arrange items like refrigerators and speakers with significant size differences according to their actual proportions.

• **Before**: Fixed Ratio (1:1 Scaling)
• **After**: Product-Aware Scaling (Reality-based)

---

**🇯🇵 Special Thanks to Mio Maruyama**

"This update was made possible thanks to Mio's valuable feedback, bringing us the real voice from Japan. Global teamwork is what makes TwinCrew smarter!"

---

"Now, leave the size worries to me! Check out the perfectly improved bundle images right away."

👉 [Start working with Ben](/pto-gallery)`
  },
  {
    id: "1",
    date: "2026-01-10",
    title: "🚀 Twin Crew Official Launch & Introducing Ben",
    category: "Announcement",
    summary: "AI Twin Crew has officially launched! Meet our first crew member, Ben.",
    content: `Hello Team!

Do you remember the **Twin Crew** teaser I briefly shared during the last GEM (Global Employee Meeting)?

<video_link>https://f.io/b45ENHeR</video_link>

As promised, we are building AI agents designed to solve specific **pain points** in your daily workflows.

**🎯 Our Goal**
Deploy a variety of "Crew" members that handle repetitive tasks efficiently, allowing you to focus on **high-value creative strategies**.

---

**#1. Meet Ben: The PTO Model Image Specialist**
👉 [Work with Ben](https://twin-crew.lge.com/pto-gallery)

Ben is an AI agent dedicated to creating **PTO model images optimized for LG.COM**.

• **Efficiency**: Say goodbye to the costs and lead times of traditional design process.
• **Standardization**: Ben generates images that are perfectly sized and formatted for LG.com instantly.

---

**⚠️ Important Notice: Usage & Budget**

Twin Crew operates on commercial AI systems that incur real-time costs per generation. Currently, HQ is sponsoring a **limited budget** to support this initial rollout.

• **Business Use Only**: Please use Ben strictly for official business tasks.
• **Budget Cap**: If the allocated budget is depleted due to excessive or non-essential usage, the service may be **temporarily suspended without notice**.
• **Feedback Welcome**: Since Ben has just been rolled out and may not be fully optimized yet, if you encounter any issues or have additional requests, please email donguk.yim@lge.com.

**More Twin Crew members coming soon! Stay tuned! 🎉**`
  }
];

const categoryColors: Record<Newsletter["category"], string> = {
  "Team Update": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Announcement": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Product News": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Tips & Tricks": "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const MellNewsletterDialog: React.FC<MellNewsletterDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/30">
              <img
                src="/lovable-uploads/mell-profile.png"
                alt="Mell"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Newsletters & Announcements
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Stay updated with the latest news from your AI crew
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(85vh-120px)]">
          <div className="p-6 space-y-4">
            {/* Pinned Video Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 rounded bg-red-500/20 flex items-center justify-center">
                  <span className="text-xs">📌</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pinned • What is Twin Crew?
                </span>
              </div>
              <div className="bg-card border border-border/50 rounded-lg overflow-hidden">
                <div className="aspect-video">
                  <iframe
                    src="https://f.io/jIAPGZlU"
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    title="Twin Crew Introduction Video"
                  />
                </div>
                <div className="p-3 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Twin Crew Introduction</h4>
                      <p className="text-xs text-muted-foreground">Meet your AI crew members</p>
                    </div>
                    <a 
                      href="https://f.io/jIAPGZlU" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Open in Frame.io <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-border/50" />

              {newsletters.map((newsletter, index) => (
                <div key={newsletter.id} className="relative pl-8 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>

                  {/* Card */}
                  <div
                    className={`
                      bg-card border border-border/50 rounded-lg overflow-hidden
                      transition-all duration-200 hover:border-primary/30 hover:shadow-lg
                      ${expandedId === newsletter.id ? "ring-1 ring-primary/20" : ""}
                    `}
                  >
                    {/* Card Header */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleExpand(newsletter.id)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(newsletter.date)}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${categoryColors[newsletter.category]}`}
                        >
                          {newsletter.category}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-foreground mb-2 leading-tight">
                        {newsletter.title}
                      </h3>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {newsletter.summary}
                      </p>

                      <button
                        className="mt-3 text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                      >
                        {expandedId === newsletter.id ? (
                          <>
                            Show Less <ChevronUp className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            Read More <ChevronDown className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expanded Content */}
                    {expandedId === newsletter.id && (
                      <div className="px-4 pb-4 pt-0 border-t border-border/30">
                        <div className="pt-4 prose prose-sm prose-invert max-w-none">
                          {newsletter.content.split("\n\n").map((paragraph, i) => {
                            // Check for video link tag
                            const videoMatch = paragraph.match(/<video_link>(.*?)<\/video_link>/);
                            if (videoMatch) {
                              const videoUrl = videoMatch[1];
                              return (
                                <div key={i} className="mb-4">
                                  <a 
                                    href={videoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-colors group"
                                  >
                                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                                      <Play className="h-5 w-5 text-primary fill-primary" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-foreground">Watch the Twin Crew Teaser Video</div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        Click to open in Frame.io <ExternalLink className="h-3 w-3" />
                                      </div>
                                    </div>
                                  </a>
                                </div>
                              );
                            }
                            
                            return (
                              <p
                                key={i}
                                className="text-sm text-muted-foreground mb-3 last:mb-0 whitespace-pre-line"
                                dangerouslySetInnerHTML={{
                                  __html: paragraph
                                    .replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>")
                                    .replace(/- (.*)/g, "<span class='block ml-2'>• $1</span>")
                                    .replace(/• (.*)/g, "<span class='block ml-2'>• $1</span>")
                                    .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-primary hover:underline'>$1</a>")
                                    .replace(/👉 (.*)/g, "<span class='block'>👉 $1</span>")
                                    .replace(/---/g, "<hr class='my-3 border-border/30' />")
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MellNewsletterDialog;
