// Generated by CoffeeScript 1.3.3
(function() {

  define(['aloha', 'jquery', 'popover', 'ui/ui'], function(Aloha, jQuery, Popover, UI) {
    var DIALOG_HTML, WARNING_IMAGE_PATH, populator, selector, showModalDialog;
    WARNING_IMAGE_PATH = '/../plugins/oerpub/image/img/warning.png';
    DIALOG_HTML = '<form class="plugin image modal hide fade" id="linkModal" tabindex="-1" role="dialog" aria-labelledby="linkModalLabel" aria-hidden="true">\n  <div class="modal-header">\n    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\n    <h3>Edit Image</h3>\n  </div>\n  <div class="image-options">\n      <button class="btn btn-link upload-image-link">Choose a file</button> OR <button class="btn btn-link upload-url-link">get file from the Web</button>\n      <div class="placeholder preview hide">\n        <h4>Preview</h4>\n        <img class="preview-image"/>\n      </div>\n      <input type="file" class="upload-image-input" />\n      <input type="url" class="upload-url-input" placeholder="Enter URL of image ..."/>\n  </div>\n  <div class="image-alt">\n    <div class="forminfo">\n      Please provide a description of this image for the visually impaired.\n    </div>\n    <div>\n      <textarea name="alt" type="text" required placeholder="Enter description ..."></textarea>\n    </div>\n  </div>\n  <div class="modal-footer">\n    <button type="submit" class="btn btn-primary action insert">Save</button>\n    <button class="btn" data-dismiss="modal">Cancel</button>\n  </div>\n</form>';
    showModalDialog = function($el) {
      var $placeholder, $submit, $uploadImage, $uploadUrl, dialog, imageAltText, imageSource, loadLocalFile, root, setImageSource,
        _this = this;
      root = Aloha.activeEditable.obj;
      dialog = jQuery(DIALOG_HTML);
      $placeholder = dialog.find('.placeholder.preview');
      $uploadImage = dialog.find('.upload-image-input').hide();
      $uploadUrl = dialog.find('.upload-url-input').hide();
      $submit = dialog.find('.submit');
      imageSource = $el.attr('src');
      imageAltText = $el.attr('alt');
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
          $img.attr('src', reader.result);
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
          $previewImg = $placeholder.find('img');
          loadLocalFile(files[0], $previewImg);
          return $placeholder.show();
        }
      });
      $uploadUrl.on('change', function() {
        var $previewImg, url;
        $previewImg = $placeholder.find('img');
        url = $uploadUrl.val();
        setImageSource(url);
        $previewImg.attr('src', url);
        return $placeholder.show();
      });
      dialog.on('submit', function(evt) {
        var range;
        evt.preventDefault();
        $el.attr('src', imageSource);
        $el.attr('alt', dialog.find('[name=alt]').val());
        dialog.modal('hide');
        if (!$el.parent()[0]) {
          range = Aloha.Selection.getRangeObject();
          $el.addClass('aloha-new-image');
          GENTICS.Utils.Dom.insertIntoDOM($el, range, Aloha.activeEditable.obj);
          $el = Aloha.jQuery('.aloha-new-image');
          $el.removeClass('aloha-new-image');
        }
        if ($uploadImage[0].files.length) {
          $el[0].files = $uploadImage[0].files;
          $el.addClass('aloha-image-uploading');
          return Aloha.trigger('aloha-upload-file', $el[0]);
        }
      });
      dialog.on('hidden', function() {
        return dialog.remove();
      });
      return dialog;
    };
    selector = 'img';
    populator = function($el) {
      var $bubble, editable, href;
      editable = Aloha.activeEditable;
      $bubble = jQuery('<div class="link-popover">\n  <button class="btn change">Change...</button>\n  <button class="btn btn-danger remove">Remove</button>\n</div>');
      href = $el.attr('src');
      $bubble.find('.change').on('click', function() {
        var dialog;
        Aloha.activeEditable = editable;
        dialog = showModalDialog($el);
        return dialog.modal('show');
      });
      $bubble.find('.remove').on('click', function() {
        return $el.remove();
      });
      return $bubble.contents();
    };
    UI.adopt('insertImage-oer', null, {
      click: function() {
        var dialog, newEl;
        newEl = jQuery('<img/>');
        dialog = showModalDialog(newEl);
        return dialog.modal('show');
      }
    });
    return Popover.register({
      hover: true,
      selector: selector,
      populator: populator
    });
  });

}).call(this);
