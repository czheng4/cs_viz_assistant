

function dlist_test1() {
  MAIN_A = new dlistAnimation();
  aniTester = new animationTester(90);

  aniTester.add_func("push_back", [1]);
  aniTester.add_func("push_front", [3]);
  aniTester.add_func("step_back");
  aniTester.add_func("step_forward");
  aniTester.add_func("push_front", [2]);
  aniTester.add_func("push_front", [12]);
  aniTester.add_func("pop_back", []);

  aniTester.run_test();
}
