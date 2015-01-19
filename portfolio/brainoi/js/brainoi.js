function Block(coordinates, width) {
    this.coordinates = coordinates;
    this.width = width;
    this.being_moved = false;
    this.row = null;
    this.phase = null;
}

Block.prototype.b = function () { 
    return this.coordinates[0];
};

Block.prototype.x = function () { 
    return this.coordinates[1];
};

Block.prototype.y = function () { 
    return this.coordinates[2];
};

Block.prototype.grab = function (x) { 
    this.dx = x - this.x();
    this.being_moved = true;
    this.coordinates_in_movement = this.coordinates.slice(0);
    this.coordinates_in_movement[2]=this.phase.dimensions[1]+1;
}

Block.prototype.move = function (b, x) { 
    var bin_width = this.phase.nth_bin(b).width;
    this.coordinates_in_movement[0] = b;
    this.coordinates_in_movement[1] = Math.min( Math.max(1,x-this.dx), bin_width - this.width + 1);
};

Block.prototype.go_back = function () { 
    this.being_moved = false;
};

Block.prototype.hovering_first_bin = function () { 
    return (this.being_moved && this.coordinates_in_movement[0] == 1);
};

Block.prototype.delete_block = function () { 
    this.row.delete_block(this);
};

Block.prototype.can_land_here = function () { 
    var b = this.coordinates_in_movement[0];
    var x = this.coordinates_in_movement[1];
    var bin = this.phase.nth_bin(b);
    var bin_w = bin.width;
    var bin_h = bin.height;
    var y = null;

    // testing if block collides with bin wall
    if (x + this.width - 1 > bin_w) return false;

    var block_top = this.phase.block_on_top(b,x)

    // testing if block hit the bottom
    var hit_the_bottom = block_top == null // it will be None too if the block is just being landed on the same place again
    if (hit_the_bottom){
        y = 1;
    }
    else{
        // if you are trying to land the block on a block that is on the top of the bin
        if (block_top.y() == bin_h) return false;
        else{ y = block_top.y()+1;}
    }
    // test if block collided with some other block to the right
    var row = bin.nth_row(y);
    var collision = !row.row_free(x, x+this.width-1, this);
    if (collision){
        return false;}
    else if (hit_the_bottom)
        return y;

    // testing if block bellow is bigger
    var bellow_is_bigger = this.width < block_top.width;
    // and if block is completely on top of the one on the bottom
    var completely_on_top = (x + this.width - 1) <= block_top.x() + block_top.width - 1
    if (bellow_is_bigger && completely_on_top)
        return y;
    else
        return false;
};

Block.prototype.release = function () { 
    var landing = this.can_land_here();
    var new_spot = null;
    if (landing){
        this.being_moved = false;
        var new_coord = this.coordinates_in_movement.slice(0);
        new_coord[2] = landing;

        // checking if block is being placed on same place again. In this case it wont count as a move
        var new_spot = (this.coordinates[0] != new_coord[0] || this.coordinates[1] != new_coord[1] || this.coordinates[2] != new_coord[2]);
        if (! new_spot)
            return new_spot;

        this.coordinates = new_coord.slice(0);

        this.row.delete_block(this);

        var new_bin = this.phase.nth_bin(new_coord[0]);
        var new_row = new_bin.nth_row(new_coord[2]);
        this.row = new_row;
        new_row.add_block(this);

        new_spot = true;
    }else
        this.being_moved = false;

    return new_spot;
};



function Bin(width, height) {
    this.width = width;
    this.height = height;
    this.rows = [];
}

Bin.prototype.add_row = function (row) { 
    this.rows.push(row);
};

Bin.prototype.nth_row = function (y) { 
    if (y <= this.height)
        return this.rows[y - 1];
    else
        return null;
};

Bin.prototype.n_blocks = function () { 
    var sum=0;
    for (var i = 0; i < this.rows.length; i++){
        sum += this.rows[i].n_blocks();
    }
    return sum;
};

