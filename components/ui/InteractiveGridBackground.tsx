"use client";

import { useEffect, useRef } from "react";

type WebNode = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  mass: number;
};

type WebEdge = {
  from: number;
  to: number;
  restLength: number;
};

type WebTopology = {
  nodes: WebNode[];
  edges: WebEdge[];
};

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function distance(a: Pick<WebNode, "x" | "y">, b: Pick<WebNode, "x" | "y">) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angularDistance(a: number, b: number) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function createWebTopology(width: number, height: number, seed: number): WebTopology {
  const random = createSeededRandom(seed);
  const rays = 22;
  const rings = 16;
  const nodes: WebNode[] = [];
  const edges: WebEdge[] = [];

  const hubX = width * (0.36 + random() * 0.28);
  const hubY = height * (0.28 + random() * 0.32);
  const maxRadius =
    Math.max(
      Math.hypot(hubX, hubY),
      Math.hypot(width - hubX, hubY),
      Math.hypot(hubX, height - hubY),
      Math.hypot(width - hubX, height - hubY),
    ) + 90;
  const denseSectorAngle = random() * Math.PI * 2;
  const denseSectorStrength = 0.55 + random() * 0.55;

  const indexOf = (rayIndex: number, ringIndex: number) => rayIndex * rings + ringIndex;

  const rayProfiles = Array.from({ length: rays }, (_, i) => {
    const baseAngle = (i * 2 * Math.PI) / rays;
    const angleStep = (2 * Math.PI) / rays;
    const angle =
      baseAngle +
      (random() - 0.5) * angleStep * 0.42 +
      Math.sin(i * 1.73 + random() * Math.PI) * angleStep * 0.12;
    const denseFactor =
      ((1 + Math.cos(angularDistance(angle, denseSectorAngle))) / 2) ** 3 * denseSectorStrength;

    return {
      angle,
      radiusScale: 0.94 + random() * 0.2,
      spacingExponent: 1.08 + denseFactor * 0.5 + random() * 0.38,
      phase: random() * Math.PI * 2,
    };
  });

  for (let rayIndex = 0; rayIndex < rays; rayIndex++) {
    const { angle, radiusScale, spacingExponent, phase } = rayProfiles[rayIndex];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tangentX = -sin;
    const tangentY = cos;

    for (let ringIndex = 0; ringIndex < rings; ringIndex++) {
      const t = ringIndex / (rings - 1);
      const radialNoise = (random() - 0.5) * (12 + t * 34);
      const tangentNoise = (random() - 0.5) * (10 + t * 32);
      const wovenRipple = Math.sin(t * Math.PI * 3.6 + phase) * t * 18;
      const radius =
        14 + t ** spacingExponent * maxRadius * radiusScale + radialNoise + wovenRipple;
      const baseX = hubX + radius * cos + tangentNoise * tangentX;
      const baseY = hubY + radius * sin + tangentNoise * tangentY;

      nodes.push({
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        vx: 0,
        vy: 0,
        mass: 0.92 + random() * 0.28,
      });
    }
  }

  const addEdge = (from: number, to: number, slack = 1) => {
    const fromNode = nodes[from];
    const toNode = nodes[to];
    edges.push({
      from,
      to,
      restLength: Math.max(distance(fromNode, toNode) * slack, 1),
    });
  };

  for (let rayIndex = 0; rayIndex < rays; rayIndex++) {
    for (let ringIndex = 0; ringIndex < rings - 1; ringIndex++) {
      addEdge(
        indexOf(rayIndex, ringIndex),
        indexOf(rayIndex, ringIndex + 1),
        0.98 + random() * 0.06,
      );
    }
  }

  for (let rayIndex = 0; rayIndex < rays; rayIndex++) {
    const nextRayIndex = (rayIndex + 1) % rays;

    for (let ringIndex = 0; ringIndex < rings; ringIndex++) {
      const canOffset = ringIndex > 2 && ringIndex < rings - 2;
      const offset = canOffset && random() < 0.16 ? (random() < 0.5 ? -1 : 1) : 0;
      const neighborRingIndex = Math.min(Math.max(ringIndex + offset, 0), rings - 1);
      const shouldSkip = ringIndex > 3 && random() < 0.035;

      if (!shouldSkip) {
        addEdge(
          indexOf(rayIndex, ringIndex),
          indexOf(nextRayIndex, neighborRingIndex),
          0.96 + random() * 0.08,
        );
      }
    }
  }

  return { nodes, edges };
}

