var gl;
var c;
var m = new matIV();
var q = new qtnIV();
var qt = q.identity(q.create());
var texture;

onload = function(){
	c = document.getElementById('canvas');
	c.width = 450;
	c.height = 450;
	c.addEventListener('mousemove', mouseMove, true);

    gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	
	var v_shader = create_shader('vertex.glsl', 'x-vertex');
    var f_shader = create_shader('fragment.glsl', 'x-fragment');
  
	var prg = create_program(v_shader, f_shader);
    
    var attLocation = new Array();
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'normal');
    attLocation[2] = gl.getAttribLocation(prg, 'color');
    var attStride = [3, 3, 4];

	var tr = torus(64, 64, 0.5, 1.5);
	var vertex_position = tr.p;
	var vertex_normal = tr.n;
    var vertex_color = tr.c;
	var index = tr.i;
	var tVBOList = [create_vbo(vertex_position), create_vbo(vertex_normal), create_vbo(vertex_color)];
	var tIndex = create_ibo(index);
	
	var uniLocation = new Array();
	uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[1] = gl.getUniformLocation(prg, 'mMatrix');
	uniLocation[2] = gl.getUniformLocation(prg, 'invMatrix');
	uniLocation[3] = gl.getUniformLocation(prg, 'lightPosition');
	uniLocation[4] = gl.getUniformLocation(prg, 'eyeDirection');
	uniLocation[5] = gl.getUniformLocation(prg, 'ambientColor')
	
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
	var mvpMatrix = m.identity(m.create());
	var invMatrix = m.identity(m.create());
	var qMatrix = m.identity(m.create());
	
	var lightPosition = [15.0, 10.0, 15.0];
	var ambientColor = [0.1, 0.1, 0.1, 1.0];

	var count = 0;
	
	var camPosition = [0.0, 0.0, 10.0];
	var camUpDirection = [0.0, 1.0, 0.0];

	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);

	(function(){
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		count++;
		
		var rad = (count % 180) * Math.PI / 90;

		m.lookAt(camPosition, [0, 0, 0], camUpDirection, vMatrix);
    	m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);

		linkAttribute(tVBOList, attLocation, attStride);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndex);

		m.identity(mMatrix);
		m.identity(qMatrix);

		q.toMatIV(qt, qMatrix);

		m.multiply(mMatrix, qMatrix, mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);

		m.inverse(mMatrix, invMatrix);

		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		gl.uniform3fv(uniLocation[3], lightPosition);
		gl.uniform3fv(uniLocation[4], camPosition);
		gl.uniform4fv(uniLocation[5], ambientColor);
		gl.drawElements(gl.TRIANGLES, tr.i.length, gl.UNSIGNED_SHORT, 0);

		gl.flush();
		
		setTimeout(arguments.callee, 1000 / 30);
    })();
}