function orders_chart(config){
    var margin = { left:120, right:200, top:15, bottom:70 }
        chartData = config.data,
        markerData = config.marker,
        raw_orders = config.raw_orders,
        full2abbrev = config.full2abbrev;
        missingList = [],
        dur = config.duration,
        order = config.order,
        defaultColor = config.defaultColor,
        defaultOpacity = config.defaultOpacity

    var ordersFocus = [],
        focus_markers = [],
        data = [];

    var color = d3.scaleOrdinal(config.scheme);
    var cur_color = 0,
        circR;

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

    var ordersDates = []
    var lockdown = [];
    var reopen = [];
    var lockdownBarData = []
    var today = new Date();
    var missingLockdown = [{'id': 'lockdown', 'parentId': '', 'size': undefined}]
    const entries = Object.entries(order);
    for (const [key, vals] of entries){
        vals.lockdown.forEach(function(d){ 
            if (d.date != "" ){
                var collisions = lockdown.filter(function(v){
                    return v.date == d.date;
                })
                ordersDates.push(d.date)
                d.state = key
                d.level = String(collisions.length)
                d.type = "lockdown"
                lockdown.push(d)
            }
            else {
                missingLockdown.push({
                    'id': key,
                    'parentId': 'lockdown',
                    'size': 10
                })
                missingList.push(key)
            }
        })
        vals.reopen.forEach(function(d){
            if (d.date != "" && dates(d.date) <= today){
                var collisions = lockdown.filter(function(v){
                    return v.date == d.date;
                })
                ordersDates.push(d.date)
                d.state = key
                d.level = String(collisions.length)
                reopen.push(d)
            }
        })
    }

    var min_date = dates(d3.min(ordersDates)),
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

    var dateArray = getDates(min_date, today)
    var dateArrayStrings = [];

    dateArray.forEach(function(d){
        dateArrayStrings.push(formatTime(d));
    })

    //Set Scales
    var x = d3.scaleBand()
        .domain(dateArrayStrings)
        .range([0,width])
        .padding(0.05)
    
    var y1 = d3.scaleLinear()
        .range([height, height/2 + height * 0.05])

    var y1band = d3.scaleBand()
        .range([height, height/2 + height * 0.05])

    var y2 = d3.scaleLinear()
        .domain([0,1])
        .range([height/2 - height * 0.05, 0])

        
    
    
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
        .text("Lockdown")

    labels.append("text")
        .attr("x", -(height/2 - height * 0.05)/2)
        .attr("y", - 45)
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .text("Re-open")

    labels.append("text")
        .attr("transform", "translate(" + width/2 + "," + height + ")")
        .attr("x", 0)
        .attr("y", 60)
        .attr("class", "axis-label")
        .text("Date")

    function ordersChart(){
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

        var lockdownPack = missingG.append('g')
            .attr("transform", "translate(" + 0 + "," + height/2 + ")")
        
        const layout = d3.pack()
            .size([mWidth, height/2])
            .padding(3)

        const stratData = d3.stratify()(missingLockdown)
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
            .style("fill", function(d){ return (d.depth == 0 ? 'none' : defaultColor); })
            .attr("opacity", function(d){ return (d.depth == 0 ? 1 : defaultOpacity); })
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

        circR = Math.min(x.bandwidth(), y1band.bandwidth())/2 * 0.6

        legis_y_axis.scale(y1).ticks(5)
        legisYaxisCall1.call(legis_y_axis);

        legis_y_axis2.scale(y2).ticks(5)
        legisYaxisCall2.call(legis_y_axis2);

        var lockdownNest = d3.nest()
            .key(function(d){ 
                return d.date;
            })
            .entries(lockdown)

        dateArrayStrings.forEach(function(d){
            isDate = false;
            lockdownNest.forEach(function(v){
                if (d == v.key){
                    isDate = true;
                    lockdownBarData.push({
                        'date': d,
                        'count': v.values.length,
                        'values': v.values
                    })
                }
            })
            if (! isDate ){
                lockdownBarData.push({ 'date': d, 'count': 0 , 'values': []})
            } 
        })

        var reopenNest = d3.nest()
            .key(function(d){ 
                return d.date;
            })
            .entries(reopen)

        var reopenBarsData = []
        dateArrayStrings.forEach(function(d){
            isDate = false;
            reopenNest.forEach(function(v){
                if (d == v.key){
                    isDate = true;
                    reopenBarsData.push({
                        'date': d,
                        'count': v.values.length,
                        'values': v.values
                    })
                }
            })
            if (! isDate ){
                reopenBarsData.push({ 'date': d, 'count': 0 , 'values': []})
            } 
        })
        var w = width/lockdownBarData.length * 0.9

        var lockdownRects = orderChart.selectAll(".lockdown-rect")
            .data(lockdownBarData)

        lockdownRects.enter()
            .append('rect')
            .attr("class", "lockdown-rect")
            .attr("id", function(d){ return "lockdown-rect-" + d.date.replace(new RegExp("/", "g"),""); })
            .attr("x", function(d){ return x(d.date); })
            .attr("width", x.bandwidth())
            .attr("fill", defaultColor)
            .attr("opacity", defaultOpacity)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout)
                .on("click", clicked)
            .attr("y", y1(0))
            .attr("height", 0)
            .transition().duration(dur)
            .attr("y", function(d){ return y1(d.count); })
            .attr("height", function(d){ return y1(0) - y1(d.count); })

        var openRects = orderChart.selectAll(".open-rect")
            .data(reopenBarsData)

        openRects.enter()
            .append('rect')
            .attr("class", "open-rect")
            .attr("id", function(d){ return "open-rect-" + d.date.replace(new RegExp("/", "g"),""); })
            .attr("x", function(d){ return x(d.date); })
            .attr("width", w)
            .attr("fill", defaultColor)
            .attr("opacity", defaultOpacity)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout)
                .on("click", clicked)
            .attr("y", y2(0))
            .attr("height", 0)
            .transition().duration(dur)
            .attr("y", function(d){ return y2(d.count); })
            .attr("height", function(d){ return y2(0) - y2(d.count); })
            

        var focus_markers = []
        markerData.forEach(function(d){
            var collisions = focus_markers.filter(function(v){
                return v.date == d.date; })
            d.level = String(collisions.length)
            focus_markers.push(d)
        })




        // console.log(focus_markers[0])
        var circles = orderChart.selectAll("circle")
            .data(lockdown, function(d){ return d.state; })

        circles.enter()
            .append("circle")
            .attr("class", "legis-lockdown-circ")
            .attr("id", function(d){ return "legis-circ-" + d.state; })
            .attr("cx", function(d){
                return x(d.date) + x.bandwidth()/2; })
            .attr("cy", function(d){ return y1band(d.level) + y1band.bandwidth()/2; })
            .attr("r", circR)
            .attr("fill", defaultColor)
            .attr("opacity", 0)


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
        if (ordersFocus.includes(d.data.id)) update_focus(d.data.id, "remove")
        else update_focus(d.data.id, 'add')
    }

    function mouseover(d){
        var states = lockdownBarData.filter(function(v){
            return v.date == d.date
        })[0].values.map(function(k){ return k.state; })
        states.forEach(function(v){
            update_highlight(v, "on")
        })
        
        document.body.style.cursor = "pointer"
    }

    function mousemove(d){

    }

    function mouseout(d){
        var states = lockdownBarData.filter(function(v){
            return v.date == d.date
        })[0].values.map(function(k){ return k.state; })
        states.forEach(function(v){
            
            update_highlight(v, "off")
        })
        document.body.style.cursor = "default"
    }

    function display_hover(d, action){
        if (missingList.includes(d)){
            if (!ordersFocus.includes(d)){
                d3.select("#legis-circ-" + d)
                    .attr("stroke", function(){ return (action == "on" ? "steelblue" : "#000"); })
                    .attr("stroke-width", function(){ return (action == "on" ? "1px" : "0"); })
                    .attr("opacity", function(){ return (action =="on" ? 1 : defaultOpacity)})
            return
            }

        }

        if (!ordersFocus.includes(d)) {
            d3.select("#legis-circ-"+ d)
                .attr("opacity", function(){ return (action =="on" ? 1 : 0)})
                .attr("stroke", function(){ return (action == "on" ? "steelblue" : "#000"); })
                .attr("stroke-width", function(){ return (action == "on" ? "3px" : "0"); })
        }

        
    }

    function clicked(d){
        var states = lockdownBarData.filter(function(v){
            return v.date == d.date
        })[0].values.map(function(k){ return k.state; })

        states.forEach(function(v,i){
            if (ordersFocus.includes(v)) update_focus(v, "remove")
            else update_focus(v, 'add')
        })

    }
  
    function add2Focus(d, i){
        if (!ordersFocus.includes(d)){
            ordersFocus.push(d)

            if (missingList.includes(d)){
                rad = (d3.select("#legis-circ-" + d).attr("r"))
                d3.select("#legis-circ-" + d)
                    .attr("opacity", 1)
                    .style("fill", "#fff")
                    .attr("stroke-width", 0)
                    .attr("r", rad*2)
                    .transition().duration(dur)
                    .style("fill", color(cur_color))
                    .attr("r", rad)
            }
            else {
                d3.select("#legis-circ-" + d)
                .attr("r", 20)
                .attr("opacity", 1)
                .attr("fill", "#fff")
                .attr("stroke-width", 0)
                .transition().duration(dur)
                .attr("r", circR)
                .attr("fill", color(cur_color))
            }
        }
        cur_color += 1;
    }

    function removeFromFocus(d, i){
        if (ordersFocus.includes(d)){
            const index = ordersFocus.indexOf(d);
            ordersFocus.splice(index, 1);
        }
        
        if (missingList.includes(d)){
            d3.select("#legis-circ-" + d)
                .transition().duration(dur)
                .attr("opacity", defaultOpacity)
                .style("fill", defaultColor)
                .attr("stroke-width", 0)
            return
        }
        else {
            d3.select("#legis-circ-" + d)
                .transition().duration(dur)
                .attr("opacity", 0)
        }

    }

    function highlight_focus(){

        draw_markers();
    }

    function draw_markers(){
        focus_markers = [];
        ordersFocus.forEach(function(d){
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

            .attr("fill", function(d, i){ return "#fff"; })
            .transition().duration(dur)
            .attr("r", circR)
            .attr("fill", function(d, i){
                return color(d.color); })
        
    }

    ordersChart.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return ordersChart;
    }

    ordersChart.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return ordersChart;
    }

    ordersChart.x = function(value){
        if(!arguments.length) return x;
        x = value;
        return ordersChart;
    }

    ordersChart.y = function(value){
        if(!arguments.length) return y;
        y = value;
        return ordersChart;
    }

    ordersChart.display_states = function(value){
        if(!arguments.length) return display_states;
        display_states = value;
        update_display_data();
        return ordersChart;
    }

    ordersChart.highlight = function(value, action){
        if(!arguments.length) return highlight;
        highlight = value;
        display_hover(value, action);
        return ordersChart;
    }  

    ordersChart.addFocus = function(value, action){
        if(!arguments.length) return addFocus;
        if (action == "add") add2Focus(value)
        else if (action == "remove") removeFromFocus(value)
        return ordersChart;
    }

    return ordersChart;
}


