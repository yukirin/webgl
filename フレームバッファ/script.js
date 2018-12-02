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
	c.width = 1000;
	c.height = 600;

	gl = c.getContext('webgl', { stencil: true }) || c.getContext('experimental-webgl', { stencil: true });
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');

	var cubeData = cube(2, [1.0, 1.0, 1.0, 1.0]);
	var cIndex = create_ibo(cubeData.i);
	var earthData = sphere(64, 64, 1, [1, 1, 1, 1]);
	var eIndex = create_ibo(earthData.i);

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

	(function () {
		count++;
		var rad = (count % 360) * Math.PI / 180;
		var rad2 = (count % 720) * Math.PI / 360;

		gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);
		gl.viewport(0, 0, fBufferWidth, fBufferHeight);
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0, 0);

		linkAttribute([earthData.p, earthData.c, earthData.n, earthData.t], ['position', 'color', 'normal', 'textureCoord'], [3, 4, 3, 2], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eIndex);
		lightDirection = [-1.0, 2.0, 1.0];

		m.lookAt([0, 0, 5], [0, 0, 0], camUpDirection, vMatrix);
		m.perspective(45, fBufferWidth / fBufferHeight, 0.1, 100, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);

		gl.bindTexture(gl.TEXTURE_2D, texture1);
		m.identity(mMatrix);
		m.scale(mMatrix, [50, 50, 50], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		linkUniform([mMatrix, mvpMatrix, invMatrix, lightDirection, false, 0],
			['mMatrix', 'mvpMatrix', 'invMatrix', 'lightDirection', 'useLight', 'texture'], ['m4', 'm4', 'm4', 'v3', 'i1', 'i1'], prg);
		gl.drawElements(gl.TRIANGLES, earthData.i.length, gl.UNSIGNED_SHORT, 0);

		gl.bindTexture(gl.TEXTURE_2D, texture);
		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		linkUniform([mMatrix, mvpMatrix, invMatrix, lightDirection, true, 0],
			['mMatrix', 'mvpMatrix', 'invMatrix', 'lightDirection', 'useLight', 'texture'], ['m4', 'm4', 'm4', 'v3', 'i1', 'i1'], prg);
		gl.drawElements(gl.TRIANGLES, earthData.i.length, gl.UNSIGNED_SHORT, 0);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, c.width, c.height);

		clearBuffer([0, 0.7, 0.7, 1], 1.0, 0);
		linkAttribute([cubeData.p, cubeData.c, cubeData.n, cubeData.t], ['position', 'color', 'normal', 'textureCoord'], [3, 4, 3, 2], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cIndex);
		gl.bindTexture(gl.TEXTURE_2D, fBuffer.t);

		lightDirection = [-1.0, 0.0, 0.0];

		m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], camUpDirection, vMatrix);
		m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);

		m.identity(mMatrix);
		m.rotate(mMatrix, rad2, [1, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		linkUniform([mMatrix, mvpMatrix, invMatrix, lightDirection, true, 0],
			['mMatrix', 'mvpMatrix', 'invMatrix', 'lightDirection', 'useLight', 'texture'], ['m4', 'm4', 'm4', 'v3', 'i1', 'i1'], prg);
		gl.drawElements(gl.TRIANGLES, cubeData.i.length, gl.UNSIGNED_SHORT, 0);

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
