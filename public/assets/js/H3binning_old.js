//10-Sept-2022 ... begin binning code
import geojson2h3 from "https://cdn.skypack.dev/geojson2h3@1.0.1";

// Config
const config = {
  lng: -120.37, //map_centre_lon, //  
  lat: 50.330, //map_centre_lat, //
  zoom: 9,
  fillOpacity: 0.6,
  colorScale: ["#ffffD9", "#50BAC3", "#1A468A"],
  h3Resolution: 8
};

// Utilities
function normalizeLayer(layer, baseAtZero = false) {
  const hexagons = Object.keys(layer);
  // Pass one, get max
  const max = hexagons.reduce(
    (max, hex) => Math.max(max, layer[hex]),
    -Infinity
  );
  const min = baseAtZero
    ? hexagons.reduce((min, hex) => Math.min(min, layer[hex]), Infinity)
    : 0;
  // Pass two, normalize
  hexagons.forEach((hex) => {
    layer[hex] = (layer[hex] - min) / (max - min);
  });
  return layer;
}

//This is one way we can invoke an module function 
const element = document.getElementById("downloadBinned");
element.addEventListener("click", function () {
  //document.getElementById("demo").innerHTML = "Hello World";
  console.log('downloadBinnedFn()')
  downloadBinnedFn();
});

//declare in the beginning
//var binnedGeoJSON;

//Maybe we have to import this function 
export function downloadBinnedFn() {

  //16-Feb-2023
  //for downloading geojson
  var downloadGeoJSON = true;
  if(downloadGeoJSON)
  {      
    console.log("Downloading GeoJSON");
    //console.log(JSON.stringify(masked.reprojected));
    //console.log("Layer deletion started");
    //delete masked.data.layer;
    
    binnedGeoJSON = JSON.parse(  JSON.stringify(binnedGeoJSON)   )
    console.log("binnedGeoJSON " + binnedGeoJSON)	
    

    saveJson(binnedGeoJSON, "binned.geojson");
    //console.log("masked.data " + JSON.parse(masked.data))									
  }

  //$("#citation").load();
  var options = {
    folder: 'BinnedData',
    types: {
      point: 'BinnedPoints',
    }
  }
  console.log("Downloading Binned Data");
  //Chrome blocks the download - so the following function only works in Mozilla
  //shpwrite.download(masked.reprojected, options);
  //as an alternative, we use most of the code from the GenerateZipOfAll() function.          
  var result = saveShapeFile(binnedGeoJSON, "binned_"); //Binned_GeoJSON); //GenerateZipOfAll();	
}

function getSliderValue(id) {
  const input = document.getElementById(id);
  const value = parseFloat(input.value);
  //console.log(`${id}: ${value}`);
  return value;
}

// Transform a kilometer measurement to a k-ring radius
function kmToRadius(km, resolution) {
  return Math.floor(km / h3.edgeLength(resolution, h3.UNITS.km));
}

function bufferPointsLinear(geojson, radius, h3Resolution) {
  const layer = {};
  geojson.features.forEach((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const stationIndex = h3.geoToH3(
      lat,
      lng,
      h3Resolution
    );
    // add surrounding multiple surrounding rings, with less weight in each
    const rings = h3.kRingDistances(stationIndex, radius);
    const step = 1 / (radius + 1);
    rings.forEach((ring, distance) => {
      ring.forEach((h3Index) => {
        layer[h3Index] = (layer[h3Index] || 0) + 1 - distance * step;
      });
    });
  });
  return normalizeLayer(layer);
}

//17-Oct-2022 New function, from stackexchange answer: https://jsbin.com/nosoyonemi/edit?html,js
function interpolateColor(value, stops, colors) {
  const index = stops.findIndex((stop) => value <= stop);
  if (index < 0) {
    return colors[colors.length - 1];
  }
  if (index === 0) {
    return colors[0];
  }
  const startColor = ol.color.asArray(colors[index - 1]);
  const endColor = ol.color.asArray(colors[index]);
  const startStop = stops[index - 1];
  const endStop = stops[index];
  const result = [0, 0, 0, 0]
  for (let i = 0; i < 4; ++i) {
    result[i] = startColor[i] + ((endColor[i] - startColor[i]) * (value - startStop) / (endStop - startStop))
  }
  return ol.color.asString(result);
}

var pointClouds; //, binnedGeoJSON;
var h3Reso;

//get raw data
/*
async function getRawData() {  //geoJSON_data
  pointClouds = await d3.json(
    "kx-site-of-significance-SHP.json"  //geoJSON_data //
  );
} 

async function getGeoJSON(){


}
*/

