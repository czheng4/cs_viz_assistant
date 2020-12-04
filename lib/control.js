/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/24/2020
  last modified 12/03/2020
*/

$(document).ready(function(){
  
	$("#go_forward").click(function(){
    MAIN_A.ani.reverse = false;
    REVERSE_ANIMATION = false;
    MAIN_A.ani.resume_animation();
  })

  $("#go_back").click(function() { 
    MAIN_A.ani.reverse_animation();
    MAIN_A.ani.resume_animation();
  })

  $("#speed").change(function() {
    D_ANIMATION_TIME = 100 - $(this).val();
  });

  $("#step_by_step").change(function() {
    MAIN_A.ani.step_by_step = $(this).is(":checked");
  })

  $("#script").click(function(){

    console.log("123", SCRIPT);
    // if (SCRIPT == null) {
    SCRIPT = window.open("", "Script", "width = 500, height = 300");
    SCRIPT.document.write('<link rel="stylesheet" href="../../../style/style.css">');

    if (MAIN_A != null && "ani" in MAIN_A) MAIN_A.ani.link_text();
    // }  
  }) 



  /* close the script windows */
  $(window).on('beforeunload', function(){
    if (SCRIPT != null) {
      SCRIPT.close();
    }
  });
  $("body").keypress(function(e) {
    
    console.log(e.keyCode);
    if (e.keyCode == 74 || e.keyCode == 106) { // 'j'
      $(":input").blur();
      if (!$("#go_back").prop("disabled")) $("#go_back").click();
    }

    if (e.keyCode == 75 || e.keyCode == 107) {
      $(":input").blur();
      if (!$("#go_forward").prop("disabled")) $("#go_forward").click();
      
    }

    if (e.keyCode == 76 || e.keyCode == 108) {

      if (!$("#step_by_step").prop("disabled")) {
        MAIN_A.ani.step_by_step = !$("#step_by_step").is(":checked");
        $("#step_by_step").prop("checked", MAIN_A.ani.step_by_step);
      }
    }
   
  });
})