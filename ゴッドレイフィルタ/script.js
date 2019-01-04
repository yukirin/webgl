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
  c.width = 1024;
  c.height = 1024;
  c.addEventListener('mousemove', mouseMove, true);

  gl = c.getContext('webgl', {stencil: true}) || c.getContext('experimental-webgl', {stencil: true});
  getExtensions(gl);
  const prg = create_program('lighting.vert', 'x-vertex', 'lighting.frag', 'x-fragment');
  const filterPrg = create_program('godray.vert', 'x-vertex', 'godray.frag', 'x-fragment');
  const addPrg = create_program('add.vert', 'x-vertex', 'add.frag', 'x-fragment');
  create_texture('texture.png', 0);

  const fBufferSize = 2048;
  const fBuffer = create_framebuffer(fBufferSize, fBufferSize);
  const filterBuffer = create_framebuffer(fBufferSize, fBufferSize);

  const torusData = torus(64, 64, 0.25, 0.5);
  const trIndex = create_ibo(torusData.i);
  const planeData = plane();
  const pIndex = create_ibo(planeData.i);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix] = initialMatrix(8);
  const lightDirection = [1.0, 1.0, 2.0];
  const initCamPosition = [0.0, 0.0, 10.0];
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
    const strength = eRange.value;

    count++;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 1);

    changePrgFramebuffer(addPrg, fBuffer.f, [fBufferSize, fBufferSize], [1.0, 1.0, 1.0, 1.0]);
    gl.depthMask(false);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    linkAttribute([planeData.p, planeData.t], ['position', 'texCoord'], [3, 2], addPrg);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0, 0, 0], [textures[0]], planeData.i.length, pIndex, [mvpMatrix, 0],
        ['mvpMatrix', 'texture'], ['m4', 'i1'], addPrg);

    gl.useProgram(prg);
    gl.depthMask(true);
    setVPMatrix(45, c.width, c.height, 0.1, 150);
    linkAttribute([torusData.p, torusData.n, torusData.c], ['position', 'normal', 'color'], [3, 3, 4], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [-1.0, 0.0, -2.0], [], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, ambientColor, true],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor', 'mask'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4', 'i1'], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [1.0, 0.0, -2.0], [], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, ambientColor, true],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor', 'mask'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4', 'i1'], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.0, -2.0, -2.0], [], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, ambientColor, true],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor', 'mask'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4', 'i1'], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.0, 2.0, -2.0], [], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, ambientColor, true],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor', 'mask'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4', 'i1'], prg);

    changePrgFramebuffer(filterPrg, filterBuffer.f, [fBufferSize, fBufferSize]);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    linkAttribute([planeData.p, planeData.t], ['position', 'texCoord'], [3, 2], filterPrg);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0, 0, 0], [fBuffer.t], planeData.i.length, pIndex,
        [mvpMatrix, 0, strength, [1024.0, 1024.0]], ['mvpMatrix', 'texture', 'strength', 'center'],
        ['m4', 'i1', 'f1', 'v2'], filterPrg);

    changePrgFramebuffer(addPrg, null, [c.width, c.height]);
    gl.depthMask(false);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    linkAttribute([planeData.p, planeData.t], ['position', 'texCoord'], [3, 2], addPrg);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0, 0, 0], [textures[0]], planeData.i.length, pIndex,
        [mvpMatrix, 0, strength], ['mvpMatrix', 'texture'], ['m4', 'i1'], addPrg);

    gl.useProgram(prg);
    gl.depthMask(true);
    setVPMatrix(45, c.width, c.height, 0.1, 150);
    linkAttribute([torusData.p, torusData.n, torusData.c], ['position', 'normal', 'color'], [3, 3, 4], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [-1.0, 0.0, -1.0], [], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, ambientColor, false],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor', 'mask'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4', 'i1'], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [1.0, 0.0, -1.0], [], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, ambientColor, false],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor', 'mask'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4', 'i1'], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.0, -2.0, -1.0], [], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, ambientColor, false],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor', 'mask'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4', 'i1'], prg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 0], [0.0, 2.0, -1.0], [], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, ambientColor, false],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor', 'mask'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4', 'i1'], prg);

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
    gl.useProgram(addPrg);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    linkAttribute([planeData.p, planeData.t], ['position', 'texCoord'], [3, 2], addPrg);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0, 0, 0], [filterBuffer.t], planeData.i.length, pIndex,
        [mvpMatrix, 0], ['mvpMatrix', 'texture'], ['m4', 'i1'], addPrg);

    gl.disable(gl.BLEND);
    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};