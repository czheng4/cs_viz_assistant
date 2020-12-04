/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/22/2020
  Last Modified 11/24/2020
*/

function add_objs_to_ani(dict) {
  let ani = dict.ani,
      objs = dict.objs,
      lines = dict.lines;

  for (let i = 0; i < objs.length; i++) ani.add_object(objs[i]);
  for (let i = 0; i < lines.length; i++) ani.connect_object(lines[i]);
  

}

function rm_objs_from_ani(dict) {
  let ani = dict.ani,
      objs = dict.objs;

  for (let i = 0; i < objs.length; i++) ani.remove_object(objs[i].ref);

}

function make_same_color(size, color) {
  let i;
  let rv = [];
  for (i = 0; i < size; i++) rv.push(color);
  
  return rv;
}

function make_single_color(index, size, color1, color2) {
  let rv, i;
  rv = [];
  for (i = 0; i < size; i++) rv.push(color2);
  rv[index] = color1;
  return rv;
}


function update_color(dict) {

  dict.obj.fillStyles = dict.fillStyle;
}


const left_color = "#ADD8E6";
const right_color = "#FFD300";
const merge_color = "red";
const default_color = "#DDDDDD"
class mergeSortAnimation {
	constructor(v) {
    this.v = v;
    this.ani = new Animation();
    this.ss = 50; //square_size
    this.ms = new memorySimulator();
    this.width = 900;
    this.margin = 75;


    let x,y;
    let rect,p;

    x = (this.width - this.ss * v.length) / 2;
    y = 0;
    rect = new Rect(x, y, v.length * this.ss, this.ss, this.ms.get_reference(v), deep_copy(v), "", "bottom", "h");
    p = this.ani.get_point((rect.x + rect.width) / 2, rect.y + rect.height);
    rect.attach_point(p);

    this.ani.add_object(rect);
    this.ani.draw();
    this.root_rect = rect;

    this.recursive_sort(v, 0, rect, rect.x, rect.y, 0, v.length);

  }


