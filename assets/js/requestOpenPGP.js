//03-May-2022 ..Prepares data and calls OpenPGP Enryption and Decryption 
//These functions are called directly from html. Thus, is independent of, and no need to involve dstool.js script. 
//Layer_Uploads.html calls 'callOpenPGPEncrypt' and Comments.html calls 'callOpenPGPDecrypt' for decrption

//modified version of the recursive decrypt function to call OpenPGP as we now only have single level encryption
//For OpenPGP, we just encrypt the original layer - the unmasked one - and zip that with some text files   
async function callOpenPGPEncrypt(v_ciphertextInFile, levelToDecrypt, currentLevel){ //v_objFile
    console.log("Inside callOpenPGPEncrypt() function ");
    //console.log("Decryption levelToDecrypt "+  levelToDecrypt + " currentLevel " + currentLevel); 
    //var downloadFile = false;
    //if (currentLevel == levelToDecrypt)
    //    downloadFile = true;

    var startTime = new Date();
    console.log("Level Zipped and Encryption: ");
    var originalmap_jsonString = JSON.stringify(sensitive.data, circularReplacer());
    
    global_originalmap_jsonString = originalmap_jsonString;
    //for the below functions, currently we are using the same passphrase - from textbox in the form. This will change
    
    //Only one level encryption in OpenPGP
    var zipLevel1 = new JSZip();
    zipLevel1.file("original.geojson", originalmap_jsonString);  //add original map file to zip file
    zipLevel1.file("Metadata.txt", //above has values here
    //           "Masking parameters of Level 2 \nRandDist: " + randDist + "\nRandAngle: " + randAngle +
            "\nNote this level contains the fine level (original map) - no masked map " +
            "\n(but contains the masking parameters of the medium map - which is masked first, from one level outside ");
    zipLevel1.file("folder/placeholderfile.txt", "placeholderfile in folder"); 

    try { 
        encryptedZipFileData_Level1 = await zip_callOpenPGPEncryption(zipLevel1, 1);  // Await for the first function to complete
    }
    catch (error) { console.error(error); }     
}

// Takes the zip file object, generates a blob, zips it, calls encryption and returns it 
// syntax based on ``doJob'' example from  https://techbrij.com/javascript-async-await-parallel-sequence
// 03-May-2022 Modified to call the the OpenPGP encryption
async function zip_callOpenPGPEncryption(zipFile, level) {
    return new Promise((resolve, reject)  => {
        console.log('zipping_callOpenPGPEncryption function')             
        var encryptedZipFile, encryptedZipFileData;
        var downloadFile = false;
        if(level == 1) downloadFile = true;  //07-May-2022 changed so that we encrypt at level 1
        //create a zip file of the coarse data and then save it    
        zipFile.generateAsync({type: "blob"})  //https://stuk.github.io/jszip/
            .then(function (content) {  
                console.log('Processing middle.')           
                var arrayBuffer, fileReader = new FileReader();        
                //this function is needed as we want to first create a file using the blob and then encrypt that 
                //You can use FileReader to read the Blob as an ArrayBuffer
                fileReader.onload = function (event) { 
                    arrayBuffer = fileReader.result;
                    console.log("here fileReader.result: " + fileReader.result);
                    //Web.Crypto Commented 03-May-2022
                    //encryptedZipFile = encryptData(false, fileReader.result, downloadFile, level);  //data passed is in arraybuffer format, but later should now be converted to blob again
                    //OpenPGP encryption
                    encryptedZipFile = OpenPGPEncryptData(false, fileReader.result, downloadFile, level);
                    encryptedZipFile.then((value) => {                            
                        encryptedZipFileData = value
                        resolve(encryptedZipFileData);
                    }); 
                };
                //actually, accoding to documentation, this gets called almost as soon as fileReader has been created
                fileReader.readAsArrayBuffer(content); //content = blob
                fileReader.result; // also accessible this way once the blob has been read                    
            }); 
        var str = JSON.stringify(encryptedZipFileData, circularReplacer());      
    })    
}

