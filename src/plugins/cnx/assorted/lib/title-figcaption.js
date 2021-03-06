// Generated by CoffeeScript 1.3.3
(function() {

  define(['aloha', 'jquery', 'aloha/console', 'css!./title-figcaption.css'], function(Aloha, jQuery, console) {
    var buildTitle, populator, selector;
    buildTitle = function($el, content) {
      if (content == null) {
        content = null;
      }
      $el.text('');
      if (content && content[0]) {
        return $el.append(content);
      } else {
        return $el.addClass('empty');
      }
    };
    selector = '.title,figcaption';
    populator = function($el) {
      var $bubble, deleteBtn, editable;
      editable = Aloha.activeEditable;
      $bubble = jQuery('<button class="btn btn-danger"><i class="icon-remove icon-white"></i> Remove</button>');
      deleteBtn = $bubble.on('click', function() {
        $el.text('');
        $el.removeClass('focus');
        return $el.addClass('empty');
      });
      return $bubble;
    };
    return {
      selector: selector,
      populator: populator,
      placement: 'right',
      focus: function() {
        var $el;
        $el = jQuery(this);
        $el.addClass('focus');
        return $el.removeClass('empty');
      },
      blur: function() {
        var $el;
        $el = jQuery(this);
        $el.removeClass('focus');
        if (!$el.text()) {
          return $el.addClass('empty');
        }
      }
    };
  });

}).call(this);