//retrieve the data in geojson and return it
async function getData() {
  //console.log('getData');

  //first lets get the buffer radius
  const bufferRadiusValue = getSliderValue("bufferRadius");
  //var str = JSON.stringify(bufferRadiusValue);
  //console.log('str ' + str);  //var obj = JSON.stringify(JSON.parse(str));
  //var str2 = JSON.parse(str);  //var obj = JSON.parse(str);
  //console.log('str2 ' + str2);  console.log('str2 ' + str2["weight"]);
  console.log('\tbufferRadiusValue ' + bufferRadiusValue);

  //then the original code
  const h3Resolution = config.h3Resolution;
  h3Reso = h3Resolution;
  // Data Layers
  const pointCloudslayer = normalizeLayer(
    //bufferPointsLinear(pointClouds, kmToRadius(1, h3Resolution), h3Resolution)
    //21-Oct-2022 working version
    //bufferPointsLinear(sensitive.data, kmToRadius(1, h3Resolution), h3Resolution)
    //adding buffer radius
    bufferPointsLinear(sensitive.data, kmToRadius(bufferRadiusValue, h3Resolution), h3Resolution)
  );

  var points_cloud_weight = getSliderValue("pointCloudsWeight");  
  console.log('\tpoints_cloud_weight '+ points_cloud_weight);  

  // Combining Layers
  const mapLayers = [
    { hexagons: pointCloudslayer, weight: getSliderValue("pointCloudsWeight") }
  ];

  const combinedLayers = {};
  mapLayers.forEach(({ hexagons, weight }) => {
    Object.keys(hexagons).forEach((hex) => {
      combinedLayers[hex] =
        (combinedLayers[hex] || 0) + hexagons[hex] * weight;
    });
  });
  return combinedLayers;
}

//16 Feb 2023 more binned layer 
//retrieve the data in geojson and return it
async function getData_more_binned_layer() {
  //first lets get the buffer radius
  const bufferRadiusValue = getSliderValue("bufferRadius");   
  buffer_radius_more = bufferRadiusValue * 2; //have it as twice and set the value in dstools.js
  //make sure the buffer radius is less than 1
  if (buffer_radius_more >= 1) 
    buffer_radius_more = 0.99;
  console.log('\tbufferRadiusValue_more ' + buffer_radius_more); 

  //Resolution is just the map zoom value. then the original code
  const h3Resolution = config.h3Resolution; // * 2;  //have it as twice
  //console.log('h3resolution_more '+ h3resolution_more);
  h3Reso = h3Resolution;
  
  // Data Layers
  const pointCloudslayer = normalizeLayer(    
    //adding buffer radius
    bufferPointsLinear(sensitive.data, kmToRadius(bufferRadiusValue, h3Resolution), h3Resolution)
  );

  // Combining Layers
  // This is the main Hexabinning value. Ensure its more than 0, in that case 0 - the last value
  var points_cloud_weight_more = getSliderValue("pointCloudsWeight");
  //h3resolution_more = h3Resolution; //set this in dstools.js
  points_cloud_weight_more = points_cloud_weight_more / 2;
  if (points_cloud_weight_more <= 0) 
      points_cloud_weight_more = 0;  
  console.log('\tpoints_cloud_weight_more '+ points_cloud_weight_more);

  const mapLayers = [
    { hexagons: pointCloudslayer, weight: points_cloud_weight_more }
  ];

  const combinedLayers = {};
  mapLayers.forEach(({ hexagons, weight }) => {
    Object.keys(hexagons).forEach((hex) => {
      combinedLayers[hex] =
        (combinedLayers[hex] || 0) + hexagons[hex] * weight;
    });
  });
  return combinedLayers;
}


// Map Rendering

