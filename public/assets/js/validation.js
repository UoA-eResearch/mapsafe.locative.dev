//This script is used to validate each step in the multi-step form and also to enable the next options
// For the layers, on each of the steps in the process (multi-step form) we confirm if the users want to skip the step
// 24-June-2022

var loadDisplayCompleted  = false; //26-Dec-2022. If the user has loaded and displayed the map
var maskingCompleted      = false;
var binningCompleted      = false; //26-Dec-2022. Keep track of whether binning of masking os chosen.
var encryptionCompleted   = false;
var notarisationCompleted = false;

//each of te following functiosn validates one task on Mapsafe

function validateMasking(){
    var maskingbutton = document.getElementById("mask");
    console.log(maskingbutton.dataset.clicked ? "Yes" : "No");
    if (maskingbutton.dataset.clicked)
      console.log('Masking done')
    else{
      console.log('Masking not done')
      var proceed = confirm('Are you sure you want to skip masking')      
        if (proceed) {
        //proceed
        } else {
        //don't proceed
        }
    }
  }   
  
  function validateEncryption(){
    var maskingbutton = document.getElementById("mask");
    console.log(maskingbutton.dataset.clicked ? "Yes" : "No");
    if (maskingbutton.dataset.clicked)
      console.log('Masking done')
    else{
      console.log('Masking not done')
      confirm('Are you sure you want to skip encryption')
    }
  }    

// validation of input file to see if its a document or map
// and to enable next buttons
//use this same function for safeguard and validation
//https://www.geeksforgeeks.org/file-type-validation-while-uploading-it-using-javascript/
function fileValidation(flow) { //pass in if its safegoard or verification
  var displayMapButton = document.getElementById("displayMap");
  var firstNextButton = document.getElementById("firstnextaction-button");
  var secondNextButton = document.getElementById("secondNextAction-button");

  //console.log('fileValidation');
  if(flow == 1){       //safeguarding
      fileInput = document.getElementById('sensitiveInput');    //store first and only file as global variable                   
  }
  else if(flow == 2){  //verification
      //console.log('verification: ');
      fileInput = document.getElementById('encryptedInput');    //store first and only file as global variable  
  } 
  var filePath = fileInput.value;  //var fileItself = fileInput.files[0];
  
  // Allowable file types
  var allowedDocExtensions = /(\.doc|\.docx|\.odt|\.pdf|\.tex|\.txt|\.rtf|\.wps|\.wks|\.wpd)$/i;
  var allowedMapExtensions = /(\.zip|\.wpd)$/i;
  var allowedEncryptedExtensions = /(\.enc)$/i;                

   //get the filename firstpart for both safeguarding and verification
   //var fpath = this.value; //https://stackoverflow.com/questions/20323999/how-to-get-file-name-without-extension-in-file-upload-using-java-script?noredirect=1&lq=1
   var fpath = filePath.replace(/\\/g, '/');
   fileName = fpath.substring(fpath.lastIndexOf('/')+1, fpath.lastIndexOf('.'));
   //console.log('fname firstpart: ' + fileName);
   
  //validate..safeguarding
  if(flow == 1) {   
      //get file extension for documents
      documentExtension = filePath.split('.').pop();
      //console.log('documentExtension: (' + documentExtension + ')'); 
        
      //check if file is document
      if (allowedDocExtensions.exec(filePath)) {  
          console.log('Valid doc filetype');
          firstNextButton.disabled = false;
          isDocument = true;  console.log('Set isDocument == true'); //set if it's a document or map - as a global variable
          //hide the ''leveltodecrypt' option in decrypt step within the verification flow
          document.getElementById("ChooseVolumeToDecrypt").style.display = "none"; 
      } 
      else if (allowedMapExtensions.exec(filePath)){  //if file is map
          console.log('Valid map filetype');
          displayMapButton.disabled = false; 
          //firstNextButton.disabled = false;
          //Only for documents
          //document.getElementById("ChooseToEncrypt").style.display = "none"; 
      }
      else { //!allowedDocExtensions.exec(filePath) && !allowedMapExtensions.exec(filePath)			
          alert('Invalid file type: ' + documentExtension + ' Please load a zipped shapefile');
          firstNextButton.disabled = true;				
      } 
      
  }
  //in decryption, we cannot know the file type unless we decrypt, so we just make sure the file extension is '.enc'
  else if(flow == 2) { //verification
      //repeat the code from above as .zip is stil not removed during verification
      fileName = fileName.substring(fileName.lastIndexOf('/')+1, fileName.lastIndexOf('.'));
      
      //if file has '.enc' extension
      if (allowedEncryptedExtensions.exec(filePath)) {  
          console.log('Valid encrypted filetype, filePath:' + filePath);               
          firstNextButton.disabled = false; //enable next button
          //hide the 'leveltodecrypt' option in decrypt step within the verification flow
          //document.getElementById("ChooseVolumeToDecrypt").style.display = "none"; 
          
          //lets check if it has the document extension we assigned in the middle of the filename
          filePath = filePath.replace('.enc',''); //remove the '.enc' extension ofr the below checking functions to work
          if (allowedDocExtensions.exec(filePath)) 
              isDocument = true;              
          else
              isDocument = false;
      }
      else {			
          alert('Invalid file type');
          firstNextButton.disabled = true;	//just making sure, but it should alrady be disabled			
      } 
  }    
}