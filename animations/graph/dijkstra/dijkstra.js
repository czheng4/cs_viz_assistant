/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/22/2020
  Last Modified 12/04/2020
*/

function update_ctx_prop(dict) {
  let obj = dict.obj,
      ctx_prop = dict.ctx_prop; 

  obj.ctx_prop = ctx_prop;
}

function table_td(id, content) {
  return "<td id = " + id + " >" + content + "</td>";
}

function html_table(g) {
  let keys;
  let i,n, id;

  keys = Object.keys(g.node_map);

  $("#node").text("");
  $("#distance").text("");
  $("#backedge").text("");
  $("#multimap").text("");

  $("#node").append(table_td("nodeH", "Node"));
  $("#distance").append(table_td("distanceH", "Distance"));
  $("#backedge").append(table_td("backedgeH", "Backedge"));
  $("#multimap").append(table_td("multimapH", "Multimap (Distance, Node)"));
  $("#multimap").append("<td id = \"multimap_t\" colspan=" + keys.length + " style=\"text-align: left\"></td>");

  for (i = 0; i < keys.length; i++) {
    n = g.node_map[keys[i]];
    $("#node").append(table_td("node_" + n.id, n.id));
    $("#distance").append(table_td("distance_" + n.id, n.distance));
    $("#backedge").append(table_td("backedge_" + n.id, "NULL"));
  }

}

function hightlight_col(dict) {
  let g = dict.g,
      n = dict.node;
  let hightlight, text;

  if ("hightlight" in dict) hightlight = dict.hightlight;
  else hightlight = true;

  // html_table(g);
  $("[id^=node_").css("background", "");
  $("[id^=distance_").css("background", "");
  $("[id^=backedge_").css("background", "");

  //console.log(n);
  text = n.distance;
  $("#distance_" + n.id).text("");
  if ("to_distance" in n) text += RED_SPAN + RIGHT_ARROW + n.to_distance + "</span>";
  $("#distance_" + n.id).append(text);

  $("#backedge_" + n.id).text("");
  if ("to_backedge" in n) {
    text = (n.backedge == null) ? "NULL" : "[ {} ]".format(n.backedge.pretty_edge());
    text += RED_SPAN + RIGHT_ARROW + " [ {} ]".format(n.to_backedge.pretty_edge()) + "</span>";
  } else {
    text = (n.backedge == null) ? "NULL" : n.backedge.pretty_edge();
  }

  $("#backedge_" + n.id).append(text);

  if (hightlight) {
    $("#node_" + n.id).css("background", "lightblue");
    $("#distance_" + n.id).css("background", "lightblue");
    $("#backedge_" + n.id).css("background", "lightblue");
  }

}

function multimap_content(node_q, dist_q, hightlight_node = null, dist = -1) {
  let i;
  let str;
  let n1, d1;

  str = "";
  n1 = node_q.sentinel.flink;
  n2 = dist_q.sentinel.flink;
  for (n1, n2; n1 != node_q.sentinel; n1 = n1.flink, n2 = n2.flink) {
    if (hightlight_node != null && n1.value.id == hightlight_node.id && (n2.value == dist || dist == -1) ) {
      str += '<span style = "color: red">';
    }

    str += "(" + n2.value + ", " + n1.value.id + ")  ";

    if (hightlight_node != null && n1.value.id == hightlight_node.id && (n2.value == dist || dist == -1) ) {
      str += '</span>';
    }
  }
  return str;
  
}

function update_multimap_content(dict) {
  let content = dict.content;
  $("#multimap_t").text("");
  $("#multimap_t").append(content);
}


function copy_list(l) {
  let n;
  q = l.deep_copy(); // dlist deep_copy only deep copy Dnode not the value Dnode stores.
  n = q.sentinel.flink;
  while(n != q.sentinel) {
    if (typeof(n.value) == "object") n.value = n.value.shallow_copy();
    n = n.flink;
  }
  return q;
}

const PROCESS_NODE_CTX = {strokeStyle: '#0000FF', shadowColor:"#0000FF", fillStyle:"#FA8072", shadowBlur:15};
const VISITED_NODE_CTX = {fillStyle:"yellow"};
const ADJ_NODE_CTX = {strokeStyle: '#FF0000', shadowColor:"#FF0000", shadowBlur:15};

class dijkstraAnimation {
  constructor(){
    this.ani = new Animation();
    this.graph = null;
    this.starting_node = null;
    this.run = false;
  }


