function states_chart(config){
    var margin = { left:120, right:60, top:30, bottom:80 }
    let data_list;
    var anno = config.anno;
    var abbrev2full = config.abbrev2full,
        ordersList = config.orderByState;
    
    var focus = [],
        axesSelector = "log";

    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    
    // append the svg object to the body of the page
    var svg = d3.select("#chart-area")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var orderGroup = svg.append("g")
        .attr("class", "all-orders")
    
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
    

    var x = xLog;
    var y = yLog;
    
    $("#chart-help")
        .click(function(){
            $("#logChartModal").modal();
        })
        .mouseover(function(){
            $("#chart-help-icon").css("color", "yellow").css("opacity", 1)
        })
        .mouseout(function(){
            $("#chart-help-icon").css("color", "lightsteelblue").css("opacity", 0.5)
        })

    var color = d3.scaleOrdinal(d3.schemeDark2);
    var cur_color = 0;
    
    // var x_axis = d3.axisBottom(x).ticks(10, ",.1d")
    // var y_axis = d3.axisLeft(y).ticks(8, ",.1d")

    var x_axis = d3.axisBottom().tickPadding(8);
    var y_axis = d3.axisLeft().tickPadding(8);
    
    var labels = svg.append('g')
        .attr("class", "labels")

    xAxisCall = labels.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axis axis--x axisWhite")
        // .call(x_axis);
    
    // svg.append("rect")
    //     .attr("class", "outline-rect")
    //     .attr("x", 0)
    //     .attr("y", 0)
    //     .attr("height", height)
    //     .attr("width", width)
    //     .attr("fill", "none")


    yAxisCall = labels.append("g")
        .attr("class", "axis axis--y axisWhite")
        // .call(y_axis)
    
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
    
    dots = svg.append('g')
    circ = svg.append('g')
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
        //.curve(d3.curveBasis)
        .curve(d3.curveCardinal.tension(0.5))
    
    function statesChart(){
        draw_chart();
    }

    function draw_chart(data){
        get_lines_data();
        formatAxes();
    }
    
    function draw_paths(){
        lines = svg.selectAll(".line")
            .data(data_list, function(d){ return d[0].state })

    
        lines.exit().remove()
    
        lines
            .attr("fill", "none")
            .attr("opacity", 1)
            .attr("stroke", 'grey')
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.5)
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
        orders = orderGroup.selectAll("circle")
            .data(ordersList)

        orders.enter()
            .append('circle')
            .attr("class", "order-circle")
            .attr("id", function(d){ return "order-circ-" + d.state; })
            .attr("fill", "#fff")
            .attr('r', 12)
            .attr("cx", function(d){ return x(d.positive); })
            .attr('cy', function(d){ return y(d.binnedPositiveIncrease); })
            .attr("opacity", 0)

    }
    
    function get_lines_data(){
        data_list = []
        stayHomeDots = []
        text_locations = []
        line_labels = []

        const entries = Object.entries(data_by_states);
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
        //console.log('mousemove', d3.event)
    }
    
    function add2Focus(d, i){
        if (!focus.includes(d)){
            focus.push(d)
            d3.select("#path-" + d)
                .attr("stroke", "#fff")
                .attr("opacity", 1)
                .attr("stroke-width", 8.5)
                .transition().duration(750)
                .attr("stroke-width", 2.5)
                .attr("stroke", color(cur_color))

            d3.select("#order-circ-" + d)
                .attr("opacity", 1)
                .attr("r", 30)
                .attr("fill", "#fff")
                .transition().duration(750)
                .attr("fill", color(cur_color))
                .attr("r", 12)

            cur_color += 1;
        } 
        //highlight_focus();
        //update_vis(focus);
    }

    function mouseover (d,i){
        document.body.style.cursor = "pointer"
        update_highlight(d[0].state, "on")
    }
    
    function clicked(d, i){
        console.log("clicking", d[0].state)
        if (focus.includes(d[0].state)) update_focus(d[0].state, "remove")
        else update_focus(d[0].state, "add")
    }

    function removeFromFocus(d, i){
        if (focus.includes(d)){
            const index = focus.indexOf(d);
            focus.splice(index, 1);
        }

        d3.select("path-" + d)
            .attr("stroke", "grey")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.20)

        d3.select("#order-circ-" + d)
            .attr("opacity", 0)

    }


    function display_hover(d, action){
        if (!focus.includes(d)){
            d3.select("#path-" + d)
                .attr("stroke", function(){ return (action == "on" ? "steelblue" : "grey"); })
                .attr("stroke-width", function(){ return (action == "on" ? 3 : 0.5 ); })
                .attr("opacity", function(){ return (action == "on" ? 1 : 0.5); })

            d3.select("#order-circ-" + d)
                .attr("fill", function(){ return (action == "on" ? "steelblue" : "grey"); })
                .attr("opacity", function(){ return (action == "on" ? 1 : 0); })
        }
    }

    function mouseout (d, i){

        document.body.style.cursor = "default"
        update_highlight(d[0].state, "off")
    }
    
    function formatAxes(){
        if (axesSelector == "log"){
            x = xLog;
            y = yLog;

            x_axis.scale(x).ticks(10, ",.1d")
            y_axis.scale(y).ticks(8, ",.1d")


            // var x_axis = d3.axisBottom(x)
            // var y_axis = d3.axisLeft(y)

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

    statesChart.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return statesChart;
    }

    statesChart.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return statesChart;
    }

    statesChart.chartData = function(value){
        if(!arguments.length) return chartData;
        chartData = value;
        return statesChart;
    }

    statesChart.anno = function(value){
        if(!arguments.length) return anno;
        anno = value;
        return stateChart
    }

    statesChart.data_list = function(value){
        if(!arguments.length) return data_list;
        data_list = value;
        return statesChart;
    }

    statesChart.stayHomeDots = function(value){
        if(!arguments.length) return stayHomeDots;
        stayHomeDots = value;
        return statesChart;       
    }

    statesChart.colors = function(value){
        if(!arguments.length) return colors;
        colors = value;
        return statesChart;       
    }

    statesChart.curTime = function(value){
        if(!arguments.length) return curTime;
        curTime = value;
        update_display_data();
        return statesChart;   
    }

    statesChart.x = function(value){
        if(!arguments.length) return x;
        x = value;
        return statesChart;
    }

    statesChart.y = function(value){
        if(!arguments.length) return y;
        y = value;
        return statesChart;
    }

    statesChart.display_states = function(value){
        if(!arguments.length) return display_states;
        display_states = value;
        update_display_data();
        return statesChart;
    }

    statesChart.focus = function(value){
        if(!arguments.length) return focus;
        focus = value;
        highlight_focus();
        return statesChart;
    }


    statesChart.axesSelector = function(value){
        if(!arguments.length) return axesSelector;
        axesSelector = value;
        formatAxes();
        return statesChart;
    }

    statesChart.highlight = function(value, action){
        if(!arguments.length) return highlight;
        highlight = value;
        display_hover(value, action);
        return statesChart;
    }  

    statesChart.addFocus = function(value, action){
        if(!arguments.length) return addFocus;
        if (action == "add") add2Focus(value)
        else if (action == "remove") removeFromFocus(value)
        return statesChart;
    }

    return statesChart;
}


