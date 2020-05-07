function bubbleOrders_chart(config){
    var margin = { left:120, right:50, top:50, bottom: 80 }
        chartData = config.data,
        markerData = config.marker,
        raw_orders = config.raw_orders,
        full2abbrev = config.full2abbrev;
        dur = config.duration,
        orders = config.order,
        defaultColor = config.defaultColor,
        defaultOpacity = config.defaultOpacity*0.5

    var ordersFocus = []
    var getDateObj = d3.timeParse("%m/%d/%y");
    var today = new Date();
    var color = d3.scaleOrdinal(config.scheme);
    var cur_color = 0
    var rad = 4,
        strokeWidth = 2,
        dateBinning = 3,
        circFraction = 0.7
    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    

    var svg = d3.select(config.selection)
        .append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + (0 + margin.left) + "," + margin.top + ")")
    
    var packs = svg.append("g")
        .attr("class", "circle-packs")           


    ordersDate = [];
    nodes_data = [];
    var link_data = []
    // const entries = Object.entries(orders)
    // for (const [key, vals] of entries){
    //     prevLevel = 5
    //     tmp = vals.orders.filter(function(d){ return d.date != "" && getDateObj(d.date) <= today})
    //     tmp.forEach(function(d, i){
    //         if (! ordersDate.includes(d.date) && d.date != "") ordersDate.push(d.date)
    //         d.state = key
    //         d.name = key + "-" + i
    //         d.disp = true
    //         betweenNode = {'date': d.date, 'order': prevLevel, 'state': key, 'name': key + "-" + i + '-tween', 'disp': false }
    //         prevLevel = d.order
    //         nodes_data.push(betweenNode)
    //         if (d.date != "") {
    //             if (getDateObj(d.date) <= today) nodes_data.push(d)
    //         }
    //         if (i == 0){
    //             link_data.push({
    //                "source": "master",
    //                "target": key + "-" + i + '-tween',
    //                'state': key
    //             })

    //             link_data.push({
    //                 "source": key + "-" + i + '-tween',
    //                 "target": d.name,
    //                 'state': key
    //              })

    //         }
    //         if (i < tmp.length - 1){
    //             link_data.push({
    //                 "source": d.name,
    //                 "target": key + "-" + (i+1) + "-tween",
    //                 'state': key
    //             })

    //             link_data.push({
    //                 "source": key + "-" + (i+1) + "-tween",
    //                 "target": key + "-" + (i+1),
    //                 'state': key
    //             })
    //         } else {
    //             link_data.push({
    //                 "source": d.name,
    //                 "target": "end-" + d.order,
    //                 'state': key
    //             })
    //         }

    //     })
    // }


    
    
    // nodes_data.push(
    //     {
    //         'date': dateArrayStrings[0],
    //         'order': '5',
    //         'name': 'master'
    //     },
    //     {
    //         'date': dateArrayStrings[dateArrayStrings.length-1],
    //         'order': '0',
    //         'name': 'end-0'
    //     },
    //     {
    //         'date': dateArrayStrings[dateArrayStrings.length-1],
    //         'order': '1',
    //         'name': 'end-1'
    //     },
    //     {
    //         'date': dateArrayStrings[dateArrayStrings.length-1],
    //         'order': '2',
    //         'name': 'end-2'
    //     },
    //     {
    //         'date': dateArrayStrings[dateArrayStrings.length-1],
    //         'order': '3',
    //         'name': 'end-3'
    //     },
    //     {
    //         'date': dateArrayStrings[dateArrayStrings.length-1],
    //         'order': '4',
    //         'name': 'end-4'
    //     },
    //     {
    //         'date': dateArrayStrings[dateArrayStrings.length-1],
    //         'order': '5',
    //         'name': 'end-5'
    //     }

    // )
    const dict = Object.entries(orders)
    for (const [key, vals] of dict){
        tmp = vals.orders.filter(function(d){ return d.date != "" && getDateObj(d.date) <= today})
        tmp.forEach(function(d, i){
            if (! ordersDate.includes(d.date) && d.date != "") ordersDate.push(d.date)            
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

    // dateArray.forEach(function(d, i ){
    //     dateArrayStrings.push(formatTime(d));
    // })

    //console.log(dateArray)
    for (var i=0; i < dateArray.length - dateBinning; i=i+dateBinning){
        dateArrayStrings.push(formatTime(dateArray[i]))
    }

    var yBand = d3.scaleBand()
        .domain(['0', '1', '2', '3', '4', '5'])
        .range([0, height])
        .padding(0.08)

    var x = d3.scaleBand()
        .domain(dateArrayStrings)
        .range([0, width])
        .padding(0.1)


    
    var matrix = {}
    
    yBand.domain().forEach(function(d){
        matrix[d] = {}
        x.domain().forEach(function(v){
            matrix[d][v] = []
        })
    })

    var circlePack = []
    var lineData = []
    for (const [key, vals] of dict){
        prevLevel = 5
        prevDate = x.domain()[0]
        tmp = vals.orders.filter(function(d){ return d.date != "" && getDateObj(d.date) <= today})
        tmp.forEach(function(d, i){
            if (! ordersDate.includes(d.date)) ordersDate.push(d.date)
            d.binnedDate = getClosestBin(d.date)
            d.state = key
            d.id = key + "-" + i
            //console.log(d)
            
            if (i == 0){
                matrix[String(d.order)][d.binnedDate].push({'state': d.state })                
                lineData.push({
                    'source': [x(d.binnedDate)+ x.bandwidth()/2, height],
                    'target': [x(d.binnedDate)+ x.bandwidth()/2, yBand(d.order) + yBand.bandwidth()/2],
                    'data': d,
                    'state': key,
                    'id': key + '-v-' + i
                })
                prevDate = d.binnedDate
                prevLevel = d.order
            } else if (i < tmp.length - 1){
                matrix[String(d.order)][d.binnedDate].push({'state': d.state })
                lineData.push({
                    'source': [x(prevDate)+ x.bandwidth()/2, yBand(prevLevel) + yBand.bandwidth()/2],
                    'target': [x(d.binnedDate)+ x.bandwidth()/2, yBand(prevLevel) + yBand.bandwidth()/2],
                    'state': key,
                    'data': d,
                    'id': key + '-h-' + i
                })
                lineData.push({
                    'source': [x(d.binnedDate)+ x.bandwidth()/2, yBand(prevLevel) + yBand.bandwidth()/2],
                    'target': [x(d.binnedDate)+ x.bandwidth()/2, yBand(d.order) + yBand.bandwidth()/2],
                    'state': key,
                    'data': d,
                    'id': key + '-v-' + i 
                })
                prevDate = d.binnedDate
                prevLevel = d.order
            }
            if (i >= tmp.length - 1) {
                matrix[String(d.order)][d.binnedDate].push({'state': d.state })  
                lineData.push({
                    'source': [x(prevDate)+ x.bandwidth()/2, yBand(prevLevel) + yBand.bandwidth()/2],
                    'target': [width, yBand(prevLevel) + yBand.bandwidth()/2],
                    'state': key,
                    'data': d,
                    'id': key + '-h-' + i
                })
            }
        })
    }

    //console.log(matrix)
    var circLoc = []
    var packNum = 0
    var matrixEntries = Object.entries(matrix)
    for (const [key, vals] of matrixEntries){
        
        var dataEntries = Object.entries(vals)
        for ([dateKey, dateVals] of dataEntries){
            var pack = []
            if (dateVals.length){
                circLoc.push({
                    'x': dateKey,
                    'y': key,
                    'id': dateKey + "-" + key
                })
                //master = key + "-" + dateKey.replace(new RegExp("/", "g"),"")
                master = "pack-" + packNum
                pack.push({'id': master, 'parentId': "", 'size': '', 'state': ""})                
            }
            dateVals.forEach(function(d){
                pack.push({'id': d.state + '-' + key, 'parentId': master, 'size': 10, 'state': d.state})
            })

            if (pack.length){
                circlePack.push(pack)
                
                packs.append('g')
                    .attr("id", master)
                    .attr("transform", "translate(" + (x(dateKey) + (x.bandwidth()/2 - x.bandwidth()/2 * circFraction)) + "," + (yBand(key) + (yBand.bandwidth() - yBand.bandwidth()/2 - yBand.bandwidth()/2 * circFraction)) + ")")
                packNum += 1;
            }
        }
        
    }

    // circles = svg.selectAll('circle')
    //     .data(circLoc, d=>d.id)

    // circles.enter()
    //     .append("circle")
    //     .attr("r", 15)
    //     .attr("cx", d=> x(d.x) + x.bandwidth()/2)
    //     .attr("cy", d=> yBand(d.y) + yBand.bandwidth()/2)
    //     .attr("fill", 'red')

    function getClosestBin(d){
        dateArrayStrings.forEach(function(v){
            diff = (getDateObj(d) - getDateObj(v))/ (1000*60*60*24)
            if (diff > 0 && diff <= dateBinning) bin = v
        })
        return bin
    }

 

    // var x_axis = d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ return !(i%7)})).tickPadding(10)

    var x_axis = d3.axisBottom(x)
    var y_axis = d3.axisLeft(yBand)

    var labels = svg.append("g")
    
    labels.append("g")
        .attr("class", "axis axis--y axisWhite")
        .call(y_axis)

    labels.append("g")
        .attr("class", "axis axis--y axisWhite")
        .attr("transform", "translate(0," + height + ")")
        .call(x_axis)

    var simulation = d3.forceSimulation()
        .force("forceX", d3.forceX().strength(0.5).x(function(d){
            return x(d.date)
        }))
        .force("forceY", d3.forceY().strength(0.2).y(function(d){
            return yBand(d.order) + yBand.bandwidth()/2
        }))
        .force("collide", d3.forceCollide().strength(0.2).radius(rad * 1.2).iterations(10))
        .nodes(nodes_data);

    var background = svg.append("g")
    
    var rects = background.selectAll("rect")
        .data(yBand.domain())

    rects.enter()
        .append("rect")
        .attr("class", "bg-rect")
        .attr("x", 0)
        .attr("width", width)
        .attr("y", function(d){ return yBand(d); })
        .attr("height", yBand.bandwidth())
        .attr("fill", "grey")
        .attr("opacity", 0.05)

    // var link_force =  d3.forceLink(link_data).strength(0)
    //     .id(function(d) { return d.name; })

    // simulation.force("link_data",link_force)

    // var link = svg.append("g")
    //     .attr("class", "links")
    //     .selectAll("line")
    //     .data(link_data)
    //     .enter()
    //         .append("line")
    //             .on("mouseover", mouseover)
    //             .on("mousemove", mousemove)
    //             .on("mouseout", mouseout)
    //             .on("click", clicked)
    //         .attr("id", function(d){ return "order-path-" + d.state; })
    //         .attr("stroke", defaultColor)
    //         .attr("stroke-width", strokeWidth)
    //         .attr("opacity", defaultOpacity/2)

    // var linkBg = svg.append("g")
    //     .attr("class", "link-bg")
    //     .selectAll(".bgLine")
    //     .data(link_data)
    //     .enter()
    //         .append("line")
    //             .on("mouseover", mouseover)
    //             .on("mousemove", mousemove)
    //             .on("mouseout", mouseout)
    //             .on("click", clicked)
    //         .attr("id", function(d){ return "order-path-bg-" + d.state; })
    //         .attr("stroke", defaultColor)
    //         .attr("stroke-width", strokeWidth*10)
    //         .attr("opacity", 0)

    // var node = svg.append("g")
    //     .attr("class", "nodes")
    //     .selectAll("circle")
    //     .data(nodes_data)
    //     .enter()
    //         .append("circle")
    //             .on("mouseover", mouseover)
    //             .on("mousemove", mousemove)
    //             .on("mouseout", mouseout)
    //             .on("click", clicked)
    //         .attr("id", function(d){ return "order-dot-" + d.state; })
    //         .attr("r", rad)
    //         .attr("fill", defaultColor)
    //         .attr("opacity", defaultOpacity)
    //         .attr("visibility", function(d){ return (d.disp ? 'visible' : 'hidden'); })

    //simulation.on("tick", tickActions );

    function ordersChart(){
        draw_chart();
    }

    function draw_chart(){

        var lines = svg.selectAll('line')
            .data(lineData, d=>d.id)

        lines.enter()
            .append("line")
            .attr("class", "order-lines")
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout)
                .on("click", clicked)
            .attr("id", d=> "order-path-" + d.state)
            .attr("x1", d=> d.source[0])
            .attr("x2", d=> d.target[0])
            .attr("y1", d=> d.source[1])
            .attr("y2", d=> d.target[1])
            .attr("stroke", defaultColor)
            .attr("stroke-width", 2)
            .attr("opacity", 0)

        circlePack.forEach(function(d){
            var group = d3.select("#" + d[0].id)
    
            vData = d3.stratify()(d)
            var vLyaout = d3.pack().size([x.bandwidth() * 0.7,yBand.bandwidth()* 0.7 ])
        
            var vRoot = d3.hierarchy(vData).sum(function(d){ return d.data.size})
            var vnodes = vRoot.descendants()
            vLyaout(vRoot)
        
            var vSlices = group.selectAll("circle")
                .data(vnodes)
    
            vSlices.enter()
                .append("circle")
                .attr("id", function(d){ return  "order-circle-" + d.data.data.state; })
                .attr("cx", d=> d.x)
                .attr("cy", d=> d.y)
                .attr("r",  function(d){
                    return (d.depth ? 4 : d.r ); })
                .attr("fill", function(d){
                    return (d.depth ? defaultColor : "#292a30")
                })
                .attr("opacity", function(d){
                    return (d.depth ? defaultOpacity: 1)
                })
                .attr("stroke", "#6e707d")
                .attr("stroke-width", 0.5)
        })
            

    }

    function tickActions(){
        node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        linkBg
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });        
    }

    function mouseover(d){
        console.log('mouseover' + d)
        update_highlight(d.state, 'on')
        document.body.style.cursor = "pointer"
    }

    function mousemove(d){

    }

    function mouseout(d){
        update_highlight(d.state, 'off')
        document.body.style.cursor = "default"
    }

    function display_hover(d, action){
        if (!ordersFocus.includes(d)){
            d3.selectAll("#order-circle-" + d)
                .attr("opacity", function(){ return (action == "on" ? 1 : defaultOpacity); })

            d3.selectAll("#order-path-" + d)
                .lower()
                .attr("opacity", function(){ return (action == "on" ? 1 : 0); })
        }
    }

    function clicked(d){
        if (ordersFocus.includes(d.state)) update_focus(d.state, "remove")
        else update_focus(d.state, "add")
    }
  
    function xyTransform(i){
        trans = i * 2
        if (i % 2) trans *= -1
        return "translate(" + trans + "," + trans + ")"
    }

    function add2Focus(d, i){
        if (!ordersFocus.includes(d)){
            trans = xyTransform(ordersFocus.length)
            d3.selectAll("#order-path-" + d)
                .lower()
                .attr("opacity", 1)
                .attr("stroke", color(cur_color))
                .attr("transform", trans)


            d3.selectAll("#order-circle-" +d)
                .attr("opacity", 1)
                .attr("fill", color(cur_color))
            // d3.selectAll("#order-path-bg-" + d)
            //     .raise()
            //     .attr("stroke", "#fff")
            //     .attr("opacity", 0.4)
            //     .attr("stroke-width", strokeWidth*10)
            //     .transition().duration(dur)
            //     .attr("stroke", color(cur_color))
            
            ordersFocus.push(d)
            cur_color += 1;
        }
    }

    function removeFromFocus(d, i){
        if (ordersFocus.includes(d)){
            const index = ordersFocus.indexOf(d);
            ordersFocus.splice(index, 1);
        }

        d3.selectAll("#order-dot-" + d)
            .attr("r", rad * 2)
            .attr("fill", "#fff")
            .transition().duration(dur/2)
            .attr("r", rad)
            .attr("opacity", defaultOpacity)
            .attr("fill", defaultColor)

        d3.selectAll("#order-path-" + d)
            .attr("stroke", "#fff")
            .attr("stroke-width", strokeWidth*4)
            .transition().duration(dur/2)
            .attr("opacity", defaultOpacity/2)
            .attr("stroke", defaultColor)
            .attr("stroke-width", strokeWidth)
  
    }

    function removeAll(){
        ordersFocus.forEach(function(d){
            d3.selectAll("#order-dot-" + d)
                .attr("r", rad * 2)
                .attr("fill", "#fff")
                .transition().duration(dur/2)
                .attr("r", rad)
                .attr("opacity", defaultOpacity)
                .attr("fill", defaultColor)

            d3.selectAll("#order-path-" + d)
                .attr("stroke", "#fff")
                .attr("stroke-width", strokeWidth*4)
                .transition().duration(dur/2)
                .attr("opacity", defaultOpacity/2)
                .attr("stroke", defaultColor)
                .attr("stroke-width", strokeWidth)
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

    ordersChart.F = function(value){
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


