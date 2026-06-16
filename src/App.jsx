import React, { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import surfboardModelUrl from "../files/SurfBoard.obj?url";
import aerialBackground from "../files/gemswell-aerial-background.jpg?url";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LOGO_BLACK = "#000000";

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const lerp = (from, to, progress) => from + (to - from) * progress;
const easeInOut = (progress) => 0.5 - Math.cos(clamp01(progress) * Math.PI) / 2;
const rangeProgress = (value, start, end) => clamp01((value - start) / (end - start));

const scrollMotion = {
  physicalProgressScale: 0.615,
  exitRawStart: 0.84,
  introEnd: 0.42,
  webStart: 0.66,
  webEnd: 0.92,
  webFadeStart: 0.985,
  webFadeEnd: 0.995,
  returnStart: 0.985,
  returnEnd: 1,
  turnStart: 0.04,
  turnEnd: 0.76,
  invadeStart: 0.7,
  anchorStart: 0.8,
  positionStart: 0,
  positionEnd: 1,
  logoStart: 0.34,
  finalLogoStart: 0.99,
  logoDuration: 0.08,
  logoStagger: 0.004,
  messageStart: 0.34,
  messageHoldEnd: 0.51,
  messageFadeEnd: 0.62,
  panelTwoRawStart: 0.535,
  panelTwoRawEnd: 0.695,
};

const mapScrollProgress = (rawProgress) => {
  const raw = clamp01(rawProgress);
  const preExitRawEnd = scrollMotion.returnStart * scrollMotion.physicalProgressScale;

  if (raw <= preExitRawEnd) {
    return clamp01(raw / scrollMotion.physicalProgressScale);
  }

  if (raw < scrollMotion.exitRawStart) {
    return scrollMotion.returnStart;
  }

  return lerp(
    scrollMotion.returnStart,
    scrollMotion.returnEnd,
    rangeProgress(raw, scrollMotion.exitRawStart, 1)
  );
};

const surfboardRotationCenterOffset = {
  x: 0,
  y: 0,
  z: 0,
};

const surfboardModelOrientation = {
  x: Math.PI,
  y: Math.PI,
  z: Math.PI / 2,
};

const surfboardRotation = {
  startX: -Math.PI * 0.5,
  endX: -0.02,
  startZ: Math.PI,
  endZ: Math.PI / 2,
};

const surfboardPosition = {
  desktop: {
    start: { x: -0.04, y: 0, z: 0.2 },
    end: { x: -0.04, y: 0, z: 0.2 },
    scale: 0.96,
  },
  mobile: {
    start: { x: -0.02, y: 0.06, z: 0.16 },
    end: { x: -0.02, y: 0.06, z: 0.16 },
    scale: 0.62,
  },
};

const surfboardCamera = {
  desktopFinalZ: 1.35,
  mobileFinalZ: 2.15,
};

function disposeThreeObject(root) {
  const geometries = new Set();
  const materials = new Set();

  root.traverse((child) => {
    if (child.geometry) {
      geometries.add(child.geometry);
    }

    if (child.material) {
      const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
      childMaterials.forEach((material) => materials.add(material));
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

const gemswellSymbolSegments = [
  {
    color: LOGO_BLACK,
    d: "M 212.878 18.000 L 212.878 136.103 L 234.731 136.103 L 234.731 49.665 C 234.731 35.182 225.636 22.904 212.878 18.000 Z",
    sweep: { direction: "down", x: 208, y: 14, width: 31, height: 126 },
  },
  {
    color: LOGO_BLACK,
    d: "M 179.148 320.278 L 179.148 18.000 C 166.391 22.903 157.296 35.182 157.296 49.665 L 157.296 290.140 C 157.296 304.231 166.485 316.046 179.148 320.278 Z",
    sweep: { direction: "up", x: 153, y: 14, width: 31, height: 310 },
  },
  {
    color: LOGO_BLACK,
    d: "M 218.597 159.469 C 205.692 159.469 195.231 169.930 195.231 182.835 L 195.231 182.836 L 212.878 182.836 L 212.878 320.280 C 225.542 316.047 234.731 304.231 234.731 290.140 L 234.731 159.469 L 218.597 159.469 Z",
    sweep: { direction: "down", x: 191, y: 155, width: 48, height: 169 },
  },
  {
    color: LOGO_BLACK,
    d: "M 143.954 183.450 L 64.747 183.450 C 38.969 183.450 18.000 162.480 18.000 136.703 C 18.000 110.926 38.969 89.956 64.747 89.956 L 144.149 89.956 L 144.149 112.457 L 64.747 112.457 C 51.378 112.457 40.500 123.333 40.500 136.703 C 40.500 150.071 51.378 160.949 64.747 160.949 L 143.954 160.949 L 143.954 183.450 Z",
    sweep: { direction: "left", x: 14, y: 86, width: 134, height: 102 },
    route:
      "M 143.954 101.206 L 64.747 101.206 C 44.100 101.206 29.250 116.930 29.250 136.703 C 29.250 156.474 44.100 172.200 64.747 172.200 L 143.954 172.200",
    routeStrokeWidth: 26,
  },
  {
    color: LOGO_BLACK,
    d: "M 350.005 112.457 L 247.879 112.457 L 247.879 89.956 L 372.506 89.956 C 372.506 102.383 362.432 112.457 350.005 112.457 Z",
    sweep: { direction: "right", x: 244, y: 86, width: 133, height: 31 },
  },
  {
    color: LOGO_BLACK,
    d: "M 144.149 252.519 L 18.709 252.519 C 18.709 240.092 28.784 230.018 41.210 230.018 L 144.149 230.018 L 144.149 252.519 Z",
    sweep: { direction: "left", x: 14, y: 226, width: 134, height: 31 },
  },
  {
    color: LOGO_BLACK,
    d: "M 324.423 252.519 L 247.877 252.519 L 247.877 230.018 L 324.423 230.018 C 337.792 230.018 350.005 219.140 350.005 205.771 C 350.005 192.401 337.792 181.526 324.423 181.526 L 247.877 181.526 L 247.877 159.025 L 324.423 159.025 C 350.198 159.025 372.506 179.996 372.506 205.771 C 372.506 231.549 350.198 252.519 324.423 252.519 Z",
    sweep: { direction: "right", x: 244, y: 155, width: 133, height: 102 },
    route:
      "M 247.877 241.268 L 324.423 241.268 C 345.800 241.268 361.256 225.650 361.256 205.771 C 361.256 185.890 345.800 170.276 324.423 170.276 L 247.877 170.276",
    routeStrokeWidth: 26,
  },
];

function getSweepAttrs({ direction, x, y, width, height }, open) {
  if (open) {
    return { x, y, width, height };
  }

  if (direction === "left") {
    return { x: x + width, y, width: 0, height };
  }

  if (direction === "up") {
    return { x, y: y + height, width, height: 0 };
  }

  if (direction === "down") {
    return { x, y, width, height: 0 };
  }

  return { x, y, width: 0, height };
}

function SurfboardStage({ sectionRef }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const section = sectionRef.current;

    if (!mount || !section) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let frameRequested = false;
    let boardRoot = null;
    let trigger = null;
    const state = { rawProgress: prefersReducedMotion ? 0.52 : 0 };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    mount.appendChild(renderer.domElement);

    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    const ambient = new THREE.HemisphereLight(0xfffbf3, 0x052532, 2.2);
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.1);
    keyLight.position.set(-3.8, 4.2, 6);
    const rimLight = new THREE.DirectionalLight(0x0d4f57, 2.1);
    rimLight.position.set(3.6, -2.6, 3.8);
    scene.add(ambient, keyLight, rimLight);

    const boardMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfffbef,
      roughness: 0.38,
      metalness: 0,
      clearcoat: 0.88,
      clearcoatRoughness: 0.16,
      side: THREE.DoubleSide,
    });
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x052532,
      transparent: true,
      opacity: 0.28,
    });

    const requestRender = () => {
      if (frameRequested) {
        return;
      }

      frameRequested = true;
      requestAnimationFrame(() => {
        frameRequested = false;

        if (!disposed) {
          renderer.render(scene, camera);
        }
      });
    };

    const applyProgress = (rawProgress) => {
      const raw = prefersReducedMotion ? 0.52 : clamp01(rawProgress);
      const progress = prefersReducedMotion ? 0.52 : mapScrollProgress(raw);
      const returnProgress = easeInOut(rangeProgress(progress, scrollMotion.returnStart, scrollMotion.returnEnd));
      const sceneProgress =
        progress < scrollMotion.returnStart
          ? rangeProgress(progress, 0, scrollMotion.introEnd)
          : 1 - returnProgress;
      const compact = mount.clientWidth < 720;
      const turnProgress = easeInOut(rangeProgress(sceneProgress, scrollMotion.turnStart, scrollMotion.turnEnd));
      const invadeProgress = easeInOut(rangeProgress(sceneProgress, scrollMotion.invadeStart, 1));
      const anchorProgress = easeInOut(rangeProgress(sceneProgress, scrollMotion.anchorStart, 1));
      const positionProgress = easeInOut(rangeProgress(sceneProgress, scrollMotion.positionStart, scrollMotion.positionEnd));
      const messageProgress = easeInOut(rangeProgress(progress, scrollMotion.messageStart, scrollMotion.messageHoldEnd));
      const introBrandOpacity =
        progress < scrollMotion.messageHoldEnd
          ? messageProgress
          : 1 - rangeProgress(progress, scrollMotion.messageHoldEnd, scrollMotion.messageFadeEnd);
      const introLogoDockProgress = easeInOut(
        rangeProgress(progress, scrollMotion.messageHoldEnd, scrollMotion.messageFadeEnd)
      );
      const introLogoOpacity =
        progress < scrollMotion.returnStart ? 1 : 1 - rangeProgress(progress, scrollMotion.returnStart, scrollMotion.returnEnd);
      const webProgress = easeInOut(rangeProgress(progress, scrollMotion.webStart, scrollMotion.webEnd));
      const webLayerOpacity =
        progress < scrollMotion.webFadeStart
          ? rangeProgress(progress, scrollMotion.webStart, scrollMotion.webStart + 0.04)
          : 1 - rangeProgress(progress, scrollMotion.webFadeStart, scrollMotion.webFadeEnd);
      const finalLogoProgress = easeInOut(rangeProgress(progress, scrollMotion.finalLogoStart, 1));
      const boardOpacity =
        progress < scrollMotion.returnStart ? 1 : 1 - returnProgress;
      const panelTwoProgress = easeInOut(
        rangeProgress(raw, scrollMotion.panelTwoRawStart, scrollMotion.panelTwoRawEnd)
      );

      state.rawProgress = raw;
      section.style.setProperty("--raw-scroll-progress", raw.toFixed(4));
      section.style.setProperty("--scene-progress", progress.toFixed(4));
      section.style.setProperty("--intro-brand-opacity", clamp01(introBrandOpacity).toFixed(4));
      section.style.setProperty("--intro-logo-dock-progress", introLogoDockProgress.toFixed(4));
      section.style.setProperty("--intro-logo-opacity", clamp01(introLogoOpacity).toFixed(4));
      section.style.setProperty("--web-progress", webProgress.toFixed(4));
      section.style.setProperty("--web-layer-opacity", clamp01(webLayerOpacity).toFixed(4));
      section.style.setProperty("--final-logo-progress", finalLogoProgress.toFixed(4));
      section.style.setProperty("--board-opacity", clamp01(boardOpacity).toFixed(4));
      section.style.setProperty("--panel-two-progress", panelTwoProgress.toFixed(4));

      const positionConfig = compact ? surfboardPosition.mobile : surfboardPosition.desktop;
      const boardX = lerp(positionConfig.start.x, positionConfig.end.x, positionProgress);
      const boardY = lerp(positionConfig.start.y, positionConfig.end.y, positionProgress);
      const boardZ = lerp(positionConfig.start.z, positionConfig.end.z, positionProgress);
      const boardScale = positionConfig.scale;

      boardGroup.position.set(boardX, boardY, boardZ);
      boardGroup.rotation.set(
        lerp(
          lerp(surfboardRotation.startX, surfboardRotation.endX, turnProgress),
          compact ? -0.012 : -0.008,
          anchorProgress
        ),
        lerp(lerp(-0.025, 0.018, turnProgress), compact ? 0.004 : 0, anchorProgress),
        lerp(surfboardRotation.startZ, surfboardRotation.endZ, turnProgress)
      );
      boardGroup.scale.setScalar(boardScale);

      const cameraX = lerp(compact ? -0.03 : -0.1, boardX, turnProgress);
      const cameraY = boardY;
      const cameraZ = lerp(
        lerp(compact ? 8.55 : 8.45, compact ? 5.55 : 5.2, turnProgress),
        compact ? surfboardCamera.mobileFinalZ : surfboardCamera.desktopFinalZ,
        invadeProgress
      );

      camera.position.set(
        cameraX,
        cameraY,
        cameraZ
      );
      camera.lookAt(boardX, boardY, boardZ);
      requestRender();
    };

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      applyProgress(state.rawProgress);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    new OBJLoader().load(
      surfboardModelUrl,
      (object) => {
        if (disposed) {
          disposeThreeObject(object);
          return;
        }

        const bounds = new THREE.Box3().setFromObject(object);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const scale = 5.75 / Math.max(size.x, size.y, size.z);
        const rotationCenter = center.clone().add(
          new THREE.Vector3(
            surfboardRotationCenterOffset.x,
            surfboardRotationCenterOffset.y,
            surfboardRotationCenterOffset.z
          )
        );

        const modelPivot = new THREE.Group();
        object.position.set(-rotationCenter.x, -rotationCenter.y, -rotationCenter.z);
        modelPivot.rotation.set(
          surfboardModelOrientation.x,
          surfboardModelOrientation.y,
          surfboardModelOrientation.z
        );
        modelPivot.scale.setScalar(scale);

        object.traverse((child) => {
          if (!child.isMesh) {
            return;
          }

          child.geometry.computeVertexNormals();
          child.material = boardMaterial;

          const edges = new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry, 32), edgeMaterial);
          child.add(edges);
        });

        modelPivot.add(object);
        boardRoot = modelPivot;
        boardGroup.add(modelPivot);
        applyProgress(state.rawProgress);
      },
      undefined,
      (error) => {
        console.error("Could not load surfboard OBJ", error);
      }
    );

    if (!prefersReducedMotion) {
      trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => applyProgress(self.progress),
        onRefresh: (self) => applyProgress(self.progress),
      });
      applyProgress(trigger.progress);
      ScrollTrigger.refresh();
    } else {
      applyProgress(state.rawProgress);
    }

    return () => {
      disposed = true;
      trigger?.kill();
      observer.disconnect();
      section.style.removeProperty("--raw-scroll-progress");
      section.style.removeProperty("--scene-progress");
      section.style.removeProperty("--intro-brand-opacity");
      section.style.removeProperty("--intro-logo-dock-progress");
      section.style.removeProperty("--intro-logo-opacity");
      section.style.removeProperty("--web-progress");
      section.style.removeProperty("--web-layer-opacity");
      section.style.removeProperty("--final-logo-progress");
      section.style.removeProperty("--board-opacity");
      section.style.removeProperty("--panel-two-progress");

      if (boardRoot) {
        disposeThreeObject(boardRoot);
      } else {
        boardMaterial.dispose();
        edgeMaterial.dispose();
      }

      renderer.dispose();

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [sectionRef]);

  return <div className="surfboard-stage" ref={mountRef} aria-hidden="true" />;
}

