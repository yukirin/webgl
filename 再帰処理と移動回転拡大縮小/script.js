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

	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');

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

	linkAttribute([vertex_position, vertex_color], ['position', 'color'], [3, 4], prg);

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