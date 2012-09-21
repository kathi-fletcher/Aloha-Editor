define([ 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button', 'ui/port-helper-attribute-field', 'ui/scopes' ],
function( plugin, $, ui, button, attributeField, scopes, floatingMenu ) 
{
    "use strict";
    
    var cntEq = 0;
    
    return plugin.create( 'mathedit', 
    {
        defaults: 
        {
            wrapPrefix: 'eqprefix-'
        },
        hotKey: { insertTexMath: 'ctrl+m', insertAsciiMath: 'ctrl+j', insertMLMath: 'ctrl+k' },
        init: function() 
        {
            var editableObj = null;
            var self = this,
                wrapPrefix = this.settings.wrapPrefix;
            
            // MathJax init
            var script0 = document.createElement("script");
            script0.type = "text/x-mathjax-config";
            $(script0).html( 'MathJax.Hub.Config({'
                    + 'jax: ["input/MathML", "input/TeX", "input/AsciiMath", "output/NativeMML"],'
                    + 'extensions: ["asciimath2jax.js", "tex2jax.js","mml2jax.js","MathMenu.js","MathZoom.js"],'
                    + 'tex2jax: { inlineMath: [["$","$"]] },'
                    + 'asciimath2jax: { inlineMath: [["`", "`"]], delimiters: [["`","`"]] },'
                    + 'TeX: {'
                        + 'extensions: ["AMSmath.js","AMSsymbols.js","noErrors.js","noUndefined.js"], noErrors: { disabled: true }'
                    + '},'
                    + 'AsciiMath: { noErrors: { disabled: true } }'
                    + '});');
            
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src  = "http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=default";
            var config = 'MathJax.Hub.Startup.onload();';
            $(script).html(config);
            
            document.getElementsByTagName("head")[0].appendChild(script0);
            document.getElementsByTagName("head")[0].appendChild(script);

            var inChange = false;

            var Inserted = [];
            var currentEditor = null;
            var currentLength = -1;
            var editorToOffset = { };
            

            function convertToConcrete(character, ele, leVal, currentOffset) {
                for(var i = 0; i < Inserted.length; i++) {
                    if(Inserted[i].loc == currentOffset+1 && Inserted[i].character == character) {
                        Inserted.splice(i, 1);
                        if(ele.val() == leVal) {
                            ele.val(leVal.slice(0,currentOffset+1)+leVal.slice(currentOffset+2));
                            leVal = ele.val();
                        } else {
                            ele.text(leVal.slice(0,currentOffset+1)+leVal.slice(currentOffset+2));
                            leVal = ele.text();
                        }
                        window.getSelection().getRangeAt(0).setStart(window.getSelection().focusNode.childNodes[0], currentOffset+1);
                        break;
                    }
                }
                return leVal;
            }

            function generateInserted(ele, leVal, offset, character) {
                if(ele.val() == leVal) {
                    ele.val(leVal.slice(0,offset+1)+character+leVal.slice(offset+1));
                    leVal = ele.val();
                } else {
                    ele.text(leVal.slice(0,offset+1)+character+leVal.slice(offset+1));
                    leVal = ele.text();
                }
                window.getSelection().getRangeAt(0).setStart(window.getSelection().focusNode.childNodes[0], offset+1);
                Inserted.push({ start: offset, loc: offset+1, character: character });
                return leVal;
            }
           
            function onTexCharChange(evt) {
                if(inChange) return;
                inChange = true;

                console.log(evt);

                var range = window.getSelection().getRangeAt(0);
                var offset = range.startOffset;
                console.log(Inserted);
                var eqId = evt.currentTarget.id.substring(5);
                var ele = $('#'+evt.currentTarget.id);
                var leVal = ele.val() || ele.text();
                console.log(currentLength+ " "+leVal.length);
                var ch = leVal[offset];
                var diff = leVal.length - currentLength;

                // bulk delete
                if(leVal.length < currentLength && currentLength - leVal.length > 1) {
                    var i = 0;
                    while(i < Inserted.length) {
                        if(Inserted[i].loc >= offset && Inserted[i].loc < offset + (currentLength - leVal.length)) {
                            // if closing virtual is in the range of deleted characters, remove it from Inserted
                            Inserted.splice(i, 1);
                        } else if(Inserted[i].start >= offset && Inserted[i].start < offset + (currentLength - leVal.length)) {
                            // if opening for a closing virtual is in the range of deleted characters (but not the closing), make it concrete
                            Inserted.splice(i, 1);
                        } else {
                            i = i + 1;
                        }
                    }
                }

                var didRemove = false;
                for(var i = 0; i < Inserted.length; i++) {

                    // if this was a delete or backspace that removed character(s)
                    if(leVal.length < currentLength) {
                        // if this delete was on the opening character of a virtual closing character and there is no content in between
                        if(offset == Inserted[i].start && Inserted[i].loc == Inserted[i].start + 1) {
                            diff = diff - 1;

                           if(ele.val() == leVal) {
                                ele.val(leVal.slice(0,offset)+leVal.slice(offset+1));
                                leVal = ele.val();
                            } else {
                                ele.text(leVal.slice(0,offset)+leVal.slice(offset+1));
                                leVal = ele.text();
                            }
                            Inserted.splice(i, 1);
                            window.getSelection().getRangeAt(0).setStart(window.getSelection().focusNode.childNodes[0], offset);
                            // this can only occur once
                            didRemove = true;
                            break;
                        }
                    }
                }

                if(!didRemove) {
                    // if inserted character that is beyond the bounds of a virtual paren pair
                    var i = 0;
                    while(i < Inserted.length) {
                        if(offset > Inserted[i].loc || offset <= Inserted[i].start) {
                            Inserted.splice(i, 1);
                        } else {
                            i = i + 1;
                        }
                    }
                }

                // update the offsets of the remaining virtual parens
                for(var i = 0; i < Inserted.length; i++) {

                    if(Inserted[i].start >= offset) {
                        Inserted[i].start = Inserted[i].start + diff;
                    }

                    if(Inserted[i].loc >= offset) {
                        Inserted[i].loc = Inserted[i].loc + diff;
                    }
                }

                switch(ch) {
                    case(')'):
                    case('}'):
                        leVal = convertToConcrete(ch, ele, leVal, offset);
                        break;
                    case('{'):
                        leVal = generateInserted(ele, leVal, offset, '}');
                        break;
                    case('('):
                        leVal = generateInserted(ele, leVal, offset, ')');
                        break;
                }
                MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],"\\displaystyle{"+leVal+"}"]);
                inChange = false;
                currentLength = leVal.length;
            }

            function onAsciiCharChange(evt) {
                var eqId = evt.currentTarget.id.substring(5);
                var ele = $('#'+evt.currentTarget.id);
                var leVal = ele.val() || ele.text();
                MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],leVal]);
            }

            function enableEditor(editor, length) {
                if(currentEditor != null && currentEditor[0] != editor[0]) {
                    disableEditor();
                }
                currentEditor = editor;
                currentLength = length;
                GENTICS.Utils.Dom.setCursorInto( editor[0] );
                if(editorToOffset[editor[0].id] != null) {
                    window.getSelection().getRangeAt(0).setStart(window.getSelection().focusNode.childNodes[0], editorToOffset[editor[0].id]);
                }
                editor.show();
            }

            function disableEditor() {
                if(currentEditor != null) {
                    editorToOffset[currentEditor[0].id] = window.getSelection().getRangeAt(0).startOffset;
                    currentEditor.hide();
                    currentEditor = null;
                }
            }

            function generateMathContainer(openDelimiter, closeDelimiter, charChangeFunction, initValue, editableObj) {
                var newElId = wrapPrefix+cntEq;
                var range = Aloha.Selection.getRangeObject();
                var newMathEditContainer = $('<div id="edit-'+newElId+'" style="padding:2px;min-height:28px;border:1px solid green;-moz-border-radius: 4px;-webkit-border-radius: 4px;-khtml-border-radius: 4px;border-radius: 4px;background-color:white;">'+initValue+'</div>');
                var newMathContainer = $('<div id="'+newElId+'" style="left;border:1px dotted grey">'+openDelimiter+closeDelimiter+'</div>');
                
                GENTICS.Utils.Dom.insertIntoDOM( newMathEditContainer, range, $( Aloha.activeEditable.obj ) );
                GENTICS.Utils.Dom.insertIntoDOM( newMathContainer, range, $( Aloha.activeEditable.obj ) );
                GENTICS.Utils.Dom.setCursorInto( newMathEditContainer[0] );
                newMathEditContainer.bind('DOMCharacterDataModified', charChangeFunction);
                newMathEditContainer.bind('DOMNodeInserted', charChangeFunction);
                newMathEditContainer.hide();
               
                if(initValue == '') {
                    MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, newElId, function() { 
                        enableEditor(newMathEditContainer, 0);
                    }]);
                } else {

                    if(openDelimiter == '${') {

                        MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, newElId, function() { 
                               enableEditor(newMathEditContainer, initValue.length);
                               MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(newElId)[0],"\\displaystyle{"+initValue+"}"]);
                        }]);
                    } else {

                        MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, newElId, function() { 
                               enableEditor(newMathEditContainer, initValue.length);
                               MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(newElId)[0],initValue]);
                        }]);
                    }
                }
                                    
                var blurout = function()
                {
                    Inserted = [];
                    disableEditor();
                };

                var editableClickBlurout = function(evt) {
                    if(currentEditor != null) {
                        var id = evt.target.id;
                        if(id == null) {
                            return;
                        }
                        if(id.length > 8) {
                            if(id.substring(0, 8) == 'eqprefix-') {
                                return;
                            }
                        }
                        if(id.length > 13) {
                            if(id.substring(0, 13) == 'edit-eqprefix-') {
                                return;
                            }
                        }
                        disableEditor();
                    }
                };

