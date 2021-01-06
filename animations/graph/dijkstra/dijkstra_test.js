/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/04/2020
*/

function dijkstra_test1() {
  // MAIN_A = new networkFlowAnimation(); // must be name ani 
  // MAIN_G = network_flow_example(MAIN_A.ani);
  // MAIN_A.g = MAIN_G;

  aniTester = new animationTester(100);
  MAIN_A.ani.step_by_step = true;

  let g = MAIN_G;
  console.log(g);
  aniTester.add_func("run_dijkstra", [g.get_node(0), g, false]);
  
  for (let i = 0; i < 10; i++) aniTester.add_func("go_forward");

  aniTester.run_test();
}


