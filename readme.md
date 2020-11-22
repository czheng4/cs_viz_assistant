# Overall Animation property
To add animation property, we provide `add_sequence_ani` and `add_parallel_ani` function calls. 

### add_sequence_ani(dict)
we internally keep track of the accumulated animation time to compute where the starting time and ending time of the property. With that being said, the `time` must be speciied. Below tables shows the key-values explanation.


|  Keys | Vals|
| ----------| ---------|
| pause |   pause the animation for `pause` times. If `pause` is used, `prop` shouldn't be used |
| target | the target object(`Circle`, `quadraticCurve`, and `Rect`) to execute the `prop` |
| prop(dict)  | the animation property of `Circle`, `quadraticCurve`, or `Rect`. If key `time` is not specified, `aniTime("ANIMATION_TIME")` is used. |
| action(dict) | This is an after-animation action that will be executed when the animation time gets to `end`. It's a dictionary that has `params` and `func`. `params` is the parameter of `func`.|
| rev_action(dict) | same as action. But it triggers when animation moves backward. | 
| concurrence | If it's true, the next added animation property has the same staring time as this one |
| text | a srting. Show the text in "elaboration" block when this animation occurs|
| step | if set to true, we stop here when step-by-step animation is on | 


### add_parallel_ani(dict)
`add_parallel_ani` allows you to speficy when the property occurs and ends more flexibilly.

| keys | vals|
| ----------| ---------|
| target | the target object(`Circle`, `quadraticCurve`, and `Rect`) to execute the `prop` |
| prop  | the animation property of `Circle`, `quadraticCurve`, and `Rect`. key `start` specifies the beginning time of the property and key `end` specifies the ending time of the property |
| action | This is an after-animation action that will be executed when the animation time gets to `end`. It's a dictionary that has `params` and `func`. `params` is the parameter of `func`.|
| rev_action | same as action. But it triggers when animation moves backward. | 
| text | a srting. Show the text in "elaboration" block when this animation occurs|
| step | if set to true, we stop here when step-by-step animation is on | 



# Circle Animation property
The canvas property is not listed below. However, any ctx property can goes into `prop`.

| keys | vals|
| ----------| ---------|
|   p (Point object)      | the destination position(move as a line)|
|  path(quadraticCurve)   | move on the path |
| propagation             | if set to true, and any `Objects` that can reach to the current one or can be reached from current one will move as well |
| stop_propagation(dict)  | A dict that keyed on unique reference of `Objects`, valued on `true`. It stop the propagration when encounter any of `Objects` whose reference is in dict. | 


# Rect Animation property
The canvas property is not listed below. However, any ctx property can goes into `prop`.


| keys | vals|
| ----------| ---------|
|   p (Point object)      | the destination position(move as a line)|
|  path(quadraticCurve)   | move on the path |
| propagation             | if set to true, and any `Objects` that can reach to the current one or can be reached from current one will move as well |
| stop_propagation(dict) (not supported)  | A dict that keyed on unique reference of `Objects`, valued on `true`. It stop the propagration when encounter any of `Objects` whose reference is in dict. | 
| swap(dict) | It has key `index1`, `index2`, `h_scale(optional)`, `w_scale(optioanl)`. When ainimation happens, the `index1` and `index2` text entries will be swaped with with `quadraticCurve` path specified by `h_scale` and `w_scale` |
| copy(dict) | It has key `index1`, `rect`, `index2`, `h_scale(optioanl)`, `w_scale(optional)`  When animation happens, the `target's` index1 text entry copy into `rect's` index2 text entry with `quadraticCurve` path specified by `h_scale` and `w_scale` |


# quadraticCurve Animation property 
The canvas property is not listed below. However, any ctx property can goes into `prop`.

| keys | vals|
| ----------| ---------|
|   p (Point object)      | the destination position(move as a line)|
|  type   | either "pivot" or "parallel". When it's pivot. When it's pivot, we move the ending point to `p`. When it's "parallel", we move the enitre curve by the distance of `p`|


# Graph
Many algorithms are using graph. So here it is. `Graph` handles the object(`Circle` and `quadraticCurve`) creation nicely for you.


# Animation Tester
1. Create the `algorithmAnimation` and `animationTester` object. The argument of `animationTester` takes the speed of animation.
2. Add function calls using `add_func`. The first parameter is the name of function. The second parameter is the list of arguments for the function.
3. `run_test()` runs the test for added functions.

A example is shown below for Dlist animation.

```
MAIN_A = new dlistAnimation();
aniTester = new animationTester(50);

aniTester.add_func("push_back", [1]);
aniTester.add_func("push_front", [3]);
aniTester.add_func("step_back");
aniTester.add_func("step_forward");
aniTester.add_func("push_front", [2]);
aniTester.add_func("push_front", [12]);
aniTester.add_func("pop_back", []);

aniTester.run_test();
```


# Animation Control

| Keys | description |
| ----------| ---------|
| j/J | move the animation backward |
| k/K | move the animation forward |
| l/L | set step-by-step animation on and off |


# Graph Creator Control

| Keys | description |
| ----------| ---------|
| c/C + number | switch the color of nodes |
| w/W + number | switch the color of edges |
| w/W + mouse down + mouse up | Create edges |
| d/D + mouse down + mouse up | Delete edges | 
















