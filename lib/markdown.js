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

  function Markdown( options ) {
    this.hooks = new Hooks();
  };
  // static functions
  Markdown.render = function( input ) {
    return (new Markdown()).render( input );
  };
  Markdown.toHtml = function( input ) {
    return Markdown.render( input );
  };
  // namespaced properties
  Markdown.Hooks = Hooks;
  Markdown.HashStore = HashStore;

  // add functions to Markdown prototype
  Markdown.prototype.render = function( text ) {
    var output = text;
    output = this.hooks.run('before', output);
    output = this.transform(output);
    output = this.hooks.run('after', output);
    return output;
  };
  // actually transform markdown to html. Leans heavily on showdown + php markdown extra
  Markdown.prototype.transform = function( input ) {
    return input;
  }

  // assign module
  exports.Markdown = Markdown

})(
  typeof exports === 'undefined' ? this : exports
);

/*
  API notes:

  public:
    - static function that renders markdown with the default settings, Markdown.render('text')
    - static function that modifies the default settings, e.g.
        Markdown.defaults = { setting: value }
    - constructor function that returns an engine instance configured with the optional, given, settings, e.g.
        var mdown = new Markdown({ setting: value })

  instance, public:
    - exposes hooks object via mdown.hooks
    - exposes settings object via mdown.settings
    - renders markdown via mdown.render('text')

  plugin, public:
    - should support filtering/processing plugins to enable various flavors or features
    - implement github flavor and php extra flavor as plugins to force myself to define API?

  test mode:
    - make processed input text inspectable at various points--maybe expand default hooks?

  Hooks:
    - define reasonable callback points. Attempt to keep limited, but allow for useful plugins.
    - initial thoughts: before, entering (post cleanup, pre-gamut), exiting (post gamut), after?

  sample:

  var mdown = new Markdown({ plugins: [Markdown.Github, Markdown.RandomPreProcessor] });
  mdown.hooks.add('before', function(text) {
    return "**" + text + "**";
  });

  mdown.render('just some plain text') // => "<strong>just some plain text</strong>"

  Markdown.defaults.plugins == [Markdown.Smarty, Markdown.PHPExtras] // => true

*/