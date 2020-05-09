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
    var statesPlaceholder = ['ph0','ph1','ph2','ph3','ph4']
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
    

    var ordersTooltip =  d3.select("#ttest")
        .append('div')
        //.style("width", "270px")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("data-placement", "right")

    var dateTip = ordersTooltip.append("div")
        .attr("class", "tooltip")


    var getDateObj = d3.timeParse("%m/%d/%y");
    var date2String = d3.timeFormat("%m/%d/%y")
    var today = new Date();
    var ordersDate = [],
        textLabels = [],
        dateBinning = 1,
        spanData = [],
        filler = []

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
        d3.timeDay.offset(getDateObj(sorted[0]), -10), 
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

    var minDate = "03/07/20"
    var filteredData
    var groupedBarData = []
    var orderLevels= ["0", "1", "2", "3", "4", "5"]

    id = 0
    for (const [key, vals] of dict){
        prevDate = minDate
        prevOrder = "5"
        tmp = vals.orders.filter(function(d){ return d.date != "" && getDateObj(d.date) <= today})
        tmp.forEach(function(d, i){
            if (d.date != ""){
                d.state = key
                d.id = key + "-" + i
                d.level = String(ordersByDate[d.date].length)
                ordersByDate[d.date].push(d)

                diff = getDateDiff(prevDate, d.date)
                
                groupedBarData.push({
                    'state': key,
                    'order': prevOrder,
                    'startDate': prevDate,
                    'endDate': d.date,
                    'id': id
                    //'id': key + "-" + prevOrder
                })
                prevDate = d.date
                prevOrder = d.order
                id += 1

                if (i == tmp.length -1){
                    groupedBarData.push({
                        'state': key,
                        'order': prevOrder,
                        'startDate': prevDate,
                        'endDate': date2String(today),
                        'id': id
                        //'id': key + "-" + prevOrder
                    })
                    id += 1
                }
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

    var states = d3.keys(order)


    function getDateDiff(a,b){
        return Math.round((getDateObj(b) - getDateObj(a))/ (1000*60*60*24))
    }

    height1 = height/2 + height * 0.1
    height2 = height/2

    //Set Scales
    var x = d3.scaleBand()
        .domain(dateArrayStrings)
        .range([0,width])
        .padding(0.08)
    
    var y1 = d3.scaleLinear()
        .domain([0, maxCount])
        .range([height, height1])
        //.range([height, 0])

    var y1band = d3.scaleBand()
        .domain(bandStrings)
        .range(y1.range())
        .padding(0.05)

    var yState = d3.scaleBand()
        .domain(["0", "1", "2", "3", "4"])
        .range([0, height2])
        .padding(0.2)

    var yLevel = d3.scaleBand()
        .domain(orderLevels)
        .range([0, yState.bandwidth()])
        .padding(0.1)

    var xLinear = d3.scaleLinear()
        .domain([0, dateArrayStrings.length])
        .range([0, width])

    var yBg = d3.scaleBand()
        .domain(["0", "1", "2", "3", "4"])
        .range(yState.range())
        .padding(0.05)

    var radius = Math.min(y1band.bandwidth(), x.bandwidth())/2 * 0.7

    var x_axis1 = d3.axisBottom(x)
        //.tickValues(x.domain().filter(function(d,i){ return !(i%7)}))
        .tickPadding(15)

    var x_axis2 = d3.axisBottom(x)
        //.tickValues(x.domain().filter(function(d,i){ return !(i%7)}))
        .tickFormat("")

    var y_axis1 = d3.axisLeft(y1).ticks(5)
    var y_axis2 = d3.axisLeft().tickPadding(30)
    var y_axis3 = d3.axisLeft(yLevel).tickSize(5,0)

    var labels = svg.append("g")
        .attr("class", "labels")

    labels.append("g")
        .attr("class", "axis axis--x axisWhite")
        .call(y_axis1)

    labels.append("g")
        .attr("class", "axis axis--x axisWhite")
        .attr("id", "orders-bottom-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(x_axis1)

    labels.append("g")
        .attr("class", "axis axis--x axisWhite")
        .attr("id", "orders-top-axis")
        .attr("transform", "translate(0," + height2 + ")")
        .call(x_axis2)

    upperAxisCall = labels.append("g")
        .attr("class", "axis axis--x axisWhite")
        
    var dynamicAxis = svg.append("g")
        .attr("id", "dynm-axis")

    sel = d3.selectAll("#orders-bottom-axis")
    sel.selectAll("text").each(function(_,i){
        if (i % 7 !== 0) d3.select(this).remove();
    })
    sel.selectAll('line').each(function(_,i){
        if (i % 7 == 0) d3.select(this).attr("y2", 12);
    })
    sel = d3.selectAll("#orders-top-axis")
    sel.selectAll('line').each(function(_,i){
        if (i % 7 == 0) d3.select(this).attr("y2", 12);
    })

    lowerChart = svg.append("g")
        .attr("class", "lower-chart")

    upperChart = svg.append('g')
        .attr("class", "upper-chart")

    textGroup = upperChart.append('g')
        .attr("transform", "translate(" + -margin.left * 0.4 + ",0)")

    upperChart.append('text')
        .attr("x", -height2/2)
        .attr("y", -margin.left * 0.7)
        .attr("transform", "rotate(-90)")
        .attr("class", "axis-label")
        .text("Lockdown Level Per state")

    svg.append("text")
        .attr("x", -height*0.75)
        .attr("y", -margin.left * 0.7)
        .attr("transform", "rotate(-90)")
        .attr("class", "axis-label")
        .text("Orders Issued Per Day")

    upperChart.append("g").selectAll("bg-rect")
        .data(yBg.domain())
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d=> yBg(d))
        .attr("width", width)
        .attr("height", yBg.bandwidth())
        .attr("fill", "grey")
        .attr("opacity", 0.05)

    yState.domain().forEach(function(d, i){
        dynamicAxis.append("g")
            .attr("id", "dyn-axis-" + i)
            .attr("transform", "translate(0," + yState(d) + ")")
            .attr("class", "axis axis--x axisWhite")
            .attr("opacity", 1)
            .call(y_axis3)
    })

    lowerChart.append('rect')
        .attr("class", "hover")
        .attr("x", 0)
        .attr("y", height1)
        .attr("width", width)
        .attr("height", height - height1)
        .attr("fill", defaultColor)
        .attr("opacity", 0)
            .on("mousemove", mousemove)
            .on("mouseenter", mouseover)
            .on("mouseout", mouseout)

    verticalMarker = svg.append('line')
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke-dasharray", ("3,3"))
        .attr('stroke', "#fff")
        .attr("opacity", 0)


    function ordersChart(){
        draw_chart();
        updateScales();
        draw_span_rects();
    }
    
    function draw_span_rects(){
        var rects = upperChart.selectAll(".order-span-rect")
            .data(filteredData, function(d){
                return d.id
            })

        rects.exit()
            .attr("fill", "#fff")
            .transition().duration(dur)
                .attr("width", 0)
            .remove()

        
        rects
            .transition().duration(dur/2)
                .attr("y", function(d){ return yState(d.state) + yLevel(d.order) })
                .attr("height", yLevel.bandwidth())

        rects.enter()
            .append("rect")
            .attr("class", "order-span-rect")
            .attr("id", d=> "span-rect-" + d)
            .attr("x", function(d){ return (d.startDate != "" ? x(d.startDate) + x.bandwidth()/2 : 0)  })
            .attr("y", function(d){ return yState(d.state) + yLevel(d.order) })
            .attr("height", yLevel.bandwidth())
            .attr("rx", 3)
            .attr("width", 0)
            .attr("fill", "#fff")
            .transition().duration(dur)
            .attr("width", function(d){ return (d.startDate != "" ? x(d.endDate) - x(d.startDate) : 0 );  })
            .attr("fill", color(cur_color))
        
        
        var texts = textGroup.selectAll(".texts-labels-state")
            .data(textLabels, function(d){ return d.id})

        texts.exit()
            .attr("fill", "#fff")
            .transition().duration(dur/2)
            .attr("fill", "#000")
            .attr("opacity", 0)
            .remove()

        texts
            .attr("x", 0)
            .transition().duration(dur)
            .attr("y", d=>yState(d.state) + yState.bandwidth()/2)
            .text(d=>d.state)


        texts.enter()
            .append("text")
            .attr("class", "texts-labels-state")
            .attr("x", 0)
            .attr("y", d=>yState(d.state) + yState.bandwidth()/2)
            .text(d=>d.state)
            .attr("fill", "#fff")
            .attr("font-size", "1.5rem")
            .transition().duration(dur)
            .attr("fill", color(cur_color))
            .attr("font-size", "1rem")


        var fillerRect = upperChart.selectAll('.filler-rect')
            .data(filler, d=>d.id)

        fillerRect.exit().remove()

        fillerRect.enter()
            .append("rect")
            .attr("class", "filler-rect")
            .attr("x", 0)
            .attr("y", d=> yState(d.y))
            .attr("width", width)
            .attr("height", yState.bandwidth)
            // .attr("x", width/2)
            // .attr("y", d=> yState(d.y) + yState.bandwidth()/2)
            // .attr("width", 0)
            // .attr("height", 0)
            .attr("fill", defaultColor)
            .attr("opacity", 0)
            .attr("rx", 0)
            .transition().duration(dur)
            .attr("opacity", defaultOpacity)

            .attr("rx", 10)

        
        var fillerText = upperChart.selectAll(".filler-text")
            .data(filler, d=>d.id)

        fillerText.exit().remove()

        fillerText.enter()
            .append("text")
            .attr("class", "filler-text")
            .attr("x", width/2)
            .attr("y", d=> yState(d.y) + yState.bandwidth()/2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", "#fff")
            .text("Select a state to Populate Data..")
            //.attr("font-size", 0)
            
            .attr("opacity", 0)
            .transition().duration(dur)
            .attr("font-size", "1rem")
            
            .attr("opacity", 1)

    }

    function draw_chart(){
        var chart = lowerChart.append("g")
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
    
    function updateScales(){
        ph = 0
        spanData = []
        textLabels = []
        ordersFocus.forEach(d=> spanData.push(d))

        while (spanData.length >= 6) spanData.shift()
        spanData.forEach(function(d){
            textLabels.push({'state': d, 'id': states.indexOf(d)})
        })

        while (spanData.length < 5){
            spanData.push('ph' + ph)
            ph += 1
        }
        
        
        yState.domain(spanData)
        y_axis2.scale(yState)
        yLevel.range([0, yState.bandwidth()])
        y_axis3.scale(yLevel)

        // spanData.forEach(function(d, i){
        //     if (d.length == 2){
        //         d3.select("#dyn-axis-" + i)
        //             .attr("opacity", 1)
        //     }
        // })

        filler = []
        for (var i=0; i<5; ++i){
            if (i>=ordersFocus.length){
                filler.push({'y': yState.domain()[i], 'id': i})
            }
        }


        filteredData = groupedBarData.filter(d=> spanData.includes(d.state))
    }

    function mouseover(d){
        ordersTooltip
            .raise()
            .transition().duration(250)
            .style("opacity", 1)
        if (d == undefined){
            document.body.style.cursor = "crosshair"
            return 
        }

        
        var states = d.data.map(d => d.state)
        states.forEach(function(v,i){
            update_highlight(v, "on")
        })
        document.body.style.cursor = "pointer"
    }


    function mousemove(d){
        var curX = d3.mouse(this)[0]
        var i = Math.round(curX/x.step())
        var data = ordersByDate[x.domain()[i]]
        verticalMarker
            .lower()
            .attr("x1", curX)
            .attr("x2", curX)
            .attr("opacity", 1)

        
        ordersTooltip
            .html(
                "<p>" + 
                "Date: " + "<em>" + x.domain()[i] + "</em>" + "<br>" + 
                "States with Orders: " + "<em>" + data.length  + "</em>"+ "<br>" + 
                "States: "  + formatStatesText(data) 
                + "</p>"
            )
        .style("left", (d3.mouse(this)[0]) + (margin.left +30) + "px")
        .style("top", (d3.mouse(this)[1]) + (margin.top + margin.bottom/2) + "px")
    }

    function formatStatesText(d){
        str = ""
        d.forEach(function(v, i){
            str += v.state + ", "
            if (!(i % 3) && i!= 0) str += "<br>"
        })
        return str
    }

    function mouseout(d){
        document.body.style.cursor = "crosshair"
        ordersTooltip
            .transition().duration(250)
            .style("opacity", 0)

        verticalMarker
            .transition().duration(250)
            .attr("opacity", 0)

        if (d == undefined) return
        var states = d.data.map(d => d.state)
        states.forEach(function(v,i){
            update_highlight(v, "off")
        })
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
            updateScales();
            draw_span_rects();
            cur_color += 1;
        }
        
    }

    function removeFromFocus(d, i){
        if (ordersFocus.includes(d)){
            const index = ordersFocus.indexOf(d);
            ordersFocus.splice(index, 1);
            updateScales();
            draw_span_rects();
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
        updateScales();
        draw_span_rects();
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


