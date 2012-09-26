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
    * The progress bar constructor
    * 
    * @param int id    The ID of the canvas tag
    * @param int value The indicated value of the meter.
    * @param int max   The end value (the upper most) of the meter
    */
    RGraph.HProgress = function (id, value, max)
    {
        this.id                = id;
        this.max               = max;
        this.value             = value;
        this.canvas            = document.getElementById(id);
        this.context           = this.canvas.getContext('2d');
        this.canvas.__object__ = this;
        this.type              = 'hprogress';
        this.coords            = [];
        this.isRGraph          = true;
        this.currentValue      = null;


        /**
        * Compatibility with older browsers
        */
        RGraph.OldBrowserCompat(this.context);

        this.properties = {
            'chart.min':                0,
            'chart.colors':             ['#0c0'],
            'chart.strokestyle':        '#999',
            'chart.tickmarks':          true,
            'chart.tickmarks.color':    'black',
            'chart.tickmarks.inner':    false,
            'chart.gutter.left':        25,
            'chart.gutter.right':       25,
            'chart.gutter.top':         25,
            'chart.gutter.bottom':      25,
            'chart.numticks':           10,
            'chart.numticks.inner':     50,
            'chart.background.color':   '#eee',
            'chart.shadow':             false,
            'chart.shadow.color':       'rgba(0,0,0,0.5)',
            'chart.shadow.blur':        3,
            'chart.shadow.offsetx':     3,
            'chart.shadow.offsety':     3,
            'chart.title':              '',
            'chart.title.background':   null,
            'chart.title.hpos':         null,
            'chart.title.vpos':         null,
            'chart.title.bold':         true,
            'chart.title.font':         null,
            'chart.text.size':          10,
            'chart.text.color':         'black',
            'chart.text.font':          'Arial',
            'chart.contextmenu':        null,
            'chart.units.pre':          '',
            'chart.units.post':         '',
            'chart.tooltips':           [],
            'chart.tooltips.effect':    'fade',
            'chart.tooltips.css.class': 'RGraph_tooltip',
            'chart.tooltips.highlight': true,
            'chart.highlight.stroke':   'black',
            'chart.highlight.fill':     'rgba(255,255,255,0.5)',
            'chart.annotatable':        false,
            'chart.annotate.color':     'black',
            'chart.zoom.mode':          'canvas',
            'chart.zoom.factor':        1.5,
            'chart.zoom.fade.in':       true,
            'chart.zoom.fade.out':      true,
            'chart.zoom.hdir':          'right',
            'chart.zoom.vdir':          'down',
            'chart.zoom.frames':            25,
            'chart.zoom.delay':             16.666,
            'chart.zoom.shadow':        true,
            'chart.zoom.background':    true,
            'chart.zoom.thumbnail.width': 100,
            'chart.zoom.thumbnail.height': 100,
            'chart.zoom.thumbnail.fixed':  false,
            'chart.arrows':                false,
            'chart.margin':                0,
            'chart.resizable':             false,
            'chart.resize.handle.adjust':  [0,0],
            'chart.resize.handle.background':null,
            'chart.label.inner':           false,
            'chart.adjustable':            false,
            'chart.scale.decimals':     0,
            'chart.scale.point':        '.',
            'chart.scale.thousand':     ',',
            'chart.key':                [],
            'chart.key.background':     'white',
            'chart.key.position':       'gutter',
            'chart.key.halign':             'right',
            'chart.key.shadow':         false,
            'chart.key.shadow.color':   '#666',
            'chart.key.shadow.blur':    3,
            'chart.key.shadow.offsetx': 2,
            'chart.key.shadow.offsety': 2,
            'chart.key.position.gutter.boxed': false,
            'chart.key.position.x':     null,
            'chart.key.position.y':     null,
            'chart.key.color.shape':    'square',
            'chart.key.rounded':        true,
            'chart.key.linewidth':      1,
            'chart.key.colors':         null,
            'chart.key.color.shape':    'square',
            'chart.labels.position':     'bottom',
            'chart.events.mousemove':    null,
            'chart.events.click':        null
        }

        // Check for support
        if (!this.canvas) {
            alert('[PROGRESS] No canvas support');
            return;
        }


        /**
        * Set the .getShape commonly named method
        */
        this.getShape = this.getBar;
    }


    /**
    * A generic setter
    * 
    * @param string name  The name of the property to set
    * @param string value The value of the poperty
    */
    RGraph.HProgress.prototype.Set = function (name, value)
    {
        this.properties[name.toLowerCase()] = value;
    }


    /**
    * A generic getter
    * 
    * @param string name  The name of the property to get
    */
    RGraph.HProgress.prototype.Get = function (name)
    {
        return this.properties[name.toLowerCase()];
    }


    /**
    * Draws the progress bar
    */
    RGraph.HProgress.prototype.Draw = function ()
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
        * Set the current value
        */
        this.currentValue = this.value;
        
        /**
        * This is new in May 2011 and facilitates individual gutter settings,
        * eg chart.gutter.left
        */
        this.gutterLeft   = this.Get('chart.gutter.left');
        this.gutterRight  = this.Get('chart.gutter.right');
        this.gutterTop    = this.Get('chart.gutter.top');
        this.gutterBottom = this.Get('chart.gutter.bottom');

        // Figure out the width and height
        this.width  = this.canvas.width - this.gutterLeft - this.gutterRight;
        this.height = this.canvas.height - this.gutterTop - this.gutterBottom;
        this.coords = [];

        this.Drawbar();
        this.DrawTickMarks();
        this.DrawLabels();

        this.context.stroke();
        this.context.fill();

        /**
        * Setup the context menu if required
        */
        if (this.Get('chart.contextmenu')) {
            RGraph.ShowContext(this);
        }


        /**
        * Install the clickand mousemove event listeners
        */
        RGraph.InstallUserClickListener(this, this.Get('chart.events.click'));
        RGraph.InstallUserMousemoveListener(this, this.Get('chart.events.mousemove'));

        
        /**
        * Alternatively, show the tooltip if requested
        */
        if (typeof(this.Get('chart.tooltips')) == 'function' || this.Get('chart.tooltips').length) {

            // Need to register this object for redrawing
            RGraph.Register(this);
            
            RGraph.PreLoadTooltipImages(this);

            /**
            * Install the window onclick handler
            */
            var window_onclick = function () {RGraph.Redraw();}
            window.addEventListener('click', window_onclick, false);
            RGraph.AddEventListener('window_' + this.id, 'click', window_onclick);


            /**
            * Install the onclick event handler for the tooltips
            */
            var canvas_onclick_func = function (e)
            {
                e = RGraph.FixEventObject(e);

                var canvas      = document.getElementById(this.id);
                var obj         = canvas.__object__;
                var bar         = obj.getBar(e);

                /**
                * Redraw the graph first, in effect resetting the graph to as it was when it was first drawn
                * This "deselects" any already selected bar
                */
                RGraph.Redraw();

                /**
                * Was the mouse over the bar
                */
                if (bar) {

                    var text = RGraph.parseTooltipText(obj.Get('chart.tooltips'), bar[5]);


                    /**
                    * Show a tooltip if it's defined
                    */
                    if (text) {

                        obj.context.beginPath();
                        obj.context.strokeStyle = obj.Get('chart.highlight.stroke');
                        obj.context.fillStyle   = obj.Get('chart.highlight.fill');

                        obj.context.strokeRect(bar[1], bar[2], bar[3], bar[4]);
                        obj.context.fillRect(bar[1], bar[2], bar[3], bar[4]);
    
                        obj.context.stroke();
                        obj.context.fill();

                        RGraph.Tooltip(canvas, text, e.pageX, e.pageY, bar[5]);
                    }
                }

                /**
                * Stop the event bubbling
                */
                e.stopPropagation();
            }
            this.canvas.addEventListener('click', canvas_onclick_func, false);
            RGraph.AddEventListener(this.id, 'click', canvas_onclick_func);

            /**
            * If the cursor is over a hotspot, change the cursor to a hand
            */
            var canvas_onmousemove_func = function (e)
            {
                e = RGraph.FixEventObject(e);

                var canvas = document.getElementById(this.id);
                var obj    = canvas.__object__;
                var bar    = obj.getBar(e);

                // Is there a focused bar
                if (bar){
                    var text = RGraph.parseTooltipText(obj.Get('chart.tooltips'), bar[5]);

                    if (text) {
                        canvas.style.cursor = 'pointer';
                        return;
                    }
                }

                canvas.style.cursor = 'default';
            }
            this.canvas.addEventListener('mousemove', canvas_onmousemove_func, false);
            RGraph.AddEventListener(this.id, 'mousemove', canvas_onmousemove_func);
        }
        
        /**
        * If the canvas is annotatable, do install the event handlers
        */
        if (this.Get('chart.annotatable')) {
            RGraph.Annotate(this);
        }


        // Draw the key if necessary
        if (this.Get('chart.key').length) {
            RGraph.DrawKey(this, this.Get('chart.key'), this.Get('chart.colors'));
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
        * Instead of using RGraph.common.adjusting.js, handle them here
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
    * Draws the bar
    */
    RGraph.HProgress.prototype.Drawbar = function ()
    {
        // Set a shadow if requested
        if (this.Get('chart.shadow')) {
            RGraph.SetShadow(this, this.Get('chart.shadow.color'), this.Get('chart.shadow.offsetx'), this.Get('chart.shadow.offsety'), this.Get('chart.shadow.blur'));
        }

        // Draw the shadow for MSIE
        if (RGraph.isOld() && this.Get('chart.shadow')) {
            this.context.fillStyle = this.Get('chart.shadow.color');
            this.context.fillRect(this.gutterLeft + this.Get('chart.shadow.offsetx'), this.gutterTop + this.Get('chart.shadow.offsety'), this.width, this.height);
        }

        // Draw the outline
        this.context.fillStyle   = this.Get('chart.background.color');
        this.context.strokeStyle = this.Get('chart.strokestyle');
        this.context.strokeRect(this.gutterLeft, this.gutterTop, this.width, this.height);
        this.context.fillRect(this.gutterLeft, this.gutterTop, this.width, this.height);

        // Turn off any shadow
        RGraph.NoShadow(this);

        this.context.fillStyle   = this.Get('chart.color');
        this.context.strokeStyle = this.Get('chart.strokestyle');
        
        var margin = this.Get('chart.margin');

        // Draw the actual bar itself
        var barWidth = Math.min(this.width, ((RGraph.array_sum(this.value) - this.Get('chart.min')) / (this.max - this.Get('chart.min')) ) * this.width);

        if (this.Get('chart.tickmarks.inner')) {

            var spacing = (RGraph.GetWidth(this) - this.gutterLeft - this.gutterRight) / this.Get('chart.numticks.inner');

            this.context.lineWidth   = 1;
            this.context.strokeStyle = this.Get('chart.strokestyle');

            this.context.beginPath();
            for (var x = this.gutterLeft; x<RGraph.GetWidth(this) - this.gutterRight; x+=spacing) {
                this.context.moveTo(AA(this, x), this.gutterTop);
                this.context.lineTo(AA(this, x), this.gutterTop + 2);

                this.context.moveTo(AA(this, x), RGraph.GetHeight(this) - this.gutterBottom);
                this.context.lineTo(AA(this, x), RGraph.GetHeight(this) - this.gutterBottom - 2);
            }
            this.context.stroke();
        }
        
        /**
        * This bit draws the actual progress bar
        */
        if (typeof(this.value) == 'number') {
            this.context.beginPath();
            this.context.strokeStyle = this.Get('chart.strokestyle');
            this.context.fillStyle = this.Get('chart.colors')[0];
            this.context.strokeRect(this.gutterLeft, this.gutterTop + margin, barWidth, this.height - margin - margin);
            this.context.fillRect(this.gutterLeft, this.gutterTop + margin, barWidth, this.height - margin - margin);

            // Store the coords
            this.coords.push([this.gutterLeft,
                              this.gutterTop + margin,
                              barWidth,
                              this.height - margin - margin]);

        } else if (typeof(this.value) == 'object') {

            this.context.beginPath();
            this.context.strokeStyle = this.Get('chart.strokestyle');

            var startPoint = this.gutterLeft;
            
            for (var i=0; i<this.value.length; ++i) {

                var segmentLength = (this.value[i] / RGraph.array_sum(this.value)) * barWidth;
                this.context.fillStyle = this.Get('chart.colors')[i];

                this.context.strokeRect(startPoint, this.gutterTop + margin, segmentLength, this.height - margin - margin);
                this.context.fillRect(startPoint, this.gutterTop + margin, segmentLength, this.height - margin - margin);


                // Store the coords
                this.coords.push([startPoint,
                                  this.gutterTop + margin,
                                  segmentLength,
                                  this.height - margin - margin]);

                startPoint += segmentLength;
            }
        }

        /**
        * Draw the arrows indicating the level if requested
        */
        if (this.Get('chart.arrows')) {
            var x = this.gutterLeft + barWidth;
            var y = this.gutterTop;
            
            this.context.lineWidth = 1;
            this.context.fillStyle = 'black';
            this.context.strokeStyle = 'black';

            this.context.beginPath();
                this.context.moveTo(x, y - 3);
                this.context.lineTo(x + 2, y - 7);
                this.context.lineTo(x - 2, y - 7);
            this.context.closePath();

            this.context.stroke();
            this.context.fill();

            this.context.beginPath();
                this.context.moveTo(x, y + this.height + 4);
                this.context.lineTo(x + 2, y + this.height + 9);
                this.context.lineTo(x - 2, y + this.height + 9);
            this.context.closePath();

            this.context.stroke();
            this.context.fill()


            /**
            * Draw the "in-bar" label
            */
            if (this.Get('chart.label.inner')) {
                this.context.beginPath();
                this.context.fillStyle = 'black';
                RGraph.Text(this.context, this.Get('chart.text.font'), this.Get('chart.text.size') + 2, this.gutterLeft + barWidth + 5, RGraph.GetHeight(this) / 2, String(this.Get('chart.units.pre') + this.value + this.Get('chart.units.post')), 'center', 'left');
                this.context.fill();
            }
        }

    }

    /**
    * The function that draws the tick marks. Apt name...
    */
    RGraph.HProgress.prototype.DrawTickMarks = function ()
    {
        var context = this.context;

        context.strokeStyle = this.Get('chart.tickmarks.color');

        if (this.Get('chart.tickmarks')) {
            
            this.context.beginPath();        

            // This is used by the label function below
            this.tickInterval = this.width / this.Get('chart.numticks');
            
            var start   = this.Get('chart.tickmarks.zerostart') ? 0 : this.tickInterval;

            if (this.Get('chart.labels.position') == 'top') {
                for (var i=this.gutterLeft + start; i<=(this.width + this.gutterLeft + 0.1); i+=this.tickInterval) {
                    context.moveTo(AA(this, i), this.gutterTop);
                    context.lineTo(AA(this, i), this.gutterTop - 4);
                }

            } else {

                for (var i=this.gutterLeft + start; i<=(this.width + this.gutterLeft + 0.1); i+=this.tickInterval) {
                    context.moveTo(AA(this, i), this.gutterTop + this.height);
                    context.lineTo(AA(this, i), this.gutterTop + this.height + 4);
                }
            }

            this.context.stroke();
        }
    }


    /**
    * The function that draws the labels
    */
    RGraph.HProgress.prototype.DrawLabels = function ()
    {
        var context = this.context;
        this.context.fillStyle = this.Get('chart.text.color');

        var xPoints = [];
        var yPoints = [];

        for (i=0; i<this.Get('chart.numticks'); i++) {

            var font       = this.Get('chart.text.font');
            var size       = this.Get('chart.text.size');

            if (this.Get('chart.labels.position') == 'top') {
                var x = this.width * (i/this.Get('chart.numticks')) + this.gutterLeft + (this.width / this.Get('chart.numticks'));
                var y = this.gutterTop - 6;
                var valign = 'bottom';
            } else {
                var x = this.width * (i/this.Get('chart.numticks')) + this.gutterLeft + (this.width / this.Get('chart.numticks'));
                var y = this.height + this.gutterTop + 4;
                var valign = 'top';
            }
                
            RGraph.Text(this.context,font,size,x,y,

RGraph.number_format(this, (((this.max - this.Get('chart.min')) / this.Get('chart.numticks')) * (i + 1) + this.Get('chart.min')).toFixed(this.Get('chart.scale.decimals')), this.Get('chart.units.pre'), this.Get('chart.units.post')),

valign,'center');
        }

        if (this.Get('chart.tickmarks.zerostart')) {
            if (this.Get('chart.labels.position') == 'top') {
                RGraph.Text(this.context,font,size,this.gutterLeft,this.gutterTop - 6,this.Get('chart.units.pre') + Number(this.Get('chart.min')).toFixed(this.Get('chart.scale.decimals')) + this.Get('chart.units.post'),'bottom','center');
            } else {
                RGraph.Text(this.context,font,size,this.gutterLeft,this.canvas.height - this.gutterBottom + 5,this.Get('chart.units.pre') + Number(this.Get('chart.min')).toFixed(this.Get('chart.scale.decimals')) + this.Get('chart.units.post'),'top','center');
            }
        }



        // Draw the title text
        if (this.Get('chart.title')) {
            var vpos = this.gutterTop + this.Get('chart.text.size');
            
            if (this.Get('chart.labels.position') == 'top' && this.Get('chart.title.vpos') == null) {
                this.Set('chart.title.vpos', (this.canvas.height / this.gutterTop) - (this.gutterBottom / this.gutterTop));
            }

            RGraph.DrawTitle(this.canvas,
                             this.Get('chart.title'),
                             vpos,
                             0,
                             this.Get('chart.title.size') ? this.Get('chart.title.size') : this.Get('chart.text.size') + 2);
        }
    }


    /**
    * Returns the focused bar
    * 
    * @param event e The event object
    */
    RGraph.HProgress.prototype.getBar = function (e)
    {
        var obj         = e.target.__object__;
        var mouseCoords = RGraph.getMouseXY(e)

        for (var i=0; i<obj.coords.length; i++) {

            var mouseCoords = RGraph.getMouseXY(e);
            var mouseX = mouseCoords[0];
            var mouseY = mouseCoords[1];
            var left   = obj.coords[i][0];
            var top    = obj.coords[i][1];
            var width  = obj.coords[i][2];
            var height = obj.coords[i][3];
            var idx    = i;

            if (mouseX >= left && mouseX <= (left + width) && mouseY >= top && mouseY <= (top + height) ) {
                return [obj, left, top, width, height, idx];
            }
        }
    }


    /**
    * This function returns the value that the mouse is positioned at, regardless of
    * the actual indicated value.
    * 
    * @param object e The event object
    */
    RGraph.HProgress.prototype.getValue = function (arg)
    {
        if (arg.length == 2) {
            var mouseX = arg[0];
            var mouseY = arg[1];
        } else {
            var mouseCoords = RGraph.getMouseXY(arg);
            var mouseX      = mouseCoords[0];
            var mouseY      = mouseCoords[1];
        }

        var canvas  = this.canvas;
        var context = this.context;
        
        if (
               mouseX > (this.canvas.width - this.gutterRight - this.Get('chart.margin'))
            || mouseX < (this.gutterLeft + this.Get('chart.margin'))
            || mouseY > (this.canvas.height - this.gutterBottom)
            || mouseY < (this.gutterTop)
           ) {
            return null;
        }

        var value = (mouseX - this.gutterLeft) / this.width;
            value *= this.max - this.Get('chart.min');
            value += this.Get('chart.min');

        return value;
    }