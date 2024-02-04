// create the tile layers for the background
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// grayscale layer
var grayscale = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'

});

// water color layer
var waterColor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', {
	minZoom: 1,
	maxZoom: 16,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'jpg'
});


// topography layer
var topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make a map object
let basemaps = {
    GreyScale: grayscale,
    "Water Color": waterColor,
    "Topography": topoMap,
    Default: defaultMap
};

// make a map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 5,
    layers: [defaultMap, grayscale, waterColor, topoMap]
});

// add the default map to the map
defaultMap.addTo(myMap);


// get data for tectonic plates
// variable to hold tectonic plates layer
let tectonicPlates = new L.layerGroup();

// call the API to get info for the plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    // console log to make sure date loas
    // console.log(plateData);

    // load data using geojson and add to tect plates layer
    L.geoJson(plateData,{
            // add styling 
            color: "yellow",
            weight: 1
    }).addTo(tectonicPlates);
});

// add plates to map
tectonicPlates.addTo(myMap);

// variable to hold earthquake layer
let earthquakes = new L.layerGroup();

// get eathquake data
// call to USGS GeoJSON API 
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
    function(earthquakeData){
        // making sure data loaded
        console.log(earthquakeData);
        // plot circles where radiuso is dependent on magn 
        // and color is dependent on depth

        // make a function that chooses color
        function dataColor(depth){
            if (depth > 90)
                return "red";
            else if (depth > 70)
                return "#fc49030";
            else if (depth > 50)
                return "#fc8403";
            else if (depth > 30)
                return "#fcad03";
            else if (depth > 10)
                return "#cafc03";
            else
                return "green";
        }

        // make a function that determines radius size
        function radiusSize(mag){
            if (mag == 0)
                return 1;
            else
                return mag * 5;
        }

        // add on to the style for each data pt
        function dataStyle(feature)
        {
            return{
                opacity: 0.5,
                fillOpacity: 0.5,
                fillColor: dataColor(feature.geometry.coordinates[2]),
                color: "000000",
                radius: radiusSize(feature.properties.mag),
                weight: 0.5,
                stroke: true
            }
        }

        // add the GeoJSON data
        L.geoJson(earthquakeData, {
            // make ea feature a marker
            pointToLayer: function(feature, latLng) {
                return L.circleMarker(latLng);
            },
            // set style for ea marker
            style: dataStyle,
            // add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                                Location: <b>${feature.properties.place}</b>`);
            }
        }).addTo(earthquakes);
    }
);

// add eq layer to map
earthquakes.addTo(myMap);

// add overlays
let overlays = {
    "Tectonic Plates": tectonicPlates,
    "Earthquake Data": earthquakes
};

// add the Layer control
L.control
    .layers(basemaps, overlays)
    .addTo(myMap);

//add the legend to map
let legend = L.control({
    position: "bottomright"
});

// add properties of legend
legend.onAdd = function() {
    // div for legend to appear
    let div = L.DomUtil.create("div", "info legend");

    // set up intervals
    let intervals = [-10, 10, 30, 50, 70, 90];
    // set interval colors
    let colors = [
        "green",
        "#cafc03",
        "#fcad03",
        "#fc8403",
        "#fc49030",
        "red"
    ];

    // loop through intervals and color, generate label
    // w/ colred square for ea label
    for(var i = 0; i < intervals.length; i++)
    {
        // inner html that sets square for ea int & label
        div.innerHTML += "<i style='background: "
            + colors[i]
            + "'></i>"
            + intervals[i]
            + (intervals[i + 1] ? "km &ndash km;" + intervals[i + 1] + "km<br>" : "+");
    }

    return div;
};

// add legend to map
legend.addTo(myMap);