import React, { useMemo, useState } from "react";

function DropdownPanel({
  title,
  size = "base",
  defaultOpen,
  children,
}: {
  title: string;
  size?: "sm" | "base";
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);

  const buttonBg =
    size === "base"
      ? open
        ? "bg-zinc-800"
        : "bg-zinc-800/80"
      : title.startsWith("Similar") || title.startsWith("Different")
        ? open
          ? "bg-zinc-500"
          : "bg-zinc-500/80"
        : title.includes(" to ")
          ? open
            ? "bg-zinc-600"
            : "bg-zinc-600/80"
          : open
            ? "bg-zinc-700"
            : "bg-zinc-700/80";

  const wrapperTone = open ? "border-zinc-600" : "border-zinc-800/70";

  return (
    <div className={"dp w-full rounded-2xl border overflow-hidden transition-colors " + wrapperTone}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "w-full px-3 py-2 flex items-center justify-between gap-3 text-left transition-colors " + buttonBg
        }
        aria-expanded={open}
      >
        <div
          className={
            (size === "sm" ? "text-sm" : "text-base") +
            " font-medium " +
            (open ? "text-zinc-100" : "text-zinc-200")
          }
        >
          {title}
        </div>

        <div
          className={
            "shrink-0 grid h-5 w-5 place-items-center rounded-full border transition-transform duration-200 " +
            (open
              ? "border-zinc-500/60 bg-zinc-900/70 text-zinc-50 rotate-180"
              : "border-zinc-700/60 bg-zinc-950/35 text-zinc-100 rotate-0")
          }
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      <div
        className={
          "grid transition-[grid-template-rows] duration-200 ease-out " +
          (open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
        }
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-3 pb-0 [&_.dp]:-mx-3 [&_.dp]:w-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ReferenceItem({
  authors,
  year,
  title,
  meta,
}: {
  authors: string;
  year: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/30 p-3">
      <div className="text-[11px] text-zinc-400">
        {authors} ({year}).
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-zinc-200">{title}.</div>
      <div className="mt-0.5 text-xs text-zinc-300">{meta}</div>
    </div>
  );
}

type BirthSex = "F" | "M" | null;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function labelFor(value: number) {
  if (value < 40) return "Leaning Feminine";
  if (value > 60) return "Leaning Masculine";
  return "Balanced";
}

function intensityFor(value: number) {
  return Math.min(1, Math.abs(value - 50) / 50);
}

function stressRiskPercent(value: number) {
  // Higher near the midpoint (perceptual equilibrium), lower toward extremes.
  return Math.round((1 - Math.min(1, Math.abs(value - 50) / 50)) * 100);
}

function stressRiskLabel(pct: number) {
  if (pct >= 80) return "High";
  if (pct >= 60) return "Elevated";
  if (pct >= 40) return "Mild";
  return "Low";
}

function stressColorFor(value: number) {
  // Matches the stressBg overlay (symmetrical; red at center).
  // 0-15: emerald, 15-30: emerald->amber, 30-45: amber->orange, 45-50: orange->red,
  // 50-55: red->orange, 55-70: orange->amber, 70-85: amber->emerald, 85-100: emerald.
  const stops = [
    { p: 0, c: [52, 211, 153] },
    { p: 15, c: [52, 211, 153] },
    { p: 30, c: [251, 191, 36] },
    { p: 45, c: [251, 146, 60] },
    { p: 50, c: [239, 68, 68] },
    { p: 55, c: [251, 146, 60] },
    { p: 70, c: [251, 191, 36] },
    { p: 85, c: [52, 211, 153] },
    { p: 100, c: [52, 211, 153] },
  ] as const;

  const v = clamp(value, 0, 100);
  let i = 0;
  for (; i < stops.length - 1; i++) {
    if (v >= stops[i].p && v <= stops[i + 1].p) break;
  }
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const span = Math.max(1e-6, b.p - a.p);
  const t = (v - a.p) / span;
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * t);
  const r = lerp(a.c[0], b.c[0]);
  const g = lerp(a.c[1], b.c[1]);
  const bl = lerp(a.c[2], b.c[2]);
  return { rgb: `rgb(${r},${g},${bl})`, rgbaSoft: `rgba(${r},${g},${bl},0.22)` };
}

function ConnectorLine({ from, to }: { from: number; to: number }) {
  // NOTE: A perfectly vertical line (from === to) tends to *look* thicker than a diagonal
  // because the blur/shadow stacks symmetrically on both sides.
  // We nudge the x-endpoint slightly so both connectors render with the same visual weight.
  const toX = Math.abs(from - to) < 0.001 ? to + 0.2 : to;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <filter id="connShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="rgba(0,0,0,0.55)" />
        </filter>
      </defs>

      <line
        x1={from}
        y1={0}
        x2={toX}
        y2={100}
        stroke="rgba(228,228,231,0.92)"
        strokeWidth={2}
        opacity={0.95}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        filter="url(#connShadow)"
      />
    </svg>
  );
}

