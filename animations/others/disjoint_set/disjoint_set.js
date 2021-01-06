/*
  ChaoHui Zheng
  11/22/2020
  last modified 12/26/2020
*/
const UNION_BY_SIZE = 0b1;
const UNION_BY_RANK = 0b11;
const UNION_BY_HEIGHT = 0b111;
const PATH_COMPRESSION_NODE = {shadowColor:"#0000FF", shadowBlur:15};

function node_pos_after_union(node, g, list_p = []) {

  let x,y;
  let c;
  let y_gap = 100,
      x_gap = 60;

  let ok;
  // console.log(g);
  
  y = node.ani_circle.y + y_gap;

  for(let i = 0; i < 100; i++) {

    for (let j = -1; j <= 1; j+=2) {
      x = node.ani_circle.x + x_gap * i * j;
      
      ok = true;


      for (let i = 0; i < list_p.length; i++) {
        if (cal_distance(x, y, list_p[i].x, list_p[i].y) <= g.node_radius * g.node_radius) {
          ok = false;
          break;
        }
      }
      if (ok == false) continue;



      for (let key in g.node_map) {
        c = g.node_map[key].ani_circle;
        if (cal_distance(x, y, c.x, c.y) <= g.node_radius * g.node_radius) {
          ok = false;
          break;
        }
      }


      if (ok) return new Point(x,y);

      if (i == 0) break;
    }
     
  }


}

function update_ctx_prop(dict) {
  let obj = dict.obj,
      ctx_prop = dict.ctx_prop; 

  obj.ctx_prop = update_dict(obj.ctx_prop, ctx_prop);
}

function disable_propagation(dict) {
  dict.obj.propagation = false;
}

function enable_propagation(dict) {
  dict.obj.propagation = true;
}

function table_td(id, content) {
  return "<td id = " + id + " >" + content + "</td>";
}

function change_circle_color(dict) {
  dict.circle.ctx_prop = update_dict(dict.circle.ctx_prop, { "fillStyle": dict.color} );
}

function change_line_color(dict) {
  dict.line.ctx_prop = update_dict(dict.line.ctx_prop, { "strokeStyle": dict.color} );
}


function default_color(dict) {
  let g = dict.g;
  for (let key in g.node_map) {
    g.node_map[key].ani_circle.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
  }
  for (let key in g.edge_map) {
    g.edge_map[key].ani_line.ctx_prop.strokeStyle = "black";
  }
}

function color_two_sets(dict) {
  let id, c;
  let ds = dict.ds,
      id1 = dict.id1,
      id2 = dict.id2;
  let g = ds.g;

  // console.log(id1, id2);
  // for (let key in g.edge_map) {
  //   g.edge_map[key].ani_line.ctx_prop.strokeStyle = "black";
  // }
  for (let i = 0; i < ds.num_elements; i++) {
    id = ds.find_no_animation(i);
    // console.log(id);
    if (id == id1) {
      c = g.get_node(i).ani_circle;
      // c.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
      c.ctx_prop.fillStyle = 'yellow';
     
    }

    if (id == id2) {
      c = g.get_node(i).ani_circle;
      // c.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
      c.ctx_prop.fillStyle = 'lightblue';
    }
  }
  
}



function hightlight_col(dict) {
  let g = dict.g,
      ids = dict.ids,
      ds = dict.ds;

  // let hightlight;
  let id;

  // if ("hightlight" in dict) hightlight = dict.hightlight;
  // else hightlight = true;

  // html_table(g);
  $("[id^=node_").css("background", "");
  $("[id^=link_").css("background", "");
  $("[id^=size_or_height_").css("background", "");

  if ("update_ids" in dict) {
    for (let i = 0; i < dict.update_ids.length; i++) {
      id = dict.update_ids[i];
      $("#link_" + id).text(ds.links[id]);
      $("#size_or_height_" + id).text(ds.union_type == UNION_BY_SIZE? ds.sizes[id] : ds.heights[id]);
    }
  }

  for (let i = 0; i < ids.length; i++) {
    id = ids[i];
    $("#link_" + id).text(ds.links[id]);

    $("#size_or_height_" + id).text(ds.union_type == UNION_BY_SIZE? ds.sizes[id] : ds.heights[id]);

    // highlight
    $("#node_" + id).css("background", "pink");
    $("#link_" + id).css("background", "pink");
    $("#size_or_height_" + id).css("background", "pink");
  }
 

}



