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
  gl.getExtension('EXT_frag_depth');
  const prg = create_program('lighting.vert', 'x-vertex', 'lighting.frag', 'x-fragment');
  const depthPrg = create_program('depth.vert', 'x-vertex', 'depth.frag', 'x-fragment');
  const filterPrg = create_program('gaussian.vert', 'x-vertex', 'gaussian.frag', 'x-fragment');

  const fBufferSize = 2048;
  const fBuffer = create_framebuffer(fBufferSize, fBufferSize);
  const tmpBuffer = create_framebuffer(fBufferSize, fBufferSize);
  const depthBuffer = create_framebuffer(fBufferSize, fBufferSize, true);
  const depthBuffer2 = create_framebuffer(fBufferSize, fBufferSize, true);
  create_texture('texture.png', 0);

  const torusData = torus(64, 64, 0.25, 0.5);
  const trIndex = create_ibo(torusData.i);
  const spData = sphere(64, 64, 0.5);
  const spIndex = create_ibo(spData.i);
  const pData = plane();
  const pIndex = create_ibo(pData.i);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix] = initialMatrix(8);
  const lightDirection = [0.0, 0.0, -1.0];
  const initCamPosition = [0.0, 0.0, 2.0];
  const initCamUpDirection = [0, 1, 0];
  const camPosition = [];
  const camUpDirection = [];
  const ambientColor = [0.15, 0.15, 0.15, 1.0];
  let count = 0;
  const weight = gaussian_weight(10, 10);

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
  gl.cullFace(gl.BACK);
  gl.enable(gl.CULL_FACE);
  // gl.enable(gl.STENCIL_TEST);
  // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  // gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
  // gl.enable(gl.BLEND);

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
    const alpha = eRange.value * 0.01;

    count++;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 1);

    gl.cullFace(gl.FRONT);
    gl.depthFunc(gl.GEQUAL);
    changePrgFramebuffer(depthPrg, depthBuffer.f, [fBufferSize, fBufferSize], [0.0, 0.0, 0.0, 1.0], 0.0, 0.0);
    setVPMatrix(45, c.width, c.height, 0.1, 5);
    linkAttribute([torusData.p], ['position'], [3], depthPrg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.0, 0.0, -1.0], [textures[0]], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, tMatrix, 0, false], ['mMatrix', 'mvpMatrix', 'tMatrix', 'texture', 'diff'],
        ['m4', 'm4', 'm4', 'i1', 'i1'], depthPrg);

    linkAttribute([spData.p], ['position'], [3], depthPrg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.6, 0.0, 0.0], [textures[0]], spData.i.length, spIndex,
        [mMatrix, mvpMatrix, tMatrix, 0, false], ['mMatrix', 'mvpMatrix', 'tMatrix', 'texture', 'diff'],
        ['m4', 'm4', 'm4', 'i1', 'i1'], depthPrg);

    gl.cullFace(gl.BACK);
    gl.depthFunc(gl.GEQUAL);
    changePrgFramebuffer(depthPrg, depthBuffer2.f, [fBufferSize, fBufferSize], [0.0, 0.0, 0.0, 1.0], 0.0, 0.0);
    setVPMatrix(45, c.width, c.height, 0.1, 5);
    linkAttribute([torusData.p], ['position'], [3], depthPrg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.0, 0.0, -1.0], [depthBuffer.d], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, tMatrix, 0, true], ['mMatrix', 'mvpMatrix', 'tMatrix', 'texture', 'diff'],
        ['m4', 'm4', 'm4', 'i1', 'i1'], depthPrg);

    linkAttribute([spData.p], ['position'], [3], depthPrg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.6, 0.0, 0.0], [depthBuffer.d], spData.i.length, spIndex,
        [mMatrix, mvpMatrix, tMatrix, 0, true], ['mMatrix', 'mvpMatrix', 'tMatrix', 'texture', 'diff'],
        ['m4', 'm4', 'm4', 'i1', 'i1'], depthPrg);

    gl.depthFunc(gl.LEQUAL);
    changePrgFramebuffer(filterPrg, tmpBuffer.f, [fBufferSize, fBufferSize]);
    setVPMatrix(45, c.width, c.height, 0.1, 5, true);
    linkAttribute([pData.p, pData.t], ['position', 'texCoord'], [3, 2], filterPrg);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0.0, 0.0, 0.0], [depthBuffer2.d], pData.i.length, pIndex,
        [mvpMatrix, true, 0, false, weight, fBufferSize],
        ['mvpMatrix', 'gaussian', 'texture', 'horizontal', 'weight', 'fBufferSize'],
        ['m4', 'i1', 'i1', 'i1', 'f1v', 'f1'], filterPrg);

    changePrgFramebuffer(filterPrg, fBuffer.f, [fBufferSize, fBufferSize]);
    setVPMatrix(45, c.width, c.height, 0.1, 5, true);
    linkAttribute([pData.p, pData.t], ['position', 'texCoord'], [3, 2], filterPrg);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0.0, 0.0, 0.0], [tmpBuffer.t], pData.i.length, pIndex,
        [mvpMatrix, true, 0, true, weight, fBufferSize],
        ['mvpMatrix', 'gaussian', 'texture', 'horizontal', 'weight', 'fBufferSize'],
        ['m4', 'i1', 'i1', 'i1', 'f1v', 'f1'], filterPrg);

    changePrgFramebuffer(prg, null, [c.width, c.height]);
    setVPMatrix(45, c.width, c.height, 0.1, 5);
    linkAttribute([torusData.p, torusData.n, torusData.c], ['position', 'normal', 'color'], [3, 3, 4], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.0, 0.0, -1.0], [fBuffer.t], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, tMatrix, lightDirection, camPosition, 0, ambientColor],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'tMatrix', 'lightDirection', 'eyePosition', 'texture', 'ambientColor'],
        ['m4', 'm4', 'm4', 'm4', 'v3', 'v3', 'i1', 'v4'], prg);

    linkAttribute([spData.p, spData.n, spData.c], ['position', 'normal', 'color'], [3, 3, 4], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.6, 0.0, 0.0], [fBuffer.t], spData.i.length, spIndex,
        [mMatrix, mvpMatrix, invTMatrix, tMatrix, lightDirection, camPosition, 0, ambientColor],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'tMatrix', 'lightDirection', 'eyePosition', 'texture', 'ambientColor'],
        ['m4', 'm4', 'm4', 'm4', 'v3', 'v3', 'i1', 'v4'], prg);

    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};