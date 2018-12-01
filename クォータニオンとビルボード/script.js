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

	gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');

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

	var textureCoord = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];

	var index = [
		2, 1, 0,
		2, 3, 1
	]

	linkAttribute([position, color, textureCoord], ['position', 'color', 'textureCoord'], [3, 4, 2], prg);
	var ibo = create_ibo(index);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invMatrix] = initialMatrix(6);

	var camPosition = [0.0, 5.0, 10.0];
	var camUpDirection = [0.0, 1.0, 0.0];

	create_texture('texture0.png', 0);
	create_texture('texture1.png', 1);

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	// gl.enable(gl.CULL_FACE);

	gl.enable(gl.BLEND);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

	(function () {
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0);

		var qMatrix = m.identity(m.create());
		q.toMatIV(qt, qMatrix);

		m.lookAt(camPosition, [0, 0, 0], camUpDirection, vMatrix);
		m.lookAt(camUpDirection, camPosition, [0, 1, 0], invMatrix);
		m.multiply(vMatrix, qMatrix, vMatrix);
		m.multiply(invMatrix, qMatrix, invMatrix);
		m.inverse(invMatrix, invMatrix);

		m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture1);

		m.identity(mMatrix);
		m.rotate(mMatrix, Math.PI / 2, [1, 0, 0], mMatrix);
		m.scale(mMatrix, [3.0, 3.0, 1.0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		linkUniform([mvpMatrix, 1], ['mvpMatrix', 'texture'], ['m4', 'i1'], prg);
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		m.identity(mMatrix);
		m.translate(mMatrix, [0.0, 1.0, 0.0], mMatrix);
		m.multiply(mMatrix, invMatrix, mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		linkUniform([mvpMatrix, 0], ['mvpMatrix', 'texture'], ['m4', 'i1'], prg);
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

		gl.flush();

		setTimeout(arguments.callee, 1000 / 30);
	})();
}
