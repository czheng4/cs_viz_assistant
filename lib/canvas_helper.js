/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/24/2020
*/

String.prototype.format = function() {
  let a = this;
  let b;
  for (b in arguments) {
    a = a.replace(/{}/, arguments[b]);
  }
  return a;
};

String.prototype.format_b = function() {
  let a = this;
  let b;
  for (b in arguments) {
    a = a.replace(/{}/, BLUE_SPAN + arguments[b] + "</span>");
  }
  return a;
};


function set_canvas(width, height, translate_x = 0, translate_y = 0) {
  var canvas = document.getElementById("draw");
  // var scale = window.devicePixelRatio;  
  
  canvas.style.width = width + "px"; 
  canvas.style.height = height + "px"; 
  canvas.width = Math.floor(width * 1); 
  canvas.height = Math.floor(height * 1); 
  OFFSET_X = $("#draw").position().left;
  OFFSET_Y = $("#draw").position().top;
  
  TRANSLATE_X = translate_x;
  TRANSLATE_Y = translate_y;

  OFFSET_X += translate_x;
  OFFSET_Y += translate_y;

  // canvas.getContext("2d").scale(scale, scale);
  canvas.getContext("2d").translate(translate_x, translate_y);
}


function reset_canvas_offset() {
  OFFSET_X = TRANSLATE_X + $("#draw").position().left;
  OFFSET_Y = TRANSLATE_Y + $("#draw").position().top;
}

function input_empty_check(v, trim = true) {
  let tmp = v;
  if (trim) tmp = tmp.trim();
  if (tmp == "") return true;
  else return false;
}

function add_quotes(v) {
  return '"' + v + '"';
}
