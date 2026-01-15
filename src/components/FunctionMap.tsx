import React, { useEffect, useRef } from "react";
type ProfileMap = {
  yumi: string;
  ben: string;
};
type ProfileItem = {
  name: string;
  role: string;
  imageSrc: string;
};
type Group = {
  title: string;
  items: ProfileItem[];
} | {
  title: string;
  sections: {
    subtitle: string;
    items: ProfileItem[];
  }[];
};
type FunctionMapProps = {
  profiles: ProfileMap;
  onProfileClick?: (name: string) => void;
  highlightName?: string;
  supportSection?: React.ReactNode;
};
const FunctionMap: React.FC<FunctionMapProps> = ({
  profiles,
  onProfileClick,
  highlightName,
  supportSection
}) => {
  const containerRef = useRef<HTMLElement | null>(null);

  // Crew member profiles with descriptions, personality traits, and admin info
  const crewProfiles: Record<string, {
    description: string;
    personality: string;
    videoUrl?: string;
    admin?: { name: string; email: string };
  }> = {
    "vee": {
      description: "Vee serves as the central command center for all AI agents, coordinating complex workflows and optimizing collaboration between teams.",
      personality: "Systematic and analytical, prefers solving problems from a holistic perspective."
    },
    "fiona": {
      description: "Fiona is dedicated to account deletion and cleanup tasks, ensuring safe account management through compliance with data security and privacy regulations.",
      personality: "Cautious and perfectionist, with strong responsibility for security and compliance."
    },
    "boris": {
      description: "Boris serves as the promotion team coordinator, assisting in marketing campaign planning and connecting specialized departments.",
      personality: "Always ready to help, enjoys fast and efficient communication."
    },
    "yumi": {
      description: "Yumi is an EI-Form designer for LG Electronics brand templates, creating clean and intuitive designs that comply with brand guidelines.",
      personality: "Executes requests immediately, interested in fast and efficient design.",
      admin: { name: "Donguk Yim", email: "donguk.yim@lge.com" }
    },
    "ben": {
      description: "Ben creates dotcom PTO model gallery images. Generates images reflecting accurate information with consistent and stable quality.",
      personality: "Very interested in dotcom gallery image domain and continuously learning.",
      admin: { name: "Donguk Yim", email: "donguk.yim@lge.com" }
    },
    "pip": {
      description: "Pip is a Content QA specialist who reviews whether content is created according to Content Creation Guidelines and Brand Guidelines, and guides proper content creation direction.",
      personality: "Meticulous and careful, provides accurate feedback based on deep understanding of brand guidelines and quality standards."
    },
    "mateo": {
      description: "Mateo avoids repetitive manual tasks. Upload an Excel template to perform crawling based on models and retailers, enabling trend analysis through competitor and own product data.",
      personality: "Competitor Crawling, Product Crawling, Data DB, Trend Analysis, Excel Template.",
      admin: { name: "Hyunsoo Park", email: "hyunsoo9.park@lge.com" }
    },
    "theo": {
      description: "Theo is the Content Operation manager who supports subsidiary/BU representatives with NPI product registration requests and helps monitor readiness check status for new product launches.",
      personality: "NPI Operation, Content Operation, Product Registration, Readiness Check, BU Support."
    },
    "kai": {
      description: "Kai is a background removal specialist responsible for image editing and post-processing. Creates clean and professional images with precise technical skills.",
      personality: "Highly focused and perfectionist, enjoys detailed work.",
      admin: { name: "Donguk Yim", email: "donguk.yim@lge.com" }
    },
    "maple": {
      description: "Maple crawls live content from LG.COM. Currently, only homepage hero banners can be viewed, but we plan to gradually expand to bring various content from different pages.",
      personality: "Meticulous and patient, excels at systematic data collection. Content Crawling, LG.COM, Hero Banner, Web Scraping.",
      admin: { name: "Donguk Yim", email: "donguk.yim@lge.com" }
    },
    "noa": {
      description: "Noa helps with practical work based on product information from PIM (Product Information Management). Data extraction and product catalog creation are also possible.",
      personality: "Organized and detail-oriented, excels at managing complex product data. Product Catalog, Review syndication, Data extract.",
      admin: { name: "Jaeho Lee", email: "jaeho10.lee@lge.com" }
    },
    "luna": {
      description: "Creates audiences and offers in Adobe Target using natural language input.",
      personality: "Innovative and efficient, excels at automating complex marketing workflows. API Integration, Natural Language-Based Rule Setup, Offer in Adobe Target, Audience Automation.",
      admin: { name: "Yuseon Han", email: "yuseon.han@lge.com" }
    },
    "clara": {
      description: "Creates personalized images by crawling SKU data.",
      personality: "Creative and detail-oriented, excels at automating image production workflows. SKU Crawling, Image Creation, Image Resize, Image Combination.",
      admin: { name: "Yuseon Han", email: "yuseon.han@lge.com" }
    },
    "candy": {
      description: "Oversees DAM user guides, tutorials, and on-boarding.",
      personality: "Organized and supportive, excels at managing digital assets and guiding users. Digital Asset Management, AEM, DAM On-Boarding, DAM Guide.",
      admin: { name: "Yunju bak", email: "yunju.bak@lge.com" }
    },
    "milo": {
      description: "Milo is an eCRM Designer who creates email content based on pre-designed layouts. He helps produce modular email components by customizing text, visuals, and formatting to match brand guidelines for customer communications.",
      personality: "Detail-oriented and creative, excels at crafting visually appealing email content. eCRM Design, Email Marketing, Modular Content, Brand Compliance.",
      admin: { name: "Donguk Yim", email: "donguk.yim@lge.com" }
    },
    "anita": {
      description: "Anita is a Lifestyle Artist who creates compelling lifestyle content and visual storytelling for marketing campaigns.",
      personality: "Creative and artistic, excels at capturing lifestyle moments and brand aesthetics. Lifestyle Content, Visual Storytelling, Brand Aesthetics.",
      admin: { name: "Donguk Yim", email: "donguk.yim@lge.com" }
    },
    "mochi": {
      description: "Mochi handles user requests for new AI crew members or development needs. Submit your pain points and improvement ideas.",
      personality: "Friendly and responsive, excels at understanding user needs and facilitating communication."
    },
    "mell": {
      description: "Mell manages email announcements and newsletters, keeping the team informed about updates, changes, and important news.",
      personality: "Clear communicator, excels at organizing and distributing information effectively."
    },
    "fiona-admin": {
      description: "Fiona provides admin access to view all crew activities, requests, and engagement metrics in a comprehensive dashboard.",
      personality: "Organized and analytical, excels at data aggregation and insights delivery."
    }
  };
  // Organizational structure with divisions
  const divisions = [{
    name: "Marketing",
    teams: [{
      title: "Content Team",
      items: [{
        name: "Yumi",
        role: "El-Form Designer",
        imageSrc: profiles.yumi
      }, {
        name: "Ben",
        role: "PTO Image Creator",
        imageSrc: profiles.ben
      }, {
        name: "Maple",
        role: "Content Crawler",
        imageSrc: "/lovable-uploads/maple-profile.png"
      }, {
        name: "Kai",
        role: "Background Remover",
        imageSrc: "/lovable-uploads/84e535ab-1fa5-418e-93aa-73fa3b361219.png"
      }, {
        name: "Noa",
        role: "Product Information Manager",
        imageSrc: "/lovable-uploads/noa-profile.png"
      }, {
        name: "Anita",
        role: "Lifestyle Artist",
        imageSrc: "/lovable-uploads/anita-profile.png"
      }, {
        name: "Milo",
        role: "eCRM Designer",
        imageSrc: "/lovable-uploads/milo-profile.png"
      }]
    }, {
      title: "On-Site Marketing Team",
      items: [{
        name: "Clara",
        role: "Personalized Content Consultant",
        imageSrc: "/lovable-uploads/a4614e4b-7d0d-429f-8b4c-ddc8b85ee3ad.png"
      }, {
        name: "Luna",
        role: "Personalized Marketing Expert",
        imageSrc: "/lovable-uploads/luna-profile.png"
      }]
    }]
  }, {
    name: "Digital Platform",
    teams: [{
      title: "Platform Development Team",
      items: [{
        name: "Mateo",
        role: "Crawler",
        imageSrc: "/lovable-uploads/mateo-profile.png"
      }, {
        name: "Theo",
        role: "NPI Operation Manager",
        imageSrc: "/lovable-uploads/theo-profile.png"
      }]
    }, {
      title: "Platform Operation Team",
      items: [{
        name: "Candy",
        role: "DAM Tutor",
        imageSrc: "/lovable-uploads/candy-profile.png"
      }]
    }]
  }, {
    name: "Data Intelligence",
    teams: [{
      title: "Global Data Insight Team",
      items: []
    }]
  }];
  useEffect(() => {
    // Clear previous dim states and highlights
    const allProfiles = containerRef.current?.querySelectorAll('[data-profile-name]');
    allProfiles?.forEach(el => {
      el.classList.remove('search-dimmed', 'search-highlighted', 'search-highlight', 'ring-2', 'ring-primary', 'bg-primary/10', 'pulse', 'bg-muted/40');
    });
    if (!highlightName) return;
    const searchTerm = highlightName.toLowerCase().trim();
    if (!searchTerm) return;

    // Find all profiles and determine matches
    const profileElements = containerRef.current?.querySelectorAll('[data-profile-name]');
    let hasMatches = false;
    profileElements?.forEach(el => {
      const profileName = el.getAttribute('data-profile-name') || '';
      const roleText = el.querySelector('.text-xs.text-muted-foreground')?.textContent?.toLowerCase() || '';

      // Get crew profile data for bio and description
      const crewData = crewProfiles[profileName];
      const description = crewData?.description?.toLowerCase() || '';
      const personality = crewData?.personality?.toLowerCase() || '';

      // Search across name, role, description, and personality
      const isMatch = profileName.includes(searchTerm) || roleText.includes(searchTerm) || description.includes(searchTerm) || personality.includes(searchTerm);
      if (isMatch) {
        // Mark as highlighted (no visual change, just for tracking)
        el.classList.add('search-highlighted');
        hasMatches = true;
      } else {
        // Dim non-matching profiles
        el.classList.add('search-dimmed');
      }
    });

    // Scroll to first match
    if (hasMatches) {
      const firstMatch = containerRef.current?.querySelector('.search-highlighted');
      if (firstMatch) {
        firstMatch.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [highlightName]);
  return <section ref={containerRef} aria-label="Agent functions map" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Super Agent as first item */}
        <div className="xl:col-span-3 md:col-span-2 bg-[hsl(var(--function-map-bg))] rounded-xl p-4">
          {/* Super Agent Section */}
          <div className="text-center mb-8">
            
            
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                 
                <div className="text-center">
                  
                  
                </div>
              </div>
            </div>
          </div>
          
          {/* Organizational Chart */}
          <div className="space-y-8">
            {/* D2C Header */}
            <div className="text-center mb-4 relative">
              <div className="flex justify-center mb-6">
                <div className="text-lg font-semibold text-foreground">D2C Overseas Sales and Marketing Group</div>
              </div>
            </div>

            {/* Division Headers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 relative">
              {/* Horizontal line connecting all divisions - hidden on mobile */}
              <div className="hidden lg:block absolute left-16 right-16 -top-4 h-0.5 bg-border"></div>
              
              {/* Vertical lines separating divisions */}
              
              
              
              
              {divisions.map((division, index) => <div key={division.name} className="text-center">
                  <h3 className="text-foreground font-semibold text-base mb-2">
                    {division.name}
                  </h3>
                  
                  {/* Division Leader */}
                  <div className="flex justify-center mb-4 pb-6">
                    <div className="flex flex-col items-center">
                      <div className="relative h-12 w-12">
                        <div className="h-full w-full rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-medium" style={{
                      backgroundColor: '#F87171'
                    }}>
                          {division.name.charAt(0)}
                        </div>
                        {/* Leader Badge */}
                        <img 
                          src="/lovable-uploads/leader-badge.png" 
                          alt="Leader badge" 
                          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border border-background"
                        />
                      </div>
                      <div className="mt-1">
                        <div className="text-xs font-medium text-foreground">Division Leader</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Teams under each division */}
                  <div className="grid gap-4">
                    {division.teams.map(team => <div key={team.title} className="bg-card rounded-xl px-1 py-2 shadow-sm">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3 text-center">
                          {team.title}
                        </h4>
                        {team.title === "DAM" || team.title === "Promotion" ? <div className="space-y-3">
                            {/* First row - Candy only */}
                            <div className="flex justify-center">
                                {team.items.slice(0, 1).map(item => <div key={`${team.title}-${item.name}`} data-profile-name={item.name.toLowerCase()} className="group flex flex-col items-center text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring rounded-md p-1" onClick={e => {
                        e.stopPropagation();
                        console.log('Clicked profile:', item.name);
                        onProfileClick?.(item.name);
                      }} role="button" tabIndex={0}>
                                  <div className="relative">
                                    <div className={`h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden ${item.name === "Boris" ? "border-2 border-red-500" : ""}`}>
                                      {item.imageSrc ? <img src={item.imageSrc} alt={`${item.name} profile image`} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full flex items-center justify-center text-foreground/80 text-sm font-medium" style={{
                              backgroundColor: '#6B6B6B'
                            }}>
                                          {item.name.charAt(0)}
                                        </div>}
                                    </div>
                                    {(item.name === "Ben" || item.name === "Kai" || item.name === "Noa" || item.name === "Candy" || item.name === "Anita" || item.name === "Milo") && (
                                      <span className="absolute bottom-0 right-0 z-10 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background" />
                                    )}
                                    {(item.name === "Maple" || item.name === "Mateo") && (
                                      <span className="absolute bottom-0 right-0 z-10 h-3.5 w-3.5 bg-yellow-500 rounded-full border-2 border-background" />
                                    )}
                                    {(item.name === "Yumi" || item.name === "Clara" || item.name === "Luna" || item.name === "Theo") && (
                                      <span className="absolute bottom-0 right-0 z-10 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-background" />
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    <div className="text-xs font-medium text-foreground">{item.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.role.includes("&") ? item.role.split("&").map((part, index) => <div key={index}>{part.trim()}</div>) : item.role}
                                    </div>
                                  </div>
                                </div>)}
                            </div>
                            {/* Second row - Maya and On Hiring */}
                            <div className="flex justify-center gap-3">
                                {team.items.slice(1).map(item => <div key={`${team.title}-${item.name}`} data-profile-name={item.name.toLowerCase()} className="group flex flex-col items-center text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring rounded-md p-1" onClick={e => {
                        e.stopPropagation();
                        console.log('Clicked profile:', item.name);
                        onProfileClick?.(item.name);
                      }} role="button" tabIndex={0}>
                                  <div className="relative">
                                    <div className={`h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden ${item.name === "Boris" ? "border-2 border-red-500" : ""}`}>
                                      {item.imageSrc ? <img src={item.imageSrc} alt={`${item.name} profile image`} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full flex items-center justify-center text-foreground/80 text-sm font-medium" style={{
                              backgroundColor: '#6B6B6B'
                            }}>
                                        </div>}
                                    </div>
                                    {(item.name === "Ben" || item.name === "Kai" || item.name === "Noa" || item.name === "Candy" || item.name === "Anita" || item.name === "Milo") && (
                                      <span className="absolute bottom-0 right-0 z-10 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background" />
                                    )}
                                    {(item.name === "Maple" || item.name === "Mateo") && (
                                      <span className="absolute bottom-0 right-0 z-10 h-3.5 w-3.5 bg-yellow-500 rounded-full border-2 border-background" />
                                    )}
                                    {(item.name === "Yumi" || item.name === "Dan" || item.name === "Ava" || item.name === "Clara" || item.name === "Luna" || item.name === "Levi" || item.name === "Theo") && (
                                      <span className="absolute bottom-0 right-0 z-10 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-background" />
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    <div className="text-xs font-medium text-foreground">{item.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.role.includes("&") ? item.role.split("&").map((part, index) => <div key={index}>{part.trim()}</div>) : item.role}
                                    </div>
                                  </div>
                                </div>)}
                            </div>
                          </div> : <div className="grid grid-cols-2 gap-4 justify-items-center">
                             {team.items.map(item => <div key={`${team.title}-${item.name}`} data-profile-name={item.name.toLowerCase()} className="group flex flex-col items-center text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring rounded-md p-1" onClick={e => {
                      e.stopPropagation();
                      onProfileClick?.(item.name);
                    }} role="button" tabIndex={0}>
                                <div className="relative">
                                  <div className={`h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden ${item.name === "Boris" ? "border-2 border-red-500" : ""}`}>
                                    {item.imageSrc ? <img src={item.imageSrc} alt={`${item.name} profile image`} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full flex items-center justify-center text-foreground/80 text-sm font-medium" style={{
                            backgroundColor: '#6B6B6B'
                          }}>
                                        {item.name.charAt(0)}
                                      </div>}
                                  </div>
                                  {(item.name === "Ben" || item.name === "Kai" || item.name === "Noa" || item.name === "Candy" || item.name === "Anita" || item.name === "Milo") && (
                                    <span className="absolute bottom-0 right-0 z-10 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background" />
                                  )}
                                  {(item.name === "Maple" || item.name === "Mateo") && (
                                    <span className="absolute bottom-0 right-0 z-10 h-3.5 w-3.5 bg-yellow-500 rounded-full border-2 border-background" />
                                  )}
                                  {(item.name === "Yumi" || item.name === "Dan" || item.name === "Ava" || item.name === "Clara" || item.name === "Luna" || item.name === "Levi" || item.name === "Theo") && (
                                    <span className="absolute bottom-0 right-0 z-10 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-background" />
                                  )}
                                </div>
                                <div className="mt-2">
                                  <div className="text-xs font-medium text-foreground">{item.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.role.includes("&") ? item.role.split("&").map((part, index) => <div key={index}>{part.trim()}</div>) : item.role}
                                  </div>
                                </div>
                              </div>)}
                          </div>}
                      </div>)}
                  </div>
                </div>)}
            </div>

          </div>

          {/* Support Section - Support Team */}
          {supportSection}
        </div>
      </div>

    </section>;
};
export default FunctionMap;