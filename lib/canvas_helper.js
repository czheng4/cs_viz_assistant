function set_canvas(width, height) {
  var canvas = document.getElementById("draw");
  var scale = window.devicePixelRatio;  
  
  canvas.style.width = width + "px"; 
  canvas.style.height = height + "px"; 
  canvas.width = Math.floor(width * scale); 
  canvas.height = Math.floor(height * scale); 

  canvas.getContext("2d").scale(scale, scale)
}