//parameter 'level' is not used
async function OpenPGPEncryptData(isDocument, file_contents, downloadFile, level) 
{   
    console.log("OpenPGP Encrypting Now:");
    
    //This is my public key
    const key1 = textFromFileLoaded;

  //This is the testuser public key
      const key2 = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v4.10.10
Comment: https://openpgpjs.org

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
=DCgM
-----END PGP PUBLIC KEY BLOCK-----`;

    const publicKeysArmored = [key1, key2];

    //create a combined key
    const publicKeys = await Promise.all(publicKeysArmored.map(armoredKey => openpgp.readKey({ armoredKey }))); 
    var plaintextbytes = new Uint8Array(file_contents);
    var plainTextString = new TextDecoder().decode(plaintextbytes);
//    console.log('plaintextbytes:  ' + plaintextbytes);
//    console.log('plainTextString: ' + plainTextString);
    //const message = await openpgp.createMessage({ text: plaintext });
//    console.log('file_contents: ' + file_contents);
    var str = JSON.stringify(file_contents);
//    console.log('str: ' + str);    
    const message = await openpgp.createMessage({ text: plainTextString }); //str //plaintextbytes

    const encrypted = await openpgp.encrypt({        
        message, //plaintextbytes, //message, // input as Message object
        encryptionKeys: publicKeys //,
        //signingKeys: privateKey // optional
    });
//    console.log('encrypted: ' + encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'

    var cipherbytes=new Uint8Array(encrypted);

    //07-May-2022 ...temp code block
    var blob3 = new Blob([encrypted],{type: 'text/plain'} );  //cipherbytes  
    
    //08-May-2022..store it as global variable so that it can later be sent to geonode document endpoint
    global_finalEncryptedZipFile = blob3; 
    
    finalFilename = fileName + "." + documentExtension + ".enc";  //finalFilename is a global variable which will be soon used to upload the document
    saveAs(blob3, finalFilename ); //"test"+level+".enc"); //fileName2); 
    console.log('encrypted file saved: ' + finalFilename ); //"test"+level+".enc"); //fileName2) 
    //compute hash of the final encrypted volume file (level 3).
    //https://stackoverflow.com/questions/21761453/create-sha-256-hash-from-a-blob-file-in-javascript
    const hashHex = await getHash("SHA-256", blob3)
    hash_value = hashHex;          //finally UPDATE THE GLOBAL VARIABLE 'HASH'
    console.log('hashHex: ' + hashHex);


 /*  07-May-2022 ..commented out as we not using three level encryption and mainly because I need to make this work   
    //do we need this line of code below?
    var blob=new Blob([cipherbytes], {type: 'application/download'}); //resultbytes instead of plaintext    
    
    //we only download/display link when the level is right
    
    if(downloadFile){
        //save the blob file
        //https://github.com/eligrey/FileSaver.js/issues/357
        //var fileData2 = JSON.stringify(resultbytes, undefined, 4); // first use JSON.stringify 
        var blob2 = new Blob([cipherbytes],{type: 'text/plain'} ); // save as Blob 
        
        //18-02-2022..store it as global variable so that it can be sent to geonode document endpoint, if user wants
        global_finalEncryptedZipFile = blob2; 
        
        //compute hash of the final encrypted volume file (level 3).
        //https://stackoverflow.com/questions/21761453/create-sha-256-hash-from-a-blob-file-in-javascript
        const hashHex = await getHash("SHA-256", blob2)
        hash_value = hashHex;          //finally UPDATE THE GLOBAL VARIABLE 'HASH'
        console.log('hashHex: ' + hashHex); 

        //if we have the 'doc' extension, we take it is a document, else a map
        //var fileName2; ///filename to save  
        if(isDocument) //for documents  
            finalFilename = fileName + "." + documentExtension + ".enc";  //e.g. 'legislation.doc.enc'
        else           //for maps
            finalFilename = fileName + "." + documentExtension + ".enc";  //we should put in the zip extension - check 'documentExtension' - why same code for both cases?

        saveAs(blob2, finalFilename); //fileName2); 
        console.log('encrypted file saved: ' + finalFilename); //fileName2)         
    }   
    encryptedFileData = blob;   //do we need this line of code ??
    return Promise.resolve(cipherbytes);
*/
}

//modified version of the recursive decrypt function to call OpenPGP as we now only have single level encryption 
//maybe we dont need this functiona dn can call the 'decryptOpenPGP' function directly
async function callOpenPGPDecrypt(v_ciphertextInFile, levelToDecrypt, currentLevel){ //v_objFile
    console.log("Inside callOpenPGPDecrypt() function ");
    console.log("Decryption levelToDecrypt "+  levelToDecrypt + " currentLevel " + currentLevel); 
    var downloadFile = false;
    if (currentLevel == levelToDecrypt)
        downloadFile = true;

     //10-May-2022. we donyt need this cponversion as we difectly read the body while doing the fetch from geonode   
     //get content from file object. The `big encrypted zip file'
     /*var cipherbytes=await readfile(v_objFile)
     .catch(function(err){
         console.error(err);
     });*/ 

    //var encrypted_maskedData=new Uint8Array(cipherbytes);
    //let decrypted_file_data = await decryptOpenPGP(encrypted_maskedData, currentLevel, downloadFile); //will automatically use the 'objFile' global variable
    let decrypted_file_data = await decryptOpenPGP(v_ciphertextInFile, currentLevel, downloadFile); //cipherbytes//will automatically use the 'objFile' global variable

    /*
    //`big encrypted zip file' is encrypted. So here we Decrypt it into file content into fileobject so we can iterate over each file
    var decfile = new File([decrypted_file_data], "decrypted.txt", {
        type: "text/plain",
    });
    //v_objFile = file; //assign to variable used below
       
    //save decrypted file (in zipped form) to see the details in the file at this point
    saveAs(decfile, "decryptedVolume_"+currentLevel+".zip");
    */
  }

