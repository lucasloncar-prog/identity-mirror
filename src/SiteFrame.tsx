import React, { useState } from "react";
import { Link } from "react-router-dom";

function HeaderLogo() {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const src = stage === 0 ? "/favicon.svg" : stage === 1 ? "/favicon.ico" : null;

  if (!src) {
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
          <path d="M32 2c8.3 0 15 6.7 15 15S40.3 32 32 32 17 25.3 17 17 23.7 2 32 2z" fill="#fff" />
          <path d="M32 32c8.3 0 15 6.7 15 15S40.3 62 32 62 17 55.3 17 47s6.7-15 15-15z" fill="#000" />
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

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const CASHAPP_URL = "https://cash.app/$lucasloncar";
  const VENMO_URL = "https://venmo.com/u/lucasloncar1992";

  return (
    <div
      className="min-h-screen text-zinc-100"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 0), radial-gradient(rgba(0,0,0,0.08) 1px, transparent 0)",
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

          <div className="mt-3 flex w-full flex-wrap items-center justify-start gap-2 self-start">
            <Link
              to="/"
              className="inline-flex items-center rounded-full border border-zinc-700/60 bg-zinc-700/90 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10 py-3">{children}</main>
    </div>
  );
}
