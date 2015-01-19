// http://mathjs.org/docs/datatypes/matrices.html
function ThreeDScene(num_particles) {
	this.num_particles = num_particles;
	this.X = math.zeros(num_particles, 3);
	this.V = math.zeros(num_particles, 3);
	this.M = new Array(num_particles);
	this.edges = new Array(0);
	this.edges_radii = new Array(0);
	this.radii = new Array(num_particles);
	this.isFixed = new Array(num_particles);
	this.forces = new Array(0);
}

ThreeDScene.prototype.setPosition = function (particle_i, pos) { 
	this.X.subset(math.index(particle_i, [0, 3]), pos);
};

ThreeDScene.prototype.getPosition = function (particle_i) { 
	return this.X.subset(math.index(particle_i, [0, 3])).toArray()[0];
}

ThreeDScene.prototype.setVelocity = function (particle_i, vel) { 
	this.V.subset(math.index(particle_i, [0, 3]), vel);
};

ThreeDScene.prototype.getVelocity = function (particle_i) { 
	return this.V.subset(math.index(particle_i, [0, 3])).toArray()[0];
};

ThreeDScene.prototype.setM = function (particle_i, m) { 
	this.M[particle_i] = m;
};

ThreeDScene.prototype.getM = function (particle_i) { 
	return this.M[particle_i];
};

ThreeDScene.prototype.insertForce = function (newForce) { 
	this.forces.push(newForce);
};

ThreeDScene.prototype.insertEdge = function (edge, radius) { 
	this.edges.push(edge);
	this.edges_radii.push(radius);
};

ThreeDScene.prototype.accumulateGradU = function (F) { 
  	for(var i = 0; i < this.forces.length ; i++ ) 
  		F = this.forces[i].addGradEToTotal( this.X, this.V, this.M, F , this.radii);
  	return F;
};

//http://code.stephenmorley.org/javascript/queues/
function ParticlePath( particle_i, max_list_size, color ) {
	this.particle_i = particle_i;
	this.max_list_size = max_list_size;
	this.color = color;
	this.path = new Queue();
}
ParticlePath.prototype.addToPath = function( newpoint )
{
  if( this.max_list_size <= 0 ) return;
  if( this.path.getLength() >= this.max_list_size ) this.path.dequeue();
  this.path.enqueue(newpoint);
}
ParticlePath.prototype.getPoint = function( point_i )
{
	return this.path.getElement(point_i);
}

function Force() {
}

function SimpleGravityForce(gravity) {
	Force.call();
	this.gravity = gravity;
}
SimpleGravityForce.prototype = new Force();
SimpleGravityForce.prototype.constructor = SimpleGravityForce;

SimpleGravityForce.prototype.addGradEToTotal = function(x,v,m,gradE){
  for(var i = 0; i < x.size()[0]; i++ ) {
  	var grad_e = math.multiply(this.gravity, -m[i]);
	grad_e = math.add(math.squeeze(gradE.subset(math.index(i, [0, 3]))), grad_e);
	gradE.subset(math.index(i, [0, 3]), grad_e)
	}
  return gradE; 
}

function GravitationalForce(particle1, particle2, G) {
	Force.call();
	this.particle1 = particle1;
	this.particle2 = particle2;
	this.G = G;
}
GravitationalForce.prototype = new Force();
GravitationalForce.prototype.constructor = GravitationalForce;

GravitationalForce.prototype.addGradEToTotal = function(x,v,m,gradE){
	var m1 = m[this.particle1];
	var m2 = m[this.particle2];
	var x1=x.subset(math.index(this.particle1, [0, 3]));
	var x2=x.subset(math.index(this.particle2, [0, 3]));
	var nhat = math.subtract(x2,x1);
	var r = math.norm(nhat,"fro");
	nhat = math.divide(nhat, r);
	nhat = math.multiply(nhat, this.G*m1*m2/(r*r));

	var a = math.subtract(gradE.subset(math.index(this.particle1, [0, 3])), nhat);
	var b = math.add(gradE.subset(math.index(this.particle2, [0, 3])), nhat);
	gradE.subset(math.index(this.particle1, [0, 3]), a);
	gradE.subset(math.index(this.particle2, [0, 3]), b);
	return gradE;
}


function SpringForce(endpoints, k, l0, b) {
	Force.call();
	this.endpoints = endpoints;
	this.k = k;
	this.l0 = l0;
	this.b = b;
	this.isBungee = false;
}
SpringForce.prototype = new Force();
SpringForce.prototype.constructor = SpringForce;

SpringForce.prototype.addGradEToTotal = function(x,v,m,gradE){
  	// Compute the elastic component
  	var particle1 = this.endpoints[0];
  	var particle2 = this.endpoints[1];
	var x1=x.subset(math.index(particle1, [0, 3]));
	var x2=x.subset(math.index(particle2, [0, 3]));
	var v1=v.subset(math.index(particle1, [0, 3]));
	var v2=v.subset(math.index(particle2, [0, 3]));
	var nhat = math.subtract(x2,x1);
	var l = math.norm(nhat,"fro");
	//assert( l != 0.0 ); 
	nhat = math.divide(nhat, l);

 	if (this.isBungee && l < this.l0) return gradE;

  	var fdamp = nhat;
	nhat = math.multiply(nhat, this.k*(l-this.l0));

	var a = math.subtract(gradE.subset(math.index(particle1, [0, 3])), nhat);
	var b = math.add(gradE.subset(math.index(particle2, [0, 3])), nhat);
	gradE.subset(math.index(particle1, [0, 3]), a);
	gradE.subset(math.index(particle2, [0, 3]), b);

  	// Compute the internal damping
  	// Remember we are computing minus the force here
	a = this.b*math.dot(math.subtract(v2,v1).toArray()[0],fdamp.toArray()[0]);
	fdamp = math.multiply(fdamp, a);

	a = math.subtract(gradE.subset(math.index(particle1, [0, 3])), fdamp);
	b = math.add(gradE.subset(math.index(particle2, [0, 3])), fdamp);
	gradE.subset(math.index(particle1, [0, 3]), a);
	gradE.subset(math.index(particle2, [0, 3]), b);
	return gradE;
}

