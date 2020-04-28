function line_chart(config){
    var margin = { left:120, right:60, top:30, bottom:80 }
    let data_list;
    var anno = config.anno;
    var abbrev2full = config.abbrev2full,
        ordersList = config.orderByState,
        dur = config.duration,
        data = config.state_data;

    var color = d3.scaleOrdinal(d3.schemeDark2);
    var cur_color = 0;   
    var focus = [],
        axesSelector = "log";

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
        .domain([1, 1000000])
        .range([0,width])

    var yLog = d3.scaleLog()
        .domain([1, 100000])
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
            var val = (d.positive == 0 ? 1 : d.positive)
            return x(val); })
        .y(function(d){
            if (d.binnedPositiveIncrease < 1){
                d.binnedPositiveIncrease = 1
            }
            var val = (d.binnedPositiveIncrease == 0 ? 1 : d.binnedPositiveIncrease)
            return y(val)
        })
        .curve(d3.curveCardinal.tension(0.5))
    
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
            .data(data_list, function(d){ return d[0].state })

    
        lines.exit().remove()
    
        lines
            .attr("d", function(d){ return line(d); });
    
        lines.enter()
            .append("path")
                .attr("class", "covid-line")
                .attr("opacity", 1)
                .attr("id", function(d){
                    return "path-" + d[0].state; 
                })
                .attr("fill", "none")
                .attr("stroke", 'grey')
                .attr("stroke-width", 0.5)
                .attr("opacity", 0.20)
                .attr("d", function(d){ return line(d) });

        d3.selectAll(".covid-line")
            .on("mousemove", mousemove)
            .on("mouseenter", mouseover)
            .on("mouseout", mouseout)
            .on("click", clicked)
    }
    
    function draw_orders(){
        //Draws the orders
        // TO DO add different shapes based on what type of order it is
        orders = orderGroup.selectAll("circle")
            .data(ordersList, d => d.state)

        orders
            .attr("cx", function(d){ return x(d.positive); })
            .attr('cy', function(d){ return y(d.binnedPositiveIncrease); })

        orders.enter()
            .append('circle')
            .attr("class", "order-circle")
            .attr("id", function(d){ return "order-circ-" + d.state; })
            .attr("fill", "#fff")
            .attr('r', 10)
            .attr("cx", function(d){ return x(d.positive); })
            .attr('cy', function(d){ return y(d.binnedPositiveIncrease); })
            .attr("opacity", 0)

    }
    
    function get_lines_data(){
        //Parses the data to build the lines based on format 
        // TODO, give this selection criteria based on desired chart type
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

            d3.select("#order-circ-" + d)
                .raise()
                .attr("opacity", 1)
                .attr("r", 30)
                .attr("fill", "#fff")
                .transition().duration(dur)
                .attr("fill", color(cur_color))
                .attr("r", 10)

            d3.select("#path-" + d)
                .raise()
                .attr("stroke", "#fff")
                .attr("opacity", 1)
                .attr("stroke-width", 8.5)
                .transition().duration(dur)
                .attr("stroke-width", 2.5)
                .attr("stroke", color(cur_color))

            cur_color += 1;
        } 
    }

    function mouseover (d,i){
        document.body.style.cursor = "pointer"
        update_highlight(d[0].state, "on")
    }
    
    function clicked(d, i){
        //Adds or removes element from the 'focus'
        if (focus.includes(d[0].state)) update_focus(d[0].state, "remove")
        else update_focus(d[0].state, "add")
    }

    function removeFromFocus(d, i){
        // Sets state back to default view
        if (focus.includes(d)){
            const index = focus.indexOf(d);
            focus.splice(index, 1);
        }

        d3.select("path-" + d)
            .transition().duration(dur)
            .attr("stroke", "grey")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.20)

        d3.select("#order-circ-" + d)
            .transition().duration(dur)
            .attr("opacity", 0)

    }


    function display_hover(d, action){
        //Adds hover display states to selection
        if (!focus.includes(d)){
            d3.select("#path-" + d)
                .raise()
                .attr("stroke", function(){ return (action == "on" ? "steelblue" : "grey"); })
                .attr("stroke-width", function(){ return (action == "on" ? 3 : 0.5 ); })
                .attr("opacity", function(){ return (action == "on" ? 1 : 0.5); })

            d3.select("#order-circ-" + d)
                .raise()    
                .attr("fill", function(){ return (action == "on" ? "steelblue" : "grey"); })
                .attr("opacity", function(){ return (action == "on" ? 1 : 0); })
        }
    }

    function mouseout (d, i){
        document.body.style.cursor = "default"
        update_highlight(d[0].state, "off")
    }
    

    function formatAxes(){
        //Rescale the axes based on linear or log selection
        if (axesSelector == "log"){
            x = xLog;
            y = yLog;

            x_axis.scale(x).ticks(10, ",.1d")
            y_axis.scale(y).ticks(8, ",.1d")

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
        draw_paths();
        draw_orders();
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


