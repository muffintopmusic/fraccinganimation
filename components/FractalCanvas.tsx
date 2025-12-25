
import React, { useRef, useEffect } from 'react';
import { FractalParams } from '../types';

interface FractalCanvasProps {
  params: FractalParams;
  onNavUpdate: (updates: Partial<FractalParams>) => void;
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = (maxIter: number) => `
precision highp float;

#define MAX_ITER ${maxIter}

uniform vec2 u_resolution;
uniform float u_zoom;
uniform vec2 u_offset;
uniform vec2 u_c;
uniform float u_isJulia; 
uniform float u_colorShift;
uniform float u_time;
uniform float u_animateC;
uniform float u_animSpeed;
uniform float u_animMag;
uniform float u_exposure;
uniform float u_foldSpeed;
uniform float u_foldSplits;
uniform float u_animDepth;
uniform float u_yaw;
uniform float u_roll;
uniform float u_warp;
uniform float u_mirrorHorizontal;
uniform float u_grayscale;
uniform float u_antialiasing;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec2 complexFold(vec2 z, float t, float speed, float splits, float depth) {
    float a = t * speed * 0.5;
    for (int i = 0; i < 8; i++) {
        float fi = float(i);
        if (fi >= splits) break;
        
        vec2 prevZ = z;
        z = abs(z);
        float phase = a + fi * 0.7;
        float wave = sin(phase) * 0.5 + sin(phase * 1.618) * 0.25 + cos(phase * 2.11) * 0.15;
        float foldPoint = 0.4 + (0.3 * depth) * wave;
        foldPoint = clamp(foldPoint, 0.01, 1.5);
        z -= foldPoint;
        if (z.x < z.y) z.yx = z.xy;
        z *= 1.1; 
        
        // Handle fractional recursion depth smoothly
        float weight = clamp(splits - fi, 0.0, 1.0);
        z = mix(prevZ, z, weight);
    }
    return z;
}

vec3 getSample(vec2 coord) {
    vec2 res = u_resolution;
    vec2 uv = (coord - 0.5 * res) / min(res.y, res.x);
    
    float ry = u_yaw * 0.0174533;
    float rz = u_roll * 0.0174533;
    
    vec3 rd = normalize(vec3(uv, 1.0 / u_zoom));
    
    float cosY = cos(ry);
    float sinY = sin(ry);
    vec3 rdY = vec3(rd.x * cosY + rd.z * sinY, rd.y, -rd.x * sinY + rd.z * cosY);
    
    float cosZ = cos(rz);
    float sinZ = sin(rz);
    vec3 rdZ = vec3(rdY.x * cosZ - rdY.y * sinZ, rdY.x * sinZ + rdY.y * cosZ, rdY.z);
    
    vec2 p = (rdZ.xy / max(abs(rdZ.z), 1e-4)) + u_offset;

    float t = u_time;
    vec2 animC = vec2(0.0);
    if (u_animateC > 0.5) {
        float at = t * u_animSpeed;
        float cx = cos(at * 0.33) * 0.45 + sin(at * 0.79) * 0.15 + cos(at * 1.618) * 0.05;
        float cy = sin(at * 0.41) * 0.45 + cos(at * 0.83) * 0.15 + sin(at * 2.236) * 0.05;
        cx += sin(cy * 2.5 + at * 0.1) * 0.1;
        cy += cos(cx * 2.5 - at * 0.12) * 0.1;
        animC = vec2(cx, cy) * u_animMag;
    }

    vec2 z;
    vec2 c;

    if (u_isJulia > 0.5) {
        z = p;
        c = u_c + animC;
    } else {
        float splitIntensity = 1.0 - (u_animDepth / 2.0);
        float splitOffset = splitIntensity * splitIntensity * 0.4;
        p.y = abs(p.y) - splitOffset;
        if (u_mirrorHorizontal > 0.5) {
            p.x = abs(p.x) - splitOffset;
        }
        z = vec2(0.5, 0.5);
        c = p + u_c + animC;
    }

    float iter_count = 0.0;
    float minDist = 1e10;
    for (int i = 0; i < MAX_ITER; i++) {
        z = complexFold(z, t, u_foldSpeed, u_foldSplits, u_animDepth);
        float d = z.x * z.y + u_warp * (z.x * z.x - z.y * z.y);
        
        // Safe division to prevent flashing and artifacts
        float eps = 1e-4;
        if (abs(d) < eps) d = sign(d) * eps;
        if (d == 0.0) d = eps;
        
        vec2 nextZ = abs(z) / d + c;
        z = nextZ;
        
        float r2 = dot(z, z);
        minDist = min(minDist, r2);
        if (r2 > 10000.0) break;
        iter_count += 1.0;
    }

    if (iter_count >= float(MAX_ITER)) {
        return vec3(0.0);
    } else {
        float smooth_iter = iter_count - log2(max(1.0, log2(dot(z, z)))) + 4.0;
        float hue = fract(smooth_iter * 0.015 + u_colorShift + log(minDist + 1.0) * 0.04);
        float sat = 0.75;
        if (u_grayscale > 0.5) sat = 0.0;
        
        // Power-based scaling keeps intensity high even when total iteration count is high
        float norm_iter = iter_count / float(MAX_ITER);
        float val = clamp(pow(norm_iter, 0.4) * u_exposure * 3.0, 0.0, 1.0);
        
        // Add structure-based variation
        val *= (0.5 + 0.5 * sin(log(minDist + 1.1) * 4.0));
        
        return hsv2rgb(vec3(hue, sat, val));
    }
}

void main() {
    if (u_antialiasing > 0.5) {
        vec3 col = vec3(0.0);
        col += getSample(gl_FragCoord.xy + vec2(-0.25, -0.25));
        col += getSample(gl_FragCoord.xy + vec2(0.25, -0.25));
        col += getSample(gl_FragCoord.xy + vec2(-0.25, 0.25));
        col += getSample(gl_FragCoord.xy + vec2(0.25, 0.25));
        gl_FragColor = vec4(col / 4.0, 1.0);
    } else {
        gl_FragColor = vec4(getSample(gl_FragCoord.xy), 1.0);
    }
}
`;

const FractalCanvas: React.FC<FractalCanvasProps> = ({ params, onNavUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const requestRef = useRef<number>(0);
  const paramsRef = useRef(params);
  const startTime = useRef(performance.now());

  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const canvas = canvasRef.current;
      const gl = glRef.current;
      if (!canvas || !gl) return;

      if (document.fullscreenElement) {
        canvas.width = screen.width;
        canvas.height = screen.height;
        gl.viewport(0, 0, screen.width, screen.height);
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    const scale = 2.0 / (paramsRef.current.zoom * Math.min(window.innerWidth, window.innerHeight));
    onNavUpdate({
      offsetX: paramsRef.current.offsetX - dx * scale,
      offsetY: paramsRef.current.offsetY + dy * scale
    });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => { isDragging.current = false; };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSpeed = 1.15;
    const factor = e.deltaY > 0 ? 1 / zoomSpeed : zoomSpeed;
    onNavUpdate({ zoom: Math.max(0.001, Math.min(10000, paramsRef.current.zoom * factor)) });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastMousePos.current.x;
      const dy = e.touches[0].clientY - lastMousePos.current.y;
      const scale = 2.0 / (paramsRef.current.zoom * Math.min(window.innerWidth, window.innerHeight));
      onNavUpdate({
        offsetX: paramsRef.current.offsetX - dx * scale,
        offsetY: paramsRef.current.offsetY + dy * scale
      });
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = dist / lastPinchDist.current;
      onNavUpdate({ zoom: Math.max(0.001, Math.min(10000, paramsRef.current.zoom * factor)) });
      lastPinchDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    lastPinchDist.current = null;
  };

  const initGL = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;
    glRef.current = gl;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE(params.iterations));
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    
    programRef.current = program;
    gl.useProgram(program);

    const uniformNames = [
      'u_resolution', 'u_zoom', 'u_offset', 'u_c', 'u_isJulia', 
      'u_colorShift', 'u_time', 'u_animateC', 'u_animSpeed', 'u_animMag', 'u_exposure',
      'u_foldSpeed', 'u_foldSplits', 'u_animDepth', 'u_yaw', 'u_roll', 'u_warp', 
      'u_mirrorHorizontal', 'u_grayscale', 'u_antialiasing'
    ];
    uniformsRef.current = {};
    uniformNames.forEach(name => {
      uniformsRef.current[name] = gl.getUniformLocation(program, name);
    });

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posAttrib = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);
  };

  useEffect(() => {
    initGL();
    const animate = (time: number) => {
      const gl = glRef.current;
      const program = programRef.current;
      const canvas = canvasRef.current;
      const uniforms = uniformsRef.current;
      if (!gl || !program || !canvas) return;

      const isFullscreenMode = !!document.fullscreenElement;
      const targetWidth = isFullscreenMode ? screen.width : window.innerWidth;
      const targetHeight = isFullscreenMode ? screen.height : window.innerHeight;
      
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      const p = paramsRef.current;
      gl.useProgram(program);

      if (uniforms.u_resolution) gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
      if (uniforms.u_zoom) gl.uniform1f(uniforms.u_zoom, p.zoom);
      if (uniforms.u_offset) gl.uniform2f(uniforms.u_offset, p.offsetX, p.offsetY);
      if (uniforms.u_c) gl.uniform2f(uniforms.u_c, p.cReal, p.cImag);
      if (uniforms.u_isJulia) gl.uniform1f(uniforms.u_isJulia, p.isJulia ? 1.0 : 0.0);
      if (uniforms.u_colorShift) gl.uniform1f(uniforms.u_colorShift, p.colorShift);
      if (uniforms.u_time) gl.uniform1f(uniforms.u_time, (time - startTime.current) / 1000.0);
      if (uniforms.u_animateC) gl.uniform1f(uniforms.u_animateC, p.animateC ? 1.0 : 0.0);
      if (uniforms.u_animSpeed) gl.uniform1f(uniforms.u_animSpeed, p.animationSpeed);
      if (uniforms.u_animMag) gl.uniform1f(uniforms.u_animMag, p.animMag);
      if (uniforms.u_exposure) gl.uniform1f(uniforms.u_exposure, p.exposure);
      if (uniforms.u_foldSpeed) gl.uniform1f(uniforms.u_foldSpeed, p.foldSpeed);
      if (uniforms.u_foldSplits) gl.uniform1f(uniforms.u_foldSplits, p.foldSplits);
      if (uniforms.u_animDepth) gl.uniform1f(uniforms.u_animDepth, p.animDepth);
      if (uniforms.u_yaw) gl.uniform1f(uniforms.u_yaw, p.yaw);
      if (uniforms.u_roll) gl.uniform1f(uniforms.u_roll, p.roll);
      if (uniforms.u_warp) gl.uniform1f(uniforms.u_warp, p.warp);
      if (uniforms.u_mirrorHorizontal) gl.uniform1f(uniforms.u_mirrorHorizontal, p.mirrorHorizontal ? 1.0 : 0.0);
      if (uniforms.u_grayscale) gl.uniform1f(uniforms.u_grayscale, p.grayscale ? 1.0 : 0.0);
      if (uniforms.u_antialiasing) gl.uniform1f(uniforms.u_antialiasing, p.antialiasing ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [params.iterations]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="absolute inset-0 w-full h-full bg-black cursor-grab active:cursor-grabbing"
    />
  );
};

export default FractalCanvas;