class disjointSetAnimation {
	constructor(union_type = UNION_BY_SIZE) {
    this.ani = new Animation();

    this.sizes = [];
    this.heights = [];
    this.links = [];
    this.nodes = [];
    this.union_type = union_type;
    this.num_elements = 0;
    this.g = null;

  }

  deep_copy() {
    let ds = new disjointSetAnimation(this.union_type);
    ds.ani = this.ani;
    ds.sizes = deep_copy(this.sizes);
    ds.heights = deep_copy(this.heights);
    ds.links = deep_copy(this.links);
    ds.nodes = this.nodes;
    ds.g = this.g;
    ds.num_elements = this.num_elements;

    return ds;

  }
  html_table() {
    let n;
    $("#node").text("");
    $("#link").text("");
    $("#size_or_height").text("");

    $("#node").append(table_td("nodeH", "Node"));
    $("#link").append(table_td("linkH", "Link"));
    $("#size_or_height").append(table_td("size_or_heightH", (this.union_type == UNION_BY_SIZE) ? "Size" : "Height"));
   

    for (let i = 0; i < this.nodes.length; i++) {
    
      $("#node").append(table_td("node_" + i, i));
      $("#link").append(table_td("link_" + i, this.links[i]));
      $("#size_or_height").append(table_td("size_or_height_" + i, (this.union_type == UNION_BY_SIZE) ? this.sizes[i] : this.heights[i]));
    }
  }

  init(num_elements, g) {

    this.g = g;
    this.num_elements = num_elements;
    for (let i = 0; i < num_elements; i++) {
      this.sizes.push(1);
      this.links.push(-1);
      this.heights.push(1);
      this.nodes.push(g.get_node(i));
    }

    this.html_table();
  }



  // union_error_check(id1, id2) {
  //   let links = this.links;
  //   id1 = parseInt(id1);
  //   id2 = parseInt(id2);

  //   if (isNaN(id1) || isNaN(id2) || id1 < 0 || id2 < 0 || id1 >= this.num_elements || id2 >= this.num_elements) {
  //     $("#elaboration_text").text("Call Union on invalid sets {} {}").format_b(id1, id2);
  //     return true;
  //   } else if (links[id1] != -1 || links[id2] != -1) {
  //     $("#elaboration_text").text("Must Call Union on set ids rather than element");
  //     return true;
  //   } else if (id1 == id2) {
  //     $("#elaboration_text").text("Call Union on the same sets {} {}").format_b(id1, id2);
  //     return true;
  //   }

  //   return false;
  // }

  union(id1, id2) {

    let links = this.links;
    id1 = parseInt(id1);
    id2 = parseInt(id2);

    if (isNaN(id1) || isNaN(id2) || id1 < 0 || id2 < 0 || id1 >= this.num_elements || id2 >= this.num_elements) {
      $("#elaboration_text").text("");
      $("#elaboration_text").append("Call Union on invalid sets {} {}".format_b(id1, id2));
      return;
    } else if (links[id1] != -1 || links[id2] != -1) {
      $("#elaboration_text").text("Must Call Union on set ids rather than element");
      return;
    } else if (id1 == id2) {
      $("#elaboration_text").text("");
      $("#elaboration_text").append("Call Union on the same sets {} {}".format_b(id1, id2));
      return;
    }

    this.ani.set_function_call("union", [id1, id2]);
    this.set_state();
    this.union_by_types(id1, id2);

  }

  
  
  find_no_animation(id) {
    
    while (this.links[id] != -1) id = this.links[id];
    return id;
  }

