function states_chart(config){
    var margin = { left:120, right:100, top:30, bottom:60 }
    let data_list;
    var anno = config.anno;
    var abbrev2full = config.abbrev2full;

    
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
    
    var color = d3.scaleOrdinal(d3.schemeDark2);
    
    // var x_axis = d3.axisBottom(x).ticks(10, ",.1d")
    // var y_axis = d3.axisLeft(y).ticks(8, ",.1d")

    var x_axis = d3.axisBottom();
    var y_axis = d3.axisLeft();
    
    var labels = svg.append('g')
        .attr("class", "labels")


    xAxisCall = labels.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axis axis--x axisWhite")
        // .call(x_axis);
    
    yAxisCall = labels.append("g")
        .attr("class", "axis axis--y axisWhite")
        // .call(y_axis)
    
    svg.append("text")
        .attr("class", "axis-text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - 100)
        .attr("x", 0 - (height/2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("font-size", "2rem")
        .text("New Confirmed Cases (in past week)")
    
    svg.append("text")
        .attr("class", "axis-text")
        .attr("transform", "translate(0," + height + ")")
        .attr("y", margin.bottom/2)
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
    
    var makeAnnotations = d3.annotation()
        .type(d3.annotationLabel)
    
    var line_annotations = d3.annotation()
        .type(d3.annotationLabel)
    
    d3.select("svg")
        .append("g")
            .attr("class", "annotation-group")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(makeAnnotations)
    d3.select("svg")
        .append("g")
            .attr("class", "line-labels")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(line_annotations)
    

    function statesChart(){
        draw_chart();
    }

    function draw_chart(data){
        get_lines_data();
        formatAxes();
        //draw_paths()
        //draw_stay_home_dots();
        //draw_leading_dots();
        //draw_annotations(line_labels, 'line');
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
            .on("mousemove", moved)
            .on("mouseenter", entered)
            .on("mouseleave", leave)
            .on("click", clicked)
    }
    
    function draw_stay_home_dots(){
        dot = dots.selectAll("circle")
            .data(stayHomeDots, function(d){ return d.state})
    
        dot.exit().remove()
    
        dot
            .style('fill', function(d,i){ return colors[d.state]; })
            .attr("opacity", 1)
            .attr('cx', function(d){ return x((d.x == 0 ? 1 : d.x))})
            .attr("cy", function(d){ return y((d.y == 0 ? 1 : d.y))})
            .attr("r", 8.5)
    
        dot.enter()
            .append("circle")
            .attr("class", "stayHomeDot")
            .attr("id", "stayHome-" + d.state)
            .attr("opacity", 1)
            .style('fill', function(d,i){ return colors[d.state]; })
            .attr('cx', function(d){ return x((d.x == 0 ? 1 : d.x))})
            .attr("cy", function(d){ return y((d.y == 0 ? 1 : d.y))})
            .attr("r",40)
            .transition().duration(750)
                .attr("r", 8.5)
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

    function draw_annotations(anno, type){
        if (type == 'line'){
            line_annotations
                .type(d3.annotationLabel)
                .annotations(anno)
        } else  if (type == 'dot'){
            makeAnnotations
                .type(d3.annotationCallout)
                .annotations(anno)
        }
    }

    function moved (d){
        //console.log('moved', d3.event)
    }
    

    function highlight_focus(){
        var tmp = []

        d3.selectAll(".covid-line")
            .attr("opacity", 0.5)
            .attr("stroke-width", 0.5)
            .attr("stroke", "grey")
            .attr("opacity", 0.20)

        focus.forEach(function(d, i){
            d3.select("#path-" + d)
                .attr("stroke-width", 2.5)
                .attr("stroke", function(d){ return color(i); })
                .attr("opacity", 1)

            var a = anno[abbrev2full[d]].annotation
            a.color = color(i)
            a.disable = ['note']
            tmp.push(a)
        })
        draw_annotations(tmp, 'dot')
    }

    function add2Focus(d, i){
        if (!focus.includes(d)) focus.push(d)
        //highlight_focus();
        update_vis(focus);
    }

    function entered (d,i){
        if (!focus.includes(d[0].state)){
            d3.select("#path-" + d[0].state)
                .attr("stroke", "steelblue")
                .attr("opacity", 1)
                .attr("stroke-width", 3)
        }
    }
    
    function clicked(d, i){
        if (focus.includes(d[0].state)) removeFromFocus(d[0].state, i)
        else add2Focus(d[0].state,i)
    }

    function removeFromFocus(d, i){
        var tmp = [];
        if (focus.includes(d)){
            const index = focus.indexOf(d);
            focus.splice(index, 1);
        }

        d3.select("path-" + d)
            .attr("stroke", "grey")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.20)


        focus.forEach(function(d){
            var a = anno[abbrev2full[d]].annotation
            a.color = 'yellow'
            tmp.push(a)
        })
        draw_annotations(tmp, 'dot')
        update_vis(focus);
    }

    function leave (d, i){
        if (!focus.includes(d[0].state)){
            d3.select("#path-" + d[0].state)
                .attr("stroke", "grey")
                .attr("stroke-width", 0.5)
                .attr("opacity", 0.20)
        }

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
        console.log("changing axes")
        formatAxes();
        return statesChart;
    }

    return statesChart;
}


