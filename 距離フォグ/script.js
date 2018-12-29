let c, gl;
let then = 0;
let cubeTexture = null;
const m = new matIV();
const q = new qtnIV();
const textures = [];
const cameraQt = q.identity(q.create());

onload = function() {
  const eRange = document.getElementById('range');
  const eRange2 = document.getElementById('range2');
  const eCheck = document.getElementById('checkbox');

  c = document.getElementById('canvas');
  c.width = 1280;
  c.height = 720;
  c.addEventListener('mousemove', mouseMove, true);

  gl = c.getContext('webgl', {stencil: true}) || c.getContext('experimental-webgl', {stencil: true});
  const prg = create_program('vertex.vert', 'x-vertex', 'fragment.frag', 'x-fragment');

  const fBufferSize = 1024;

  const torusData = torus(64, 64, 1.0, 2.0, [1, 1, 1, 1]);
  const trIndex = create_ibo(torusData.i);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix] = initialMatrix(7);
  const lightDirection = [-0.2, 0.0, 0.577];
  const initCamPosition = [0, 1, 4];
  const initCamUpDirection = [0, 1, 0];
  const camPosition = [];
  const camUpDirection = [];
  let count = 0;

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
    const fogStart = eRange.value / 100;
    const fogEnd = eRange2.value / 100;
    const fogColor = [0.75, 0.75, 0.75, 1.0];

    count++;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 1);

    changePrgFramebuffer(prg, null, [c.width, c.height], fogColor);
    setVPMatrix(45, c.width, c.height, 0.1, 30);
    linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
    for (let i = 0; i < 10; i++) {
      const amb = hsva(i * 30, 1, 1, 1);
      const transPos = [0, 0, 10 + Math.floor(i / 5) * -4];
      const qt = q.identity(q.create());
      q.rotate((72.0 * i * Math.PI) / 180, [0, 1, 0], qt);
      q.toVecIII(transPos, qt, transPos);
      transPos[2] += -10;
      render(
          [0.2, 0.2, 0.2], rad, [1, 1, 1], transPos, [], torusData.i.length, trIndex,
          [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, amb, fogStart, fogEnd, fogColor],
          [
            'mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor', 'fogStart', 'fogEnd',
            'fogColor'
          ],
          ['m4', 'm4', 'm4', 'v3', 'v3', 'v4', 'f1', 'f1', 'v4'], prg);
    }

    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};