export function InteractiveGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let isAnimationActive = true;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let topology: WebTopology = { nodes: [], edges: [] };
    const webSeed = Math.floor(Math.random() * 0xffffffff);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initGrid = () => {
      resizeCanvas();
      topology = createWebTopology(width, height, webSeed);
    };

    const baseSpringConstant = 0.052;
    const edgeSpringConstant = 0.009;
    const edgeIterations = 2;
    const damping = 0.86;
    const maxPull = 55;
    const attractionRadius = 320;

    initGrid();

    const edgeColor = (node: WebNode, mouse: typeof mouseRef.current) => {
      if (!mouse.active) {
        return "rgba(255, 255, 255, 0.12)";
      }

      const mDx = mouse.x - node.x;
      const mDy = mouse.y - node.y;
      const mDist = Math.sqrt(mDx * mDx + mDy * mDy);

      if (mDist >= attractionRadius) {
        return "rgba(255, 255, 255, 0.12)";
      }

      const alphaRatio = (attractionRadius - mDist) / attractionRadius;
      return `rgba(255, 94, 0, ${alphaRatio * 0.23 + 0.12})`;
    };

    const applyEdgeTension = () => {
      for (let iteration = 0; iteration < edgeIterations; iteration++) {
        for (const edge of topology.edges) {
          const from = topology.nodes[edge.from];
          const to = topology.nodes[edge.to];
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const currentLength = Math.sqrt(dx * dx + dy * dy) || 1;
          const stretch = currentLength - edge.restLength;
          const force = stretch * edgeSpringConstant;
          const forceX = (dx / currentLength) * force;
          const forceY = (dy / currentLength) * force;

          from.vx += forceX / from.mass;
          from.vy += forceY / from.mass;
          to.vx -= forceX / to.mass;
          to.vy -= forceY / to.mass;
        }
      }
    };

    const animate = (time: number) => {
      if (!isAnimationActive) {
        animationFrameId = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      for (const node of topology.nodes) {
        const windX = Math.sin(node.baseY * 0.0025 + time * 0.0006) * 14;
        const windY = Math.cos(node.baseX * 0.0025 + time * 0.0006) * 10;

        let pullX = 0;
        let pullY = 0;

        if (mouse.active) {
          const dx = mouse.x - node.baseX;
          const dy = mouse.y - node.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < attractionRadius) {
            const force = (attractionRadius - dist) / attractionRadius;
            const easedForce = force * force * (3 - 2 * force);
            pullX = (dx / (dist || 1)) * easedForce * maxPull;
            pullY = (dy / (dist || 1)) * easedForce * maxPull;
          }
        }

        const targetX = node.baseX + windX + pullX;
        const targetY = node.baseY + windY + pullY;

        node.vx += ((targetX - node.x) * baseSpringConstant) / node.mass;
        node.vy += ((targetY - node.y) * baseSpringConstant) / node.mass;
      }

      applyEdgeTension();

      for (const node of topology.nodes) {
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;
      }

      ctx.lineWidth = 0.75;

      for (const edge of topology.edges) {
        const from = topology.nodes[edge.from];
        const to = topology.nodes[edge.to];

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = edgeColor(from, mouse);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const stopAnimation = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleVisibilityChange = () => {
      if (document.hidden || reduceMotion) {
        mouseRef.current.active = false;
        isAnimationActive = false;
        stopAnimation();
        return;
      }

      isAnimationActive = true;
      startAnimation();
    };

    const handleResize = () => {
      initGrid();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("blur", handleMouseLeave);
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (!reduceMotion) {
      startAnimation();
    }

    return () => {
      stopAnimation();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("blur", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="interactive-mesh-grid-background"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: -1,
      }}
    />
  );
}
