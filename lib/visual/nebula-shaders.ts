/*!
 * Adapted from ThreeUI's Julian Vance Nebula shader.
 * https://github.com/MengTo/threeui/blob/main/src/shaders/neuform-isolated/sources/julian-vance-nebula.html
 * Copyright (c) 2026 Meng To
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

export const nebulaVertexShader = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

export const nebulaFragmentShader = `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;

        vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
        vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}
        vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
        float snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
          vec2 i = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m; m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        float fbm(vec2 p){
          float v = 0.0; float a = 0.55;
          for(int i=0;i<4;i++){ v += a*snoise(p); p *= 2.05; a *= 0.5; }
          return v;
        }

        void main(){
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          vec2 p = uv;
          p.x *= u_resolution.x / u_resolution.y;

          float t = u_time * 0.05;
          vec2 drift = (u_mouse - 0.5) * 0.12;

          // warp coordinates for fluid motion
          vec2 st = p * 0.85 + drift;
          st += vec2(fbm(st + t), fbm(st - t)) * 0.35;

          vec3 col = vec3(0.005, 0.005, 0.012); // deep zinc base

          // main indigo mass, weighted to the right / upper-right
          vec2 c1 = vec2(u_resolution.x / u_resolution.y * 0.62, 0.85) + drift;
          float d1 = length(p - c1);
          float n1 = fbm(st * 1.4 + t * 2.0);
          float mass = (1.0 - smoothstep(0.05, 1.15, d1 + n1 * 0.32));

          // vertical sweeping tongue of light
          float tongue = (1.0 - smoothstep(0.02, 0.55, abs(p.x - (u_resolution.x/u_resolution.y*0.58) - n1*0.22))) * (1.0 - smoothstep(0.1, 1.2, abs(uv.y - 0.55)));

          // secondary far-right glow
          vec2 c2 = vec2(u_resolution.x / u_resolution.y * 1.05, 0.5);
          float d2 = length(p - c2);
          float mass2 = (1.0 - smoothstep(0.0, 0.9, d2 + fbm(st*1.1 - t)*0.25));

          vec3 deepIndigo = vec3(0.05, 0.02, 0.15);
          vec3 purple = vec3(0.2, 0.1, 0.6);
          vec3 hotViolet = vec3(0.5, 0.3, 1.0);

          col = mix(col, deepIndigo, clamp(mass*0.9 + mass2*0.7, 0.0, 1.0));
          col = mix(col, purple, clamp(mass*mass*1.1 + mass2*0.55, 0.0, 1.0));
          col += hotViolet * tongue * mass * 0.85;

          // breathing pulse
          float pulse = 0.92 + 0.08 * sin(u_time * 0.4);
          col *= pulse;

          // vignette
          float vig = (1.0 - smoothstep(0.35, 1.6, length(uv - vec2(0.45, 0.5))));
          col *= mix(0.55, 1.0, vig);

          // keep left side dark for the sans name
          col *= mix(0.35, 1.0, smoothstep(0.0, 0.55, uv.x));

          gl_FragColor = vec4(col, 1.0);
        }
      `;
