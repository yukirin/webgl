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

	var position = [
		-1.0, 1.0, 0.0,
		1.0, 1.0, 0.0,
		-1.0, -1.0, 0.0,
		1.0, -1.0, 0.0
	];

	var color = [
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0
	];

	var textureCoord = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];

	var normal = [
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0
	]
	var index = [
		2, 1, 0,
		2, 3, 1
	]

	linkAttribute([position, color, textureCoord, normal], ['position', 'color', 'textureCoord', 'normal'], [3, 4, 2, 3], prg);
	var ibo = create_ibo(index);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invMatrix] = initialMatrix(6);

	var camPosition = [0.0, 0.0, 10.0];
	var camUpDirection = [0.0, 1.0, 0.0];
	var lightDirection = [1, 1, 1];

	create_texture('texture.png', 0);

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	// gl.enable(gl.CULL_FACE);
	gl.enable(gl.STENCIL_TEST);

	// gl.enable(gl.BLEND);
	// gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

	function render(tr) {
		m.identity(mMatrix);
		m.translate(mMatrix, tr, mMatrix);
		m.scale(mMatrix, [2.0, 2.0, 1.0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);

		linkUniform([mvpMatrix, 0, lightDirection, invMatrix],
			['mvpMatrix', 'texture', 'lightDirection', 'invMatrix'], ['m4', 'i1', 'v3', 'm4'], prg);
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
	}

	(function () {
		clearBuffer([0.0, 0.7, 0.7, 1.0], 1.0, 0);

		var qMatrix = m.identity(m.create());
		q.toMatIV(qt, qMatrix);

		m.lookAt(camPosition, [0, 0, 0], camUpDirection, vMatrix);
		m.multiply(vMatrix, qMatrix, vMatrix);
		m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);
		m.inverse(qMatrix, invMatrix);


		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.stencilFunc(gl.ALWAYS, 1, ~0);
		gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
		render([0, 0, -0.5]);

		gl.stencilFunc(gl.ALWAYS, 0, ~0);
		gl.stencilOp(gl.KEEP, gl.INCR, gl.INCR);
		render([0, 0, 0]);

		gl.stencilFunc(gl.EQUAL, 2, ~0);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
		render([0, 0, 0.5]);

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
