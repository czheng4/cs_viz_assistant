/*
  ChaoHui Zheng
  11/22/2020
*/
String.prototype.format = function() {
  let a = this;
  let b;
  for (b in arguments) {
    a = a.replace(/{}/, arguments[b]);
  }
  return a;
};



function set_canvas(width, height, translate_x = 0, translate_y = 0) {
  var canvas = document.getElementById("draw");
  var scale = window.devicePixelRatio;  
  
  canvas.style.width = width + "px"; 
  canvas.style.height = height + "px"; 
  canvas.width = Math.floor(width * scale); 
  canvas.height = Math.floor(height * scale); 
  OFFSET_X = $("#draw").position().left;
  OFFSET_Y = $("#draw").position().top;
  
  OFFSET_X += translate_x;
  OFFSET_Y += translate_y;

  canvas.getContext("2d").scale(scale, scale);
  canvas.getContext("2d").translate(translate_x, translate_y);
}


