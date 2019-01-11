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

  const shadowMapSize = 1024;
  const fBuffer = create_framebuffer(shadowMapSize, shadowMapSize, []);
  create_texture('texture01.jpg', 0);
  create_texture('texture02.jpg', 1);

  const torusData = torus(64, 64, 1.0, 2.0, [1, 1, 1, 1]);
  const trIndex = create_ibo(torusData.i);
  const planeData = plane([0.9, 0.9, 0.9, 1.0]);
  const pIndex = create_ibo(planeData.i);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix] = initialMatrix(7);
  const lightDirection = [0.0, 30.0, 0.0];
  const initCamPosition = [0, 70, 0];
  const initCamUpDirection = [0, 0, -1];
  const camPosition = [];
  const camUpDirection = [];
  let count = 0;
  const hCoef = [1.0, 0.0, -1.0, 2.0, 0.0, -2.0, 1.0, 0.0, -1.0];
  const vCoef = [1.0, 2.0, 1.0, 0.0, 0.0, 0.0, -1.0, -2.0, -1.0];

  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.DEPTH_TEST);
  gl.frontFace(gl.CCW);
  gl.enable(gl.CULL_FACE);
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
    const r = (eRange.value - 50) / 50;

    count++;
    const rad = (count % 360) * Math.PI / 180;
    const hsv = hsva((count / 2) % 360, 1, 1, 1);

    gl.useProgram(prg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);
    gl.viewport(0.0, 0.0, shadowMapSize, shadowMapSize);
    clearBuffer(hsv, 1.0, 0);
    setVPMatrix(45, c.width, c.height, 0.1, 150);
    linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
    for (let i = 0; i < 10; i++) {
      const amb = hsva(i * 30, 1, 1, 1);
      const transPos = [0, 0, 10 + Math.floor(i / 5) * -4];
      const qt = q.identity(q.create());
      q.rotate((72.0 * i * Math.PI) / 180, [0, 1, 0], qt);
      q.toVecIII(transPos, qt, transPos);
      transPos[1] += (3 * Math.floor(i / 5) + 5);
      render(
          [1, 1, 1], rad, [1, 1, 1], transPos, [], torusData.i.length, trIndex,
          [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, amb],
          ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor'],
          ['m4', 'm4', 'm4', 'v3', 'v3', 'v4'], prg);
    }

    gl.useProgram(filterPrg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0.0, 0.0, c.width, c.height);
    clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0, 0);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    linkAttribute([planeData.p, planeData.t], ['position', 'texCoord'], [3, 2], filterPrg);
    render(
        [1, 1, 1], Math.PI / 2, [1, 0, 0], [0, 0, 0], [textures[1]], planeData.i.length, pIndex,
        [mvpMatrix, 0, state, true, hCoef, vCoef], ['mvpMatrix', 'texture', 'sobel', 'sobelGray', 'hCoef', 'vCoef'],
        ['m4', 'i1', 'i1', 'i1', 'f1v', 'f1v'], filterPrg);

    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};
