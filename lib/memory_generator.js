function *address_generator() {
  let random;
  while(true) {
    random = Math.random().toString(16).slice(2, 4);
    yield `0x${random}`;
  }
}

/* get the reference of an object. If the fake memory has not been generated for the object, 
   we call generator to get one
*/
class memorySimulator {
  constructor() {
    this.generator = address_generator();
    this.object_to_address = new Map();
    this.address_to_object = new Map();
  }

  get_reference(obj) {
    let address;
    let object_to_address = this.object_to_address;
    let address_to_object = this.address_to_object;

    if (object_to_address.has(obj)) {
      address = object_to_address.get(obj);
    } else {
      do {
        address = this.generator.next().value;
      } while (address_to_object.has(address));
      object_to_address.set(obj, address);
      address_to_object.set(address, obj);
    }
    return address;
  }

  deep_copy() {
    let ms = new memorySimulator();
    for (let [key, value] of this.object_to_address) { 
      ms.object_to_address.set(key, value);
    }

    for (let [key, value] of this.address_to_object) {
      ms.address_to_object.set(key, value);
    }
    
    return ms;
  }
  get_object(address) {
    let address_to_object = this.address_to_object;

    if (address_to_object.has(address)) {
      return address_to_object.get(address);
    } else {
    	return null
      console.log("wrong address");
    }
  }

}