/*
                $(editableObj).on('blur focusout', blurout);
                $(editableObj).on('click', editableClickBlurout);
*/
                newMathEditContainer.on('focusout', blurout);
                newMathEditContainer.on('blur', blurout);
                
                newMathContainer.on('click', function()
                {
                    Inserted = [];
                    enableEditor(newMathEditContainer, newMathEditContainer.val() ? newMathEditContainer.val().length : newMathEditContainer.text().length );
                });

                cntEq++;

            }

            function toggleMath()
            {
                if( Aloha.activeEditable ) 
                {
                    var range = Aloha.Selection.getRangeObject()
                    if ( !( range.startContainer && range.endContainer ) ) {
                        return;
                    }
                    
                    // get text from selection
                    var leText = range.getText();
                    
                    if( $.trim(leText) === '' ) return;
                    
                    GENTICS.Utils.Dom.removeRange(range);
                    // make a new placeholder for the new equation

                    generateMathContainer('${','}$', onTexCharChange, leText, editableObj);
                }
            }
            
            scopes.createScope('math', 'Aloha.empty');
            
            self._mathCtrl = ui.adopt( 'characterPicker'/*"math"*/, button, 
            {
                tooltip: 'Math', /*i18n.t('button.addmath.tooltip'),*/
                icon: "M",
                click: toggleMath
            });
            
            var parsedJax = false; 
            Aloha.bind('aloha-editable-activated', function (event, data) 
            {
                
                !parsedJax && (function()
                {
                    parsedJax = true;
                    MathJax.Hub.Queue(["Typeset",MathJax.Hub, null, function()
                    { 
                        $(MathJax.Hub.getAllJax()).each(function()
                        { 
                            var elfr = $('#'+this.inputID+'-Frame'),
                                el = $('#'+this.inputID),
                                elpr = $('#'+this.inputID+'-Frame').prevAll('.MathJax_Preview').eq(0),
                                eqWrapper = $('<span id="'+wrapPrefix+cntEq+'" />').insertBefore(elpr)
                                    .append(elpr).append(elfr).append(el)
                                    .data('equation', this.originalText);
                            
                            cntEq++;
                        }); 
                    }]);
                })();
                self._mathCtrl.show();
            });
            
           
            Aloha.bind('aloha-editable-created', function (event, editable) 
            {
                console.log("HOWDY PARDNER");
                editableObj = editable.obj;
                
                editable.obj.bind('keydown', self.hotKey.insertTexMath, function() 
                {
                    generateMathContainer('${','}$', onTexCharChange, '', editable.obj);
                });

                editable.obj.bind('keydown', self.hotKey.insertAsciiMath, function() 
                {
                    generateMathContainer('`','`', onAsciiCharChange, '', editable.obj);
                });
                editable.obj.bind('keydown', self.hotKey.insertMLMath, function() 
                {
                    generateMathContainer('<math>','</math>', onAsciiCharChange, '', editable.obj);
                });
            });

        }
    });
});