function Row() {
    this.blocks = [];
}

Row.prototype.n_blocks = function () { 
    return this.blocks.length;
};

Row.prototype.add_block = function (block) { 
    this.blocks.push(block);
};

Row.prototype.delete_block = function (block) { 
    for(var i=0; i < this.blocks.length; i++){
        if (this.blocks[i] == block){
            this.blocks.splice(i,1);
            break;  
        }
    }
};

Row.prototype.block_on_column_x = function (x) { 
    var block = null;
    for(var i=0;i<this.blocks.length;i++){
        var b=this.blocks[i];
        if (b.x() <= x && b.x() + b.width -1 >= x){
            block = b;
            break;}
    }
    return block;
};

// does not consider left block corner collision
Row.prototype.row_free = function (x_from, x_to, block_except) { 
    block_except = typeof block_except !== 'undefined' ? block_except : null;
    var free = true;
    for(var i=0;i<this.blocks.length;i++){
        var block=this.blocks[i];
        if (block == block_except) continue;
        var collision = block.x() > x_from && block.x() <= x_to;
        if (collision){
            free =  false;
            break;
        }
    }
    return free;
};


function Phase(block_coords, dimension, blocks_sizes) {
    block_coords = typeof block_coords !== 'undefined' ? block_coords : null;
    dimensions = typeof dimensions !== 'undefined' ? dimensions : null;
    blocks_sizes = typeof blocks_sizes !== 'undefined' ? blocks_sizes : null;

    this.bins = [];
    this.blocks = [];
    this.n_moves = 0;
    // the final score will be computed once phase is cleared
    this.final_score = -1;
    
    this.dimensions = [3,dimension,dimension]; 
    //[3, dimensions,dimensions] if  isinstance(dimensions,int) else (dimensions if dimensions else [3,3,3]);

    this.init_grid(this.dimensions[0],this.dimensions[1],this.dimensions[2]);
    if (block_coords!=null){
        for(var i = 0;i<block_coords.length;i++){
            var block_coord = block_coords[i];
            var blocks_size = blocks_sizes[i];
            this.add_block(block_coord.slice(0), blocks_size);
        }
    }
    else{
        for(var i=0;i<3;i++)
            this.add_block([1,1,i+1],3-i);
    }
}

Phase.prototype.init_grid = function (n_bins,w,h) { 
    for(var i = 0; i < n_bins; i++){
        var bin = new Bin(w,h);
        for (var j =0; j <h; j++){
            var row = new Row();
            bin.add_row(row);}
        this.add_bin(bin);
    }
};

Phase.prototype.add_block = function (coordinates,width){
    var block = new Block(coordinates,width);
    var b = coordinates[0];
    var x = coordinates[1];
    var y = coordinates[2];
    this.blocks.push(block);
    block.phase = this;
    row = this.nth_bin(b).nth_row(y);
    block.row = row;
    row.add_block(block);
};

Phase.prototype.delete_block = function (block){
    for(var i=0; i < this.blocks.length; i++){
        if (this.blocks[i] == block){
            this.blocks.splice(i,1);
            break;  
        }
    }
    block.delete_block();
};

Phase.prototype.add_bin = function (bin){
    this.bins.push(bin);
};

Phase.prototype.nth_bin = function (n){
    return this.bins[n-1];
};

Phase.prototype.block_on_top = function (b, x){
    var bin = this.nth_bin(b);
    block = null;
    for(var j=bin.rows.length-1;j>=0;j--){
        var row = bin.rows[j];
        var block = row.block_on_column_x(x);
        if (block != null){
            if (block.being_moved){
                block = null;
            }
            else break;
        }
    }
    return block;
};

Phase.prototype.goal_bin = function (){
    return this.bins[this.bins.length-1];
};

Phase.prototype.n_blocks = function (){
    return this.blocks.length;
};

Phase.prototype.move = function (){
    this.n_moves += 1;
};

