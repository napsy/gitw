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

    /**
    * Draws the graph key (used by various graphs)
    * 
    * @param object obj The graph object
    * @param array  key An array of the texts to be listed in the key
    * @param colors An array of the colors to be used
    */
    RGraph.DrawKey = function (obj, key, colors)
    {
        var canvas  = obj.canvas;
        var context = obj.context;
        context.lineWidth = 1;

        context.beginPath();

        /**
        * Key positioned in the gutter
        */
        var keypos   = obj.Get('chart.key.position');
        var textsize = obj.Get('chart.text.size');
        
        /**
        * Change the older chart.key.vpos to chart.key.position.y
        */
        if (typeof(obj.Get('chart.key.vpos')) == 'number') {
            obj.Set('chart.key.position.y', obj.Get('chart.key.vpos') * this.Get('chart.gutter.top') );
        }

        /**
        * Account for null values in the key
        */
        var key_non_null    = [];
        var colors_non_null = [];
        for (var i=0; i<key.length; ++i) {
            if (key[i] != null) {
                colors_non_null.push(colors[i]);
                key_non_null.push(key[i]);
            }
        }
        
        key    = key_non_null;
        colors = colors_non_null;



        if (keypos && keypos == 'gutter') {
    
            RGraph.DrawKey_gutter(obj, key, colors);


        /**
        * In-graph style key
        */
        } else if (keypos && keypos == 'graph') {

            RGraph.DrawKey_graph(obj, key, colors);
        
        } else {
            alert('[COMMON] (' + obj.id + ') Unknown key position: ' + keypos);
        }
    }





    /**
    * This does the actual drawing of the key when it's in the graph
    * 
    * @param object obj The graph object
    * @param array  key The key items to draw
    * @param array colors An aray of colors that the key will use
    */
    RGraph.DrawKey_graph = function (obj, key, colors)
    {
        var canvas      = obj.canvas;
        var context     = obj.context;
        var text_size   = typeof(obj.Get('chart.key.text.size')) == 'number' ? obj.Get('chart.key.text.size') : obj.Get('chart.text.size');
        var text_font   = obj.Get('chart.text.font');
        
        var gutterLeft   = obj.Get('chart.gutter.left');
        var gutterRight  = obj.Get('chart.gutter.right');
        var gutterTop    = obj.Get('chart.gutter.top');
        var gutterBottom = obj.Get('chart.gutter.bottom');

        var hpos        = obj.Get('chart.yaxispos') == 'right' ? gutterLeft + 10 : RGraph.GetWidth(obj) - gutterRight - 10;
        var vpos        = gutterTop + 10;
        var title       = obj.Get('chart.title');
        var blob_size   = text_size; // The blob of color
        var hmargin      = 8; // This is the size of the gaps between the blob of color and the text
        var vmargin      = 4; // This is the vertical margin of the key
        var fillstyle    = obj.Get('chart.key.background');
        var strokestyle  = '#333';
        var height       = 0;
        var width        = 0;


        obj.coordsKey = [];


        // Need to set this so that measuring the text works out OK
        context.font = text_size + 'pt ' + obj.Get('chart.text.font');

        // Work out the longest bit of text
        for (i=0; i<key.length; ++i) {
            width = Math.max(width, context.measureText(key[i]).width);
        }

        width += 5;
        width += blob_size;
        width += 5;
        width += 5;
        width += 5;

        /**
        * Now we know the width, we can move the key left more accurately
        */
        if (   obj.Get('chart.yaxispos') == 'left'
            || (obj.type == 'pie' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'hbar' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'hbar' && obj.Get('chart.yaxispos') == 'center')
            || (obj.type == 'rscatter' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'radar' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'rose' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'funnel' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'vprogress' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'hprogress' && !obj.Get('chart.yaxispos'))
           ) {

            hpos -= width;
        }

        /**
        * Horizontal alignment
        */
        if (typeof(obj.Get('chart.key.halign')) == 'string') {
            if (obj.Get('chart.key.halign') == 'left') {
                hpos = gutterLeft + 10;
            } else if (obj.Get('chart.key.halign') == 'right') {
                hpos = RGraph.GetWidth(obj) - gutterRight  - width;
            }
        }

        /**
        * Specific location coordinates
        */
        if (typeof(obj.Get('chart.key.position.x')) == 'number') {
            hpos = obj.Get('chart.key.position.x');
        }
        
        if (typeof(obj.Get('chart.key.position.y')) == 'number') {
            vpos = obj.Get('chart.key.position.y');
        }


        // Stipulate the shadow for the key box
        if (obj.Get('chart.key.shadow')) {
            context.shadowColor   = obj.Get('chart.key.shadow.color');
            context.shadowBlur    = obj.Get('chart.key.shadow.blur');
            context.shadowOffsetX = obj.Get('chart.key.shadow.offsetx');
            context.shadowOffsetY = obj.Get('chart.key.shadow.offsety');
        }




        // Draw the box that the key resides in
        context.beginPath();
            context.fillStyle   = obj.Get('chart.key.background');
            context.strokeStyle = 'black';


        if (arguments[3] != false) {

            context.lineWidth = typeof(obj.Get('chart.key.linewidth')) == 'number' ? obj.Get('chart.key.linewidth') : 1;

            // The older square rectangled key
            if (obj.Get('chart.key.rounded') == true) {
                context.beginPath();
                    context.strokeStyle = strokestyle;
                    RGraph.strokedCurvyRect(context, AA(this, hpos), AA(this, vpos), width - 5, 5 + ( (text_size + 5) * RGraph.getKeyLength(key)),4);
        
                context.stroke();
                context.fill();
        
                RGraph.NoShadow(obj);
        
            } else {
                context.strokeRect(AA(this, hpos), AA(this, vpos), width - 5, 5 + ( (text_size + 5) * RGraph.getKeyLength(key)));
                context.fillRect(AA(this, hpos), AA(this, vpos), width - 5, 5 + ( (text_size + 5) * RGraph.getKeyLength(key)));
            }
        }

        RGraph.NoShadow(obj);

        context.beginPath();

            /**
            * Custom colors for the key
            */
            if (obj.Get('chart.key.colors')) {
                colors = obj.Get('chart.key.colors');
            }

            // Draw the labels given
            for (var i=key.length - 1; i>=0; i--) {
            
                var j = Number(i) + 1;

                // Draw the blob of color
                if (obj.Get('chart.key.color.shape') == 'circle') {
                    context.beginPath();
                        context.strokeStyle = 'rgba(0,0,0,0)';
                        context.fillStyle = colors[i];
                        context.arc(hpos + 5 + (blob_size / 2), vpos + (5 * j) + (text_size * j) - text_size + (blob_size / 2), blob_size / 2, 0, 6.26, 0);
                    context.fill();
                
                } else if (obj.Get('chart.key.color.shape') == 'line') {
                    context.beginPath();
                        context.strokeStyle = colors[i];
                        context.moveTo(hpos + 5, vpos + (5 * j) + (text_size * j) - text_size + (blob_size / 2));
                        context.lineTo(hpos + blob_size + 5, vpos + (5 * j) + (text_size * j) - text_size + (blob_size / 2));
                    context.stroke();

                } else {
                    context.fillStyle =  colors[i];
                    context.fillRect(hpos + 5, vpos + (5 * j) + (text_size * j) - text_size, text_size, text_size + 1);
                }

                context.beginPath();
            
                context.fillStyle = 'black';
            
                RGraph.Text(context,
                            text_font,
                            text_size,
                            hpos + blob_size + 5 + 5,
                            vpos + (5 * j) + (text_size * j),
                            key[i]);

                if (obj.Get('chart.key.interactive')) {
                
                    var px = hpos + 5;
                    var py = vpos + (5 * j) + (text_size * j) - text_size;
                    var pw = width - 5 - 5 - 5;
                    var ph = text_size;
                    
                    
                    obj.coordsKey.push([px, py, pw, ph]);
                }

            }
        context.fill();

        /**
        * Install the interactivity event handler
        */
        if (obj.Get('chart.key.interactive')) {
        
            RGraph.Register(obj);
        
            var key_mousemove = function (e)
            {
                var obj         = e.target.__object__;
                var canvas      = obj.canvas;
                var context     = obj.context;
                var mouseCoords = RGraph.getMouseXY(e);
                var mouseX      = mouseCoords[0];
                var mouseY      = mouseCoords[1];
        
                for (var i=0; i<obj.coordsKey.length; ++i) {
                
                    var px = obj.coordsKey[i][0];
                    var py = obj.coordsKey[i][1];
                    var pw = obj.coordsKey[i][2];
                    var ph = obj.coordsKey[i][3];
        
                    if (   mouseX > (px-2) && mouseX < (px + pw + 2) && mouseY > (py - 2) && mouseY < (py + ph + 2) ) {
                        
                        // Necessary?
                        //var index = obj.coordsKey.length - i - 1;
        
                        canvas.style.cursor = 'pointer';
                        

                        
                        return;
                    }
                    
                    canvas.style.cursor = 'default';
                    
                    if (typeof(obj.Get('chart.tooltips')) == 'object' && typeof(canvas_onmousemove_func) == 'function') {
                        canvas_onmousemove_func(e);
                    }
                }
            }
            canvas.addEventListener('mousemove', key_mousemove, false);
            RGraph.AddEventListener(canvas.id, 'mousemove', key_mousemove);
        
        
            var key_click = function (e)
            {
                RGraph.Redraw();

                var obj         = e.target.__object__;
                var canvas      = obj.canvas;
                var context     = obj.context;
                var mouseCoords = RGraph.getMouseXY(e);
                var mouseX      = mouseCoords[0];
                var mouseY      = mouseCoords[1];
                
                /**
                * Hand over highlighting the pie chart key to another function
                */
                if (obj.type == 'pie') {
                    return key_onclick_pie(e);
                }

                RGraph.DrawKey(obj, obj.Get('chart.key'), obj.Get('chart.colors'));
        
                for (var i=0; i<obj.coordsKey.length; ++i) {
                
                    var px = obj.coordsKey[i][0];
                    var py = obj.coordsKey[i][1];
                    var pw = obj.coordsKey[i][2];
                    var ph = obj.coordsKey[i][3];
        
                    if (   mouseX > px && mouseX < (px + pw) && mouseY > py && mouseY < (py + ph) ) {

                        /**
                        * Loop thru all objects. If they're objects with
                        * chart.key.interactive enabled, redraw them
                        */
                        for (j in RGraph.objects) {
                            if (RGraph.objects[j] && RGraph.objects[j].Get && RGraph.objects[j].Get('chart.key.interactive')) {
                                
                                if (RGraph.objects[j].Get('chart.exploded')) {
                                    RGraph.objects[j].Set('chart.exploded', []);
                                }
                        
                                RGraph.Clear(RGraph.objects[j].canvas);
                                RGraph.objects[j].Draw();
                            }
                        }
                        var index = obj.coordsKey.length - i - 1;

                        // HIGHLIGHT THE LINE HERE
                        context.beginPath();
                            context.fillStyle = 'rgba(255,255,255,0.9)';
                            context.fillRect(AA(obj, obj.Get('chart.gutter.left')),AA(obj, obj.Get('chart.gutter.top')),canvas.width - obj.Get('chart.gutter.left') - obj.Get('chart.gutter.right'),canvas.height - obj.Get('chart.gutter.top') - obj.Get('chart.gutter.bottom'));
                        context.fill();

                        context.beginPath();
                            context.strokeStyle = obj.Get('chart.colors')[index];
                            context.lineWidth  = obj.Get('chart.linewidth');
                            if (obj.coords2 &&obj.coords2[index] &&obj.coords2[index].length) {
                                for (var j=0; j<obj.coords2[index].length; ++j) {
                                    
                                    var x = obj.coords2[index][j][0];
                                    var y = obj.coords2[index][j][1];
                                
                                    if (j == 0) {
                                        context.moveTo(x, y);
                                    } else {
                                        context.lineTo(x, y);
                                    }
                                }
                            }
                        context.stroke();


                        context.lineWidth  = 1;
                        context.beginPath();
                            context.strokeStyle = 'black';
                            context.fillStyle   = 'white';
                            
                            RGraph.SetShadow(obj, 'rgba(0,0,0,0.5)', 0,0,10);

                            context.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
                            context.fillRect(px - 2, py - 2, pw + 4, ph + 4);

                        context.stroke();
                        context.fill();


                        RGraph.NoShadow(obj);


                        context.beginPath();
                            context.fillStyle = obj.Get('chart.colors')[index];
                            context.fillRect(px, py, blob_size, blob_size);
                        context.fill();

                        context.beginPath();
                            context.fillStyle = obj.Get('chart.text.color');
                        
                            RGraph.Text(context,
                                        obj.Get('chart.text.font'),
                                        obj.Get('chart.text.size'),
                                        px + 5 + blob_size,
                                        py + ph,
                                        obj.Get('chart.key')[obj.Get('chart.key').length - i - 1]
                                       );
                        context.fill();

        
                        canvas.style.cursor = 'pointer';
                        
                        e.cancelBubble = true;
                        if (e.stopPropagation) e.stopPropagation();
                    }
                    
                    canvas.style.cursor = 'default';
                }
            }
            canvas.addEventListener('click', key_click, false);
            RGraph.AddEventListener(canvas.id, 'click', key_click);
            
            /**
            * This function handles the Pie chart interactive key (the click event)
            * 
            * @param object e The event object
            */
            var key_onclick_pie = function (e)
            {
                var canvas      = e.target;
                var context     = canvas.getContext('2d');
                var obj         = e.target.__object__;
                var mouseCoords = RGraph.getMouseXY(e);
                var mouseX      = mouseCoords[0];
                var mouseY      = mouseCoords[1];

                //RGraph.DrawKey(obj, obj.Get('chart.key'), obj.Get('chart.colors'));

                for (var i=0; i<obj.coordsKey.length; ++i) {

                    var px = obj.coordsKey[i][0];
                    var py = obj.coordsKey[i][1];
                    var pw = obj.coordsKey[i][2];
                    var ph = obj.coordsKey[i][3];
        
                    if (   mouseX > (px - 2) && mouseX < (px + pw + 2) && mouseY > (py - 2) && mouseY < (py + ph + 2) ) {
                        
                        var index = obj.coordsKey.length - i - 1;


                        e.cancelBubble = true;
                        if (e.stopPropagation) e.stopPropagation();



                        // ==========================================================================
                        var highlight_key = function ()
                        {
                            context.lineWidth  = 1;
                            context.beginPath();
                                context.strokeStyle = 'black';
                                context.fillStyle   = 'white';
                                
                                RGraph.SetShadow(obj, 'rgba(0,0,0,0.5)', 0,0,10);
    
                                context.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
                                context.fillRect(px - 2, py - 2, pw + 4, ph + 4);
    
                            context.stroke();
                            context.fill();
    
    
                            RGraph.NoShadow(obj);
    
    
                            context.beginPath();
                                context.fillStyle = obj.Get('chart.colors')[index];
                                context.fillRect(px, py, blob_size, blob_size);
                            context.fill();
    
                            context.beginPath();
                                context.fillStyle = obj.Get('chart.text.color');
                            
                                RGraph.Text(context,
                                            obj.Get('chart.text.font'),
                                            obj.Get('chart.text.size'),
                                            px + 5 + blob_size,
                                            py + ph,
                                            obj.Get('chart.key')[obj.Get('chart.key').length - i - 1]
                                           );
                            context.fill();
                        }
                        // ==========================================================================

                        setTimeout(function (){obj.Get('chart.exploded')[index] = 2;RGraph.Clear(obj.canvas);obj.Draw();highlight_key();}, 20);
                        setTimeout(function (){obj.Get('chart.exploded')[index] = 4;RGraph.Clear(obj.canvas);obj.Draw();highlight_key();}, 40);
                        setTimeout(function (){obj.Get('chart.exploded')[index] = 6;RGraph.Clear(obj.canvas);obj.Draw();highlight_key();}, 60);
                        setTimeout(function (){obj.Get('chart.exploded')[index] = 8;RGraph.Clear(obj.canvas);obj.Draw();highlight_key();}, 80);
                        setTimeout(function (){obj.Get('chart.exploded')[index] = 10;RGraph.Clear(obj.canvas);obj.Draw();highlight_key();}, 100);
                        setTimeout(function (){obj.Get('chart.exploded')[index] = 12;RGraph.Clear(obj.canvas);obj.Draw();highlight_key();}, 120);
                        setTimeout(function (){obj.Get('chart.exploded')[index] = 14;RGraph.Clear(obj.canvas);obj.Draw();highlight_key();}, 140);
                        setTimeout(function (){obj.Get('chart.exploded')[index] = 16;RGraph.Clear(obj.canvas);obj.Draw();highlight_key();}, 160);
                        setTimeout(function (){obj.Get('chart.exploded')[index] = 18;RGraph.Clear(obj.canvas);obj.Draw();highlight_key();}, 180);
                        setTimeout(function (){obj.Get('chart.exploded')[index] = 20;RGraph.Clear(obj.canvas);obj.Draw();highlight_key();}, 200);
                        
                        /**
                        * This is here so that when calling the Redraw function the Pie chart
                        * is drawn unexploded
                        */
                        setTimeout(function (){obj.Get('chart.exploded')[index] = 0;}, 250);

                        return;
                    } else {
                        e.cancelBubble = true;
                        if (e.stopPropagation) e.stopPropagation();
                    }
                }
                
                //obj.Set('chart.exploded', []);
                RGraph.Clear(obj.canvas);
                obj.Draw();
            }
            
            /**
            * The window onclick for the pie chart
            */
            var key_interactive_click = function (e)
            {
                if (obj && obj.type == 'pie') {
                    obj.Set('chart.exploded', []);
                }
                RGraph.Clear(obj.canvas);
                obj.Draw();
            }
            window.addEventListener('click', key_interactive_click, false);
            RGraph.AddEventListener('window_' + canvas.id, 'click', key_interactive_click);
        }
    }






    /**
    * This does the actual drawing of the key when it's in the gutter
    * 
    * @param object obj The graph object
    * @param array  key The key items to draw
    * @param array colors An aray of colors that the key will use
    */
    RGraph.DrawKey_gutter = function (obj, key, colors)
    {
        var canvas      = obj.canvas;
        var context     = obj.context;
        var text_size   = typeof(obj.Get('chart.key.text.size')) == 'number' ? obj.Get('chart.key.text.size') : obj.Get('chart.text.size');
        var text_font   = obj.Get('chart.text.font');
        
        var gutterLeft   = obj.Get('chart.gutter.left');
        var gutterRight  = obj.Get('chart.gutter.right');
        var gutterTop    = obj.Get('chart.gutter.top');
        var gutterBottom = obj.Get('chart.gutter.bottom');

        var hpos        = RGraph.GetWidth(obj) / 2;
        var vpos        = (gutterTop / 2) - 5;
        var title       = obj.Get('chart.title');
        var blob_size   = text_size; // The blob of color
        var hmargin      = 8; // This is the size of the gaps between the blob of color and the text
        var vmargin      = 4; // This is the vertical margin of the key
        var fillstyle   = obj.Get('chart.key.background');
        var strokestyle = 'black';
        var length      = 0;



        // Need to work out the length of the key first
        context.font = text_size + 'pt ' + text_font;
        for (i=0; i<key.length; ++i) {
            length += hmargin;
            length += blob_size;
            length += hmargin;
            length += context.measureText(key[i]).width;
        }
        length += hmargin;




        /**
        * Work out hpos since in the Pie it isn't necessarily dead center
        */
        if (obj.type == 'pie') {
            if (obj.Get('chart.align') == 'left') {
                var hpos = obj.radius + gutterLeft;
                
            } else if (obj.Get('chart.align') == 'right') {
                var hpos = obj.canvas.width - obj.radius - gutterRight;

            } else {
                hpos = canvas.width / 2;
            }
        }





        /**
        * This makes the key centered
        */  
        hpos -= (length / 2);


        /**
        * Override the horizontal/vertical positioning
        */
        if (typeof(obj.Get('chart.key.position.x')) == 'number') {
            hpos = obj.Get('chart.key.position.x');
        }
        if (typeof(obj.Get('chart.key.position.y')) == 'number') {
            vpos = obj.Get('chart.key.position.y');
        }



        /**
        * Draw the box that the key sits in
        */
        if (obj.Get('chart.key.position.gutter.boxed')) {

            if (obj.Get('chart.key.shadow')) {
                context.shadowColor   = obj.Get('chart.key.shadow.color');
                context.shadowBlur    = obj.Get('chart.key.shadow.blur');
                context.shadowOffsetX = obj.Get('chart.key.shadow.offsetx');
                context.shadowOffsetY = obj.Get('chart.key.shadow.offsety');
            }

            
            context.beginPath();
                context.fillStyle = fillstyle;
                context.strokeStyle = strokestyle;

                if (obj.Get('chart.key.rounded')) {
                    RGraph.strokedCurvyRect(context, hpos, vpos - vmargin, length, text_size + vmargin + vmargin)
                    // Odd... RGraph.filledCurvyRect(context, hpos, vpos - vmargin, length, text_size + vmargin + vmargin);
                } else {
                    context.strokeRect(hpos, vpos - vmargin, length, text_size + vmargin + vmargin);
                    context.fillRect(hpos, vpos - vmargin, length, text_size + vmargin + vmargin);
                }
                
            context.stroke();
            context.fill();


            RGraph.NoShadow(obj);
        }


        /**
        * Draw the blobs of color and the text
        */

        // Custom colors for the key
        if (obj.Get('chart.key.colors')) {
            colors = obj.Get('chart.key.colors');
        }

        for (var i=0, pos=hpos; i<key.length; ++i) {
            pos += hmargin;
            
            // Draw the blob of color - line
            if (obj.Get('chart.key.color.shape') =='line') {
                
                context.beginPath();
                    context.strokeStyle = colors[i];
                    context.moveTo(pos, vpos + (blob_size / 2));
                    context.lineTo(pos + blob_size, vpos + (blob_size / 2));
                context.stroke();
                
            // Circle
            } else if (obj.Get('chart.key.color.shape') == 'circle') {
                
                context.beginPath();
                    context.fillStyle = colors[i];
                    context.moveTo(pos, vpos + (blob_size / 2));
                    context.arc(pos + (blob_size / 2), vpos + (blob_size / 2), (blob_size / 2), 0, 6.28, 0);
                context.fill();


            } else {

                context.beginPath();
                    context.fillStyle = colors[i];
                    context.fillRect(pos, vpos, blob_size, blob_size);
                context.fill();
            }

            pos += blob_size;
            
            pos += hmargin;

            context.beginPath();
                context.fillStyle = 'black';
                RGraph.Text(context, text_font, text_size, pos, vpos + text_size - 1, key[i]);
            context.fill();
            pos += context.measureText(key[i]).width;
        }
    }
    
    
    /**
    * Returns the key length, but accounts for null values
    * 
    * @param array key The key elements
    */
    RGraph.getKeyLength = function (key)
    {
        var len = 0;

        for (var i=0; i<key.length; ++i) {
            if (key[i] != null) {
                ++len;
            }
        }

        return len;
    }