  find_path(ending_node, g) {
    let n = ending_node, pre_n;
    let ani = this.ani;
    let path = "";

    for (let key in g.node_map) {
      g.node_map[key].ani_circle.ctx_prop.strokeStyle = "black";
      g.node_map[key].ani_circle.ctx_prop.shadowColor = "";
      g.node_map[key].ani_circle.ctx_prop.shadowBlur = 0;
    }

    for (let key in g.edge_map) {
      if (g.edge_map[key].ani_line != null) {
        g.edge_map[key].ani_line.ctx_prop.strokeStyle = "black";
        g.edge_map[key].ani_line.ctx_prop.lineWidth = 2;
      }
    }

    if (this.run == false) {
      $("#elaboration_text").text("Must run Dijkstra on a node first");
      return;
    }

    ani.clear_animation();
    pre_n = n.shallow_copy();
    while (n != this.starting_node) {

      if (n.backedge == null) return;

      if (n != ending_node) path += LEFT_ARROW;
      path += "({}, {})".format(n.backedge.n1.id, n.backedge.n2.id);
      
     

      ani.add_sequence_ani({ 
        pause:1,
        text:path,
        action: { params: {obj: n.ani_circle, ctx_prop: update_dict(n.ani_circle.ctx_prop, ADJ_NODE_CTX) }, 
                  func: update_ctx_prop},
        rev_action: { params: {obj: n.ani_circle, ctx_prop: n.ani_circle.ctx_prop },
                      func: update_ctx_prop},
        concurrence:true
      });  

      ani.add_sequence_ani({ 
        pause:1,
        action: { params: {obj: n.backedge.ani_line, ctx_prop: update_dict(n.backedge.ani_line.ctx_prop, {strokeStyle:"red", lineWidth:3}) }, 
                  func: update_ctx_prop},
        rev_action: { params: {obj: n.backedge.ani_line, ctx_prop: n.backedge.ani_line.ctx_prop },
                       func: update_ctx_prop},
        concurrence:true
      });  


      ani.add_sequence_ani({ 
        pause: 1, 
        action: { params: {g:g, node: n}, func: hightlight_col },
        rev_action : { params: {g:g, node:pre_n }, func: hightlight_col },
        concurrence:true
      });  
      pre_n = n.shallow_copy();




      ani.add_sequence_ani({
        pause: ANIMATION_TIME,
        prop: {step: true}
      })
      
      n = n.backedge.n1;
     

    }
    ani.add_sequence_ani({ 
        pause: 1, 
        action: { params: {g:g, node: n}, func: hightlight_col },
        rev_action : { params: {g:g, node:pre_n}, func: hightlight_col },
        concurrence:true
    });  
      


    ani.add_sequence_ani({ 
      pause: 1,
      text: path + ". Done",
      action: { params: {obj: n.ani_circle, ctx_prop: update_dict(n.ani_circle.ctx_prop, ADJ_NODE_CTX) }, 
                func: update_ctx_prop},
      rev_action: { params: {obj: n.ani_circle, ctx_prop: n.ani_circle.ctx_prop },
                    func: update_ctx_prop},
    });  
    ani.run_animation();
  }

