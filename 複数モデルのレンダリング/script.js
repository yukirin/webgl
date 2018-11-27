var gl;
var m = new matIV();
var q = new qtnIV();

onload = function () {
	this.setTimeout(renderWebGL, 300);
};

function renderWebGL() {
	var c = document.getElementById('canvas');
	c.width = 300;
	c.height = 300;

	gl = c.getContext('webgl') || c.getContext('experimental-webgl');

	clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0);

	var v_shader = create_shader('vertex.glsl', 'x-vertex');
	var f_shader = create_shader('fragment.glsl', 'x-fragment');
	var prg = create_program(v_shader, f_shader);

	var attLocation = new Array(2);
	attLocation[0] = gl.getAttribLocation(prg, 'position');
	attLocation[1] = gl.getAttribLocation(prg, 'color');

	var attStride = new Array(2);
	attStride[0] = 3;
	attStride[1] = 4;

	var vertex_position = [
		0.0, 1.0, 0.0,
		1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0
	];

	var vertex_color = [
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0
	]

	var pos_vbo = create_vbo(vertex_position);
	var color_vbo = create_vbo(vertex_color);

	linkAttribute([pos_vbo, color_vbo], attLocation, attStride);

	var uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');
	var mMatrix = m.identity(m.create());
	var vMatrix = m.identity(m.create());
	var pMatrix = m.identity(m.create());
	var tmpMatrix = m.identity(m.create());
	var mvpMatrix = m.identity(m.create());

	m.lookAt([0.0, 0.0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix);
	m.perspective(90, c.width / c.height, 0.1, 100, pMatrix);
	m.multiply(pMatrix, vMatrix, tmpMatrix);

	m.translate(mMatrix, [1.5, 0.0, 0.0], mMatrix);
	m.multiply(tmpMatrix, mMatrix, mvpMatrix);

	gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
	gl.drawArrays(gl.TRIANGLES, 0, 3);

	m.identity(mMatrix);
	m.translate(mMatrix, [-1.5, 0.0, 0.0], mMatrix);
	m.multiply(tmpMatrix, mMatrix, mvpMatrix);

	gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
	gl.drawArrays(gl.TRIANGLES, 0, 3);

	gl.flush();
}