function GemswellLogoSvg({ className, fillColor = LOGO_BLACK, idPrefix, title }) {
  return (
    <svg className={className} viewBox="0 0 390.506 338.280" role="img" aria-labelledby={`${idPrefix}-title`}>
      <title id={`${idPrefix}-title`}>{title}</title>
      <defs>
        {gemswellSymbolSegments.map(({ route, routeStrokeWidth, sweep }, index) => {
          if (route) {
            return (
              <mask
                id={`${idPrefix}-route-${index}`}
                key={`mask-${idPrefix}-${index}`}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="390.506"
                height="338.28"
              >
                <rect width="390.506" height="338.28" fill="black" />
                <path
                  className={
                    idPrefix === "final-logo"
                      ? "logo-build__route-mask logo-build__route-mask--final"
                      : "logo-build__route-mask logo-build__route-mask--intro"
                  }
                  d={route}
                  data-segment-index={index}
                  fill="none"
                  stroke="white"
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                  strokeWidth={routeStrokeWidth}
                />
              </mask>
            );
          }

          const attrs = getSweepAttrs(sweep, false);

          return (
            <clipPath clipPathUnits="userSpaceOnUse" id={`${idPrefix}-sweep-${index}`} key={`clip-${idPrefix}-${index}`}>
              <rect
                className={
                  idPrefix === "final-logo"
                    ? "logo-build__sweep-rect logo-build__sweep-rect--final"
                    : "logo-build__sweep-rect logo-build__sweep-rect--intro"
                }
                data-segment-index={index}
                {...attrs}
              />
            </clipPath>
          );
        })}
      </defs>
      <g className="logo-build__artwork">
        <g className="logo-build__fill">
          {gemswellSymbolSegments.map(({ d, route }, index) => {
            const revealProps = route
              ? { mask: `url(#${idPrefix}-route-${index})` }
              : { clipPath: `url(#${idPrefix}-sweep-${index})` };

            return <path className="logo-build__fill-path" d={d} fill={fillColor} fillRule="nonzero" key={`${idPrefix}-${d}`} {...revealProps} />;
          })}
        </g>
      </g>
    </svg>
  );
}

