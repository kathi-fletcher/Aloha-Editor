// Generated by CoffeeScript 1.3.3
(function() {

  define(['aloha', 'jquery', 'aloha/console'], function(Aloha, jQuery, console) {
    var filter, populator, selector, showModalDialog;
    showModalDialog = function($a) {
      var appendOption, dialog, externalDiv, externalHref, figuresAndTables, href, linkContents, onCancel, onOk, orgElements, root, select;
      root = Aloha.activeEditable.obj;
      dialog = jQuery('<div class="link-chooser"></div>');
      if (!$a.children()[0]) {
        jQuery('<label>Text to display</label>').appendTo(dialog);
        linkContents = jQuery('<input class="contents"></input>').appendTo(dialog);
        linkContents.val($a.text());
      }
      externalDiv = jQuery('<div class="link-location">\n  <div class="link-radio">\n    <input type="radio" name="link-to-where" id="ltw-external"/>\n  </div>\n  <label for="ltw-external">Link to webpage</label>\n</div>').appendTo(dialog);
      externalHref = jQuery('<input class="href external"></input>').appendTo(externalDiv);
      externalDiv.find('input[name=link-to-where]').on('change', function() {
        var checked;
        checked = jQuery(this).attr('checked');
        if (!checked) {
          externalHref.addClass('disabled');
        }
        if (checked) {
          return externalHref.removeClass('disabled');
        }
      });
      href = $a.attr('href');
      if (href.match(/^https?:\/\//)) {
        externalHref.val(href);
        externalHref.removeClass('disabled');
      }
      select = jQuery('<select class="link-list" size="5"></select>');
      select.appendTo(dialog);
      appendOption = function(id, contentsToClone) {
        var clone, contents, option;
        clone = contentsToClone[0].cloneNode(true);
        contents = jQuery(clone).contents();
        option = jQuery('<option></option>');
        option.attr('value', '#' + id);
        option.append(contents);
        return option.appendTo(select);
      };
      orgElements = root.find('h1,h2,h3,h4,h5,h6');
      figuresAndTables = root.find('figure,table');
      orgElements.filter(':not([id])').each(function() {
        return jQuery(this).attr('id', GENTICS.Utils.guid());
      });
      orgElements.each(function() {
        var id, item;
        item = jQuery(this);
        id = item.attr('id');
        return appendOption(id, item);
      });
      figuresAndTables.each(function() {
        var caption, id, item;
        item = jQuery(this);
        id = item.attr('id');
        caption = item.find('caption,figcaption');
        return appendOption(id, caption);
      });
      select.val($a.attr('href'));
      onOk = function() {
        if (linkContents.val() && linkContents.val().trim()) {
          $a.contents().remove();
          $a.append(linkContents.val());
        }
        if (select.val()) {
          $a.attr('href', select.val());
        }
        return jQuery(this).dialog('close');
      };
      onCancel = function() {
        return jQuery(this).dialog('close');
      };
      dialog.dialog({
        dialogClass: 'aloha link-editor',
        modal: true,
        buttons: {
          OK: onOk,
          Cancel: onCancel
        }
      });
      return dialog;
    };
    selector = 'a';
    filter = function() {
      return this.nodeName.toLowerCase() === 'a';
    };
    populator = function($bubble) {
      var $el, a, change, href;
      $el = this;
      href = $el.attr('href');
      a = jQuery('<a target="_blank" rel="noreferrer"></a>').appendTo($bubble);
      a.attr('href', href);
      a.append(href);
      $bubble.append(' - ');
      change = jQuery('<a href="javascript:void">Change</a>');
      return change.appendTo($bubble).on('mousedown', function() {
        var dialog;
        dialog = showModalDialog($el);
        dialog.addClass('aloha');
        return dialog.on('dialogclose', function() {
          a.attr('href', $el.attr('href'));
          a.contents().remove();
          return a.append($el.attr('href'));
        });
      });
    };
    return {
      selector: selector,
      populator: populator,
      filter: filter
    };
  });

}).call(this);