  find(id) {
    let ele, prev_ele, i;
    let str;
    let circle, line, parent_p, p;
    let v = [];
    let list_p = [];
    let old_ds;
    let stop_propagation = {};
    let ani = this.ani,
        g = this.g;


    // ani.clear_animation();
   
    if (id < 0 || id >= this.num_elements) {
      $("#elaboration_text").text("{} is not a valid set id".format_b(id));
      return;
    }

    this.ani.set_function_call("find", [id]);
    this.set_state();
    // this.reset_color();
    ani.add_sequence_ani({
      pause:1,
      action : { params: {g: this.g}, func: default_color},
      rev_action: { params: {g: this.g}, func: default_color},
      concurrence: true
    });

    prev_ele = id;
    ele = id;
    str = ele;
    while (1) {

      v.push(ele);
      circle = g.get_node(ele).ani_circle;
     
      // color table

      ani.add_sequence_ani({
        pause:1,
        action: { params: {g:this.g, ds: this, ids: [ele]}, func: hightlight_col },
        rev_action: {params: {g:this.g, ds: this, ids: [prev_ele]}, func: hightlight_col},
        concurrence: true,
      });

      if (this.links[ele] != -1) line = g.get_edge_by_name(ele, this.links[ele], "").ani_line;
      
      prev_ele = ele;
      ele = this.links[ele];
      str += RIGHT_ARROW + ele;

      /* color the node
         we don't actually need target here. I add target here becuase when animation steps back, 
         the old ctx_prop will be restored. Here's how it works -- in the begining of this animation. the ctx_prop of 
         circle gets copy. After 1 animation time, the action gets executed. When we step back, the original ctx_prop gets 
         restored. It only works with ctx_prop.
      */
      ani.add_sequence_ani({
        pause:1,
        target: circle,
        text: "Find({}). {}".format(id, str),
        action: {params: {circle: circle, color: "yellow"}, func: change_circle_color},
        concurrence: true,
      });

      if (ele == -1) break;

      // color the edge
      ani.add_sequence_ani({
        pause:1,
        target: line,
        action: {params: {line: line, color: "red"}, func: change_line_color},
        concurrence: true
      });

      ani.add_sequence_ani({
        pause: ANIMATION_TIME,
        prop: {step: true},
      });



      // console.log(str);
    }

    ele = prev_ele;

    if (this.union_type == UNION_BY_RANK) {

      ani.add_sequence_ani({pause: 1, prop: {step: true} });
      

      circle = g.get_node(ele).ani_circle;
      parent_p = ani.get_point(circle.x, circle.y);

      // v[v.length - 1] is the root id. We don't need to process root set id here.
      for (i = 0; i < v.length - 2; i++) {
        old_ds = this.deep_copy();
        this.links[v[i]] = ele;
        circle = g.get_node(v[i]).ani_circle;
        line = g.get_edge_by_name(v[i], v[i + 1], "").ani_line;

        ani.add_sequence_ani({
          pause:1,
          target:circle,
          text: "Path Compression. Set {}'s link to {}".format_b(v[i], ele),
          action: {params: {obj: circle, ctx_prop: PATH_COMPRESSION_NODE}, func: update_ctx_prop },
          concurrence: true,
        });

        prev_ele = ((i == 0)? ele : v[i - 1]);
        ani.add_sequence_ani({
          pause: 1,
          action: { params: {g:this.g, ds: this, ids: [v[i]]}, func: hightlight_col },
          rev_action: { params: {g:this.g, ds: old_ds, ids: [prev_ele], update_ids:[v[i]] }, func: hightlight_col},
        });



        // when we get to parent, we wanna stop propagation.

        if (i != v.length - 2) {
          
          ani.add_sequence_ani({
            target: line,
            prop: {p: parent_p, type: "pivot", ani:ani, step: true},

          });

          stop_propagation = {};
          stop_propagation[ele] = true;
          circle.propagation = true;
          p = node_pos_after_union(g.get_node(ele), g, list_p);
          list_p.push(p);
          // move the child to a nice position.
          ani.add_sequence_ani({ 
            target: circle,
            prop: {p:p, stop_propagation: stop_propagation, step:true },
            action: {params: {obj:circle}, func: disable_propagation},
          });

          // enable propagation when reversing
          ani.add_sequence_ani({
            pause:1,
            rev_action: {params: {obj:circle}, func: enable_propagation},
          });
        }
        

      }
    }
    ani.add_sequence_ani({
      pause:1,
      text: "Done. Find({}) = {}".format_b(id, ele)
    });

    ani.run_animation();
    return ele;
  
  }

