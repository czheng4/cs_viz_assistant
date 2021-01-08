/*
  Copyright (C) 2020, ChaoHui Zheng & Hunter Leef
  All rights reserved.
  
  1/6/2020
  Last Modified 1/8/2020
*/


class selectionSortAnimation {
	constructor(v) {
    this.v = v;
    this.ani = new Animation();
    this.ss = 50; //square_size
    this.width = 900;
    this.margin = 75;

    let rect;
    let x = this.margin * 1.5;
    let y = 0;
    rect = new Rect(x, y, v.length * this.ss, this.ss, 0, v, "array", "bottom", "h");
    rect.font = "20px Arial"
    this.ani.add_object(rect);
    this.ani.draw();

    this.selection_sort(v, rect, rect.x, rect.y, v.length);
  }


  run_animation() {
    this.ani.run_animation();
  }

 
  selection_sort(v, prev_rect, x, y, size) {
    let i;
    let rect;
    let ani = this.ani;
    let root_rect = this.root_rect;
    let fill_styles = [];
    let e_text;
    let v_size = v.length;
    let j, tmp, minindex;
    let v_c = deep_copy(v);

    for(i = 0; i < v_size; i++){
      fill_styles.push("#DDDDDD");
    }
    /* Selection Sort */
    for(i = 0; i < v_size - 1; i++){
      minindex = i;
      fill_styles[minindex] = "pink";
      ani.add_sequence_ani({ 
        target: prev_rect,
        text: "Begin with element {}{}</span> at index {}{}</span> and search for next minimal.".format(RED_SPAN, v_c[i], RED_SPAN, i),
        prop: {
          fade_in: true,
          fillStyle: deep_copy(fill_styles),
          step: true,
          time: 1
        }
      });
      for(j = i + 1; j < v_size; j++){
        if(v_c[j] < v_c[minindex]){
          if(minindex === i){ fill_styles[minindex] = "pink"; }
          else{ fill_styles[minindex] = "#DDDDDD"; }
          fill_styles[j] = "lightblue";
          ani.add_sequence_ani({ 
            target: prev_rect,
            text: "Selecting new minimal element {}{}</span> at index {}{}</span>.".format(BLUE_SPAN, v_c[j], BLUE_SPAN, j),
            prop: {
              fade_in: true,
              fillStyle: deep_copy(fill_styles),
              step: true,
              time: 1
            }
          });
          fill_styles[j] = "#DDDDDD";
          minindex = j;
        }
        else{
          if(minindex !== i){ fill_styles[minindex] = "lightblue"; }
          fill_styles[j] = "pink";
          ani.add_sequence_ani({ 
            target: prev_rect,
            text: "Element {}{}</span> at index {}{}</span> not minimal.".format(RED_SPAN, v_c[j], RED_SPAN, j),
            prop: {
              fade_in: true,
              fillStyle: deep_copy(fill_styles),
              step: true,
              time: 1
            }
          });
          fill_styles[j] = "#DDDDDD";
        }
      }
      fill_styles[i] = "pink";
      fill_styles[minindex] = "lightblue";
      ani.add_sequence_ani({ 
        target: prev_rect,
        text: "Swap {}{} (array[{}])</span> and {}{} (array[{}])</span> because {}{}</span> is the minimum for index {}{}</span>.".format(RED_SPAN, v_c[i], i, BLUE_SPAN, v_c[minindex], minindex, BLUE_SPAN, v_c[minindex], RED_SPAN, i),
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
          swap:{index1: minindex, index2: i, h_scale: 2.8 * 1 / Math.abs(minindex - i)},
          fillStyle: deep_copy(fill_styles),
          time: 3 * ANIMATION_TIME
        }
      });
      tmp = v_c[i];
      v_c[i] = v_c[minindex];
      v_c[minindex] = tmp;
      fill_styles[i] = "lightblue";
      fill_styles[minindex] = "#DDDDDD";
    }
    fill_styles[v_size - 1] = "lightblue";
    ani.add_sequence_ani({ 
      target: prev_rect,
      prop: {
        fade_in: true,
        fillStyle: deep_copy(fill_styles),
        step: true,
        time: 1
      }
    });
    ani.add_sequence_ani({
      target: prev_rect,
      text: "{}Selection sort on array complete.</span>".format(RED_SPAN)
    });
  }
}