function line_chart(config){
    var margin = { left:120, right:60, top:30, bottom:80 }
    let data_list;
    var anno = config.anno;
    var abbrev2full = config.abbrev2full,
        ordersList = config.orderByState,
        dur = config.duration,
        data = config.state_data,
        stateOrders = config.order,
        historicalData = config.historicalData,
        defaultColor = config.defaultColor,
        defaultOpacity = config.defaultOpacity


    var color = d3.scaleOrdinal(config.scheme);
    var cur_color = 0;   
    var focus = [],
        axesSelector = "log";

    var orderR = 8,
        lockdownMarkers = []
        reopenMarkers = []

    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    
    // append the svg object to the body of the page
    var svg = d3.select(config.selection)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var orderGroup = svg.append("g")
        .attr("class", "all-orders")
    
    //Set scales    
    var xLog = d3.scaleLog()
        .domain([10, 1000000])
        .range([0,width])

    var yLog = d3.scaleLog()
        .domain([10, 100000])
        .range([height, 0])

    var xLinear = d3.scaleLinear()
        .range([0, width])
    
    var yLinear = d3.scaleLinear()
        .range([height, 0])
    
    // Default to log plots
    var x = xLog;
    var y = yLog;
    

    var x_axis = d3.axisBottom().tickPadding(8);
    var y_axis = d3.axisLeft().tickPadding(8);

    var labels = svg.append('g')
        .attr("class", "labels")

    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + width*0.075 + "," + height* 0.075 + ")")
    
    legend.append('text')
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "#fff")
        .text("Lockdown Order")
        .attr("dominant-baseline", "middle")

    legend.append('text')
        .attr("x", 0)
        .attr("y", 25)
        .attr("fill", "#fff")
        .attr("text-anchor", "left")
        .text("Reopening Order")
        .attr("dominant-baseline", "middle")

    legend.append('rect')
        .attr("x", 130 - orderR)
        .attr("y", 25 - orderR)
        .attr("height", orderR *2)
        .attr("width", orderR*2)
        .attr("fill", "#fff")

    legend.append('circle')
        .attr("cx", 130)
        .attr("cy", 0)
        .attr("fill", "#fff")
        .attr("r", orderR)

    var xAxisCall = labels.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axis axis--x axisWhite")

    var yAxisCall = labels.append("g")
        .attr("class", "axis axis--y axisWhite")
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", - 100)
        .attr("x", - (height/2))
        .attr("dy", "1em")
        .text("New Confirmed Cases")
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "translate(0," + height + ")")
        .attr("y", 40)
        .attr("x",(width/2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("font-size", "2rem")
        .text("Total Confirmed Cases")
    
    line = d3.line()
        .x(function(d){
            if (d.positive < 10){
                d.positive = 10
            }
            var val = (d.positive == 0 ? 1 : d.positive)
            return x(val); })
        .y(function(d){
            if (d.binnedPositiveIncrease < 10){
                d.binnedPositiveIncrease = 10
            }
            var val = (d.binnedPositiveIncrease == 0 ? 1 : d.binnedPositiveIncrease)
            return y(val)
        })
        //.curve(d3.curveCardinal.tension(0.5))
    
    function lineChart(){
        draw_chart();
    }

    function draw_chart(data){
        get_lines_data();
        formatAxes();
    }
    
    function draw_paths(){
        // Draw paths

        lines = svg.selectAll(".covid-line")
            .data(historicalByState, function(d){ return d.state})


        lines.attr("d", function(d){ return line(d.values)})

        lines.enter()
            .append("path")
                .on("mousemove", mousemove)
                .on("mouseenter", mouseover)
                .on("mouseout", mouseout)
                .on("click", clicked)
            .attr("class", "covid-line")
            .attr("opacity", defaultOpacity)
            .attr("id", function(d){ return "path-" + d.state; })
            .attr("fill", "none")
            .attr("stroke", defaultColor)
            .attr("stroke-width", 0.5)
            .attr("d", function(d){ return line(d.values)})

    }
    
    function draw_orders(){
        //Draws the orders
        // TO DO add different shapes based on what type of order it is


        // orders = orderGroup.selectAll("circle")
        //     .data(ordersList, d => d.state)

        // orders
        //     .attr("cx", function(d){ return x(d.positive); })
        //     .attr('cy', function(d){ return y(d.binnedPositiveIncrease); })

        // orders.enter()
        //     .append('circle')
        //     .attr("class", "order-circle")
        //     .attr("id", function(d){ return "order-circ-" + d.state; })
        //     .attr("fill", defaultColor)
        //     .attr('r', orderR)
        //     .attr("cx", function(d){ return x(d.positive); })
        //     .attr('cy', function(d){ return y(d.binnedPositiveIncrease); })
        //     .attr("opacity", 0)

        circles = orderGroup.selectAll("circle")
            .data(lockdownMarkers, d=> d.state)

        circles.exit().remove();

        circles
            .attr("cx", function(d){ return x(d.positive); })
            .attr('cy', function(d){ return y(d.binnedPositiveIncrease); })

        circles.enter()
            .append("circle")
            .attr("class", "lockdown-circle")
            .attr("id", function(d){ return "mark-lockdown-circ-" + d.state; })
            .attr("fill", defaultColor)
            .attr("r", orderR)
            .attr("cx", function(d){ return x(d.positive); })
            .attr("cy", function(d){ return y(d.binnedPositiveIncrease); })
            .attr("opacity", 0)


        
        rects = orderGroup.selectAll("rect")
            .data(reopenMarkers, d=> d.state)

        rects.exit().remove()

        rects
            .attr("x", function(d){ return x(d.positive) - orderR; })
            .attr("y", function(d){ return y(d.binnedPositiveIncrease) - orderR; })

        rects.enter()
            .append("rect")
            .attr("class", "reopen-rect")
            .attr("id", function(d){ return "mark-reopen-rect-" + d.state; })
            .attr("fill", defaultColor)
            .attr("width", orderR *2)
            .attr("height", orderR *2)
            .attr("x", function(d){ return x(d.positive) - orderR; })
            .attr("y", function(d){ return y(d.binnedPositiveIncrease) - orderR; })
            .attr("opacity", 0)



    }
    
    function get_lines_data(){
        //Parses the data to build the lines based on format 
        // TODO, give this selection criteria based on desired chart type

        historicalByState = d3.nest()
            .key(function(d){ return d.state; })
            .entries(historicalData)

        historicalByState = historicalByState.filter(function(d){ return d.key != "MP" && d.key != "AS"; })

        lockdowns = []
        reopens = []
        historicalByState.forEach(function(d){
            d.state = d.key;
            delete d.key
            var window = []

            tmp1 = stateOrders[d.state].lockdown
            tmp1.forEach(function(v){ v.state = d.state; })
            lockdowns.push(tmp1)
            
            tmp2 = stateOrders[d.state].reopen
            tmp2.forEach(function(k){ k.state = d.state; })
            reopens.push(tmp2)

            for (var i=d.values.length -1; i>=0; --i){
                window.push(d.values[i].positiveIncrease)
                if( window.length > 7){
                    window.shift()
                }
                var total = (window.length == 1 ? window[0] : d3.sum(window))
                d.values[i]['binnedPositiveIncrease'] = total
            }
        })



        lockdowns.forEach(function(d){
            d.forEach(function(v){
                if (v.date != ""){
                    tmp = historicalByState.filter(function(k){ return v.state == k.state})[0].values
                    tmp.forEach(function(j){
                        if (formatTime(j.date) == v.date){
                            lockdownMarkers.push(j)
                        }
                    })
                }
            })
        })

        reopens.forEach(function(d){
            d.forEach(function(v){
                if (v.date != ""){
                    tmp = historicalByState.filter(function(k){ return v.state == k.state})[0].values
                    tmp.forEach(function(j){
                        if (formatTime(j.date) == v.date){
                            reopenMarkers.push(j)
                        }
                    })
                }
            })
        })
            
        data_list = []
        stayHomeDots = []

        const entries = Object.entries(data);
        for (const [key, val] of entries){
            data_list.push(val)

            if (anno[abbrev2full[key]].date != null){
                stayHomeDots.push({
                    'x': anno[abbrev2full[key]].positive,
                    'y': anno[abbrev2full[key]].binnedPositiveIncrease,
                    'state': key
                })
            }
        }

        var maxY = d3.max(data_list, function(d){ 
            return d3.max(d, function(v){
                return v.binnedPositiveIncrease
            })
        })

        var maxX = d3.max(data_list, function(d){ 
            return d3.max(d, function(v){
                return v.positive
            })
        })
        xLinear.domain([0, maxX])
        yLinear.domain([0, maxY])
    }

    function mousemove (d){
    }
    
    function add2Focus(d, i){
        //Adds element to the focus if not already there
        if (!focus.includes(d)){
            focus.push(d)

            d3.select("#path-" + d)
                .raise()
                .attr("stroke", "#fff")
                .attr("opacity", 1)
                .attr("stroke-width", 8.5)
                .transition().duration(dur)
                .attr("stroke-width", 3.5)
                .attr("stroke", color(cur_color))

            d3.select("#mark-lockdown-circ-" + d)
                .raise()
                .attr("opacity", 1)
                .attr("r", 30)
                .attr("fill", "#fff")
                .transition().duration(dur)
                .attr("fill", color(cur_color))
                .attr("r", orderR)

            d3.select("#mark-reopen-rect-" + d)
                .raise()
                .attr("opacity", 1)
                .attr("fill", "#fff")
                .transition().duration(dur)
                .attr("fill", color(cur_color))

            cur_color += 1;
        } 
    }

    function mouseover (d,i){
        document.body.style.cursor = "pointer"
        update_highlight(d.state, "on")
    }
    
    function clicked(d, i){
        //Adds or removes element from the 'focus'
        if (focus.includes(d.state)) update_focus(d.state, "remove")
        else update_focus(d.state, "add")
    }

    function removeFromFocus(d, i){
        // Sets state back to default view
        if (focus.includes(d)){
            const index = focus.indexOf(d);
            focus.splice(index, 1);
        }

        d3.select("#path-" + d)
            .transition().duration(dur)
            .attr("stroke", defaultColor)
            .attr("stroke-width", 0.5)
            .attr("opacity", defaultOpacity * 2)

        d3.select("#mark-lockdown-circ-" + d)
            .transition().duration(dur)
            .attr("opacity", 0)

    }


    function display_hover(d, action){
        //Adds hover display states to selection
        if (!focus.includes(d)){
            d3.select("#path-" + d)
                .raise()
                //.attr("stroke", function(){ return (action == "on" ? "steelblue" : defaultColor); })
                .attr("stroke-width", function(){ return (action == "on" ? 3 : 0.5 ); })
                .attr("opacity", function(){ return (action == "on" ? 1 : defaultOpacity * 2); })

            d3.select("#mark-lockdown-circ-" + d)
                .raise()
                .attr("opacity", function(){ return (action == "on" ? 1 : 0); })

            d3.select("#mark-reopen-rect-" + d)
                .raise()
                .attr("opacity", function(){ return (action == "on" ? 1 : 0); })
        }
    }

    function mouseout (d, i){
        document.body.style.cursor = "default"
        update_highlight(d.state, "off")
    }
    

    function formatAxes(){
        //Rescale the axes based on linear or log selection
        if (axesSelector == "log"){
            x = xLog;
            y = yLog;

            x_axis.scale(x).ticks(8, ",.1d")
            y_axis.scale(y).ticks(6, ",.1d")

            xAxisCall.call(x_axis)
            yAxisCall.call(y_axis)
        } else if (axesSelector == "linear"){
            x = xLinear;
            y = yLinear;

            x_axis.scale(x).tickFormat(null)
            y_axis.scale(y).ticks(6).tickFormat(null)

            xAxisCall.call(x_axis)
            yAxisCall.call(y_axis)

        }
        
        draw_orders();
        draw_paths();
    }

    // Getters & Setters for vis

    lineChart.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return lineChart;
    }

    lineChart.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return lineChart;
    }

    lineChart.chartData = function(value){
        if(!arguments.length) return chartData;
        chartData = value;
        return lineChart;
    }

    lineChart.anno = function(value){
        if(!arguments.length) return anno;
        anno = value;
        return stateChart
    }

    lineChart.data_list = function(value){
        if(!arguments.length) return data_list;
        data_list = value;
        return lineChart;
    }

    lineChart.stayHomeDots = function(value){
        if(!arguments.length) return stayHomeDots;
        stayHomeDots = value;
        return lineChart;       
    }

    lineChart.colors = function(value){
        if(!arguments.length) return colors;
        colors = value;
        return lineChart;       
    }

    lineChart.curTime = function(value){
        if(!arguments.length) return curTime;
        curTime = value;
        update_display_data();
        return lineChart;   
    }

    lineChart.x = function(value){
        if(!arguments.length) return x;
        x = value;
        return lineChart;
    }

    lineChart.y = function(value){
        if(!arguments.length) return y;
        y = value;
        return lineChart;
    }

    lineChart.display_states = function(value){
        if(!arguments.length) return display_states;
        display_states = value;
        update_display_data();
        return lineChart;
    }

    lineChart.focus = function(value){
        if(!arguments.length) return focus;
        focus = value;
        highlight_focus();
        return lineChart;
    }


    lineChart.axesSelector = function(value){
        if(!arguments.length) return axesSelector;
        axesSelector = value;
        formatAxes();
        return lineChart;
    }

    lineChart.highlight = function(value, action){
        if(!arguments.length) return highlight;
        highlight = value;
        display_hover(value, action);
        return lineChart;
    }  

    lineChart.addFocus = function(value, action){
        if(!arguments.length) return addFocus;
        if (action == "add") add2Focus(value)
        else if (action == "remove") removeFromFocus(value)
        return lineChart;
    }

    return lineChart;
}


