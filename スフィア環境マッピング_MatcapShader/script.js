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
  c.width = 512;
  c.height = 512;
  c.addEventListener('mousemove', mouseMove, true);

  gl = c.getContext('webgl', {stencil: true}) || c.getContext('experimental-webgl', {stencil: true});
  ext = getExtensions(gl);
  const lightingPrg = create_program('lighting.vert', 'x-vertex', 'lighting.frag', 'x-fragment');
  const fBufferSize = 512;
  create_texture('matcap.jpg', 0);

  const trData = torus(64, 64, 0.3, 1.2);
  const spData = sphere(64, 64, 0.7);
  const vaos = {};
  vaos.torus = createVAO([trData.p, trData.n], ['position,3', 'normal,3'], [0, 0], trData.i, lightingPrg);
  vaos.sphere = createVAO([spData.p, spData.n], ['position,3', 'normal,3'], [0, 0], spData.i, lightingPrg);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, mvInvTMatrix, mvMatrix, mvInvMatrix] =
      initialMatrix(10);
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

    // model-view inverse transpose matrix
    m.multiply(vMatrix, mMatrix, mvMatrix);
    m.inverse(mvMatrix, mvInvMatrix);
    m.transpose(mvInvMatrix, mvInvTMatrix);

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

    changePrgFramebuffer(lightingPrg, null, [c.width, c.height]);
    setVPMatrix(45, c.width, c.height, 0.1, 150);
    ext.vao.bindVertexArrayOES(vaos.torus);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 1], [0, 0, 0], [textures[0]], trData.i.length, [mvpMatrix, mvInvTMatrix, 0],
        ['mvpMatrix,m4', 'mvInvTMatrix,m4', 'texture,i1'], lightingPrg);
    ext.vao.bindVertexArrayOES(vaos.sphere);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 1], [0, 0, 0], [textures[0]], spData.i.length, [mvpMatrix, mvInvTMatrix, 0],
        ['mvpMatrix,m4', 'mvInvTMatrix,m4', 'texture,i1'], lightingPrg);

    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
}