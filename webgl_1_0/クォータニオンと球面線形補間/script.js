var gl;
var m = new matIV();
var q = new qtnIV();

onload = function () {
	this.setTimeout(renderWebGL, 300);
};

function renderWebGL() {
	var c = document.getElementById('canvas');
	c.width = 1000;
	c.height = 600;

	gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');

	var { p: v_pos, n: v_normal, c: v_color, i: index } = torus(64, 64, 0.5, 1.5);

	var t_vbos = [create_vbo(v_pos), create_vbo(v_normal), create_vbo(v_color)];
	var ibo = create_ibo(index);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invMatrix] = initialMatrix(6);
	var qMatrix = m.identity(m.create());

	var eyeDirection = [0.0, 0.0, 20.0];
	var lightPosition = [15.0, 10.0, 15.0];
	var ambientColor = [0.1, 0.1, 0.1, 1.0];
	var count = 0;
	var time = 0.5;

	var camPosition = [0.0, 0.0, 20.0];
	var camUpDirection = [0.0, 1.0, 0.0];

	var aQtn = q.identity(q.create());
	var bQtn = q.identity(q.create());
	var sQtn = q.identity(q.create());


	m.lookAt(camPosition, [0, 0, 0], camUpDirection, vMatrix);
	m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
	m.multiply(pMatrix, vMatrix, tmpMatrix);

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);

	function draw(qtn) {
		q.toMatIV(qtn, qMatrix);
		m.identity(mMatrix);
		m.multiply(mMatrix, qMatrix, mMatrix);
		m.translate(mMatrix, [0.0, 0.0, -5.0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);

		linkUniform([mvpMatrix, invMatrix, lightPosition, ambientColor, eyeDirection, mMatrix],
			['mvpMatrix', 'invMatrix', 'lightPosition', 'ambientColor', 'eyeDirection', 'mMatrix'],
			['m4', 'm4', 'v3', 'v4', 'v3', 'm4'], prg);
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
	}

	(function () {
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0);
		count++

		var rad = (count % 180) * Math.PI / 90;

		q.rotate(rad, [1.0, 0.0, 0.0], aQtn);
		q.rotate(rad, [0.0, 1.0, 0.0], bQtn);
		q.slerp(aQtn, bQtn, time, sQtn);

		setAttribute(t_vbos, ['position', 'normal', 'color'], [3, 3, 4], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

		ambientColor = [0.5, 0.0, 0.0, 1.0];
		draw(aQtn);
		ambientColor = [0.0, 0.5, 0.0, 1.0];
		draw(bQtn);
		ambientColor = [0.0, 0.0, 0.5, 1.0];
		draw(sQtn);

		gl.flush();

		setTimeout(arguments.callee, 1000 / 30);
	})();
}