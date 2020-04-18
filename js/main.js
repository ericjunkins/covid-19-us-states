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
    d3.csv('data/2019_us_census.csv')
]

var table = document.getElementById("selection-table")

Promise.all(promises).then(ready)



var sliderTime = d3.sliderBottom()
    .step(1000 * 60 * 60 * 24)
    .height(100)
    .fill('#616161')
    .width(1000)
    .step(86400000)
    .on('onchange', val=> {
        d3.select('p#value-time').text(formatTime(val));
        //sliderTime.displayValue(formatTime(val));
        update_vis();
    })

var gTime = d3.select('div#slider-time')
    .append('svg')
        .attr('width', 1300)
        .attr('height', 150)
        .append('g')
            .attr("class", "slider-tick")
            .attr('transform', 'translate(250,75)')
        
var severityDropdown = d3.select("#severity-select")
    .on("change", dropdownChange)

var regionDropdown = d3.select("#group-select")
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
    //console.log(d3.select(this).property('value'))
}



function ready([abbrev, anno, regions, census]){
    census.forEach(function(d){
        d.Population = +d.Population;
    })
    var full2abbrev = {}
    const abb_entries = Object.entries(abbrev);
        for (const [key, vals] of abb_entries){
            full2abbrev[vals] = key
    }

    abbrev2full = abbrev;
    var parseDate = d3.timeParse("%m/%d/%y")
    const anno_entries = Object.entries(anno);
    for (const [key, vals] of anno_entries){
        anno[key].date = parseDate(vals.date)
    }
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
        var allStatesConfig = {
            'height':600,
            'width': 1300,
            'parseDate': parseDate,
            'state_data': states_time_data,
            'anno': anno,
            'abbrev2full': abbrev2full,
            'duration': 250,
            'selection': '#slip-chart'
        }
        var selectionConfig = {
            'height':700,
            'width': 300,
            'selection': '#state-selection'
        }

        var forcePackWidth = 500,
            forcePackHeight = 700
        var bubblesConfig = {
            'height':forcePackHeight,
            'width': forcePackWidth,
            'anno': anno,
            'regions': regions, 
            'states_data': states_time_data,
            'full2abbrev': full2abbrev,
            'census':census, 
            'group': 'population',
            'severity': 'cases',
            'selection': '#northwest-region'
        }
        
        var southConfig = {
            'height':forcePackHeight,
            'width': forcePackWidth,
            'anno': anno,
            'regions': regions, 
            'states_data': states_time_data,
            'full2abbrev': full2abbrev,
            'regionFilter': 'South',
            'selection': '#south-region'
        }
        var westConfig = {
            'height':forcePackHeight,
            'width': forcePackWidth,
            'anno': anno,
            'regions': regions, 
            'states_data': states_time_data,
            'full2abbrev': full2abbrev,
            'regionFilter': 'West',
            'selection': '#west-region'
        }
        var midwestConfig = {
            'height':forcePackHeight,
            'width': forcePackWidth,
            'anno': anno,
            'regions': regions, 
            'states_data': states_time_data,
            'full2abbrev': full2abbrev,
            'regionFilter': 'Midwest',
            'selection': '#midwest-region'
        }
        var otherConfig = {
            'height':forcePackHeight,
            'width': forcePackWidth,
            'anno': anno,
            'regions': regions, 
            'states_data': states_time_data,
            'full2abbrev': full2abbrev,
            'regionFilter': 'Other',
            'selection': '#other-region'
        }


        states_vis = states_chart(allStatesConfig);
        selection_vis = stateSelector(selectionConfig);
        bubbles_vis = forcePack(bubblesConfig);
        // south_vis = forcePack(southConfig)
        // west_vis = forcePack(westConfig)
        // midwest_vis = forcePack(midwestConfig)
        // other_vis = forcePack(otherConfig)
        bubbles_vis();
        // south_vis();
        // midwest_vis();
        // west_vis();
        // other_vis();
        init_display();
        selection_init();
        update_vis();
    }
    request.send()
}

function init_display(){
    organize_data();
    init_slider();
}

function update_vis(){
    states_vis.curTime(sliderTime.value())
    states_vis.colors(selection_vis.colors())
    states_vis.display_states(selection_vis.display_states());
    states_vis();
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
            if (window.length >4){
                window.shift()
            }
            var total = (window.length == 1 ? window[0] : d3.sum(window) )
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
                            'endScale': 8
                        },
                        'disable': [],
                        'x': x(vals[i].positive),
                        'y': y(vals[i].binnedPositiveIncrease),
                        'dy': -50,
                        'dx': -50
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

function init_slider(){
    date_range = d3.extent(states_time_data, function(d){
        return d.date;
    })
    sliderTime
        .min(date_range[0])
        .max(date_range[1])
        .ticks(data_by_states["NY"].length/2)
        .default(date_range[0])

    gTime.call(sliderTime);
    d3.select('p#value-time').text(formatTime(sliderTime.value()));
}

function selection_init(){
    selection_vis.states(d3.keys(data_by_states))
    selection_vis();
}