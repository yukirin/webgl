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
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0
	];

	var { p: sp_pos, c: sp_color } = sphere(16, 16, 2.0);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invMatrix] = initialMatrix(6);

	var pointSize = 32.0;
	var camPosition = [0.0, 5.0, 10.0];
	var camUpDirection = [0.0, 1.0, 0.0];
	var count = 0;

	create_texture('texture.png', 0);

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);

	gl.enable(gl.BLEND);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

	(function () {
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0);
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

		linkAttribute([sp_pos, sp_color], ['position', 'color'], [3, 4], prg);
		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		linkUniform([mvpMatrix, pointSize, texture, true], ['mvpMatrix', 'pointSize', 'texture', 'useTexture'], ['m4', 'f1', 'i1', 'i1'], prg);
		gl.drawArrays(gl.POINTS, 0, sp_pos.length / 3);


		linkAttribute([position, color], ['position', 'color'], [3, 4], prg);
		m.identity(mMatrix);
		m.rotate(mMatrix, Math.PI / 2, [1, 0, 0], mMatrix);
		m.scale(mMatrix, [3.0, 3.0, 1.0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		linkUniform([mvpMatrix, pointSize, texture, false], ['mvpMatrix', 'pointSize', 'texture', 'useTexture'], ['m4', 'f1', 'i1', 'i1'], prg);
		gl.drawArrays(gl.LINE_LOOP, 0, position.length / 3);

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
