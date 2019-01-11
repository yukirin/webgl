
attribute float index;

uniform vec2 resolution;
uniform sampler2D texture;
uniform float pointScale;

void main() {
  vec2 halfPixelOffset = (vec2(1.0, 1.0) / resolution) * 0.5;
  vec2 p = vec2(mod(index, resolution.x) / resolution.x, floor(index / resolution.x) / resolution.y);
  vec4 t = texture2D(texture, p + halfPixelOffset);

  gl_Position = vec4(t.xy, 0.0, 1.0);
  gl_PointSize = 0.1 + pointScale;
}
