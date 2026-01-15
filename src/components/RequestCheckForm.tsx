import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const requestSchema = z.object({
  requestorName: z.string().min(1, "Please enter requestor name"),
  requestorEmail: z.string().email("Please enter a valid email address"),
  country: z.string().min(1, "Please select a country"),
  promotionDetail: z.string().min(10, "Please enter promotion details (min 10 characters)"),
  layoutSelection: z.string().min(1, "Please select a layout"),
  productA: z.string().url("Please enter a valid Product A URL"),
  productALifestyle: z.string().min(1, "Please enter Product A lifestyle description"),
  productB: z.string().optional(),
  productBLifestyle: z.string().optional(),
  productC: z.string().optional(),
  productCLifestyle: z.string().optional(),
  benefitIcons: z.array(z.string()).max(3, "Maximum 3 benefit icons allowed"),
  publishingChannels: z.array(z.string()).min(1, "Please select at least one publishing channel"),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface RequestCheckFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const countries = [
  "United States", "Canada", "United Kingdom", "Germany", "France", 
  "Japan", "Australia", "Singapore", "South Korea", "Netherlands", "Thailand"
];

const benefitIconOptions = [
  "Fast Delivery", "Quality Guarantee", "24/7 Support", "Free Shipping",
  "Money Back", "Eco Friendly", "Premium Quality", "Limited Time"
];

const publishingChannelOptions = [
  "LG.COM", "DV360", "Criteo", "PMAX", "Mailing", "Social"
];

const layoutOptions = [
  {
    id: "layout-1",
    image: "/lovable-uploads/f516db70-16a5-4cc3-8f56-93713ad30446.png"
  },
  {
    id: "layout-2", 
    image: "/lovable-uploads/31a71a4e-1b8e-4d7a-b07d-5bd6df9f624a.png"
  },
  {
    id: "layout-3",
    image: "/lovable-uploads/eae203d0-da2f-4151-bab3-31c8af63e40e.png"
  },
  {
    id: "layout-4",
    image: "/lovable-uploads/76efa2dd-a233-469b-8c78-0957e563f8a4.png"
  },
  {
    id: "layout-5",
    image: "/lovable-uploads/eed1f1fe-e428-4edb-9f83-5a2f9807ab4b.png"
  },
  {
    id: "layout-6",
    image: "/lovable-uploads/78bed169-63a0-4583-b7d3-487b12042967.png"
  },
  {
    id: "layout-7",
    image: "/lovable-uploads/188b8ae7-841a-454f-9a00-8df0f48c302f.png"
  },
  {
    id: "layout-8",
    image: "/lovable-uploads/a13866cf-bd0c-4f69-9dab-668567499aa8.png"
  },
  {
    id: "layout-9",
    image: "/lovable-uploads/d7fddc92-677a-4deb-bb12-371d8ef3a5b4.png"
  },
  {
    id: "layout-10",
    image: "/lovable-uploads/f20bffa2-6fa6-4b4c-956b-e1d1d2bb3211.png"
  },
  {
    id: "layout-11",
    image: "/lovable-uploads/0626cb3c-cbe3-4b16-a5f6-29748386fa13.png"
  },
  {
    id: "layout-12",
    image: "/lovable-uploads/7640c1ee-2cad-4ca5-a843-a4b4a26963d8.png"
  },
  {
    id: "layout-13",
    image: "/lovable-uploads/5aa33b89-f85e-4af6-a279-0f8704318530.png"
  }
];

export const RequestCheckForm = ({ open, onOpenChange, onComplete }: RequestCheckFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requestorName: "",
      requestorEmail: "",
      country: "",
      promotionDetail: "",
      layoutSelection: "",
      productA: "",
      productALifestyle: "",
      productB: "",
      productBLifestyle: "",
      productC: "",
      productCLifestyle: "",
      benefitIcons: [],
      publishingChannels: [],
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    
    try {
      console.log("Submitting form data:", data);
      
      // Call N8N webhook to start the workflow
      const response = await fetch("https://dev.eaip.lge.com/n8n/webhook-test/this", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("N8N webhook response:", response);

      if (response.ok) {
        console.log("N8N webhook success");
        toast({
          title: "Request Submitted",
          description: "Promotional content request has been submitted and workflow started successfully.",
        });
        
        onComplete();
        onOpenChange(false);
        form.reset();
      } else {
        console.error("N8N webhook failed with status:", response.status);
        throw new Error(`Failed to submit request: ${response.status}`);
      }
    } catch (error) {
      console.error("N8N webhook error:", error);
      
      // Still complete the form submission even if webhook fails
      toast({
        title: "Request Submitted",
        description: "Request form submitted. Note: There may be a connection issue with the workflow service.",
        variant: "default",
      });
      
      onComplete();
      onOpenChange(false);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Promotional Content Request Form</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="requestorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requestor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter requestor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requestorEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requestor Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promotionDetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Promotion Detail</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter detailed promotion description"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="layoutSelection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Layout Selection</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {layoutOptions.map((layout) => (
                          <div key={layout.id} className="relative">
                            <RadioGroupItem
                              value={layout.id}
                              id={layout.id}
                              className="peer sr-only"
                            />
                            <label
                              htmlFor={layout.id}
                              className="cursor-pointer block border-2 border-muted rounded-lg p-2 hover:border-primary peer-checked:border-primary transition-colors"
                            >
                              <img
                                src={layout.image}
                                alt={`Layout ${layout.id}`}
                                className="w-full h-40 object-contain bg-gray-50 rounded-md"
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Products</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product A URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Please copy and paste the PDP url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productALifestyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product A - Lifestyle</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., happy businessman in a hotel room working" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product B URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Please copy and paste the PDP url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productBLifestyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product B - Lifestyle (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter lifestyle description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product C URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Please copy and paste the PDP url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productCLifestyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product C - Lifestyle (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter lifestyle description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="benefitIcons"
              render={() => (
                <FormItem>
                  <FormLabel>Benefit Icon Select (max 3)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {benefitIconOptions.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="benefitIcons"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked && current.length < 3) {
                                      field.onChange([...current, item]);
                                    } else if (!checked) {
                                      field.onChange(current.filter((value) => value !== item));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {item}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publishingChannels"
              render={() => (
                <FormItem>
                  <FormLabel>Publishing Channels Select</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {publishingChannelOptions.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="publishingChannels"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, item]);
                                    } else {
                                      field.onChange(current.filter((value) => value !== item));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {item}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};