function placeholder_chart(config){
    var margin = { left:120, right:60, top:30, bottom:80 }

    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    
    // append the svg object to the body of the page
    var svg = d3.select(config.selection)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    
    function placeHolder(){
        draw_chart();
    }

    function draw_chart(data){

    }
    

    placeHolder.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return placeHolder;
    }

    placeHolder.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return placeHolder;
    }



    return placeHolder;
}


