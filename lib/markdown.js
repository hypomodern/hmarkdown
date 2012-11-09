;(function(exports) {

  // A lightweight hook/filter collection manager that will come in handy later.
  function Hooks() {
    this.before = [];
    this.entering = [];
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
    var collection = this[when] || [];
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

  // a small list store that will come in handy later
  function ListStore() {
    this.list = [];
  };
  ListStore.prototype.set = function( item ) {
    return this.list.push(item) - 1;
  };
  ListStore.prototype.get = function( index ) {
    return this.list[index];
  };

  // function binding, from underscore.js
  function binder(func, context) {
    var bound, args, nativeBind = Function.prototype.bind, ctor = function(){}, slice = Array.prototype.slice;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  function Markdown( options ) {
    this.hooks = new Hooks();
    this.html_block_store = new ListStore();
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
  Markdown.ListStore = ListStore;

  // add functions to Markdown prototype
  Markdown.prototype.render = function( text ) {
    text = this.hooks.run('before', text);
    text = this.clean(text);
    text = this.hooks.run('cleaned', text);
    text += "\n\n";
    text = this.transform(text);
    text = this.restore(text);
    text = this.hooks.run('after', text);
    return text;
  };

  // clean the input to prepare for conversion
  Markdown.prototype.clean = function( text ) {
    text = text || "";
    text = text.replace(/~/g, "~T");
    text = text.replace(/\$/g, "~D");
    text = text.replace(/\r\n|\r/g, "\n");
    text = this.detab( text );
    text = text.replace(/^\s+$/mg, "");
    return text;
  };

  // restore previously escaped special characters and hash blocks
  Markdown.prototype.restore = function( text ) {
    text = text || "";
    text = this.unescapeHtml( text );
    text = text.replace(/~T/g, '~');
    text = text.replace(/~D/g, '$');
    return text;
  };

  // convert tabs to spaces. More complicated than it should be
  Markdown.prototype.detab = function( text ) {
    text = text || '';
    if( !/\t/.test(text) ) return text;

    return text.replace(/\t/g, '  ');
  };

  // actually transform markdown to html. Leans heavily on showdown + php markdown extra
  Markdown.prototype.transform = function( text ) {
    text = this.escapeHtml(text);
    return text;
  };

  // escape raw HTML, storing it in a ListStore
  Markdown.prototype.escapeHtml = function( text ) {
    // I'm going to trust that the authors of showdown know what they're doing since I'm on a plane:
    var block_tags_a        = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math",
        block_tags_b        = block_tags_a + "|ins|del",
        first_pass_regexp   = new RegExp("^(<(" + block_tags_b + ")\\b.*?\\n</\\2>\\s*(?=\\n+))", 'gm'),
        second_pass_regexp  = new RegExp("^(<(" + block_tags_a + ")\\b.*?</\\2>\\s*(?=\\n+)\\n)", 'gm'),
        bound_replacer      = binder(this.saveHtmlAndReturnMarker, this);

    // replace nested block_tags_b wholesale:
    text = text.replace(first_pass_regexp, bound_replacer);
    // match liberally on block_tags_a:
    text = text.replace(second_pass_regexp, bound_replacer);
    // apparently hr tags need a special case:
    text = text.replace(/\n[ ]{0,3}((<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g, bound_replacer);
    // as do standalone comments:
    text = text.replace(/\n\n[ ]{0,3}(<!(--(?:|(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>[ \t]*(?=\n{2,}))/g, bound_replacer);

    return text;
  };

  // returns a unique marker that we can replace back in to the text after processing.
  Markdown.prototype.saveHtmlAndReturnMarker = function( wholeMatch, match ) {
    match = match.replace(/^\n+/, '');
    match = match.replace(/\n+$/, '');
    return '\n\n~K' + this.html_block_store.set(match) + 'K\n\n';
  };

  // retrieves and reinserts the previously-escaped HTML
  Markdown.prototype.unescapeHtml = function( text ) {
    var self = this;
    text = text.replace(/~K(\d+)K/g, function (wholeMatch, id) {
      return self.html_block_store.get(id);
    });
    return text;
  };




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
    - initial thoughts: before, cleaned, first_pass (post gamut), after?

  sample:

  var mdown = new Markdown({ plugins: [Markdown.Github, Markdown.RandomPreProcessor] });
  mdown.hooks.add('before', function(text) {
    return "**" + text + "**";
  });

  mdown.render('just some plain text') // => "<strong>just some plain text</strong>"

  Markdown.defaults.plugins == [Markdown.Smarty, Markdown.PHPExtras] // => true

*/