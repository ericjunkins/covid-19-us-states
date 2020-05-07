function orders_chart(config){
    var margin = { left:120, right:60, top:30, bottom:70 }
        chartData = config.data,
        markerData = config.marker,
        raw_orders = config.raw_orders,
        full2abbrev = config.full2abbrev;
        dur = config.duration,
        order = config.order,
        defaultColor = config.defaultColor,
        defaultOpacity = config.defaultOpacity*0.5

    var ordersFocus = []

    var color = d3.scaleOrdinal(config.scheme);
    var cur_color = 0
    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    
    // append the svg object to the body of the page
    var svg = d3.select("#orders-chart")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    

    var getDateObj = d3.timeParse("%m/%d/%y");
    var today = new Date();
    var ordersDate = [],
        dateBinning = 1

    const dict = Object.entries(order)
    for (const [key, vals] of dict){
        tmp = vals.orders.filter(function(d){ return d.date != "" && getDateObj(d.date) <= today})
        tmp.forEach(function(d, i){
            if (! ordersDate.includes(d.date) && d.date != "") ordersDate.push(d.date)
            d.state = key
            d.id = key + "-" + i
        })
    }

    

    sorted = ordersDate.sort(function(a,b){
        return d3.ascending(a,b)
    })

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

    var dateArray = getDates(
        d3.timeDay.offset(getDateObj(sorted[0]), -3), 
        d3.timeDay.offset(today, 1)
    )

    var dateArrayStrings = [];

    for (var i=0; i < dateArray.length - dateBinning; i=i+dateBinning){
        dateArrayStrings.push(formatTime(dateArray[i]))
    }

    ordersByDate = {}
    dateArrayStrings.forEach(function(d){
        ordersByDate[d] = []
    })

    for (const [key, vals] of dict){
        tmp = vals.orders.filter(function(d){ return d.date != "" && getDateObj(d.date) <= today})
        tmp.forEach(function(d, i){
            if (d.date != ""){
                d.state = key
                d.id = key + "-" + i
                d.level = String(ordersByDate[d.date].length)
                ordersByDate[d.date].push(d)
            }
        })
    }

    var markerData = [],
        rectData = []

    var dateEntries = Object.entries(ordersByDate)
    for (const [key, val] of dateEntries){
        if (val.length){
            val.forEach(function(d){
                markerData.push(d)
            })
            rectData.push({'date': key, 'count': val.length, 'data': val })
        }
    }

    maxCount = d3.max(rectData, function(d){ return d.count})
    bandStrings = []
    for (var i=0; i <maxCount; ++i){
        bandStrings.push(String(i))
    }

    //Set Scales
    var x = d3.scaleBand()
        .domain(dateArrayStrings)
        .range([0,width])
        .padding(0.08)
    
    var y1 = d3.scaleLinear()
        .domain([0, maxCount])
        //.range([height, height/2 + height * 0.05])
        .range([height, 0])

    var y1band = d3.scaleBand()
        .domain(bandStrings)
        .range(y1.range())
        .padding(0.05)

    var radius = Math.min(y1band.bandwidth(), x.bandwidth())/2 * 0.7


    var x_axis = d3.axisBottom(x)
        .tickValues(x.domain().filter(function(d,i){ return !(i%7)}))
        .tickPadding(10)

    var y_axis = d3.axisLeft(y1)

    var labels = svg.append("g")
        .attr("class", "labels")

    labels.append("g")
        .attr("class", "axis axis--x axisWhite")
        .call(y_axis)

    labels.append("g")
        .attr("class", "axis axis--x axisWhite")
        .attr("transform", "translate(0," + height + ")")
        .call(x_axis)


 

    function ordersChart(){
        draw_chart();
    }
    
    function draw_chart(){
        var chart = svg.append("g")
            .attr("class", "charts")

        
        var rects = chart.append("g").selectAll("rect")
            .data(rectData, d=> d.date)

        rects.enter()
            .append('rect')
            .attr("class", "bg-rects")
            .attr("x", d=> x(d.date))
            .attr("y", d=> y1(d.count))
            .attr("width", x.bandwidth())
            .attr("height", function(d){ return y1(0) - y1(d.count); })
            .attr("fill", defaultColor)
            .attr("opacity", defaultOpacity/2)


        var circles = chart.append("g").selectAll("circle")
            .data(markerData, d=>d.id)

        circles.enter()
            .append("circle")
            .attr("class", "orders-circle-le")
            .attr("id", d=> "orders-circle-" + d.state)
            .attr("r", radius)
            .attr("cx", d=> x(d.date) + x.bandwidth()/2)
            .attr("cy", d=> y1band(d.level) + y1band.bandwidth()/2)
            .attr("fill", defaultColor)
            .attr("opacity", 0)

        foreRect = chart.selectAll(".fg-rect")
            .data(rectData, d=>d.date)

        foreRect.enter()
            .append('rect')
            .attr("class", "fg-rects")
                .on("mousemove", mousemove)
                .on("mouseenter", mouseover)
                .on("mouseout", mouseout)
                .on("click", clicked)
            .attr("id", function(d){ return d.date.replace(new RegExp("/", "g"),""); })
            .attr("x", d=> x(d.date))
            .attr("y", d=> y1(d.count))
            .attr("width", x.bandwidth())
            .attr("height", function(d){ return y1(0) - y1(d.count); })
            .attr("fill", defaultColor)
            .attr("opacity", defaultOpacity)
            //.attr("visibility", 'hidden')
    }
    
    function mouseover(d){
        if (d.data == undefined) return
        var states = d.data.map(d => d.state)
        states.forEach(function(v,i){
            update_highlight(v, "on")
        })
        document.body.style.cursor = "pointer"
    }

    function mousemove(d){

    }

    function mouseout(d){
        if (d.data == undefined) return
        var states = d.data.map(d => d.state)
        states.forEach(function(v,i){
            update_highlight(v, "off")
        })
        document.body.style.cursor = "default"
    }

    function display_hover(d, action){
        if (!ordersFocus.includes(d)){
            d3.selectAll("#orders-circle-" + d)
                .attr("stroke", function(){ return (action == "on" ? "steelblue" : "#000"); })
                .attr("stroke-width", function(){ return (action == "on" ? "1px" : "0"); })
                .attr("opacity", function(){ return (action =="on" ? 1 : 0)})
        }

    }

    function clicked(d){
        if (d.data == undefined) return
        var states = d.data.map(d => d.state)
        states.forEach(function(v,i){
            if (ordersFocus.includes(v)) update_focus(v, "remove")
            else update_focus(v, 'add')
        })

    }
  
    function add2Focus(d, i){
        if (!ordersFocus.includes(d)){
            ordersFocus.push(d)
            d3.selectAll("#orders-circle-" + d)
                .attr("stroke-width", 0)
                .attr("fill", "#fff")
                .attr("r", radius * 3)
                .attr("opacity", 1)
                .transition().duration(dur)
                .attr("r", radius)
                .attr("fill", color(cur_color))
        }
        cur_color += 1;
    }

    function removeFromFocus(d, i){
        if (ordersFocus.includes(d)){
            const index = ordersFocus.indexOf(d);
            ordersFocus.splice(index, 1);
        }
        d3.selectAll("#orders-circle-" + d)
            .attr("fill", "#fff")
            .attr("r", radius * 3)
            .transition().duration(dur/2)
            .attr("opacity", 0)
            .attr("r", radius)
            .attr("fill", defaultColor)
    }

    function removeAll(){

        ordersFocus.forEach(function(d){
            d3.selectAll("#orders-circle-" + d)
                .attr("fill", "#fff")
                .attr("r", radius * 3)
                .transition().duration(dur/2)
                .attr("opacity", 0)
                .attr("r", radius)
                .attr("fill", defaultColor)
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


