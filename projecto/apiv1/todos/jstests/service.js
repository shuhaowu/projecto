"use strict";

(function() {
  var projectKey = "projectkey";
  var todoKey = "todokey";
  var project = {key: projectKey};
  var newtododata = {title: "A todo", content: "yay todos!"};
  var author = angular.copy(window.currentUser);
  delete author.emails;
  var returnedtodo = {
    key: todoKey,
    author: author,
    title: newtododata.title,
    content: {
      markdown: newtododata.content,
      html: "<p>yay todos!</p>\\n"
    },
    tags: [],
    due: null,
    done: false,
    assigned: null,
    milestone: null,
    date: 1388790824.0,
    children: []
  };
  var baseUrl = window.API_PREFIX + "/projects/" + projectKey + "/todos/";

  describe("Todos", function() {
    var TodoItem, TodoList, $httpBackend, service;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function(Todos, TodosService, _$httpBackend_) {
      TodoItem = Todos.TodoItem;
      TodoList = Todos.TodoList;
      service = TodosService;
      $httpBackend = _$httpBackend_;
    }));

    it("should initialize TodoItem", function() {
      var data = angular.copy(newtododata);
      var item = new TodoItem(todoKey, project, data);

      // TodoItem should not make a copy of data. For easy setting.
      expect(data.title).not.toBe("title");
      item.data.title = "title";
      expect(data.title).toBe("title");

      expect(item.data).toBe(data);
      expect(item.key).toBe(todoKey);
      expect(item.project).toBe(project);
      expect(item.archived).toBe(false);
    });

    it("should serialize TodoItem", function() {
      var data = angular.copy(newtododata);
      var item = new TodoItem(todoKey, project, data);

      var tododata = item.serialize();
      expect(data.key).not.toBe(todoKey);
      expect(tododata.key).toBe(todoKey);

      expect(tododata.title).toBe(data.title);
      expect(tododata.content).toBe(data.content);
    });

    it("should create new todos", function() {
      $httpBackend.when("POST", baseUrl).respond(returnedtodo);

      var data = angular.copy(newtododata);
      spyOn(service, "new").andCallThrough();

      // New item doesn't have a key.
      var item = new TodoItem(undefined, project, data);
      item.save();
      expect(service.new).toHaveBeenCalledWith(project, item.serialize());

      $httpBackend.expectPOST(baseUrl, item.serialize());
      $httpBackend.flush();
    });

    it("should update existing todos", function() {
      $httpBackend.when("PUT", baseUrl + todoKey).respond(returnedtodo);
      spyOn(service, "put").andCallThrough();

      var data = angular.copy(newtododata);
      data.content = angular.copy(returnedtodo.content);

      var item = new TodoItem(todoKey, project, data);
      item.save();

      expect(service.put).toHaveBeenCalledWith(project, item.serialize());

      var putitem = item.serialize();
      delete putitem.content.html;
      delete putitem.key;
      $httpBackend.expectPUT(baseUrl + todoKey, putitem);
      $httpBackend.flush();
    });

    it("should mark todos as done", function() {
      var donetodo = angular.copy(returnedtodo);
      donetodo.done = true;
      spyOn(service, "markDone").andCallThrough();

      var item = new TodoItem(todoKey, project, angular.copy(newtododata));
      item.done();

      expect(service.markDone).toHaveBeenCalledWith(project, item.serialize(), false);
      $httpBackend.expectPOST(baseUrl + todoKey + "/markdone?archived=0", {done: true}).respond(donetodo);
      $httpBackend.flush();
      expect(item.data.done).toBe(true);

      item.done();
      expect(service.markDone).toHaveBeenCalledWith(project, item.serialize(), false);
      donetodo.done = false;
      $httpBackend.expectPOST(baseUrl + todoKey + "/markdone?archived=0", {done: false}).respond(donetodo);
      $httpBackend.flush();
      expect(item.data.done).toBe(false);
    });

    it("should archived todos", function() {
      spyOn(service, "delete").andCallThrough();

      var item = new TodoItem(todoKey, project, angular.copy(newtododata));
      item.archive();

      expect(service.delete).toHaveBeenCalledWith(project, item.serialize(), undefined, undefined);
      $httpBackend.expectDELETE(baseUrl + todoKey + "?archived=0&really=0").respond({status: "okay"});
      $httpBackend.flush();

      expect(item.archived).toBe(true);
    });

    it("should delete todos", function() {
      spyOn(service, "delete").andCallThrough();

      var item = new TodoItem(todoKey, project, angular.copy(newtododata));
      item.delete();
      expect(service.delete).toHaveBeenCalledWith(project, item.serialize(), true, undefined);
      $httpBackend.expectDELETE(baseUrl + todoKey + "?archived=0&really=1").respond({status: "okay"});
      $httpBackend.flush();
    });

  });
})();