//For surface defined by normal n (pointing inwards of liquid) and point p
function BuoyancyForce(particle_i, n, p, density) {
	Force.call();
	this.particle_i = particle_i;
	this.n = n;
	this.p = p;
	this.density = density;
}
BuoyancyForce.prototype = new Force();
BuoyancyForce.prototype.constructor = BuoyancyForce;
BuoyancyForce.prototype.addGradEToTotal = function(x, v, m, gradE, radii){
  	// Compute the elastic component
	// gradE.subset(math.index(this.particle_i, [0, 3]), [0,0,0]);
	// return gradE;

	var x1=x.subset(math.index(this.particle_i, [0, 3]));
	var v1=v.subset(math.index(this.particle_i, [0, 3]));

	var radius = radii[this.particle_i];
	var volume = (radius*2)*(radius*2);
	var d = math.subtract(x1.toArray()[0], this.p);
	d = math.dot(d, this.n);
	
	a = math.dot(v1.toArray()[0],this.n);
	
	if (d <= -radius) return gradE;

	if (d >= radius){
		var magnitude = this.density*volume;
	} else{
		magnitude=0;
		var magnitude = this.density*volume*(d+radius)/(2*radius);
	}

	B=1;
	if(a < 0) B=0.8;
	var buoyancy = math.multiply(this.n, B*magnitude);

	a = math.add(gradE.subset(math.index(this.particle_i, [0, 3])).toArray()[0], buoyancy);
	gradE.subset(math.index(this.particle_i, [0, 3]), a);

	return gradE;
}


//For surface defined by normal n (pointing inwards of liquid) and point p
function RadialBuoyancyForce(particle_i, particle_planet_i, density) {
	Force.call();
	this.particle_i = particle_i;
	this.particle_planet_i = particle_planet_i;
	this.density = density;
}
RadialBuoyancyForce.prototype = new Force();
RadialBuoyancyForce.prototype.constructor = RadialBuoyancyForce;
RadialBuoyancyForce.prototype.addGradEToTotal = function(x, v, m, gradE, radii){
  	// Compute the elastic component
	// gradE.subset(math.index(this.particle_i, [0, 3]), [0,0,0]);
	// return gradE;

	var x1=x.subset(math.index(this.particle_i, [0, 3]));
	var v1=v.subset(math.index(this.particle_i, [0, 3]));

	var x2=x.subset(math.index(this.particle_planet_i, [0, 3]));
	var v2=v.subset(math.index(this.particle_planet_i, [0, 3]));

	var radius1 = radii[this.particle_i];
	var radius2 = radii[this.particle_planet_i];
	var volume = (radius1*2)*(radius1*2);

	var n = math.subtract(x2,x1);
	var l = math.norm(n,"fro");
	var d = radius2-l;
	a = math.dot(v1.toArray()[0], n.toArray()[0]);
	
	if (d <= -radius1) return gradE;

	if (d >= radius1){
		var magnitude = this.density*volume;
	} else{
		magnitude=0;
		var magnitude = this.density*volume*(d+radius1)/(2*radius1);
	}

	B=1;
	if(a < 0) B=0.8;
	var buoyancy = math.multiply(n, B*magnitude);

	a = math.add(gradE.subset(math.index(this.particle_i, [0, 3])).toArray()[0], buoyancy.toArray()[0]);
	gradE.subset(math.index(this.particle_i, [0, 3]), a);

	return gradE;
}

function SceneStepper() {
}

function ExplicitEuler() {
}
ExplicitEuler.prototype = new SceneStepper();
ExplicitEuler.prototype.constructor = ExplicitEuler;
ExplicitEuler.prototype.stepScene = function( scene, dt ){
	var x = scene.X;
	var v = scene.V;
	var m = scene.M;

	var F = math.zeros(scene.num_particles, 3);
	F = scene.accumulateGradU(F);
	F = math.multiply(F,-1);
	for (i = 0; i < scene.num_particles; i++){
		if (scene.isFixed[i]) F.subset(math.index(i,[0,3]),[0,0,0]);
		else {
			var f = math.divide(F.subset(math.index(i,[0,3])), m[i]);
			F.subset(math.index(i,[0,3]), f);
		}
	}
	var dx = math.multiply(v,dt);
	var dv = math.multiply(F,dt);
	scene.X =math.add(scene.X, dx);
	scene.V =math.add(scene.V, dv);

	return scene;
}

function SymplecticEuler() {
}
SymplecticEuler.prototype = new SceneStepper();
SymplecticEuler.prototype.constructor = SymplecticEuler;
SymplecticEuler.prototype.stepScene = function( scene, dt ){
	var x = scene.X;
	var v = scene.V;
	var m = scene.M;

	var F = math.zeros(scene.num_particles, 3);
	F = scene.accumulateGradU(F);
	F = math.multiply(F,-1);
	for (i = 0; i < scene.num_particles; i++){
		if (scene.isFixed[i]) F.subset(math.index(i,[0,3]),[0,0,0]);
		else {
			var f = math.divide(F.subset(math.index(i,[0,3])), m[i]);
			F.subset(math.index(i,[0,3]), f);
		}
	}

	var dv = math.multiply(F,dt);
	scene.V =math.add(scene.V, dv);
	v = scene.V;
	var dx = math.multiply(v,dt);
	scene.X =math.add(scene.X, dx);

	return scene;
}