function ExampleSpectrumPair({
  title,
  subtitle,
  top,
  bottom,
  tightConnect,
  compact,
}: {
  title: string;
  subtitle?: string;
  top: { value: number; label: string; sublabel?: string; rowLabel?: string };
  bottom: { value: number; label: string; sublabel?: string; rowLabel?: string };
  tightConnect?: boolean;
  compact?: boolean;
}) {
  // Match the main-page track look (soft multi-stop grayscale + subtle noise)
  const smoothTrackGradient =
    "linear-gradient(90deg," +
    "#ffffff 0%," +
    "#f8f8f8 8%," +
    "#eeeeee 16%," +
    "#e2e2e2 24%," +
    "#d6d6d6 32%," +
    "#bcbcbc 42%," +
    "#9a9a9a 50%," +
    "#7a7a7a 58%," +
    "#5c5c5c 68%," +
    "#3f3f3f 78%," +
    "#232323 88%," +
    "#0f0f0f 95%," +
    "#000000 100%)";

  const noiseSvg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E";

  const Row = ({
    m,
  }: {
    m: { value: number; label: string; sublabel?: string; rowLabel?: string };
  }) => {
    return (
      <div className="mt-0">
        <div className="relative">
          <div className="mb-2 relative z-30 flex items-center justify-between text-[11px] leading-none text-zinc-400">
            <span className="text-zinc-500">{m.rowLabel || "Reference"}</span>
            <span className="text-zinc-500">{m.sublabel || ""}</span>
          </div>

          <div className="relative overflow-visible">
            {/* Track (styled like main page) */}
            <div className="relative z-0 h-8 w-full overflow-hidden rounded-xl ring-1 ring-zinc-700/60">
              <div
                className="pointer-events-none absolute inset-0 scale-[1.02]"
                style={{ backgroundImage: smoothTrackGradient, filter: "blur(0.7px)" }}
              />
              <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: smoothTrackGradient }} />
              <div
                className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.10]"
                style={{ backgroundImage: `url(${noiseSvg})`, backgroundSize: "120px 120px" }}
              />
            </div>

            {/* Center line */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-10 w-px -translate-x-1/2 -translate-y-1/2 rounded bg-zinc-200/70" />

            {/* Marker */}
            <div
              className="pointer-events-none absolute top-1/2 -translate-y-1/2"
              style={{ left: `${m.value}%` }}
            >
              {(() => {
                const personGray = Math.round(255 - (m.value / 100) * 255);
                const oppositeGray = 255 - personGray;
                const personRGB = `rgb(${personGray},${personGray},${personGray})`;
                const oppositeRGB = `rgb(${oppositeGray},${oppositeGray},${oppositeGray})`;

                return (
                  <div className="-translate-x-1/2">
                    <div className="h-12 w-12 rounded-full ring-1 ring-black/30" style={{ backgroundColor: personRGB }}>
                      <div className="grid h-full w-full place-items-center">
                        <div
                          className="grid h-10 w-10 place-items-center rounded-full"
                          style={{ backgroundColor: oppositeRGB, border: `2px solid ${personRGB}` }}
                        >
                          <span
                                className="text-base sm:text-lg font-extrabold leading-none" style={{ color: personRGB }}>
                            {m.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="mt-3 rounded-2xl border border-zinc-800/70 bg-zinc-950/30 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-zinc-200">{title}</div>
          {subtitle ? <div className="mt-0.5 text-[11px] text-zinc-400">{subtitle}</div> : null}
        </div>
        <div className="text-[11px] text-zinc-500">Example</div>
      </div>

      <div className={compact ? "mt-1" : "mt-2"}>
        <Row m={top} />

        {/* Connector: floats BETWEEN the two spectrums */}
        <div
          className={
            "relative h-6 z-10 rounded-md bg-zinc-950/10 " +
            (tightConnect ? "mt-2 mb-0" : compact ? "mt-2 mb-0" : "mt-2 mb-2")
          }
        >
          <ConnectorLine from={top.value} to={bottom.value} />
        </div>

        <div className={tightConnect ? "-mt-1 pt-0" : "mt-0"}>
          <Row m={bottom} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
        <span>Feminine</span>
        <span className="text-zinc-500">Neutral</span>
        <span>Masculine</span>
      </div>
    </div>
  );
}

function KeyItem({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="shrink-0 flex items-center gap-1 rounded-md border border-zinc-800/60 bg-zinc-900/20 px-1.5 py-1">
      <span className={"h-3 w-3 rounded-sm ring-1 ring-black/30 " + colorClass} aria-hidden="true" />
      <span className="text-xs leading-none text-zinc-200 whitespace-nowrap">{label}</span>
    </div>
  );
}



function IconEye({ className = "h-4 w-4" }: { className?: string }) {
  // Eye icon adapted from provided SVG, simplified to currentColor
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M14 2.75c1.907 0 3.262.002 4.289.14 1.006.135 1.586.389 2.009.812.487.487.699.865.816 1.538.133.759.136 1.841.136 3.76a.75.75 0 0 0 1.5 0v-.096c0-1.8 0-3.018-.158-3.922-.175-1.005-.549-1.656-1.233-2.34-.748-.748-1.697-1.08-2.869-1.238C17.35 1.25 15.894 1.25 14.056 1.25H14a.75.75 0 0 0 0 1.5Z" />
      <path d="M2 14.25a.75.75 0 0 1 .75.75c0 1.919.003 3.001.135 3.76.117.673.329 1.051.816 1.538.423.423 1.003.676 2.009.812 1.027.138 2.382.14 4.289.14a.75.75 0 0 1 0 1.5H9.944c-1.838 0-3.294 0-4.433-.153-1.173-.157-2.121-.49-2.87-1.238-.684-.684-1.058-1.335-1.233-2.34-.158-.904-.158-2.122-.158-3.922V15a.75.75 0 0 1 .75-.75Z" />
      <path d="M22 14.25a.75.75 0 0 1 .75.75v.096c0 1.8 0 3.018-.158 3.922-.175 1.005-.549 1.656-1.233 2.34-.748.748-1.697 1.08-2.869 1.238-1.139.153-2.595.153-4.433.153H14a.75.75 0 0 1 0-1.5c1.907 0 3.262-.002 4.289-.14 1.006-.136 1.586-.389 2.009-.812.487-.487.699-.865.816-1.538.133-.759.136-1.841.136-3.76a.75.75 0 0 1 .75-.75Z" />
      <path d="M9.944 1.25H10a.75.75 0 0 1 0 1.5c-1.907 0-3.262.002-4.289.14-1.006.136-1.586.389-2.009.812-.487.487-.699.865-.816 1.538-.133.759-.136 1.841-.136 3.76a.75.75 0 0 1-1.5 0v-.096c0-1.8 0-3.018.158-3.922.175-1.005.549-1.656 1.233-2.34.748-.748 1.697-1.08 2.869-1.238C6.65 1.25 8.106 1.25 9.944 1.25Z" />
      <path d="M12 10.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />
      <path fillRule="evenodd" d="M5.892 14.06C5.297 13.37 5 13.025 5 12c0-1.025.297-1.37.892-2.06C7.08 8.562 9.073 7 12 7s4.92 1.562 6.108 2.94C18.703 10.63 19 10.975 19 12c0 1.025-.297 1.37-.892 2.06C16.92 15.438 14.927 17 12 17s-4.92-1.562-6.108-2.94ZM9.25 12a2.75 2.75 0 1 1 5.5 0 2.75 2.75 0 0 1-5.5 0Z" clipRule="evenodd" />
    </svg>
  );
}


function IconKey({ className = "h-3 w-3" }: { className?: string }) {
  // Key icon adapted from provided SVG, normalized to currentColor
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M16 5.5C16 8.53757 13.5376 11 10.5 11H7V13H5V15L4 16H0V12L5.16351 6.83649C5.0567 6.40863 5 5.96094 5 5.5C5 2.46243 7.46243 0 10.5 0C13.5376 0 16 2.46243 16 5.5ZM13 4C13 4.55228 12.5523 5 12 5C11.4477 5 11 4.55228 11 4C11 3.44772 11.4477 3 12 3C12.5523 3 13 3.44772 13 4Z" />
    </svg>
  );
}

function IconIdentityInfo({ className = "h-4 w-4" }: { className?: string }) {
  // Full Illustrator export, normalized for React/Tailwind.
  // Key fix: use evenodd fill rules so interior cutouts ("text"/counters) render correctly.
  return (
    <svg
      viewBox="0 0 800 800"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      shapeRendering="geometricPrecision"
    >
      {/* Removed: XML header + enable-background + off-canvas rect (x=849). */}
      <g fillRule="evenodd" clipRule="evenodd">
        <polygon points="317.6,210 317.3,210 313.3,252.5 322.2,252.4" />
        <g>
          <path d="M388.3,354.7c-1.3-1.4-3.2-2.1-5.7-2.2c-2.6-0.1-4.6,0.6-6,1.9c-1.4,1.3-2.5,3.2-3.2,5.5c-0.7,2.3-1.1,5-1.3,7.9c-0.1,2.9-0.2,5.9-0.3,9l-1.6,75.1c-0.1,3.1-0.1,6.1-0.1,9.1c0,3,0.3,5.6,0.9,7.9c0.6,2.3,1.6,4.2,2.9,5.7c1.3,1.5,3.3,2.3,5.9,2.3c2.4,0.1,4.3-0.6,5.8-2.1c1.4-1.4,2.5-3.3,3.2-5.5c0.7-2.3,1.1-4.9,1.3-7.9c0.1-3,0.3-6,0.3-9.1l1.6-75.1c0.1-3.1,0.1-6.1,0.1-9c0-2.9-0.3-5.6-0.9-7.9C390.6,358,389.6,356.2,388.3,354.7z" />
          <path d="M505.2,357.2c-1.3-1.4-3.2-2.1-5.7-2.2c-2.6-0.1-4.6,0.6-6,1.9c-1.4,1.3-2.5,3.2-3.2,5.5c-0.7,2.3-1.1,5-1.3,7.9c-0.1,2.9-0.2,5.9-0.3,9l-1.6,75.1c-0.1,3.1-0.1,6.1-0.1,9.1c0,3,0.3,5.6,0.9,7.9c0.6,2.3,1.6,4.2,2.9,5.7c1.3,1.5,3.3,2.3,5.9,2.3c2.4,0.1,4.3-0.6,5.8-2.1c1.4-1.4,2.5-3.3,3.2-5.5c0.7,2.3,1.1-4.9,1.3-7.9c0.1-3,0.3-6,0.3-9.1l1.6-75.1c0.1-3.1,0.1-6.1,0.1-9c0-2.9-0.3-5.6-0.9-7.9C507.5,360.5,506.5,358.6,505.2,357.2z" />
          <path d="M621.6,190.2v442.4H213.2c-18.8-1.1-33.2-17.2-32.1-36c1-17.3,14.8-31.1,32.1-32.1h374.3V122.2H213.2c-37.6,0-68,30.4-68.1,68v408.3c0,37.6,30.5,68.1,68.1,68.1h442.3V190.2H621.6z M292.8,505.5l-38.9-0.8l2.9-138.2c-5.7,2.1-10.9,3.5-15.4,3.9c-4.5,0.5-8.4,0.7-11.7,0.6l0.6-28.9c7.3-2.6,14.3-5.8,21-9.6c6.6-3.8,12.2-8,16.7-12.6l28.7,0.6L292.8,505.5z M547.8,380.6l-1.6,75.1c-0.2,9.4-1.1,17.7-2.6,24.9c-1.5,7.2-4.1,13.2-7.8,17.9c-3.7,4.8-8.7,8.3-15.2,10.6c-6.5,2.3-14.6,3.3-24.5,3.1c-10-0.2-18.2-1.6-24.5-4.3c-6.3-2.6-11.2-6.4-14.7-11.4c-3.5-4.9-5.9-11-7.1-18.1c-1.2-7.2-1.7-15.4-1.5-24.8l1.6-75.1c0.2-9.2,1.1-17.4,2.6-24.5c1.5-7.1,4.2-13,7.9-17.8c3.7-4.8,8.8-8.4,15.2-10.7c6.4-2.4,14.6-3.5,24.6-3.2c9.9,0.2,18,1.6,24.3,4.3c6.3,2.6,11.2,6.4,14.7,11.4c3.5,4.9,5.8,11,7,18.1C547.5,363.2,548,371.4,547.8,380.6z M520.3,253.6c-0.4-2.1-1.3-4-2.5-5.6c-1.2-1.6-3-3.3-5.4-5.2c-2.4-1.9-5.4-4.5-9.2-8c-2.5-2.2-4.8-4.4-6.9-6.6c-2.2-2.1-4.1-4.4-5.8-6.9c-1.7-2.4-3-5.2-3.9-8.2c-1-3-1.4-6.6-1.5-10.6c0-8.1,2.5-14.5,7.7-19.2c5.2-4.7,12.2-7.1,21.2-7.1c5.9,0,10.8,0.6,14.7,2c3.9,1.4,6.9,3.4,9.1,6.1c2.2,2.7,3.7,5.9,4.6,9.6c0.9,3.8,1.3,8,1.3,12.8l0,6.3l-23.7,0.1l0-6.3c0-2.7-0.4-5-1.2-6.8c-0.8-1.8-2.3-2.7-4.6-2.7c-1.3,0-2.5,0.5-3.7,1.4c-1.1,0.9-1.7,2.1-1.7,3.6c0,2.8,0.9,5.4,2.7,7.7c1.8,2.3,4,4.7,6.6,6.9c2.6,2.3,5.5,4.6,8.6,6.9c3.1,2.3,6,4.9,8.6,7.7c2.6,2.8,4.9,6,6.6,9.5c1.8,3.5,2.7,7.5,2.7,12c0,2.6,0,5.4-0.1,8.2c-0.1,2.8-0.4,5.6-1,8.3c-0.6,2.7-1.5,5.2-2.7,7.6c-1.2,2.4-2.9,4.5-5,6.4c-2.2,1.8-4.9,3.3-8.2,4.3c-3.3,1.1-7.4,1.6-12.3,1.6c-4.9,0-9-0.4-12.3-1.3c-3.3-0.9-6.1-2.2-8.4-3.8c-2.3-1.6-4-3.5-5.3-5.8c-1.3-2.2-2.2-4.5-2.9-7c-0.6-2.5-1-5.1-1.2-7.8c-0.2-2.7-0.2-5.4-0.3-8l-0.1-11l23.7-0.1l0.1,11c0,1.7,0.1,3.3,0.2,4.9c0.1,1.5,0.4,2.9,0.8,4.1c0.4,1.2,1.1,2.1,1.9,2.8c0.9,0.7,2.1,1,3.7,1c1.6,0,3-0.6,4.1-1.8c1.2-1.2,1.7-2.6,1.7-4.2C520.9,258.7,520.7,255.7,520.3,253.6z M477.2,177.9l0.1,21.1l-13.7,0.1l0.5,89.4l-23.7,0.1l-0.5-89.4l-13.7,0.1l-0.1-21.1L477.2,177.9z M422.4,335.4c3.5,4.9,5.8,11,7,18.1c1.2,7.2,1.7,15.3,1.5,24.6l-1.6,75.1c-0.2,9.4-1.1,17.7-2.6,24.9c-1.5,7.2-4.1,13.2-7.8,17.9c-3.7,4.8-8.7,8.3-15.2,10.6c-6.5,2.3-14.6,3.3-24.5,3.1c-10-0.2-18.2-1.6-24.5-4.3s-11.2-6.4-14.7-11.4c-3.5-4.9-5.9-11-7.1-18.1c-1.2-7.2-1.7-15.4-1.5-24.8l1.6-75.1c0.2-9.2,1.1-17.4,2.6-24.5c1.5-7.1,4.2-13,7.9-17.8c3.7-4.8,8.8-8.4,15.2-10.7c6.4-2.4,14.6-3.5,24.6-3.2c9.9,0.2,18,1.6,24.3,4.3C414,326.7,418.9,330.5,422.4,335.4z M359.1,199.8c0.8-4.7,2.3-8.7,4.5-12.1c2.2-3.3,5.2-6,9.1-7.8c3.9-1.9,8.9-2.8,15-2.8c5.9,0,10.8,0.9,14.8,2.7c3.9,1.8,7,4.4,9.3,7.6c2.3,3.3,3.9,7.3,4.8,12c0.9,4.7,1.4,10,1.4,15.7l0,5.5l-23.7,0.1l0-5.5c0-2.4-0.1-4.7-0.2-6.8c-0.1-2.1-0.4-3.9-0.8-5.4c-0.4-1.5-1.1-2.7-1.9-3.5c-0.9-0.8-2-1.3-3.5-1.2c-1.6,0-2.8,0.4-3.7,1.3s-1.5,2-1.9,3.5c-0.4,1.5-0.6,3.3-0.7,5.4c0,2.1,0,4.4,0,6.8l0.2,36.9c0,2.4,0,4.7,0.1,6.8c0.1,2.1,0.3,3.9,0.7,5.4c0.4,1.5,1.1,2.7,1.9,3.5c0.9,0.8,2.1,1.3,3.7,1.2c1.6,0,2.8-0.4,3.7-1.3c0.8-0.9,1.5-2,1.9-3.5c0.4-1.5,0.6-3.3,0.7-5.4c0-2.1,0-4.4,0-6.8l0-5.5l23.7-0.1l0,5.5c0,5.7-0.4,11-1.2,15.7c-0.8,4.7-2.3,8.7-4.5,12.1c-2.2,3.4-5.2,6-9.1,7.8c-3.9,1.9-8.9,2.8-15,2.8c-6.1,0-11.1-0.9-15-2.7c-3.9-1.8-7-4.4-9.2-7.7c-2.2-3.3-3.8-7.3-4.7-12c-0.9-4.7-1.3-9.9-1.4-15.6l-0.2-36.9C357.9,209.7,358.3,204.5,359.1,199.8z M299.8,179l35-0.2l14.6,110.5l-23.3,0.1l-1.6-15.8l-13.3,0.1l-1.5,15.8l-23.3,0.1L299.8,179z M277.1,179.1l0.1,21.1l-23.8,0.1l0.1,17.8l23.8-0.1l0.1,21.2l-23.8,0.1l0.3,50.5l-23.7,0.1l-0.7-110.5L277.1,179.1z" />
        </g>
      </g>
    </svg>
  );
}

function IconQuestionMark({ className = "h-5 w-5" }: { className?: string }) {
  // Adapted from your question-mark SVG. Normalized to currentColor and React-friendly attributes.
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <g fillRule="evenodd">
        <path d="M30.249 2.065C18.612 2.789 12.531 9.379 12 21.296h11.739c.147-4.128 2.451-7.214 6.741-7.669c4.211-.447 8.206.556 9.416 3.435c1.307 3.11-1.627 6.724-3.022 8.241c-2.582 2.813-6.776 4.865-8.95 7.9c-2.131 2.974-2.51 6.887-2.674 11.676h10.346c.145-3.062.349-5.995 1.742-7.898c2.266-3.092 5.65-4.541 8.486-6.983c2.709-2.334 5.559-5.147 6.043-9.501C53.32 7.466 42.683 1.289 30.249 2.065" />
        <ellipse cx="30.515" cy="55.567" rx="6.532" ry="6.433" />
      </g>
    </svg>
  );
}

function DynamicYinYang({ value, birthSex }: { value: number; birthSex: BirthSex }) {
  // value: 0 = feminine (white), 100 = masculine (black)
  const baseGirlGray = Math.round(255 - (value / 100) * 255);
  const baseGuyGray = 255 - baseGirlGray;

  // Invert mapping when Assigned Female at Birth is selected so visual orientation stays stable
  const girlGray = birthSex === "F" ? baseGuyGray : baseGirlGray;
  const guyGray = birthSex === "F" ? baseGirlGray : baseGuyGray;

  const girl = `rgb(${girlGray},${girlGray},${girlGray})`;
  const guy = `rgb(${guyGray},${guyGray},${guyGray})`;

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-28 w-28 min-[380px]:h-32 min-[380px]:w-32 sm:h-56 sm:w-56"
      aria-label="Dynamic yin yang"
    >
      <defs>
        <clipPath id="yyClip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>

      <g clipPath="url(#yyClip)" transform="translate(100 0) scale(-1 1)">
        {/* White / feminine half */}
        <path d="M50 2a48 48 0 0 0 0 96V2z" fill={girl} />

        {/* Black / masculine half */}
        <path d="M50 2a48 48 0 1 1 0 96V2z" fill={guy} />

        {/* Upper lobe */}
        <circle cx="50" cy="26" r="24" fill={girl} />
        {/* Lower lobe */}
        <circle cx="50" cy="74" r="24" fill={guy} />

        {/* Dots */}
        <circle cx="50" cy="26" r="5" fill={guy} />
        <circle cx="50" cy="74" r="5" fill={girl} />
      </g>

      {/* Outer ring */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

      {/* Male-selected highlight: right-half ring */}
      {birthSex === "M" && (
        <path
          d="M50 2 A48 48 0 0 1 50 98"
          fill="none"
          stroke="rgba(52,211,153,0.9)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}

      {/* Female-selected highlight: left-half ring */}
      {birthSex === "F" && (
        <path
          d="M50 98 A48 48 0 0 1 50 2"
          fill="none"
          stroke="rgba(52,211,153,0.9)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function PixelClusterCircle(props: { value: number; birthSex: BirthSex }) {
  const { value } = props;
  // "Close-up pixel structure" of a gray tone using ONLY black/white squares.
  // Ordered dithering keeps the pattern stable while density shifts with value.
  const grid = 20;
  const cell = 100 / grid;

  // Target perceived gray for the current slider value (0=white, 100=black)
  // Note: birthSex is intentionally NOT used here (you requested the structure stays the same across genders).
  const g = Math.round(255 - (clamp(value, 0, 100) / 100) * 255);
  const personGray = `rgb(${g},${g},${g})`;
  const blackCoverage = (255 - g) / 255; // 0..1

  // 8x8 Bayer matrix (0..63). Tiled across 20x20.
  const bayer8 = useMemo(
    () => [
      [0, 48, 12, 60, 3, 51, 15, 63],
      [32, 16, 44, 28, 35, 19, 47, 31],
      [8, 56, 4, 52, 11, 59, 7, 55],
      [40, 24, 36, 20, 43, 27, 39, 23],
      [2, 50, 14, 62, 1, 49, 13, 61],
      [34, 18, 46, 30, 33, 17, 45, 29],
      [10, 58, 6, 54, 9, 57, 5, 53],
      [42, 26, 38, 22, 41, 25, 37, 21],
    ],
    []
  );

  const cells = useMemo(() => {
    const out: Array<{ x: number; y: number; isBlack: boolean }> = [];
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const t = (bayer8[y % 8][x % 8] + 0.5) / 64; // 0..1
        out.push({ x, y, isBlack: t < blackCoverage });
      }
    }
    return out;
  }, [blackCoverage, bayer8]);

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-28 w-28 min-[380px]:h-32 min-[380px]:w-32 sm:h-56 sm:w-56"
      aria-label="Dithered gray pixel structure"
    >
      <defs>
        <clipPath id="pcClip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>

      <g clipPath="url(#pcClip)">
        {/* White base */}
        <rect x="0" y="0" width="100" height="100" fill="#ffffff" />

        {/* 20x20 ordered-dither pixels (black/white only) */}
        {cells.map((c, i) => (
          <rect
            key={i}
            x={c.x * cell}
            y={c.y * cell}
            width={cell}
            height={cell}
            fill={c.isBlack ? "#000000" : "#ffffff"}
          />
        ))}

        {/* Subtle grid lines to emphasize "pixel blocks" */}
        <g opacity={0.14}>
          {Array.from({ length: grid - 1 }).map((_, i) => (
            <React.Fragment key={i}>
              <line
                x1={(i + 1) * cell}
                y1={0}
                x2={(i + 1) * cell}
                y2={100}
                stroke="rgba(0,0,0,0.35)"
                strokeWidth={0.6}
              />
              <line
                x1={0}
                y1={(i + 1) * cell}
                x2={100}
                y2={(i + 1) * cell}
                stroke="rgba(0,0,0,0.35)"
                strokeWidth={0.6}
              />
            </React.Fragment>
          ))}
        </g>
      </g>

      {/* Outer ring shows the perceived gray tone */}
      <circle cx="50" cy="50" r="48" fill="none" stroke={personGray} strokeWidth="3" />
    </svg>
  );
}


function HeaderLogo() {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const src = stage === 0 ? "/favicon.svg" : stage === 1 ? "/favicon.ico" : null;

  if (!src) {
    // Minimal inline yin-yang fallback (always renders)
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-label="Yin yang" role="img">
        <defs>
          <clipPath id="yyCircle">
            <circle cx="32" cy="32" r="30" />
          </clipPath>
        </defs>
        <g clipPath="url(#yyCircle)">
          <rect x="2" y="2" width="60" height="60" fill="#fff" />
          <path d="M32 2a30 30 0 1 0 0 60V2z" fill="#000" />
          <path
            d="M32 2c8.3 0 15 6.7 15 15S40.3 32 32 32 17 25.3 17 17 23.7 2 32 2z"
            fill="#fff"
          />
          <path
            d="M32 32c8.3 0 15 6.7 15 15S40.3 62 32 62 17 55.3 17 47s6.7-15 15-15z"
            fill="#000"
          />
          <circle cx="32" cy="17" r="4" fill="#000" />
          <circle cx="32" cy="47" r="4" fill="#fff" />
        </g>
        <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <img
      src={src}
      alt="GrayVisions.com"
      className="h-full w-full"
      onError={() => setStage((s) => (s === 0 ? 1 : 2))}
    />
  );
}

export default function App() {
  React.useEffect(() => {
    document.title = "GrayVisions.com";
  }, []);

  // --- Support links (replace with your handles)
  // Cash App: https://cash.app/$YourCashtag  (often opens the app if installed)
  // Venmo:    https://venmo.com/u/YourHandle (often opens the app if installed)
  const CASHAPP_URL = "https://cash.app/$lucasloncar";
  const VENMO_URL = "https://venmo.com/u/lucasloncar1992";

  const [value, setValue] = useState(50);
  const [advanced, setAdvanced] = useState(false);
  const [stressRisk, setStressRisk] = useState(false);
  const [birthSex, setBirthSex] = useState<BirthSex>(null);

  const label = useMemo(() => labelFor(value), [value]);
  const intensity = useMemo(() => intensityFor(value), [value]);
  const riskPct = useMemo(() => stressRiskPercent(value), [value]);
  const riskLabel = useMemo(() => stressRiskLabel(riskPct), [riskPct]);
  const riskColor = useMemo(() => stressColorFor(value), [value]);

  // Center proximity for subtle glow
  const centerProximity = 1 - Math.min(1, Math.abs(value - 50) / 15);

  const internalCopy = useMemo(() => {
    if (label === "Balanced") return "You experience yourself near perceptual balance.";
    if (label === "Leaning Feminine") return "You experience yourself as more feminine.";
    return "You experience yourself as more masculine.";
  }, [label]);

  const externalCopy = useMemo(() => {
    if (label === "Balanced") return "Others may interpret you variably depending on context and contrast.";
    if (label === "Leaning Feminine") return "In social contrast, others may perceive increased masculinity in those around you.";
    return "In social contrast, others may perceive increased femininity in those around you.";
  }, [label]);

  function toggleBirthSex(next: Exclude<BirthSex, null>) {
    setBirthSex((prev) => {
      // If you click the same option again, we treat it as "unset" and keep the current slider value.
      if (prev === next) return null;

      // If you're switching/setting birth sex, snap the slider spawn point to a sensible default.
      // M → 75% masculine (value=75), F → 75% feminine (value=25)
      setValue(next === "M" ? 75 : 25);
      return next;
    });
  }

  // --- Dual‑tone marker badge (reversed axis: 0=white, 100=black)
  const personGray = Math.round(255 - (value / 100) * 255);
  const oppositeGray = 255 - personGray;
  const personRGB = `rgb(${personGray},${personGray},${personGray})`;
  const oppositeRGB = `rgb(${oppositeGray},${oppositeGray},${oppositeGray})`;

  const smoothTrackGradient =
    "linear-gradient(90deg," +
    "#ffffff 0%," +
    "#f8f8f8 8%," +
    "#eeeeee 16%," +
    "#e2e2e2 24%," +
    "#d6d6d6 32%," +
    "#bcbcbc 42%," +
    "#9a9a9a 50%," +
    "#7a7a7a 58%," +
    "#5c5c5c 68%," +
    "#3f3f3f 78%," +
    "#232323 88%," +
    "#0f0f0f 95%," +
    "#000000 100%)";

  const noiseSvg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E";

  const stressBg =
    "linear-gradient(90deg, " +
    "rgb(52,211,153) 0%, " +        // emerald-400 (Low)
    "rgb(52,211,153) 15%, " +
    "rgb(251,191,36) 30%, " +       // amber-400 (Mild)
    "rgb(251,146,60) 45%, " +        // orange-400 (Elevated)
    "rgb(239,68,68) 50%, " +         // red-500 (High)
    "rgb(251,146,60) 55%, " +        // orange-400
    "rgb(251,191,36) 70%, " +        // amber-400
    "rgb(52,211,153) 85%, " +        // emerald-400
    "rgb(52,211,153) 100%)";

  return (
    <div
      className="min-h-screen text-zinc-100"
      style={{
        backgroundImage: `radial-gradient(rgba(255,255,255,0.08) 1px, transparent 0), radial-gradient(rgba(0,0,0,0.08) 1px, transparent 0)` ,
        backgroundSize: "3px 3px",
        backgroundColor: "#18181b",
      }}
    >
      <header className="border-b border-zinc-800/70 bg-zinc-800/90">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 sm:h-16 sm:w-16 place-items-center rounded-full bg-zinc-700 ring-2 ring-zinc-700">
              <div className="grid h-10 w-10 sm:h-14 sm:w-14 place-items-center rounded-full bg-zinc-900/40 ring-1 ring-zinc-800/70">
                <HeaderLogo />
              </div>
            </div>
            <div className="leading-[1.1]">
              <div className="text-lg sm:text-3xl font-bold tracking-wide leading-none">GrayVisions.com</div>
              <div className="-mt-0.7 text-sm sm:text-base text-zinc-400 leading-tight">
                Interactive Femininity / Masculinity Spectrum
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Support links centered below header */}
      <div className="mx-auto max-w-5xl px-4 mt-2">
        <div className="flex flex-col items-center py-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Support the creator:</span>
            <a
              href={CASHAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-emerald-600/60 bg-green-500 px-2 py-0.5 text-xs font-semibold text-zinc-900 hover:bg-green-600"
              aria-label="Support via Cash App"
            >
              Cash App
            </a>
            <a
              href={VENMO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-sky-600/60 bg-cyan-800 px-2 py-0.5 text-xs font-semibold text-zinc-100 hover:bg-cyan-900"
              aria-label="Support via Venmo"
            >
              Venmo
            </a>
          </div>
          
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10 py-3">
        <div className="grid gap-4 grid-cols-1">
          {/* Intro / What is identity (full-width) */}
          <div className="w-full">
            <div className="flex w-full items-center gap-3 text-base sm:text-lg font-semibold text-white bg-zinc-500 rounded-xl px-4 py-2">
              <span className="grid h-6 w-6 place-items-center rounded-full text-white">
                <IconQuestionMark className="h-4.5 w-4.5" />
              </span>
              <h3 className="leading-none">What is our mission?</h3>
            </div>

            <div className="mt-4 w-full text-sm leading-relaxed text-zinc-300 px-4 md:px-0">
  Our mission is to offer a neutral, visual framework for understanding how femininity and masculinity function as <span className="text-zinc-200">relational, codependent variables</span> rather than fixed or opposing traits. Instead of treating identity as static or categorical, this tool models it as a dynamic perceptual spectrum.
</div>

            <div className="mt-2 w-full rounded-2xl bg-transparent px-4 md:px-0 py-4">
              <h2 className="text-sm font-medium text-zinc-200">Perception shapes experience and interpretation.</h2>

              <p className="mt-3 w-full text-sm text-zinc-300 leading-relaxed">
  <span className="text-zinc-100">GrayVisions.com</span> exists to make visible something that is usually experienced intuitively but rarely articulated: identity is shaped through perception, contrast, and context. By representing <span className="text-zinc-100">femininity</span> and <span className="text-zinc-100">masculinity</span> along a shared continuum, the model highlights how changes in one are always understood relative to the other.
</p>

<p className="mt-2 w-full text-sm text-zinc-300 leading-relaxed">
  When these variables are understood as <span className="text-zinc-100">interdependent</span>, identity can be explored without moral judgment, diagnosis, or prescription. The goal is not to define who someone is, but to provide a shared visual language for examining how self‑concept shifts under social, relational, and environmental pressures.
</p>

              <div className="mt-4 w-full text-[11px] leading-relaxed text-zinc-300">
                <span className="font-medium text-zinc-200">Medical & professional disclaimer:</span> Nothing on this page or
                anywhere on this website constitutes medical, psychological, or therapeutic advice. The content and tools
                provided here are for <span className="text-zinc-200">educational and exploratory purposes only</span>.
                <br />
                <span className="text-zinc-400">
                  Any decisions involving medical treatment, mental health care, or significant life changes should always
                  be discussed with a qualified physician or licensed healthcare professional prior to making changes.
                </span>
              </div>
            </div>
          </div>

          <div className="w-full">

            
              <div className="mt-1 px-0 py-2 mb-1">
                <div className="flex w-full items-center gap-3 text-base sm:text-lg font-semibold text-white bg-zinc-500 rounded-xl px-4 py-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-white">
                    <img
                      src="/YIN%20YANG%20FLASK.svg"
                      alt="Yin-yang flask"
                      className="h-9 w-9 object-contain"
                    />
                  </span>
                  <span>Set your position</span>
                </div>
                <div className="mt-3 text-xs text-zinc-300">Drag the marker. Center represents perceptual equilibrium.</div>

              {/* Dynamic yin-yang visualization */}
              
              </div>

              <div className="px-0 py-2">
                
                  <div className="text-[11px] leading-relaxed text-zinc-200/90">
                    <span className="font-medium text-zinc-100">Important:</span> 100% masculine and 100% feminine are theoretical
                    extremes and are not realistically achievable. The continual <span className="text-zinc-100">perfecting</span>
                    of either pole is nearly impossible in lived human experience.
                    <br />
                    <span className="text-zinc-300">
                      Every position on this spectrum is <span className="text-zinc-100">normal</span>, possible, and human. This
                      tool does not define your worth, value, morality, or potential — it simply visualizes perception.
                    </span>
                  </div>
                

              

                  

                  {/* Descartes Spiritual Eye (static SVG from /public) */}
                  

                  {/* Femininity / Masculinity Spectrum Key */}
                  <div className="mt-3 mb-3 flex items-center gap-3 text-sm font-semibold text-white bg-zinc-500 rounded-xl px-3 py-1">
                    <span className="grid h-6 w-6 place-items-center rounded-full text-white">
                      <IconKey className="h-4.5 w-4.5" />
                    </span>
                    <span>Femininity / Masculinity Spectrum Key</span>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {/* F */}
                    <div className="flex items-start gap-3">
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-zinc-100 ring-1 ring-black/20">
                        <div className="grid h-4 w-4 place-items-center rounded-full bg-zinc-900 ring-2 ring-zinc-100">
                          <span className="text-xs font-extrabold leading-none text-zinc-100">F</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-200">F = Assigned Female at Birth</div>
                        <div className="mt-0.5 text-[10px] leading-relaxed text-zinc-400">Optional marker label.</div>
                      </div>
                    </div>

                    {/* M */}
                    <div className="flex items-start gap-3">
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-zinc-900 ring-1 ring-black/20">
                        <div className="grid h-4 w-4 place-items-center rounded-full bg-zinc-100 ring-2 ring-zinc-900">
                          <span className="text-xs font-extrabold leading-none text-zinc-900">M</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-200">M = Assigned Male at Birth</div>
                        <div className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">Optional marker label.</div>
                      </div>
                    </div>

                    {/* Dual-tone badge */}
                    <div className="flex items-start gap-3">
                      <div className="relative h-6 w-6 shrink-0">
                        {/* Dual-tone badge: outer/inner sizes match F icon */}
                        <div className="grid h-5 w-5 place-items-center rounded-full bg-zinc-100 ring-1 ring-black/20">
                          <div className="grid h-4 w-4 place-items-center rounded-full bg-zinc-900 ring-2 ring-zinc-100">
                            <div className="h-1.5 w-1.5 rounded-full bg-zinc-100" />
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-200">Dual-Tone Badge</div>
                        <div className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
                          The <span className="text-zinc-200">ring</span> and <span className="text-zinc-200">inner circle</span> show the person’s degree on the grayscale.
                          The <span className="text-zinc-200">fill between</span> them shows the equal value on the opposite gender’s grayscale.
                        </div>
                      </div>
                    </div>

                    {/* Track (placed below M, to the right of dual-tone) */}
                    <div className="flex items-start gap-3 sm:col-start-2">
                      <div
                        className="mt-1 h-3 w-28 overflow-hidden rounded-full ring-1 ring-zinc-700/60"
                        style={{ backgroundImage: smoothTrackGradient }}
                      />
                      <div className="ml-2 text-[11px] text-zinc-400 leading-tight">
                        <span className="font-medium text-zinc-200">One Codependent Continuum</span>
                        <div className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                          This visual gradient can be used to demonstrate how <span className="text-zinc-200">femininity</span> and
                          <span className="text-zinc-200"> masculinity</span> are perceived across a single continuum — and how these
                          <span className="text-zinc-200"> codependent variables</span> function together rather than as independent traits.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                    <span>
                      <span className="font-medium text-zinc-200">Center Line</span>: perceptual equilibrium (highest contextual sensitivity)
                    </span>
                    <span>
                      <span className="font-medium text-zinc-200">Position</span>: a perception‑based slider, not a value judgment
                    </span>
                  </div>
                

                {/* Assigned birth sex */}
              <div className="mt-1 rounded-2xl bg-transparent px-4 py-3">
                <div className="inline-block rounded-md bg-zinc-500 px-2 py-0.5 text-xs font-medium text-white">Assigned Birth Sex:</div>
                <div className="mt-1 text-xs text-zinc-400">Optional — used only for display in the marker.</div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <label className="flex cursor-pointer items-center gap-2 text-zinc-200">
                    <input
                      type="checkbox"
                      checked={birthSex === "F"}
                      onChange={() => toggleBirthSex("F")}
                      className="h-4 w-4 appearance-none rounded border border-zinc-600 bg-zinc-300 shadow-inner checked:bg-emerald-500 checked:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />
                    Female
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-zinc-200">
                    <input
                      type="checkbox"
                      checked={birthSex === "M"}
                      onChange={() => toggleBirthSex("M")}
                      className="h-4 w-4 appearance-none rounded border border-zinc-600 bg-zinc-300 shadow-inner checked:bg-emerald-500 checked:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />
                    Male
                  </label>
                  
                </div>
              </div>

              

              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                
                </div>

                

                <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                </div>

                
                <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-zinc-100 ring-1 ring-zinc-600" />
                  Feminine
                </span>
                <span className="text-zinc-500">Neutral Zone</span>
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-zinc-900 ring-1 ring-zinc-600" />
                  Masculine
                </span>
              </div>

              {/* Slider + optional stress overlay */}
              <div
                className={
                  "mt-3 mb-10 rounded-2xl p-3 transition-[opacity,filter] " +
                  (stressRisk
                    ? "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.10),transparent_55%)]"
                    : "bg-transparent")
                }
                style={stressRisk ? { backgroundImage: stressBg } : undefined}
              >
                <div className="relative">
                  <div
                    className={
                      "pointer-events-none absolute left-1/2 -top-2 h-2 w-px -translate-x-1/2 rounded " +
                      (stressRisk ? "bg-black" : "bg-zinc-200/70")
                    }
                  />
                  <div
                    className={
                      "pointer-events-none absolute left-1/2 -bottom-2 h-2 w-px -translate-x-1/2 rounded " +
                      (stressRisk ? "bg-black" : "bg-zinc-200/70")
                    }
                  />

                  <div className="relative h-16 w-full overflow-visible pb-12">
                    {/* Bottom labels */}
                    <div
                      className="pointer-events-none absolute -bottom-10 left-1/2 z-20 -translate-x-1/2 px-2 py-0.5 text-[11px] text-zinc-500"
                      aria-hidden="true"
                    >
                      <span className="font-semibold text-zinc-400">Click and hold to drag</span>
                    </div>

                    <div
                      className={
                        "pointer-events-none absolute -bottom-10 left-0 z-20 px-1.5 py-0.5 text-xs text-zinc-400 rounded-sm ring-2 " +
                        (birthSex === "F" ? "ring-emerald-400/80" : "ring-transparent")
                      }
                    >
                      Female
                    </div>
                    <div
                      className={
                        "pointer-events-none absolute -bottom-10 right-0 z-20 px-1.5 py-0.5 text-xs text-zinc-400 rounded-sm ring-2 " +
                        (birthSex === "M" ? "ring-emerald-400/80" : "ring-transparent")
                      }
                    >
                      Male
                    </div>
                    {/* Track (clipped), marker box can extend beyond ends */}
                    <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
                      <div
                        className="pointer-events-none absolute inset-0 scale-[1.02]"
                        style={{ backgroundImage: smoothTrackGradient, filter: "blur(0.7px)" }}
                      />
                      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: smoothTrackGradient }} />
                      <div
                        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.10]"
                        style={{ backgroundImage: `url(${noiseSvg})`, backgroundSize: "120px 120px" }}
                      />
                      <div
                        className="pointer-events-none absolute inset-y-0 left-1/2 w-28 -translate-x-1/2"
                        style={{
                          background:
                            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0) 100%)",
                          opacity: 0.35 + 0.35 * centerProximity,
                        }}
                      />
                    </div>

                    {/* Marker (overflow visible) */}
                    <div
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 z-10"
                      style={{ left: `${value}%` }}
                    >
                      <div
                        className="h-12 w-12 sm:h-14 sm:w-14 -translate-x-1/2 rounded-full ring-1 ring-black/30"
                        style={{ backgroundColor: personRGB }}
                      >
                        <div className="grid h-full w-full place-items-center">
                          <div
                            className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full"
                            style={{
                              backgroundColor: oppositeRGB,
                              border: `2px solid ${personRGB}`,
                            }}
                          >
                            {birthSex ? (
                              <span
                                className="text-lg font-extrabold leading-none"
                                style={{ color: personRGB }}
                              >
                                {birthSex}
                              </span>
                            ) : (
                              <span
                                className="inline-block h-5 w-5 rounded-full"
                                style={{ backgroundColor: personRGB }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <input
                      aria-label="Identity slider"
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={value}
                      onChange={(e) => setValue(clamp(parseInt(e.target.value, 10), 0, 100))}
                      className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                    />
                  </div>
                </div>
              </div>

              {/* Perceived gray swatch (below grayscale + slider) */}
              <div className="mt-1 flex flex-col items-center gap-1">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-md ring-1 ring-black/30"
                  style={{ backgroundColor: personRGB }}
                  aria-hidden="true"
                />
                <div className="mt-1 text-xs text-zinc-400 leading-tight text-center">
                  <div>You’re Degree Of</div>
                  <div className="text-zinc-300">Femininity / Masculinity</div>
                </div>
              </div>

              {/* Stress risk index (activates with overlay) */}
              {stressRisk ? (
                <div
                  className="mt-3 rounded-2xl border border-zinc-800/70 bg-zinc-950/30 px-4 py-3"
                  style={{ boxShadow: `0 0 0 1px rgba(0,0,0,0.0), 0 10px 30px -25px ${riskColor.rgbaSoft}` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-zinc-200">Stress Risk Index</div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">
                        Uses the overlay band color at your current position.
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400">Stress Risk</span>
                        <span
                          className="h-5 w-5 rounded-md ring-1 ring-black/30"
                          style={{ backgroundColor: riskColor.rgb }}
                          aria-hidden="true"
                        />
                        <span className="text-[11px] font-medium text-zinc-200">{riskLabel}</span>
                      </div>

                      <div
                        className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 px-3 py-2"
                        style={{ borderColor: "rgba(255,255,255,0.10)" }}
                      >
                        <div className="text-[11px] text-zinc-400">Index</div>
                        <div className="-mt-0.5 flex items-baseline gap-2">
                          <div className="text-sm font-semibold text-zinc-100">{riskPct}%</div>
                          <div className="text-[11px] text-zinc-500">center proximity</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className="relative h-2 flex-1 overflow-hidden rounded-full ring-1 ring-zinc-800/70"
                      style={{ backgroundImage: stressBg }}
                      aria-hidden="true"
                    >
                      {/* Marker on the gradient */}
                      <div
                        className="absolute top-1/2 h-4 w-[2px] -translate-y-1/2 rounded bg-black/80"
                        style={{ left: `${value}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-zinc-500">{value}/100</div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 rounded-2xl bg-transparent px-4 py-3 text-xs text-zinc-400">
                  Turn on <span className="text-zinc-200">Stress Risk Index </span> to view the stress rating.
                </div>
              )}

              <div className="mt-0 rounded-2xl bg-transparent px-4 py-3 text-xs text-zinc-300">
                <span className="font-medium text-zinc-200">Perceptual Equilibrium:</span> the midpoint where identity is most
                sensitive to contextual change.
              </div>

              {stressRisk && (
                <div className="mt-3 rounded-2xl border border-zinc-800/70 bg-zinc-950/30 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-900/40 ring-1 ring-zinc-800/70">
                      <IconKey className="h-4.5 w-4.5 text-zinc-100" />
                    </span>
                    <span>Stress Risk Index Key</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <KeyItem colorClass="bg-emerald-400" label="Low Risk" />
                    <KeyItem colorClass="bg-amber-400" label="Mild Risk" />
                    <KeyItem colorClass="bg-orange-400" label="Elevated Risk" />
                    <KeyItem colorClass="bg-red-500" label="High Risk" />
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-400">
                    This color band represents contextual stress signals around the spectrum—an overlay, not a judgment of worth.
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      checked={advanced}
                      onChange={(e) => setAdvanced(e.target.checked)}
                      className="h-4 w-4 appearance-none rounded border border-zinc-600 bg-zinc-200 checked:bg-emerald-500 checked:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />
                    Show perceptual mechanics
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      checked={stressRisk}
                      onChange={(e) => setStressRisk(e.target.checked)}
                      className="h-4 w-4 appearance-none rounded border border-zinc-600 bg-zinc-200 checked:bg-emerald-500 checked:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />
                    Stress Risk Index
                  </label>
                </div>
                <div className="text-xs text-zinc-500">Position: {value}/100</div>
              </div>

              {advanced && (
                <div className="mt-3 space-y-4">
                  <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/30 p-3">
                    <div className="text-sm font-medium text-zinc-200">Perceptual mechanics</div>
                    <div className="mt-0.5 text-[11px] text-zinc-400">
                      Visual models that illustrate how the grayscale is constructed and how the poles mirror each other.
                    </div>

                    <div className="mt-3 relative flex items-center justify-center gap-2 min-[380px]:gap-3 sm:gap-4 px-2 pb-2">
                      <div className="mr-2 min-[380px]:mr-4 flex flex-col items-center">
                        <PixelClusterCircle value={value} birthSex={birthSex} />
                        <div className="mt-2 text-xs text-zinc-400">Close-Up Pixel View</div>
                      </div>

                      <span
                        className={
                          "inline-flex items-center justify-center px-2 py-0.5 text-xs text-zinc-400 rounded-sm transition-colors " +
                          (birthSex === "F" ? "ring-2 ring-emerald-400/80 text-zinc-400" : "ring-0 bg-transparent")
                        }
                      >
                        Female
                      </span>

                      <div className="flex flex-col items-center">
                        <DynamicYinYang value={value} birthSex={birthSex} />
                        <div className="mt-2 text-xs text-zinc-400">Equal Opposites</div>
                      </div>

                      <span
                        className={
                          "inline-flex items-center justify-center px-2 py-0.5 text-xs text-zinc-400 rounded-sm transition-colors " +
                          (birthSex === "M" ? "ring-2 ring-emerald-400/80 text-zinc-400" : "ring-0 bg-transparent")
                        }
                      >
                        Male
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <TrackCard title="Internal perception" subtitle="White to Gray to Black" value={value} reversed={false} />
                    <TrackCard title="External reflection" subtitle="Black to Gray to White" value={value} reversed />
                  </div>
                </div>
              )}
            </div>
          </div>
            </div>

            {/* Identity Notes + References (top-level dropdown tabs) */}
            {/* Interpretation (moved from second column) */}
            <div className="mt-3 w-full">
              <div className="flex w-full items-center gap-3 text-base sm:text-lg font-semibold text-white bg-zinc-500 rounded-xl px-4 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-white">
                  <IconEye className="h-8 w-8" />
                </span>
                <span>Interpretation</span>
              </div>
              <p className="mt-3 text-xs text-zinc-300">Output is framed as perception, not objective measurement.</p>

              <div className="mt-3">
                <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-3">
                  <div className="text-xs text-zinc-400">Your current self-perception</div>
                  <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-100">{label}</div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-zinc-800">
                      <div className="h-2 rounded-full bg-zinc-200" style={{ width: `${Math.round(intensity * 100)}%` }} />
                    </div>
                    <div className="text-xs text-zinc-400">{Math.round(intensity * 100)}%</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <MirroredCard title="From your perspective" align="left">{internalCopy}</MirroredCard>
                  <MirroredCard title="From external perception" align="left">{externalCopy}</MirroredCard>
                </div>

                <div className="mt-4 rounded-2xl bg-transparent px-4 py-3 text-xs text-zinc-400">
                  This tool reflects subjective self-perception. It does not define biology, morality, or value. Perception is
                  contextual and mutable.
                </div>
              </div>
            </div>

            {/* Identity Notes + References (top-level dropdown tabs) */}
            <div className="mt-4 w-full">
              <div className="flex w-full items-center gap-3 text-base sm:text-lg font-semibold text-white bg-zinc-500 rounded-xl px-4 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-white">
                  <IconIdentityInfo className="h-9 w-9" />
                </span>
                <span>Identity Information</span>
              </div>
              <p className="mt-3 text-xs text-zinc-300">Conceptual notes and academic references</p>

              <div className="mt-3">

              <div className="grid gap-3">
                <DropdownPanel title="Identity Mirroring">
                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3">
                      <p className="text-xs text-zinc-300">
                        <span className="font-medium text-zinc-200">Mirroring</span> is a core mechanism in identity formation.
                        Humans continuously calibrate their sense of self by observing, comparing to, and adapting in relation to
                        other people—especially those perceived as socially relevant or similar.
                      </p>
                      <p className="mt-2 text-xs text-zinc-300">
                        The terms <span className="text-zinc-200">positive</span> and <span className="text-zinc-200">negative</span>
                        mirroring describe the <span className="text-zinc-200">direction</span> of this calibration relative to one’s
                        own identity (same‑gender / same‑role vs opposite‑gender / opposing‑role reference points). They do{" "}
                        <span className="text-zinc-200">not</span> describe moral value, personal worth, or the quality of someone’s
                        character.
                      </p>
                      <p className="mt-2 text-xs text-zinc-400">
                        These labels are purely descriptive tools used to explain how identity shifts occur under different
                        relational and environmental conditions.
                      </p>
                    </div>

                    <DropdownPanel size="sm" title="Positive Mirroring (+)">
                      <p className="text-xs text-zinc-300">
                        <span className="font-medium text-zinc-200">Positive mirroring</span> occurs when we model ourselves after
                        people of the <span className="text-zinc-200">same gender</span> or same-role peers. This form of mirroring
                        tends to reinforce stability, coherence, and continuity in identity development.
                      </p>

                      <div className="mt-3 grid gap-2">
                        <DropdownPanel size="sm" title="Female to Female Mirroring">
                          <p className="text-xs text-zinc-300">
                            In <span className="text-zinc-200">female-to-female mirroring</span>, identity calibration happens through
                            observation and comparison with other females in one’s environment—often below conscious awareness.
                          </p>

                          <div className="mt-3 grid gap-2">
                            <DropdownPanel size="sm" title="Similar Females">
                              <p className="text-xs text-zinc-300">
                                Females tend to mirror the females who feel <span className="text-zinc-200">most similar</span> to
                                them—close friends, same-role peers, and people they identify with.
                              </p>

                              <ExampleSpectrumPair
                                tightConnect
                                title="Visual assistant: two female reference points"
                                subtitle="Two separate females shown on two stacked tracks"
                                top={{ value: 25, label: "F", sublabel: "75F / 25M", rowLabel: "Female A" }}
                                bottom={{ value: 25, label: "F", sublabel: "75F / 25M", rowLabel: "Female B" }}
                              />
                            </DropdownPanel>

                            <DropdownPanel size="sm" title="Different Females">
                              <p className="text-xs text-zinc-300">
                                Females also reflect off <span className="text-zinc-200">different</span> females through comparison
                                analysis.
                              </p>

                              <ExampleSpectrumPair
                                compact
                                title="Visual assistant: contrast comparison"
                                subtitle="Two separate females shown on two stacked tracks"
                                top={{ value: 5, label: "F", sublabel: "95F / 5M", rowLabel: "Female A" }}
                                bottom={{ value: 40, label: "F", sublabel: "60F / 40M", rowLabel: "Female B" }}
                              />
                            </DropdownPanel>
                          </div>
                        </DropdownPanel>

                        <DropdownPanel size="sm" title="Male to Male Mirroring">
                          <p className="text-xs text-zinc-300">
                            In <span className="text-zinc-200">male-to-male mirroring</span>, identity calibration occurs through
                            comparison with other males.
                          </p>

                          <div className="mt-3 grid gap-2">
                            <DropdownPanel size="sm" title="Similar Males">
                              <ExampleSpectrumPair
                                tightConnect
                                title="Visual assistant: two male reference points"
                                subtitle="Two separate males shown on two stacked tracks"
                                top={{ value: 75, label: "M", sublabel: "25F / 75M", rowLabel: "Male A" }}
                                bottom={{ value: 75, label: "M", sublabel: "25F / 75M", rowLabel: "Male B" }}
                              />
                            </DropdownPanel>

                            <DropdownPanel size="sm" title="Different Males">
                              <ExampleSpectrumPair
                                compact
                                title="Visual assistant: contrast comparison"
                                subtitle="Two separate males shown on two stacked tracks"
                                top={{ value: 95, label: "M", sublabel: "5F / 95M", rowLabel: "Male A" }}
                                bottom={{ value: 60, label: "M", sublabel: "40F / 60M", rowLabel: "Male B" }}
                              />
                            </DropdownPanel>
                          </div>
                        </DropdownPanel>
                      </div>
                    </DropdownPanel>

                    <DropdownPanel size="sm" title="Negative Mirroring (-)">
                      <p className="text-xs text-zinc-300">
                        <span className="font-medium text-zinc-200">Negative mirroring</span> occurs when we unconsciously model
                        ourselves against people of the <span className="text-zinc-200">opposite gender</span> or opposing roles.
                      </p>

                      <div className="mt-3 grid gap-2">
                        <DropdownPanel size="sm" title="Female to Male Mirroring">
                          <div className="mt-3 grid gap-2">
                            <DropdownPanel size="sm" title="Female to Equal Male Mirroring">
                              <ExampleSpectrumPair
                                tightConnect
                                title="Visual assistant: female ↔ equal male"
                                subtitle="Female and male peers shown on stacked tracks"
                                top={{ value: 40, label: "F", sublabel: "60F / 40M", rowLabel: "Female" }}
                                bottom={{ value: 60, label: "M", sublabel: "40F / 60M", rowLabel: "Male" }}
                              />
                            </DropdownPanel>

                            <DropdownPanel size="sm" title="Female to Different Male Mirroring">
                              <ExampleSpectrumPair
                                compact
                                title="Visual assistant: female ↔ different male"
                                subtitle="Contrast-based comparison across gender"
                                top={{ value: 25, label: "F", sublabel: "75F / 25M", rowLabel: "Female" }}
                                bottom={{ value: 80, label: "M", sublabel: "20F / 80M", rowLabel: "Male" }}
                              />
                            </DropdownPanel>
                          </div>
                        </DropdownPanel>

                        <DropdownPanel size="sm" title="Male to Female Mirroring">
                          <div className="mt-3 grid gap-2">
                            <DropdownPanel size="sm" title="Male to Equal Female Mirroring">
                              <ExampleSpectrumPair
                                tightConnect
                                title="Visual assistant: male ↔ equal female"
                                subtitle="Male and female peers shown on stacked tracks"
                                top={{ value: 60, label: "M", sublabel: "40F / 60M", rowLabel: "Male" }}
                                bottom={{ value: 40, label: "F", sublabel: "60F / 40M", rowLabel: "Female" }}
                              />
                            </DropdownPanel>

                            <DropdownPanel size="sm" title="Male to Different Female Mirroring">
                              <ExampleSpectrumPair
                                compact
                                title="Visual assistant: male ↔ different female"
                                subtitle="Contrast-based comparison across gender"
                                top={{ value: 75, label: "M", sublabel: "25F / 75M", rowLabel: "Male" }}
                                bottom={{ value: 20, label: "F", sublabel: "80F / 20M", rowLabel: "Female" }}
                              />
                            </DropdownPanel>
                          </div>
                        </DropdownPanel>
                      </div>
                    </DropdownPanel>
                  </div>
                </DropdownPanel>

                <DropdownPanel title="Identity Notes">
  <div className="grid gap-3">
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3">
      <p className="text-xs text-zinc-300">
        <span className="font-medium text-zinc-200">Identity</span> in this framework is not treated as a fixed trait or essence.
        It is modeled as a <span className="text-zinc-200">relational and perceptual process</span> that emerges through
        contrast, context, and repeated social feedback.
      </p>
    </div>

    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3">
      <p className="text-xs text-zinc-300">
        The femininity–masculinity spectrum shown on this site represents a <span className="text-zinc-200">single
        codependent continuum</span>, not two independent variables. An increase in one direction necessarily implies a
        relative decrease in the other from a given perceptual standpoint.
      </p>
    </div>

    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3">
      <p className="text-xs text-zinc-300">
        <span className="font-medium text-zinc-200">Perceptual equilibrium</span> (the center of the spectrum) is modeled as the
        point of highest contextual sensitivity. Individuals near this midpoint often experience greater variability in
        self-concept across different environments.
      </p>
    </div>

    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3">
      <p className="text-xs text-zinc-300">
        Language used throughout this site is <span className="text-zinc-200">descriptive, not prescriptive</span>. Terms such as
        feminine, masculine, positive mirroring, and negative mirroring are analytical tools intended to explain
        perceptual mechanics — not moral judgments, diagnoses, or social prescriptions.
      </p>
    </div>

    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3">
      <p className="text-xs text-zinc-300">
        This model assumes that <span className="text-zinc-200">perception is asymmetric</span>: how one experiences oneself may
        differ substantially from how one is experienced by others. Both perspectives can be valid simultaneously.
      </p>
    </div>
  </div>
</DropdownPanel>

                <DropdownPanel title="References">
                    
                    {/* Codependent / bipolar conceptualizations of masculinity & femininity */}
                    <ReferenceItem
                      authors="Jung, C. G."
                      year="1959"
                      title="Aion: Researches into the Phenomenology of the Self"
                      meta="Princeton, NJ: Princeton University Press. (Anima/Animus as complementary psychological opposites.)"
                    />
                    <ReferenceItem
                      authors="Jung, C. G."
                      year="1964"
                      title="Man and His Symbols"
                      meta="New York: Doubleday. (Masculine and feminine as relational symbolic principles.)"
                    />
                    <ReferenceItem
                      authors="Bakan, D."
                      year="1966"
                      title="The Duality of Human Existence: Isolation and Communion"
                      meta="Chicago: Rand McNally. (Agency and communion as complementary dimensions.)"
                    />
                    <ReferenceItem
                      authors="Helgeson, V. S."
                      year="1994"
                      title="Relation of Agency and Communion to Well-Being"
                      meta="Journal of Personality and Social Psychology, 67(3), 412–428."
                    />
                    <ReferenceItem
                      authors="Gilligan, C."
                      year="1982"
                      title="In a Different Voice"
                      meta="Cambridge, MA: Harvard University Press. (Relational vs autonomous orientations as interdependent.)"
                    />
                    <ReferenceItem
                      authors="Eagly, A. H., & Wood, W."
                      year="2012"
                      title="Social Role Theory"
                      meta="In P. A. M. Van Lange et al. (Eds.), Handbook of Theories of Social Psychology. Sage."
                    />
                    <ReferenceItem
                      authors="Bem, S. L."
                      year="1981"
                      title="Gender Schema Theory"
                      meta="Psychological Review, 88(4), 354–364. (Masculinity and femininity as mutually defining cognitive schemas.)"
                    />
                  </DropdownPanel>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}

function TrackCard({
  title,
  subtitle,
  value,
  reversed,
}: {
  title: string;
  subtitle: string;
  value: number;
  reversed?: boolean;
}) {
  const pos = reversed ? 100 - value : value;
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-200">{title}</div>
          <div className="text-xs text-zinc-500">{subtitle}</div>
        </div>
        <div className="text-xs text-zinc-500">{Math.round(pos)}/100</div>
      </div>
      <div className="relative mt-3">
        <div
          className={
            "h-8 w-full rounded-xl ring-1 ring-zinc-700/60 " +
            (reversed ? "bg-gradient-to-r from-black via-zinc-500 to-white" : "bg-gradient-to-r from-white via-zinc-500 to-black")
          }
        />
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ left: `${pos}%` }}>
          <div className="h-9 w-9 -translate-x-1/2 rounded-xl bg-zinc-950 ring-1 ring-zinc-500" />
        </div>
      </div>
    </div>
  );
}

function MirroredCard({
  title,
  align,
  children,
}: {
  title: string;
  align: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-800 p-3">
      <div className={"text-xs text-zinc-400 " + (align === "right" ? "text-right" : "text-left")}>{title}</div>
      <div className={"mt-1 text-sm leading-snug text-zinc-100 " + (align === "right" ? "text-right" : "text-left")}>{children}</div>
    </div>
  );
}

