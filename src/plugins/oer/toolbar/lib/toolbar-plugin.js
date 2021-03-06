// Generated by CoffeeScript 1.3.3
(function() {

  define(["aloha", "aloha/plugin", "ui/ui", "PubSub"], function(Aloha, Plugin, Ui, PubSub) {
    var CONTAINER_JQUERY, makeItemRelay;
    CONTAINER_JQUERY = jQuery('.toolbar');
    if (CONTAINER_JQUERY.length === 0) {
      CONTAINER_JQUERY = jQuery('<div></div>').addClass('toolbar-container aloha').appendTo('body');
    }
    makeItemRelay = function(slot, $buttons) {
      var ItemRelay;
      ItemRelay = (function() {

        function ItemRelay() {}

        ItemRelay.prototype.show = function() {
          return $buttons.removeClass('hidden');
        };

        ItemRelay.prototype.hide = function() {};

        ItemRelay.prototype.setActive = function(bool) {
          if (!bool) {
            $buttons.removeClass('active');
          }
          if (bool) {
            return $buttons.addClass('active');
          }
        };

        ItemRelay.prototype.setState = function(bool) {
          return this.setActive(bool);
        };

        ItemRelay.prototype.enable = function(bool) {
          if (bool == null) {
            bool = true;
          }
          if ($buttons.is('.btn')) {
            if (!bool) {
              $buttons.attr('disabled', 'disabled');
            }
            if (bool) {
              return $buttons.removeAttr('disabled');
            }
          } else {
            if (!bool) {
              $buttons.parent().addClass('disabled');
            }
            if (bool) {
              return $buttons.parent().removeClass('disabled');
            }
          }
        };

        ItemRelay.prototype.disable = function() {
          return this.enable(false);
        };

        ItemRelay.prototype.setActiveButton = function(a, b) {
          return console && console.log("" + slot + " TODO:SETACTIVEBUTTON:", a, b);
        };

        ItemRelay.prototype.focus = function(a) {
          return console && console.log("" + slot + " TODO:FOCUS:", a);
        };

        ItemRelay.prototype.foreground = function(a) {
          return console && console.log("" + slot + " TODO:FOREGROUND:", a);
        };

        return ItemRelay;

      })();
      return new ItemRelay();
    };
    CONTAINER_JQUERY.find('.action').add(CONTAINER_JQUERY.find('a.action').parent()).addClass('disabled missing-a-click-event').on('click', function(evt) {
      return evt.preventDefault();
    });
    Ui.adopt = function(slot, type, settings) {
      var $buttons, evt;
      evt = $.Event('aloha.toolbar.adopt');
      $.extend(evt, {
        params: {
          slot: slot,
          type: type,
          settings: settings
        },
        component: null
      });
      PubSub.pub(evt.type, evt);
      if (evt.isDefaultPrevented()) {
        evt.component.adoptParent(toolbar);
        return evt.component;
      }
      $buttons = CONTAINER_JQUERY.find(".action." + slot);
      $buttons.add($buttons.parent()).removeClass('disabled missing-a-click-event');
      $buttons.off('click');
      $buttons.on('click', function(evt) {
        evt.preventDefault();
        Aloha.activeEditable = Aloha.activeEditable || squirreledEditable;
        this.element = this;
        return settings.click.bind(this)(evt);
      });
      if (settings.preview) {
        $buttons.off('mouseenter');
        $buttons.on('mouseenter', function(evt) {
          return settings.preview.bind(this)(evt);
        });
      }
      if (settings.unpreview) {
        $buttons.off('mouseleave');
        $buttons.on('mouseleave', function(evt) {
          return settings.unpreview.bind(this)(evt);
        });
      }
      return makeItemRelay(slot, $buttons);
    };
    /*
       register the plugin with unique name
    */

    return Plugin.create("toolbar", {
      init: function() {
        var changeHeading, headings, squirreledEditable, toolbar;
        toolbar = this;
        squirreledEditable = null;
        changeHeading = function(evt) {
          var $el, $newEl, $oldEl, hTag, rangeObject;
          $el = jQuery(this);
          hTag = $el.attr('data-tagname');
          rangeObject = Aloha.Selection.getRangeObject();
          if (rangeObject.isCollapsed()) {
            GENTICS.Utils.Dom.extendToWord(rangeObject);
          }
          Aloha.Selection.changeMarkupOnSelection(Aloha.jQuery("<" + hTag + "></" + hTag + ">"));
          $oldEl = Aloha.jQuery(rangeObject.getCommonAncestorContainer());
          $newEl = Aloha.jQuery(Aloha.Selection.getRangeObject().getCommonAncestorContainer());
          $newEl.addClass($oldEl.attr('class'));
          return evt.preventDefault();
        };
        headings = CONTAINER_JQUERY.find(".changeHeading");
        headings.on('click', changeHeading);
        headings.add(headings.parent()).removeClass('disabled missing-a-click-event').removeAttr('disabled');
        Aloha.bind('aloha-editable-activated', function(event, data) {
          return squirreledEditable = data.editable;
        });
        return Aloha.bind("aloha-selection-changed", function(event, rangeObject) {
          var $el, currentHeading;
          $el = Aloha.jQuery(rangeObject.startContainer);
          currentHeading = CONTAINER_JQUERY.find('.currentHeading');
          currentHeading.text(headings.first().text());
          currentHeading.on('click', function(evt) {
            return evt.preventDefault();
          });
          return headings.each(function() {
            var heading, selector;
            heading = jQuery(this);
            selector = heading.attr('data-tagname');
            if (selector && $el.parents(selector)[0]) {
              return currentHeading.text(heading.text());
            }
          });
        });
      },
      childVisible: function(childComponent, visible) {
        var evt;
        evt = $.Event('aloha.toolbar.childvisible');
        evt.component = childComponent;
        evt.visible = visible;
        return PubSub.pub(evt.type, evt);
      },
      childFocus: function(childComponent) {
        var evt;
        evt = $.Event('aloha.toolbar.childfocus');
        evt.component = childComponent;
        return PubSub.pub(evt.type, evt);
      },
      childForeground: function(childComponent) {
        var evt;
        evt = $.Event('aloha.toolbar.childforeground');
        evt.component = childComponent;
        return PubSub.pub(evt.type, evt);
      },
      /*
           toString method
      */

      toString: function() {
        return "toolbar";
      }
    });
  });

}).call(this);
