// Generated by CoffeeScript 1.3.3
(function() {

  define(['aloha', 'jquery', 'popover', 'ui/ui', 'css!assorted/css/image.css'], function(Aloha, jQuery, Popover, UI) {
    var DIALOG_HTML, WARNING_IMAGE_PATH, populator, selector, showModalDialog;
    WARNING_IMAGE_PATH = '/../plugins/oerpub/image/img/warning.png';
    DIALOG_HTML = '<form class="plugin image modal hide fade" id="linkModal" tabindex="-1" role="dialog" aria-labelledby="linkModalLabel" aria-hidden="true" data-backdrop="false">\n  <div class="modal-header">\n    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\n    <h3>Edit Image</h3>\n  </div>\n  <div class="modal-body">\n    <div class="image-options">\n        <button class="btn btn-link upload-image-link">Choose a file</button> OR <button class="btn btn-link upload-url-link">get file from the Web</button>\n        <div class="placeholder preview hide">\n          <h4>Preview</h4>\n          <img class="preview-image"/>\n        </div>\n        <input type="file" class="upload-image-input" />\n        <input type="url" class="upload-url-input" placeholder="Enter URL of image ..."/>\n    </div>\n    <div class="image-alt">\n      <div class="forminfo">\n        Please provide a description of this image for the visually impaired.\n      </div>\n      <div>\n        <textarea name="alt" type="text" required="required" placeholder="Enter description ..."></textarea>\n      </div>\n    </div>\n  </div>\n  <div class="modal-footer">\n    <button type="submit" class="btn btn-primary action insert">Save</button>\n    <button class="btn action cancel">Cancel</button>\n  </div>\n</form>';
    showModalDialog = function($el) {
      var $placeholder, $submit, $uploadImage, $uploadUrl, deferred, dialog, imageAltText, imageSource, loadLocalFile, root, setImageSource, settings,
        _this = this;
      settings = Aloha.require('assorted/assorted-plugin').settings;
      root = Aloha.activeEditable.obj;
      dialog = jQuery(DIALOG_HTML);
      $placeholder = dialog.find('.placeholder.preview');
      $uploadImage = dialog.find('.upload-image-input').hide();
      $uploadUrl = dialog.find('.upload-url-input').hide();
      $submit = dialog.find('.action.insert');
      if ($el.is('img')) {
        imageSource = $el.attr('src');
        imageAltText = $el.attr('alt');
      } else {
        imageSource = '';
        imageAltText = '';
      }
      dialog.find('[name=alt]').val(imageAltText);
      if (/^https?:\/\//.test(imageSource)) {
        $uploadUrl.val(imageSource);
        $uploadUrl.show();
      }
      (function(img, baseurl) {
        return img.onerror = function() {
          var errimg;
          errimg = baseurl + WARNING_IMAGE_PATH;
          if (img.src !== errimg) {
            return img.src = errimg;
          }
        };
      })(dialog.find('.placeholder.preview img')[0], Aloha.settings.baseUrl);
      setImageSource = function(href) {
        imageSource = href;
        return $submit.removeClass('disabled');
      };
      loadLocalFile = function(file, $img, callback) {
        var reader;
        reader = new FileReader();
        reader.onloadend = function() {
          if ($img) {
            $img.attr('src', reader.result);
          }
          setImageSource(reader.result);
          if (callback) {
            return callback(reader.result);
          }
        };
        return reader.readAsDataURL(file);
      };
      dialog.find('.upload-image-link').on('click', function(evt) {
        evt.preventDefault();
        $placeholder.hide();
        $uploadUrl.hide();
        return $uploadImage.show();
      });
      dialog.find('.upload-url-link').on('click', function(evt) {
        evt.preventDefault();
        $placeholder.hide();
        $uploadImage.hide();
        return $uploadUrl.show();
      });
      $uploadImage.on('change', function() {
        var $previewImg, files;
        files = $uploadImage[0].files;
        if (files.length > 0) {
          if (settings.image.preview) {
            $previewImg = $placeholder.find('img');
            loadLocalFile(files[0], $previewImg);
            return $placeholder.show();
          } else {
            return loadLocalFile(files[0]);
          }
        }
      });
      $uploadUrl.on('change', function() {
        var $previewImg, url;
        $previewImg = $placeholder.find('img');
        url = $uploadUrl.val();
        setImageSource(url);
        if (settings.image.preview) {
          $previewImg.attr('src', url);
          return $placeholder.show();
        }
      });
      deferred = $.Deferred();
      dialog.on('submit', function(evt) {
        var img;
        evt.preventDefault();
        if ($el.is('img')) {
          $el.attr('src', imageSource);
          $el.attr('alt', dialog.find('[name=alt]').val());
        } else {
          img = jQuery('<img/>');
          img.attr('src', imageSource);
          img.attr('alt', dialog.find('[name=alt]').val());
          $el.replaceWith(img);
          $el = img;
        }
        deferred.resolve({
          target: $el[0],
          files: $uploadImage[0].files
        });
        return dialog.modal('hide');
      });
      dialog.on('click', '.btn.action.cancel', function(evt) {
        evt.preventDefault();
        deferred.reject({
          target: $el[0]
        });
        return dialog.modal('hide');
      });
      dialog.on('hidden', function(event) {
        if (deferred.state() === 'pending') {
          deferred.reject({
            target: $el[0]
          });
        }
        return dialog.remove();
      });
      return jQuery.extend(true, deferred.promise(), {
        show: function() {
          return dialog.modal('show');
        }
      });
    };
    selector = 'img';
    populator = function($el, pover) {
      var $bubble, editable, href;
      editable = Aloha.activeEditable;
      $bubble = jQuery('<div class="link-popover">\n  <button class="btn change">Change...</button>\n  <button class="btn btn-danger remove">Remove</button>\n</div>');
      href = $el.attr('src');
      $bubble.find('.change').on('click', function() {
        var promise;
        Aloha.activeEditable = editable;
        promise = showModalDialog($el);
        promise.done(function(data) {
          if (data.files.length) {
            return Aloha.trigger('aloha-upload-file', {
              target: data.target,
              files: data.files
            });
          }
        });
        return promise.show();
      });
      $bubble.find('.remove').on('click', function() {
        pover.stopOne($el);
        return $el.remove();
      });
      return $bubble.contents();
    };
    UI.adopt('insertImage-oer', null, {
      click: function() {
        var newEl, promise;
        newEl = jQuery('<span class="aloha-ephemera image-placeholder"> </span>');
        GENTICS.Utils.Dom.insertIntoDOM(newEl, Aloha.Selection.getRangeObject(), Aloha.activeEditable.obj);
        promise = showModalDialog(newEl);
        promise.done(function(data) {
          if (data.files.length) {
            return Aloha.trigger('aloha-upload-file', {
              target: data.target,
              files: data.files
            });
          }
        });
        promise.fail(function(data) {
          var $target;
          $target = jQuery(data.target);
          if (!$target.is('img')) {
            return $target.remove();
          }
        });
        return promise.show();
      }
    });
    return {
      selector: selector,
      populator: populator,
      hover: true
    };
  });

}).call(this);