  run_animation() {
    this.ani.run_animation();
  }

 
  recursive_sort(v, level = 0, prev_rect = null, x, y, start, size) {
    let rv, v1, v2;
    let i, middle, lp, rp;
    let rect1, rect2;
    // let x,y;
    let ani = this.ani;
    let p1, p2, p3, l1, l2;
    let dx, dy;
    let root_rect = this.root_rect;
    let fill_styles = [];
    let tmp_fill_styles;
    let e_text;
   

    if (v.length == 1) return v;
    if (v.length == 2) {
      if(v[0] > v[1]) {
        ani.add_sequence_ani( {pause: 1, prop: {step:true}});
        ani.add_sequence_ani({ 
          target: prev_rect,
          text: "Swap {}{}(array[{}])</span> and {}{}(array[{}])</span>".format(
                 v[0], BLUE_SPAN, start, 
                 v[1], BLUE_SPAN, start + 1),
          prop: {swap:{index1:0, index2:1, h_scale: 3}, time: 3 * ANIMATION_TIME, step:true}})
        return [v[1], v[0]];
      }
      else return v;
    }

    middle = v.length / 2;
    v1 = v.splice(0, middle);
    v2 = v.splice(0);


    // make a left rect

    
    rect1 = new Rect(x, y, v1.length * this.ss, this.ss, this.ms.get_reference(v1), deep_copy(v1), "", "bottom", "h");
    p1 = ani.get_point(prev_rect.x + prev_rect.width / 2, prev_rect.y + prev_rect.height);
    p2 = ani.get_point(rect1.x + rect1.width / 2, rect1.y);
    
    prev_rect.attach_point(p1);
    rect1.attach_point(p2);
    l1 = new quadraticCurve(p1, p2, 0);
    l1.draw_arrow = false;

    // make a right rect

    x = rect1.x + rect1.width;
    y = rect1.y;

  
    rect2 = new Rect(x, y, v2.length * this.ss, this.ss, this.ms.get_reference(v2), deep_copy(v2), "", "bottom", "h");
    p2 = ani.get_point(rect2.x + rect2.width / 2, rect2.y);
    rect2.attach_point(p2);
    l2 = new quadraticCurve(p1, p2, 0);
    l2.draw_arrow = false;
    // make animation 

   
    if (!ani.is_last_sequence_ani_step()) {
      ani.add_sequence_ani( {pause: 1, prop: {step: true}});
    }

    ani.add_sequence_ani({pause: ANIMATION_TIME / 4})
    e_text = "Split the array{}[{}:{}]</span> into half where each of them sorts interval {}[{}:{}]</span> and {}[{}:{}]</span> respectively".format(
              BLUE_SPAN, start, start + size - 1,
              BLUE_SPAN, start, start + parseInt(size / 2) - 1,
              BLUE_SPAN, start + parseInt(size / 2), start + size - 1)
   
    ani.add_sequence_ani({ pause: 1,  
                           text: e_text,  
                           action: { params: {ani:ani, objs: [rect1, rect2], lines: [l1, l2]}, func: add_objs_to_ani },
                           rev_action: {params: {ani:ani, objs: [rect1, rect2]}, func: rm_objs_from_ani }});

    ani.add_sequence_ani({ target: rect1,
                     prop: {p: new Point(rect1.x - this.margin * Math.pow(0.5, level), rect1.y + this.ss + this.margin), fillStyle: left_color},
                     concurrence: true});

    ani.add_sequence_ani({ target: rect2,
                     prop: {p: new Point(rect2.x + this.margin * Math.pow(0.5, level), rect2.y + this.ss + this.margin), fillStyle: right_color},
                     concurrence: false});


    
    v1 = this.recursive_sort(v1, level + 1, rect1, rect1.x - this.margin * Math.pow(0.5, level), rect1.y + this.ss + this.margin, start, parseInt(size / 2));
    v2 = this.recursive_sort(v2, level + 1, rect2, rect2.x + this.margin * Math.pow(0.5, level), rect2.y + this.ss + this.margin, start + parseInt(size / 2), size - parseInt(size / 2));


    rv = []

    if (!ani.is_last_sequence_ani_step()) {
      ani.add_sequence_ani( {pause: 1, prop: {step: true}});
    }
    // merge
    lp = 0;
    rp = 0;


    ani.add_sequence_ani( {pause: ANIMATION_TIME});
    ani.add_sequence_ani( {pause: 1, 
                           action: { params: { obj:rect1, fillStyle: make_single_color(lp, rect1.text.length, left_color, default_color) }, func: update_color },
                           rev_action: {params: {obj: rect1, fillStyle: make_same_color(v1.length,default_color)}, func:update_color },
                           concurrence: true} )
    

    ani.add_sequence_ani( {pause: 1, 
                           action: { params: { obj:rect2, fillStyle: make_single_color(rp, rect2.text.length, right_color, default_color) }, func: update_color },
                           rev_action: {params: {obj: rect2, fillStyle: make_same_color(v2.length, default_color)}, func:update_color },
                           concurrence: false} )
    

    e_text = "Merge array{}[{}:{}]</span> and array{}[{}:{}]</span>".format(
              BLUE_SPAN, start, start + parseInt(size / 2) - 1,
              BLUE_SPAN, start + parseInt(size / 2), start + size - 1);

    ani.add_sequence_ani( {pause: ANIMATION_TIME, text: e_text, prop: {step:true}});

    fill_styles = make_same_color(v1.length + v2.length, default_color);
    for (i = 0; i < v1.length + v2.length; i++) {
      if (rp >= v2.length || (lp < v1.length && v1[lp] <= v2[rp])) {
        rv.push(v1[lp]);

        tmp_fill_styles = deep_copy(fill_styles);
        fill_styles[i] = left_color;
        ani.add_sequence_ani( {target: rect1,
                               text: "Merge value {}{}(array[{}])</span>".format(v1[lp], BLUE_SPAN, start + lp),
                               prop: {copy:{index1:lp, rect: prev_rect, index2:i, h_scale: 0}}})


        ani.add_sequence_ani( {pause: 1, 
                               action: { params: {obj:prev_rect, fillStyle: deep_copy(fill_styles)}, func: update_color },
                               rev_action: {params: {obj: prev_rect, fillStyle: tmp_fill_styles}, func:update_color },
                               concurrence: true} )
        
      
        
        lp++;
        if (lp < v1.length)
          ani.add_sequence_ani( {pause: 1, 
                               action: { params: { obj:rect1, fillStyle: make_single_color(lp, rect1.text.length, left_color, default_color) }, func: update_color }} )
        else {
          ani.add_sequence_ani( { pause: 1, 
                            action: { params: {obj:rect1, fillStyle: make_same_color(v1.length, default_color)}, func: update_color }} )
        }

        ani.add_sequence_ani( {pause: ANIMATION_TIME / 4,prop: {step:true} });
      } else {
        rv.push(v2[rp]);
        tmp_fill_styles = deep_copy(fill_styles);
        fill_styles[i] = right_color;
        ani.add_sequence_ani( {target: rect2, 
                               text: "Merge value {}{}(array[{}])</span>".format(v2[rp], BLUE_SPAN, start + parseInt(size / 2) + rp),
                               prop: {copy:{index1:rp, rect: prev_rect, index2:i, h_scale: 0}}})


        ani.add_sequence_ani( {pause: 1, 
                               action: { params: {obj:prev_rect, fillStyle: deep_copy(fill_styles)}, func: update_color },
                               rev_action: {params: {obj: prev_rect, fillStyle: tmp_fill_styles}, func:update_color },
                               concurrence: true} )
        rp++;
        if (rp < v2.length)
          ani.add_sequence_ani( { pause: 1, 
                                  action: { params: { obj:rect2, fillStyle: make_single_color(rp, rect2.text.length, right_color, default_color) }, func: update_color }} )
        else {
          ani.add_sequence_ani( { pause: 1, 
                                  action: { params: {obj:rect2, fillStyle: make_same_color(v2.length, default_color)}, func: update_color }} )
        }

        ani.add_sequence_ani( {pause: ANIMATION_TIME / 4, prop: {step:true} });
      }
    }


    ani.add_sequence_ani( { pause: 1, 
                            text: e_text + ". Done",
                            prop: {step: true},
                            action: { params: {obj:prev_rect, fillStyle: make_same_color(v1.length + v2.length, default_color)}, func: update_color }})
 
  
    return rv;
  }



}