  run_dijkstra(starting_node, g, leave_node = false) {
    let dist_q = new Dlist();
    let node_q = new Dlist();
    let ani = this.ani;
    let n, n2, e, b_dist, dist, pre_n, tmp_n;
    let i, pos;
    let ctx_prop, tmp_ctx_prop;
    let circle, line;
    let total_animation_time;
    let node_prop, adj_prop, line_prop;
    let e_text;
    let pre_multimap_text;
    let multimap_text;

    this.run = true;
    ani.clear_animation();
    this.starting_node = starting_node;
    pre_multimap_text = "";
    total_animation_time = 0;

    // set all nodes' distance to -1 and backedge to null
    // standard routine for dijkstra algorithm
    //console.log(starting_node);
    for (let key in g.node_map) {
      g.node_map[key].distance = -1;
      g.node_map[key].backedge = null;
      g.node_map[key].visited = 0;
      g.node_map[key].ani_circle.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
    }


    for (let key in g.edge_map) {
      if (g.edge_map[key].ani_line != null){
        g.edge_map[key].ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
      }
    }

    g.save_original_graph();
    // set up the table.
    html_table(g);

    
    // insert the starting node
    pre_n = starting_node.shallow_copy();
    dist_q.insert_sort(0);
    starting_node.itr = node_q.insert_before_pos(starting_node, 0);
    starting_node.distance = 0;
    

    ani.add_sequence_ani({pause:1, text: "Initialize all nodes' backedge to NULL and distances to -1",prop: {step: true}});
    total_animation_time += 1;


    // insert starting node animation
    ani.add_sequence_ani({ 
      pause: 1, 
      text: "Set starting node " + BLUE_SPAN + starting_node.id + "'s </span> distance to 0 and insert it to the multimap",
      action: { params: {g:g, node:starting_node}, func: hightlight_col },
      rev_action : { params: {g:g, node:pre_n, hightlight: false}, func: hightlight_col },
      concurrence:true
    });  
    pre_n = starting_node.shallow_copy();


    multimap_text = multimap_content(node_q, dist_q, starting_node);
    ani.add_sequence_ani({ 
      pause: 1, 
      action: { params: {content: multimap_text }, func: update_multimap_content },
      rev_action: { params: {content: pre_multimap_text }, func: update_multimap_content },
      concurrence:true
    });  

    pre_multimap_text = multimap_text;

   

    ani.add_sequence_ani({pause:ANIMATION_TIME, prop:{step:true}});



    total_animation_time += ANIMATION_TIME;
    while (!node_q.empty()) {
      
      // console.log(dist_q, node_q);
      dist = dist_q.first();
      n = node_q.first();
      n.visited = 1;


      circle = n.ani_circle;
      node_prop = deep_copy(PROCESS_NODE_CTX);
      node_prop.start = total_animation_time;

      // give shadows for currently processing node.
      ani.add_parallel_ani({target: circle, prop: node_prop });


      // remove front node animation (show elaboration)
      multimap_text = multimap_content(node_q, dist_q, n, dist);
      ani.add_sequence_ani({ 
        pause: 1,
        text: "Remove {}({}, {})</span> from the front of the multimap.".format(BLUE_SPAN, dist, n.id),
        action: { params: {content: multimap_text }, func: update_multimap_content },
        rev_action: { params: {content: pre_multimap_text }, func: update_multimap_content },
        concurrence: true,
      });
      pre_multimap_text = multimap_text;



      ani.add_sequence_ani({ 
        pause: 1, 
        action: { params: {g:g, node:n.shallow_copy()}, func: hightlight_col},
        rev_action : { params: {g:g, node:pre_n}, func: hightlight_col },
        concurrence:true 
      });
      pre_n = n.shallow_copy();


      // animation of highlighting removing node in the multimap
      ani.add_sequence_ani({
        pause:ANIMATION_TIME,
        prop: {step: true}
      });

      dist_q.pop_front();
      node_q.pop_front();


      // animation of multimap after removing it
      multimap_text = multimap_content(node_q, dist_q);
      ani.add_sequence_ani({
        pause:1,
        action: { params: {content: multimap_text }, func: update_multimap_content },
        rev_action: { params: {content: pre_multimap_text }, func: update_multimap_content },
        concurrence:true
      });
      pre_multimap_text = multimap_text;

      

      if (dist != n.distance) {
        e_text = "Node {}{}'s</span> distance != key on multimap ({} != {}). Do nothing".format(BLUE_SPAN, n.id, n.distance, dist);
      } else {

        e_text = "Process node {}{}'s</span> adj list".format(BLUE_SPAN, n.id);


      
        // animation of showing adj nodes. 
        for (i = 0; i < n.adj.length; i++) {
          ani.add_sequence_ani({
            target:n.adj[i].ani_line,
            prop: {strokeStyle:"red", lineWidth:3},
            concurrence:true
          });
          ani.add_sequence_ani({
            target:n.adj[i].n2.ani_circle,
            prop: deep_copy(ADJ_NODE_CTX),
            concurrence: true
          })
        }
      }

      ani.add_sequence_ani({
        pause:ANIMATION_TIME - 2,
        text: e_text,
        prop : {step: true}
      });

      total_animation_time += ANIMATION_TIME * 2;
      if (n.adj.length == 0 || dist != n.distance) total_animation_time -= 2;


      if (dist == n.distance) {
        for (i = 0; i < n.adj.length; i++) {

          e = n.adj[i];
          n2 = e.n2;
          b_dist = e.weight + dist;
          tmp_n = n2.shallow_copy();

          // set line(edge) prop
          line = e.ani_line;       
          line_prop = update_dict(line.ctx_prop, {strokeStyle: "red", lineWidth:3});
          line_prop.start = total_animation_time;

          // set adj node prop
          adj_prop = update_dict(n2.ani_circle.ctx_prop, ADJ_NODE_CTX);
          adj_prop.start = total_animation_time;

          if (n2.visited == 1) {
            adj_prop.fillStyle = "yellow";
          }
          
          e_text = "Process edge {}[ {} ]</span>: ".format(BLUE_SPAN, e.pretty_edge());
          e_text += "New Distance = " + dist + " + " + e.weight + " = " + (dist + e.weight); 
          if (n2.distance == -1 || n2.distance > b_dist) {}
          else e_text += " > {}. Do Nothing".format(n2.distance);

          // color the edge red
          ani.add_parallel_ani({ target:line, prop: line_prop});

          // generate shadow for adj node
          ani.add_parallel_ani({ target:n2.ani_circle, prop: adj_prop})


          // animation of highlighting the node in the table
          ani.add_sequence_ani({
            pause:1,
            rev_action: { params: {g:g, node:n2.shallow_copy()}, func: hightlight_col },
            concurrence: true
          })
          ani.add_sequence_ani({ 
            pause: 1, 
            text: e_text,
            action: { params: {g:g, node:tmp_n}, func: hightlight_col},
            rev_action : { params: {g:g, node:pre_n}, func: hightlight_col },
            concurrence:true 
          });

          pre_n = n2.shallow_copy();
          ani.add_sequence_ani({pause:ANIMATION_TIME, prop:{step:true}});

          total_animation_time += ANIMATION_TIME;
          if (n2.distance == -1 || n2.distance > b_dist) {
            
            if (leave_node == false && n2.distance != -1) {

              multimap_text = multimap_content(node_q, dist_q, n2);
              ani.add_sequence_ani({
                pause:1,
                action: { params: {content: multimap_text }, func: update_multimap_content },
                rev_action: { params: {content: pre_multimap_text }, func: update_multimap_content },
                concurrence:true
              });
              pre_multimap_text = multimap_text;

              ani.add_sequence_ani({
                pause:ANIMATION_TIME, 
                text: "Node {}{}</span> is in the multimap, remove {}({}, {})</span>".format(BLUE_SPAN, n2.id, BLUE_SPAN, n2.distance, n2.id),
                prop: {step:true}
              });

              node_q.erase(n2.itr);
              dist_q.erase_value(n2.distance);

              total_animation_time += ANIMATION_TIME;

            }
            n2.distance = b_dist;
            n2.backedge = e;
            tmp_n.to_distance = b_dist;
            tmp_n.to_backedge = e;
            pos = dist_q.insert_sort(b_dist);
            n2.itr = node_q.insert_before_pos(n2, pos);

            // animation of hightlighting new added edge
            multimap_text = multimap_content(node_q, dist_q, n2, b_dist);
            ani.add_sequence_ani({
              pause:1,
              action: { params: {content: multimap_text }, func: update_multimap_content },
              rev_action: { params: {content: pre_multimap_text }, func: update_multimap_content },
              concurrence:true
            });
            pre_multimap_text = multimap_text;

            pre_n.to_backedge = tmp_n.to_backedge;
            pre_n.to_distance = tmp_n.to_distance;
            ani.add_sequence_ani({ 
              pause: 1, 
              action: { params: {g:g, node:n2.shallow_copy()}, func: hightlight_col},
              rev_action: { params: {g:g, node:pre_n}, func: hightlight_col },
              concurrence:true 
            })
            pre_n = n2.shallow_copy();


            ani.add_sequence_ani({
              pause: ANIMATION_TIME,
              text: "Update node {}{}</span> and insert {}({}, {})</span> to multimap".format(BLUE_SPAN, n2.id, BLUE_SPAN, b_dist, e.n2.id),
              prop: {step: true}
            })
            total_animation_time += ANIMATION_TIME;
             // console.log(dist_q);
          }

          multimap_text = multimap_content(node_q, dist_q);
          ani.add_sequence_ani({ 
            pause: 1, 
            action: { params: {content: multimap_text }, func: update_multimap_content },
            rev_action: { params: {content: pre_multimap_text }, func: update_multimap_content },
            concurrence:true 
          })
          pre_multimap_text = multimap_text;

          ani.add_sequence_ani({pause:2});
          total_animation_time += 2;
          line_prop.end = total_animation_time;
          adj_prop.end = total_animation_time;

          if (n2.visited == 1) {
            ani.add_sequence_ani({ 
              pause:1, 
              action: { params: {obj: n2.ani_circle, ctx_prop:update_dict(n2.ani_circle.ctx_prop, VISITED_NODE_CTX)}, func: update_ctx_prop},
            })
            total_animation_time += 1;
          }


         
          // console.log(line_prop.start, line_prop.end);
          // total_animation_time += 2;
        }
      }


      // we add one here becsuse we want to keep this effect after the last adj node is vivisted.
      ani.add_sequence_ani({pause:2});
      total_animation_time += 2;
      node_prop.end = total_animation_time; 
      //console.log(node_prop.start, node_prop.end);
      // pasue on 3 because we want this happen after prop.end.

      
      ani.add_sequence_ani( { pause:1,
                              action: { params: {obj: circle, ctx_prop:update_dict(circle.ctx_prop, VISITED_NODE_CTX)}, func: update_ctx_prop} } );

      total_animation_time += 1;
      // break;
      
      // console.log(dist, node);
    }

    ani.add_sequence_ani({
      pause:1,
      text: "Done",
    })
    ani.run_animation();
  }
}