function LogoBuildScene() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return undefined;
      }

      const introSweepRects = gsap.utils.toArray(".logo-build__sweep-rect--intro", section);
      const introRouteMasks = gsap.utils.toArray(".logo-build__route-mask--intro", section);
      const finalSweepRects = gsap.utils.toArray(".logo-build__sweep-rect--final", section);
      const finalRouteMasks = gsap.utils.toArray(".logo-build__route-mask--final", section);
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const setupLogoReveal = (sweepRects, routeMasks) => {
        sweepRects.forEach((rect) => {
          const index = Number(rect.dataset.segmentIndex);

          gsap.set(rect, {
            attr: getSweepAttrs(gemswellSymbolSegments[index].sweep, prefersReducedMotion),
          });
        });

        routeMasks.forEach((route) => {
          const length = route.getTotalLength();
          const gap = length * 2;

          route.dataset.routeLength = String(length);
          gsap.set(route, {
            strokeDasharray: prefersReducedMotion ? `${length} ${gap}` : `0 ${gap}`,
            strokeDashoffset: 0,
          });
        });
      };

      setupLogoReveal(introSweepRects, introRouteMasks);
      setupLogoReveal(finalSweepRects, finalRouteMasks);

      if (prefersReducedMotion) {
        return undefined;
      }

      const timeline = gsap.timeline({ paused: true });

      const addLogoReveal = (sweepRects, routeMasks, start) => {
        const revealTargets = [
          ...sweepRects.map((element) => ({
            element,
            index: Number(element.dataset.segmentIndex),
            type: "rect",
          })),
          ...routeMasks.map((element) => ({
            element,
            index: Number(element.dataset.segmentIndex),
            type: "route",
          })),
        ].sort((a, b) => a.index - b.index);

        revealTargets.forEach(({ element, index, type }) => {
          if (type === "route") {
            const length = Number(element.dataset.routeLength);

            timeline.to(
              element,
              {
                strokeDasharray: `${length} ${length * 2}`,
                ease: "none",
                duration: scrollMotion.logoDuration,
              },
              start + index * scrollMotion.logoStagger
            );
            return;
          }

          timeline.to(
            element,
            {
              attr: getSweepAttrs(gemswellSymbolSegments[index].sweep, true),
              ease: "none",
              duration: scrollMotion.logoDuration,
            },
            start + index * scrollMotion.logoStagger
          );
        });
      };

      addLogoReveal(introSweepRects, introRouteMasks, scrollMotion.logoStart);
      addLogoReveal(finalSweepRects, finalRouteMasks, scrollMotion.finalLogoStart);

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => timeline.progress(mapScrollProgress(self.progress)),
        onRefresh: (self) => timeline.progress(mapScrollProgress(self.progress)),
      });

      return () => {
        trigger.kill();
        timeline.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section className="logo-build" id="svg-build-lab" ref={sectionRef} aria-labelledby="logo-title">
      <h1 className="sr-only" id="logo-title">
        Gemswell Society symbol scroll build
      </h1>
      <div className="logo-build__sticky">
        <img className="logo-build__background" src={aerialBackground} alt="" aria-hidden="true" />
        <GemswellLogoSvg
          className="logo-build__svg logo-build__svg--intro"
          idPrefix="intro-logo"
          title="Gemswell Society symbol"
        />
        <SurfboardStage sectionRef={sectionRef} />
        <div className="gemswell-message" aria-hidden="true">
          <p>Gemswell Society</p>
          <strong>Una vida con más sentido, dentro y fuera del agua.</strong>
          <span>Surf · bienestar · comunidad</span>
        </div>
        <div className="site-story" aria-hidden="true">
          <div className="site-story__nav">
            <span>Gemswell Society</span>
            <span>Surf</span>
            <span>Bienestar</span>
            <span>Comunidad</span>
          </div>
          <section className="site-story__panel site-story__panel--one">
            <p>Manifesto</p>
            <h2>Una experiencia pensada para estar mejor dentro y fuera del agua.</h2>
          </section>
          <div className="site-story__metric-grid">
            <article>
              <strong>Surf guiado</strong>
              <span>técnica · ritmo · presencia</span>
            </article>
            <article>
              <strong>Bienestar</strong>
              <span>recuperación · calma · energía</span>
            </article>
            <article>
              <strong>Comunidad</strong>
              <span>encuentros · pertenencia · progreso</span>
            </article>
          </div>
          <section className="site-story__panel site-story__panel--two">
            <p>Membresia</p>
            <h2>Surf guiado, rituales de recuperación y comunidad activa todo el año.</h2>
          </section>
        </div>
        <div className="final-logo-scene" aria-hidden="true">
          <GemswellLogoSvg
            className="logo-build__svg logo-build__svg--final"
            fillColor="#ffffff"
            idPrefix="final-logo"
            title="Gemswell Society final symbol"
          />
          <p>Gemswell Society</p>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <main className="app-shell">
      <LogoBuildScene />
    </main>
  );
}
