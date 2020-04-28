function legistate_chart(config){
    var margin = { left:120, right:200, top:15, bottom:70 }
        chartData = config.data,
        markerData = config.marker,
        raw_orders = config.raw_orders,
        full2abbrev = config.full2abbrev;
        missingList = [],
        dur = config.duration;

    var focus = [],
        focus_markers = [],
        data = [];

    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    
    // append the svg object to the body of the page
    var svg = d3.select("#legis-chart")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    

    var idTimeFormat = d3.timeFormat("%m%d%y")
                
    var orderChart = svg.append("g")
    var dates = d3.timeParse("%m/%d/%y");
    var ext = d3.extent(chartData, function(d){ return d.key; })
    var min_date = dates(ext[0]),
        max_date = dates(ext[1])
  

    // console.log(chartData)
    // console.log(markerData)

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

    $("#orders-help")
        .click(function(){
            $("#legisModal").modal();
        })
        .mouseover(function(){
            $("#orders-help-icon").css("color", "yellow").css("opacity", 1)
        })
        .mouseout(function(){
            $("#orders-help-icon").css("color", "lightsteelblue").css("opacity", 0.5)
        })
        
    var color = d3.scaleOrdinal(d3.schemeDark2);
    var cur_color = 0;
    
    var x_axis = d3.axisBottom(x)
        .tickValues(x.domain().filter(function(d,i){ return !(i%7)}))
        // .ticks(4)
        .tickPadding(10)
    var x_axis2 = d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ return }));
    var legis_y_axis = d3.axisLeft()
    var legis_y_axis2 = d3.axisLeft()

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axis axis--y axisWhite")
        .call(x_axis);

    svg.append("g")
        .attr("transform", "translate(0," +(height/2 - height * 0.05)+ ")")
        .attr("class", "axis axis--y axisWhite")
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

    labels.append("text")
        .attr("transform", "translate(" + width/2 + "," + height + ")")
        .attr("x", 0)
        .attr("y", 60)
        .attr("class", "axis-label")
        .text("Date")

    function legistateChart(){
        missing_points();
        draw_chart();
    }


    function missing_points(){
        mWidth = margin.right * 0.7
        
        missingG = svg.append("g")
            .attr("class", "missing")
            .attr("transform", "translate(" + (width + margin.right*0.15) + ",0)")


        missingG.append('text')
            .attr("x", mWidth/2)
            .attr('transform', 'translate(0,' + height + ')')
            .attr("y", 10)
            .attr("class", "axis-label")
            .text("Missing Orders")

        var missingData = [{'id': 'lockdown', 'parentId': '', 'size': undefined}]
        const entries = Object.entries(raw_orders);
        for (const [key, vals] of entries){
            if (vals.date == null){
                missingData.push({
                'id': full2abbrev[key],
                'parentId': 'lockdown',
                'size': 10
                })
                missingList.push(full2abbrev[key])
            }
        }

        var lockdownPack = missingG.append('g')
            .attr("transform", "translate(" + 0 + "," + height/2 + ")")
        
        const layout = d3.pack()
            .size([mWidth, height/2])
            .padding(3)

        const stratData = d3.stratify()(missingData)
        var roots = d3.hierarchy(stratData)
            .sum(function (d){ return d.data.size })
            .sort(function(a, b) { return b.value - a.value })
        var nodes = roots.descendants()

        layout(roots)

        const slices = lockdownPack.selectAll(".missing-circle")
            .data(nodes, function(d){ return d.data.id})
        

        slices.enter()
            .append("circle")
                .on("mouseover", missingMouseover)
                .on("mousemove", missingMousemove)
                .on("mouseout", missingMouseout)
                .on("click", missingClicked)
            .attr("id", function(d){ return "legis-circ-" + d.data.id; })
            .attr("cx", function(d){ return d.x; })
            .attr("cy", function(d){ return d.y; })
            .style("fill", function(d){ return (d.depth == 0 ? 'none' : 'grey'); })
            .attr("opacity", function(d){ return (d.depth == 0 ? 1 : 0.2); })
            .attr("r", 0)
            .transition().duration(dur)
            .attr("r", function(d){ return d.r; })

        

        const missingTexts = lockdownPack.selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
                .on("mouseover", missingMouseover)
                .on("mousemove", missingMousemove)
                .on("mouseout", missingMouseout)
                .on("click", missingClicked)
            .attr("x", function(d){ return d.x; })
            .attr("y", function(d){ return d.y; })
            .text(function(d){ 
                var t = (d.depth != 0 ? d.data.id : "")
                return t; })
            
            .attr("text-anchor", 'middle')
            .attr("dominant-baseline", 'middle')
            .attr("fill", "#fff")
            .attr("font-size", "0.05rem")
            .transition().duration(dur)
            .attr("font-size", "1.2rem")
            
    }

    function draw_chart(){
        data = []

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

        

        legis_y_axis.scale(y1).ticks(5)
        legisYaxisCall1.call(legis_y_axis);

        legis_y_axis2.scale(y2).ticks(5)
        legisYaxisCall2.call(legis_y_axis2);

        var rects = orderChart.selectAll("rect")
            .data(data)

        var w = width/data.length * 0.9
        rects.enter()
            .append('rect')
            .attr("class", "legis-rect")
            .attr("id", function(d){ return "rect-" + d.date.replace(new RegExp("/", "g"),""); })
            .attr("x", function(d){
                return x(d.date); })
            .attr("width", w)

            .attr("fill", "grey")
            .attr("opacity", 0.20)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout)
                .on("click", clicked)

            .attr("y", y1(0))
            .attr("height", 0)
            .transition().duration(dur)
            .attr("y", function(d){ 
                var s = (d.order == 0 ? y1 : y2)
                return s(d.count); })
            .attr("height", function(d){ 
                var s = (d.order == 0 ? y1 : y2)
                return s(0) - s(d.count); })

        var focus_markers = []
        markerData.forEach(function(d){
            var collisions = focus_markers.filter(function(v){
                return v.date == d.date; })
            d.level = String(collisions.length)
            focus_markers.push(d)
        })

        var circles = orderChart.selectAll("circle")
            .data(focus_markers)

        circles.enter()
            .append("circle")
            .attr("class", "legis-lockdown-circ")
            .attr("id", function(d){ return "legis-circ-" + d.state; })
            .attr("cx", function(d){ return x(d.date) + x.bandwidth()/2; })
            .attr("cy", function(d){ return y1band(d.level) + y1band.bandwidth()/2; })
            .attr("r", 10)
            .attr("opacity", 0)
            .style("visibility", "hidden")


    }
    
    function missingMouseover(d){
        document.body.style.cursor = "pointer"
        update_highlight(d.data.id, 'on')
    }

    function missingMousemove(d){
        
    }

    function missingMouseout(d){
        update_highlight(d.data.id, 'off')
        document.body.style.cursor = "default"
    }

    function missingClicked(d){
        if (focus.includes(d.data.id)) update_focus(d.data.id, "remove")
        else update_focus(d.data.id, 'add')
    }

    function mouseover(d){
        var statesHovered = chartData.filter(function(v){
            return v.key == d.date
        })[0].values
        statesHovered.forEach(function(v){
            update_highlight(v.state, "on")
        })
        
        document.body.style.cursor = "pointer"
    }

    function mousemove(d){

    }

    function mouseout(d){
        var statesHovered = chartData.filter(function(v){
            return v.key == d.date
        })[0].values
        statesHovered.forEach(function(v){
            update_highlight(v.state, "off")
        })
        document.body.style.cursor = "default"
    }

    function display_hover(d, action){
        var s = raw_orders[abbrev2full[d]]
        if (s == undefined) return 
        var date = raw_orders[abbrev2full[d]].date
        
        if (date == null){
            if (!focus.includes(d)){
                d3.select("#legis-circ-" + d)
                .attr("stroke", function(){ return (action == "on" ? "steelblue" : "#000"); })
                .attr("stroke-width", function(){ return (action == "on" ? "3px" : "0"); })
                .attr("opacity", function(){ return (action =="on" ? 1 : 0.2)})
            return
            }

        }
        var tmp = idTimeFormat(date)
        d3.select("#rect-" + tmp)
            .attr("stroke", function(){ return (action == "on" ? "steelblue" : "#000"); })
            .attr("stroke-width", function(){ return (action == "on" ? "3px": "0.5px"); })
            .attr("opacity", function(){ return (action =="on" ? 1 : 0.2)})
        
    }

    function clicked(d){
        
        var statesHovered = chartData.filter(function(v){
            return v.key == d.date
        })[0].values
        statesHovered.forEach(function(v,i){
            if (focus.includes(v.state)) update_focus(v.state, "remove")
            else update_focus(v.state, 'add')
        })

    }
  
    function add2Focus(d, i){
        if (!focus.includes(d)){
            focus.push(d)

            if (missingList.includes(d)){
                d3.select("#legis-circ-" + d)
                    .attr("opacity", 1)
                    .style("fill", "#fff")
                    .attr("stroke-width", 0)
                    .transition().duration(dur)
                    .style("fill", color(cur_color))
            }
            else {
                d3.select("#legis-circ-" + d)
                .attr("r", 20)
                .attr("opacity", 1)
                .attr("fill", "#fff")
                .transition().duration(dur)
                .attr("r", 10)
                .attr("fill", color(cur_color))
                .style("visibility", "visible")
            }
        }
        cur_color += 1;
    }

    function removeFromFocus(d, i){
        if (focus.includes(d)){
            const index = focus.indexOf(d);
            focus.splice(index, 1);
        }
        
        if (missingList.includes(d)){
            d3.select("#legis-circ-" + d)
                .transition().duration(dur)
                .attr("opacity", 0.2)
                .style("fill", "grey")
                .attr("stroke-width", 0)
            return
        }

        d3.select("#legis-circ-" + d)
            .transition().duration(dur)
            .attr("opacity", 0)
    }

    function highlight_focus(){

        draw_markers();
    }

    function draw_markers(){
        focus_markers = [];
        focus.forEach(function(d){
            markerData.forEach(function(v){
                if (v.state == d){
                    var collisions = focus_markers.filter(function(k){ return k.date == v.date}).length
                    v.level = String(collisions)                   
                    v.color = cur_color;
                    focus_markers.push(v)
                    cur_color += 1;
                }
            })
        })

        var markers = svg.selectAll("circle")
            .data(focus_markers, function(d){ return d.state})

        markers.exit().remove()

        markers.attr("fill", function(d, i){
            return color(d.color);
        })

        markers.enter()
            .append("circle")
            .attr("id", function(d){ return "legis-circ-" + d.state; })
            .attr("cx", function(d){ return x(d.date) + x.bandwidth()/2; })
            .attr("cy", function(d){ return y1band(d.level) + y1band.bandwidth()/2; })

            .attr("r", 40)
            .attr("fill", function(d, i){ return "#fff"; })
            .transition().duration(dur)
            .attr("r", 10)
            .attr("fill", function(d, i){
                return color(d.color); })
        
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

    legistateChart.highlight = function(value, action){
        if(!arguments.length) return highlight;
        highlight = value;
        display_hover(value, action);
        return legistateChart;
    }  

    legistateChart.addFocus = function(value, action){
        if(!arguments.length) return addFocus;
        if (action == "add") add2Focus(value)
        else if (action == "remove") removeFromFocus(value)
        return legistateChart;
    }

    return legistateChart;
}


