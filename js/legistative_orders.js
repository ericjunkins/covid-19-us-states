function legistate_chart(config){
    var margin = { left:120, right:100, top:50, bottom:120 },
        chartData = config.data

    var focus = [];

    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    
    // append the svg object to the body of the page
    var svg = d3.select("#chart-area")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    


    var dates = d3.timeParse("%m/%d/%y");
    var ext = d3.extent(chartData, function(d){ return d.key; })
    var min_date = dates(ext[0]),
        max_date = dates(ext[1])
    
    Date.prototype.addDays = function(days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }
    
    function getDates(startDate, stopDate) {
        var dateArray = new Array();
        var currentDate = startDate;
        while (currentDate <= stopDate) {
            dateArray.push(new Date (currentDate));
            currentDate = currentDate.addDays(1);
        }
        return dateArray;
    }

    var m = d3.max(chartData, function(d){
        return d.values.length;
    })

    var dateArray = getDates(min_date, max_date)
    var dateArrayStrings = [];

    dateArray.forEach(function(d){
        dateArrayStrings.push(formatTime(d));
    })

    var x = d3.scaleBand()
        .domain(dateArrayStrings)
        .range([0,width])

    var s = [];
    for (var i=0; i < m; ++i){
        s.push(String(i + 1));
    }
    
    var y = d3.scaleBand()
        .domain(s)
        .range([height, 0])
        //.padding(0.02)

    var color = d3.scaleOrdinal(d3.schemeDark2);
    
    var x_axis = d3.axisBottom(x)
    var y_axis = d3.axisLeft(y)

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axis axis--x")
        .call(x_axis);
    
    // svg.append("g")
    //     .attr("class", "axis axis--y axisWhite")
    //     .call(y_axis)


    function legistateChart(){
        draw_chart();
    }

    function draw_chart(){
        var data = []
        chartData.forEach(function(d){
            d.values.forEach(function(v, i){
                data.push({
                    'state': v.state,
                    'date':  v.date,
                    'count': String(i+1)
                })
            })
        })

        var rects = svg.selectAll("rect")
            .data(data)


        var w = width/chartData.length * 0.8
        rects.enter()
            .append('rect')
            .attr("class", "legis-rect")
            .attr("id", function(d){
                return "rect-" + d.state;
            })
            .attr("x", function(d){
                return x(d.date); })
            .attr("y", function(d){ return y(d.count); })
            .attr("width", w)
            .attr("height", y.bandwidth())
            .attr("fill", "grey")
            .attr("opacity", 0.20)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout)
                .on("click", clicked)

        var texts = svg.selectAll("text")
            .data(data, function(d){ return d.state})


        texts.enter()
            .append("text")
            .attr("class", "legis-text")
            .attr("id", function(d){ return "legis-text-" + d.state })
            .attr("x", function(d){ return x(d.date) + w/2; })
            .attr("y", function(d){ return y(d.count) + y.bandwidth()/2; })
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", "#fff")
            .attr("font-size", "2rem")
            .text(function(d){ return d.state; })
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout)
                .on("click", clicked)

    }
    
    function mouseover(d){

    }

    function mousemove(d){
        if (!focus.includes(d.state)){
            d3.select("#rect-" + d.state)
                .attr("stroke", "steelblue")
                .attr("stroke-width", "4px")
                .attr("opacity", 1)
        }
    }

    function mouseout(d){
        if (!focus.includes(d.state)){
            d3.select("#rect-" + d.state)
                .attr("stroke-width", "0px")
                .attr("opacity", 0.20)
                
        }
    }

    function clicked(d){
        if (focus.includes(d.state)) removeFromFocus(d.state, i)
        else add2Focus(d.state,i)
    }
  
    function add2Focus(d, i){
        if (!focus.includes(d)) focus.push(d)
        update_vis(focus);
    }

    function removeFromFocus(d, i){
        if (focus.includes(d)){
            const index = focus.indexOf(d);
            focus.splice(index, 1);
        }

        d3.select("#rect-" + d)
            .attr("stroke-width", "0")

        update_vis(focus);
    }

    function highlight_focus(){

        d3.selectAll(".legis-rect")
            .attr('stroke-width', "0")
            .attr("fill", "grey")
            .attr("opacity", 0.20)

        focus.forEach(function(d, i){
            d3.select("#rect-" + d)
                .attr("fill", function(d){
                    return color(i)
                })
                .attr("opacity", "1")
        })

    }

    legistateChart.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return legistateChart;
    }

    legistateChart.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return legistateChart;
    }

    legistateChart.x = function(value){
        if(!arguments.length) return x;
        x = value;
        return legistateChart;
    }

    legistateChart.y = function(value){
        if(!arguments.length) return y;
        y = value;
        return legistateChart;
    }

    legistateChart.display_states = function(value){
        if(!arguments.length) return display_states;
        display_states = value;
        update_display_data();
        return legistateChart;
    }

    legistateChart.focus = function(value){
        if(!arguments.length) return focus;
        focus = value;
        highlight_focus();
        return legistateChart;
    }
    return legistateChart;
}


