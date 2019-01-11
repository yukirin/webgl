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

	c.addEventListener('mousemove', mouseMove, true);

	gl = c.getContext('webgl', { stencil: true }) || c.getContext('experimental-webgl', { stencil: true });
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');

	var torusData = torus(64, 64, 0.25, 1.0);
	var sphereData = sphere(64, 64, 1.0, [1, 1, 1, 1]);
	var tibo = create_ibo(torusData.i);
	var spibo = create_ibo(sphereData.i);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invMatrix] = initialMatrix(6);

	var camPosition = [0.0, 0.0, 10.0];
	var camUpDirection = [0.0, 1.0, 0.0];
	var lightDirection = [1, 1, 1];
	var count = 0;

	create_texture('texture.png', 0);

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	// gl.enable(gl.CULL_FACE);
	gl.enable(gl.STENCIL_TEST);

	// gl.enable(gl.BLEND);
	// gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

	(function () {
		clearBuffer([0.0, 0, 0, 1.0], 1.0, 0);

		count++;
		var rad = (count % 360) * Math.PI / 180;
		var qMatrix = m.identity(m.create());
		q.toMatIV(qt, qMatrix);

		m.lookAt(camPosition, [0, 0, 0], camUpDirection, vMatrix);
		m.multiply(vMatrix, qMatrix, vMatrix);
		m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.enable(gl.STENCIL_TEST);
		gl.colorMask(false, false, false, false);
		gl.depthMask(false);
		gl.stencilFunc(gl.ALWAYS, 1, ~0);
		gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
		linkAttribute([torusData.p, torusData.c, torusData.t, torusData.n],
			['position', 'color', 'textureCoord', 'normal'], [3, 4, 2, 3], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tibo);
		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 1], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		linkUniform([mvpMatrix, false, false, true],
			['mvpMatrix', 'useTexture', 'useLight', 'outLine'], ['m4', 'i1', 'i1', 'i1'], prg);
		gl.drawElements(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0);

		gl.colorMask(true, true, true, true);
		gl.depthMask(true);
		gl.stencilFunc(gl.EQUAL, 0, ~0);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
		linkAttribute([sphereData.p, sphereData.c, sphereData.t, sphereData.n],
			['position', 'color', 'textureCoord', 'normal'], [3, 4, 2, 3], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spibo);
		m.identity(mMatrix);
		m.scale(mMatrix, [50, 50, 50], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		linkUniform([mvpMatrix, true, false, false, 0],
			['mvpMatrix', 'useTexture', 'useLight', 'outLine', 'texture'], ['m4', 'i1', 'i1', 'i1', 'i1'], prg);
		gl.drawElements(gl.TRIANGLES, sphereData.i.length, gl.UNSIGNED_SHORT, 0);

		gl.disable(gl.STENCIL_TEST);
		linkAttribute([torusData.p, torusData.c, torusData.t, torusData.n],
			['position', 'color', 'textureCoord', 'normal'], [3, 4, 2, 3], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tibo);
		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 1], mMatrix);
		m.inverse(mMatrix, invMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		linkUniform([mvpMatrix, false, true, false, lightDirection, invMatrix],
			['mvpMatrix', 'useTexture', 'useLight', 'outLine', 'lightDirection', 'invMatrix'], ['m4', 'i1', 'i1', 'i1', 'v3', 'm4'], prg);
		gl.drawElements(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0);

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
