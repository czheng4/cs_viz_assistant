


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
      node = dict.node;
  let hightlight;

  if ("hightlight" in dict) hightlight = dict.hightlight;
  else hightlight = true;

  // html_table(g);
  $("[id^=node_").css("background", "");
  $("[id^=distance_").css("background", "");
  $("[id^=backedge_").css("background", "");

  $("#distance_" + node.id).text(node.distance);
  if (node.backedge != null) {
    $("#backedge_" + node.id).text("({}, {})".format(node.backedge.n1.id, node.backedge.n2.id));
  } else {
    $("#backedge_" + node.id).text("NULL");
  }
  if (hightlight) {
    $("#node_" + node.id).css("background", "pink");
    $("#distance_" + node.id).css("background", "pink");
    $("#backedge_" + node.id).css("background", "pink");
  }

}

function multimap_content(dict) {
  let i;
  let str;
  let n1, d1;
  let node_q = dict.node_q,
      dist_q = dict.dist_q,
      hightlight_node = dict.hightlight_node;

  str = "";
  n1 = node_q.sentinel.flink;
  n2 = dist_q.sentinel.flink;
  for (n1, n2; n1 != node_q.sentinel; n1 = n1.flink, n2 = n2.flink) {
    if (hightlight_node != null && n1.value.id == hightlight_node.id) {
      str += '<span style = "color: red">';
    }

    str += "(" + n2.value + ", " + n1.value.id + ")  ";

    if (hightlight_node != null && n1.value.id == hightlight_node.id) {
      str += '</span>';
    }
  }

  $("#multimap_t").text("");
  $("#multimap_t").append(str);
}

