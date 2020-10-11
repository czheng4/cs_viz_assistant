
class Dnode {
	constructor(v) {
		this.value = v;
		this.flink = null;
		this.blink = null;
	}
} 

class Dlist {
	constructor() {
		this.size = 0;
		this.sentinel = new Dnode(0);
		this.sentinel.flink = this.sentinel;
		this.sentinel.blink = this.sentinel;
		this.ms = new memorySimulator();
		
	}
	
	insert_before_node(v, node) {
		let prev_node, new_node;
		new_node = new Dnode(v);
		this.ms.get_reference(new_node);

		prev_node = node.blink;

		prev_node.flink = new_node;
		new_node.blink = prev_node;

		new_node.flink = node;
		node.blink = new_node;

		this.size++;
		return new_node;
	}

	insert_after_node(v, node) {
		return this.insert_before_node(v, node.flink);
	}

	push_back(v) {
		return this.insert_before_node(v, this.sentinel);
	}

	push_front(v) {
		return this.insert_before_node(v, this.sentinel.flink);
	}



	erase(node) {
		let prev_node, next_node;
		prev_node = node.blink;
		next_node = node.flink;

		prev_node.flink = next_node;
		next_node.blink = prev_node;
		this.size--;
	}

	pop_back() {
		let rv = this.sentinel.blink.value;
		this.erase(this.sentinel.blink);
		return rv;
	}
	pop_front() {
		let rv = this.sentinel.flink.value;
		this.erase(this.sentinel.flink);
		return rv;
	}

	print() {
		let node = this.sentinel.flink;
		while (node != this.sentinel) {
			console.log(node.value, this.ms.get_reference(node));
			node = node.flink;
		}
	}
}




function update_rect_text(dict) {
  let rect = dict.rect,
      index = dict.index,
      text = dict.text;
  rect.text[index] = text;
}

function rm_ani_object(dict) {
  let ref = dict.ref,
      ani = dict.ani;

  dict.ani.remove_object(ref);
}


function get_curve_by_height(ani, ref1, ref2, dy) {
  let i, q_curves;
  q_curves = ani.get_connection(ref1, ref2);

  for (i = 0; i < q_curves.length; i++) {
    if (Math.abs(q_curves[i].p1.y - q_curves[i].p1.obj.y - dy) < 0.001 ) return q_curves[i];
  }
  return null;
}

const sentinel_flink_to_first_h = 0.2;
const first_blink_to_sentinel_h = -0.8;
const sentinel_blink_to_first_h = -1;
const sentinel_blink_to_first_w = 0.05;
const sentinel_blink_h = -0.15;
const sentinel_blink_w = 0.5;
const first_flink_to_sentinel_h = 1.5;
const first_flink_to_sentinel_w = 0.5;
const to_sentinel_h = 0.5;
const to_sentinel_w = -0.2; 


class dlistAnimation {

	constructor() {
		this.dlist = new Dlist();
	  this.ani = new Animation();
    
    let ani = this.ani;
    let dlist = this.dlist;
    let p1, p2;
		let rect, q_curve;
		let node = dlist.sentinel;
		let flink_ref, blink_ref, label;
		let margin = 70,
		    width = 77,
		    height = 90;
   

    this.width = width;
    this.height = height;
    this.y = 150;
    this.margin = margin;


    // create sentinel node.
		flink_ref = dlist.ms.get_reference(node.flink);
		blink_ref = dlist.ms.get_reference(node.blink);
		label = dlist.ms.get_reference(node);

    rect = new Rect(width + margin, 0, width, height, label, ["sentinel", flink_ref, blink_ref], label, "bottom");
    p1 = ani.get_point(width + margin, height / 2);
    p2 = ani.get_point(width + margin, 0);

    rect.attach_point(p1);
    rect.attach_point(p2);
    q_curve = new quadraticCurve(p1, p2, -2);
    ani.connect_object(q_curve);

    p1 = ani.get_point((width + margin) + width, height * 5 / 6);
    p2 = ani.get_point((width + margin) + width, 0);
    rect.attach_point(p1);
    rect.attach_point(p2);

    q_curve = new quadraticCurve(p1, p2, 1);
    ani.connect_object(q_curve);
	  ani.draw();

		
	}


