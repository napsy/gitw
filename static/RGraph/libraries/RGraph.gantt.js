    /**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */
    
    if (typeof(RGraph) == 'undefined') RGraph = {};

    /**
    * The gantt chart constructor
    * 
    * @param object canvas The cxanvas object
    * @param array  data   The chart data
    */
    RGraph.Gantt = function (id)
    {
        // Get the canvas and context objects
        this.id      = id;
        this.canvas  = document.getElementById(id);
        this.context = this.canvas.getContext("2d");
        this.canvas.__object__ = this;
        this.type              = 'gantt';
        this.isRGraph          = true;


        /**
        * Compatibility with older browsers
        */
        RGraph.OldBrowserCompat(this.context);

        
        // Set some defaults
        this.properties = {
            'chart.background.barcolor1':   'white',
            'chart.background.barcolor2':   'white',
            'chart.background.grid':        true,
            'chart.background.grid.width':  1,
            'chart.background.grid.color':  '#ddd',
            'chart.background.grid.hsize':  20,
            'chart.background.grid.vsize':  20,
            'chart.background.grid.hlines': true,
            'chart.background.grid.vlines': true,
            'chart.background.grid.border': true,
            'chart.background.grid.autofit':true,
            'chart.background.grid.autofit.numhlines': 7,
            'chart.background.grid.autofit.numvlines': 20,
            'chart.background.vbars':       [],
            'chart.text.size':              10,
            'chart.text.font':              'Arial',
            'chart.text.color':             'black',
            'chart.gutter.left':            75,
            'chart.gutter.right':           25,
            'chart.gutter.top':             35,
            'chart.gutter.bottom':          25,
            'chart.labels':                 [],
            'chart.labels.align':           'bottom',
            'chart.margin':                 2,
            'chart.title':                  '',
            'chart.title.background':       null,
            'chart.title.hpos':             null,
            'chart.title.vpos':             null,
            'chart.title.bold':             true,
            'chart.title.font':             null,
            'chart.title.yaxis':            '',
            'chart.title.yaxis.bold':        true,
            'chart.title.yaxis.pos':        null,
            'chart.title.yaxis.position':   'right',
            'chart.events':                 [],
            'chart.borders':                true,
            'chart.defaultcolor':           'white',
            'chart.coords':                 [],
            'chart.tooltips':               null,
            'chart.tooltips.effect':         'fade',
            'chart.tooltips.css.class':      'RGraph_tooltip',
            'chart.tooltips.highlight':     true,
            'chart.highlight.stroke':       'black',
            'chart.highlight.fill':         'rgba(255,255,255,0.5)',
            'chart.xmin':                   0,
            'chart.xmax':                   0,
            'chart.contextmenu':            null,
            'chart.annotatable':            false,
            'chart.annotate.color':         'black',
            'chart.zoom.factor':            1.5,
            'chart.zoom.fade.in':           true,
            'chart.zoom.fade.out':          true,
            'chart.zoom.hdir':              'right',
            'chart.zoom.vdir':              'down',
            'chart.zoom.frames':            25,
            'chart.zoom.delay':             16.666,
            'chart.zoom.shadow':            true,
            'chart.zoom.mode':              'canvas',
            'chart.zoom.thumbnail.width':   75,
            'chart.zoom.thumbnail.height':  75,
            'chart.zoom.thumbnail.fixed':   false,
            'chart.zoom.background':        true,
            'chart.zoom.action':            'zoom',
            'chart.resizable':              false,
            'chart.resize.handle.adjust':   [0,0],
            'chart.resize.handle.background': null,
            'chart.adjustable':             false,
            'chart.events.click':           null,
            'chart.events.mousemove':       null
        }


        /**
        * Set the .getShape commonly named method
        */
        this.getShape = this.getBar;
    }


    /**
    * A peudo setter
    * 
    * @param name  string The name of the property to set
    * @param value mixed  The value of the property
    */
    RGraph.Gantt.prototype.Set = function (name, value)
    {
        this.properties[name.toLowerCase()] = value;
    }


    /**
    * A peudo getter
    * 
    * @param name  string The name of the property to get
    */
    RGraph.Gantt.prototype.Get = function (name)
    {
        return this.properties[name.toLowerCase()];
    }

    
    /**
    * Draws the chart
    */
    RGraph.Gantt.prototype.Draw = function ()
    {
        /**
        * Fire the onbeforedraw event
        */
        RGraph.FireCustomEvent(this, 'onbeforedraw');

        /**
        * Clear all of this canvases event handlers (the ones installed by RGraph)
        */
        RGraph.ClearEventListeners(this.id);
        
        /**
        * This is new in May 2011 and facilitates indiviual gutter settings,
        * eg chart.gutter.left
        */
        this.gutterLeft   = this.Get('chart.gutter.left');
        this.gutterRight  = this.Get('chart.gutter.right');
        this.gutterTop    = this.Get('chart.gutter.top');
        this.gutterBottom = this.Get('chart.gutter.bottom');

        /**
        * Work out the graphArea
        */
        this.graphArea     = this.canvas.width - this.gutterLeft - this.gutterRight;
        this.graphHeight   = this.canvas.height - this.gutterTop - this.gutterBottom;
        this.numEvents     = this.Get('chart.events').length
        this.barHeight     = this.graphHeight / this.numEvents;
        this.halfBarHeight = this.barHeight / 2;

        /**
        * Draw the background
        */
        RGraph.background.Draw(this);
        
        /**
        * Draw the labels at the top
        */
        this.DrawLabels();




        /**
        * Install the clickand mousemove event listeners
        */
        RGraph.InstallUserClickListener(this, this.Get('chart.events.click'));
        RGraph.InstallUserMousemoveListener(this, this.Get('chart.events.mousemove'));

        /**
        * Draw the events
        */
        this.DrawEvents();
        
        
        /**
        * Setup the context menu if required
        */
        if (this.Get('chart.contextmenu')) {
            RGraph.ShowContext(this);
        }
        
        /**
        * If the canvas is annotatable, do install the event handlers
        */
        if (this.Get('chart.annotatable')) {
            RGraph.Annotate(this);
        }
        
        /**
        * This bit shows the mini zoom window if requested
        */
        if (this.Get('chart.zoom.mode') == 'thumbnail' || this.Get('chart.zoom.mode') == 'area') {
            RGraph.ShowZoomWindow(this);
        }

        
        /**
        * This function enables resizing
        */
        if (this.Get('chart.resizable')) {
            RGraph.AllowResizing(this);
        }


        /**
        * This function enables adjusting
        */
        if (this.Get('chart.adjustable')) {
            RGraph.AllowAdjusting(this);
        }


        /**
        * Fire the RGraph ondraw event
        */
        RGraph.FireCustomEvent(this, 'ondraw');
    }

    
    /**
    * Draws the labels at the top and the left of the chart
    */
    RGraph.Gantt.prototype.DrawLabels = function ()
    {
        this.context.beginPath();
        this.context.fillStyle = this.Get('chart.text.color');

        /**
        * Draw the X labels at the top of the chart.
        */
        var labels = this.Get('chart.labels');
        var labelSpace = (this.graphArea) / labels.length;
        var x      = this.gutterLeft + (labelSpace / 2);
        var y      = this.gutterTop - (this.Get('chart.text.size') / 2) - 5;
        var font   = this.Get('chart.text.font');
        var size   = this.Get('chart.text.size');

        this.context.strokeStyle = 'black'
        
        /**
        * This facilitates chart.labels.align
        */
        if (this.Get('chart.labels.align') == 'bottom') {
            y = this.canvas.height - this.gutterBottom + size;
        }

        /**
        * Draw the horizontal labels
        */
        for (i=0; i<labels.length; ++i) {
            RGraph.Text(this.context,
                        font,
                        size,
                        x + (i * labelSpace),
                        y,
                        String(labels[i]),
                        'center',
                        'center');
        }

        // Draw the vertical labels
        for (var i=0; i<this.Get('chart.events').length; ++i) {
            
            var ev = this.Get('chart.events')[i];
            var x  = this.gutterLeft;
            var y  = this.gutterTop + this.halfBarHeight + (i * this.barHeight);

            RGraph.Text(this.context,
                        font,
                        size,
                        x - 5, y,
                        RGraph.is_array(ev[0]) ? String(ev[0][3]) : String(ev[3]),
                        'center',
                        'right');
        }
    }
    
    /**
    * Draws the events to the canvas
    */
    RGraph.Gantt.prototype.DrawEvents = function ()
    {
        var canvas  = this.canvas;
        var context = this.context;
        var events  = this.Get('chart.events');

        /**
        * Reset the coords array to prevent it growing
        */
        this.coords = [];

        /**
        * First draw the vertical bars that have been added
        */
        if (this.Get('chart.vbars')) {
            for (i=0; i<this.Get('chart.vbars').length; ++i) {
                // Boundary checking
                if (this.Get('chart.vbars')[i][0] + this.Get('chart.vbars')[i][1] > this.Get('chart.xmax')) {
                    this.Get('chart.vbars')[i][1] = 364 - this.Get('chart.vbars')[i][0];
                }
    
                var barX   = this.gutterLeft + (( (this.Get('chart.vbars')[i][0] - this.Get('chart.xmin')) / (this.Get('chart.xmax') - this.Get('chart.xmin')) ) * this.graphArea);

                var barY   = this.gutterTop;
                var width  = (this.graphArea / (this.Get('chart.xmax') - this.Get('chart.xmin')) ) * this.Get('chart.vbars')[i][1];
                var height = RGraph.GetHeight(this) - this.gutterTop - this.gutterBottom;
                
                // Right hand bounds checking
                if ( (barX + width) > (RGraph.GetWidth(this) - this.gutterRight) ) {
                    width = RGraph.GetWidth(this) - this.gutterRight - barX;
                }
    
                context.fillStyle = this.Get('chart.vbars')[i][2];
                context.fillRect(barX, barY, width, height);
            }
        }


        /**
        * Draw the events
        */
        for (i=0; i<events.length; ++i) {            
            if (typeof(events[i][0]) == 'number') {
                this.DrawSingleEvent(events[i]);
            } else {
                for (var j=0; j<events[i].length; ++j) {
                    this.DrawSingleEvent(events[i][j]);
                }
            }

        }


        /**
        * If tooltips are defined, handle them
        */
        if (this.Get('chart.tooltips')) {

            // Register the object for redrawing
            RGraph.Register(this);
            
            RGraph.PreLoadTooltipImages(this);

            /**
            * If the cursor is over a hotspot, change the cursor to a hand
            */
            var canvas_onmousemove_func = function (e)
            {
                e               = RGraph.FixEventObject(e);
                var canvas      = e.target;
                var obj         = canvas.__object__;
                var len         = obj.coords.length;
                var mouseCoords = RGraph.getMouseXY(e);
                var bar         = obj.getBar(e);

                /**
                * Loop through the bars determining if the mouse is over a bar
                */
                if (bar) {
                    var text = obj.Get('chart.tooltips')[bar[5]];
                        text = RGraph.getTooltipTextFromDIV(obj.Get('chart.tooltips')[bar[5]]);
                        
                    if (text) {
                        canvas.style.cursor = 'pointer';
                    }
                    
                    /**
                    * Facilitate chart.tooltips.event
                    */
                    if (obj.Get('chart.tooltips.event') == 'onmousemove' && (!RGraph.Registry.Get('chart.tooltip') || bar[5] != RGraph.Registry.Get('chart.tooltip').__index__)) {
                        canvas_onclick_func(e);
                    }
                } else {
                    canvas.style.cursor = 'default';
                }
            }
            this.canvas.addEventListener('mousemove', canvas_onmousemove_func, false);
            RGraph.AddEventListener(this.id, 'mousemove', canvas_onmousemove_func);


            var canvas_onclick_func = function (e)
            {
                e = RGraph.FixEventObject(e);

                var canvas      = e.target;
                var context     = canvas.getContext('2d');
                var obj         = canvas.__object__;
                var mouseCoords = RGraph.getMouseXY(e);
                var mouseX      = mouseCoords[0];
                var mouseY      = mouseCoords[1];
                var bar         = obj.getBar(e);
                
                if (bar) {
                
                    var idx = bar[5];

                    // Get the tooltip text
                    var text = RGraph.parseTooltipText(obj.Get('chart.tooltips'), idx);
                        
                    if (!text) {
                        return;
                    }

                   // Redraw the graph
                    RGraph.Redraw();

                    if (String(text).length && text != '') {

                        // SHOW THE CORRECT TOOLTIP
                        RGraph.Tooltip(canvas, text, e.pageX, e.pageY, idx);
                        
                        /**
                        * Draw a rectangle around the correct bar, in effect highlighting it
                        */
                        context.lineWidth = 1;
                        context.strokeStyle = obj.Get('chart.highlight.stroke');
                        context.fillStyle   = obj.Get('chart.highlight.fill');
                        context.strokeRect(bar[1], bar[2], bar[3], bar[4]);
                        context.fillRect(bar[1], bar[2], bar[3], bar[4]);
                    }
                }
            }
            this.canvas.addEventListener('click', canvas_onclick_func, false);
            RGraph.AddEventListener(this.id, 'click', canvas_onclick_func);
        }
    }


    /**
    * Retrieves the bar (if any) that has been click on or is hovered over
    * 
    * @param object e The event object
    */
    RGraph.Gantt.prototype.getBar = function (e)
    {
        e = RGraph.FixEventObject(e);

        var canvas      = e.target;
        var context     = canvas.getContext('2d');
        var obj         = canvas.__object__;
        var mouseCoords = RGraph.getMouseXY(e);
        var mouseX      = mouseCoords[0];
        var mouseY      = mouseCoords[1];
        var coords      = obj.coords;

        /**
        * Loop through the bars determining if the mouse is over a bar
        */
        for (var i=0; i<coords.length; i++) {

            var left   = coords[i][0];
            var top    = coords[i][1];
            var width  = coords[i][2];
            var height = coords[i][3];

            if (   mouseX >= left
                && mouseX <= (left + width)
                && mouseY >= top
                && mouseY <= (top + height)
               ) {
                
                return [obj, left, top, width, height, i];
            }
        }
    }


    /**
    * Draws a single event
    */
    RGraph.Gantt.prototype.DrawSingleEvent = function ()
    {
        var min     = this.Get('chart.xmin');
        var context = this.context;
        var ev      = RGraph.array_clone(arguments[0]);

        context.beginPath();
        context.strokeStyle = 'black';
        context.fillStyle = ev[4] ? ev[4] : this.Get('chart.defaultcolor');

        var barStartX  = AA(this, this.gutterLeft + (((ev[0] - min) / (this.Get('chart.xmax') - min)) * this.graphArea));
        var barStartY  = AA(this, this.gutterTop + (i * this.barHeight));
        var barWidth   = (ev[1] / (this.Get('chart.xmax') - min) ) * this.graphArea;

        /**
        * If the width is greater than the graph atrea, curtail it
        */
        if ( (barStartX + barWidth) > (this.canvas.width - this.gutterRight) ) {
            barWidth = this.canvas.width - this.gutterRight - barStartX;
        }
        
        // This helps anti-aliasing
        //
        // 9/1/2012 
        //
        //The width is now rounded to the nearest pixel. This helps with antialiasing (because the start value is
        // rounded to the nearest .5 value.
        barWidth       = Math.round(barWidth);
        this.barHeight = Math.round(this.barHeight)
        
        /**
        *  Draw the actual bar storing store the coordinates
        */
        this.coords.push([barStartX, barStartY + this.Get('chart.margin'), barWidth, this.barHeight - (2 * this.Get('chart.margin'))]);
        context.fillRect(barStartX, barStartY + this.Get('chart.margin'), barWidth, this.barHeight - (2 * this.Get('chart.margin')) );

        // Work out the completeage indicator
        var complete = (ev[2] / 100) * barWidth;

        // Draw the % complete indicator. If it's greater than 0
        if (typeof(ev[2]) == 'number') {
            context.beginPath();
            context.fillStyle = ev[5] ? ev[5] : '#0c0';
            context.fillRect(barStartX,
                                  barStartY + this.Get('chart.margin'),
                                  (ev[2] / 100) * barWidth,
                                  this.barHeight - (2 * this.Get('chart.margin')) );
            
            context.beginPath();
            context.fillStyle = this.Get('chart.text.color');
            RGraph.Text(context, this.Get('chart.text.font'), this.Get('chart.text.size'), barStartX + barWidth + 5, barStartY + this.halfBarHeight, String(ev[2]) + '%', 'center');
        }

        // draw the border around the bar
        if (this.Get('chart.borders') || ev[6]) {
            context.strokeStyle = typeof(ev[6]) == 'string' ? ev[6] : 'black';
            context.lineWidth = (typeof(ev[7]) == 'number' ? ev[7] : 1);
            context.beginPath();
            context.strokeRect(barStartX, barStartY + this.Get('chart.margin'), barWidth, this.barHeight - (2 * this.Get('chart.margin')) );
        }
    }