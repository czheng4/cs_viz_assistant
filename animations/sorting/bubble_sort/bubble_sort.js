/*
  Copyright (C) 2020, ChaoHui Zheng & Hunter Leef
  All rights reserved.
  
  12/16/2020
  Last Modified 12/25/2020
*/


class bubbleSortAnimation {
	constructor(v) {
    this.v = v;
    this.ani = new Animation();
    this.ss = 50; //square_size
    this.width = 900;
    this.margin = 75;

    let rect;
    let x = this.margin * 1.5;
    let y = 0;
    //constructor(x, y, width, height, ref = "", text = [], label = "", label_position = "top", text_direction = 'v', ctx_prop = {})
    rect = new Rect(x, y, v.length * this.ss, this.ss, 0, v, "", "bottom", "h");
    rect.font = "20px Arial";
    for (let i = 0; i < v.length; i++) rect.subrect_labels.push(i);
    rect.label_position = "top";
    this.ani.add_object(rect);
    this.ani.draw();

    this.bubble_sort(v, 0, rect, rect.x, rect.y, v.length);

  }


  run_animation() {
    this.ani.run_animation();
  }

 
  bubble_sort(v, level = 0, prev_rect = null, x, y, size) {
    let rv, v1, v2;
    let i, middle, lp, rp;
    let rect;
    // let x,y;
    let ani = this.ani;
    let p1, p2, p3, l1, l2;
    let dx, dy;
    let root_rect = this.root_rect;
    let fill_styles = [];
    let tmp_fill_styles;
    let e_text;
   
    let j, tmp;
    let v_c = deep_copy(v);
    for(i = 0; i < v.length; i++){
      fill_styles.push("#DDDDDD");
    }
    /* Bubble Sort */
    //console.log(v_c);
    for(i = 0; i < v.length - 1; i++){
      for(j = 0; j < v.length - i - 1; j++){
        if(v_c[j] > v_c[j + 1]){     
          fill_styles[j] = "pink";
          fill_styles[j + 1] = "lightblue";
          ani.add_sequence_ani({ 
            target: prev_rect,
            text: "Swap {} {} (array[{}])</span> and {} {} (array[{}])</span> because {} {}</span> > {} {}</span>".format(
                  RED_SPAN, v_c[j], j, 
                  BLUE_SPAN, v_c[j + 1], j + 1, RED_SPAN, v_c[j], BLUE_SPAN, v_c[j + 1]),
            prop: {
              fade_in: true,
              fillStyle: deep_copy(fill_styles),
              step: true,
              time: 1
            }
          });
          ani.add_sequence_ani({ 
            target: prev_rect,
            prop: {
              swap:{index1:j, index2:(j + 1), h_scale: 3},
              fillStyle: deep_copy(fill_styles),
              time: 3 * ANIMATION_TIME
            }
          });
          fill_styles[j + 1] = "pink";
          fill_styles[j] = "lightblue";
          ani.add_sequence_ani({
            target: prev_rect,
            prop: {
              fade_in: true,
              fillStyle: deep_copy(fill_styles),
              step: true,
              time: 1
            }
          });
          fill_styles[j] = "#DDDDDD";
          fill_styles[j + 1] = "#DDDDDD";

          tmp = v_c[j];
          v_c[j] = v_c[j + 1];
          v_c[j + 1] = tmp;
        }
        else{
          fill_styles[j] = "lightblue";
          fill_styles[j + 1] = "pink";
          ani.add_sequence_ani({ 
            target: prev_rect,
            text: "Do not swap {} {} (array[{}])</span> and {} {} (array[{}])</span> because {} {}</span> < {} {}</span>".format(
                  BLUE_SPAN, v_c[j], j, 
                  RED_SPAN, v_c[j + 1], j + 1, BLUE_SPAN, v_c[j], RED_SPAN, v_c[j + 1]),
            prop: {
              fade_in: true,
              fillStyle: deep_copy(fill_styles),
              time: 1
            }
          });
          ani.add_sequence_ani({
            prop: {
              step: true,
              time: ANIMATION_TIME,
            }
          });
          fill_styles[j] = "#DDDDDD";
          fill_styles[j + 1] = "#DDDDDD";
        }
      }
      fill_styles[j] = "pink";
      ani.add_sequence_ani({
        target: prev_rect,
        prop: {
          fade_in: true,
          fillStyle: deep_copy(fill_styles),
          time: 1
        }
      });
    }
    //for(j = 0; j < v.length; j++){ fill_styles[j] = "pink"; }
    fill_styles[0] = "pink";
    ani.add_sequence_ani({
        target: prev_rect,
        prop: {
          fade_in: true,
          fillStyle: deep_copy(fill_styles),
          time: 1
        }
    });
    ani.add_sequence_ani({
      target: prev_rect,
      text: "{}Bubble sort on array complete.</span>".format(RED_SPAN)
    });
  }
}