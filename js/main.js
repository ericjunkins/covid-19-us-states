let full2abbrev = {};
let abbrev2full = {};
let line_vis;
let states_time_data;
let data_by_states;
let date_range;
let annotations;
var display_states = [];
var colors = [];
var text_locations = [];
var line_labels = [];
var parseTime = d3.timeParse("%Y%m%d");
var formatTime = d3.timeFormat("%m/%d/%y");
var selection_vis;
var circle_vis;
var ordersByState = [];

//Promises for local files to read in
var promises = [
    d3.json("data/abbreviations.json"),
    d3.json("data/stay_at_home.json"),
    d3.csv('data/regions.csv'),
    d3.csv('data/2019_us_census.csv'),
    d3.json('data/us_urban_pop.json'),
    d3.json('data/2016_election_affiliation.json')
]
Promise.all(promises).then(ready)


//Initilize buttons and dropdown menus
$("#chart-help")
    .click(function(){
        $("#logChartModal").modal();
    })
    .mouseover(function(){
        $("#chart-help-icon").css("color", "yellow").css("opacity", 1)
    })
    .mouseout(function(){
        $("#chart-help-icon").css("color", "lightsteelblue").css("opacity", 0.5)
    })

$("#bubbles-help")
    .click(function(){
        $("#bubblesModal").modal();
    })
    .mouseover(function(){
        $("#bubbles-help-icon").css("color", "yellow").css("opacity", 1)
    })
    .mouseout(function(){
        $("#bubbles-help-icon").css("color", "lightsteelblue").css("opacity", 0.5)
    })

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
        
var severityDropdown = d3.select("#severity-select")
    .on("change", dropdownChange)

var regionDropdown = d3.select("#group-select")
    .on("change", dropdownChange)

var colorDropdown = d3.select("#color-select")
    .on("change", dropdownChange)

var axesDropdown = d3.select("#axes-select")
    .on("change", dropdownChange)

function dropdownChange(){
    var id = d3.select(this).property("id");
    var sel = d3.select(this).property('value')
    if (id == "group-select"){
        bubbles_vis.groupSelector(sel)
    } 
    else if (id == "severity-select"){
        bubbles_vis.severitySelector(sel)
    } 
    else if (id == "color-select"){
        bubbles_vis.timeSelector(sel);
    } else if (id == "axes-select"){
        line_vis.axesSelector(sel);
    }
}

//Once all local data is loaded in....
function ready([abbrev, anno, regions, census, urban_pop, pol]){

    //Reorganize the data appropriately

    var duration = 1000;
    census.forEach(function(d){
        d.Population = +d.Population;
    })

    var full2abbrev = {}
    const abb_entries = Object.entries(abbrev);
        for (const [key, vals] of abb_entries){
            full2abbrev[vals] = key
    }

    var orders = anno;
    abbrev2full = abbrev;
    tmp = []
    var parseDate = d3.timeParse("%m/%d/%y")
    const anno_entries = Object.entries(anno);
    for (const [key, vals] of anno_entries){
        anno[key].date = parseDate(vals.date)
        urban_pop[key].urban = +urban_pop[key].urban
        if (vals.date != null) tmp.push({"state": full2abbrev[key], "date": formatTime(vals.date), "order": vals.order})
    }

    var ordersByDate = d3.nest()
        .key(function(d){ return d.date; })
        .entries(tmp)

    annotations = anno

    //Get historical data from API
    var request = new XMLHttpRequest()
    request.open("GET", "https://covidtracking.com/api/v1/states/daily.json", true)
    request.onload = function(){ 
        states_time_data = JSON.parse(this.response)
        
        states_time_data.forEach(function(d){
            d.date = parseTime(d.date)
            if(d.positive == null) { d.positive = 0}
            if(d.negative == null) { d.negative = 0}
            if(d.positiveIncrease == null) { d.positiveIncrease = 0}
            if(d.negativeIncrease == null) { d.negativeIncrease = 0}
            if(d.hospitalized == null) { d.hospitalized = 0}
            if(d.hospitalizedIncrease == null){d.hospitalizedIncrease = 0}
            if(d.deathIncrease == null){d.deathIncrease = 0}
            if(d.totalTestResultsIncrease == null){d.totalTestResultsIncrease = 0}
            if(d.death == null){d.death = 0}
            if(d.pending == null){d.pending = 0}
        })
        
        var current = d3.nest()
            .key(function(d){ return d.state; })
            .entries(states_time_data)

        current.forEach(function(d){
            d.values = d.values.slice(0,7);
            d.state = d.key;
            delete d.key
        })

        init_display();


        //Initialize all viz heights/widths for each chart
        let fullHeight = window.innerHeight;
        var leftRowHeight = fullHeight * 0.71
        var row1Height = fullHeight *0.39
        var row2Height = fullHeight *0.295

        lineChartWidth = parseInt(d3.select("#chart-area").style("width"), 10);
        bubblesWidth = parseInt(d3.select("#bubbles-area").style("width"), 10);
        var forcePackWidth = bubblesWidth * 0.95

        var selWidth = parseInt(d3.select("#state-selection").style("width"), 10)
        if ( selWidth <= 768){
            selHeight = fullHeight * 0.22
            rows = 4
        }
        else if ( 768 <= selWidth && selWidth <= 992) {
            selHeight = fullHeight * 0.17
            rows = 3
        }
        else{
            selHeight = fullHeight * 0.09
            rows = 2
        }

        var lineChartconfig = {
            'height': row1Height,
            'width': lineChartWidth,
            'parseDate': parseDate,
            'state_data': data_by_states,
            'anno': anno,
            'abbrev2full': abbrev2full,
            'selection': '#chart-area',
            'orderByState': ordersByState,
            'duration': duration
        }

        var bubblesConfig = {
            'height':leftRowHeight,
            'width': forcePackWidth,
            'anno': anno,
            'regions': regions, 
            'states_data': states_time_data,
            'full2abbrev': full2abbrev,
            'census':census, 
            'group': 'population',
            'severity': 'cases',
            'selection': '#northwest-region',
            'dateSelector': 'state_hundred',
            'urban': urban_pop,
            'political_aff': pol,
            'duration': duration
        }

        var ordersConfig = {
            'height': row2Height,
            'width': lineChartWidth,
            'data': ordersByDate,
            'marker': tmp,
            'raw_orders': orders,
            'full2abbrev': full2abbrev,
            'duration': duration
        }

        var selectionConfig = {
            'height':selHeight,
            'width': selWidth,
            'states_list': d3.values(abbrev),
            'selection': '#state-selection',
            'full2abbrev': full2abbrev,
            'rows': rows,
            'duration': duration
        }

        var rankingConfig = {
            'height':row1Height,
            'width': parseInt(d3.select("#ranking").style("width"), 10),
            'selection': '#ranking',
            'currentData': current,
            'duration': duration
        }

        var placeHolder2Config = {
            'height': row2Height,
            'width': parseInt(d3.select("#placeholder2").style("width"), 10),
            'selection': '#placeholder2'
        }


        //Initialize all charts with their configurations
        line_vis = line_chart(lineChartconfig);
        bubbles_vis = bubbles_chart(bubblesConfig);
        legistate_vis = orders_chart(ordersConfig)
        selector_vis = selector(selectionConfig);
        ranking_vis = ranking_chart(rankingConfig)
        placeHolder2_vis = placeholder_chart(placeHolder2Config)


        //Build each vis
        bubbles_vis();
        legistate_vis();
        line_vis();
        selector_vis();
        ranking_vis();
    }
    request.send()

    //Get current data from API
    var currendDataRequest = new XMLHttpRequest()
    currendDataRequest.open("GET", "https://covidtracking.com/api/v1/states/current.json", true)
    currendDataRequest.onload = function(){ 
        currentData = JSON.parse(this.response)
        //console.log("currentData:", currentData)
    }
    currendDataRequest.send()

}

