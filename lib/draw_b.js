class Bezier {

  constructor(x, y, cp1x, cp1y, cp2x, cp2y, dest_x, dest_y, ctx, lineWidth = 2, strokeStyle = 'black') {
    this.x = x
    this.y = y
    this.dest_x = dest_x;
    this.dest_y = dest_y;
    this.cp1x = cp1x;
    this.cp1y = cp1y;
    this.cp2x = cp2x;
    this.cp2y = cp2y;
    this.ctx = ctx;
    this.strokeStyle = strokeStyle;
    this.lineWidth = lineWidth;
  }

  draw() {
    let ctx = this.ctx;
  
   
    ctx.save();
    ctx.strokeStyle = this.strokeStyle;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(this.x,this.y);
    ctx.bezierCurveTo(this.cp1x, this.cp1y, this.cp2x, this.cp2y, this.dest_x, this.dest_y);
    ctx.stroke();
    ctx.restore();

  }

  draw_angle(position = 1, angle_length = 20, angle_degree = 30) {
    let coord, coord1;
    let line;
    if (position == 0) {
      coord = this.get_bezier_xy(position);
      coord1 = this.get_bezier_xy(position + 0.00001);
    } else {
      coord = this.get_bezier_xy(position - 0.00001);
      coord1 = this.get_bezier_xy(position);
    }
    
    line = new Line(coord.x,  coord.y, coord1.x, coord1.y, this.ctx, this.lineWidth, this.strokeStyle);

    line.draw_angle(1, angle_length, angle_degree);
  }

  /* 0 <= t <= 1. t decides the postion in the curve */
  get_bezier_xy(t) {
    let x = this.x,
        y = this.y,
        cp1x = this.cp1x,
        cp2x = this.cp2x,
        cp1y = this.cp1y,
        cp2y = this.cp2y,
        dest_x = this.dest_x,
        dest_y = this.dest_y;

    return {
      x: Math.pow(1-t,3) * x + 3 * t * Math.pow(1 - t, 2) * cp1x 
        + 3 * t * t * (1 - t) * cp2x + t * t * t * dest_x,
      y: Math.pow(1-t,3) * y + 3 * t * Math.pow(1 - t, 2) * cp1y 
        + 3 * t * t * (1 - t) * cp2y + t * t * t * dest_y
    };
  }

}