let c, gl;
let then = 0;
let cubeTexture = null;
const m = new matIV();
const q = new qtnIV();
const textures = [];
const cameraQt = q.identity(q.create());

onload = function() {
  const eRange = document.getElementById('range');
  const eCheck = document.getElementById('checkbox');

  c = document.getElementById('canvas');
  c.width = 1280;
  c.height = 720;
  c.addEventListener('mousemove', mouseMove, true);

  gl = c.getContext('webgl', {stencil: true}) || c.getContext('experimental-webgl', {stencil: true});
  const prg = create_program('vertex.vert', 'x-vertex', 'fragment.frag', 'x-fragment');
  const fogPrg = create_program('fog.vert', 'x-vertex', 'fog.frag', 'x-fragment');

  const fBufferSize = 2048;
  const fBuffer = create_framebuffer(fBufferSize, fBufferSize, true);
  create_texture('', 0, createNoiseT());

  const torusData = torus(64, 64, 0.25, 0.5);
  const trIndex = create_ibo(torusData.i);
  const planeData = particlePlane();
  const pIndex = create_ibo(planeData.i);
  const boxData = halfBox([0.3, 0.3, 0.3, 1.0]);
  const bIndex = create_ibo(boxData.i);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix] = initialMatrix(8);
  const lightDirection = [-0.2, 0.0, 0.577];
  const initCamPosition = [0, 1.5, 5];
  const initCamUpDirection = [0, 1, 0];
  const camPosition = [];
  const camUpDirection = [];
  let count = 0;
  const offsets = getParticleOffsets();
  tMatrix[0] = 0.5;
  tMatrix[1] = 0.0;
  tMatrix[2] = 0.0;
  tMatrix[3] = 0.0;
  tMatrix[4] = 0.0;
  tMatrix[5] = 0.5;
  tMatrix[6] = 0.0;
  tMatrix[7] = 0.0;
  tMatrix[8] = 0.0;
  tMatrix[9] = 0.0;
  tMatrix[10] = 1.0;
  tMatrix[11] = 0.0;
  tMatrix[12] = 0.5;
  tMatrix[13] = 0.5;
  tMatrix[14] = 0.0;
  tMatrix[15] = 1.0;

  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.DEPTH_TEST);
  gl.frontFace(gl.CCW);
  gl.enable(gl.CULL_FACE);
  // gl.enable(gl.STENCIL_TEST);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
  gl.enable(gl.BLEND);

  function render(scale, rad, axis, translate, textures, indexSize, ibo, linkValues, linkNames, linkTypes, prg) {
    bind_texture(textures);

    m.identity(mMatrix);
    m.translate(mMatrix, translate, mMatrix);
    m.rotate(mMatrix, rad, axis, mMatrix);
    m.scale(mMatrix, scale, mMatrix);

    m.multiply(tmpMatrix, mMatrix, mvpMatrix);

    m.inverse(mMatrix, invMatrix);
    m.transpose(invMatrix, invTMatrix);

    linkUniform(linkValues, linkNames, linkTypes, prg);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
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


  function renderFrame(now) {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;
    const state = eCheck.checked;
    const depthCoef = eRange.value * 0.001;

    count++;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 1);

    changePrgFramebuffer(prg, fBuffer.f, [fBufferSize, fBufferSize]);
    setVPMatrix(45, c.width, c.height, 0.1, 10);
    linkAttribute([boxData.p, boxData.c, boxData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
    render(
        [2.0, 2.0, 2.0], 0, [1, 1, 1], [0, -0.25, 0], [], boxData.i.length, bIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, [0.0, 0.0, 0.0, 1.0]],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4'], prg);

    linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.0, 0.7, 0.0], [], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, [1.0, 1.0, 1.0, 1.0]],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4'], prg);

    changePrgFramebuffer(prg, null, [c.width, c.height], [0.0, 0.7, 0.7, 1.0]);
    setVPMatrix(45, c.width, c.height, 0.1, 10);
    linkAttribute([boxData.p, boxData.c, boxData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
    render(
        [2.0, 2.0, 2.0], 0, [1, 1, 1], [0, -0.25, 0], [], boxData.i.length, bIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, [0.0, 0.0, 0.0, 1.0]],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4'], prg);

    linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.0, 0.7, 0.0], [], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, [1.0, 1.0, 1.0, 1.0]],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4'], prg);


    gl.useProgram(fogPrg);
    linkAttribute([planeData.p, planeData.c, planeData.t], ['position', 'color', 'texCoord'], [3, 4, 2], fogPrg);
    for (let i = 0; i < 30; i++) {
      offsets.x[i] += offsets.speed[i];
      if (offsets.x[i] > 3.0) {
        offsets.x[i] = -3.0;
      }
      const transPos = [offsets.x[i], 0.6, offsets.z[i]];
      const offset = [offsets.s[i], offsets.t[i]];
      render(
          [1.0, 1.0, 1.0], 0, [1, 1, 0], transPos, [textures[0], fBuffer.d], planeData.i.length, pIndex,
          [mMatrix, mvpMatrix, tMatrix, offset, depthCoef, 1, 0, state],
          ['mMatrix', 'mvpMatrix', 'tMatrix', 'offset', 'distLength', 'depthT', 'noiseT', 'softParticle'],
          ['m4', 'm4', 'm4', 'v2', 'f1', 'i1', 'i1', 'i1'], fogPrg);
    }
    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};