  set_state() {
    let ani = this.ani;
     /* the entire state is composed of the state of graph, Animation and algorithm */
    let state = this.deep_copy(); // this copy the state of algorithm
    state.ani = state.ani.deep_copy(); // this copy the state of animation
    state.g = state.g.deep_copy(state.ani); // this copy the state of Graph
    ani.set_state(state);
  }

  union_by_types(id1, id2) {
    let g = this.g,
        ani = this.ani,
        sizes = this.sizes,
        heights = this.heights,
        links = this.links;

    let parent, child, parent_n, child_n;
    let p, line;
    let e_text;
    let stop_propagation = {};
    let old_ds = this.deep_copy();
    
    ani.add_sequence_ani({
      pause:1,
      action: {params: {ds: old_ds, id1:id1, id2:id2}, func: color_two_sets},
      rev_action : { params: {g: this.g}, func: default_color},
      concurrence: true
    });

    if (this.union_type == UNION_BY_SIZE) {
      if (sizes[id1] > sizes[id2]) {
        parent = id1;
        child = id2;
      } else {
        parent = id2;
        child = id1;
      }

      links[child] = parent;
      sizes[parent] += sizes[child];
    } else {
      if (heights[id1] > heights[id2]) {
        parent = id1;
        child = id2;
      } else {
        parent = id2;
        child = id1;
      }

      links[child] = parent;
      if (heights[child] == heights[parent]) heights[parent]++;
    }

    child_n = g.get_node(child);
    parent_n = g.get_node(parent);

    p = node_pos_after_union(parent_n, g);
    
    line = g.get_edge(child_n, parent_n, "").ani_line;
    line.p2 = line.p1;
    

    if (this.union_type == UNION_BY_SIZE) {
      e_text = "Union({}, {}). Parent is {}. Child is {}. Set parent's size to {}. Set child's link to {}".format_b(id1, id2, parent, child, this.sizes[parent], parent);
    } else {
      e_text = "Union({}, {}). Parent is {}. Child is {}. Set parent's height to {}. Set child's link to {}".format_b(id1, id2, parent, child, this.heights[parent], parent);
    }
    
    ani.add_sequence_ani({
      pause: 1,
      text: e_text,
      action: { params: {g:this.g, ds: this, ids: [child, parent]}, func: hightlight_col },
      rev_action: { params: {g:this.g, ds: old_ds, ids: [child, parent]}, func: hightlight_col},
      concurrence: true
    });


    // animation from child to parent
    ani.add_sequence_ani({
      target: line,
      prop: {p: parent_n.ani_circle.points[0], type:"pivot", ani:ani, step: true}
    });

    // when we get to parent, we wanna stop propagation.
    stop_propagation[parent_n.ani_circle.ref] = true;
    child_n.ani_circle.propagation = true;
    // move the child to a nice position.
    ani.add_sequence_ani({ 
      target: child_n.ani_circle,
      prop: {p:p, stop_propagation: stop_propagation },
      action: {params: {obj:child_n.ani_circle}, func: disable_propagation},
    });

    ani.add_sequence_ani({
      pause:1,
      rev_action: {params: {obj:child_n.ani_circle}, func: enable_propagation},
      concurrence: true,
    });

    ani.add_sequence_ani({
      pause:1,
      rev_action: {params: {ds: old_ds, id1:id1, id2:id2}, func: color_two_sets},
    });

    ani.run_animation();
  }


}