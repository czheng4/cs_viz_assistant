/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/24/2020
*/

function network_flow_test1() {
  // MAIN_A = new networkFlowAnimation(); // must be name ani 
  // MAIN_G = network_flow_example(MAIN_A.ani);
  // MAIN_A.g = MAIN_G;

  aniTester = new animationTester(100);

  aniTester.add_func("find_augmenting_path", ["dfs"]);
  aniTester.add_func("find_augmenting_path", ["dfs"]);
  aniTester.add_func("find_augmenting_path", ["dfs"]);
  aniTester.add_func("find_augmenting_path", ["dfs"]);
 

  aniTester.run_test();
}


