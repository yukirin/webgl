precision mediump float;

uniform vec2 resolution;
uniform sampler2D texture;
uniform vec2 mouse;
uniform bool mouseFlag;
uniform float velocity;

const float SPEED = 0.05;

void main(void) {
  vec2 texCoord = gl_FragCoord.xy / resolution;
  vec4 t = texture2D(texture, texCoord);
  vec2 v = normalize(mouse - t.xy) * 0.2;
  vec2 hormingVector = normalize(v + t.zw);

  vec4 destColor = vec4(t.xy + hormingVector * SPEED * velocity, hormingVector);

  if (!mouseFlag) {
    destColor.zw = t.zw;
  }

  gl_FragColor = destColor;
}