function init_display(){
    organize_data();
}

function update_vis(f){
    // line_vis.focus(f);
    // bubbles_vis.focus(f);
    // legistate_vis.focus(f);
    //selector_vis.focus(f);
}

function update_focus(state, action){
    //Updates the Focus view of each individual chart
    selector_vis.addFocus(state, action);
    bubbles_vis.addFocus(state, action);
    line_vis.addFocus(state, action);
    legistate_vis.addFocus(state, action);
    ranking_vis.addFocus(state, action)
}

function update_highlight(state, action){
    //Updates the highlight view (mouseover) of each individual chart
    bubbles_vis.highlight(state, action)
    selector_vis.highlight(state,action)
    legistate_vis.highlight(state, action)
    line_vis.highlight(state, action)
    ranking_vis.highlight(state, action)
}

function organize_data(){
    data_by_states = d3.nest()
        .key(function(d){ return d.state; })
        .object(states_time_data)

    date_range = d3.extent(states_time_data, function(d){
        return d.date;
    })
    
    const entries = Object.entries(data_by_states);
    for (const [key, vals] of entries){
        var window = []
        
        for (var i = vals.length-1; i >= 0; i--){
            window.push(vals[i].positiveIncrease)
            if (window.length >7){
                window.shift()
            }
            var total = (window.length == 1 ? window[0] : d3.sum(window))
            data_by_states[key][i]['binnedPositiveIncrease'] = total


            if (annotations[abbrev2full[key]].date != null){
                if (vals[i].date.getTime() == annotations[abbrev2full[key]].date.getTime()){
                    ordersByState.push({
                        'state': key,
                        'binnedPositiveIncrease': vals[i].binnedPositiveIncrease,
                        'positive': vals[i].positive,
                        'orders' : { 
                                    '0' : vals[i].date
                                }
                    })
                    annotations[abbrev2full[key]]['binnedPositiveIncrease'] = vals[i].binnedPositiveIncrease
                    annotations[abbrev2full[key]]['positive'] = vals[i].positive
                    annotations[abbrev2full[key]]['annotation'] = {
                        'note': {
                            'label': abbrev2full[key],
                            'title': 'Stay at home order issued: ' + formatTime(vals[i].date)
                        },      
                        'connector': {
                            'end': "dot",
                            'endScale': 10
                        },
                        'disable': [],
                        // 'x': x(vals[i].positive),
                        // 'y': y(vals[i].binnedPositiveIncrease),
                        'dy': 0,
                        'dx': 0
                    }
                }
            }
        }
        if (annotations[abbrev2full[key]].date == null){
            annotations[abbrev2full[key]].date = parseTime("3/19/40")
            annotations[abbrev2full[key]]['binnedPositiveIncrease'] = 'banana'
            annotations[abbrev2full[key]]['positive'] = 0
            annotations[abbrev2full[key]]['annotation'] = {
                'note': {
                    'label': abbrev2full[key],
                    'title': 'None' 
                },
                'subject': {
                    'radius': 15,
                    'stroke': 10
                },
                'connector': {
                    'end': "dot",
                    'endScale': 1
                },
                'disable': ['subject, note, connector'],
                'x': -1000,
                'y': -1000,
                'dy': -30,
                'dx': -30
            }
        }

        annotations[abbrev2full[key]]['line_label'] = {
            'note': {
                'label': abbrev2full[key],
            },
            'connector': {
                'end': "dot",
                'endScale': 2
            },

            'disable': ["subject", "connector"],
            // 'x': x(1),
            // 'y': y(1),
            'dy': 0,
            'dx': 30
        }
    }
}
