;(function(exports) {

  // A lightweight hook/filter collection manager that will come in handy later.
  function Hooks() {
    this.before = [];
    this.after = [];
  };
  Hooks.prototype.add = function( when, hook ) {
    this[when] = this[when] || [];
    this[when].push(hook);
  };
  Hooks.prototype.clear = function( when ) {
    this[when] = [];
  }
  Hooks.prototype.run = function( when, input ) {
    var collection = this[when];
    for (var i = 0, j = collection.length; i<j; i++) {
      input = collection[i](input);
    }
    return input;
  }

  // A small k-v store that will come in handy later.
  function HashStore() {
    this.cask = {};
  };
  HashStore.prototype = {
    set: function( key, value ) {
      // namespace keys to avoid key/property-name collisions
      this.cask["hs_" + key] = value;
    },
    get: function( key ) {
      return this.cask["hs_" + key];
    },
    keys: function() {
      var keys = [];
      for( var key in this.cask ) {
        keys.push(key.replace(/^hs_/, ''));
      }
      return keys;
    }
  };

  function HMarkdown( input ) {
    this.input = input;
    this.hooks = new Hooks();
  };
  // the principal function: runs before hooks, transforms, runs after hooks.
  HMarkdown.prototype.render = function() {
    var output = this.input;
    output = this.hooks.run('before', output);
    output = this.transform(output);
    output = this.hooks.run('after', output);
    return output;
  };
  // actually transform markdown to html. Leans heavily on showdown + php markdown extra
  HMarkdown.prototype.transform = function( input ) {
    return input;
  }




  // handy shortcut:
  exports.render = function(text) {
    return new HMarkdown(text).render();
  };
  // and an alias
  exports.toHtml = function(text) {
    return this.render(text);
  };
  exports.engine = HMarkdown;
  exports.Hooks = Hooks;
  exports.HashStore = HashStore;

})(
  typeof exports === 'undefined' ? this['Markdown'] = {} : exports
);

/*
  var md_engine = new Markdown.engine('');
  md_engine.hooks.add('before', function(text) {
    return "**" + text + "**";
  });

  md_engine.hooks.add('after', Markdown.engine.smarty);
  Markdown.engine.useSmarty();

*/