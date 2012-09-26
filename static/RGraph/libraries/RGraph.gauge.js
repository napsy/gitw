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
    * The line chart constructor
    * 
    * @param object canvas The cxanvas object
    * @param array  data   The chart data
    * @param array  ...    Other lines to plot
    */
    RGraph.Gauge = function (id, min, max, value)
    {
        // Get the canvas and context objects
        this.id                = id;
        this.canvas            = document.getElementById(id);
        this.context           = this.canvas.getContext ? this.canvas.getContext("2d") : null;
        this.canvas.__object__ = this;
        this.type              = 'gauge';
        this.min               = min;
        this.max               = max;
        this.value             = value;
        this.isRGraph          = true;
        this.currentValue      = null;

        /**
        * Range checking
        */
        if (this.value > this.max) {
            this.value = max;
        }

        if (this.value < this.min) {
            this.value = min;
        }



        /**
        * Compatibility with older browsers
        */
        RGraph.OldBrowserCompat(this.context);


        // Various config type stuff
        this.properties = {
            'chart.gutter.left':   5,
            'chart.gutter.right':  5,
            'chart.gutter.top':    5,
            'chart.gutter.bottom': 5,
            'chart.border.width':  10,

            'chart.title.top':     '',
            'chart.title.top.font':'Arial',
            'chart.title.top.size':14,
            'chart.title.top.color':'#333',
            'chart.title.top.bold':false,
            'chart.title.top.pos': null,

            'chart.title.bottom':  '',
            'chart.title.bottom.font':'Arial',
            'chart.title.bottom.size':14,
            'chart.title.bottom.color':'#333',
            'chart.title.bottom.bold':false,
            'chart.title.bottom.pos':null,

            'chart.text.align':    'top',
            'chart.text.x':         null,
            'chart.text.y':         null,
            'chart.text.color':     '#666',
            'chart.text.size':      10,
            'chart.scale.decimals': 0,
            'chart.scale.point':    '.',
            'chart.scale.thousand': ',',
            'chart.units.pre':      '',
            'chart.units.post':     '',
            'chart.red.start':      0.9 * this.max,
            'chart.red.color':      '#DC3912',
            'chart.yellow.color':   '#FF9900',
            'chart.green.end':      0.7 * this.max,
            'chart.green.color':    'rgba(0,0,0,0)',
            'chart.needle.tail':    false,
            'chart.needle.color':    '#D5604D',
            'chart.border.outer':   '#ccc',
            'chart.border.inner':   '#f1f1f1',
            'chart.centerpin.color':        'blue',
            'chart.centerpin.radius':       null,
            'chart.zoom.mode':              'canvas',
            'chart.zoom.thumbnail.width':   75,
            'chart.zoom.thumbnail.height':  75,
            'chart.zoom.thumbnail.fixed':   false,
            'chart.zoom.background':        true,
            'chart.zoom.action':            'zoom',
            'chart.tickmarks.small':        25,
            'chart.tickmarks.big':          5
        }
    }



    /**
    * An all encompassing accessor
    * 
    * @param string name The name of the property
    * @param mixed value The value of the property
    */
    RGraph.Gauge.prototype.Set = function (name, value)
    {
        /**
        * Title compatibility
        */
        if (name == 'chart.title')       name = 'chart.title.top';
        if (name == 'chart.title.font')  name = 'chart.title.top.font';
        if (name == 'chart.title.size')  name = 'chart.title.top.size';
        if (name == 'chart.title.color') name = 'chart.title.top.color';
        if (name == 'chart.title.bold')  name = 'chart.title.top.bold';

        this.properties[name] = value;
    }


    /**
    * An all encompassing accessor
    * 
    * @param string name The name of the property
    */
    RGraph.Gauge.prototype.Get = function (name)
    {
        return this.properties[name];
    }


    /**
    * The function you call to draw the line chart
    * 
    * @param bool An optional bool used internally to ditinguish whether the
    *             line chart is being called by the bar chart
    */
    RGraph.Gauge.prototype.Draw = function ()
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
        * Store the value (for animation primarily
        */
        this.currentValue = this.value;


        /**
        * This is new in May 2011 and facilitates indiviual gutter settings,
        * eg chart.gutter.left
        */
        this.gutterLeft   = this.Get('chart.gutter.left');
        this.gutterRight  = this.Get('chart.gutter.right');
        this.gutterTop    = this.Get('chart.gutter.top');
        this.gutterBottom = this.Get('chart.gutter.bottom');
        
        this.centerx = ((this.canvas.width - this.gutterLeft - this.gutterRight) / 2) + this.gutterLeft;
        this.centery = ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop;
        this.radius  = Math.min(
                                ((this.canvas.width - this.gutterLeft - this.gutterRight) / 2),
                                ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2)
                               );
        this.startAngle = (1.57 / 3) + 1.57;
        this.endAngle   = 6.28 + 1.57 - (1.57 / 3);
        
        // This has to be in the constructor
        this.centerpinRadius = 0.16 * this.radius;
        
        if (typeof(this.Get('chart.centerpin.radius')) == 'number') {
            this.centerpinRadius = this.Get('chart.centerpin.radius');
        }


        /**
        * Setup the context menu if required
        */
        if (this.Get('chart.contextmenu')) {
            RGraph.ShowContext(this);
        }



        // DRAW THE CHART HERE
        this.DrawBackGround();
        this.DrawColorBands();
        this.DrawSmallTickmarks();
        this.DrawBigTickmarks();
        this.DrawLabels();

        this.DrawTopTitle();
        this.DrawBottomTitle();

        this.DrawNeedle();
        this.DrawCenterpin();




        /**
        * If the canvas is annotatable, do install the event handlers
        */
        if (this.Get('chart.annotatable')) {
            RGraph.Annotate(this);
        }



        /**
        * This bit shows the mini zoom window if requested
        */
        if (this.Get('chart.zoom.mode') == 'thumbnail') {
            RGraph.ShowZoomWindow(this);
        }

        /**
        * This function enables the zoom in area mode
        */
        if (this.Get('chart.zoom.mode') == 'area') {
            RGraph.ZoomArea(this);
        }
        
        /**
        * This function enables resizing
        */
        if (this.Get('chart.resizable')) {
            RGraph.AllowResizing(this);
        }

        
        /**
        * Fire the RGraph ondraw event
        */
        RGraph.FireCustomEvent(this, 'ondraw');
    }


    /**
    * Draw the background
    */
    RGraph.Gauge.prototype.DrawBackGround = function ()
    {
        var borderWidth = this.Get('chart.border.width');

        this.context.beginPath();
            this.context.fillStyle = 'white';

            this.context.arc(this.centerx, this.centery, this.radius, 0, 6.28, 0);
        this.context.fill();
        
        /**
        * Draw the gray circle
        */
        this.context.beginPath();
            this.context.fillStyle = this.Get('chart.border.outer');
            this.context.arc(this.centerx, this.centery, this.radius, 0, 6.28, 0);
        this.context.fill();
        
        /**
        * Draw the light gray inner border
        */
        this.context.beginPath();
            this.context.fillStyle = this.Get('chart.border.inner');
            this.context.arc(this.centerx, this.centery, this.radius - borderWidth, 0, 6.28, 0);
        this.context.fill();
        
        // Draw the white circle inner border
        this.context.beginPath();
            this.context.fillStyle = 'white';
            this.context.arc(this.centerx, this.centery, this.radius - borderWidth - 4, 0, 6.28, 0);
        this.context.fill();

        this.context.beginPath();
            this.context.strokeStyle = 'black';
            //this.context.moveTo(this.centerx, this.centery)
            this.context.arc(this.centerx, this.centery, this.radius, 0, 6.28, 0);
        this.context.stroke();
    }


    /**
    * This function draws the smaller tickmarks
    */
    RGraph.Gauge.prototype.DrawSmallTickmarks = function ()
    {
        var numTicks = this.Get('chart.tickmarks.small');

        for (var i=0; i<=numTicks; ++i) {
            this.context.beginPath();
                this.context.strokeStyle = 'black';
                var a = (((this.endAngle - this.startAngle) / numTicks) * i) + this.startAngle;
                this.context.arc(this.centerx, this.centery, this.radius - this.Get('chart.border.width') - 10, a, a + 0.00001, 0);
                this.context.arc(this.centerx, this.centery, this.radius - this.Get('chart.border.width') - 10 - 5, a, a + 0.00001, 0);
            this.context.stroke();
        }
    }


    /**
    * This function draws the large, bold tickmarks
    */
    RGraph.Gauge.prototype.DrawBigTickmarks = function ()
    {
        var numTicks = this.Get('chart.tickmarks.big');
        this.context.lineWidth = 3;
        this.context.lineCap   = 'round';

        for (var i=0; i<=numTicks; ++i) {
            this.context.beginPath();
                this.context.strokeStyle = 'black';
                var a = (((this.endAngle - this.startAngle) / numTicks) * i) + this.startAngle;
                this.context.arc(this.centerx, this.centery, this.radius - this.Get('chart.border.width') - 10, a, a + 0.00001, 0);
                this.context.arc(this.centerx, this.centery, this.radius - this.Get('chart.border.width') - 10 - 10, a, a + 0.00001, 0);
            this.context.stroke();
        }
    }


    /**
    * This function draws the centerpin
    */
    RGraph.Gauge.prototype.DrawCenterpin = function ()
    {
        var offset = 6;

        var grad = this.context.createRadialGradient(this.centerx + offset, this.centery - offset, 0, this.centerx + offset, this.centery - offset, 25);
        grad.addColorStop(0, '#ddf');
        grad.addColorStop(1, this.Get('chart.centerpin.color'));

        this.context.beginPath();
            this.context.fillStyle = grad;
            this.context.arc(this.centerx, this.centery, this.centerpinRadius, 0, 6.28, 0);
        this.context.fill();
    }


    /**
    * This function draws the labels
    */
    RGraph.Gauge.prototype.DrawLabels = function ()
    {
        this.context.fillStyle = this.Get('chart.text.color');

        this.context.beginPath();
            RGraph.Text(this.context, this.Get('chart.text.font'), this.Get('chart.text.size'), this.centerx - Math.sin(0.52) * (this.radius - 25 - this.Get('chart.border.width')),this.centery + Math.cos(0.52) * (this.radius - 25 - this.Get('chart.border.width')), RGraph.number_format(this, this.min.toFixed(this.Get('chart.scale.decimals')), this.Get('chart.units.pre'), this.Get('chart.units.post')), 'bottom', 'left');
            RGraph.Text(this.context, this.Get('chart.text.font'), this.Get('chart.text.size'), this.centerx - this.radius + 25 + this.Get('chart.border.width'), this.centery,RGraph.number_format(this, (((this.max - this.min) * 0.2) + this.min).toFixed(this.Get('chart.scale.decimals')), this.Get('chart.units.pre'), this.Get('chart.units.post')),'center', 'left');
            RGraph.Text(this.context, this.Get('chart.text.font'), this.Get('chart.text.size'), this.centerx - Math.sin(0.52) * (this.radius - 25 - this.Get('chart.border.width')),this.centery - Math.cos(0.52) * (this.radius - 25 - this.Get('chart.border.width')),RGraph.number_format(this, (((this.max - this.min) * 0.4) + this.min).toFixed(this.Get('chart.scale.decimals')), this.Get('chart.units.pre'), this.Get('chart.units.post')),'top', 'center');
            RGraph.Text(this.context, this.Get('chart.text.font'), this.Get('chart.text.size'), this.centerx + Math.sin(0.52) * (this.radius - 25 - this.Get('chart.border.width')),this.centery - Math.cos(0.52) * (this.radius - 25 - this.Get('chart.border.width')),RGraph.number_format(this, (((this.max - this.min) * 0.6) + this.min).toFixed(this.Get('chart.scale.decimals')), this.Get('chart.units.pre'), this.Get('chart.units.post')),'top', 'center');
            RGraph.Text(this.context, this.Get('chart.text.font'), this.Get('chart.text.size'), this.centerx + this.radius - 25 - this.Get('chart.border.width'), this.centery,RGraph.number_format(this, (((this.max - this.min) * 0.8) + this.min).toFixed(this.Get('chart.scale.decimals')), this.Get('chart.units.pre'), this.Get('chart.units.post')),'center', 'right');
            RGraph.Text(this.context,this.Get('chart.text.font'), this.Get('chart.text.size'), this.centerx + Math.sin(0.52) * (this.radius - 25 - this.Get('chart.border.width')),this.centery + Math.cos(0.52) * (this.radius - 25 - this.Get('chart.border.width')),RGraph.number_format(this, this.max.toFixed(this.Get('chart.scale.decimals')), this.Get('chart.units.pre'), this.Get('chart.units.post')),'bottom', 'right');
        this.context.fill();
    }


    /**
    * This function draws the top title
    */
    RGraph.Gauge.prototype.DrawTopTitle = function ()
    {
        var x = this.centerx;
        var y = this.centery - 25;
        
        // Totally override the calculated positioning
        if (typeof(this.Get('chart.title.top.pos')) == 'number') {
            y = this.centery - (this.radius * this.Get('chart.title.top.pos'));
        }

        if (this.Get('chart.title.top')) {
            this.context.fillStyle = this.Get('chart.title.top.color');

            this.context.beginPath();
                RGraph.Text(this.context,
                            this.Get('chart.title.top.font'),
                            this.Get('chart.title.top.size'),
                            x,
                            y,
                            String(this.Get('chart.title.top')),
                            'bottom',
                            'center',
                            null,
                            null,
                            null,
                            this.Get('chart.title.top.bold'));
            this.context.fill();
        }
    }


    /**
    * This function draws the bottom title
    */
    RGraph.Gauge.prototype.DrawBottomTitle = function ()
    {
        var x = this.centerx;
        var y = this.centery + this.centerpinRadius + 10;

        // Totally override the calculated positioning
        if (typeof(this.Get('chart.title.bottom.pos')) == 'number') {
            y = this.centery + (this.radius * this.Get('chart.title.bottom.pos'));
        }

        if (this.Get('chart.title.bottom')) {
            this.context.fillStyle = this.Get('chart.title.bottom.color');

            this.context.beginPath();
                RGraph.Text(this.context,
                            this.Get('chart.title.bottom.font'),
                            this.Get('chart.title.bottom.size'),
                            x,
                            y,
                            String(this.Get('chart.title.bottom')),
                            'top',
                            'center',
                            null,
                            null,
                            null,
                            this.Get('chart.title.bottom.bold'));
            this.context.fill();
        }
    }


    /**
    * This function draws the Needle
    */
    RGraph.Gauge.prototype.DrawNeedle = function ()
    {
        this.context.lineWidth   = 0.5;
        this.context.strokeStyle = '#983724';
        this.context.fillStyle   = this.Get('chart.needle.color');

        var angle = (this.endAngle - this.startAngle) * ((this.value - this.min) / (this.max - this.min));
            angle += this.startAngle;


        this.context.beginPath();
            this.context.arc(this.centerx, this.centery, this.radius - 25 - this.Get('chart.border.width'), angle, angle + 0.00001, false);
            this.context.arc(this.centerx, this.centery, this.centerpinRadius * 0.5, angle + 1.57, angle + 0.00001 + 1.57, false);
            
            if (this.Get('chart.needle.tail')) {
                this.context.arc(this.centerx, this.centery, this.radius * 0.2  , angle + 3.14, angle + 0.00001 + 3.14, false);
            }

            this.context.arc(this.centerx, this.centery, this.centerpinRadius * 0.5, angle - 1.57, angle - 0.00001 - 1.57, false);
        this.context.stroke();
        this.context.fill();
        
        /**
        * Store the angle in an object variable
        */
        this.angle = angle;
    }


    /**
    * This draws the green background to the tickmarks
    */
    RGraph.Gauge.prototype.DrawColorBands = function ()
    {
        /**
        * Draw the GREEN region
        */
        this.context.strokeStyle = this.Get('chart.green.color');
        this.context.fillStyle = this.Get('chart.green.color');
        
        var greenStart = this.startAngle;
        var greenEnd   = this.startAngle + (this.endAngle - this.startAngle) * ((this.Get('chart.green.end') - this.min) / (this.max - this.min))

        this.context.beginPath();
            this.context.arc(this.centerx, this.centery, this.radius - 10 - this.Get('chart.border.width'), greenStart, greenEnd, false);
            this.context.arc(this.centerx, this.centery, this.radius - 20 - this.Get('chart.border.width'), greenEnd, greenStart, true);
        this.context.fill();


        /**
        * Draw the YELLOW region
        */
        this.context.strokeStyle = this.Get('chart.yellow.color');
        this.context.fillStyle = this.Get('chart.yellow.color');
        
        var yellowStart = greenEnd;
        var yellowEnd   = this.startAngle + (this.endAngle - this.startAngle) * ((this.Get('chart.red.start') - this.min) / (this.max - this.min))

        this.context.beginPath();
            this.context.arc(this.centerx, this.centery, this.radius - 10 - this.Get('chart.border.width'), yellowStart, yellowEnd, false);
            this.context.arc(this.centerx, this.centery, this.radius - 20 - this.Get('chart.border.width'), yellowEnd, yellowStart, true);
        this.context.fill();


        /**
        * Draw the RED region
        */
        this.context.strokeStyle = this.Get('chart.red.color');
        this.context.fillStyle = this.Get('chart.red.color');
        
        var redStart = yellowEnd;
        var redEnd   = this.startAngle + (this.endAngle - this.startAngle) * ((this.max - this.min) / (this.max - this.min))

        this.context.beginPath();
            this.context.arc(this.centerx, this.centery, this.radius - 10 - this.Get('chart.border.width'), redStart, redEnd, false);
            this.context.arc(this.centerx, this.centery, this.radius - 20 - this.Get('chart.border.width'), redEnd, redStart, true);
        this.context.fill();
    }