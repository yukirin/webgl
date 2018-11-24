var gl;
var m = new matIV();
var q = new qtnIV();

onload = function () {
	this.setTimeout(renderWebGL, 500);
}

function renderWebGL() {
	var c = document.getElementById('canvas');
	c.width = 500;
	c.height = 300;

	gl = c.getContext('webgl') || c.getContext('experimental-webgl');

	var v_shader = create_shader('vertex.glsl', 'x-vertex');
	var f_shader = create_shader('fragment.glsl', 'x-fragment');

	var prg = create_program(v_shader, f_shader);
}