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
    * The bar chart constructor
    * 
    * @param object canvas The canvas object
    * @param array  data   The chart data
    */
    RGraph.Waterfall = function (id, data)
    {
        // Get the canvas and context objects
        this.id                = id;
        this.canvas            = document.getElementById(id);
        this.context           = this.canvas.getContext ? this.canvas.getContext("2d") : null;
        this.canvas.__object__ = this;
        this.type              = 'waterfall';
        this.max               = 0;
        this.isRGraph          = true;
        this.coords            = [];

        /**
        * Compatibility with older browsers
        */
        RGraph.OldBrowserCompat(this.context);


        // Various config
        this.properties = {
            'chart.background.barcolor1':   'rgba(0,0,0,0)',
            'chart.background.barcolor2':   'rgba(0,0,0,0)',
            'chart.background.grid':        true,
            'chart.background.grid.color':  '#ddd',
            'chart.background.grid.width':  1,
            'chart.background.grid.hsize':  20,
            'chart.background.grid.vsize':  20,
            'chart.background.grid.vlines': true,
            'chart.background.grid.hlines': true,
            'chart.background.grid.border': true,
            'chart.background.grid.autofit':true,
            'chart.background.grid.autofit.numhlines': 5,
            'chart.background.grid.autofit.numvlines': 20,
            'chart.background.grid.autofit.align': false,
            'chart.background.image':       null,
            'chart.background.hbars':       null, // ???
            'chart.xaxispos':               'bottom',
            'chart.numyticks':              10,
            'chart.hmargin':                5,
            'chart.strokestyle':            '#666',
            'chart.axis.color':             'black',
            'chart.gutter.left':            25,
            'chart.gutter.right':           25,
            'chart.gutter.top':             25,
            'chart.gutter.bottom':          25,
            'chart.labels':                 [],
            'chart.ylabels':                true,
            'chart.text.color':             'black',
            'chart.text.size':              10,
            'chart.text.angle':             0,
            'chart.text.font':              'Arial',
            'chart.ymax':                   null,
            'chart.title':                  '',
            'chart.title.color':            'black',
            'chart.title.background':       null,
            'chart.title.hpos':             null,
            'chart.title.vpos':             null,
            'chart.title.bold':             true,
            'chart.title.font':             null,
            'chart.title.xaxis':            '',
            'chart.title.yaxis':            '',
            'chart.title.yaxis.bold':       true,
            'chart.title.yaxis.size':       null,
            'chart.title.yaxis.font':       null,
            'chart.title.xaxis.pos':        null,
            'chart.title.yaxis.pos':        null,
            'chart.title.yaxis.align':      'left',
            'chart.title.xaxis.bold':       true,
            'chart.title.xaxis.size':       null,
            'chart.title.xaxis.font':       null,
            'chart.colors':                 ['green', 'red', 'blue'],
            'chart.shadow':                 false,
            'chart.shadow.color':           '#666',
            'chart.shadow.offsetx':         3,
            'chart.shadow.offsety':         3,
            'chart.shadow.blur':            3,
            'chart.tooltips':               null,
            'chart.tooltips.effect':        'fade',
            'chart.tooltips.css.class':     'RGraph_tooltip',
            'chart.tooltips.event':         'onclick',
            'chart.tooltips.highlight':     true,
            'chart.tooltips.override':     null,
            'chart.highlight.stroke':       'black',
            'chart.highlight.fill':         'rgba(255,255,255,0.5)',
            'chart.contextmenu':            null,
            'chart.units.pre':              '',
            'chart.units.post':             '',
            'chart.scale.decimals':         0,
            'chart.scale.point':            '.',
            'chart.scale.thousand':         ',',
        //'chart.scale.formatter':        null,
            'chart.crosshairs':             false,
            'chart.crosshairs.color':       '#333',
            'chart.crosshairs.hline':       true,
            'chart.crosshairs.vline':       true,
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
            'chart.resizable':              false,
            'chart.resize.handle.background': null,
            'chart.noaxes':                 false,
            'chart.noxaxis':                false,
            'chart.noyaxis':                false,
            'chart.axis.color':             'black',
            'chart.total':                  true,
            'chart.multiplier.x':           1,
            'chart.multiplier.w':           1,
            'chart.events.click':           null,
            'chart.events.mousemove':       null
        }

        // Check for support
        if (!this.canvas) {
            alert('[WATERFALL] No canvas support');
            return;
        }

        // Store the data
        this.data = data;


        /**
        * Set the .getShape commonly named method
        */
        this.getShape = this.getBar;
    }


    /**
    * A setter
    * 
    * @param name  string The name of the property to set
    * @param value mixed  The value of the property
    */
    RGraph.Waterfall.prototype.Set = function (name, value)
    {
        this.properties[name.toLowerCase()] = value;
    }


    /**
    * A getter
    * 
    * @param name  string The name of the property to get
    */
    RGraph.Waterfall.prototype.Get = function (name)
    {        
        return this.properties[name.toLowerCase()];
    }


    /**
    * The function you call to draw the bar chart
    */
    RGraph.Waterfall.prototype.Draw = function ()
    {
        // MUST be the first thing done!
        if (typeof(this.Get('chart.background.image')) == 'string' && !this.__background_image__) {
            RGraph.DrawBackgroundImage(this);
            return;
        }


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
        * Stop the coords array from growing uncontrollably
        */
        this.coords = [];
        
        /**
        * This gets used a lot
        */
        this.centery = ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop;

        /**
        * Work out a few things. They need to be here because they depend on things you can change after you instantiate the object
        */
        this.max            = 0;
        this.grapharea      = this.canvas.height - this.gutterTop - this.gutterBottom;
        this.graphwidth     = this.canvas.width - this.gutterLeft - this.gutterRight;
        this.halfTextHeight = this.Get('chart.text.size') / 2;


        /**
        * Work out the maximum value
        * 
        * Normally the last bar is a total and not taken into account when the scale is generated.
        * However it is not necessarily shown, so if it's not being shown it should not be
        * accounted for.
        */
        this.max     = this.getMax(this.data);
        this.scale   = RGraph.getScale(typeof(this.Get('chart.ymax')) == 'number' ? this.Get('chart.ymax') : this.max, this);
        this.max     = this.scale[4];
        var decimals = this.Get('chart.scale.decimals');
        
        /**
        * ymax specified
        */
        if (this.Get('chart.ymax') > 0) {
            this.max = this.Get('chart.ymax');
        }

        this.scale = [
                      (this.max * (1/5)).toFixed(decimals),
                      (this.max * (2/5)).toFixed(decimals),
                      (this.max * (3/5)).toFixed(decimals),
                      (this.max * (4/5)).toFixed(decimals),
                      typeof(this.max) == 'number' ? this.max.toFixed(decimals) : this.max
                     ];


        // Progressively Draw the chart
        RGraph.background.Draw(this);

        this.DrawAxes();
        this.Drawbars();
        this.DrawLabels();

        /**
        * Setup the context menu if required
        */
        if (this.Get('chart.contextmenu')) {
            RGraph.ShowContext(this);
        }

        
        /**
        * Draw crosschairs
        */
        if (this.Get('chart.crosshairs')) {
            RGraph.DrawCrosshairs(this);
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
        * Install the click and mousemove event listeners
        */
        RGraph.InstallUserClickListener(this, this.Get('chart.events.click'));
        RGraph.InstallUserMousemoveListener(this, this.Get('chart.events.mousemove'));
        
        /**
        * Tooltips
        */
        if (this.Get('chart.tooltips')) {
        
            RGraph.Register(this);
            
            RGraph.PreLoadTooltipImages(this);

            /**
            * Install the onclick event handler for the tooltips
            */
            var canvas_onclick_func = function (e)
            {
                e = RGraph.FixEventObject(e);

                var canvas  = document.getElementById(this.id);
                var context = canvas.getContext('2d');
                var obj     = canvas.__object__;
                var bar     = obj.getBar(e);


                /**
                * Loop through the bars determining if the mouse is over a bar
                */
                if (bar) {

                    /**
                    * First, if the event is onmousemove end the tooltip is already being shown, do nothing
                    */
                    if (obj.Get('chart.tooltips.event') == 'onmousemove' && RGraph.Registry.Get('chart.tooltip') && RGraph.Registry.Get('chart.tooltip').__index__ == bar[5]) {
                        return;
                    }

                    /**
                    * Redraw the graph first, in effect resetting the graph to as it was when it was first drawn
                    * This "deselects" any already selected bar
                    */
                    RGraph.Redraw();

                    var x = bar[1];
                    var y = bar[2];
                    var w = bar[3];
                    var h = bar[4];

                    if (!obj.Get('chart.tooltips')[bar[5]]) {
                        return;
                    }
                    
                       
                    // Draw the highlight (if necessary)
                    if (obj.Get('chart.tooltips.highlight')) {
                       context.beginPath();
                           context.fillStyle = obj.Get('chart.highlight.fill');
                           context.strokeStyle = obj.Get('chart.highlight.stroke');
                           context.strokeRect(x,y,w,h);
                           context.fillRect(x,y,w,h);
                       context.stroke();
                       context.fill();
                    }

                    /**
                    * Get the tooltip text
                    */
                    var text = RGraph.parseTooltipText(obj.Get('chart.tooltips'), bar[5]);
                    
                    if (text) {
                        canvas.style.cursor = 'pointer';
                        RGraph.Tooltip(canvas, text, e.pageX, e.pageY, bar[5]);
                    } else {
                        canvas.style.pointer = 'default';
                    }
                }

                /**
                * Stop the event bubbling
                */
                e.stopPropagation();
                
                return false;
            }
            this.canvas.addEventListener(this.Get('chart.tooltips.event') == 'onclick' ? 'click' : 'mousemove', canvas_onclick_func, false);
            RGraph.AddEventListener(this.id, this.Get('chart.tooltips.event') == 'onclick' ? 'click' : 'mousemove', canvas_onclick_func);

            /**
            * Install the window onclick handler
            */
            var window_onclick_func = function (){RGraph.Redraw();};
            window.addEventListener('click', window_onclick_func, false);
            RGraph.AddEventListener('window_' + this.id, 'click', window_onclick_func);

            /**
            * Install the onmousemove event handler for the tooltips
            */
            var canvas_onmousemove_func = function (e)
            {
                e = RGraph.FixEventObject(e);

                var canvas  = document.getElementById(this.id);
                var context = canvas.getContext('2d');
                var obj     = canvas.__object__;
                var bar     = obj.getBar(e);

                /**
                * Loop through the bars determining if the mouse is over a bar
                */
                if (bar && obj.Get('chart.tooltips')[bar[5]]) {
                    canvas.style.cursor = 'pointer';
                    e.stopPropagation();

                   return;
                }
                
                canvas.style.cursor = 'default';

                /**
                * Stop the event bubbling
                */
                e.stopPropagation();
                
                return false;
            }
            this.canvas.addEventListener('mousemove', canvas_onmousemove_func, false);
            RGraph.AddEventListener(this.id, 'mousemove', canvas_onmousemove_func);
        }

        
        /**
        * Fire the RGraph ondraw event
        */
        RGraph.FireCustomEvent(this, 'ondraw');
    }

    
    /**
    * Draws the charts axes
    */
    RGraph.Waterfall.prototype.DrawAxes = function ()
    {
        if (this.Get('chart.noaxes')) {
            return;
        }

        this.context.beginPath();
        this.context.strokeStyle = this.Get('chart.axis.color');
        this.context.lineWidth = 1;

        // Draw the Y axis
        if (this.Get('chart.noyaxis') == false) {
            this.context.moveTo(AA(this, this.gutterLeft), this.gutterTop);
            this.context.lineTo(AA(this, this.gutterLeft), RGraph.GetHeight(this) - this.gutterBottom);
        }

        // Draw the X axis
        if (this.Get('chart.noxaxis') == false) {
            // Center X axis
            if (this.Get('chart.xaxispos') == 'center') {
                this.context.moveTo(this.gutterLeft, AA(this, ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop));
                this.context.lineTo(this.canvas.width - this.gutterRight, AA(this, ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop));
            } else {
                this.context.moveTo(this.gutterLeft, AA(this, this.canvas.height - this.gutterBottom));
                this.context.lineTo(this.canvas.width - this.gutterRight, AA(this, this.canvas.height - this.gutterBottom));
            }
        }

        var numYTicks = this.Get('chart.numyticks');

        // Draw the Y tickmarks
        if (this.Get('chart.noyaxis') == false) {

            var yTickGap = (RGraph.GetHeight(this) - this.gutterTop - this.gutterBottom) / numYTicks;
    
            for (y=this.gutterTop; y < (this.canvas.height - this.gutterBottom); y += yTickGap) {
                if (this.Get('chart.xaxispos') == 'bottom' || (y != ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop)) {
                    this.context.moveTo(this.gutterLeft, AA(this, y));
                    this.context.lineTo(this.gutterLeft - 3, AA(this, y));
                }
            }
            
            /**
            * If the X axis is not being shown, draw an extra tick
            */
            if (this.Get('chart.noxaxis') || this.Get('chart.xaxispos') == 'center') {
                this.context.moveTo(this.gutterLeft - 3, AA(this, this.canvas.height - this.gutterBottom));
                this.context.lineTo(this.gutterLeft, AA(this, this.canvas.height - this.gutterBottom));
            }
        }


        // Draw the X tickmarks
        if (this.Get('chart.noxaxis') == false) {

            xTickGap = (this.canvas.width - this.gutterLeft - this.gutterRight ) / (this.data.length + (this.Get('chart.total') ? 1 : 0));
            
            if (this.Get('chart.xaxispos') == 'center') {
                yStart   = ((this.canvas.height - this.gutterBottom - this.gutterTop) / 2) + this.gutterTop - 3;
                yEnd     = ((this.canvas.height - this.gutterBottom - this.gutterTop) / 2) + this.gutterTop + 3;
            } else {
                yStart   = this.canvas.height - this.gutterBottom;
                yEnd     = (this.canvas.height - this.gutterBottom) + 3;
            }
    
            for (x=this.gutterLeft + xTickGap; x<=RGraph.GetWidth(this) - this.gutterRight + 1; x+=xTickGap) {
                this.context.moveTo(AA(this, x), yStart);
                this.context.lineTo(AA(this, x), yEnd);
            }
            
            if (this.Get('chart.noyaxis')) {
                this.context.moveTo(AA(this, this.gutterLeft), yStart);
                this.context.lineTo(AA(this, this.gutterLeft), yEnd);
            }
        }

        /**
        * If the Y axis is not being shown, draw an extra tick
        */
        if (this.Get('chart.noyaxis') && this.Get('chart.noxaxis') == false) {
            this.context.moveTo(AA(this, this.gutterLeft), RGraph.GetHeight(this) - this.gutterBottom);
            this.context.lineTo(AA(this, this.gutterLeft), RGraph.GetHeight(this) - this.gutterBottom + 3);
        }

        this.context.stroke();
    }


    /**
    * Draws the labels for the graph
    */
    RGraph.Waterfall.prototype.DrawLabels = function ()
    {
        var context    = this.context;
        var numYLabels = 5; // Make this configurable
        var interval   = this.grapharea / numYLabels;
        var font       = this.Get('chart.text.font');
        var size       = this.Get('chart.text.size');
        var color      = this.Get('chart.text.color');
        var units_pre  = this.Get('chart.units.pre');
        var units_post = this.Get('chart.units.post');
        
        this.context.beginPath();
        this.context.fillStyle = color;

        /**
        * First, draw the Y labels
        */
        if (this.Get('chart.ylabels')) {
            if (this.Get('chart.xaxispos') == 'center') {

                var halfInterval = interval / 2;
                var halfWay      = ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop;

                for (var i=0; i<numYLabels; ++i) {
                    RGraph.Text(context,
                                font,
                                size,
                                this.gutterLeft - 5,
                                this.gutterTop + (i * halfInterval),
                                RGraph.number_format(this, this.scale[4 - i], units_pre, units_post),
                                'center',
                                'right');
                }

                for (var i=0; i<numYLabels; ++i) {
                    RGraph.Text(context,
                                font,
                                size,
                                this.gutterLeft - 5,
                                halfWay + (i * halfInterval) + halfInterval,
                                '-' + RGraph.number_format(this, this.scale[i], units_pre, units_post),
                                'center',
                                'right');
                }

            } else {

                for (var i=1; i<=numYLabels; ++i) {
                    RGraph.Text(context,
                                font,
                                size,
                                this.gutterLeft - 5,
                                this.canvas.height - this.gutterBottom - (i * interval),
                                RGraph.number_format(this, this.scale[i - 1], units_pre, units_post),
                                'center',
                                'right');
    
                }
            }
        }



        /**
        * Now, draw the X labels
        */
        if (this.Get('chart.labels').length > 0) {
        
            // Recalculate the interval for the X labels
            interval = (this.canvas.width - this.gutterLeft - this.gutterRight) / this.Get('chart.labels').length;
            
            var halign = 'center';
            var angle  = this.Get('chart.text.angle');
            
            if (angle) {
                halign = 'right';
                angle *= -1;
            }

            var labels = this.Get('chart.labels');

            for (var i=0; i<labels.length; ++i) {

                // context, font, size, x, y, text[, valign[, halign[, border[, angle[, background[, bold[, indicator]]]]]]]
                RGraph.Text(context,
                            font,
                            size,
                            this.gutterLeft + (i * interval) + (interval / 2),
                            this.canvas.height - this.gutterBottom + 5 + this.halfTextHeight,
                            labels[i],
                            'center',
                            halign,
                            null,
                            angle);

            }
        }
        
        this.context.stroke();
        this.context.fill();
    }


    /**
    * Draws the bars on to the chart
    */
    RGraph.Waterfall.prototype.Drawbars = function ()
    {
        var context      = this.context;
        var canvas       = this.canvas;
        var hmargin      = this.Get('chart.hmargin');
        var runningTotal = 0;

        
            for (var i=0; i<this.data.length; ++i) {
                context.beginPath();
                context.strokeStyle = this.Get('chart.strokestyle');

                    var x      = this.gutterLeft + hmargin + (((this.graphwidth / (this.data.length + (this.Get('chart.total') ? 1 : 0))) * i) * this.Get('chart.multiplier.x'));
                    var y      = this.gutterTop + this.grapharea - (i == 0 ? ((this.data[0] / this.max) * this.grapharea) : (this.data[i] > 0 ? ((runningTotal + this.data[i]) / this.max) * this.grapharea : (runningTotal / this.max) * this.grapharea));
                    var w      = ((this.canvas.width - this.gutterLeft - this.gutterRight) / (this.data.length + (this.Get('chart.total') ? 1 : 0 )) ) - (2 * this.Get('chart.hmargin'));
                        w      = w * this.Get('chart.multiplier.w');
                    var h      = (Math.abs(this.data[i]) / this.max) * this.grapharea;

                    if (this.Get('chart.xaxispos') == 'center') {
                        h /= 2;
                        y  = (i == 0 ? ((this.data[0] / this.max) * this.grapharea) : (this.data[i] > 0 ? ((runningTotal + this.data[i]) / this.max) * this.grapharea : (runningTotal / this.max) * this.grapharea));
                        y = this.gutterTop + (this.grapharea/2) - (y / 2);
                    }

                    // Color
                    context.fillStyle = this.data[i] >= 0 ? this.Get('chart.colors')[0] : this.Get('chart.colors')[1];

                    
                    if (this.Get('chart.shadow')) {
                        RGraph.SetShadow(this, this.Get('chart.shadow.color'), this.Get('chart.shadow.offsetx'), this.Get('chart.shadow.offsety'), this.Get('chart.shadow.blur'));
                    } else {
                        RGraph.NoShadow(this);
                    }

                    context.strokeRect(x, y, w, h);
                    context.fillRect(x, y, w, h);

                    this.coords.push([x, y, w, h]);
                    
                    runningTotal += this.data[i];

                context.stroke();
                context.fill();
            }
            
if (this.Get('chart.total')) {

    // This is the height of the final bar
    h = (runningTotal / this.max) * (this.grapharea / (this.Get('chart.xaxispos') == 'center' ? 2 : 1));
    
    /**
    * Set the Y (ie the start point) value
    */
    if (this.Get('chart.xaxispos') == 'center') {
        y = runningTotal > 0 ? this.centery - h : this.centery - h;
    } else {
        y = this.canvas.height - this.gutterBottom - h;
    }

    // This is the X position of the final bar
    x = x + (this.Get('chart.hmargin') * 2) + w;


    // Final color
    this.context.fillStyle = this.Get('chart.colors')[2];

    this.context.beginPath();
        this.context.strokeRect(x, y, w, h);
        this.context.fillRect(x, y, w, h);
    this.context.stroke();
    this.context.fill();

    this.coords.push([x, y - (runningTotal > 0 ? 0 : Math.abs(h)), w, Math.abs(h)]);
}

            RGraph.NoShadow(this);

            /**
            * This draws the connecting lines
            */
            for (var i=1; i<this.coords.length; ++i) {
                context.strokeStyle = 'gray';
                context.beginPath();
                    if (this.data[i - 1] > 0) {
                        context.moveTo(this.coords[i - 1][0] + this.coords[i - 1][2], AA(this, this.coords[i - 1][1]));
                        context.lineTo(this.coords[i - 1][0] + this.coords[i - 1][2] + (2 * hmargin), AA(this, this.coords[i - 1][1]));
                    } else {
                        context.moveTo(this.coords[i - 1][0] + this.coords[i - 1][2], AA(this, this.coords[i - 1][1] + this.coords[i - 1][3]));
                        context.lineTo(this.coords[i - 1][0] + this.coords[i - 1][2] + (2 * hmargin), AA(this, this.coords[i - 1][1] + this.coords[i - 1][3]));
                    }
                context.stroke();
            }
    }


    /**
    * Not used by the class during creating the graph, but is used by event handlers
    * to get the coordinates (if any) of the selected bar
    * 
    * @param object e The event object
    */
    RGraph.Waterfall.prototype.getBar = function (e)
    {
        var canvas      = e.target;
        var obj         = e.target.__object__;        
        var mouseCoords = RGraph.getMouseXY(e);

        /**
        * Loop through the bars determining if the mouse is over a bar
        */
        for (var i=0; i<obj.coords.length; i++) {

            var mouseX = mouseCoords[0];
            var mouseY = mouseCoords[1];

            var left   = obj.coords[i][0];
            var top    = obj.coords[i][1];
            var width  = obj.coords[i][2];
            var height = obj.coords[i][3];

            if (   mouseX >= left
                && mouseX <= left + width
                && mouseY >= top
                && mouseY <= top + height) {
                
                return [obj, left, top, width, height, i];
            }
        }
        
        return null;
    }


    /**
    * The Waterfall is slightly different to Bar/Line charts so has this function to get the max value
    */
    RGraph.Waterfall.prototype.getMax = function (data)
    {
        var runningTotal = 0;
        var max          = 0;

        for (var i=0; i<data.length; ++i) {
            runningTotal += data[i];
            max = Math.max(max, Math.abs(runningTotal));
        }

        return max;
    }