//Layer and document upload functions in GeoNode
//10 May 2022

//we upload the masked layer as a geonode layer
function upload_layer(masked_reprojected){ //maskedGeoJSON_string) {   //filename = "sample.geojson",
  
    console.log("Uploading geonode layer");  
    var headers = new Headers();
    headers.set('X-CSRFToken', csrftoken);
  
    var formData = new FormData()
    formData.set("time", false)
  
    if(formatted_masked_reprojected === null)
        console.error('formatted_masked_reprojected is null');
  
    var fileStringArray = [ formatted_masked_reprojected ]; //formatted_masked_reprojected; //masked_reprojected; //jsonString_new3; //maskedGeoJSON_string; //[JSON.stringify(geoJSON)];
    var blobAttrs = {
      type: "application/octet-stream"
    };
    console.log('fileStringArray: ' + fileStringArray);
  
    //filename = "sample.geojson",
    //console.log('fileName: ' + fileName);
    fileName = fileName + '.geojson';
    console.log('Layer fileName: ' + fileName);
    var file = new File(fileStringArray, fileName, blobAttrs);
    //var file = new File(maskedGeoJSON_string, fileName, blobAttrs);
    formData.set("base_file", file)
    formData.set("geojson_file", file)
    //formData.set("permissions", '{"users":{"AnonymousUser":["view_resourcebase","download_resourcebase"]},"groups":{}}')
    formData.set("permissions", '{"users":{},"groups":{}}')
    formData.set("charset", "UTF-8")
  
    //when we want to get the users and groups specified in the bob
    //var chkBox = document.getElementById('view_anonymous');  //'checkAddress' is the name of checkbox, not id
    //if (chkBox.checked)
    //    formData.set("view_anonymous", true)     
    //else
      //    formData.set("view_anonymous", false)           
   
  
    fetch("/upload/", {
      "credentials": "include",
      "body": formData,
      "headers": headers,
      "method": "POST",
      "mode": "cors"
    }).then(result => result.json()).then(function(data) {
      console.log(data)
      fetch(data.redirect_to).then(result => result.json()).then(function(data) {
        console.log(data)      
        var name = data.url.split(":").pop()  // Get layer ID
        check_layer(name)
      })
    })
    
  }
  
  function check_layer(name) {
    // Check if layer exists with this name
    fetch("/api/v2/layers/?filter{name}=" + name).then(result => result.json()).then(function(result) {
      console.log(result)
      if (result.layers.length) {
        var layer = result.layers[0]
        var layer_id = `type:${layer.polymorphic_ctype_id}-id:${layer.pk}`
        console.log("Now Trying to upload Document")   
        upload_document(layer_id, csrftoken)
      } else {
        // It doesn't exist yet, wait 1 second, then check again
        setTimeout(function() {
          check_layer(name)
        }, 1000)
      }
    })
  }
  
  //upload the 'global_finalEncryptedZipFile' blob (the final encrypted zip file resulting from the three volume encryption) as a Geonode document
  //we can't upload it as a layer because Geoserver only accepts files with spatial content - and the encrypted file canot be read of ts contents.
  function upload_document(layer_id) {
    
    var formData = new FormData()
    formData.set("csrfmiddlewaretoken", csrftoken)
    
    if (csrftoken === undefined)
       console.error('csrftoken undefined');
    
    if (global_finalEncryptedZipFile === null)
       console.error('encrypted file is null ');
  
    if (finalFilename === null)
       console.error('encrypted filename is null ');
    else
       console.log('finalFilename ' + finalFilename);
    
    formData.set("title", finalFilename); //using global variable //filename) 
    formData.set("links", layer_id)
    console.log(`Linking to ${layer_id}`)
  
    var file = new File([global_finalEncryptedZipFile], finalFilename); //blob to file
    formData.set("doc_file", file) //upload the 'global_finalEncryptedZipFile' (the final encrypted zip file resulting from the three volume encryption)
    formData.set("doc_url", "")
    //formData.set("permissions", '{"users":{"AnonymousUser":["view_resourcebase","download_resourcebase"]},"groups":{}}')
    formData.set("permissions", '{"users":{},"groups":{}}')
  
    var result = fetch("/documents/upload/", {
      "credentials": "include",
      "body": formData,
      "method": "POST",
      "mode": "cors"
    }).then(function(result) {
      console.log('New document uploaded, its URL is ' + result.url)
    })
    
    if (result.status == 200) {
          console.log('New document uploaded, its URL is ' + result.url)
      } else {
        //XXX console.error('error uploading: ' + result)
      }
    
  }
  