  erase(ref) {
    let obj, flink_ref, blink_ref, prev_obj, next_obj;
    let q_curve, q_curves, n, p, p1, p2;
    let i,j;
    let x,y;
  
    let h_scale, w_scale;
    let dlist = this.dlist,
        ani = this.ani,
        node = this.dlist.ms.get_object(ref),
        sentinel = this.dlist.sentinel,
        width = this.width,
        height = this.height,
        margin = this.margin,
        size = this.dlist.size;

    obj = ani.get_object(ref);
    flink_ref = dlist.ms.get_reference(node.flink);
    blink_ref = dlist.ms.get_reference(node.blink);
    prev_obj = ani.get_object(dlist.ms.get_reference(node.blink));
    next_obj = ani.get_object(dlist.ms.get_reference(node.flink));


    ani.add_sequence_ani( { target: obj,
                            prop: { strokeStyle: 'red', shadowColor:"#FF0000", shadowBlur:15},
                            concurrence: true } );

    ani.add_parallel_ani( { target: prev_obj,
                            prop: { strokeStyle: 'blue', shadowColor:"#0000FF", shadowBlur:15, start: 0, end: ANIMATION_TIME * 3} } );
    ani.add_parallel_ani( { target: next_obj,
                            prop: { strokeStyle: 'blue', shadowColor:"#0000FF", shadowBlur:15, start: 0, end: ANIMATION_TIME * 3} } );

    for (i = 0; i < 4; i++) {
      if (i == 0) q_curves = ani.get_connection(ref, flink_ref);
      if (i == 1) q_curves = ani.get_connection(flink_ref, ref);
      if (i == 2) q_curves = ani.get_connection(ref, blink_ref);
      if (i == 3) q_curves = ani.get_connection(blink_ref, ref);
      console.log(q_curves);
      for (j = 0; j < q_curves.length; j++) {
        ani.add_sequence_ani( { target: q_curves[j], 
                                 prop: { strokeStyle: 'red', lineWidth: 3},
                                 concurrence:true} );
      }
    }

    // remove object
    ani.add_sequence_ani( {"pause" : 1} );
    ani.add_sequence_ani( { prop: { time: 1 },
                            action: { params: {ani:ani, ref:ref}, func:rm_ani_object} });
    
    // move to left
    n = node.flink;
    while (n != sentinel) {
      obj = ani.get_object(dlist.ms.get_reference(n));
      p = new Point(obj.x - this.width - this.margin, obj.y);
      ani.add_sequence_ani( { target: obj,
                            prop: { p: p } ,
                            concurrence: (n.flink != dlist.sentinel)} );
      n = n.flink;

    }
    

    // prev_obj to next_obj
   
    if (node.blink == sentinel && node.flink == sentinel) {
      h_scale =  -2;
      w_scale = 0.5;
      p1 = ani.get_point(prev_obj.x, prev_obj.y +  height / 2);
      p2 = ani.get_point(next_obj.x, next_obj.y);
    } else if (node.blink == sentinel) {
      h_scale = sentinel_flink_to_first_h
      w_scale = 0.5;
      p1 = ani.get_point(prev_obj.x, prev_obj.y +  height / 2);
      p2 = ani.get_point(next_obj.x, next_obj.y);
    } else if (node.flink == sentinel) {
      if (dlist.size <= 2){
        h_scale = first_flink_to_sentinel_h;
        w_scale = first_flink_to_sentinel_w;
      } else {
        h_scale = to_sentinel_h;
        w_scale = to_sentinel_w;
      }
      p1 = ani.get_point(prev_obj.x + width, prev_obj.y +  height / 2);
      p2 = ani.get_point(next_obj.x + width, next_obj.y);
    } else {
      h_scale = 0;
      w_scale = 0;
      p1 = ani.get_point(prev_obj.x + width, prev_obj.y +  height / 2);
      p2 = ani.get_point(next_obj.x, next_obj.y);
    }


    q_curve = new quadraticCurve(p1, p1, 0);
    ani.connect_object(q_curve);
    ani.add_sequence_ani({ target: q_curve, 
                           prop: {p:p2, type:"pivot", new_h_scale: h_scale, new_w_scale: w_scale, ani:ani},
                           action: { params: {index: 1, rect: prev_obj, text: flink_ref}, func: update_rect_text  }});


    // next_obj to prev_obj
    h_scale = 0;
    w_scale = 0;

    if (node.flink == sentinel && node.blink == sentinel) {
      h_scale = 1;
      w_scale = 0.5;
      p1 = ani.get_point(next_obj.x + width, next_obj.y +  height * 5 / 6);
      p2 = ani.get_point(prev_obj.x + width, prev_obj.y);
    } else if (node.blink == sentinel) {
      h_scale = first_blink_to_sentinel_h;
      w_scale = first_flink_to_sentinel_w;
      p1 = ani.get_point(next_obj.x, next_obj.y +  height * 5 / 6);
      p2 = ani.get_point(prev_obj.x, prev_obj.y);
    } else if (node.flink == sentinel) {
      
      if (dlist.size <= 2) {
        h_scale = sentinel_blink_to_first_h;
        w_scale = sentinel_blink_to_first_w;
      } else {
        h_scale = sentinel_blink_h;
        w_scale = sentinel_blink_w;
      }

      p1 = ani.get_point(next_obj.x + width, next_obj.y +  height * 5 / 6);
      p2 = ani.get_point(prev_obj.x + width, prev_obj.y);
    } else {
      w_scale = 0;
      h_scale = 0;

      p1 = ani.get_point(next_obj.x, next_obj.y + height * 5 / 6);
      p2 = ani.get_point(prev_obj.x + width, prev_obj.y);
    }


  
    q_curve = new quadraticCurve(p1, p1, 0);
    ani.connect_object(q_curve);
    ani.add_sequence_ani({ target: q_curve, 
                           prop: {p:p2, type:"pivot", new_w_scale: w_scale, new_h_scale: h_scale, ani:ani},
                           action: { params: {index: 2, rect: next_obj, text: blink_ref}, func: update_rect_text  }});


    /* adjust the connection between last_node and sentinel */
    if (size == 2 && node.flink != sentinel) {
      q_curve = ani.get_connection(dlist.ms.get_reference(sentinel), dlist.ms.get_reference(sentinel.blink))[0];
      
      q_curve.h_scale = sentinel_blink_to_first_h;
      q_curve.w_scale = sentinel_blink_to_first_w;
      
      q_curve = ani.get_connection(dlist.ms.get_reference(sentinel.blink), dlist.ms.get_reference(sentinel))[0];
      q_curve.h_scale = first_flink_to_sentinel_h;
      q_curve.w_scale = first_flink_to_sentinel_w;
    }


    dlist.erase(node);
    dlist.print();
    ani.run_animation();

  }

