let c, gl, ext;
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
  ext = getExtensions(gl);
  const lightingPrg = create_program('lighting.vert', 'x-vertex', 'lighting.frag', 'x-fragment');
  const outPrg = create_program('out.vert', 'x-vertex', 'out.frag', 'x-fragment');
  const fBufferSize = 1024;

  const fb = create_framebuffer(fBufferSize, fBufferSize, false, false, 4);

  const pData = plane();
  const trData = torus(64, 64, 0.25, 0.5);
  const vaos = {};
  vaos.plane = createVAO([pData.p, pData.t], ['position,3', 'texCoord,2'], [0, 0], pData.i, outPrg);
  vaos.torus = createVAO(
      [trData.p, trData.n, trData.c], ['position,3', 'normal,3', 'color,4'], [0, 0, 0], trData.i, lightingPrg);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix] = initialMatrix(8);
  const lightDirection = [0.0, 5.0, 5.0];
  const initCamPosition = [0.0, 0.0, 4.0];
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
  // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
  // gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
  // gl.enable(gl.BLEND);

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
      ext.ins.drawElementsInstancedANGLE(gl.TRIANGLES, indexSize, gl.UNSIGNED_SHORT, 0, insCount);
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

  function renderFrame(now) {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;
    const state = eCheck.checked;
    const difference = eRange.value / 100;

    count++;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 0.5);

    changePrgFramebuffer(lightingPrg, fb.f, [fBufferSize, fBufferSize], [0.0, 0.0, 0.0, 1.0], 1.0, 0.0, 4);
    ext.vao.bindVertexArrayOES(vaos.torus);
    setVPMatrix(45, c.width, c.height, 0.1, 10);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 1], [-0.5, 0, 0], [], trData.i.length,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, [1.0, 1.0, 1.0, 1.0]],
        ['mMatrix,m4', 'mvpMatrix,m4', 'invTMatrix,m4', 'lightDirection,v3', 'ambient,v4'], lightingPrg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 1], [0.5, 0, -2], [], trData.i.length,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, [1.0, 1.0, 1.0, 1.0]],
        ['mMatrix,m4', 'mvpMatrix,m4', 'invTMatrix,m4', 'lightDirection,v3', 'ambient,v4'], lightingPrg);

    changePrgFramebuffer(outPrg, null, [c.width, c.height]);
    setVPMatrix(45, c.width, c.height, 0.1, 150, true);
    gl.viewport(0, 0, 512, 512);
    ext.vao.bindVertexArrayOES(vaos.plane);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0, 0, 0], [fb.t[0]], pData.i.length, [mvpMatrix, 0],
        ['mvpMatrix,m4', 'texture,i1'], outPrg);
    gl.viewport(0, 512, 512, 512);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0, 0, 0], [fb.t[1]], pData.i.length, [mvpMatrix, 0],
        ['mvpMatrix,m4', 'texture,i1'], outPrg);
    gl.viewport(512, 512, 512, 512);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0, 0, 0], [fb.t[2]], pData.i.length, [mvpMatrix, 0],
        ['mvpMatrix,m4', 'texture,i1'], outPrg);
    gl.viewport(512, 0, 512, 512);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0, 0, 0], [fb.t[3]], pData.i.length, [mvpMatrix, 0],
        ['mvpMatrix,m4', 'texture,i1'], outPrg);

    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};