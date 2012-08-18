describe("hmarkdown", function() {

  describe("Hooks", function() {
    var hooks,
        our_hook = function(x) { return x; };

    beforeEach(function() {
      hooks = new Markdown.Hooks();
    });
    afterEach(function() { hooks = null; });

    it("is a lightweight array proxy that has two predefined hook collections: before and after", function() {
      expect( hooks.before ).toEqual([]);
      expect( hooks.after ).toEqual([]);
    });
    describe(".add", function() {
      it("adds a hook to the given collection", function() {
        hooks.add('before', our_hook);
        expect( hooks.before ).toContain(our_hook);
      });
      it("works even for newly minted hook collection names", function() {
        hooks.add('dweezil', our_hook);
        expect( hooks.dweezil ).toContain(our_hook);
      });
    });

    describe(".clear", function() {
      it("clears all of the hooks in the given collection", function() {
        hooks.add('after', our_hook);
        expect( hooks.after.length ).toBe(1);
        hooks.clear('after');
        expect( hooks.after ).toEqual([]);
      });
    });

    describe(".run", function() {
      it("runs each hook in the given collection on the given input", function() {
        hooks.add('after', function(x) { return "*" + x + "*"; });
        hooks.add('after', function(x) { return "!" + x + "!"; });

        var output = hooks.run('after', " [ base ] ");
        expect(output).toEqual("!* [ base ] *!");
      });
    });
  });

  describe("HashStore", function() {
    var hs;

    beforeEach(function() {
      hs = new Markdown.HashStore();
    });
    afterEach(function() { hs = null; });

    it("is a lightweight object proxy with an internal cask for key/value storage", function() {
      expect( hs.cask ).toEqual([]);
    });
    describe(".set", function() {
      it("stores the value under the given key", function() {
        hs.set("foo", "bar");
        expect( hs.get("foo") ).toEqual("bar")
      });
      it("uses a namespace to avoid colliding with properties on the HashStore object", function() {
        hs.set("get", "hahaha!");
        expect( hs.cask.hs_get ).toEqual("hahaha!");
      });
    });

    describe(".get", function() {
      it("retrieves the value for the given key", function() {
        hs.cask.hs_foo = "bar";
        expect( hs.get("foo") ).toEqual("bar");
      });
    });

    describe(".keys", function() {
      it("returns a list of all the known keys", function() {
        hs.set("foo", "bar");
        hs.set("baz", "quux");
        expect( hs.keys() ).toEqual(["foo", "baz"]);
      });
    });
  });

  describe("Markdown", function() {
    it("exports a top-level object named Markdown", function() {
      expect(Markdown).toBeDefined();
    });
    it("includes a reference to the HMarkdown engine as .engine", function() {
      expect(Markdown.engine).toBeDefined();
      expect(typeof Markdown.engine).toBe('function')
    });
  });

  describe(".render()", function() {
    it("renders some input", function() {
      expect( Markdown.render("foo") ).toEqual("foo");
    });
  });

  describe(".toHtml()", function() {
    it("is an alias for render()", function() {
      spyOn( Markdown, 'render' ).andCallThrough();
      Markdown.toHtml("foo");

      expect( Markdown.render ).toHaveBeenCalledWith("foo");
    });
  });

  describe("HMarkown engine", function() {
    var engine;
    beforeEach(function() {
      engine = new Markdown.engine('quux');
    });

    it("includes hooks", function() {
      expect( engine.hooks ).toBeDefined();
    });
  });

});