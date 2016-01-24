PolyContext.prototype.loadbf = function(options) {
    var vector = THREE.OFFLoader.Utils.vector
    var vnegate = THREE.OFFLoader.Utils.vnegate
    var vadd = THREE.OFFLoader.Utils.vadd
    var vadd3 = THREE.OFFLoader.Utils.vadd3
    var vsub = THREE.OFFLoader.Utils.vsub
    var vdiv = THREE.OFFLoader.Utils.vdiv
    var vmul = THREE.OFFLoader.Utils.vmul
    var vdot = THREE.OFFLoader.Utils.vdot
    var vcross = THREE.OFFLoader.Utils.vcross
    var Color = THREE.OFFLoader.Utils.Color;
    if (options.bfheight === undefined) {
        options.bfheight = 0.0;
        options.bfheightinc = 0.02;
    }
    function yrot(p,theta) {
        return vector(Math.cos(theta)*p.x + Math.sin(theta)*p.z,
                      p.y,
                      -Math.sin(theta)*p.x + Math.cos(theta)*p.z)
    }
    function solve(a,b,j,k,r) {
        //console.log("Solve",a,b,j,k,r)
        // Solve v.a = j, v.b = k, |v| = r
        var c = vcross(a,b)
        // Find A,B,C such that v = Aa + Bb + Cc
        // v.a = A*aa + B*ab = j
        // v.b = A*ab + B*bb = k
        // A = (j - B*ab)/aa
        // (j - B*ab)*ab/aa + B*bb = k
        // (j - B*ab)*ab + B*bb*aa = k*aa
        // j*ab - B*ab*ab + B*bb*aa = k*aa
        // B(bb*aa - ab*ab) = k*aa - j*ab 
        // A = (j - B*ab)/aa
        //console.log(c)
        var aa = vdot(a,a)
        var bb = vdot(b,b)
        var cc = vdot(c,c)
        var ab = vdot(a,b)
        //console.log("# Params1:", aa,bb,cc,ab)
        var B = (k*aa-j*ab)/(bb*aa - ab*ab)
        var A = (j - B*ab)/aa
        // v.v = aa + 2ab + bb + cc (since c orthogonal to a and b)
        // C2 = 0 just when |A*a + B*b| = r
        var C2 = (r*r - A*A*aa - 2*A*B*ab - B*B*bb)/cc;
        var v = vadd(vmul(a,A),vmul(b,B));
        //console.log("# Params2:", A,B,C2);
        if (C2 < 0) {
            // Clamp?
            console.log("# impossible length");
            return;
        }
        var C = Math.sqrt(C2);
        var v1 = vadd(vadd(vmul(a,A),vmul(b,B)),vmul(c,C));
        var v2 = vsub(vadd(vmul(a,A),vmul(b,B)),vmul(c,C));
        //console.log("# Result:", v,vdot(v,a),j,vdot(v,b),k,vlength(v),r);
        //console.log("# Result: ",C2)
        return [v1,v2];
    }

    for (var attempt = 0; attempt < 3; attempt++) {
        var h = options.bfheight
        options.bfheight += options.bfheightinc;
        var vertices = []
        var faces = []
        function addvertex(v,color) {
            var i = vertices.length
            vertices.push(v);
            if (color) faces.push({ vlist: [i], color: color })
            return i
        }
        function addface(vlist,color) {
            faces.push({ vlist: vlist, color: color });
        }
        if (Math.abs(h) < 1e-5) h = 1e-5; // A bit of a cop out
        var A = vector(0,h,0)
        var B = vector(2,h,0)
        var j = -2*vdot(A,B)/3
        var k = -4
        var r = 2
        // Need v.A = j, v.B = k, |v| = r
        var s = solve(A,B,j,k,r)
        //console.log(s[0],s[1])
        if (s == undefined) {
            // Reverse direction and carry on
            options.bfheightinc *= -1
            options.bfheight += 2*options.bfheightinc
        } else {
            var C0 = s[0]
            var C1 = s[1]
            var C = C1
            //console.log("# Check 1: " + vdot(B,C))
            //console.log("# Check 2: " + vdot(vadd(B,C), C))
            addvertex(vector(0,0,0),Color.red);
            var v1 = vadd(B,C);
            var v2  = B;
            var v3 = vadd(B,vmul(C,1.5));
            var v4 = vcross(v1,C)
            var k = Math.sqrt(vdot(C,C)*0.75/vdot(v4,v4))
            var v5 = vadd3(B,vmul(C,1.5),vmul(v4,k));
            var v6 = vadd3(B,vmul(C,1.5),vmul(v4,-k));
            var PI = 3.14159
            var upper = []
            var lower = []
            var N = 3
            for (var i = 0; i < N; i++) {
                var rotation = 2*PI*i/N;
                var n1 = addvertex(yrot(v1,rotation),Color.blue)
                var n2 = addvertex(yrot(v2,rotation),Color.red);
                var n3 = addvertex(yrot(v3,rotation),Color.green);
                var n7 = addvertex(yrot(v5,rotation),Color.cyan);
                var n8 = addvertex(yrot(v6,rotation),Color.cyan);
                addface([0,n1],Color.cyan);
                addface([n2,n3],Color.white);
                addface([n2,n7],Color.white);
                addface([n7,n8],Color.white);
                addface([n8,n2],Color.white);
                addface([n2,n7,n8],Color.orange)
                lower.push(n2);
                var n4 = addvertex(yrot(vnegate(v1),rotation),Color.blue)
                var n5 = addvertex(yrot(vnegate(v2),rotation),Color.red);
                var n6 = addvertex(yrot(vnegate(v3),rotation),Color.green);
                var n9 = addvertex(yrot(vnegate(v5),rotation), Color.cyan);
                var n10 = addvertex(yrot(vnegate(v6),rotation),Color.cyan);
                addface([0,n4],Color.cyan);
                addface([n5,n6],Color.white);
                addface([n5,n9],Color.white);
                addface([n9,n10],Color.white);
                addface([n10,n5],Color.white);
                addface([n5,n9,n10],Color.orange)
                upper.push(n5);
            }
            addface(upper,Color.yellow);
            addface(lower,Color.yellow);
            for (var i = 0; i < N; i++) {
                addface([lower[i],lower[(i+1)%N]],Color.white);
                addface([upper[i],upper[(i+1)%N]],Color.white);
            }
            return {vertices: vertices, faces: faces}
        }
    }
    console.log("loadbf failed", options.bfheight, options.bfheightinc)
    return {vertices: [], faces: [] }
}

