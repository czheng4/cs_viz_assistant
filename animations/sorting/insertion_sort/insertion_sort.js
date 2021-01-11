/*
  Copyright (C) 2020, ChaoHui Zheng & Hunter Leef
  All rights reserved.
  
  1/3/2020
  Last Modified 1/11/2020
*/


class insertionSortAnimation {
	constructor(v) {
    this.v = v;
    this.ani = new Animation();
    this.ss = 50; //square_size
    this.width = 900;
    this.margin = 75;

    let rect;
    let t_rect;
    
    let x = this.margin * 1.5;
    let y = 0;

    rect = new Rect(x, y, v.length * this.ss, this.ss, 0, v, "", "bottom", "h");
    t_rect = new Rect(x, this.ss + this.ss, this.ss, this.ss, 1, [""], "tmp", "bottom", "h");
    for (let i = 0; i < v.length; i++) rect.subrect_labels.push(i);
    rect.font = "20px Arial";
    t_rect.font = "20px Arial";
    this.ani.add_object(rect);
    this.ani.add_object(t_rect);
    this.ani.draw();

    this.insertion_sort(v, rect, rect.x, rect.y, t_rect, v.length);
  }


  run_animation() {
    this.ani.run_animation();
  }

 
  insertion_sort(v, rect, x, y, t_rect, size) {
    let i;
    //let rect;
    let ani = this.ani;
    let root_rect = this.root_rect;
    let fill_styles = [];
    let e_text;
    let v_size = v.length;
    let j, tmp, minindex;
    let h_scale;
    let v_c = deep_copy(v);

    for(i = 0; i < v_size; i++){
      fill_styles.push("#DDDDDD");
    }
    /* Insertion sort */
    fill_styles[0] = "lightblue";
    ani.add_sequence_ani({ 
      target: rect,
      text: "Before looping through the array, the first element is sorted.",
      prop: {
        fade_in: true,
        fillStyle: deep_copy(fill_styles),
        step: true,
        time: 1
      }
    });
    ani.add_sequence_ani({pause:ANIMATION_TIME * 1});
    fill_styles[0] = "#DDDDDD";
    for(i = 1; i < v_size; i++){
      tmp = v_c[i];
      //console.log("tmp is " + tmp);
      if(tmp < v_c[i - 1]){
        fill_styles[i] = "lightblue";
        fill_styles[i - 1] = "pink";
        ani.add_sequence_ani({ 
          target: rect,
          text: "Save {}{} (array[{}])</span> into tmp since it is less than {}{} array[{}]</span>.".format(BLUE_SPAN, v_c[i], i, RED_SPAN, v_c[i - 1], (i-1)),
          prop: {
            fade_in: true,
            fillStyle: deep_copy(fill_styles),
            step: true,
            time: 1
          }
        });
        ani.add_sequence_ani({
          target: rect,
          prop: {
            copy: {index1: i, rect: t_rect, index2: 0, h_scale: 0, w_scale: 0},
            //fillStyle: "lightblue",
            time: 1.5 * ANIMATION_TIME, 
          }
          //concurrence: true
        });
        ani.add_sequence_ani({
          target: t_rect,
          prop: {
            fade_in: true,
            fillStyle: "lightblue",
            time: 1
          }
          //concurrence: true
        });
        fill_styles[i] = "#DDDDDD";
        fill_styles[i-1] = "#DDDDDD";
      }
      /*ani.add_sequence_ani({
        target: t_rect,
        prop: {
          text: tmp,
          fade_in: true,
          fillStyle: "lightblue",
          time: 1
        }
      });*/
      //ani.add_sequence_ani({pause:ANIMATION_TIME * 1});
      for(j = i; j >= 1 && tmp < v_c[j-1]; j--){
        fill_styles[j] = "lightblue";
        fill_styles[j - 1] = "pink";
        ani.add_sequence_ani({ 
          target: rect,
          text: "Shift {}{} (array[{}])</span> over one.".format(RED_SPAN, v_c[j - 1], (j - 1)),
          prop: {
            fade_in: true,
            fillStyle: deep_copy(fill_styles),
            step: true,
            time: 1
          }
        });
        ani.add_sequence_ani({
          target: rect,
          prop: {
            copy: {index1: (j - 1), rect: rect, index2: j, h_scale: 3, w_scale: 0},
            fillStyle: deep_copy(fill_styles),
            time: 1.5 * ANIMATION_TIME, 
          }
        });
        fill_styles[j] = "#DDDDDD";
        fill_styles[j - 1] = "#DDDDDD";
        v_c[j] = v_c[j - 1];
      }
      if(j !== i){
        fill_styles[j] = "lightblue";
        ani.add_sequence_ani({ 
          target: rect,
          text: "Insert {}tmp {}</span> into {}(array[{}])</span>.".format(BLUE_SPAN, tmp, BLUE_SPAN, j),
          prop: {
            fade_in: true,
            fillStyle: deep_copy(fill_styles),
            step: true,
            time: 1
          }
        });
        ani.add_sequence_ani({
          target: t_rect,
          prop: {
            copy: {index1: 0, rect: rect, index2: j, h_scale: 0, w_scale: 0},
            time: 1.5 * ANIMATION_TIME, 
          }
        });
        ani.add_sequence_ani({
          target: t_rect,
          prop: {
            fade_in: true,
            fillStyle: "#DDDDDD",
            time: 1
          }
        });
        fill_styles[j] = "#DDDDDD";
        v_c[j] = tmp;
      }else{
        fill_styles[i] = "pink";
        fill_styles[j - 1] = "lightblue";
        ani.add_sequence_ani({ 
          target: rect,
          text: "Element {}{} array[{}]</span> already in place since it is greater than {}{} array[{}]</span>.".format(RED_SPAN, tmp, j, BLUE_SPAN, v_c[j-1], (j - 1)),
          prop: {
            fade_in: true,
            fillStyle: deep_copy(fill_styles),
            step: true,
            time: 1
          }
        });
        ani.add_sequence_ani({pause:ANIMATION_TIME * 1});
        fill_styles[i] = "#DDDDDD";
        fill_styles[j - 1] = "#DDDDDD";
      }
    }
    for(i = 0; i < v_size; i++){ fill_styles[i] = "lightblue"; }
    ani.add_sequence_ani({
      target: rect,
      text: "{}Insertion sort on array complete.</span>".format(RED_SPAN),
      prop: { 
        fade_in: true,
        fillStyle: deep_copy(fill_styles),
        time: 1
      }
    });
  }
}