import React from "react";

export type OrgChartProps = {
  leader: { name: string; image: string };
  profiles: { yumi: string; ben: string; carmen?: string };
  onAgentClick: (agent: string, route: string) => void;
  damProfiles?: { name: string; image: string }[];
};

const OrgChart: React.FC<OrgChartProps> = ({ leader, profiles, onAgentClick, damProfiles = [] }) => {
  return (
    <section aria-label="Organization chart" className="rounded-2xl border bg-card p-6 shadow-sm space-y-5 max-w-4xl mx-auto">
      {/* Leader (조직장) */}
      <section aria-labelledby="org-leader">
        <div className="flex justify-center">
          <article className="rounded-xl bg-transparent p-0 flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full overflow-hidden">
              <img
                src={leader.image}
                alt={`${leader.name} profile image`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Leader</div>
              <h3 id="org-leader" className="text-xl font-semibold text-foreground">
                {leader.name}
              </h3>
            </div>
          </article>
        </div>
      </section>

      {/* Departments */}
      <div className="grid lg:grid-cols-3 gap-y-4 gap-x-1 md:gap-x-2">
        {/* Marketing */}
        <article className="rounded-xl bg-muted/20 p-3 flex flex-col">
          <header className="mb-3">
            <h2 className="text-xl font-semibold text-foreground">Marketing</h2>
          </header>

          {/* Team Lead */}
          <section aria-labelledby="marketing-lead" className="mb-3">
            <div className="text-sm text-muted-foreground mb-2">Team Lead</div>
            <div
              onClick={() => onAgentClick('Carmen', '')}
              className="group cursor-pointer rounded-md p-2 transition hover:bg-muted/30"
              aria-label="Open Carmen profile in functions"
            >
              <div className="flex items-center gap-2">
                <div className="relative h-16 w-16 rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-110">
                  <img src={profiles.carmen ?? "/lovable-uploads/c67db3d8-8cdc-426a-80e4-b8e7b6bf4604.png"} alt="Carmen profile image" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Carmen</div>
                  <div className="text-xs text-muted-foreground">Marketing Lead</div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Members */}
          <section aria-label="Team Members" className="space-y-2 order-3">
            <div
              onClick={() => onAgentClick('Ben', '')}
              className="hidden group cursor-pointer rounded-md p-2 transition hover:bg-muted/30"
              aria-label="Open Ben PTO gallery workflow"
            >
              <div className="flex items-center gap-2">
                <div className="relative h-14 w-14 rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-110">
                  <img src={profiles.ben} alt="Ben profile image" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Ben</div>
                  <div className="text-xs text-muted-foreground">Gallery Images</div>
                </div>
              </div>
            </div>

            {[1,2,3].map((i) => (
              <div key={`mkt-member-${i}`} onClick={() => onAgentClick('AI', '')} className="group cursor-pointer rounded-md p-2 transition hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground transition-transform duration-200 group-hover:scale-110">AI</div>
                  <div>
                    <div className="font-medium text-foreground">Hiring</div>
                    <div className="text-xs text-muted-foreground">Social/Email</div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {damProfiles.length > 0 && (
            <section aria-label="DAM Project" className="mt-2">
              
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {damProfiles.map((p) => (
                  <div
                    key={`dam-${p.name}`}
                    onClick={() => onAgentClick(p.name, '')}
                    className="group cursor-pointer rounded-md p-2 transition hover:bg-muted/30"
                    aria-label={`Open ${p.name} profile`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-110">
                        <img src={p.image} alt={`${p.name} profile image`} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Platform */}
        <article className="rounded-xl bg-muted/20 p-3">
          <header className="mb-3">
            <h2 className="text-xl font-semibold text-foreground">Platform</h2>
          </header>

          {/* Team Lead */}
          <section aria-labelledby="platform-lead" className="mb-3">
            <div className="text-sm text-muted-foreground mb-2">Team Lead</div>
            <div onClick={() => onAgentClick('AI', '')} className="group cursor-pointer rounded-md p-3 transition hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground transition-transform duration-200 group-hover:scale-110">AI</div>
                <div>
                  <div className="font-medium text-foreground">Hiring</div>
                  <div className="text-xs text-muted-foreground">Platform Lead</div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Members */}
          <section aria-label="Team Members" className="space-y-3">
            <div onClick={() => onAgentClick('AI', '')} className="group cursor-pointer rounded-md p-3 transition hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground transition-transform duration-200 group-hover:scale-110">AI</div>
                <div>
                  <div className="font-medium text-foreground">Integration</div>
                  <div className="text-xs text-muted-foreground">Multi Agent (Hiring)</div>
                </div>
              </div>
            </div>
            <div onClick={() => onAgentClick('AI', '')} className="group cursor-pointer rounded-md p-3 transition hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground transition-transform duration-200 group-hover:scale-110">AI</div>
                <div>
                  <div className="font-medium text-foreground">Integration</div>
                  <div className="text-xs text-muted-foreground">Sub Agent (Hiring)</div>
                </div>
              </div>
            </div>
            {[1,2].map((i) => (
              <div key={`plat-auto-${i}`} onClick={() => onAgentClick('AI', '')} className="group cursor-pointer rounded-md p-3 transition hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground transition-transform duration-200 group-hover:scale-110">AI</div>
                  <div>
                    <div className="font-medium text-foreground">Automation</div>
                    <div className="text-xs text-muted-foreground">Sub Agent (Hiring)</div>
                  </div>
                </div>
              </div>
            ))}
            <div onClick={() => onAgentClick('Boris', '')} className="group cursor-pointer rounded-md p-3 transition hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-110">
                  <img src="/lovable-uploads/a3da050e-3de8-404c-8ab2-868f2e319ec8.png" alt="Boris profile image" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Boris</div>
                  <div className="text-xs text-muted-foreground">Platform</div>
                </div>
              </div>
            </div>
            <div onClick={() => onAgentClick('Levi', '')} className="group cursor-pointer rounded-md p-3 transition hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-110">
                  <img src="/lovable-uploads/levi-profile.png" alt="Levi profile image" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Levi</div>
                  <div className="text-xs text-muted-foreground">Platform</div>
                </div>
              </div>
            </div>
          </section>
        </article>

        {/* Data */}
        <article className="rounded-xl bg-muted/20 p-3">
          <header className="mb-3">
            <h2 className="text-xl font-semibold text-foreground">Data</h2>
          </header>

          {/* Team Lead */}
          <section aria-labelledby="data-lead" className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">Team Lead</div>
            <div onClick={() => onAgentClick('AI', '')} className="group cursor-pointer rounded-md p-3 transition hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground transition-transform duration-200 group-hover:scale-110">AI</div>
                <div>
                  <div className="font-medium text-foreground">Hiring</div>
                  <div className="text-xs text-muted-foreground">Data Lead</div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Members */}
          <section aria-label="Team Members" className="space-y-3">
            <div onClick={() => onAgentClick('AI', '')} className="group cursor-pointer rounded-md p-3 transition hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground transition-transform duration-200 group-hover:scale-110">AI</div>
                <div>
                  <div className="font-medium text-foreground">Data Ingestion</div>
                  <div className="text-xs text-muted-foreground">Sub Agent (Hiring)</div>
                </div>
              </div>
            </div>
            <div onClick={() => onAgentClick('AI', '')} className="group cursor-pointer rounded-md p-3 transition hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground transition-transform duration-200 group-hover:scale-110">AI</div>
                <div>
                  <div className="font-medium text-foreground">Analytics</div>
                  <div className="text-xs text-muted-foreground">Multi Agent (Hiring)</div>
                </div>
              </div>
            </div>
          </section>
        </article>
      </div>
    </section>
  );
};

export default OrgChart;