PolyContext.prototype.theorem = function(options) {
    var vector = THREE.OFFLoader.Utils.vector
    var vadd = THREE.OFFLoader.Utils.vadd
    var vdiv = THREE.OFFLoader.Utils.vdiv
    var Color = THREE.OFFLoader.Utils.Color;
    var cos = Math.cos
    var sin = Math.sin
   
    var vertices = []
    var faces = []
    function addvertex(v,color) {
        var i = vertices.length
        vertices.push(v);
        if (color) faces.push({ vlist: [i], color: color })
        return i
    }
    function addface(vlist,color) {
        faces.push({ vlist: vlist, color: color });
    }
    function bisect(v0,v1,color) {
        return addvertex(vdiv(vadd(vertices[v0],vertices[v1]),2),color)
    }
    if (options.theta === undefined) options.theta = 0
    var theta = options.theta
    options.theta += 0.01
    var pi = 3.14159;
    var A = addvertex(vector(1,-0.5,1), Color.green)
    var B = addvertex(vector(-0.5, 0, -0.5), Color.green)
    var C = addvertex(vector(-1, -0.5, 1), Color.green)
    var D = addvertex(vector(sin(theta),1,-cos(theta)), Color.green)

    var E = bisect(A,C,Color.yellow)
    var F = bisect(C,B,Color.yellow)
    var G = bisect(A,D,Color.yellow)
    var H = bisect(D,B,Color.yellow)
    var I = bisect(G,F,Color.red)

    var edges = [
        [A,B],[B,C],[C,A],[A,D],[B,D],
        [G,H],[H,F],[F,E],[E,G],
        [G,F],[H,E]
    ]
    edges.forEach(function(vlist) { addface(vlist,Color.white); });
    return { vertices: vertices, faces: faces }
}

PolyContext.prototype.zonohedron = function(options) {
    var N = options.n || 3
    var M = options.m || 1
    var k = options.k || 0
    var off = { vertices: [], faces: [] }
    var scale = 1;
    if (options.theta != undefined) scale = Math.sin(options.theta);
    var star = THREE.OFFLoader.makeStar(N,M,scale)
    var newstar = []
    for (var i = 0; i < k; i++) {
        star.forEach(function(v) { v.normalize(); })
        THREE.OFFLoader.starZonohedron(star,null,newstar)
        star = newstar; newstar = []
    }
    THREE.OFFLoader.starZonohedron(star,off)
    return off;
}

