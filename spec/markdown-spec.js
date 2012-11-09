describe("hmarkdown", function() {

  describe("Hooks", function() {
    var hooks,
        our_hook = function(x) { return x; };

    beforeEach(function() {
      hooks = new Markdown.Hooks();
    });
    afterEach(function() { hooks = null; });

    it("is a lightweight array proxy that has 3 predefined hook collections: before, entering, and after", function() {
      expect( hooks.before ).toEqual([]);
      expect( hooks.entering ).toEqual([]);
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
      expect( hs.cask ).toEqual({});
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

  describe("ListStore", function() {
    var ls;
    beforeEach(function() {
      ls = new Markdown.ListStore();
    });
    afterEach(function() { ls = null; });

    describe(".set()", function() {
      it("stores the value and returns a key", function() {
        var key = ls.set('foo');
        expect(key).toBe(0);
      });
    });
    describe(".get()", function() {
      it("returns the value stored with the given key", function() {
        var item = ls.get( ls.set('foo') );
        expect(item).toEqual('foo');
      });
    });
  });

  describe("Markdown", function() {
    it("exports a top-level object named Markdown", function() {
      expect(Markdown).toBeDefined();
    });
    it("is a constructor function", function() {
      expect(typeof Markdown).toBe('function')
    });
  });

  describe(".render()", function() {
    it("statically renders some input with default options", function() {
      expect( Markdown.render("foo") ).toEqual("foo\n\n");
    });
  });

  describe(".toHtml()", function() {
    it("is an alias for render()", function() {
      spyOn( Markdown, 'render' ).andCallThrough();
      Markdown.toHtml("foo");

      expect( Markdown.render ).toHaveBeenCalledWith("foo");
    });
  });

  describe("Markdown instance", function() {
    var engine;
    beforeEach(function() {
      engine = new Markdown();
    });

    it("includes hooks", function() {
      expect( engine.hooks ).toBeDefined();
    });

    describe(".clean()", function() {
      it("follows attacklab in escaping tildes (because we're going to use ~ as an escape char)", function() {
        expect( engine.clean( "->~<- ->~<-" ) ).toEqual('->~T<- ->~T<-');
      });
      it("follows attacklab in escaping the almighty $, because that has a special meaning in RegExp", function() {
        expect( engine.clean("Cash $; Mo $ Mo Problems") ).toEqual('Cash ~D; Mo ~D Mo Problems');
      });
      it("standardizes windows line endings to unix-style", function() {
        expect( engine.clean("Line One\r\nLine Two") ).toEqual('Line One\nLine Two');
      });
      it("standardizes old mac line endings to unix-style", function() {
        expect( engine.clean("Line One\rLine Two") ).toEqual('Line One\nLine Two');
      });
      it("converts tabs to spaces", function() {
        expect( engine.clean("here be tabs:\t\t(but no more)") ).toEqual('here be tabs:    (but no more)');
      });
      it("strips whitespace-only lines from the input", function() {
        expect( engine.clean("Foo\n\t\t\nBar\n   ") ).toEqual('Foo\n\nBar\n')
      });
    });

    describe(".detab()", function() {
      it("converts tabs to spaces", function() {
        expect( engine.detab("\t\t") ).toEqual('    ');
      });
    });

    describe(".restore()", function() {
      it("restores the dolla-dollas y'all", function() {
        expect( engine.restore( '~D Money ~D Money') ).toEqual('$ Money $ Money');
      });
      it("restores tildes to their rightful places", function() {
        expect( engine.restore( 'Senior ~T, ~T man!') ).toEqual('Senior ~, ~ man!');
      });
      it("restores ")
    });

    describe(".escapeHtml()", function() {
      it("replaces html with unique markers", function() {
        var markerized = engine.escapeHtml('<div>Hello there!</div>\n');

        expect(markerized).toEqual('\n\n~K0K\n\n');
      });
      it("delegates this work to .saveHtmlAndReturnMarker", function() {
        spyOn( engine, 'saveHtmlAndReturnMarker' ).andCallThrough();
        engine.escapeHtml('<div>Hello there!</div>\n');

        expect( engine.saveHtmlAndReturnMarker ).toHaveBeenCalled();
      });
    });

    describe(".saveHtmlAndReturnMarker()", function() {
      it("stashes the given item in the appropriate list store and returns a marker", function() {
        var marker = engine.saveHtmlAndReturnMarker(null, 'my html');

        expect( engine.html_block_store.list ).toEqual(['my html']);
        expect(marker).toEqual('\n\n~K0K\n\n')
      });

    });

    describe(".unescapeHtml()", function() {
      it("replaces unique markers with the corresponding saved html", function() {
        engine.html_block_store.set('MY AWESOME HTML');
        var unescaped = engine.unescapeHtml('\n\n~K0K\n\n');

        expect(unescaped).toEqual('\n\nMY AWESOME HTML\n\n');
      });
    });

  });

});