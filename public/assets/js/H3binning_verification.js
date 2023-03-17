//10-Sept-2022 ... begin binning code
import geojson2h3 from "https://cdn.skypack.dev/geojson2h3@1.0.1";

// Config
const config = {
  lng: -120.37, //map_centre_lon, //  
  lat: 50.690, //map_centre_lat, //
  zoom: 9,
  fillOpacity: 0.6,
  colorScale: ["#ffffD9", "#50BAC3", "#1A468A"],
  h3Resolution: 8
};

//for storing the maps centre
var map_centre_lon, map_centre_lat;

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

function getSliderValue(id) {
  const input = document.getElementById(id);
  const value = parseFloat(input.value);
  console.log(`${id}: ${value}`);
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

var h3Reso;

//retrieve the data in geojson and return it
async function getData() {
  //console.log('getData');

  var dummy_geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -120.48982202423585,
                    50.7748873
                ]
            },
            "properties": {
                "Join_Cou": 1,
                "TARGET_F": 27524,
                "LON": -120.3416369,
                "LAT": 50.7748873,
                "NUMBER": 823,
                "STREET": "ORCREST DR",
                "UNIT": "",
                "CITY": "",
                "DISTRICT": "",
                "REGION": "",
                "POSTCODE": "",
                "ID": "",
                "HASH": "c92deebce6b0242e",
                "DBUID": 59330166009,
                "PRUID": "59",
                "POP2016": 64,
                "area": 0.0550664962795,
                "POPDENSI": 1162.23119908,
                "quintile": 1
            }
        }
    ],
    "fileName": "all_clusters_kamloops"
}

  //first lets get the buffer radius
  const bufferRadiusValue = getSliderValue("bufferRadius");
  //var str = JSON.stringify(bufferRadiusValue);
  //console.log('str ' + str);  //var obj = JSON.stringify(JSON.parse(str));
  //var str2 = JSON.parse(str);  //var obj = JSON.parse(str);
  //console.log('str2 ' + str2);  console.log('str2 ' + str2["weight"]);
  console.log('bufferRadiusValue ' + bufferRadiusValue);

  //then the original code
  const h3Resolution = config.h3Resolution;
  h3Reso = h3Resolution;
  // Data Layers
  const pointCloudslayer = normalizeLayer(
    //bufferPointsLinear(pointClouds, kmToRadius(1, h3Resolution), h3Resolution)
    //21-Oct-2022 working version
    //bufferPointsLinear(sensitive.data, kmToRadius(1, h3Resolution), h3Resolution)
    //adding buffer radius
    bufferPointsLinear(dummy_geojson, kmToRadius(bufferRadiusValue, h3Resolution), h3Resolution)
  );

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
    //map.resize();
    //await getRawData();
    
    refreshMap_verification(map);

    const inputs = document.getElementsByTagName("input");
    for (let input of inputs) {
      input.addEventListener("change", () => {
        //refreshMap(map);
        refreshMap_verification(map);
      });
    } 
    
    //This is one way we can invoke an module function. 20 Feb 2023.
    const element2 = document.getElementById("displayMap");
    element2.addEventListener("click", function () {
      //document.getElementById("demo").innerHTML = "Hello World";
      console.log('displayMap Fn()')
      //downloadBinnedFn();
      //refreshMap_verification(map);

      //get the masking flag
      verification_masking_flag = verification_masking_flag.replace("\n", "");
			console.log("verification_masking_flag (" + verification_masking_flag + ")");
			var masking = verification_masking_flag; //flag read from the encrypted file

      console.log('levelToDec_global ' + levelToDec_global)

      //we show the original map in openlayers also, regardless if binning was performed  
			if (masking === 'true' || levelToDec_global == 1) {
				console.log('masking === true || levelToDec_global == 1')
        // If the binning map canvas is shown, for some reason, then just to make sure hide the binning map canvas if its shown
				$("#Binning").fadeOut("slow");			//Hide Binning div 
        $("#mapContainer").fadeOut("slow");	//Hide Binning div 
				$("#map").fadeIn("slow");				    //Show Map for halo masking  
				// wait for the divs to be set
				delay(1000).then(() => console.log('ran after 1 second passed'));
				
				console.log("Masking ");
				//console.log('decryptedGEOJSON' + decryptedGEOJSON);	
				decryptedGEOJSON = JSON.parse(decryptedGEOJSON)

        var style;  //we change colors for diplaying different datasets
        if (levelToDec_global == 1) //original map, show the original red cordinates
          style = sensitive.style;
        else if(levelToDec_global == 2) //masked map, show the blue cordinates
          style = masked.style;
        else if (levelToDec_global == 3) //more masked map, show the green cordinates
          style = maskedMore.style;
        //show the openlayers map  
			  toMap2(decryptedGEOJSON, style);
        map.updateSize(); //update size
			}
			else{
				console.log("Binning ");
				
        binnedGeoJSON = JSON.parse(decryptedGEOJSON)
        console.log('Verification map get centre : ' + binnedGeoJSON);					
        
        //get centre    
        var center = turf.center(binnedGeoJSON);
        console.log ('Turf centre: ' +   JSON.stringify(center) );
        map_centre_lon = turf.center(binnedGeoJSON).geometry.coordinates[0].toFixed(2)
        map_centre_lat = turf.center(binnedGeoJSON).geometry.coordinates[1].toFixed(2)
        console.log ('map_centre_lon: ' + map_centre_lon  );
        console.log ('map_centre_lat: ' + map_centre_lat  );
        update_map_centre(map, map_centre_lon, map_centre_lat);
        
        // The masking map canvas is shown by default, so we just hide it 
				$("#Masking").fadeOut("slow");      //Hide Halo masking div 
				$("#map").fadeOut("slow");			//Hide Map for halo masking - lies outside the multi-step
				// Now lest show the bining map canvas
				$("#mapContainer").fadeIn("slow");	//Show Map for binning in OL	- lies outside the multi-step				
				//$("#Binning").fadeIn("slow");       //Show Binning div
				console.log("Binning ");
        //show the hexabinned map
        refreshMap_verification(map);
        //update_map_centre(map, v_map_centre_lon, v_map_centre_lat);
        // run after X seconds
        //delay(5000).then(() => console.log('ran after 1 second passed'));
        map.resize();        
			}
    });
    map.resize();
  });    
}

