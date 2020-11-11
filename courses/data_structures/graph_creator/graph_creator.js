function download(filename, text) {
  $("#download").attr("href", 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  $("#download").attr("download", filename);
  $("#download")[0].click();
}

function generate_graph_file_content(g) {
  let str = "";
  let circle, line, e;

  if (g.graph_type == "undirect") str += "TYPE UNDIRECTED\n";
  else str += "TYPE DIRECTED\n";

  for (let key in g.node_map) {
    circle = g.node_map[key].ani_circle;
    str += "NODE {} POS {} {} RADIUS {} COL {}\n".format(circle.ref, circle.x, circle.y, circle.r, circle.ctx_prop.fillStyle);
  }

  for (let key in g.edge_map) {
    e = g.edge_map[key];
    line = e.ani_line;
    str += "EDGE {} {} {} COL {} WIDTH {} TEXT_T {}\n".format(e.n1.id, e.n2.id, e.weight, 
                                                              line.ctx_prop.strokeStyle,
                                                              line.ctx_prop.lineWidth,
                                                              line.text_t);
  }

  return str;
}


$(document).ready(function(){
  var g = MAIN_G;
  
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
        MAIN_G_SPEC.edge_color = $(this).spectrum("get").toHexString();
        if(g != null) {
          g.edge_color = MAIN_G_SPEC.edge_color;
        }
      },

    });
  }

  $("#node_radius").change(function() {
    MAIN_G_SPEC.node_radius = $(this).val();
    if (g != null) g.node_radius = MAIN_G_SPEC.node_radius;
  })

  $("#edge_width").change(function() {
    MAIN_G_SPEC.edge_width = $(this).val();
    if (g != null) g.edge_width = MAIN_G_SPEC.edge_width;
  })

 
  $("#download_graph").click(function() {
    download("graph.txt", generate_graph_file_content(g));
  })

  $("#import_graph").click(function(){

    $("#import_input").click();
  })

  $("#import_input").change(function() {

    let reader = new FileReader();
    let files = $(this)[0].files;

    if (files.length == 0) return;
    reader.onload = function () {
      let data = reader.result;
      let i, j, size, x, y;
      let str, specifier, graph_type, layout, weight, grid_size, sub_specifier;
      let node, edge, circle, line, from, to;
      let tmp_g, tmp_ani;
      
      graph_type = "undirect";
      layout = "grid";
     
      data = data.replace(/\n/g,'');
      data = data.replace(/EDGE|NODE|TYPE|NODES|LAYOUT/ig,'\n$&');
      data = data.split('\n');
      console.log(data);
      
      tmp_ani = new Animation();
      tmp_g = new Graph(tmp_ani);
      tmp_g.weight_type = T_STRING;
      for (i = 0; i < data.length; i++) {
        str = data[i]
        if (str == "") continue;

        weight = "";
        str = str.trim();
        str = str.split(/[ ]+/);
        specifier = str[0].toUpperCase();
        size = str.length;
       
        if (specifier == "NODE") {
          j = 1;
          sub_specifier = "NODE"
          while (1) {
            if (j == size) {
              break;
            } else if (sub_specifier == "NODE") {
              if (size < j + 1) {
                $("#elaboration_text").text("\"{}\" is not a valid node. Importing graph failed".format(data[i]));
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
                $("#elaboration_text").text("\"{}\". Position spec is not valid. Importing graph failed".format(data[i]));
                return;
              }
              circle = node.ani_circle;
              x = parseFloat(str[j]); j++;
              y = parseFloat(str[j]); j++;
              if (isNaN(x) || isNaN(y)) {
                $("#elaboration_text").text("\"{}\". Position spec is not valid. Importing graph failed".format(data[i]));
                return;
              }
              console.log(node, circle);
              circle.move(x - circle.x, y - circle.y)
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
         
          while(1) {

             console.log(sub_specifier, size, j);
            if (j == size) {
              break;
            } else if (sub_specifier == "EDGE") {
              if (size < j + 2) {
                $("#elaboration_text").text("\"{}\". Edge spec is not valid. Importing graph failed".format(data[i]));
              }
              from = tmp_g.get_node(str[j]); j++;
              to = tmp_g.get_node(str[j]); j++;
              weight = "";
              for (j; j < size; j++) {
                if(str[j].toUpperCase().indexOf("COL") != -1 || 
                   str[j].toUpperCase().indexOf("WIDTH") != -1 ||
                   str[j].toUpperCase().indexOf("TEXT_T") != -1) break;
                weight += str[j];
              }


              edge = tmp_g.get_edge(from, to, weight.trim());

              
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
            graph_type = "undirect";
          } else if (str[1].toUpperCase().indexOf("DIRECT") != -1) {
            graph_type = "direct";
          } else {
            $("#elaboration_text").text("\"{}\" is not a graph type. Importing graph failed".format(data[i]));
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
            $("#elaboration_text").text("\"{}\" is not a layout. Importing graph failed".format(data[i]));
            return;
          }
          tmp_g.layout = layout;

        } 
        
      }

      tmp_g.draw();
      tmp_g.node_color = MAIN_G_SPEC.node_color;
      tmp_g.edge_color = MAIN_G_SPEC.edge_color;
      tmp_g.edge_width = MAIN_G_SPEC.edge_width;
      tmp_g.node_radius = MAIN_G_SPEC.node_radius;
      
      g = tmp_g;
      MAIN_G = g;
      MAIN_A.ani = tmp_ani;
      
      console.log(g.graph_type);
      $("#directed").attr("checked", false);
      $("#undirected").attr("checked", false);

      if (g.graph_type == "direct") $("#directed").attr("checked", true);
      else $("#undirected").attr("checked", true);
      
     
      
    };
    
    reader.readAsText(files[0]);
    $(this).val(''); // for firing event when selectinhg the same file.
  })

  $("#clear_graph").click(function(){
    let ani;
    $("input[name=graph_type]").prop("disabled", false);
    ani = new Animation();
    g = null;
    MAIN_G = null;
    MAIN_A.ani = ani;
    ani.draw();
  })


 
  $("#add_node").click(function() {
    
    let id, graph_type, ani;
    if (g == null) {
      graph_type = $("input[name=graph_type]:checked").val();
      ani = new Animation();
      MAIN_A.ani = ani;
      g = new Graph(ani, graph_type);
      g.node_color = MAIN_G_SPEC.node_color;
      g.edge_color = MAIN_G_SPEC.edge_color;
      g.edge_width = MAIN_G_SPEC.edge_width;
      g.node_radius = MAIN_G_SPEC.node_radius;

      MAIN_G = g;
      $("input[name=graph_type]").prop("disabled", true);
    }

    id = $("#node_t").val();
    id = id.replace(/\s/g,'');
    if (id == "") {
      $("#elaboration_text").text("node id is empty");
    } else if (g.is_node(id)) {
      $("#elaboration_text").text(id + " exists");
    } else {
      g.get_node(id);
      g.draw();
    }
    $("#node_t").val("");
    $("#node_t").focus();
    console.log(MAIN_A.ani.obj_map);
  })

  $("#remove_node").click(function() {
    let id;

    if (g == null) return;
    
    id = $("#node_t").val();
    id = id.replace(/\s/g,'');
   
    if (id == "") {
      $("#elaboration_text").text("node id is empty");
    } else if (!g.is_node(id)) {
      $("#elaboration_text").text(id + " doesn't exist");
    } else {
      g.remove_node(id);
      g.draw();
    }
    $("#node_t").val("");
    $("#node_t").focus();
   
  })


  $("#remove_edge").click(function() {
    let id1, id2, weight;
    let n1, n2;
    let e;
    let str = $("#edge_t").val();

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
        $("#elaboration_text").text("node " + id1 + " doesn't exist");
      } else if (!g.is_node(id2)) {
        $("#elaboration_text").text("node " + id2 + " doesn't exist");

      } else {
        n1 = g.get_node(id1);
        n2 = g.get_node(id2);
        
        if (!g.is_edge(n1, n2)) {
          $("#elaboration_text").text("Edge " + n1.id + "->" + n2.id + " doesn't exist");
        } else {
          g.remove_edge(n1, n2);
          g.draw();
        }
      }

      $("#edge_t").val("");
      $("#edge_t").focus();

    }
  })
  $("#add_edge").click(function() {
    let id1, id2, weight;
    let n1, n2;
    let e;
    let i;
    let str = $("#edge_t").val();
    str = str.trim();
    str = str.split(/[ ,]+/);

    if (g == null) {
      $("#elaboration_text").text("must create node first");
    } else if (g.weight_type != T_STRING && g.weight_type != T_CONSTANT && str.length != 3) {
      $("#elaboration_text").text("add_edge: node_id1 node_id2 weight");
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
        $("#elaboration_text").text("node " + id1 + " doesn't exist");
      } else if (!g.is_node(id2)) {
        $("#elaboration_text").text("node " + id2 + " doesn't exist");

      } else {
        n1 = g.get_node(id1);
        n2 = g.get_node(id2);
        
        console.log(weight);
        g.get_edge(n1, n2, weight);
        g.draw();
        
      }
      $("#edge_t").val("");
      $("#edge_t").focus();
    }
    
  })


});