function init() {
  console.log("init");

  const style = {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap Contributors",
        maxzoom: 19
      }
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm" // This must match the source key above
      }
    ]
  };

 /* 
  const map = new ol.Map({
    //target: document.getElementById("mapContainer"),
    target: document.getElementById("mapContainer"),
    view: new ol.View({
      center: ol.proj.fromLonLat([config.lng, config.lat]),
      zoom: config.zoom + 1,
    }),
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
      vectorLayer,
    ]
  });
*/  
console.log('Initialising initial hexabiining map canvas');
  const map = new mapboxgl.Map({
    container: document.getElementById("mapContainer"),
    center: [config.lng, config.lat],
    zoom: config.zoom,
    style,
    touchPitch: false
  });
  
  //map.setCenter(coords);
 // map.setCenter([ -120.37 , 50.690]);
  
  //attach an event listener 
  map.on("load", async () => {
    console.log("map load");
    //map.resize();
    //await getRawData();
    
    refreshMap(map);

    const inputs = document.getElementsByTagName("input");
    for (let input of inputs) {
      input.addEventListener("change", () => {
        refreshMap(map);
      });
    }  
    
    //21-Feb 2023 attach an event listener to the display button so the 
    //This is one way we can invoke an module function. 20 Feb 2023.
    const element2 = document.getElementById("displayMap");
    element2.addEventListener("click", function () {
      //document.getElementById("demo").innerHTML = "Hello World";
      console.log('display button event listener Fn()')
      //downloadBinnedFn();
      //refreshMap_verification(map);

      console.log(' here 23')
      //map.setCenter([ map_centre_lon , map_centre_lat ]);
      //map.setCenter([ -120.37 , 60.690]);

      if (maskingFlag === 'true') {
        console.log("Masking ");
        //update_map_centre()
      }
			else{
        console.log("Binning "); 
        update_map_centre(map);
      } 

      /*
			if (masking === 'true') {
				// If the binning map canvas is shown, for some reason, then just to make sure hide the binning map canvas if its shown
				$("#Binning").fadeOut("slow");			//Hide Binning div 
				$("#map").fadeIn("slow");				//Show Map for halo masking  
				// wait for the divs to be set
				delay(1000).then(() => console.log('ran after 1 second passed'));
				
				console.log("Masking ");
				//console.log('decryptedGEOJSON' + decryptedGEOJSON);	
				decryptedGEOJSON = JSON.parse(decryptedGEOJSON)
				toMap2(decryptedGEOJSON, sensitive.style);
			}
			else{
				console.log("Binning ");
				// The masking map canvas is shown by default, so we just hide it 
				$("#Masking").fadeOut("slow");      //Hide Halo masking div 
				$("#map").fadeOut("slow");			//Hide Map for halo masking - lies outside the multi-step
				// Now lest show the bining map canvas
				$("#mapContainer").fadeIn("slow");	//Show Map for binning in OL	- lies outside the multi-step				
				//$("#Binning").fadeIn("slow");       //Show Binning div
				console.log("Binning ");
        
        refreshMap_verification(map);
        map.updateSize(); 
			}  
      */
    });


  });

  //attach an event listener 
  /* map.on("refresh", async () => {
    console.log("map refresh");
       
  });
  map.on('click', (e) => {
    map.flyTo({
      center:  [-120.37, 60.330] // e.features[0].geometry.coordinates
    });
  });  */

  
}

export function update_map_centre(map){
  //map.setCenter([ -120.37 , 50.690]);
  console.log(' update_map_centre() safeguard')
  map.setCenter([ map_centre_lon , map_centre_lat ]);
}

//For Binning, we add an initial layer to the map, using the selected OpenLayers style
// call this when user chooses slider from masking to binning,and display the uploaded layer
export function AddHexBinningLayertoMap(binnedGeoJSON, styleChoice) {
  console.log("A")
  //map.removeLayer(sourceGeoJSON.layer);
  var source = new ol.source.Vector({
    features: (new ol.format.GeoJSON()).readFeatures(binnedGeoJSON, { featureProjection: 'EPSG:3857' })
  });

  binnedGeoJSON.layer = new ol.layer.Tile({
    //zIndex: 9,
    //renderMode: 'image',
    source: new ol.source.OSM(),
    //style: styleChoice
    vectorLayer
  });

  map.addLayer(binnedGeoJSON.layer);
  var extent = sensitive.data.layer.getSource().getExtent();
  console.log('extent:' + extent)
  map.getView().fit(extent, { size: map.getSize(), maxZoom: 13 });
}

//this function is used during safeguarding
async function refreshMap(map) {
  //console.log('refreshMap');
  //getData function read the slider values, does the computation, bins, and returns the geojson
  const combinedLayers = await getData();
  //16 Feb 2022 .. compute the values for a more binned layer
  const combinedLayers_more = await getData_more_binned_layer()

  // take the map and hexagon, transform the hexagon map into geojson and display
  renderHexes(map, combinedLayers, combinedLayers_more);
  //renderHexes_from_loaded_geojson(map, combinedLayers, combinedLayers_more);
  console.log('Map Refreshed');
  //temp - just to see if download works
  //downloadBinnedFn();

  //14-Dec-2022. Count the number of points uin each cell
  //console.log('h3Reso ' + h3Reso);
  //console.log('BinnedGeoJSON Before Counting ' + JSON.stringify(binnedGeoJSON)  );
  //binnedGeoJSON = countPoints_try(binnedGeoJSON, h3Reso);
  //console.log('bBinnedGeoJSON After Counting ' + JSON.stringify(binnedGeoJSON))

  //enable continue button
  document.getElementById("thirdnextaction-button").disabled = false;
}