//export
function update_map_centre(map, v_map_centre_lon, v_map_centre_lat){
  //var map_centre_lon = -120.37, map_centre_lat = 50.690;
  //var map_centre_lon = config.lng, map_centre_lat = config.lat;
  //map.setCenter([ -120.37 , 50.690]);
  console.log(' update_map_centre() verification')
  map.setCenter([ v_map_centre_lon , v_map_centre_lat ]);
  
}

//20 Feb 2023 this function is used fr verification
async function refreshMap_verification(map) {
  console.log('verification refreshMap() fn')
  //renderHexes_from_loaded_geojson(map);

  //console.log('refreshMap');
  //getData function read the slider values, does the computation, bins, and returns the geojson
  // TEMP COMMENTED
  const combinedLayers = await getData();

  // take the map and hexagon, transform the hexagon map into geojson and display
  //renderHexes(map, combinedLayers, combinedLayers_more);
  renderHexes_from_loaded_geojson(map, combinedLayers); //, combinedLayers_more);
  console.log('Map Refreshed');
  //temp - just to see if download works
  //downloadBinnedFn();

  //14-Dec-2022. Count the number of points uin each cell
  console.log('h3Reso ' + h3Reso);
  //console.log('BinnedGeoJSON Before Counting ' + JSON.stringify(binnedGeoJSON)  );
  //binnedGeoJSON = countPoints_try(binnedGeoJSON, h3Reso);
  //console.log('bBinnedGeoJSON After Counting ' + JSON.stringify(binnedGeoJSON)) 
} 

//okay to delete now
function renderHexes_from_loaded_geojson(map) {
  console.log('renderHexes_from_loaded_geojson() fn')  
  //can use a better way here using xhr https://stackoverflow.com/questions/12460378/how-to-get-json-from-url-in-javascript
  //get this from url
//  $.getJSON('binned2.geojson', function(data) {    
//    binnedGeoJSON = JSON.parse(JSON.stringify(data))  
    binnedGeoJSON = JSON.parse(decryptedGEOJSON); //JSON.parse(JSON.stringify(decryptedGEOJSON)); //set this to the decrypted geosjon instead
    //binnedGeoJSON = decryptedGEOJSON;
//    console.log('decryptedGEOJSON ' + decryptedGEOJSON)
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
    map.resize();    
}

init();