function update_multimap_content(dict) {
  let content = dict.content;
  console.log(content);
  $("#multimap_t").text(content);
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
  constructor(ani){
    this.ani = ani;
    this.graph = null;
  }


  run_dijkstra(starting_node, g) {
    let dist_q = new Dlist();
    let node_q = new Dlist();
    let ani = this.ani;
    let n, n2, e, b_dist, dist, pre_n;
    let i, pos;
    let ctx_prop, tmp_ctx_prop;
    let circle, line;
    let total_animation_time;
    let node_prop, adj_prop, line_prop;
    let e_text;
    let pre_multimap_content;

    pre_multimap_content = "";
    total_animation_time = 0;

    // set all nodes' distance to -1 and backedge to null
    // standard routine for dijkstra algorithm
    for (let key in g.node_map) {
      g.node_map[key].distance = -1;
      g.node_map[key].backedge = null;
      g.node_map[key].visited = 0;
    }

    // set up the table.
    html_table(g);

    
    // insert the starting node
    pre_n = starting_node.shallow_copy();
    dist_q.insert_sort(0);
    starting_node.itr = node_q.insert_before_pos(starting_node, 0);
    starting_node.distance = 0;
    

    ani.add_sequence_ani({pause:1, text: "Initialize all nodes' backedge to NULL and distances to -1",prop: {step: true}});
    // total_animation_time += 1;


    // insert starting node animation
    ani.add_sequence_ani({ 
      pause: 1, 
      text: "Set starting node " + starting_node.id + "'s distance to 0 and insert it to the multimap",
      action: { params: {g:g, node:starting_node}, func: hightlight_col },
      rev_action : { params: {g:g, node:pre_n, hightlight: false}, func: hightlight_col },
      concurrence:true
    });  
    pre_n = starting_node.shallow_copy();


    ani.add_sequence_ani({ 
      pause: 1, 
      action: { params: { node_q:copy_list(node_q), 
                          dist_q: dist_q.deep_copy(), 
                          hightlight_node: starting_node }, 
                func: multimap_content },
      rev_action: { params: {content: pre_multimap_content }, func: update_multimap_content },
      concurrence:true
    });  

    pre_multimap_content = $("#multimap_t").text();

   

    ani.add_sequence_ani({pause:ANIMATION_TIME, prop:{step:true}});

    // multimap_content({
    //   node_q:copy_list(node_q), 
    //   dist_q: dist_q.deep_copy(), 
    //   hightlight_node: starting_node
    // });


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
      ani.add_sequence_ani({ 
        pause: 1,
        text: "Remove (" + dist + ", " + n.id + ") from the front of the multimap.",
        action: {params: { node_q:copy_list(node_q), 
                           dist_q: dist_q.deep_copy(), 
                           hightlight_node: n},
                 func: multimap_content },
        rev_action: { params: {content: pre_multimap_content }, func: update_multimap_content },
        concurrence: true,
      });

      pre_multimap_content = $("#multimap_t").text();

      // animation of highlighting removing node in the multimap
      ani.add_sequence_ani({
        pause:ANIMATION_TIME,
        prop: {step: true}
      });

      dist_q.pop_front();
      node_q.pop_front();


      // animation of multimap after removing it
      ani.add_sequence_ani({
        pause:1,
        action: {params: { node_q:copy_list(node_q), 
                           dist_q: dist_q.deep_copy(), 
                           hightlight_node: null},
                 func: multimap_content },
        rev_action: { params: {content: pre_multimap_content }, func: update_multimap_content },
        concurrence:true
      });

      pre_multimap_content = $("#multimap_t").text();

     
      
      // animation of showing adj nodes. 
      for (i = 0; i < n.adj.length; i++) {
        ani.add_sequence_ani({
          target:n.adj[i].ani_line,
          prop: {strokeStyle:"red", lineWidth:3},
          concurrence:true
        })
        ani.add_sequence_ani({
          target:n.adj[i].n2.ani_circle,
          prop: deep_copy(ADJ_NODE_CTX),
          concurrence: true
        })
      }

      ani.add_sequence_ani({
        pause:ANIMATION_TIME - 2,
        text: "Process node {}' adj list".format(n.id),
        prop : {step: true}
      })

      total_animation_time += ANIMATION_TIME * 2;
      if (n.adj.length == 0) total_animation_time -= 2;


      for (i = 0; i < n.adj.length; i++) {
        e = n.adj[i];
        n2 = e.n2;
        b_dist = e.weight + dist;
        

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
        
        e_text = "Process edge ( " + e.id + " ): ";
        e_text += "New Distance = " + dist + " + " + e.weight + " = " + (dist + e.weight); 


        // color the edge red
        ani.add_parallel_ani({ target:line, prop: line_prop});

        // generate shadow for adj node
        ani.add_parallel_ani({ target:n2.ani_circle, prop: adj_prop})


        // animation of highlighting the node in the table
        ani.add_sequence_ani({ 
          pause: 1, 
          text: e_text,
          action: { params: {g:g, node:n2.shallow_copy()}, func: hightlight_col},
          rev_action : { params: {g:g, node:pre_n}, func: hightlight_col },
          concurrence:true 
        });

        pre_n = n2.shallow_copy();
        ani.add_sequence_ani({pause:ANIMATION_TIME, prop:{step:true}});

        total_animation_time += ANIMATION_TIME;
        if (n2.distance == -1 || n2.distance > b_dist) {
          
          if (n2.distance != -1) {
            ani.add_sequence_ani({
               pause:1,
               action: {params: { node_q: copy_list(node_q), 
                                  dist_q: dist_q.deep_copy(), 
                                  hightlight_node: n2.shallow_copy()},
               func: multimap_content },
               rev_action: { params: {content: pre_multimap_content }, func: update_multimap_content },
               concurrence:true
            });
            pre_multimap_content = $("#multimap_t").text();

            ani.add_sequence_ani({
              pause:ANIMATION_TIME, 
              text: "node {} is in the multimap, remove it".format(n2.id),
              prop: {step:true}
            });

            node_q.erase(n2.itr);
            dist_q.erase_value(n2.distance);

            // animation of earsing it.
            ani.add_sequence_ani({
               pause:1,
               action: {params: { node_q:copy_list(node_q), 
                                  dist_q: dist_q.deep_copy(), 
                                  hightlight_node: null},
               func: multimap_content },
               rev_action: { params: {content: pre_multimap_content }, func: update_multimap_content },
               concurrence:true
            });
            pre_multimap_content = $("#multimap_t").text();
            total_animation_time += ANIMATION_TIME;

          }
          n2.distance = b_dist;
          n2.backedge = e;
          pos = dist_q.insert_sort(b_dist);
          n2.itr = node_q.insert_before_pos(n2, pos);

          ani.add_sequence_ani({
               pause:1,
               action: {params: { node_q:copy_list(node_q), 
                                  dist_q: dist_q.deep_copy(), 
                                  hightlight_node: n2.shallow_copy()},
               func: multimap_content },
               rev_action: { params: {content: pre_multimap_content }, func: update_multimap_content },
               concurrence:true
          });
          pre_multimap_content = $("#multimap_t").text();

          ani.add_sequence_ani({ 
            pause: 1, 
            action: { params: {g:g, node:n2.shallow_copy()}, func: hightlight_col},
            rev_action: { params: {g:g, node:pre_n}, func: hightlight_col },
            concurrence:true 
          })
          pre_n = n2.shallow_copy();


          ani.add_sequence_ani({
            pause: ANIMATION_TIME,
            text: "Update node {} and insert ({}, {}) to multimap".format(n2.id, b_dist, e.n2.id),
            prop: {step: true}
          })
          total_animation_time += ANIMATION_TIME;
           // console.log(dist_q);
        }

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


      // we add one here becsuse we want to keep this effect after the last adj node is vivisted.
      ani.add_sequence_ani({pause:2});
      total_animation_time += 2;
      node_prop.end = total_animation_time; 
      console.log(node_prop.start, node_prop.end);
      // pasue on 3 because we want this happen after prop.end.

      
      ani.add_sequence_ani( { pause:1,
                              action: { params: {obj: circle, ctx_prop:update_dict(circle.ctx_prop, VISITED_NODE_CTX)}, func: update_ctx_prop} } );

      total_animation_time += 1;
      // break;
      
      // console.log(dist, node);
    }

    console.log(g.get_node(5).distance);

    ani.run_animation();
  }
}