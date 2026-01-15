import React from "react";
import { MessageSquare, Mail, Shield } from "lucide-react";

interface SupportSectionProps {
  onMochiRequestClick: () => void;
  onMochiHistoryClick: () => void;
  onMellClick: () => void;
  onFionaClick: () => void;
}

const SupportSection: React.FC<SupportSectionProps> = ({
  onMochiRequestClick,
  onMochiHistoryClick,
  onMellClick,
  onFionaClick,
}) => {
  const supportMembers = [
    {
      id: "mochi",
      name: "Mochi",
      role: "Request Handler",
      image: "/lovable-uploads/mochi-profile.png",
      icon: MessageSquare,
      onClick: onMochiRequestClick,
    },
    {
      id: "mell",
      name: "Mell",
      role: "Newsletter Manager",
      image: "/lovable-uploads/mell-profile.png",
      icon: Mail,
      onClick: onMellClick,
    },
    {
      id: "fiona",
      name: "Fiona",
      role: "Admin Dashboard",
      subRole: "Admin Only",
      image: "/lovable-uploads/fiona-admin-profile.png",
      icon: Shield,
      onClick: onFionaClick,
      isAdminOnly: true,
    },
  ];

  return (
    <div className="mt-8 pt-8 border-t border-border/30">
      <div className="bg-card rounded-xl px-4 py-4 shadow-sm">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 text-center">
          Support Team
        </h4>
        <div className="grid grid-cols-3 gap-4 justify-items-center">
          {supportMembers.map((member) => (
            <div
              key={member.id}
              data-profile-name={member.id}
              className="group flex flex-col items-center text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring rounded-md p-1"
              onClick={member.onClick}
              role="button"
              tabIndex={0}
            >
              <div className="relative">
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-125"
                    loading="lazy"
                  />
                </div>
                {!member.isAdminOnly && (
                  <span className="absolute bottom-0 right-0 z-10 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div className="mt-2">
                <div className="text-xs font-medium text-foreground">{member.name}</div>
                <div className="text-xs text-muted-foreground">{member.role}</div>
                {member.subRole && (
                  <div className="text-[10px] text-muted-foreground/70">{member.subRole}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportSection;
