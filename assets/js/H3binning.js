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

//Maybe we have to import this function 
export function downloadBinnedFn() {
  //16-Feb-2023 for downloading geojson
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
      lat, lng, h3Resolution
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

//retrieve the data in geojson and return it
async function getData() {
  //console.log('getData');

  //first lets get the buffer radius
  const bufferRadiusValue = getSliderValue("bufferRadius");
  console.log('\tbufferRadiusValue ' + bufferRadiusValue);

  //then the original code
  const h3Resolution = config.h3Resolution;
  h3Reso = h3Resolution;
  // Data Layers
  const pointCloudslayer = normalizeLayer(
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
  if (points_cloud_weight_more < 0) //ensure within bounds
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

  console.log('Initialising initial hexabiining map canvas');
  const map = new mapboxgl.Map({
    container: document.getElementById("mapContainer"),
    center: [config.lng, config.lat],
    zoom: config.zoom,
    style,
    touchPitch: false
  });
  
  //attach an event listener 
  map.on("load", async () => {
    console.log("map load");
    
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
      console.log('display button event listener Fn()')
      
      if (maskingFlag === 'true') {
        console.log("Masking ");
      }
			else{
        console.log("Binning "); 
        update_map_centre(map);
      }
    });
  });  
}

export function update_map_centre(map){
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
  //getData function read the slider values, does the computation, bins, and returns the geojson
  const combinedLayers = await getData();
  //16 Feb 2022 .. compute the values for a more binned layer
  const combinedLayers_more = await getData_more_binned_layer()

  // take the map and hexagon, transform the hexagon map into geojson and display
  renderHexes(map, combinedLayers, combinedLayers_more);
  //renderHexes_from_loaded_geojson(map, combinedLayers, combinedLayers_more);
  console.log('Map Refreshed');
  //to see if download works
  //downloadBinnedFn();
  
  //enable multi-step  continue button
  document.getElementById("thirdnextaction-button").disabled = false;
}

// Old function
function renderHexes(map, hexagons, hexagons_more_binned) {
  // Transform the current hexagon map into a GeoJSON object
  binnedGeoJSON = geojson2h3.h3SetToFeatureCollection(
    Object.keys(hexagons),
    (hex) => ({ value: hexagons[hex] })
  );
  
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
    
  }

  // Update the geojson data
  source.setData(binnedGeoJSON); 
  
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

init();