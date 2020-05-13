function state_orders_chart(config){
    var margin = { left:120, right:50, top:15, bottom:40 }
        chartData = config.data,
        markerData = config.marker,
        raw_orders = config.raw_orders,
        full2abbrev = config.full2abbrev;
        missingLockdownList = [],
        missingReopenList = []
        dur = config.duration,
        order = config.order,
        defaultColor = config.defaultColor,
        defaultOpacity = config.defaultOpacity*0.5

    var ordersFocus = []

    var color = d3.scaleOrdinal(config.scheme);
    var cur_color = 0

    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    
    document.getElementById("ordersOuter").setAttribute("style", "width:" + (width +margin.left + margin.right) + "px");
    document.getElementById("ordersOuter").setAttribute("style", "height:" + (height + margin.top + margin.bottom) + "px");

    document.getElementById("orders-chart").setAttribute("style", "width:" + (width +margin.left + margin.right) + "px");
    document.getElementById("orders-chart").setAttribute("style", "height:" + (height + margin.top) + "px");

    const outerSvg = d3.select("#ordersOuter").append('svg')
        .attr("width", width + margin.left + margin.right)
    
    var barHeight = height/8

    var svg = d3.select("#orders-chart")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", barHeight * d3.keys(order).length + barHeight*0.5)
    

    var chart = svg.append("g")
        .attr("transform", "translate(" + margin.left + ",10)")


                
    var idTimeFormat = d3.timeFormat("%m%d%y")

    var orderChart = svg.append("g")
    var dates = d3.timeParse("%m/%d/%y");
    var ext = d3.extent(chartData, function(d){ return d.key; })

    var ordersDates = []
    var lockdown = [];
    var reopen = [];
    var lockdownBarData = []
    var reopenBarData = []
    var today = new Date();
    var missingLockdown = [{'id': 'lockdown', 'parentId': '', 'size': undefined}]
    var missingReopen = [{'id': 'lockdown', 'parentId': '', 'size': undefined}]
    const entries = Object.entries(order);
    for (const [key, vals] of entries){
        vals.lockdown.forEach(function(d){ 
            if (d.date != "" ){
                var collisions = lockdown.filter(function(v){
                    return v.date == d.date;
                })
                ordersDates.push(d.date)
                d.state = key
                lockdown.push({
                    'date': d.date,
                    'order': d.order,
                    'state': key,
                    'level': String(collisions.length),
                    'type': "lockdown"
                })
            }
            else {
                missingLockdown.push({
                    'id': key,
                    'parentId': 'lockdown',
                    'size': 10

                })
                missingLockdownList.push(key)
            }
        })
        vals.reopen.forEach(function(d){
            if (d.date != "" && dates(d.date) <= today){
                var collisions = reopen.filter(function(v){
                    return v.date == d.date;
                })
                ordersDates.push(d.date)
                d.state = key

                reopen.push({
                    'date': d.date,
                    'order': d.order,
                    'state': key,
                    'level': String(collisions.length),
                    'type': "reopen"
                })
            } else if (d.date == ""){
                missingReopen.push({
                    'id': key,
                    'parentId': 'reopen',
                    'size': 10
                })
                missingReopenList.push(key)
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

    //var dateArray = getDates(min_date, d3.timeDay.offset(today,1))
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
    
    


    var yBand = d3.scaleBand()
        .domain(d3.keys(order).sort(function(a,b){ return d3.descending(a,b)}))
        .range([barHeight * d3.keys(order).length, 0])
        .padding(0.15)

    var h = yBand.bandwidth()

    var rectHeight = d3.scaleOrdinal()
        .domain(["5", "4", "3", "2", "1", "0"])
        .range([h*0.8, h * 0.5, h * 0.3, h * 0.2, h * 0.1, 4])

   
    var x_axis = d3.axisBottom(x)
        .tickValues(x.domain().filter(function(d,i){ return !(i%7)}))
        // .ticks(4)
        .tickPadding(10)
    var y_axis = d3.axisLeft(yBand)

    outerSvg.append("g")
        .attr("transform", "translate(" + margin.left  + ")")
        .attr("class", "axis axis--y axisWhite")
        .call(x_axis);

    
    labels = chart.append("g")
        // .attr("transform", "translate(" + margin.left  + ")")
    
    labels.append('g')
        .attr("class", "axis axis--y axisWhite")
        .call(y_axis)
    
    legisYaxisCall1 = svg.append("g")
        .attr("class", "axis axis--y axisWhite")

    var labels = svg.append("g")
        .attr("class", "legis-labels")



    var lockdownNest = d3.nest()
        .key(function(d){ return d.date; })
        .entries(lockdown)

    
    var reopenNest = d3.nest()
        .key(function(d){ return d.date; })
        .entries(reopen)

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

    dateArrayStrings.forEach(function(d){
        isDate = false;
        reopenNest.forEach(function(v){
            if (d == v.key){
                isDate = true;
                reopenBarData.push({
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


    dateArrayStrings.forEach(function(d){
        isDate = false;
        reopenNest.forEach(function(v){
            if (d == v.key){
                isDate = true;
                reopenBarData.push({
                    'date': d,
                    'count': v.values.length,
                    'values': v.values
                })
            }
        })
        if (! isDate ){
            reopenBarData.push({ 'date': d, 'count': 0 , 'values': []})
        } 
    })

    y1_max = d3.max(lockdownBarData, function(d){ return d.count; })
    var y1_string = []

    for(var i=0; i<y1_max; ++i){
        y1_string.push(String(i))
    }

    var diffRects = [];
    var id = 0;

    var t = d3.timeFormat("%m/%d/%y")(today)

    d3.keys(order).forEach(function(d){
        tmp = {
            'x1': d3.timeFormat("%m/%d/%y")(min_date),
            'order': "5",
            'state': d,
            'id': id
        }
        close = lockdown.filter(v=>v.state == d)[0]
        if (close != undefined){
            tmp['x2'] = close.date
            tmp['id'] = id;
            diffRects.push(tmp)
            id += 1;
            tmp = {
                'x1': close.date,
                'order': close.order,
                'state': d,
                'id': id
            }
            open = reopen.filter(v=>v.state == d)
            if (open.length == 0){
                //tmp['x2'] = d3.timeFormat("%m/%d/%y")(d3.timeDay.offset(today,1))
                tmp['id'] = id;
                tmp['x2'] = 'today'
                diffRects.push(tmp)
                id += 1;
            }
            open.forEach(function(k, i){
                if (i == open.length - 1){
                    tmp['x2'] = k.date
                    diffRects.push(tmp)
                    id += 1;
                    tmp = {
                        'x1': k.date,
                        'order': k.order,
                        'state': d,
                        'x2': 'today',
                        'id': id
                    }
                    diffRects.push(tmp)
                    id += 1;
                } else {
                    tmp['x2'] = k.date
                    diffRects.push(tmp)
                    id += 1;
                    tmp = {
                        'x1': k.date,
                        'order': k.order,
                        'state': d,
                        'id': id
                    }
                }
            })
        } else {
            tmp['id'] = id;
            tmp['x2'] = 'today'
            diffRects.push(tmp)
            id += 1;
        }
    })

    

    svg
        .append('defs')
            .append('pattern')
                .attr('id', 'diagonalHatch')
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('width', 4)
                .attr('height', 4)
                .append('path')
                    .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 1);


    function ordersChart(){
        draw_chart();
    }

    function draw_chart(){


        var backgroundRects = chart.selectAll('rect')
            .data(d3.keys(order))

        backgroundRects.enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d){ return yBand(d); })
            .attr('height', yBand.bandwidth())
            .attr('width', width)
            .attr('fill', 'grey')
            .attr("opacity", defaultOpacity/3)
        
        rects = chart.selectAll("rect")
            .data(diffRects, d=>d.id )

        rects.enter()
            .append('rect')
            .attr("id", function(d){return "order-rect-" + d.state; })
            .attr("x", function(d){ return x(d.x1); })
            .attr("width", function(d){ 
                if (d.x2 == "today"){
                    w = width - x(d.x1)
                } else {
                    var w = x(d.x2) - x(d.x1)
                }
                
                return w
            })
            .attr("y", function(d){ 
                off = yBand.bandwidth()/2 - rectHeight(d.order)/2
                return yBand(d.state) + (off); })
            .attr("height", function(d){ 
                //console.log(rectHeight(String(d.order)), d.order)
                return rectHeight(d.order); })
            .attr("fill", defaultColor)
            .attr("opacity", defaultOpacity)
            .attr('stroke', "#000")
            .attr("stroke-width", "2px")


        // bg = chart.selectAll("bg-rect")
        //     .data(diffRects, d=>d.id )

        // bg.enter()
        //     .append('rect')
        //     .attr("x", function(d){ return x(d.x1); })
        //     .attr("width", function(d){ 
        //         if (d.x2 == "today"){
        //             w = width - x(d.x1)
        //         } else {
        //             var w = x(d.x2) - x(d.x1)
        //         }
                
        //         return w
        //     })
        //     .attr("y", function(d){ 
        //         off = yBand.bandwidth()/2 - rectHeight(d.order)/2
        //         return yBand(d.state) + (off); })
        //     .attr("height", function(d){ 
        //         //console.log(rectHeight(String(d.order)), d.order)
        //         return rectHeight(d.order); })
        //     .attr("fill", function(d){ return (d.order == 0 ? 'url(#diagonalHatch' : 'none'); })
        //     //.attr("fill", 'url(#diagonalHatch')
        //     //.attr("fill", "url(#circles-1")


            
             

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
        if (ordersFocus.includes(d.data.data.id)) update_focus(d.data.data.id, "remove")
        else update_focus(d.data.data.id, 'add')
    }

    function mouseover(d){
        if (d.values == undefined) return
        var arr = d.values[0].type == "lockdown" ? lockdownBarData : reopenBarData
        var states = arr.filter(function(v){
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
        if (d.values == undefined) return
        var arr = d.values[0].type == "lockdown" ? lockdownBarData : reopenBarData
        var states = arr.filter(function(v){
            return v.date == d.date
        })[0].values.map(function(k){ return k.state; })
        states.forEach(function(v){
            
            update_highlight(v, "off")
        })
        document.body.style.cursor = "default"
    }

    function display_hover(d, action){
        if (missingLockdownList.includes(d)){
            if (!ordersFocus.includes(d)){
                d3.selectAll("#order-lockdown-circ-" + d)
                    .attr("stroke", function(){ return (action == "on" ? "steelblue" : "#000"); })
                    .attr("stroke-width", function(){ return (action == "on" ? "1px" : "0"); })
                    .attr("opacity", function(){ return (action =="on" ? 1 : defaultOpacity)})
                return
            }

        }
        if (!ordersFocus.includes(d)) {
            d3.selectAll("#order-lockdown-circ-"+ d)
                .attr("opacity", function(){ return (action =="on" ? 1 : 0)})
                .attr("stroke", function(){ return (action == "on" ? "steelblue" : "#000"); })
                .attr("stroke-width", function(){ return (action == "on" ? "3px" : "0"); })

            d3.selectAll("#order-reopen-rect-" + d)
                .attr("opacity", function(){ return (action =="on" ? 1 : 0)})
                .attr("stroke", function(){ return (action == "on" ? "steelblue" : "#000"); })
                .attr("stroke-width", function(){ return (action == "on" ? "3px" : "0"); })
        }

        
    }

    function clicked(d){
        if (d.values == undefined) return
        var arr = d.values[0].type == "lockdown" ? lockdownBarData : reopenBarData
        var states = arr.filter(function(v){
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

            if (missingLockdownList.includes(d)){
                rad = (d3.select("#order-lockdown-circ-" + d).attr("r"))
                d3.selectAll("#order-lockdown-circ-" + d)
                    .attr("opacity", 1)
                    .style("fill", "#fff")
                    .attr("stroke-width", 0)
                    .attr("r", rad*2)
                    .transition().duration(dur)
                    .style("fill", color(cur_color))
                    .attr("r", rad)
            } else {
                d3.selectAll("#order-lockdown-circ-" + d)
                .attr("r", 20)
                .attr("opacity", 1)
                .attr("fill", "#fff")
                .attr("stroke-width", 0)
                .transition().duration(dur)
                .attr("r", y1CircR)
                .attr("fill", color(cur_color))
            }
            if (missingReopenList.includes(d)){
                d3.selectAll("#order-reopen-rect-" + d)
                    .attr("opacity", 1)
                    .style("fill", "#fff")
                    .attr("stroke-width", 0)
                    .transition().duration(dur)
                    .style("fill", color(cur_color))
            } else {
                d3.selectAll("#order-reopen-rect-" + d)
                    .attr("opacity", 1)
                    .style("fill", "#fff")
                    .attr("stroke-width", 0)
                    .transition().duration(dur)
                    .style("fill", color(cur_color))
            }
        }
        cur_color += 1;
    }

    function removeFromFocus(d, i){
        if (ordersFocus.includes(d)){
            const index = ordersFocus.indexOf(d);
            ordersFocus.splice(index, 1);
        }
        
        if (missingLockdownList.includes(d)){
            d3.selectAll("#order-lockdown-circ-" + d)
                .style("fill", "#fff")
                .attr("r", rad*2)
                .transition().duration(dur)
                .attr("opacity", defaultOpacity)
                .style("fill", defaultColor)
                .attr("stroke-width", 0)
                .attr("r", rad)
            return
        }
        else {
            d3.selectAll("#order-lockdown-circ-" + d)
                .transition().duration(dur)
                .attr("opacity", 0)
        }
            d3.selectAll("#order-reopen-rect-" + d)
                .attr("opacity", 0)
    }

    function removeAll(){

        ordersFocus.forEach(function(d){

            d3.select("#order-lockdown-circ-" + d)
                .style("fill", "#fff")
                .attr("r", rad*2)
                .transition().duration(dur)
                .attr("opacity", 0)
                .style("fill", defaultColor)
                .attr("stroke-width", 0)
                .attr("r", rad)

            d3.selectAll("#order-reopen-rect-" + d)
                .style("fill", "#fff")
                .transition().duration(dur)
                .attr("opacity", 0)
        })
        ordersFocus = [];
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
        else if (action == "removeAll") removeAll()
        return ordersChart;
    }

    return ordersChart;
}


