var gl;
var m = new matIV();

onload = function(){
	var c = document.getElementById('canvas');
	c.width = 500;
	c.height = 300;
	
    gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	
	var v_shader = create_shader('vertex.glsl', 'x-vertex');
    var f_shader = create_shader('fragment.glsl', 'x-fragment');
  
	var prg = create_program(v_shader, f_shader);
    
    var attLocation = new Array(2);
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'color');
    var attStride = [3, 4];

	var vertex_position = [
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		0.0, -1.0, 0.0
    ];

    var vertex_color = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0
    ];

	var index = [
		0, 1, 2,
		1, 2, 3
	];

	var vbo = [create_vbo(vertex_position), create_vbo(vertex_color)];
	var ibo = create_ibo(index)

    linkAttribute(vbo, attLocation, attStride);
	var uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
	
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());
    
    m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);

	var count = 0;
	
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);

	(function(){
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		count++;
		
		var rad = (count % 360) * Math.PI / 180;

		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);

		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
		
		gl.flush();
		
		setTimeout(arguments.callee, 1000 / 30);
    })();
}