//20 Feb 2023 this function is used fr verification
/*
async function refreshMap_verification(map) {
  console.log('verification refreshMap() fn')
  //renderHexes_from_loaded_geojson(map);

  //console.log('refreshMap');
  //getData function read the slider values, does the computation, bins, and returns the geojson
  const combinedLayers = await getData();
  //16 Feb 2022 .. compute the values for a more binned layer
  //const combinedLayers_more = await getData_more_binned_layer()

  // take the map and hexagon, transform the hexagon map into geojson and display
  //renderHexes(map, combinedLayers, combinedLayers_more);
  renderHexes_from_loaded_geojson(map, combinedLayers, combinedLayers_more);
  console.log('Map Refreshed');
  //temp - just to see if download works
  //downloadBinnedFn();

  //14-Dec-2022. Count the number of points uin each cell
  console.log('h3Reso ' + h3Reso);
  //console.log('BinnedGeoJSON Before Counting ' + JSON.stringify(binnedGeoJSON)  );
  //binnedGeoJSON = countPoints_try(binnedGeoJSON, h3Reso);
  //console.log('bBinnedGeoJSON After Counting ' + JSON.stringify(binnedGeoJSON))

  //enable continue button
  document.getElementById("thirdnextaction-button").disabled = false;
} 
*/

// Old function

function renderHexes(map, hexagons, hexagons_more_binned) {
  //console.log("renderHexes");

  // Transform the current hexagon map into a GeoJSON object
  // const geojson = geojson2h3.h3SetToFeatureCollection(
  
  binnedGeoJSON = geojson2h3.h3SetToFeatureCollection(
    Object.keys(hexagons),
    (hex) => ({ value: hexagons[hex] })
  );
  
  //binnedGeoJSON = getGeoJSON()

  //16-Feb-2023...second, mre binned layer - only for storing in outer layer of encrypted volume, not for display
  binnedGeoJSON_more = geojson2h3.h3SetToFeatureCollection(
    Object.keys(hexagons_more_binned),
    (hex) => ({ value: hexagons_more_binned[hex] })
  );

  const sourceId = "h3-hexes";
  const layerId = `${sourceId}-layer`;
  let source = map.getSource(sourceId);

  // Add the source and layer if we haven't created them yet
  if (!source) {
    map.addSource(sourceId, {
      type: "geojson",
      data: binnedGeoJSON, //geojson,
    });
    map.addLayer({
      id: layerId,
      source: sourceId,
      type: "fill",
      interactive: false,
      paint: {
        "fill-outline-color": "rgba(0,0,0,0)",
      },
    });
    source = map.getSource(sourceId);

    //10-Oct-2022
    //console.log('begin tomap1')
    //toMap(binnedGeoJSON, sensitive.style)
    //console.log('end tomap1')

  }

  // Update the geojson data
  source.setData(binnedGeoJSON); //geojson);
  //10-Oct-2022
  //console.log('begin tomap2')
  //toMap(binnedGeoJSON, sensitive.style)
  //$$$$newMap(binnedGeoJSON);
  //console.log('end tomap2')

  //14-October-2022. final geojson data to be encrypted
  //Binned_GeoJSON = binnedGeoJSON;

  // Update the layer paint properties, using the current config values
  map.setPaintProperty(layerId, "fill-color", {
    property: "value",
    stops: [
      [0, config.colorScale[0]],
      [0.5, config.colorScale[1]],
      [1, config.colorScale[2]],
    ],
  });

  map.setPaintProperty(layerId, "fill-opacity", config.fillOpacity);  
}

//#########################
//Temp delete  16 Feb 2023

// return json data from any file path (asynchronous)
/*
function getJSON(path) {
  //const spinner = document.querySelector('.spinner-border');
  //spinner.hidden = false;
  return fetch(path).then(response => response.json());
}
*/

