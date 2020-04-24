function legistate_chart(config){
    var margin = { left:120, right:100, top:50, bottom:60 },
        chartData = config.data,
        markerData = config.marker;

    var focus = [],
        focus_markers = [];

    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    
    // append the svg object to the body of the page
    var svg = d3.select("#legis-chart")
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
    
    var today = new Date();

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

    var dateArray = getDates(min_date, today)
    var dateArrayStrings = [];

    dateArray.forEach(function(d){
        dateArrayStrings.push(formatTime(d));
    })



    var x = d3.scaleBand()
        .domain(dateArrayStrings)
        .range([0,width])

    
    var y1 = d3.scaleLinear()
        .range([height, height/2 + height * 0.05])

    var y1band = d3.scaleBand()
        .range([height, height/2 + height * 0.05])

    var y2 = d3.scaleLinear()
        .domain([0,1])
        .range([height/2 - height * 0.05, 0])


    var color = d3.scaleOrdinal(d3.schemeDark2);
    
    var x_axis = d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ return !(i%2)}));
    var x_axis2 = d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ return }));
    var legis_y_axis = d3.axisLeft()
    var legis_y_axis2 = d3.axisLeft()

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axis axis--x")
        .call(x_axis);

    svg.append("g")
        .attr("transform", "translate(0," +(height/2 - height * 0.05)+ ")")
        .attr("class", "axis axis--x")
        .call(x_axis2);

    svg.append("line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", height/2 + height * 0.05)
        .attr("y2", height/2 - height * 0.05)
        .attr("stroke", "#fff")
        .attr("stroke-width", "1px")
    
    legisYaxisCall1 = svg.append("g")
        .attr("class", "axis axis--y axisWhite")
        
    legisYaxisCall2 = svg.append("g")
        .attr("class", "axis axis--y axisWhite")

    var labels = svg.append("g")
        .attr("class", "legis-labels")

    labels.append("text")
        .attr("x", -height * 0.75)
        .attr("class", "axis-label")
        .attr("y", - 45)
        .attr("transform", "rotate(-90)")
        .text("Lockdown Orders")

    labels.append("text")
        .attr("x", -(height/2 - height * 0.05)/2)
        .attr("y", - 45)
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .text("Re-open Orders")


    function legistateChart(){
        draw_chart();
    }

    function draw_chart(){
        var data = []

        dateArrayStrings.forEach(function(d){
            isDate = false;
            chartData.forEach(function(v){
                if (v.key == d){
                    isDate = true;
                    data.push({
                        'date': d,
                        'count': v.values.length,
                        'order': +v.values[0].order 
                    })
                }
            })
            if (! isDate ) data.push({ 'date': d, 'count': 0, "order": 0 })
        })


        var y1_max = d3.max(data, function(d){ 
            return d.count; })
        
        var y1_string = []
        for(var i=0; i<y1_max; ++i){
            y1_string.push(String(i))
        }

        y1.domain([0, y1_max])
        y2.domain([0, 10])

        y1band.domain(y1_string)

        

        legis_y_axis.scale(y1).ticks(6)
        legisYaxisCall1.call(legis_y_axis);

        legis_y_axis2.scale(y2).ticks(6)
        legisYaxisCall2.call(legis_y_axis2);

        var rects = svg.selectAll("rect")
            .data(data)

        var w = width/data.length * 0.9
        rects.enter()
            .append('rect')
            .attr("class", "legis-rect")
            .attr("x", function(d){
                return x(d.date); })
            .attr("y", function(d){ 
                var s = (d.order == 0 ? y1 : y2)
                return s(d.count); })
            .attr("width", w)
            .attr("height", function(d){ 
                var s = (d.order == 0 ? y1 : y2)
                return s(0) - s(d.count); })
            .attr("fill", "grey")
            .attr("opacity", 0.20)
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
        if (!focus.includes(d)){
            var dates = focus.map(function(d){
                return d.date
            })
            focus.push(d)
        }
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
        var dates = [];
        focus_markers = [];
        focus.forEach(function(d){
            markerData.forEach(function(v){
                if (v.state == d){
                    var collisions = focus_markers.filter(function(k){ return k.date == v.date}).length
                    v.level = String(collisions)                   
                    focus_markers.push(v)
                }
            })
            
        })
        draw_markers();
    }

    function draw_markers(){
        var markers = svg.selectAll("circle")
            .data(focus_markers, function(d){ return d.state})

        markers.enter()
            .append("circle")
            .attr("cx", function(d){ return x(d.date) + x.bandwidth()/2; })
            .attr("cy", function(d){ return y1band(d.level) + y1band.bandwidth()/2; })
            .attr("r", 8)
            .attr("fill", function(d, i){
                return color(i); })
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


