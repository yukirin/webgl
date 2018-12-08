
precision mediump float;

uniform sampler2D texture;
uniform sampler2D heightTexture;
uniform float height;

varying vec4 vColor;
varying vec2 vTextureCoord;
varying vec3 vEyeDirection;
varying vec3 vLightDirection;

void main(void) {
    vec3 light = normalize(vLightDirection);
    vec3 eye = normalize(vEyeDirection);
    float hScale = texture2D(heightTexture, vTextureCoord).r * height;
    vec2 hTexCoord = vTextureCoord - hScale * eye.xy;

    vec3 mNormal = (texture2D(texture, hTexCoord) * 2.0 -1.0).rgb;
    vec3 halfLE = normalize(light + eye);
    float diffuse = clamp(dot(mNormal, light), 0.1, 1.0);
    float specular = pow(clamp(dot(mNormal, halfLE), 0.0, 1.0), 100.0);
    vec4 destColor = vColor * vec4(vec3(diffuse), 1.0) + vec4(vec3(specular), 1.0);
    gl_FragColor = destColor;
}