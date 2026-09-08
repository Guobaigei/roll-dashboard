import { nebulaFragmentShader, nebulaVertexShader } from "./nebula-shaders";

// A single full-screen triangle renders the ThreeUI shader without a scene library.
export function createNebulaRenderer(canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return () => {};

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0.5, y: 0.5 };
  const target = { x: 0.5, y: 0.5 };
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let timeUniform: WebGLUniformLocation | null = null;
  let sizeUniform: WebGLUniformLocation | null = null;
  let mouseUniform: WebGLUniformLocation | null = null;
  let frame: number | null = null;
  let visible = false;
  let elapsed = 0;
  let previousTime = 0;
  let disposed = false;

  const release = () => {
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    buffer = null;
    program = null;
  };

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  };

  const initialize = () => {
    const vertex = compile(gl.VERTEX_SHADER, nebulaVertexShader);
    const fragment = compile(gl.FRAGMENT_SHADER, nebulaFragmentShader);
    const candidate = gl.createProgram();
    if (!vertex || !fragment || !candidate) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      if (candidate) gl.deleteProgram(candidate);
      return false;
    }
    gl.attachShader(candidate, vertex);
    gl.attachShader(candidate, fragment);
    gl.linkProgram(candidate);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(candidate, gl.LINK_STATUS)) {
      gl.deleteProgram(candidate);
      return false;
    }
    program = candidate;
    buffer = gl.createBuffer();
    if (!buffer) {
      release();
      return false;
    }
    // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API, not a React Hook.
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    timeUniform = gl.getUniformLocation(program, "u_time");
    sizeUniform = gl.getUniformLocation(program, "u_resolution");
    mouseUniform = gl.getUniformLocation(program, "u_mouse");
    return true;
  };

  const draw = () => {
    if (disposed || !program || gl.isContextLost()) return;
    gl.uniform1f(timeUniform, elapsed);
    gl.uniform2f(sizeUniform, canvas.width, canvas.height);
    gl.uniform2f(mouseUniform, pointer.x, pointer.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.dataset.ready = "true";
  };

  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previousTime = 0;
    canvas.dataset.animating = "false";
  };

  const animate = (now: number) => {
    frame = null;
    if (disposed || !visible || document.hidden || motion.matches || !program) return;
    if (!previousTime || now - previousTime >= 1000 / 30) {
      const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.1) : 0;
      elapsed += delta * 0.65;
      previousTime = now;
      const smoothing = 1 - Math.exp(-3 * delta);
      pointer.x += (target.x - pointer.x) * smoothing;
      pointer.y += (target.y - pointer.y) * smoothing;
      draw();
    }
    frame = requestAnimationFrame(animate);
  };

  const syncAnimation = () => {
    stop();
    if (disposed || !visible || document.hidden || !program || gl.isContextLost()) return;
    draw();
    if (!motion.matches) {
      canvas.dataset.animating = "true";
      frame = requestAnimationFrame(animate);
    }
  };

  const resize = () => {
    // Soft clouds don't need a retina-sized drawing buffer.
    const scale = Math.min(window.devicePixelRatio || 1, 1.25) * 0.75;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (visible && !document.hidden) draw();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (motion.matches || !visible || event.pointerType !== "mouse") return;
    const rect = canvas.getBoundingClientRect();
    target.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    target.y = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  };

  const resetPointer = () => {
    target.x = 0.5;
    target.y = 0.5;
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    stop();
    canvas.dataset.ready = "false";
    release();
  };

  const onContextRestored = () => {
    if (disposed || !initialize()) return;
    resize();
    syncAnimation();
  };

  if (!initialize()) return () => {};
  resize();
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncAnimation();
  });
  intersectionObserver.observe(canvas);
  document.addEventListener("visibilitychange", syncAnimation);
  motion.addEventListener("change", syncAnimation);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("blur", resetPointer);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  return () => {
    disposed = true;
    stop();
    canvas.dataset.ready = "false";
    sizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", syncAnimation);
    motion.removeEventListener("change", syncAnimation);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("blur", resetPointer);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    release();
  };
}