// Draw a semi-regular polygon.
// Assumes first 2 edges are typical of all and that the edge centre
// is closest point to origin (both are the case with Wythoff polyhedra). 
// Polygon sides are 2pi*n/m-theta, 2pi*n/m+theta, theta may be
// negative to give a retroflex side which should be drawn as a sort
// of ear shape.
PolyContext.prototype.polygon = function(options) {
    var vector = THREE.OFFLoader.Utils.vector
    var vadd = THREE.OFFLoader.Utils.vadd
    var vsub = THREE.OFFLoader.Utils.vsub
    var vdiv = THREE.OFFLoader.Utils.vdiv
    var vmul = THREE.OFFLoader.Utils.vmul
    var vdot = THREE.OFFLoader.Utils.vdot
    var Color = THREE.OFFLoader.Utils.Color;
    var cos = Math.cos
    var sin = Math.sin
   
    var vertices = []
    var faces = []
    function vertex(i) {
        while (i < 0) i += 2*n
        while (i >= 2*n) i -= 2*n
        return vertices[i]
    }
    function addvertex(v,color) {
        var i = vertices.length
        vertices.push(v);
        if (color) faces.push({ vlist: [i], color: color })
        return i
    }
    function addface(vlist,color) {
        faces.push({ vlist: vlist, color: color });
    }
    if (options.theta === undefined) options.theta = 0
    var theta = options.theta
    var n = options.n || 5
    var m = options.m || 1
    //console.log("polygon",n,m,theta)
    for (var i = 0; i < n; i++) {
        var a = i*Math.PI*2*m/n;
        addvertex(vector(sin(a-theta),cos(a-theta),0),Color.red)
        addvertex(vector(sin(a+theta),cos(a+theta),0),Color.green)
    }
    var origin = addvertex(vector(0,0,0))
    // Compute intersection of adjoining edges
    // If edge side of centre, use that (might be
    // further out from edge or other side of centre,
    // either of which is OK.
    var efacts = [], eindex;
    for (var i = 0; i < 2; i++) {
        var p0 = vertex(i-1) // previous vertex
        var p1 = vertex(i), p2 = vertex(i+1) // Edge vertices
        var c = vdiv(vadd(p1,p2),2) // Edge centre
        var e = vsub(p2,p1) // Edge vector
        var v = vsub(p1,p0) // Previous edge
        var k = -vdot(p0,e)/vdot(v,e) 
        var q = vadd(p0,vmul(v,k)) // Intersection with centre line
        // q = kc => q.c = k*c.c => k = q.c/c.c
        var efact = vdot(q,c)/vdot(c,c)
        efacts.push(efact)
        if (0 < efact && efact < 1) eindex = i; // Need an ear
    }
    // New list of vertices
    var vlist = []
    for (var i = 0; i < 2*n; i++) {
        var p1 = vertex(i)
        var p2 = vertex(i+1)
        var c = vdiv(vadd(p1,p2),2)
        var q = vmul(c,efacts[i%2])
        addvertex(c,Color.blue)
        var qi = addvertex(q,Color.cyan)
        addface([i,(i+1)%(2*n)],Color.yellow)
        if (i%2 == eindex) vlist.push(qi)
    }
    console.assert(vlist.length == 0 || vlist.length == n)
    if (vlist.length > 0) {
        // Draw the ear as a separate triangle
        for (var i = 0; i < n; i++) {
            var p0 = (2*i+eindex)%(2*n)
            var p1 = (2*i+eindex+1)%(2*n)
            var q0 = vlist[i]
            var q1 = vlist[(i+1)%n]
            addface([q0,p0,p1],Color.white)
            addface([origin,q0,q1],Color.white)
        }
    } else {
        // Easy case, draw straight out from centre
        for (var i = 0; i < 2*n; i++) {
            var p0 = i
            var p1 = (i+1)%(2*n)
            addface([origin,p0,p1],Color.white)
        }
    }
    return { vertices: vertices, faces: faces }
}

//eqtest()
// function doit() {
//     vertices.push([0,0,0]);
//     for (var h = -3; h < 3; h += 0.05) {
//         bftest(h)
//     }
//     //bftest(0.0001)
//     console.log("OFF")
//     console.log(vertices.length + " " + edges.length + " " + 0)
//     for (var i = 0; i < vertices.length; i++) {
//         console.log(vertices[i][0] + " " + vertices[i][1] + " " + vertices[i][2])
//     }
//     for (var i = 0; i < edges.length; i++) {
//         console.log(2 + " " + edges[i][0] + " " + edges[i][1]);
//     }
// }

//doit()
