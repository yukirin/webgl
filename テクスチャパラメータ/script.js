var gl;
var m = new matIV();
var q = new qtnIV();
var texture = null, texture1 = null;

onload = function () {
	this.setTimeout(renderWebGL, 300);
};

function renderWebGL() {
	var c = document.getElementById('canvas');
	c.width = 1000;
	c.height = 600;

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
		-0.75, -0.75,
		1.75, -0.75,
		-0.75, 1.75,
		1.75, 1.75
	];

	var index = [
		2, 1, 0,
		2, 3, 1
	]

	linkAttribute([position, color, textureCoord], ['position', 'color', 'textureCoord'], [3, 4, 2], prg);
	var ibo = create_ibo(index);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix] = initialMatrix(5);

	m.lookAt([0.0, 2.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
	m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
	m.multiply(pMatrix, vMatrix, tmpMatrix);

	var count = 0;
	var texUnitNum0 = 0;
	var texUnitNum1 = 1;

	create_texture('texture0.png', 0);
	create_texture('texture1.png', 1);

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);

	(function () {
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0);
		count++

		var rad = (count % 360) * Math.PI / 180;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture1);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);

		linkUniform([mvpMatrix, texUnitNum0, texUnitNum1], ['mvpMatrix', 'texture0', 'texture1'], ['m4', 'i1', 'i1'], prg);

		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
		gl.flush();

		setTimeout(arguments.callee, 1000 / 30);
	})();
}