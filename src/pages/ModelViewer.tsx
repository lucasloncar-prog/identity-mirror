import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { Document, Page, pdfjs } from "react-pdf";
import SiteFrame from "../SiteFrame";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

function useGrayscaleShaderMaterial() {
  return useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uLightDir: { value: new THREE.Vector3(0.35, 0.6, 0.75).normalize() },
        uAmbient: { value: 0.18 },
        uContrast: { value: 1.25 },
        uInvert: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uLightDir;
        uniform float uAmbient;
        uniform float uContrast;
        uniform float uInvert;
        varying vec3 vNormal;

        float applyContrast(float x, float c) {
          return clamp((x - 0.5) * c + 0.5, 0.0, 1.0);
        }

        void main() {
          float shade = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
          shade = mix(uAmbient, 1.0, shade);
          shade = applyContrast(shade, uContrast);
          if (uInvert > 0.5) shade = 1.0 - shade;
          gl_FragColor = vec4(vec3(shade), 1.0);
        }
      `,
    });
    mat.side = THREE.DoubleSide;
    return mat;
  }, []);
}

function Model({ url, contrast, invert }: { url: string; contrast: number; invert: boolean }) {
  const gltf = useGLTF(url);
  const material = useGrayscaleShaderMaterial();

  useEffect(() => {
    material.uniforms.uContrast.value = contrast;
    material.uniforms.uInvert.value = invert ? 1 : 0;
  }, [contrast, invert, material]);

  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if ((mesh as any).isMesh) {
        mesh.material = material;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    return cloned;
  }, [gltf.scene, material]);

  const groupRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    group.position.set(0, 0, 0);
    group.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    group.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 1.6 / maxDim : 1;
    group.scale.setScalar(scale);
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function ObjModel({ url, contrast, invert }: { url: string; contrast: number; invert: boolean }) {
  const obj = useLoader(OBJLoader, url);
  const material = useGrayscaleShaderMaterial();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    material.uniforms.uContrast.value = contrast;
    material.uniforms.uInvert.value = invert ? 1 : 0;
  }, [contrast, invert, material]);

  const scene = useMemo(() => {
    const cloned = obj.clone(true);
    cloned.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if ((mesh as any).isMesh) {
        const geom = mesh.geometry as THREE.BufferGeometry;
        if (geom && !geom.attributes.normal) geom.computeVertexNormals();
        mesh.material = material;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    return cloned;
  }, [obj, material]);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    group.position.set(0, 0, 0);
    group.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    group.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 1.6 / maxDim : 1;
    group.scale.setScalar(scale);
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function StlModel({ url, contrast, invert }: { url: string; contrast: number; invert: boolean }) {
  const geometry = useLoader(STLLoader, url);
  const material = useGrayscaleShaderMaterial();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    material.uniforms.uContrast.value = contrast;
    material.uniforms.uInvert.value = invert ? 1 : 0;
  }, [contrast, invert, material]);

  useLayoutEffect(() => {
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    const box = geometry.boundingBox;
    if (!box) return;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Permanently center geometry so it orbits nicely around the origin.
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.computeBoundingBox();

    const centeredBox = geometry.boundingBox;
    if (!centeredBox) return;
    centeredBox.getSize(size);

    const group = groupRef.current;
    if (!group) return;
    group.position.set(0, 0, 0);
    group.scale.set(1, 1, 1);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 1.6 / maxDim : 1;
    group.scale.setScalar(scale);
  }, [geometry]);

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

export default function ModelViewer() {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [objectKind, setObjectKind] = useState<"gltf" | "stl" | "obj" | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<number>(0);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [contrast, setContrast] = useState(1.25);
  const [invert, setInvert] = useState(false);
  const material = useGrayscaleShaderMaterial();

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    material.uniforms.uContrast.value = contrast;
    material.uniforms.uInvert.value = invert ? 1 : 0;
  }, [contrast, invert, material]);

  return (
    <SiteFrame>
      <h1 className="text-2xl font-semibold">3D Model Viewer</h1>
      <p className="mt-3 text-zinc-300 text-sm">
        Upload a <span className="font-semibold text-zinc-100">.glb/.gltf/.stl/.obj</span> model to view it with grayscale shading.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-3 rounded-2xl border border-zinc-800/70 bg-zinc-950/30 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-semibold text-zinc-100">
              Model file
              <input
                type="file"
                accept=".glb,.gltf,.stl,.obj,model/gltf-binary,model/gltf+json,model/stl"
                className="mt-2 block w-full text-xs text-zinc-300 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-800/90 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-zinc-700"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const lower = file.name.toLowerCase();
                  const kind: "gltf" | "stl" | "obj" | null = lower.endsWith(".stl")
                    ? "stl"
                    : lower.endsWith(".obj")
                      ? "obj"
                      : lower.endsWith(".glb") || lower.endsWith(".gltf")
                        ? "gltf"
                        : null;
                  setObjectKind(kind);
                  const nextUrl = URL.createObjectURL(file);
                  setObjectUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return nextUrl;
                  });
                }}
              />
            </label>

            <div className="grid w-full gap-3 sm:w-[360px]">
              <label className="grid gap-2">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span>Contrast</span>
                  <span className="tabular-nums">{contrast.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={2.5}
                  step={0.01}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-zinc-300">
                <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
                Invert shading
              </label>
            </div>
          </div>

          <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-800/70 bg-black">
            <div className="h-[420px] w-full">
              <Canvas camera={{ position: [0, 0, 2.2], fov: 45 }}>
                <color attach="background" args={["#000000"]} />
                <ambientLight intensity={0.2} />
                <directionalLight position={[2, 3, 4]} intensity={0.75} />
                <OrbitControls
                  makeDefault
                  target={[0, 0, 0]}
                  enablePan={false}
                  enableRotate={false}
                  minDistance={1.1}
                  maxDistance={6}
                  enableDamping
                  dampingFactor={0.08}
                />

                <Bounds fit clip observe margin={1.25}>
                  {objectUrl ? (
                    <Suspense fallback={null}>
                      {objectKind === "stl" ? (
                        <StlModel url={objectUrl} contrast={contrast} invert={invert} />
                      ) : objectKind === "obj" ? (
                        <ObjModel url={objectUrl} contrast={contrast} invert={invert} />
                      ) : (
                        <Model url={objectUrl} contrast={contrast} invert={invert} />
                      )}
                    </Suspense>
                  ) : (
                    <mesh>
                      <sphereGeometry args={[0.8, 64, 64]} />
                      <primitive object={material} attach="material" />
                    </mesh>
                  )}
                </Bounds>
              </Canvas>
            </div>
          </div>

          <div className="text-xs text-zinc-400">
            Tip: STL works for geometry + shading; for face/character work you&apos;ll usually want GLB (materials, morph targets, etc.).
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-zinc-800/70 bg-zinc-950/30 p-4">
          <div className="text-sm font-semibold text-zinc-100">PDF</div>

          <label className="text-sm font-semibold text-zinc-100">
            PDF file
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="mt-2 block w-full text-xs text-zinc-300 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-800/90 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-zinc-700"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const nextUrl = URL.createObjectURL(file);
                setPdfPages(0);
                setPdfError(null);
                setPdfUrl((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return nextUrl;
                });
              }}
            />
          </label>

          <div className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-black">
            <div className="max-h-[420px] overflow-auto p-3">
              {pdfUrl ? (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={(doc: { numPages: number }) => setPdfPages(doc.numPages)}
                  onLoadError={(err) => setPdfError(err instanceof Error ? err.message : String(err))}
                  loading={<div className="text-xs text-zinc-300">Loading PDF…</div>}
                  error={
                    <div className="grid gap-2 text-xs text-zinc-300">
                      <div>Could not load PDF.</div>
                      {pdfError ? <div className="text-zinc-400">{pdfError}</div> : null}
                    </div>
                  }
                >
                  <div className="grid gap-3">
                    {Array.from({ length: pdfPages }, (_, idx) => (
                      <div key={idx} className="grid gap-2">
                        <div className="text-[11px] text-zinc-300">Page {idx + 1}</div>
                        <div className="overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-950/30">
                          <Page pageNumber={idx + 1} width={372} renderTextLayer={false} renderAnnotationLayer={false} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Document>
              ) : (
                <div className="text-xs text-zinc-300">Upload a PDF to preview pages here.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteFrame>
  );
}
