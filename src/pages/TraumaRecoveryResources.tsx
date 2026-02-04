import React, { useEffect, useMemo, useState } from "react";
import SiteFrame from "../SiteFrame";

type CtGovStudy = {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
      officialTitle?: string;
    };
    statusModule?: {
      overallStatus?: string;
    };
    contactsLocationsModule?: {
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      }>;
    };
  };
};

function isUnitedStatesLocation(loc: { country?: string } | undefined) {
  const c = (loc?.country ?? "").trim().toLowerCase();
  return c === "united states" || c === "usa" || c === "u.s." || c === "us";
}

function buildCtGovUrl(queryTerm: string) {
  const url = new URL("https://clinicaltrials.gov/api/v2/studies");
  url.searchParams.set("format", "json");
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("query.term", queryTerm);
  url.searchParams.set(
    "fields",
    [
      "protocolSection.identificationModule.nctId",
      "protocolSection.identificationModule.briefTitle",
      "protocolSection.identificationModule.officialTitle",
      "protocolSection.statusModule.overallStatus",
      "protocolSection.contactsLocationsModule.locations",
    ].join(",")
  );
  return url.toString();
}

function getTrialTitle(t: CtGovStudy) {
  return (
    t.protocolSection?.identificationModule?.briefTitle ||
    t.protocolSection?.identificationModule?.officialTitle ||
    t.protocolSection?.identificationModule?.nctId ||
    "Untitled"
  );
}

function getTrialStatus(t: CtGovStudy) {
  return t.protocolSection?.statusModule?.overallStatus?.trim() || "Unknown";
}

function statusSortKey(status: string) {
  const s = status.toLowerCase();
  if (s === "recruiting") return 0;
  if (s === "not yet recruiting") return 1;
  if (s === "enrolling by invitation") return 2;
  if (s === "active, not recruiting") return 3;
  if (s === "completed") return 4;
  if (s === "suspended") return 5;
  if (s === "terminated") return 6;
  if (s === "withdrawn") return 7;
  if (s === "unknown") return 98;
  return 50;
}

function DropdownSection({
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <details
      className="rounded-2xl border border-zinc-800/70 bg-zinc-950/30"
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none rounded-2xl px-4 py-3 text-zinc-100 bg-zinc-800/90">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold">{title}</div>
            {subtitle ? <div className="mt-1 text-xs text-zinc-400">{subtitle}</div> : null}
          </div>
          <div className="mt-0.5 shrink-0 text-xs text-zinc-100">Toggle</div>
        </div>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

function StatusDropdown({
  status,
  count,
  defaultOpen,
  children,
}: {
  status: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <details
      className="rounded-xl border border-zinc-800/70 bg-zinc-950/30"
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none rounded-xl px-3 py-2 text-zinc-100 bg-zinc-800/90">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-sm font-semibold">{status.toUpperCase()}</div>
          <div className="text-xs text-zinc-100">{count}</div>
        </div>
      </summary>
      <div className="px-3 pb-3">{children}</div>
    </details>
  );
}

export default function TraumaRecoveryResources() {
  const queryTerm = useMemo(() => {
    const traumaTerms = "(ptsd OR trauma)";
    const substances = "(psilocybin OR mdma OR ketamine OR lsd OR dmt OR ayahuasca)";
    return `${traumaTerms} AND ${substances}`;
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trials, setTrials] = useState<CtGovStudy[]>([]);

  const trialsByStatus = useMemo(() => {
    const map = new Map<string, CtGovStudy[]>();
    for (const t of trials) {
      const status = getTrialStatus(t);
      const list = map.get(status) ?? [];
      list.push(t);
      map.set(status, list);
    }

    const entries = Array.from(map.entries()).map(([status, list]) => {
      list.sort((a, b) => getTrialTitle(a).localeCompare(getTrialTitle(b)));
      return { status, list };
    });

    entries.sort((a, b) => {
      const d = statusSortKey(a.status) - statusSortKey(b.status);
      if (d !== 0) return d;
      return a.status.localeCompare(b.status);
    });

    return entries;
  }, [trials]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const url = buildCtGovUrl(queryTerm);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`ClinicalTrials.gov request failed (${res.status})`);
        const data = (await res.json()) as { studies?: CtGovStudy[] };
        const all = Array.isArray(data?.studies) ? data.studies : [];

        const filtered = all.filter((s) => {
          const locs = s.protocolSection?.contactsLocationsModule?.locations ?? [];
          return locs.some((l) => isUnitedStatesLocation(l));
        });

        if (!cancelled) setTrials(filtered);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [queryTerm]);

  return (
    <SiteFrame>
      <h1 className="text-2xl font-semibold">Trauma Recovery Resources</h1>
      <p className="mt-3 text-zinc-300 text-sm">Add your curated resources here.</p>

      <div className="mt-6">
        <DropdownSection
          title="Psychedelic Medicine Clinical Trials (US)"
          subtitle="Trauma/PTSD + Psilocybin, MDMA, Ketamine, LSD, DMT, Ayahuasca"
          defaultOpen
        >
        {loading ? (
          <div className="mt-4 text-sm text-zinc-300">Loading…</div>
        ) : error ? (
          <div className="mt-4 text-sm text-red-300">{error}</div>
        ) : trials.length === 0 ? (
          <div className="mt-4 text-sm text-zinc-300">No trials found.</div>
        ) : (
          <div className="mt-4 grid gap-3">
            {trialsByStatus.map(({ status, list }) => (
              <StatusDropdown
                key={status}
                status={status}
                count={list.length}
                defaultOpen={status.toLowerCase() === "recruiting"}
              >
                <div className="grid gap-3">
                  {list.map((t) => {
                    const id = t.protocolSection?.identificationModule?.nctId;
                    const title = getTrialTitle(t);
                    const locs = t.protocolSection?.contactsLocationsModule?.locations ?? [];
                    const usLocs = locs.filter((l) => isUnitedStatesLocation(l));
                    const href = id ? `https://clinicaltrials.gov/study/${encodeURIComponent(id)}` : undefined;

                    return (
                      <div key={id ?? title} className="rounded-xl border border-zinc-800/70 bg-zinc-900/20 p-3">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-semibold text-zinc-100">{title}</div>
                          <div className="text-xs text-zinc-400">
                            {id ? `NCT: ${id}` : "NCT: Unknown"} • US locations: {usLocs.length}
                          </div>
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 text-xs font-medium text-zinc-200 underline underline-offset-2 hover:text-white"
                            >
                              View on ClinicalTrials.gov
                            </a>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </StatusDropdown>
            ))}
          </div>
        )}
        </DropdownSection>
      </div>
    </SiteFrame>
  );
}