Phase.prototype.cleared = function (){
    var n_blocks_goal_bin = this.goal_bin().n_blocks();
    return this.n_blocks() == n_blocks_goal_bin;
};



function Brainoi(coordinates, width, height) {
    this.phase_maker = new BrainoiPhaseSequence();
    this.moves_history = [];
    this.moves_history_index = 0;
    this.phase_n = 1;
    var phase_data = this.phase_maker.current_phase();
    this.current_phase = new Phase(phase_data[0],phase_data[1],phase_data[2]);
    this.phase_w = false;
    this.block_grabbed = null;
}

Brainoi.prototype.click = function (b,x) { 
    var block = this.freeBlockAt(b,x);
    if (block != null){
        block.grab(x);
        this.block_grabbed = block;
    }
};

Brainoi.prototype.freeBlockAt = function(b,x){
    var block = this.current_phase.block_on_top(b,x);
    if (block != null){
        var can_grab = false;
        var y = block.y();
        var bin = this.current_phase.nth_bin(b);

        if (block.y() == bin.height)
            can_grab = true;
        else{
        //check if block has no block on top of itself
            var row_on_top = bin.nth_row(y+1);
            var block_on_the_left = row_on_top.block_on_column_x(block.x());
            var free_on_right = row_on_top.row_free(block.x(),block.x()+block.width-1);
            if (block_on_the_left == null && free_on_right)
                can_grab = true;
        }
        if (can_grab){
            return block;}
    }
    return null;
}

Brainoi.prototype.move = function (b,x){
    if (this.block_grabbed != null)
        this.block_grabbed.move(b,x);
};

Brainoi.prototype.release = function (add_to_history){
    add_to_history = typeof add_to_history !== 'undefined' ? add_to_history : true;
    if (this.block_grabbed != null){
        // var move = (tuple(this.block_grabbed.coordinates[:2]),tuple(this.block_grabbed.coordinates_in_movement));
        var new_spot = this.block_grabbed.release();
        this.block_grabbed = null;
        if (new_spot){
            this.current_phase.move();
            // if (add_to_history)
                // this.add_move_to_history(move);
        }
    }
};

Brainoi.prototype.phase_won = function (){
    if (!this.phase_w)
        this.phase_w = this.current_phase.cleared();
    return this.phase_w;
};

Brainoi.prototype.next_phase = function (){
    this.phase_n += 1;
    if (this.phase_maker){
        var phase_data = this.phase_maker.next_phase();
        if (phase_data == null) return null;
        this.current_phase = new Phase(phase_data[0],phase_data[1],phase_data[2]);
    }
    this.phase_w = false;
    // this.reset_moves_history();
};

function BrainoiPhaseSequence() {
    this.current_phase_number = 0;
    this.phases = [
        [[[1, 1, 1], [1, 1, 2], [1, 1, 3]], 3, [3, 2, 1]],
        [[[1,1,1],[1,1,2],[1,5,2],[1,1,3]],5,[5,4,1,3]],
        [[[2, 1, 1], [1, 1, 1], [3, 1, 1], [2, 1, 2]], 5, [5, 4, 1, 3]],
        [[[1, 1, 1], [1, 1, 2], [1, 5, 2], [1, 1, 3], [1, 1, 4]], 5, [5, 4, 1, 3, 2]],
        [[[1, 1, 1], [1, 1, 2], [1, 4, 2], [1, 1, 3], [1, 2, 3], [1, 4, 3], [1, 5, 3]], 5, [5, 3, 2, 1, 2, 1, 1]]
    ]
}

BrainoiPhaseSequence.prototype.current_phase = function () { 
    return this.phases[this.current_phase_number];
};

BrainoiPhaseSequence.prototype.next_phase = function () { 
    if (this.current_phase_number < this.phases.length - 1){
        this.current_phase_number++;
        return this.current_phase();
    }
    else return null;    
};

var b = new Brainoi();
b.click(1,1);
b.move(2,1);
b.release();
