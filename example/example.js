/*
  ChaoHui Zheng
  11/22/2020
*/

function change_color(dict) {
  let target = dict.target;
  
  /* fillStyles hold the color of each sub-rect in Rect 
     by doing this we change the color of sub-rect permanently.
  */
  target.fillStyles[0] = "pink";
  target.fillStyles[3] = "lightblue";
}

/* a good example to start with sorting algorithm animation */
function example1() {
  MAIN_A = {};
  MAIN_A.ani = new Animation();

  let ani = MAIN_A.ani;
 // Rect contructor (x, y, width, height, ref = "", text = [], label = "", label_position = "top", text_direction = 'v', ctx_prop = {}) {
  
  // we wanna lay out the texts horizontally. That's why the last parameter is "h".
  let rect = new Rect(0, 100, 500, 100, 0, [23, 54, 53, 23, 43], "Rect1", "bottom", "h");
  let rect1 = new Rect(0, 300, 100, 100, 1, [0], "Temp Value", "bottom", "v");

  // quadraticCurve constructor
  // (p1, p2, h_scale = 1/3, w_scale = 0.5, draw_arrow = true, text = "", text_direction = "right", ctx_prop = {} )
  let line = new quadraticCurve(new Point(50, 0), new Point(50, 100), h_scale = 0, 0, false, "123", "left", {lineWidth: 3, strokeStyle: "red"});

  // a line point to first block of rect.
  ani.add_object(line);


  // add rect to be part of object
  ani.add_object(rect);
  ani.add_object(rect1);

  // add swap animation
  ani.add_sequence_ani({
    target: rect,
    text: "start {} {} the animation example1 {}".format_b("123"),
    prop: {
      swap: {index1:0, index2: 3, w_scale: 0.2},
      time: 300,
    },
  })

  // we color the text entries 0 with pink and 3 with lightblue.
  // Any properties we specified stays within the time range we specify.
  // what if i want the color to stay forever after swaping. We can do that using "action". 
  // uncomment action . The pink and lightblue color will stay. 
  ani.add_sequence_ani({
    target: rect,
    prop: {
      swap: {index1:0, index2: 3}, 
      time: 300,
      fillStyle: ["pink", "#DDDDDD", "#DDDDDD", "lightblue", "#DDDDDD"],
      step: true, // we stop here if step-by-step animation is on.
    },
    // action: {params: {target: rect}, func: change_color},
    
  })

  // what if we want to copy a text field of rect to rect1
  // it copies rect's index1 entry to rect's index2 entry
  // h_scale, w_scale controls the path of copying. Change it to see how it change the path.
  ani.add_sequence_ani({
    target: rect,
    prop: {
      copy: {index1:2, rect: rect1, index2: 0, h_scale: 0, w_scale: 0},
      time: 2 * ANIMATION_TIME, // ANIMATION_TIME is 100 by default.
    },
    concurrence: true, // the next animation happens at the same time as this one.
  })


  // what if we want to move the pointer(line) to the next block.
  ani.add_sequence_ani({
    target:line,
    prop: {
      type: "parallel", // chnage to it "pivot" to see what happens.
      p: new Point(100, 0), // it moves the line along positive x-axis by 100.
    }
  })


  ani.run_animation();
}