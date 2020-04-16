function test_chart(config){
    var margin = { left:120, right:10, top:50, bottom:80 }
    let data_list;
    var anno = config.anno;
    var abbrev2full = config.abbrev2full;

    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    
    // append the svg object to the body of the page
    var svg = d3.select("#chart-area")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    
    var x = d3.scaleLog()
        .domain([1, 1000000])
        .range([0,width])
          
    var y = d3.scaleLog()
        .domain([1, 100000])
        .range([height, 0])
    
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    
    var x_axis = d3.axisBottom(x).ticks(10, ",.1d")
    var y_axis = d3.axisLeft(y).ticks(8, ",.1d")
    
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axis axis--x axisWhite")
        .call(x_axis);
    
    svg.append("g")
        .attr("class", "axis axis--y axisWhite")
        .call(y_axis)
    
    svg.append("text")
        .attr("class", "axis-text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - 90)
        .attr("x", 0 - (height/2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("font-size", "2rem")
        .text("New Confirmed Cases (in the Past Week)")
    
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
        draw_paths()
        draw_stay_home_dots();
        draw_leading_dots();
        draw_annotations(line_labels, 'line');
    }
    
    function draw_paths(){
        lines = svg.selectAll(".line")
            .data(data_list, function(d){ return d[0].state })
                .on("mousemove", moved)
                .on("mouseenter", entered)
                .on("mouseleave", leave)
                .on("click", entered)
    
        lines.exit().remove()
    
        lines
            .attr("fill", "none")
            .attr("id", function(d){
                "path_" + d.state; 
            })
            .attr("opacity", 1)
            .attr("stroke", function(d,i){ return color(i); })
            .attr("stroke-width", 3)
            .attr("d", function(d){ return line(d); });
    
        lines.enter()
            .append("path")
                .attr("class", "line")
                .attr("opacity", 1)
                .attr("id", function(d){
                    "path_" + d.state; 
                })
                .attr("fill", "none")
                .attr("stroke", function(d,i){ return color(i); })
                .attr("stroke-width", 3)
                .attr("d", function(d){ return line(d) });
    
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
            .attr("opacity", 1)
            .style('fill', function(d,i){ return colors[d.state]; })
            .attr('cx', function(d){ return x((d.x == 0 ? 1 : d.x))})
            .attr("cy", function(d){ return y((d.y == 0 ? 1 : d.y))})
            .attr("r",40)
            .transition().duration(750)
                .attr("r", 8.5)
    }

    function draw_leading_dots(){
        circles = circ.selectAll("circle")
            .data(text_locations, function(d){ return d.state})
    
        circles.exit().remove()
    
        circles
            .style('fill', function(d,i){ return color(i)})
            .attr('cx', function(d){ return x((d.positive == 0 ? 1 : d.positive))})
            .attr("cy", function(d){ return y((d.binnedPositiveIncrease == 0 ? 1 : d.binnedPositiveIncrease))})
            .attr("r", 3)
    
        circles.enter()
            .append("circle")
            .style('fill', function(d,i){ return color(i)})
            .attr('cx', function(d){ return x((d.positive == 0 ? 1 : d.positive))})
            .attr("cy", function(d){ return y((d.binnedPositiveIncrease == 0 ? 1 : d.binnedPositiveIncrease))})
            .attr("r", 3)
    }

    function update_display_data(){
        data_list = []
        stayHomeDots = []
        text_locations = []
        line_labels = []

        display_states.forEach(function(d, i){
            var res = data_by_states[d].filter(function(v){
                return v.date < curTime;
            })
            if (res.length != 0){
                data_list.push(res)
            }

            if (anno[abbrev2full[d]].date <= curTime && anno[abbrev2full[d]].date != null ){
                stayHomeDots.push({
                    'x': anno[abbrev2full[d]].positive,
                    'y': anno[abbrev2full[d]].binnedPositiveIncrease,
                    'state': d
                })
            }
            
        })
        data_list.forEach(function(d, i){
            var tmp = anno[abbrev2full[d[0].state]]['line_label']
            tmp['x'] = x((d[0].positive == 0 ? 1 : d[0].positive))
            tmp['y'] = y(d[0].binnedPositiveIncrease == 0 ? 1 : d[0].binnedPositiveIncrease)
            tmp['color'] = color(i)

            text_locations.push(d[0])
            line_labels.push(tmp)
        })
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
    
    function entered (d,i){
        svg.selectAll(".line")
            .attr("stroke", "#e0e0e0")
            .attr("opacity", function(v,j){
                return (j == i ? 1 : 0.5)
            })
            .attr("stroke-width", 1)
    
        dots.selectAll("circle")
            .style("fill", function(v,j){
                return (j == i ? color(i) : '#e0e0e0')
            })
            .attr("opacity", function(v,j){
                return (j == i ? 1 : 0.5)
            })
            .attr("r", 3)
    
        circ.selectAll("circle")
            .style("fill", function(v,j){
                return (j == i ? color(i) : '#e0e0e0')
            })
            .attr("opacity", function(v,j){
                return (j == i ? 1 : 0.5)
            })
        
        d3.select(this)
            .attr("stroke-width", 6.5)
            .attr("stroke", color(i))
    
        if (anno[abbrev2full[d[0].state]].date <= curTime){
            tmp = anno[abbrev2full[d[0].state]].annotation
            tmp.color = color(i)
            draw_annotations([tmp], 'dot')
        }
    
        var tmp = anno[abbrev2full[d[0].state]]['line_label']
            tmp['x'] = x((d[0].positive == 0 ? 1 : d[0].positive))
            tmp['y'] = y(d[0].binnedPositiveIncrease == 0 ? 1 : d[0].binnedPositiveIncrease)
            tmp['color'] = color(i)
    
        draw_annotations([tmp], 'line')

    
    }   
    
    function leave (){
        draw_leading_dots();
        draw_paths();
        draw_stay_home_dots();
        draw_annotations(line_labels, 'line')
        draw_annotations([], 'dot')
    
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
        if(!arguments.length) return this.display_states;
        display_states = value;
        update_display_data();
        return statesChart;
    }

    return statesChart;
}


