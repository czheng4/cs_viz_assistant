
$(document).ready(function(){
	$("#step_forward").click(function(){
    a.ani.reverse = false;
    REVERSE_ANIMATION = false;
    a.ani.resume_animation();
  })

  $("#step_back").click(function() { 
    a.ani.reverse_animation();
    a.ani.resume_animation();
  })

  $("#speed").change(function() {
    ANIMATION_TIME = 100 - $(this).val();

  });

  $("#step_by_step").change(function() {
    a.ani.step_by_step = $(this).is(":checked");
  })


  $("#draw").mousedown(function(e) {
    a.ani.mouse_down(e.pageX, e.pageY);

  })

  $("#draw").mouseup(function(e) {

    a.ani.mouse_up(e.pageX, e.pageY);
  })

  $("#draw").mousemove(function(e) {
    a.ani.mouse_move(e.pageX, e.pageY);
  })

  $("body").keypress(function(e) {
    
    console.log(e.keyCode);
    if (e.keyCode == 119 || e.keyCode == 87) { // 'w' and 'W'
      PRESS_W_KEY = true;
    }

    if (e.keyCode == 68 || e.keyCode == 100) { // 'd' and 'D'
      PRESS_D_KEY = true;
    }

    if (e.keyCode == 13) {
      // console.log($("input:focus"));
    }
  })

  $("body").keyup(function() {
    PRESS_W_KEY = false;
    PRESS_D_KEY = false;
  })
})