//OpenPGP decrypt function
//async function decryptOpenPGP(encrypted_maskedData, currentLevel, downloadFile) 
async function decryptOpenPGP(cipherTextInFile, currentLevel, downloadFile) //cipherbytes
{    
    console.log('Decrypting encrypteed Layer using OpenPGP');
    //document.getElementById("progressbar").className = "progress-bar progress-bar-striped progress-bar-animated";
    // put keys in backtick (``) to avoid errors caused by spaces or tabs
    //Retrieve user's uploaded public key
    const privkey = document.getElementById("inputTextToSave").value  //textFromFileLoaded; //document.getElementById("privKey").value
    //const passphrase = document.getElementById("pass").value
    //const encrypted = cipherbytes; // document.getElementById("pgpMsg").value

//    console.log('cipherbytes: ' + cipherbytes);

    //console.log('textFromFileLoaded: ' + textFromFileLoaded);
    console.log('privkey: ' + privkey);
    console.log('cipherTextInFile: ' + cipherTextInFile);
    //var enc = new TextDecoder("utf-8");
    //var encrypted_maskedData=new Uint8Array([cipherTextInFile]);
    //console.log('decoded: ' + enc.decode(encrypted_maskedData));
    //console.log('encrypted_maskedData: ' + encrypted_maskedData);

    //data conversion needed
//    var encrypted_maskedData=new Uint8Array(cipherbytes);

    /*
    const privKeyObj = (await openpgp.key.readArmored(privkey).catch((err) => 
    { 
      //document.getElementById("result").value = err.message;
      //document.getElementById("progressbar").className = "progress-bar bg-danger";
      console.log('err: ' + err.message);
    })).keys[0]
    */
    //const privKeyObj = openpgp.key.readArmored(privkey).keys[0]
    //const privKeyObj = (await openpgp.key.readArmored(privkey)).keys[0]
    const privKeyObj = await openpgp.readKey({armoredKey: privkey})
    /* We dont use passphrase
    if (passphrase) {
      await privKeyObj.decrypt(passphrase).catch((err) => {document.getElementById("result").value = err.message;document.getElementById("progressbar").className = "progress-bar bg-danger";})
    } */
    
    //encrypted_maskedData
    
    //const encrypted_message = await openpgp.createMessage({ text: cipherTextInFile });

    const options = {                                  //encrypted_message
        message: await openpgp.readMessage({armoredMessage: cipherTextInFile }).catch((err) => 
        {
          //document.getElementById("result").value = err.message;
          //document.getElementById("progressbar").className = "progress-bar bg-danger";
          console.log('err: ' + err.message);
        }),    // parse armored message
        decryptionKeys: [privKeyObj]       //privateKeys                          // for decryption
    }

    var plaintextbytes;

    openpgp.decrypt(options).then(plaintext => {
      //document.getElementById("result").value = plaintext.data;
      //document.getElementById("progressbar").className = "progress-bar bg-success";
 //$$     plaintextbytes = new Uint8Array(plaintext.data);
 //$$     console.log('Decrypted data: ' + plaintext.data);
      console.log('plaintext.data: ' + plaintext.data);
      var blob = new Blob([plaintext.data],{type: 'application/zip'} ); // save as Blob 
      //var fileName2 = fileName + "_level"+ currentLevel +".zip"; ..no longer using levels
 //     var fileName2 = fileName + ".zip";
      saveAs(blob, fileName + ".zip"); 
 //     console.log('Decrypted file saved, filename: ' + fileName2) 
    }).catch(function(error){
      //document.getElementById("result").value = error.message;
      //document.getElementById("progressbar").className = "progress-bar bg-danger";
      console.log('err: ' + error.message);
    });

    /*
    if(downloadFile) { //we only download/display link at the right level
      //save the blob file https://github.com/eligrey/FileSaver.js/issues/357        
      var blob = new Blob([plaintextbytes],{type: 'text/plain'} ); // save as Blob 
      //var fileName2 = fileName + "_level"+ currentLevel +".zip"; ..no longer using levels
      var fileName2 = fileName + ".zip";
      saveAs(blob, fileName2); 
      console.log('Decrypted file saved, filename: ' + fileName2)  
    }
    */
  
    return plaintextbytes;
  }