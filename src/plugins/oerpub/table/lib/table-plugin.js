define(
['aloha', 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button', 'PubSub',
    'ui/dialog', 'aloha/ephemera', 'table/table-create-layer', 'css!table/css/table.css'],
function(Aloha, plugin, jQuery, Ui, Button, PubSub, Dialog, Ephemera, CreateLayer) {
    "use strict";

	var GENTICS = window.GENTICS;

	function prepareRangeContainersForInsertion(range, table){
		var	eNode = range.endContainer,
			sNode = range.startContainer,
			eNodeLength =(eNode.nodeType == 3)
				? eNode.length
				: eNode.childNodes.length;		
		
		if(sNode.nodeType == 3 &&
				sNode.parentNode.tagName == 'P' &&
					sNode.parentNode.childNodes.length == 1 &&
						/^(\s|%A0)$/.test( escape( sNode.data))){
			sNode.data = '';
			range.startOffset = 0;
			
			// In case ... <p> []</p>
			if(eNode == sNode){
				range.endOffset = 0;
			}
		}
		
		// If the table is not allowed to be nested inside the startContainer,
		// then it will have to be split in order to insert the table.
		// We will therefore check if the selection touches the start and/or
		// end of their container nodes.
		// If they do, we will mark their container so that after they are
		// split we can check whether or not they should be removed
		if(!GENTICS.Utils.Dom.allowsNesting(
				sNode.nodeType == 3 ? sNode.parentNode : sNode, table)){
			
			if(range.startOffset == 0){
				jQuery( sNode.nodeType == 3 ? sNode.parentNode : sNode)
					.addClass( 'aloha-table-cleanme');
			}
			
			if(range.endOffset == eNodeLength){
				jQuery( eNode.nodeType == 3 ? eNode.parentNode : eNode)
					.addClass( 'aloha-table-cleanme');
			}
		}
	}

	function cleanupAfterInsertion(){
		var dirty = jQuery('.aloha-table-cleanme').removeClass(
						'aloha-table-cleanme');
		
		for (var i=0; i<dirty.length; i++){
			if (jQuery.trim(jQuery(dirty[i]).html()) == '' &&
					!GENTICS.Utils.Dom.isEditingHost(dirty[i])){
				jQuery(dirty[i]).remove();
			}
		}
	}

	function isWithinTable(elem) {
		return (jQuery(elem).parents('.aloha-editable table').length > 0);
	}

    function createRow(cols, tagname){
        tagname = tagname || 'td';
        var tr = document.createElement('tr');
        for (var i=0; i<cols; i++) {
            var text = document.createTextNode('\u00a0');
            var td = document.createElement(tagname);
            td.appendChild(text);
            tr.appendChild(td);
        }
        return tr;
    }

    // Re-implementing this, cause Aloha.Selection gets out of sync
    // and causes weirdness.
    var getSelection = (function(window, document){
        if (window.getSelection) {
            return window.getSelection;
        } else if (document.getSelection) {
            return document.getSelection;
        }
        return function(){ throw "getSelection not implemented"; }
    })(window, document);

    function prepareTable(plugin, table){
        // Wrap table in ui-wrappper
        var w1 = jQuery('<div class="canvas-wrap aloha-ephemera-wrapper" />');
        var w2 = jQuery('<div class="table canvas aloha-ephemera-wrapper" />');
        var w3 = jQuery('<div class="canvas-inner aloha-ephemera-wrapper" />');

        table.wrap(w1).wrap(w2).wrap(w3);

        w1.attr('contentEditable', 'false');
        // glue a mouseover event onto it
        table.on('mouseenter', function(e){
            // We will later use this to bring up ui
            //console && console.log(e.target);
        });
        table.on('mouseleave', function(e){
            // We will later use this to hide ui
            //console && console.log(e.target);
        });

        table.on('click', function(e){
            plugin.clickTable(e);
        });
    }

    function placeCursor(cell){
        var range = document.createRange();
        range.setStart(cell.get(0), 0);
        range.setEnd(cell.get(0), 0);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
    }

    return plugin.create('table', {
        defaults: {
        },
        init: function(){
            var plugin = this;
            this.createLayer = new CreateLayer(this);
            this.initButtons();

            // Mark some classes as ephemeral
            Ephemera.classes('aloha-current-cell', 'aloha-current-row');

            Aloha.bind('aloha-editable-created', function(event, editable){
                editable.obj.find('table').each(function(){
                    prepareTable(plugin, jQuery(this));
                });
                editable.obj.bind('keydown', 'tab shift+tab', function(e){
                    var $cell = jQuery(
                        getSelection().focusNode).closest('td,th');
                    if ($cell.length > 0){
                        var next = function(ob, filter){
                            if (e.shiftKey){
                                return ob.prev(filter);
                            } else {
                                return ob.next(filter);
                            }
                        }
                        var border = 'td:last-child,th:last-child';
                        if (e.shiftKey){
                            border = 'td:first-child,th:first-child';
                        }
                        if ($cell.is(border)) {
                            var nextrow = next($cell.closest('tr'), 'tr');
                            if (nextrow.length > 0){
                                var offset = e.shiftKey ? nextrow[0].cells.length-1 : 0;
                                var nextcell = jQuery(nextrow[0].cells[offset]);
                                plugin.focusCell(nextcell);
                            } else {
                                // Last column, last row
                                // Add more
                                var newrow = plugin.addRowAfter();
                                if (newrow !== null){
                                    plugin.focusCell($(newrow).find('td,th').first());
                                }
                            }
                        } else {
                            var nextcell = next($cell, 'td,th');
                            plugin.focusCell(nextcell);
                        }
                    }
                    e.preventDefault();
                    e.stopPropagation();
                });
                // Disable firefox's inline table editing.
                try {
                    document.execCommand("enableInlineTableEditing", null, false);
                } catch(ignore){}
                // Place the cursor at the start of the editable. If you don't
                // do this, Firefox goes weird when placing the cursor in a
                // table cell.
                placeCursor(editable.obj);
            });
            PubSub.sub('aloha.selection.context-change', function(m){
                if ($(m.range.markupEffectiveAtStart).parent('table')
                        .length > 0) {
                    // We're inside a table, disable
                    // table insertion, enable others
                    plugin._createTableButton.enable(false);
                    plugin._addrowbeforeButton.enable(true);
                    plugin._addrowafterButton.enable(true);
                    plugin._deleterowButton.enable(true);
                    plugin._deleteColumnButton.enable(true);
                    plugin._addColumnBefore.enable(true);
                    plugin._addColumnAfter.enable(true);
                } else {
                    // Disable table functions, enable table insertion
                    plugin._createTableButton.enable(true);
                    plugin._addrowbeforeButton.enable(false);
                    plugin._addrowafterButton.enable(false);
                    plugin._deleterowButton.enable(false);
                    plugin._deleteColumnButton.enable(false);
                    plugin._addColumnBefore.enable(false);
                    plugin._addColumnAfter.enable(false);
                }
            });
            jQuery('body').on('click', function(e){
                // Click outside table deselects current row and cell
                if(!e.isDefaultPrevented() &&
                        $(e.target).parents('.aloha-editable').length){
                    plugin.currentCell.length && plugin.currentCell.removeClass('aloha-current-cell');
                    plugin.currentRow.length && plugin.currentRow.removeClass('aloha-current-row');
                    plugin.currentRow = jQuery();
                    plugin.currentCell = jQuery();
                    plugin.currentTable = jQuery();
                }
            });
        },
        initButtons: function(){
            var that = this;
            this._createTableButton = Ui.adopt("createTable", Button, {
                tooltip: "Add a new table",
                icon: "aloha-icon aloha-icon-createTable",
                scope: 'Aloha.continuoustext',
                click: function(e){
                    var layer = that.createLayer.show(e);
                    layer.on('table-create-layer.closed', function(){
                        // Once we've managed to make menus sticky, we
                        // will close the menus here.
                        //alert('closed');
                    });
                }
            });

            this._addrowbeforeButton = Ui.adopt("addrowbefore", Button, {
                tooltip: "Add new row before",
                icon: "aloha-icon aloha-icon-addrowbefore",
                scope: this.name + '.row',
                click: function(){
                    if(!that.currentRow.length){ return; }
                    var colcount = that.currentRow.find('td,th').length;
                    var newrow = createRow(colcount);
                    that.currentRow.before(newrow);
                },
                preview: function(e){
                    that.currentRow.length && that.currentRow.addClass("add-row-before");
                },
                unpreview: function(e){
                    that.currentRow.length && that.currentRow.removeClass("add-row-before");
                }
            });

            this._addrowafterButton = Ui.adopt("addrowafter", Button, {
                tooltip: "Add new row after",
                icon: "aloha-icon aloha-icon-addrowafter",
                scope: this.name + '.row',
                click: function(){
                    that.addRowAfter();
                },
                preview: function(e){
                    that.currentRow.length && that.currentRow.addClass("add-row-after");
                },
                unpreview: function(e){
                    that.currentRow.length && that.currentRow.removeClass("add-row-after");
                }
            });
            this._deleterowButton = Ui.adopt("deleterow", Button, {
                tooltip: "Delete row",
                icon: "aloha-icon aloha-icon-deleterow",
                scope: this.name + '.row',
                click: function(){
                    if(!that.currentRow.length){ return; }
                    that.currentRow.remove();
                    that.currentRow = jQuery();
                    if(that.currentTable.find("td,th").length==0){
                        that.currentTable.remove();
                        that.currentTable = jQuery();
                    }
                },
                preview: function(){
                    that.currentRow.length && that.currentRow.addClass("delete-row");
                },
                unpreview: function(){
                    that.currentRow.length && that.currentRow.removeClass("delete-row");
                }
            });
            this._deleteColumnButton = Ui.adopt("deletecolumn", Button, {
                tooltip: "Delete column",
                icon: "aloha-icon aloha-icon-deletecolumn",
                scope: this.name + '.column',
                click: function(){
                    if(!that.currentCell.length){ return; }
                    var idx = that.currentCell[0].cellIndex;
                    that.currentTable.find("tr").each(function(){
                        this.removeChild(this.cells[idx]);
                    });
                    // If the table is now devoid of any rows, delete it
                    if(that.currentTable.find("td,th").length==0){
                        that.currentTable.remove();
                        that.currentTable = jQuery();
                    }
                },
                preview: function(){
                    if(!that.currentCell.length){ return; }
                    var idx = that.currentCell[0].cellIndex;
                    that.currentTable.find("tr").each(function(){
                        jQuery(this.cells[idx]).addClass("delete-column");
                    });
                },
                unpreview: function(){
                    that.currentTable.find('td,th')
                        .removeClass('delete-column');
                }
            });
            this._addColumnBefore = Ui.adopt("addcolumnbefore", Button, {
                tooltip: "Add new column before",
                icon: "aloha-icon aloha-icon-addcolumnbefore",
                scope: this.name + '.column',
                click: function(){
                    if(!that.currentCell.length){ return; }
                    var idx = that.currentCell[0].cellIndex;
                    var table = that.currentCell.parents('.aloha-editable table');
                    table.find("tr").each(function(){
                        var toclone = $(this).find('td,th').eq(idx);
                        var newcell = toclone.clone().html('\u00a0');
                        toclone.before(newcell);
                    });
                },
                preview: function(e){
                    if(!that.currentCell.length){ return; }
                    var idx = that.currentCell[0].cellIndex;
                    that.currentTable.find("tr").each(function(){
                        jQuery(this.cells[idx]).addClass("add-column-before");
                    });
                },
                unpreview: function(e){
                    that.currentTable.find('td,th')
                        .removeClass('add-column-before');
                }
            });
            this._addColumnAfter = Ui.adopt("addcolumnafter", Button, {
                tooltip: "Add new column after",
                icon: "aloha-icon aloha-icon-addcolumnafter",
                scope: this.name + '.column',
                click: function(){
                    if(!that.currentCell.length){ return; }
                    var idx = that.currentCell[0].cellIndex;
                    that.currentTable.find("tr").each(function(){
                        var toclone = $(this).find('td,th').eq(idx);
                        var newcell = toclone.clone().html('\u00a0');
                        toclone.after(newcell);
                    });
                },
                preview: function(e){
                    if(!that.currentCell.length){ return; }
                    var idx = that.currentCell[0].cellIndex;
                    that.currentTable.find("tr").each(function(){
                        jQuery(this.cells[idx]).addClass("add-column-after");
                    });
                },
                unpreview: function(e){
                    that.currentTable.find('td,th')
                        .removeClass('add-column-after');
                }
            });
            // Disable the table functions by default, they are enabled when
            // a selection is inside a table
            this._addrowbeforeButton.enable(false);
            this._addrowafterButton.enable(false);
            this._deleterowButton.enable(false);
            this._deleteColumnButton.enable(false);
            this._addColumnBefore.enable(false);
            this._addColumnAfter.enable(false);
        },
        addRowAfter: function(){
            // Factored out because we re-use this when tabbing through the
            // table.
            if(this.currentRow.length){
                var colcount = this.currentRow.find('td,th').length;
                var newrow = createRow(colcount);
                this.currentRow.after(newrow);
                return newrow;
            }
            return null;
        },
        createTable: function(cols, rows, headerrows){
            // Check if there is an active Editable and that it contains an element (= .obj)
            if (Aloha.activeEditable && typeof Aloha.activeEditable.obj !== 'undefined'){
                // create a dom-table object
                var table = document.createElement('table');
                var tableId = table.id = GENTICS.Utils.guid();
                var tbody = document.createElement('tbody');

                // Create caption
                var caption = document.createElement('caption');
                var captiontext = document.createTextNode('Table ' + (jQuery('.aloha-editable table').length+1));
                caption.appendChild(captiontext);
                table.appendChild(caption);

                // Create headerrows of headers
                for(var i=0; i<headerrows; i++){
                    var tr = document.createElement('tr');
                    // create "cols"-number of columns
                    for (var j = 0; j < cols; j++) {
                        var text = document.createTextNode('\u00a0');
                        var td = document.createElement('th');
                        td.appendChild(text);
                        tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                }

                // create "rows"-number of rows
                for (var i=0; i<rows; i++){
                    var tr = document.createElement('tr');
                    // create "cols"-number of columns
                    for (var j = 0; j < cols; j++) {
                        var text = document.createTextNode('\u00a0');
                        var td = document.createElement('td');
                        td.appendChild(text);
                        tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                }
                table.appendChild(tbody);

                prepareRangeContainersForInsertion(
                    Aloha.Selection.getRangeObject(), table);
                
                // insert the table at the current selection
                GENTICS.Utils.Dom.insertIntoDOM(jQuery(table),
                    Aloha.Selection.getRangeObject(), Aloha.activeEditable.obj);

                cleanupAfterInsertion();
                prepareTable(this, jQuery(table));
                var ev = jQuery.Event();
                ev.type = 'blur';
                Aloha.activeEditable.smartContentChange(ev);
            } else {
                this.error('There is no active Editable where the table can be inserted!');
            }
        },
        clickTable: function(e){
            this.currentCell.length && this.currentCell.removeClass('aloha-current-cell');
            this.currentRow.length && this.currentRow.removeClass('aloha-current-row');
            this.currentCell = jQuery(e.target).closest('td,th');
            this.currentRow = jQuery(e.target).closest('tr');
            this.currentTable = jQuery(e.target).closest('table');
            this.currentCell.length && this.currentCell.addClass('aloha-current-cell');
            this.currentRow.length && this.currentRow.addClass('aloha-current-row');
            e.preventDefault();
        },
        focusCell: function(cell){
            placeCursor(cell);
            cell.click();
        },
	    error: function(msg){
            Aloha.Log.error(this, msg);
        },
        currentCell: jQuery(), // Defined when clicked
        currentRow: jQuery(),  // Defined when clicked
        currentTable: jQuery(), // Defined when clicked
        createLayer: undefined // Defined in init above.
    });
});
