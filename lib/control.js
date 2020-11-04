
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
    a.ani.mouse_up();
  })

  $("#draw").mousemove(function(e) {
    a.ani.mouse_move(e.pageX, e.pageY);
  })
})