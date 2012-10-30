// Generated by CoffeeScript 1.3.3
(function() {

  define(['aloha', 'aloha/plugin', 'jquery', '../../../extra/bubble/lib/bubble-plugin', 'ui/ui', 'css!../../../extra/oer-math/css/math.css'], function(Aloha, Plugin, jQuery, Bubble, UI) {
    var EDITOR_HTML, LANGUAGES, MATHML_ANNOTATION_ENCODINGS, SELECTOR, buildEditor, triggerMathJax;
    EDITOR_HTML = '<div class="math-editor-dialog">\n    <div>\n        <textarea type="text" class="formula" rows="1"></textarea>\n    </div>\n    <span>This is:</span>\n    <label class="radio inline">\n        <input type="radio" name="mime-type" value="math/asciimath"> ASCIIMath\n    </label>\n    <label class="radio inline">\n        <input type="radio" name="mime-type" value="math/tex"> LaTeX\n    </label>\n    <label class="radio inline">\n        <input type="radio" name="mime-type" value="math/mml"> MathML\n    </label>\n    <label class="checkbox inline">\n      <input type="checkbox" class="show-cheatsheet"/>\n      Show Cheat Sheet\n    </label>\n    <span class="separator"> | </span>\n    <a class="btn btn-link see-help">See Help</a>\n</div>';
    LANGUAGES = {
      'math/asciimath': {
        open: '`',
        close: '`'
      },
      'math/tex': {
        open: '\\(',
        close: '\\)'
      },
      'math/mml': {
        raw: true
      }
    };
    MATHML_ANNOTATION_ENCODINGS = {
      'TeX': 'math/tex',
      'ASCIIMath': 'math/asciimath'
    };
    triggerMathJax = function($el) {
      var id;
      if (!$el.attr('id')) {
        id = 0;
        while (jQuery('#autogen-math-' + id)[0]) {
          id++;
        }
        $el.attr('id', 'autogen-math-' + id);
      }
      id = $el.attr('id');
      return MathJax.Hub.queue.Push(['Typeset', MathJax.Hub, id]);
    };
    buildEditor = function($span) {
      var $annotation, $editor, $formula, $tmp, formula, keyDelay, keyTimeout, lang, mimeType, radios;
      $editor = jQuery(EDITOR_HTML);
      $formula = $editor.find('.formula');
      mimeType = $span.find('script[type]').attr('type') || 'math/asciimath';
      mimeType = mimeType.split(';')[0];
      formula = $span.find('script[type]').html();
      if (mimeType = 'math/mml') {
        $tmp = jQuery('<div></div>').html($span.find('script[type]').text());
        $annotation = $tmp.find('annotation');
        lang = $annotation.attr('encoding');
        if (MATHML_ANNOTATION_ENCODINGS[lang]) {
          mimeType = MATHML_ANNOTATION_ENCODINGS[lang];
          formula = $annotation.text();
        }
      }
      $editor.find("input[name=mime-type][value='" + mimeType + "']").attr('checked', true);
      $formula.val(formula);
      keyTimeout = null;
      keyDelay = function() {
        var formulaWrapped;
        formula = jQuery(this).val();
        mimeType = $editor.find('input[name=mime-type]:checked').val();
        if (LANGUAGES[mimeType].raw) {
          $span[0].innerHTML = formula;
        } else {
          formulaWrapped = LANGUAGES[mimeType].open + formula + LANGUAGES[mimeType].close;
          $span.text(formulaWrapped);
        }
        triggerMathJax($span);
        $span.data('math-formula', formula);
        return $formula.trigger('focus');
      };
      $formula.data('math-old', $formula.val());
      $formula.on('keyup', function() {
        var val;
        val = jQuery(this).val();
        if ($formula.data('math-old') !== val) {
          $formula.data('math-old', val);
          clearTimeout(keyTimeout);
          return setTimeout(keyDelay.bind(this), 500);
        }
      });
      radios = $editor.find('input[name=mime-type]');
      radios.on('click', function() {
        radios.attr('checked', false);
        jQuery(this).attr('checked', true);
        clearTimeout(keyTimeout);
        return setTimeout(keyDelay.bind($formula), 500);
      });
      return $editor;
    };
    Aloha.bind('aloha-editable-activated', function(event, data) {
      var editable;
      editable = data.editable;
      return jQuery(editable.obj).on('click.matheditor', '.math-element, .math-element *', function(evt) {
        var $el, range;
        $el = jQuery(this);
        if (!$el.is('.math-element')) {
          $el = $el.parents('.math-element');
        }
        $el.contentEditable(false);
        range = new GENTICS.Utils.RangeObject();
        range.startContainer = range.endContainer = $el[0];
        range.startOffset = range.endOffset = 0;
        Aloha.Selection.rangeObject = range;
        Aloha.trigger('aloha-selection-changed', range);
        return evt.stopPropagation();
      });
    });
    SELECTOR = '.math-element';
    return Bubble.register({
      selector: SELECTOR,
      populator: buildEditor,
      placement: 'top',
      noHover: true,
      focus: function($popover) {
        return setTimeout(function() {
          return $popover.find('.formula').trigger('focus');
        }, 10);
      }
    });
  });

}).call(this);