  push_back(v) {
    this.insert_node(v, this.dlist.ms.get_reference(this.dlist.sentinel), "before");
  }
  push_front(v) {
    this.insert_node(v, this.dlist.ms.get_reference(this.dlist.sentinel.flink), "after");
  }

  insert_after_node(v, ref) {
    let n = this.dlist.ms.get_object(ref);
    n = n.flink;
    ref = this.dlist.ms.get_reference(n);
    this.insert_node(v, ref , "after");
  }
  insert_before_node(v, ref) {
    this.insert_node(v, ref, "before");
  }

  /* it actually inserts a new node before node "ref". 
     But it could also simulate the insert after node(ref).blink by passing type "after" */
  insert_node(v,ref, type = "before") {
    let rect, flink_ref, blink_ref, label, node;
    let p,p1,p2,p3,p4,q_curve;
    let prev_obj, next_obj;
    let x;
    let h_scale, w_scale;
    let obj;

    let n = this.dlist.ms.get_object(ref);
  
    let width = this.width,
        height = this.height,
        y = this.y,
        margin = this.margin,
        dlist = this.dlist,
        ani = this.ani,
        sentinel = this.dlist.sentinel,
        size = this.dlist.size;


    node = dlist.insert_before_node(v,n);
    ref = dlist.ms.get_reference(node);
    flink_ref = dlist.ms.get_reference(node.flink);
    blink_ref = dlist.ms.get_reference(node.blink);
    label = dlist.ms.get_reference(node);

    prev_obj = ani.get_object(dlist.ms.get_reference(node.blink));
    next_obj = ani.get_object(dlist.ms.get_reference(node.flink));



    // create new rect
    y = this.y * 2;
    if (node.flink == dlist.sentinel) x = (width + margin) * (dlist.size - 1);
    else x = next_obj.x;

    rect = new Rect(x, y, width, height, label, ["v = " + node.value, "null", "null"], label, "bottom");
    p1 = ani.get_point(x, y);  // left top 
    p2 = ani.get_point(x + width, y); // right top
    p3 = ani.get_point(x + width, y + height * 1 / 2); // flink
    p4 = ani.get_point(x, y + height * 5 / 6); // blink
    rect.attach_points([p1, p2, p3, p4]);
    ani.add_object(rect);


    // put shadow on front node, back node and new inserted node.
    ani.add_parallel_ani( { target: next_obj,
                            prop: { strokeStyle: 'blue', shadowColor:"#0000FF", shadowBlur:15, start: (type == "before")? 0 : ANIMATION_TIME, end: ANIMATION_TIME * 8} } );

    
    ani.add_parallel_ani( { target: prev_obj,
                            prop: { strokeStyle: 'blue', shadowColor:"#0000FF", shadowBlur:15, start: (type == "before")? ANIMATION_TIME : 0, end: ANIMATION_TIME * 8} } );

   
    ani.add_parallel_ani( { target: rect,
                            prop: { strokeStyle: 'red', shadowColor:"#FF0000", shadowBlur:15, start: 0, end: ANIMATION_TIME * 8} } );
 
    
   
    if (type == "before") {
      // color the transition of finding the previous node.
      q_curve = get_curve_by_height(ani,flink_ref, blink_ref, height * 5 / 6); // blink
      ani.add_sequence_ani( { target: q_curve,
                              prop: { strokeStyle: 'red'} } );
    } else {
      // color the transition of finding the next node.
      q_curve = get_curve_by_height(ani, blink_ref, flink_ref, height / 2); // flink
      ani.add_sequence_ani( { target: q_curve,
                              prop: { strokeStyle: 'red'} } );
   }


    // move every rect after inserted rect to right
    n = node.flink;
    while (n != sentinel) {
      obj = ani.get_object(dlist.ms.get_reference(n));
      p = new Point(obj.x + width + margin, obj.y);
      ani.add_sequence_ani( { target: obj,
                            prop: { p: p } ,
                            concurrence: (n.flink != dlist.sentinel)} );
      n = n.flink;

    }
    
   
    /*  back node -> new node */

    if (node.blink == sentinel) { // back node is sentinel
      h_scale = sentinel_flink_to_first_h;
    } else {
      h_scale = 0;
    }


    q_curve = get_curve_by_height(ani, blink_ref, flink_ref, height / 2); // flink
    ani.add_sequence_ani( {pause: ANIMATION_TIME / 5} );
    ani.add_sequence_ani( { target: q_curve, 
                        prop: {p:p1, type:"pivot", new_h_scale: h_scale, ani:ani},
                        action: { params: {index: 1, rect: prev_obj, text: ref}, func: update_rect_text  } });



    /* front node -> new node */
    ani.add_sequence_ani( {pause: ANIMATION_TIME / 5} );
    q_curve = get_curve_by_height(ani, flink_ref, blink_ref, height *  5 / 6); // blink
    if (node.flink == sentinel) {
      
      // different params for cruve
      if (size == 0) {
        h_scale = sentinel_blink_to_first_h;
        w_scale = sentinel_blink_to_first_w;
      } else {
        h_scale = sentinel_blink_h;
        w_scale = sentinel_blink_w;
      }
     
    } else  { // a line

      h_scale = 0;
      w_scale = 0;
    } 

    ani.add_sequence_ani({ target: q_curve, 
                           prop: {p:p2, type:"pivot", new_h_scale: h_scale, new_w_scale: w_scale, ani:ani},
                           action: { params: {index: 2, rect: next_obj, text: ref}, func: update_rect_text  } });
  
    

    /* new node to front node */

    q_curve = new quadraticCurve(p3, p3, 0);
    ani.connect_object(q_curve);
   
    if (node.flink == sentinel) { // to sentinel
      p = ani.get_point(next_obj.x + width, next_obj.y);
      if (size == 0) { 
        h_scale = first_flink_to_sentinel_h;
        w_scale = first_flink_to_sentinel_w;
      } else {
        h_scale = to_sentinel_h;
        w_scale = to_sentinel_w;
      }
    } else { // to regular node in front
      p = ani.get_point(next_obj.x, next_obj.y);
      h_scale = 0;
      w_scale = 0;
    }
   
    ani.add_sequence_ani( {pause: ANIMATION_TIME / 5} );
    ani.add_sequence_ani({ target: q_curve, 
                           prop: {p:p, type:"pivot", new_h_scale: h_scale, new_w_scale: w_scale, ani:ani},
                           action: { params: {index: 1, rect: rect, text: flink_ref}, func: update_rect_text  }});



    // new node to back node.
    q_curve = new quadraticCurve(p4, p4, 0);
    ani.connect_object(q_curve);


    if (node.blink == sentinel) { // to sentinel
      p = ani.get_point(prev_obj.x, prev_obj.y);
      h_scale = first_blink_to_sentinel_h;
    } else { // to regular node
      p = ani.get_point(prev_obj.x + width, prev_obj.y);
      h_scale = 0;
    }

    ani.add_sequence_ani( {pause: ANIMATION_TIME / 5} );
    ani.add_sequence_ani({ target: q_curve, 
                           prop: {p:p, type:"pivot", new_h_scale: h_scale, ani:ani},
                           action: { params: {index: 2, rect: rect, text: blink_ref}, func: update_rect_text  }});


    // move new node up
    ani.add_sequence_ani({ target: rect, 
                           prop: {p: new Point(x, y / 2) }});


   

    /* adjust the connection between last_node and sentinel */
    if (size == 1 && node.flink != sentinel) {
      q_curve = ani.get_connection(dlist.ms.get_reference(sentinel), dlist.ms.get_reference(sentinel.blink))[1];
      
      q_curve.h_scale = sentinel_blink_h;
      q_curve.w_scale = sentinel_blink_w;
      
      q_curve = ani.get_connection(dlist.ms.get_reference(sentinel.blink), dlist.ms.get_reference(sentinel))[0];
      q_curve.h_scale = to_sentinel_h;
      q_curve.w_scale = to_sentinel_w;
    }


    ani.run_animation();
   
  }


}




