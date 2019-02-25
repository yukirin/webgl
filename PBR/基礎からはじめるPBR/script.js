let c, gl, ext, then = 0;
let textures = [], cubeTexture = null, cubeEnvTexture = null;
const m = new matIV(), q = new qtnIV();
const cameraQt = q.identity(q.create()), mousePosition = [0.5, 0.5];

onload = function() {
  const eRange = document.getElementById('range');
  const eCheck = document.getElementById('checkbox');

  c = document.getElementById('canvas');
  c.width = 1280;
  c.height = 720;
  c.addEventListener('mousemove', mouseMove2, true);
  c.addEventListener('mouseout', mouseOut, true);

  gl = c.getContext('webgl2', {stencil: true});
  ext = getExtensions(gl);
  const prg = create_program('lighting.vert', 'x-vertex', 'lighting.frag', 'x-fragment');
  const fBufferSize = 2048;

  generateHdrCubeMap(['Ref/xp.hdr', 'Ref/yp.hdr', 'Ref/zp.hdr', 'Ref/xn.hdr', 'Ref/yn.hdr', 'Ref/zn.hdr'], [
    gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
  ]);

  generateHdrCubeMap(
      ['Env/xp.hdr', 'Env/yp.hdr', 'Env/zp.hdr', 'Env/xn.hdr', 'Env/yn.hdr', 'Env/zn.hdr'],
      [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
      ],
      true);

  const pData = plane();
  const vaos = {};
  let vbos;
  [vaos.plane, vbos] = createVAO([pData.p], ['position,3'], [0], pData.i, prg);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix] = initialMatrix(8);
  const lightDirection = [1.0, 1.0, 2.0];
  const initCamPosition = [0.0, 3.0, 4.0];
  const initCamUpDirection = [0, 1, 0];
  const camPosition = [];
  const camUpDirection = [];
  const ambientColor = [0.10, 0.10, 0.10, 1.0];
  let count = 0;

  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.DEPTH_TEST);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);
  gl.enable(gl.CULL_FACE);
  // gl.enable(gl.STENCIL_TEST);
  // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  // gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
  // gl.enable(gl.BLEND);

  // EV = AV + TV
  let AV = 2;  // Aperture Value
  let TV = 7;  // Time Value
  let aperture = Math.pow(Math.SQRT2, AV);
  let shutterSpeed = 1 / Math.pow(2, TV);
  let sensitivity = 100;
  let exposure = getExposure(getEV100(aperture, shutterSpeed, sensitivity));
  let directionalLightLx = 500;
  let pointLightLm = 3000;
  let directionalLightIntensity = directionalLightLx * exposure;        // lx [lm/m^2] * exposure
  let pointLightIntensity = (pointLightLm / Math.PI) * .25 * exposure;  // I * exposure : I [lm / sr] = lm / (4 * PI)

  function renderFrame(now) {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;

    count++;
    const state = eCheck.checked;
    const strength = eRange.value;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 1);

    if (state) {
      requestAnimationFrame(renderFrame);
      return;
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeEnvTexture);

    changePrgFramebuffer(prg, null, [c.width, c.height]);
    gl.bindVertexArray(vaos.plane);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0, 0, 0], [], pData.i.length,
        [mvpMatrix, now, mousePosition, [c.width, c.height], 0, directionalLightIntensity, pointLightIntensity, 1],
        [
          'mvpMatrix,m4', 'time,f1', 'mouse,v2', 'resolution,v2', 'cubeTexture,i1', 'directionalLightIntensity,f1',
          'pointLightIntensity,f1', 'cubeEnvTexture,i1'
        ],
        prg);

    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);

  function render(
      scale, rad, axis, translate, textures, indexSize, linkValues, linkNames_Types, prg, isDrawPoints = false,
      isInstanced = false, insCount = 1) {
    bind_texture(textures);

    m.identity(mMatrix);
    m.translate(mMatrix, translate, mMatrix);
    m.rotate(mMatrix, rad, axis, mMatrix);
    m.scale(mMatrix, scale, mMatrix);

    m.multiply(tmpMatrix, mMatrix, mvpMatrix);

    m.inverse(mMatrix, invMatrix);
    m.transpose(invMatrix, invTMatrix);

    linkUniform(linkValues, linkNames_Types, prg);

    if (isInstanced) {
      gl.drawElementsInstanced(gl.TRIANGLES, indexSize, gl.UNSIGNED_SHORT, 0, insCount);
      return;
    }

    if (isDrawPoints) {
      gl.drawArrays(gl.POINTS, 0, indexSize);
      return;
    }

    gl.drawElements(gl.TRIANGLES, indexSize, gl.UNSIGNED_SHORT, 0);
  }

  function setVPMatrix(fovy, width, height, near, far, isOrtho = false) {
    const center = [0.0, 0.0, 0.0];
    q.toVecIII(initCamPosition, cameraQt, camPosition);
    q.toVecIII(initCamUpDirection, cameraQt, camUpDirection);

    if (isOrtho) {
      m.lookAt([0.0, 0.0, 0.5], center, [0, 1, 0], vMatrix);
      m.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 100, pMatrix);
    } else {
      m.lookAt(camPosition, center, camUpDirection, vMatrix);
      m.perspective(fovy, width / height, near, far, pMatrix);
    }
    m.multiply(pMatrix, vMatrix, tmpMatrix);
  }
};