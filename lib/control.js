
$(document).ready(function(){
  const NODE_COLORS = ['#DDDDDD', 'pink', 'lightblue', 'yellow'];
  const EDGE_COLORS = ["black", "red", "blue", "#FFB901"];
	$("#step_forward").click(function(){
    MAIN_A.ani.reverse = false;
    REVERSE_ANIMATION = false;
    MAIN_A.ani.resume_animation();
  })

  $("#step_back").click(function() { 
    MAIN_A.ani.reverse_animation();
    MAIN_A.ani.resume_animation();
  })

  $("#speed").change(function() {
    ANIMATION_TIME = 100 - $(this).val();

  });

  $("#step_by_step").change(function() {
    MAIN_A.ani.step_by_step = $(this).is(":checked");
  })


  $("#draw").mousedown(function(e) {
    MAIN_A.ani.mouse_down(e.pageX, e.pageY);

  })

  $("#draw").mouseup(function(e) {

    MAIN_A.ani.mouse_up(e.pageX, e.pageY);
  })

  $("#draw").mousemove(function(e) {
    MAIN_A.ani.mouse_move(e.pageX, e.pageY);
  })

  $("body").keypress(function(e) {
    
    let color_swtich_num;
    console.log(e.keyCode);
    if (e.keyCode == 119 || e.keyCode == 87) { // 'w' and 'W'
      PRESS_W_KEY = true;
    }

    if (e.keyCode == 68 || e.keyCode == 100) { // 'd' and 'D'
      PRESS_D_KEY = true;
    }

    if (e.keyCode == 67 || e.keyCode == 99) { // 'c' and 'C'
      PRESS_C_KEY = true;
    }

    if (e.keyCode >= 49 && e.keyCode <= 52) {
      color_swtich_num = e.keyCode - 49;
      
      console.log(MAIN_G);
      if (MAIN_G != null)  {
        
        console.log(PRESS_C_KEY);
        // press 'c' and number to change node color
        if (MAIN_G.enable_node_color_change && PRESS_C_KEY && ("spectrum" in $("#node_color")) ) {
           console.log("123");
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
      // console.log($("input:focus"));
    }
  })

  $("body").keyup(function(e) {
    if (e.keyCode == 119 || e.keyCode == 87) { // 'w' and 'W'
      PRESS_W_KEY = false;
    }

    if (e.keyCode == 68 || e.keyCode == 100) { // 'd' and 'D'
      PRESS_D_KEY = false;
    }

    if (e.keyCode == 67 || e.keyCode == 99) { // 'c' and 'C'
      PRESS_C_KEY = false;
    }
   
  })
})