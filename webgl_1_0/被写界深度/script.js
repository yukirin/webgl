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
  const filterPrg = create_program('filter_vertex.vert', 'x-vertex', 'filter_fragment.frag', 'x-fragment');
  const compPrg = create_program('composition.vert', 'x-vertex', 'composition.frag', 'x-fragment');

  const fBufferSize = 1024;
  const fBuffer = create_framebuffer(fBufferSize, fBufferSize, true);
  const sFilterBuffer = create_framebuffer(fBufferSize, fBufferSize);
  const bFilterBuffer = create_framebuffer(fBufferSize, fBufferSize);
  const tmpBuffer = create_framebuffer(fBufferSize, fBufferSize);
  create_texture('texture.png', 0);

  const torusData = torus(64, 64, 1.0, 2.0, [1, 1, 1, 1]);
  const trIndex = create_ibo(torusData.i);
  const cubeData = cube(3.0, [1.0, 1.0, 1.0, 1.0]);
  const cIndex = create_ibo(cubeData.i);
  const planeData = plane();
  const pIndex = create_ibo(planeData.i);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix] = initialMatrix(7);
  const lightDirection = [-0.2, 0.0, 0.577];
  const initCamPosition = [2.5, 0, 4];
  const initCamUpDirection = [0, 1, 0];
  const camPosition = [];
  const camUpDirection = [];
  let count = 0;

  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.DEPTH_TEST);
  gl.frontFace(gl.CCW);
  // gl.enable(gl.CULL_FACE);
  // gl.enable(gl.STENCIL_TEST);
  // gl.enable(gl.BLEND);
  // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

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
    const focusDepth = eRange.value / 100;

    const sWeight = gaussian_weight(10, 15.0);
    const bWeight = gaussian_weight(10, 45.0);
    count++;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 1);

    changePrgFramebuffer(prg, fBuffer.f, [fBufferSize, fBufferSize]);
    setVPMatrix(45, c.width, c.height, 0.1, 150);
    linkAttribute(
        [torusData.p, torusData.c, torusData.n, torusData.t], ['position', 'color', 'normal', 'texCoord'], [3, 4, 3, 2],
        prg);
    for (let i = 0; i < 10; i++) {
      const amb = hsva(i * 30, 1, 1, 1);
      const transPos = [0, 0, -3.5 * i];
      render(
          [0.5, 0.5, 0.5], rad, [1, 1, 1], transPos, [textures[0]], torusData.i.length, trIndex,
          [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, 0, amb],
          ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'texture', 'ambientColor'],
          ['m4', 'm4', 'm4', 'v3', 'v3', 'i1', 'v4'], prg);
    }
    linkAttribute(
        [cubeData.p, cubeData.c, cubeData.n, cubeData.t], ['position', 'color', 'normal', 'texCoord'], [3, 4, 3, 2],
        prg);
    render(
        [2, 2, 200], 0, [1, 1, 1], [0, 0, 0], [textures[0]], cubeData.i.length, cIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, 0, [1.0, 1.0, 1.0, 1.0]],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'texture', 'ambientColor'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'i1', 'v4'], prg);

    changePrgFramebuffer(filterPrg, tmpBuffer.f, [fBufferSize, fBufferSize]);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    linkAttribute([planeData.p, planeData.t], ['position', 'texCoord'], [3, 2], filterPrg);
    render(
        [1, 1, 1], Math.PI / 2, [1, 0, 0], [0, 0, 0], [fBuffer.t], planeData.i.length, pIndex,
        [mvpMatrix, 0, true, false, sWeight, fBufferSize],
        ['mvpMatrix', 'texture', 'gaussian', 'horizontal', 'weight', 'fBufferSize'],
        ['m4', 'i1', 'i1', 'i1', 'f1v', 'f1'], filterPrg);

    changePrgFramebuffer(filterPrg, sFilterBuffer.f, [fBufferSize, fBufferSize]);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    linkAttribute([planeData.p, planeData.t], ['position', 'texCoord'], [3, 2], filterPrg);
    render(
        [1, 1, 1], Math.PI / 2, [1, 0, 0], [0, 0, 0], [tmpBuffer.t], planeData.i.length, pIndex,
        [mvpMatrix, 0, true, true, sWeight, fBufferSize],
        ['mvpMatrix', 'texture', 'gaussian', 'horizontal', 'weight', 'fBufferSize'],
        ['m4', 'i1', 'i1', 'i1', 'f1v', 'f1'], filterPrg);

    changePrgFramebuffer(filterPrg, tmpBuffer.f, [fBufferSize, fBufferSize]);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    linkAttribute([planeData.p, planeData.t], ['position', 'texCoord'], [3, 2], filterPrg);
    render(
        [1, 1, 1], Math.PI / 2, [1, 0, 0], [0, 0, 0], [fBuffer.t], planeData.i.length, pIndex,
        [mvpMatrix, 0, true, false, bWeight, fBufferSize],
        ['mvpMatrix', 'texture', 'gaussian', 'horizontal', 'weight', 'fBufferSize'],
        ['m4', 'i1', 'i1', 'i1', 'f1v', 'f1'], filterPrg);

    changePrgFramebuffer(filterPrg, bFilterBuffer.f, [fBufferSize, fBufferSize]);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    linkAttribute([planeData.p, planeData.t], ['position', 'texCoord'], [3, 2], filterPrg);
    render(
        [1, 1, 1], Math.PI / 2, [1, 0, 0], [0, 0, 0], [tmpBuffer.t], planeData.i.length, pIndex,
        [mvpMatrix, 0, true, true, bWeight, fBufferSize],
        ['mvpMatrix', 'texture', 'gaussian', 'horizontal', 'weight', 'fBufferSize'],
        ['m4', 'i1', 'i1', 'i1', 'f1v', 'f1'], filterPrg);

    changePrgFramebuffer(compPrg, null, [c.width, c.height]);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    linkAttribute([planeData.p, planeData.t], ['position', 'texCoord'], [3, 2], compPrg);
    render(
        [1, 1, 1], Math.PI / 2, [1, 0, 0], [0, 0, 0], [fBuffer.d, fBuffer.t, sFilterBuffer.t, bFilterBuffer.t],
        planeData.i.length, pIndex, [mvpMatrix, 0, 1, 2, 3, 0.1, 150, focusDepth, 0],
        ['mvpMatrix', 'depthT', 'sceneT', 'sBlurT', 'bBlurT', 'zNear', 'zFar', 'focusDepth', 'result'],
        ['m4', 'i1', 'i1', 'i1', 'i1', 'f1', 'f1', 'f1', 'i1'], compPrg);

    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};