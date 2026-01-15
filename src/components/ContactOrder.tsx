import { FC } from "react";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Agent {
  name: string;
  image: string;
}

interface ContactOrderProps {
  agents: Agent[];
  ariaLabel?: string;
}

const initials = (name: string) => name.trim().charAt(0).toUpperCase();

const ContactOrder: FC<ContactOrderProps> = ({ agents, ariaLabel = "Suggested contact order" }) => {
  if (!agents?.length) return null;

  return (
    <aside aria-label={ariaLabel} className="mt-4">
      {/* removed contact order list as requested */}
    </aside>
  );
};

export default ContactOrder;