//okay to delete now
/*
function renderHexes_from_loaded_geojson(map) {
  console.log('renderHexes_from_loaded_geojson() fn')
  
  //can use a better way here using xhr https://stackoverflow.com/questions/12460378/how-to-get-json-from-url-in-javascript
  $.getJSON('binned.geojson', function(data) {
    
    binnedGeoJSON = JSON.parse(JSON.stringify(data))
    console.log('binned.geojson: ' + binnedGeoJSON)

    const sourceId = "h3-hexes";
    const layerId = `${sourceId}-layer`;
    let source = map.getSource(sourceId);

    // Add the source and layer if we haven't created them yet
    if (!source) {
      map.addSource(sourceId, {
        type: "geojson",
        data: binnedGeoJSON, //geojson,
      });
      map.addLayer({
        id: layerId,
        source: sourceId,
        type: "fill",
        interactive: false,
        paint: {
          "fill-outline-color": "rgba(0,0,0,0)",
        },
      });
      source = map.getSource(sourceId);
    }

    // Update the geojson data
    source.setData(binnedGeoJSON); //geojson);
    //10-Oct-2022
    //console.log('begin tomap2')
    //toMap(binnedGeoJSON, sensitive.style)
    newMap(binnedGeoJSON);
    //console.log('end tomap2')

    //14-October-2022. final geojson data to be encrypted
    //Binned_GeoJSON = binnedGeoJSON;

    // Update the layer paint properties, using the current config values
    map.setPaintProperty(layerId, "fill-color", {
      property: "value",
      stops: [
        [0, config.colorScale[0]],
        [0.5, config.colorScale[1]],
        [1, config.colorScale[2]],
      ],
    });

    map.setPaintProperty(layerId, "fill-opacity", config.fillOpacity);
  });  
}
*/
//END #########################

init();

/*
function countPoints_try(geojson, h3Resolution) {
  const layer = {};
  geojson.features.forEach(feature => {
    const [lng, lat] = feature.geometry.coordinates;
    const h3Index = h3.geoToH3(lat, lng, h3Resolution);
    layer[h3Index] = (layer[h3Index] || 0) + 1;
  });
  return geojson; //normalizeLayer(geojson, true);
}

//function _8(md){return(
// `We have several options for transforming the point layer to H3 indexes with associated values. The simplest is just to count the number of stations in each hexagon.`
//)}

//function _countPoints(h3,h3Resolution,normalizeLayer)
// {return(
function countPoints(geojson, h3Resolution) {
  const layer = {};
  geojson.features.forEach(feature => {
    const [lng, lat] = feature.geometry.coordinates;
    const h3Index = h3.geoToH3(lat, lng, h3Resolution);
    layer[h3Index] = (layer[h3Index] || 0) + 1;
  });
  return normalizeLayer(layer, true);
}
*/

 // )}

//New function rom answer
// Map Rendering
/*
//function init() {
  console.log("init");

  const outlineColor = 'rgba(0,0,0,0)';
  const style = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: outlineColor,
      width: 1,
    }),
    fill: new ol.style.Fill(),
  });

  console.log("style");

  const vectorLayer = new ol.layer.Vector({
    style: (feature) => {
      console.log("vectorLayer");
      const value = feature.get('value');
      style.getFill().setColor(interpolateColor(value, [0, 0.5, 1], config.colorScale))
      return style;
    },
    opacity: config.fillOpacity,
  });

  console.log("after style");

  const map = new ol.Map({
    //target: document.getElementById("mapContainer"),
    target: document.getElementById("mapOL"),
    view: new ol.View({
      center: ol.proj.fromLonLat([config.lng, config.lat]),
      zoom: config.zoom + 1,
    }),
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
      vectorLayer,
    ]
  });

  //map.addLayer(vectorLayer);
  map.once("rendercomplete", async () => {
    console.log("map load");

    await getRawData();

    refreshMap(vectorLayer);

    const inputs = document.getElementsByTagName("input");
    for (let input of inputs) {
      input.addEventListener("change", () => {
        console.log("event listener")
        refreshMap(vectorLayer);
      });
    }

    // const input = document.getElementsById("input").value;
    // //for (let input of inputs) {
    //   input.addEventListener("change", () => {
    //     refreshMap(vectorLayer);
    //   });
    // //}


    // On your js script
    var range_slider = document.getElementById("pointCloudsWeight");
    range_slider.addEventListener('change', function() {
        if (this.value > 0) {
            //alert("Range Slider has value of " + this.value);
            document.getElementById("test_id").style.display = 'block';

        } else{
            //alert("Range Slider has value of " + this.value);
            document.getElementById("test_id").style.display = 'none';
        }
    });

  });
}
*/

// new function
/*
function renderHexes(vectorLayer, hexagons) {
  console.log("renderHexes");

  // Transform the current hexagon map into a GeoJSON object
  const geojson = geojson2h3.h3SetToFeatureCollection(
    Object.keys(hexagons),
    (hex) => ({ value: hexagons[hex] })
  );

  const features = new ol.format.GeoJSON().readFeatures(geojson, {
    featureProjection: 'EPSG:3857'
  });

  const vectorSource = new ol.source.Vector({ features: features });
  vectorLayer.setSource(vectorSource);
}
*/