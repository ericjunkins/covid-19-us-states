let full2abbrev = {};
let abbrev2full = {};
let states_vis;
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

var promises = [
    d3.json("data/abbreviations.json"),
    d3.json("data/stay_at_home.json"),
    d3.csv('data/regions.csv'),
    d3.csv('data/2019_us_census.csv'),
    d3.json('data/us_urban_pop.json'),
    d3.json('data/2016_election_affiliation.json')
]

var table = document.getElementById("selection-table")

Promise.all(promises).then(ready)

        
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
        states_vis.axesSelector(sel);
    }
    //console.log(d3.select(this).property('value'))
}

function ready([abbrev, anno, regions, census, urban_pop, pol]){
    census.forEach(function(d){
        d.Population = +d.Population;
    })

    var full2abbrev = {}
    const abb_entries = Object.entries(abbrev);
        for (const [key, vals] of abb_entries){
            full2abbrev[vals] = key
    }

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
    var request = new XMLHttpRequest()
    request.open("GET", "https://covidtracking.com/api/states/daily", true)
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

        let fullHeight = window.innerHeight;
        chartWidth = parseInt(d3.select("#chart-area").style("width"), 10);
        var allStatesConfig = {
            'height':fullHeight * 0.44,
            'width': chartWidth,
            'parseDate': parseDate,
            'state_data': states_time_data,
            'anno': anno,
            'abbrev2full': abbrev2full,
            'duration': 250,
            'selection': '#slip-chart'
        }

        currentWidth = parseInt(d3.select("#bubbles-area").style("width"), 10);
        var forcePackWidth = currentWidth * 0.9

        var bubblesConfig = {
            'height':fullHeight * 0.8,
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
            'political_aff': pol
        }

        var legistateConfig = {
            'height':fullHeight * 0.40,
            'width': chartWidth,
            'data': ordersByDate,
            'marker': tmp
        }

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
            selHeight = fullHeight * 0.1
            rows = 2
        } 
        console.log('selHeight', selHeight)
        var selectionConfig = {
            'height':selHeight,
            'width': selWidth,
            'states_list': d3.values(abbrev),
            'selection': '#state-selection',
            'full2abbrev': full2abbrev,
            'rows': rows
        }


        states_vis = states_chart(allStatesConfig);
        bubbles_vis = forcePack(bubblesConfig);
        legistate_vis = legistate_chart(legistateConfig)
        selector_vis = selector(selectionConfig);
        bubbles_vis();
        init_display();
        legistate_vis();
        states_vis();
        selector_vis();
    }
    request.send()
}

function init_display(){
    organize_data();
}

function update_vis(f){
    states_vis.focus(f);
    bubbles_vis.focus(f);
    legistate_vis.focus(f);
    selector_vis.focus(f);
}

function organize_data(){
    data_by_states = d3.nest()
        .key(function(d){ return d.state; })
        .object(states_time_data)

    date_range = d3.extent(states_time_data, function(d){
        return d.date;
    })

    var x = states_vis.x(),
        y = states_vis.y()
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
                        'x': x(vals[i].positive),
                        'y': y(vals[i].binnedPositiveIncrease),
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
            'x': x(1),
            'y': y(1),
            'dy': 0,
            'dx': 30
        }
    }
}


function selection_init(){
    selection_vis.states(d3.keys(data_by_states))
    selection_vis();
}