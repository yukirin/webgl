var c;
var gl;
var m = new matIV();
var q = new qtnIV();
var texture = null, texture1 = null;
var qt = q.identity(q.create());

onload = function () {
	this.setTimeout(renderWebGL, 300);
};

function renderWebGL() {
	c = document.getElementById('canvas');
	c.width = 512;
	c.height = 512;

	gl = c.getContext('webgl', { stencil: true }) || c.getContext('experimental-webgl', { stencil: true });
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');
	var bPrg = create_program('blur_vertex.glsl', 'x-vertex', 'blur_fragment.glsl', 'x-fragment');

	var earthData = sphere(64, 64, 1, [1, 1, 1, 1]);
	var eIndex = create_ibo(earthData.i);
	var position = [
		-1.0, 1.0, 0.0,
		1.0, 1.0, 0.0,
		-1.0, -1.0, 0.0,
		1.0, -1.0, 0.0
	];

	var color = [
		1.0, 1.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0
	];

	var index = [
		0, 1, 2,
		3, 2, 1
	];
	var vIndex = create_ibo(index);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invMatrix] = initialMatrix(6);
	var camPosition = [0.0, 0.0, 10.0];
	var camUpDirection = [0.0, 1.0, 0.0];
	var lightDirection = [1, 1, 1];
	var count = 0;

	create_texture('texture0.png', 0);
	create_texture('texture1.png', 1);
	gl.activeTexture(gl.TEXTURE0);

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	// gl.enable(gl.CULL_FACE);
	// gl.enable(gl.STENCIL_TEST);
	// gl.enable(gl.BLEND);
	// gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

	var fBufferWidth = 512;
	var fBufferHeight = 512;
	var fBuffer = create_framebuffer(fBufferWidth, fBufferHeight);

	function render(scale, rad, axis, translate, texture, indexSize, linkValues, linkNames, linkTypes, prg) {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		m.identity(mMatrix);
		m.translate(mMatrix, translate, mMatrix);
		m.rotate(mMatrix, rad, axis, mMatrix);
		m.scale(mMatrix, scale, mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		linkUniform(linkValues, linkNames, linkTypes, prg);
		gl.drawElements(gl.TRIANGLES, indexSize, gl.UNSIGNED_SHORT, 0);
	}

	function setVPMatrix(camPosition, center, camUpDirection, fovy, width, height, near, far, isOrtho = false) {
		m.lookAt(camPosition, center, camUpDirection, vMatrix);
		if (isOrtho) {
			m.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 100, pMatrix);
		} else {
			m.perspective(fovy, width / height, near, far, pMatrix);
		}
		m.multiply(pMatrix, vMatrix, tmpMatrix);
	}

	(function () {
		count++;
		var rad = (count % 360) * Math.PI / 180;
		var rad2 = (count % 720) * Math.PI / 360;

		gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);
		gl.viewport(0, 0, fBufferWidth, fBufferHeight);
		gl.useProgram(prg);
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0, 0);

		lightDirection = [-1.0, 2.0, 1.0];
		linkAttribute([earthData.p, earthData.c, earthData.n, earthData.t], ['position', 'color', 'normal', 'textureCoord'], [3, 4, 3, 2], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eIndex);
		setVPMatrix([0, 0, 5], [0, 0, 0], [0, 1, 0], 45, fBufferWidth, fBufferHeight, 0.1, 100);
		render([50, 50, 50], 0, [0, 1, 0], [0, 0, 0], texture1, earthData.i.length, [mMatrix, mvpMatrix, invMatrix, lightDirection, false, 0],
			['mMatrix', 'mvpMatrix', 'invMatrix', 'lightDirection', 'useLight', 'texture'], ['m4', 'm4', 'm4', 'v3', 'i1', 'i1'], prg);

		render([1, 1, 1], rad, [0, 1, 0], [0, 0, 0], texture, earthData.i.length, [mMatrix, mvpMatrix, invMatrix, lightDirection, true, 0],
			['mMatrix', 'mvpMatrix', 'invMatrix', 'lightDirection', 'useLight', 'texture'], ['m4', 'm4', 'm4', 'v3', 'i1', 'i1'], prg);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, c.width, c.height);
		gl.useProgram(bPrg);
		clearBuffer([0.0, 0.7, 0.7, 1], 1.0, 0);

		linkAttribute([position, color], ['position', 'color'], [3, 4], bPrg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);
		setVPMatrix([0, 0, 5], [0, 0, 0], [0, 1, 0], 45, c.width, c.height, 0.1, 100, true);
		render([1, 1, 1], 0, [1, 1, 0], [0, 0, 0], fBuffer.t, index.length, [mvpMatrix, true, 0],
			['mvpMatrix', 'useBlur', 'texture'], ['m4', 'i1', 'i1'], bPrg);

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
