import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Maximize2, Minimize2, MousePointer2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import SiteFrame from "../SiteFrame";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

type ManifestDoc = {
  title: string;
  file: string;
};

function SubtleBackground() {
  const matRef = useRef<THREE.MeshBasicMaterial | null>(null);

  useFrame(({ clock }) => {
    const m = matRef.current;
    if (!m) return;
    const t = clock.getElapsedTime();
    const light = 0.12 + 0.05 * Math.sin(t * 0.12);
    m.color.setRGB(light, light, light);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial ref={matRef} transparent opacity={0.55} depthWrite={false} />
    </mesh>
  );
}

export default function DocumentViewer() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<number>(0);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageWidth, setPageWidth] = useState(900);
  const [libraryDocs, setLibraryDocs] = useState<ManifestDoc[]>([]);
  const [selectedLibraryFile, setSelectedLibraryFile] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const pageElsRef = useRef<Array<HTMLDivElement | null>>([]);
  const pageSyncEnabledRef = useRef(false);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfPages) return;
    const root = pageContainerRef.current;
    if (!root) return;

    pageSyncEnabledRef.current = false;
    root.scrollTop = 0;
    setPdfPage(1);

    const enableSync = () => {
      pageSyncEnabledRef.current = true;
    };

    root.addEventListener("wheel", enableSync, { passive: true });
    root.addEventListener("touchmove", enableSync, { passive: true });
    return () => {
      root.removeEventListener("wheel", enableSync);
      root.removeEventListener("touchmove", enableSync);
    };
  }, [pdfPages]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/documents/manifest.json", { cache: "no-store" });
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as { documents?: ManifestDoc[] };
        if (cancelled) return;
        setLibraryDocs(Array.isArray(data.documents) ? data.documents : []);
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = dropdownRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setDropdownOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dropdownOpen]);

  const loadLibraryFile = (file: string) => {
    setSelectedLibraryFile(file);
    setPdfPages(0);
    setPdfPage(1);
    setPdfError(null);
    pageElsRef.current = [];
    pageSyncEnabledRef.current = false;
    setPdfUrl(`/documents/${encodeURIComponent(file)}`);
    setDropdownOpen(false);
  };

  useEffect(() => {
    const root = pageContainerRef.current;
    if (!root) return;

    pageSyncEnabledRef.current = false;
    root.scrollTop = 0;
    setPdfPage(1);
  }, [pdfUrl]);

  const selectedDownloadHref = selectedLibraryFile ? `/documents/${encodeURIComponent(selectedLibraryFile)}` : "";

  const hasPdf = !!pdfUrl;
  const clampPage = (next: number) => {
    if (!pdfPages) return Math.max(1, Math.floor(next));
    return Math.min(pdfPages, Math.max(1, Math.floor(next)));
  };

  const pageNumbers = useMemo(() => Array.from({ length: pdfPages }, (_, i) => i + 1), [pdfPages]);

  const scrollToPage = (page: number) => {
    const next = clampPage(page);
    const el = pageElsRef.current[next - 1];
    if (!el) {
      setPdfPage(next);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    pageSyncEnabledRef.current = true;
    setPdfPage(next);
  };

  useEffect(() => {
    const root = pageContainerRef.current;
    if (!root) return;
    if (!pdfPages) return;

    const els = pageElsRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!pageSyncEnabledRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => {
            const page = Number((e.target as HTMLElement).dataset.page || "0");
            const rootTop = e.rootBounds?.top ?? 0;
            const topDist = Math.abs(e.boundingClientRect.top - rootTop);
            return { page, topDist };
          })
          .filter((v) => v.page > 0)
          .sort((a, b) => a.topDist - b.topDist || a.page - b.page);

        if (!visible.length) return;
        setPdfPage((prev) => (prev === visible[0].page ? prev : visible[0].page));
      },
      { root, rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );

    for (const el of els) {
      if (el) obs.observe(el);
    }

    return () => obs.disconnect();
  }, [pdfPages]);

  useEffect(() => {
    const onChange = () => {
      const el = fullscreenRef.current;
      setIsFullscreen(!!el && document.fullscreenElement === el);
    };

    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    const el = fullscreenRef.current;
    if (!el) return;

    if (document.fullscreenElement === el) {
      await document.exitFullscreen();
      return;
    }

    await el.requestFullscreen();
  };

  useEffect(() => {
    const el = pageContainerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const next = Math.max(280, Math.floor(rect.width - 40));
      setPageWidth((prev) => (prev === next ? prev : next));
    };

    update();

    const obs = new ResizeObserver(() => update());
    obs.observe(el);

    return () => {
      obs.disconnect();
    };
  }, [isFullscreen, pdfUrl]);

  return (
    <SiteFrame wide>
      <div className="relative">
        <div className="relative">
          <div className="px-4">
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-4 w-4" />
              <span>Document Viewer</span>
            </h1>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-zinc-300 text-sm">Select a document from your documents folder to preview its pages.</p>
            </div>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-2xl border border-zinc-800/70 bg-transparent p-4">
            <div className="pointer-events-none absolute inset-0 z-0 opacity-100">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.10),transparent_55%)]" />
              <Canvas
                orthographic
                camera={{ position: [0, 0, 1], zoom: 1 }}
                dpr={[1, 1.5]}
                gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
                className="absolute inset-0 h-full w-full"
                style={{ width: "100%", height: "100%" }}
                frameloop="always"
                onCreated={({ gl }) => {
                  gl.setClearColor(0x000000, 0);
                }}
              >
                <SubtleBackground />
              </Canvas>
            </div>

            <div className="relative z-10 grid gap-3">
              <div className="grid w-full gap-2 sm:w-[36rem]" ref={dropdownRef}>
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100 mb-1">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-transparent ring-2 ring-white/80">
                    <MousePointer2 className="h-3 w-3" />
                  </span>
                  <span>Select A Document</span>
                </div>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/30 px-3 py-2 text-left text-xs text-zinc-200 outline-none transition-colors hover:border-green-500/70 focus:border-green-500/80 focus:ring-2 focus:ring-green-500/20"
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-expanded={dropdownOpen}
                >
                  <span className={selectedLibraryFile ? "text-zinc-100" : "text-zinc-400"}>
                    {selectedLibraryFile
                      ? libraryDocs.find((d) => d.file === selectedLibraryFile)?.title ?? selectedLibraryFile
                      : "Select a document…"}
                  </span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

              {dropdownOpen ? (
                <div className="overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-950/95 shadow-lg">
                  <div className="max-h-64 overflow-auto py-1">
                    {libraryDocs.length ? (
                      libraryDocs.map((d) => (
                        <button
                          key={d.file}
                          type="button"
                          className={
                            "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs transition-colors " +
                            (d.file === selectedLibraryFile
                              ? "bg-green-500/20 text-white"
                              : "text-white hover:bg-green-500/25")
                          }
                          onClick={() => loadLibraryFile(d.file)}
                        >
                          <span className="truncate">{d.title}</span>
                          {d.file === selectedLibraryFile ? <span className="text-[11px]">Selected</span> : null}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-zinc-400">No documents found.</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {hasPdf ? (
              <div ref={fullscreenRef} className="pdf-fullscreen">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="text-[11px] text-zinc-300">Page</div>
                      <div className="inline-flex items-center overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-950/30">
                        <button
                          type="button"
                          className={
                            "grid h-7 w-7 place-items-center border-r text-xs font-semibold transition-colors " +
                            (pdfPages && pdfPage > 1
                              ? "border-green-500/40 bg-green-500 text-zinc-900 hover:bg-green-600"
                              : "border-zinc-800/70 bg-zinc-900/40 text-zinc-500 pointer-events-none")
                          }
                          onClick={() => scrollToPage(pdfPage - 1)}
                          aria-disabled={!pdfPages || pdfPage <= 1}
                        >
                          -
                        </button>

                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={String(pdfPage)}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, "");
                            if (!digits) return;
                            scrollToPage(Number(digits));
                          }}
                          className="h-7 w-12 bg-transparent px-2 text-center text-xs text-white outline-none"
                          aria-label="Go to page"
                        />

                        <button
                          type="button"
                          className={
                            "grid h-7 w-7 place-items-center border-l text-xs font-semibold transition-colors " +
                            (pdfPages && pdfPage < pdfPages
                              ? "border-green-500/40 bg-green-500 text-zinc-900 hover:bg-green-600"
                              : "border-zinc-800/70 bg-zinc-900/40 text-zinc-500 pointer-events-none")
                          }
                          onClick={() => scrollToPage(pdfPage + 1)}
                          aria-disabled={!pdfPages || pdfPage >= pdfPages}
                        >
                          +
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-300">of {pdfPages || "—"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={selectedDownloadHref}
                      download={selectedLibraryFile || undefined}
                      className={
                        "inline-flex h-7 w-7 items-center justify-center rounded-xl border transition-colors " +
                        (selectedLibraryFile
                          ? "border-green-500/60 bg-green-500 text-zinc-900 hover:bg-green-600"
                          : "pointer-events-none border-zinc-700/60 bg-zinc-800/60 text-zinc-400")
                      }
                      aria-disabled={!selectedLibraryFile}
                      aria-label="Download selected document"
                      title={selectedLibraryFile ? "Download selected document" : "Select a document to download"}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>

                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-green-500/60 bg-green-500 text-zinc-900 transition-colors hover:bg-green-600"
                      onClick={() => {
                        void toggleFullscreen();
                      }}
                      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                      {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pdf-surface mt-2 w-full overflow-hidden rounded-none border border-zinc-800/70 bg-transparent">
                  <div className="pdf-scroll scrollbar-green h-[70vh] overflow-auto bg-transparent p-3" ref={pageContainerRef}>
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={(doc: { numPages: number }) => {
                        setPdfPages(doc.numPages);
                        setPdfPage(1);
                      }}
                      onLoadError={(err) => setPdfError(err instanceof Error ? err.message : String(err))}
                      loading={<div className="text-xs text-zinc-300">Loading PDF…</div>}
                      error={
                        <div className="grid gap-2 text-xs text-zinc-300">
                          <div>Could not load PDF.</div>
                          {pdfError ? <div className="text-zinc-400">{pdfError}</div> : null}
                        </div>
                      }
                    >
                      <div className="grid gap-4">
                        {pageNumbers.map((n) => (
                          <div
                            key={n}
                            data-page={n}
                            ref={(el) => {
                              pageElsRef.current[n - 1] = el;
                            }}
                            className="rounded-none border border-zinc-800/70 bg-transparent"
                          >
                            <div className="flex justify-center">
                              <Page
                                pageNumber={n}
                                width={pageWidth}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Document>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full overflow-hidden rounded-none border border-zinc-800/70 bg-transparent">
                <div className="scrollbar-green h-[70vh] overflow-auto bg-transparent p-3">
                  <div className="text-xs text-zinc-300">Select a document to preview pages here.</div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </SiteFrame>
  );
}
