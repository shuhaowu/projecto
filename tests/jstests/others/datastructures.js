"use strict";

(function() {
  describe("LinkedMap", function() {
    var map;
    beforeEach(function() {
      map = new datastructures.LinkedMap();
    });

    it("should initialize correctly", function() {
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify([]));
      expect(map.length()).toBe(0);
    });

    it("should put, get, and remove correctly", function() {
      map.put("key1", "value1");
      expect(map.get("key1")).toBe("value1");
      expect(map.length()).toBe(1);

      map.put("key2", "value2");
      expect(map.get("key1")).toBe("value1");
      expect(map.get("key2")).toBe("value2");
      expect(map.length()).toBe(2);

      map.remove("key2");
      expect(map.get("key1")).toBe("value1");
      expect(map.get("key2")).toBe(undefined);
      expect(map.length()).toBe(1);
    });

    it("should deal with two element map correctly", function() {
      map.put("key1", "value1");
      map.put("key2", "value2");
      map.remove("key2");
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify([{key: "key1", value: "value1"}]));

      map.put("key2", "value2");
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify([{key: "key1", value: "value1"}, {key: "key2", value: "value2"}]));

      map = new datastructures.LinkedMap();
      map.put("key1", "value1");
      map.put("key2", "value2");
      map.remove("key1");
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify([{key: "key2", value: "value2"}]));

      map.put("key1", "value1");
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify([{key: "key2", value: "value2"}, {key: "key1", value: "value1"}]));

      map = new datastructures.LinkedMap();
      map.put("key1", "value1");
      map.put("key2", "value2");
      map.remove("key1");
      map.remove("key2");
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify([]));
    });

    it("should overwrite but preserve order", function() {
      map.put("key1", "value1");
      map.put("key2", "value2");
      map.put("key3", "value3");

      expect(map.get("key2")).toBe("value2");
      map.put("key2", "changed");
      expect(map.get("key2")).toBe("changed");

      var list = map.listify();
      expect(list[1].key).toBe("key2");
      expect(list[1].value).toBe("changed");
    });

    it("should preserve order correctly", function() {
      var list = [];
      map.put("key1", "value1");
      list.push({key: "key1", value: "value1"});
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify(list));
      expect(map.length()).toBe(1);

      map.put("key2", "value2");
      list.push({key: "key2", value: "value2"});
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify(list));
      expect(map.length()).toBe(2);

      map.put("key3", "value3");
      list.push({key: "key3", value: "value3"});
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify(list));
      expect(map.length()).toBe(3);

      map.remove("key2");
      list.splice(1, 1);
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify(list));
      expect(map.length()).toBe(2);

      map.put("key2", "value2");
      list.push({key: "key2", value: "value2"});
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify(list));
      expect(map.length()).toBe(3);

      map.remove("key2");
      list.splice(2, 1);
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify(list));
      expect(map.length()).toBe(2);

      map.remove("key1");
      list.splice(0, 1);
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify(list));
      expect(map.length()).toBe(1);

      map.remove("key3");
      expect(JSON.stringify(map.listify())).toBe(JSON.stringify([]));
      expect(map.length()).toBe(0);
    });

    it("should prepend correctly", function() {
      map.put("key1", "value1");
      map.put("key2", "value2");
      map.put("key3", "value3");

      map.prepend("key0", "value0");
      expect(map.length()).toBe(4);

      var list = map.listify();
      expect(list.length).toBe(4);
      expect(list[0].key).toBe("key0");
      expect(list[0].value).toBe("value0");

      map = new datastructures.LinkedMap();
      map.prepend("key0", "value0");
      expect(map.length()).toBe(1);

      var list = map.listify();
      expect(list.length).toBe(1);
      expect(list[0].key).toBe("key0");
      expect(list[0].value).toBe("value0");
    });

    it("should get keys() and values()", function() {
      map.put("key1", "value1");
      map.put("key2", "value2");
      map.put("key3", "value3");

      var keys = map.keys();
      expect(keys[0]).toBe("key1");
      expect(keys[1]).toBe("key2");
      expect(keys[2]).toBe("key3");

      var values = map.values();
      expect(values[0]).toBe("value1");
      expect(values[1]).toBe("value2");
      expect(values[2]).toBe("value3");
    });

  });
})();