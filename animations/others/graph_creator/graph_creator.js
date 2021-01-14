/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/24/2020
  last modified 12/04/2020
*/
const NODE_COLORS = ['#DDDDDD', 'pink', 'lightblue', 'yellow'];
const EDGE_COLORS = ["black", "red", "blue", "#FFB901"];
function download(filename, text) {
  $("#download").attr("href", 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  $("#download").attr("download", filename);
  $("#download")[0].click();
}

function generate_graph_file_content(g) {
  let str = "";
  let circle, line, e;


  str =  "#### Contact: ChaoHui Zheng(czheng4@vols.utk.edu)\n";
  str += "#### Please do not change this file. Any unexpected content changes may cause an error when importing\n\n";

  if (g.original_graph != null) g = g.original_graph;
  if (g.graph_type == "undirect" || g.graph_type == "undirected") str += "TYPE UNDIRECTED\n";
  else str += "TYPE DIRECTED\n";

  str += "TRANSLATE_X " + TRANSLATE_X + "\n";
  str += "TRANSLATE_Y " + TRANSLATE_Y + "\n";

  for (let key in g.node_map) {
    circle = g.node_map[key].ani_circle;
    str += "NODE {} POS {} {} RADIUS {} COL {}\n".format(circle.ref, circle.x, circle.y, circle.r, circle.ctx_prop.fillStyle);
  }

  for (let key in g.edge_map) {
    e = g.edge_map[key];
    line = e.ani_line;
    str += "EDGE {} {} {} COL {} WIDTH {} TEXT_T {} TEXT_DIR {}\n".format(e.n1.id, e.n2.id, e.weight, 
                                                              line.ctx_prop.strokeStyle,
                                                              line.ctx_prop.lineWidth,
                                                              line.text_t,
                                                              line.text_direction);
  }

  return str;
}

$(document).ready(function(){
  
  if ("spectrum" in $("#node_color")) {
    $('#node_color').spectrum({
      type: "color",
      showPalette: "false",
      showPaletteOnly: "true",
      hideAfterPaletteSelect: "true",
      showAlpha: "false",
      showButtons: "false",
      allowEmpty: "false",

      color: '#DDDDDD',
      palette: [
          ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
          ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
          ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
          ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
          ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
          ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
          ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
          ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
      ],
      hide: function(color) {
        let g = MAIN_G;
        MAIN_G_SPEC.node_color = $(this).spectrum("get").toHexString();
        if(g != null) {
          g.node_color = MAIN_G_SPEC.node_color;
        }
      },

    });
  }


  if ("spectrum" in $("#edge_color")) {
    $('#edge_color').spectrum({
      type: "color",
      showPalette: "false",
      showPaletteOnly: "true",
      hideAfterPaletteSelect: "true",
      showAlpha: "false",
      showButtons: "false",
      allowEmpty: "false",

      color: 'black',
      palette: [
          ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
          ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
          ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
          ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
          ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
          ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
          ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
          ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
      ],
      hide: function(color) {
        let g = MAIN_G;
        MAIN_G_SPEC.edge_color = $(this).spectrum("get").toHexString();
        if(g != null) {
          g.edge_color = MAIN_G_SPEC.edge_color;
        }
      },

    });
  }

  $("#node_radius").change(function() {
    let g = MAIN_G;
    let val = parseInt($(this).val());

    if (val > 50) {
      elaboration_append("Radius must be <= 50");
      val = 50;
    } else if (val < 15) {
      elaboration_append("Radius must be >= 15");
      val = 15;
    }
    $(this).val(val);
    MAIN_G_SPEC.node_radius = val;
    if (g != null) g.node_radius = MAIN_G_SPEC.node_radius;
  });

  $("#edge_width").change(function() {
    let g = MAIN_G;
    let val = parseInt($(this).val());
    if (val > 5) {
      elaboration_append("Line width must be <= 5");
      val = 5;
    } else if (val < 1) {
      elaboration_append("Line width must be >= 1");
      val = 1;
    }
    $(this).val(val);
    MAIN_G_SPEC.edge_width = val;
    if (g != null) g.edge_width = MAIN_G_SPEC.edge_width;
    MAIN_A.ani.draw();
  });
 
  $("#download_graph").click(function() {
    download("graph.txt", generate_graph_file_content(MAIN_G));
  });

  $("#import_graph").click(function(){
    $("#import_input").click();
  });

  $("#import_input").change(function() {

    let reader = new FileReader();
    let files = $(this)[0].files;
    let g = MAIN_G;

    if (files.length == 0) return;
    reader.onload = function () {
      let data = reader.result;
      let i, j, size, x, y, dx, dy;
      let str, specifier, graph_type, layout, weight, grid_size, sub_specifier, translate_x, translate_y;
      let node, edge, circle, line, from, to;
      let tmp_g, tmp_ani;
      
      graph_type = "";
      layout = "grid";
     
      data = data.replace(/\n/g,'');
      data = data.replace(/EDGE|NODE|TYPE|NODES|LAYOUT|TRANSLATE_X|TRANSLATE_Y/ig,'\n$&');
      data = data.split('\n');
      // console.log(data);
      
      tmp_ani = new Animation();
      tmp_g = new Graph(tmp_ani);
      translate_x = 0;
      translate_y = 0;
      
      try {
        for (i = 0; i < data.length; i++) {
          str = data[i];
          if (str == "") continue;

          weight = "";
          str = str.trim();
          str = str.split(/[ ]+/);
          specifier = str[0].toUpperCase();
          size = str.length;
          
          if (specifier.indexOf("#") != -1) continue;
          if (specifier == "NODE") {
            if (graph_type == "") {
              $("#elaboration_text").text("graph type must be specified before Node/Edge");
              return;
            }
            j = 1;
            sub_specifier = "NODE";
            while (1) {
              if (j == size) {
                break;
              } else if (sub_specifier == "NODE") {
                if (size < j + 1) {
                  elaboration_append("\"{}\" is not a valid node. Importing graph failed".format_n(data[i]));
                  return;
                }
                node = tmp_g.get_node(str[j]);
                j++;
                sub_specifier = "";
              } else if (sub_specifier.indexOf("COL") != -1) {
                node.ani_circle.ctx_prop.fillStyle = str[j];
                j++;
                sub_specifier = "";
              } else if (sub_specifier.indexOf("POS") != -1) {
                if (size < j + 2) {
                  elaboration_append("\"{}\". Position spec is not valid. Importing graph failed".format_b(data[i]));
                  return;
                }
                circle = node.ani_circle;
                x = parseFloat(str[j]); j++;
                y = parseFloat(str[j]); j++;
                if (isNaN(x) || isNaN(y)) {
                  elaboration_append("\"{}\". Position spec is not valid. Importing graph failed".format_b(data[i]));
                  return;
                }
                // console.log(node, circle);
                circle.move(x - circle.x, y - circle.y);
                sub_specifier = "";
              } else if (sub_specifier.indexOf("RADIUS") != -1) {
                circle.r = parseFloat(str[j]);
                j++;
                sub_specifier = "";

              } else {
                sub_specifier = str[j].toUpperCase();
                j++;
              }


            }
           
          } else if (specifier == "EDGE") {
            j = 1;
            sub_specifier = "EDGE";
            if (graph_type == "") {
              $("#elaboration_text").text("graph type must be specified before Node/Edge");
              return;
            }
            while(1) {

               // console.log(sub_specifier, size, j);
              if (j == size) {
                break;
              } else if (sub_specifier == "EDGE") {
                if (size < j + 2) {
                  elaboration_append("\"{}\". Edge spec is not valid. Importing graph failed".format_b(data[i]));
                  return;
                }
                from = tmp_g.get_node(str[j]); j++;
                to = tmp_g.get_node(str[j]); j++;
                weight = "";
                for (j; j < size; j++) {
                  if(str[j].toUpperCase().indexOf("COL") != -1 || 
                     str[j].toUpperCase().indexOf("WIDTH") != -1 ||
                     str[j].toUpperCase().indexOf("TEXT_T") != -1 ||
                     str[j].toUpperCase().indexOf("TEXT_DIR") != -1) break;
                  weight += str[j];
                }

                edge = tmp_g.get_edge(from, to, weight.trim());
                if (edge == null) {
                  elaboration_append("Weight \"{}\" is not valid. Importing graph failed".format_b(weight));
                  return;
                }
                // console.log(from, to, edge, weight.trim());
                
                sub_specifier = "";
              } else if (sub_specifier.indexOf("COL") != -1) {
                edge.ani_line.ctx_prop.strokeStyle = str[j];
                j++;
                sub_specifier = "";
              } else if (sub_specifier.indexOf("WIDTH") != -1) { 
                edge.ani_line.ctx_prop.lineWidth = parseFloat(str[j]);
                j++;
                sub_specifier = "";
              } else if (sub_specifier.indexOf("TEXT_T") != -1){
                edge.ani_line.text_t = parseFloat(str[j]);
                j++;
                sub_specifier = "";
              } else if (sub_specifier.indexOf("TEXT_DIR") != -1) {
                edge.ani_line.text_direction = str[j];
                j++;
              } else {
                sub_specifier = str[j].toUpperCase();
                j++;
              }
            
            }


          } else if (specifier == "TYPE") {
            if (size == 1) {
              $("#elaboration_text").text("Graph type is not specified. Importing graph failed");
              return;
            } else if (str[1].toUpperCase().indexOf("UNDIRECT") != -1) {
              graph_type = "undirected";
              if (!(MAIN_G_SPEC.graph_type & T_UNDIRECTED)) {
                $("#elaboration_text").text("Undirected graph type is not allowed");
                return;
              }
            } else if (str[1].toUpperCase().indexOf("DIRECT") != -1) {
              graph_type = "directed";
              if (!(MAIN_G_SPEC.graph_type & T_DIRECTED)) {
                $("#elaboration_text").text("Directed graph type is not allowed");
                return;
              }
            } else {
              elaboration_append("\"{}\" is not a graph type. Importing graph failed".format_b(data[i]));
              return;
            }

            tmp_g.graph_type = graph_type;

          } else if (specifier == "LAYOUT") {

            if (size == 1) {
              $("#elaboration_text").text("Layout is not specified. Importing graph failed");
              return;
            } else if (str[1].toUpperCase().indexOf("TREE") != -1) {
              layout = "tree";
            } else if (str[1].toUpperCase().indexOf("GRID") != -1) {
              layout = "grid"
            } else {
              elaboration_append("\"{}\" is not a layout. Importing graph failed".format_b(data[i]));
              return;
            }
            tmp_g.layout = layout;

          } else if (specifier == "TRANSLATE_X") {
            if (size != 2) {
              $("#elaboration_text").text("TRANSLATE_X NUMBER. Importing graph failed");
              return;
            }
            translate_x = parseInt(str[1]);
            if (isNaN(translate_x)) {
              $("#elaboration_text").text("TRANSLATE_X NUMBER. Importing graph failed");
              return;
            }
          } else if (specifier == "TRANSLATE_Y") {
            if (size != 2) {
              $("#elaboration_text").text("TRANSLATE_Y NUMBER. Importing graph failed");
              return;
            }
            translate_y = parseInt(str[1]);
            if (isNaN(translate_y)) {
              $("#elaboration_text").text("TRANSLATE_Y NUMBER. Importing graph failed");
              return;
            }
          }
          
        }
      } catch(err) {
        $("#elaboration_text").text("Unknown error when importing graph");
        return;
      }

      dx = translate_x - TRANSLATE_X;
      dy = translate_y - TRANSLATE_Y;
  
      for (let key in tmp_g.node_map) {
        tmp_g.node_map[key].ani_circle.move(dx, dy);
      }

      tmp_g.draw();


      if ("make_new" in MAIN_A) MAIN_A = MAIN_A.make_new();
      MAIN_G = tmp_g;
      MAIN_A.ani = tmp_ani;
      MAIN_A.ani.step_by_step = $("#step_by_step").is(":checked");
      if ("g" in MAIN_A) MAIN_A.g = MAIN_G;

      $(":button").prop("disabled", false);
      $(":input").prop("disabled", false);

      $("#go_back").prop("disabled", true);
      $("#go_forward").prop("disabled", true);

      if (MAIN_G.graph_type == "direct" || MAIN_G.graph_type == "directed") {
        $("#directed").attr("checked", true);
      } else {
        $("#undirected").prop("checked", true);
      }
      
  
      $("input[name=graph_type]").prop("disabled", true);

      // console.log(MAIN_G);
     
      
    };
    
    reader.readAsText(files[0]);
    $(this).val(''); // for firing event when selectinhg the same file.
  });

  $("#clear_graph").click(function(){
    let ani;

    $(":button").prop("disabled", false);
    $(":input").prop("disabled", false);

    $("#go_back").prop("disabled", true);
    $("#go_forward").prop("disabled", true);

    if ("make_new" in MAIN_A) MAIN_A = MAIN_A.make_new();
    else {
      ani = new Animation();
      MAIN_A.ani = ani;
    }
    MAIN_A.ani.step_by_step = $("#step_by_step").is(":checked");
    MAIN_G = null;
    MAIN_A.ani.draw();
  });

  $("#modify_original_graph").click(function(){
    if (MAIN_A == null || MAIN_G == null || MAIN_G.original_graph == null) return;

    $(":button").prop("disabled", false);
    $(":input").prop("disabled", false);

    $("#go_back").prop("disabled", true);
    $("#go_forward").prop("disabled", true);
    $("input[name=graph_type]").prop("disabled", true);

    if ("make_new" in MAIN_A) MAIN_A = MAIN_A.make_new();
    MAIN_G = MAIN_G.original_graph;
    MAIN_A.ani = MAIN_G.ani;
    MAIN_A.g = MAIN_G;
    MAIN_A.ani.step_by_step = $("#step_by_step").is(":checked");

    MAIN_A.ani.draw();
  });


 
  $("#add_node").click(function() {
    
    let id, graph_type, ani;
    let g = MAIN_G;

    if (g == null) {
      graph_type = $("input[name=graph_type]:checked").val();
      g = new Graph(MAIN_A.ani, graph_type);
      MAIN_A.g = g;

      MAIN_G = g;
      $("input[name=graph_type]").prop("disabled", true);
    }

    id = $("#node_t").val();
    id = id.replace(/\s/g,'');


    if (id == "") {
      $("#elaboration_text").text("node id is empty");
    } else if (!id.match("^[a-zA-Z0-9_-]+$")) {
      $("#elaboration_text").text("node id must only conatin letters, digits, -, or _");
    } else if (g.is_node(id)) {
      elaboration_append("{} exists".format_b(id));
    } else {
      elaboration_append("Add node {} successfully".format_b(id));
      g.get_node(id);
      g.draw();
    }
    $("#node_t").val("");
    $("#node_t").focus();
    // console.log(MAIN_A.ani.obj_map);
  });

  $("#remove_node").click(function() {
    let id;
    let g = MAIN_G;
    if (g == null) return;
    
    id = $("#node_t").val();
    id = id.replace(/\s/g,'');
   
    if (id == "") {
      $("#elaboration_text").text("node id is empty");
    } else if (!g.is_node(id)) {
      elaboration_append("Node {} doesn't exist".format_b(id));
    } else {
      elaboration_append("Remove node {} successfully".format_b(id));
      g.remove_node(id);
      g.draw();
    }
    $("#node_t").val("");
    $("#node_t").focus();
   
  });


  $("#remove_edge").click(function() {
    let id1, id2, weight;
    let n1, n2;
    let e;
    let str = $("#edge_t").val();
    let g = MAIN_G;
    str = str.trim();
    str = str.split(/[ ,]+/);

    if (g == null) {
      $("#elaboration_text").text("must create node first");
    } else if (str.length != 2) {
      $("#elaboration_text").text("remove_edge: node_id1 node_id2");
    } else {
      id1 = str[0];
      id2 = str[1];
     
      if (!g.is_node(id1)) {
        elaboration_append("Node {} does not exist".format_b(id1));
      } else if (!g.is_node(id2)) {
        elaboration_append("Node {} does not exist".format_b(id2));

      } else {
        n1 = g.get_node(id1);
        n2 = g.get_node(id2);
        
        if (!g.is_edge(n1, n2)) {
          elaboration_append("Edge {} does not exist".format_b(pretty_edge(n1, n2)));

        } else {
          elaboration_append("Remove Edge {} successfully".format_b(pretty_edge(n1, n2)));
          g.remove_edge(n1, n2);
          g.draw();
        }
      }

      $("#edge_t").val("");
      $("#edge_t").focus();

    }
  });
  $("#add_edge").click(function() {
    let id1, id2, weight;
    let n1, n2;
    let e;
    let i;
    let str = $("#edge_t").val();
    let g = MAIN_G;
    
    str = str.trim();
    str = str.split(/[ ,]+/);

    if (g == null) {
      $("#elaboration_text").text("must create node first");
    } else if (str.length < 2) {
      $("#elaboration_text").text("add_edge: node_id1 node_id2 [weight]");
    } else if (g.weight_type != T_STRING && g.weight_type != T_CONSTANT && str.length != 3) {
      $("#elaboration_text").text("add_edge: node_id1 node_id2 [weight]");
    } else {
      id1 = str[0];
      id2 = str[1];

      weight = "";
      for (i = 2; i < str.length; i++) {
        if (i != 2) weight += " ";
        weight += str[i];
      }
      if (g.weight_type != T_STRING && g.weight_type != T_CONSTANT && isNaN(parseFloat(weight))) {
        $("#elaboration_text").text("add_edge: weight is not valid");
      } else if (!g.is_node(id1)) {
        elaboration_append("Node {} does not exist".format_b(id1));
      } else if (!g.is_node(id2)) {
        elaboration_append("Node {} does not exist".format_b(id2));

      } else {
        n1 = g.get_node(id1);
        n2 = g.get_node(id2);
        
        
        e = g.get_edge(n1, n2, weight);
        if (e == null) {
          elaboration_append("Weight {} is not valid".format_b(weight));
        } else {
          elaboration_append("Add/Update edge {} successfully".format_b(pretty_edge(n1, n2)));
        }
        g.draw();
        
      }
      $("#edge_t").val("");
      $("#edge_t").focus();
    }
    
  });



  // mouse and key event

  $("#draw").mousedown(function(e) {
    MAIN_A.ani.mouse_down(e.pageX, e.pageY);

  });

  $("#draw").mouseup(function(e) {

    MAIN_A.ani.mouse_up(e.pageX, e.pageY);
  });

  $("#draw").mousemove(function(e) {
    MAIN_A.ani.mouse_move(e.pageX, e.pageY);
  });

  $("body").keypress(function(e) {
    
    let color_swtich_num;

    if (e.keyCode == 119 || e.keyCode == 87) { // 'w' and 'W'
      PRESS_W_KEY = true;
    }

    if (e.keyCode == 68 || e.keyCode == 100) { // 'd' and 'D'
      PRESS_D_KEY = true;
    }

    if (e.keyCode == 67 || e.keyCode == 99) { // 'c' and 'C'
      PRESS_C_KEY = true;
    }

    if (e.keyCode == 84 || e.keyCode == 116) {
      PRESS_T_KEY = true;
    }

    if (e.keyCode >= 49 && e.keyCode <= 52) {
      color_swtich_num = e.keyCode - 49;
      
      if (MAIN_G != null)  {
        
        // press 'c' and number to change node color
        if (MAIN_G.enable_node_color_change && PRESS_C_KEY && ("spectrum" in $("#node_color")) ) {
          $("#node_color").spectrum("set", NODE_COLORS[color_swtich_num]);
          MAIN_G.node_color = NODE_COLORS[color_swtich_num];
        }

        // press 'w' and number to change edge color
        if (MAIN_G.enable_edge_color_change && PRESS_W_KEY && ("spectrum" in $("#edge_color")) ) {
          $("#edge_color").spectrum("set", EDGE_COLORS[color_swtich_num]);
          MAIN_G.edge_color = EDGE_COLORS[color_swtich_num];
        }
      }

    }
    if (e.keyCode == 13) {
      let id = $("input:focus").attr("id");
      
      if (id == "edge_t") $("#add_edge").click();
      else if (id == "node_t") $("#add_node").click();
     
      // console.log($("input:focus").attr("id"));
    }
  });

  $("body").keyup(function(e) {
    // console.log(e.keyCode, "up");
    if (e.keyCode == 119 || e.keyCode == 87) { // 'w' and 'W'
      PRESS_W_KEY = false;
    }

    if (e.keyCode == 68 || e.keyCode == 100) { // 'd' and 'D'
      PRESS_D_KEY = false;
    }

    if (e.keyCode == 67 || e.keyCode == 99) { // 'c' and 'C'
      PRESS_C_KEY = false;
    }

    if (e.keyCode == 84 || e.keyCode == 116) {
      PRESS_T_KEY = false;
    }
   
  });

});