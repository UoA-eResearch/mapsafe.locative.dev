
/*
$(document).ready( function () {
 console.log('Loadig two functiosn on page load');
 await this.loadWeb3();
 await this.loadBlockchainData();
});

window.onload = function() {        
 await this.loadWeb3()
 await this.loadBlockchainData()
};
*/
 
var trans_date = null;

//21-June-2022 This function gets called from index.html 
async function loadWeb3() 
{
  //const Web3 = require("web3")
  console.log('Inside loadWeb3() fn')
  if (window.ethereum) 
  {
    window.web3 = new Web3(window.ethereum)
    await window.ethereum.enable()
    console.log('window.ethereum')
  }
  else if (window.web3) 
  {
    window.web3 = new Web3(window.web3.currentProvider)
    console.log('window.web3')
  }
  else 
  {
    window.alert('Non-Ethereum browser detected. You should consider trying MetaMask4!')
    console.log('Non-Ethereum browser detected. You should consider trying MetaMask4!')
  }
}

async function loadBlockchainData() 
{
  //const Web3 = require("web3")
  console.log('Inside loadBlockchainData() fn')
  const web3 = window.web3
  // Load account
  const accounts = await web3.eth.getAccounts()
  this.setState({ account: accounts[0] })
  console.log('web3' + web3)

  const networkId = await web3.eth.net.getId()
  const networkData = Location.networks[networkId]
  if(networkData) 
  {
    const abi = Location.abi
    const address = networkData.address
    const contract = new web3.eth.Contract(abi, address)
    this.setState({ contract })
    const totalSupply = await contract.methods.totalSupply().call()
    this.setState({ totalSupply })
    // Load Colors
    for (var i = 1; i <= totalSupply; i++) 
    {
      const location = await contract.methods.locations(i - 1).call()
      this.setState({
        locations: [...this.state.locations, location]
      })
    }
  } 
  else {
    window.alert('Smart contract not deployed to detected network.')
  }
}

//29-June-2022
//https://github.com/mammothtraining/Live-dApp-with-Server-MetaMask-and-Ganache/

//contract address and ABI
//const address = "0x84f37Eee4Bfa486e36BcB85b2EC0bb55FAC2b59A";
/*
const abi = [
   .....
  ]
*/
 
//document.addEventListener("DOMContentLoaded", function(event) {
async function loadInfo(){ 
    console.log("Load Info");
    //contract address and ABI
    const address = "0xa505630672898f901A0c6B261A693C39f17e66B8"
    //Location = $.getJSON("Location.json", function(Location) { });
    var Location;
    $.getJSON("Location.json", function(json){      
      Location = json;      
      //console.log('Location 2' + JSON.stringify(Location))

      if (window.ethereum) { 
        console.log("MetaMask exists.");
        
        try {
          //var accounts;
          //accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });            
          ethereum.request({ method: "eth_requestAccounts" })
          .then(
            //() => document.getElementById("count").click()
            console.log('Success')
           )
          .catch((err) => console.error(err.message)
           );
                 
          ethereum.on("chainChanged", () => window.location.reload());        
          ethereum.on("accountsChanged", (accounts) => {
              if (accounts.length > 0) {
                  console.log(`Using account ${accounts[0]}`);
              } else {
                  console.error("0 accounts.");
              }
          });        
          ethereum.on("message", (message) => console.log(message));        
          ethereum.on("connect", (info) => {
              console.log(`Connected to network ${info}`);
          });        
          ethereum.on("disconnect", (error) => {
              console.log(`Disconnected from network ${error}`);
          });        
          
          const provider = new ethers.providers.Web3Provider(window.ethereum);    //console.log('Provider ' + provider)
          const signer = provider.getSigner();                                    //console.log('signer '   + signer)
          const contract = new ethers.Contract(address, Location.abi, signer);    //console.log('contract ' + contract)
          
          window.contract = contract
          //console.log(contract)          
        } 
        catch (error) {
          if (error.code === 4001) {
            // User rejected request
            console.log(error.message)
          }
          console.log(error.message)
          //setError(error);
        }
      }
      else {
        console.error("Install MetaMask.");
     }

    });
    
}

//$("#mintButton").click(async function() {
async function minting()
{
/*
  document.getElementById("finish-button").disabled = false;
  var hash = "testing " + new Date().toISOString() ; //$("#hash").val();
  console.log("Minting " + hash)
  var receipt = await contract.mintNFT(hash)
  console.log(receipt)
  var url = `https://rinkeby.etherscan.io/tx/${receipt.hash}`
  console.log('Transaction Link ' + url)
//  $("#mintingResult").html(`Transaction: <a href="${url}">${url}</a>`)
  var text = "Success! The hash value representing the dataset is being minted on Ethereum Blockchain.";
  //var link = "link";
  //var receipt = "You can download a recipt of the transaction here";
  //var fullResultText = text + link.link(myPath);
          //$('demo1 ').attr('target', '_blank');
 // document.getElementById("demo1").innerHTML = text; // fullResultText;
  $('#TransAddress').attr('href', url); //firstPart + "Football");
  $('#TransAddress').attr('target', '_blank');
  $('#message').text(text);
  $('#TransAddress').text(url);
*/
  document.getElementById("finish-button").disabled = false;
  trans_date = new Date().toISOString(); //$("#hash").val();  //set the global transaction date
  console.log("Minting Date " + trans_date)
  var receipt = await contract.mintNFT(hash_value); //encrypted file hash_value 
  console.log(receipt)
  console.log("Minting ")
  var url = `https://goerli.etherscan.io/tx/${receipt.hash}`
  console.log('Transaction Link ' + url)
  var fromAddr = receipt.from;
  console.log('From Wallet Account Address ' + receipt.from)
  var tranx_hash = receipt.hash;
  console.log('Ethereum Transaction Hash ' + tranx_hash)
  var gas_price = receipt.gasPrice;
  console.log('GasPrice' + gas_price)

  //var text = "Success! The hash value representing the dataset is being minted on Ethereum Blockchain.";
  //var link = "link";
  //var receipt = "You can download a recipt of the transaction here";
  //var fullResultText = text + link.link(myPath);
          //$('demo1 ').attr('target', '_blank');
  // document.getElementById("demo1").innerHTML = text; // fullResultText;
 
  
  //$('#message').text(text);
  $("#TransAddress").html(`<b>Success!</b> The hash value representing the dataset is being minted on Ethereum Blockchain. 
                          <br> Transaction URL: <a href="${url}" target="_blank">${url}</a>`)
  /*$('#TransAddress').text(url);
  $('#TransAddress').attr('href', url); //firstPart + "Football");
  $('#TransAddress').attr('innerHTML', url);
  $('#TransAddress').attr('target', '_blank'); */

  //link.href = url;
  //link.innerHTML = url;


  
  /*
    console.log('Transaction No. ' + result)              
    //var a = document.getElementById('myElementID');
    //a.href = "https://rinkeby.etherscan.io/tx/"+result;
    //document.getElementById("foo").href="https://rinkeby.etherscan.io/tx/" + result;
    //https://rinkeby.etherscan.io/tx/              
    var myPath = 'https://rinkeby.etherscan.io/tx/'+ result;
    console.log('myPath link ' + myPath)
    //link = document.getElementById('myLink');
    //link.href = myPath;              
    
    var text = "A public record of the data as a hash value has been minted on the Ethereum Blockchain. <br> You can check the transaction at this ";
    var link = "link";
    var receipt = "You can download a recipt of the transaction here";
          var fullResultText = text + link.link(myPath);
          //$('demo1 ').attr('target', '_blank');
    document.getElementById("demo1").innerHTML = text; // fullResultText;

    //var url = $('#aId').attr('href');
    //firstPart = url.substring(0, url.lastIndexOf('\/')+1);
    $('#aId').attr('href', myPath); //firstPart + "Football");
    $('#aId').attr('target', '_blank');
    $('#aId').text(myPath);
    //alert($('#aId').attr('href'));
  */

//$$$ $("#success").show();
  saveReceipt(hash_value, url, fromAddr, tranx_hash, gas_price); //save the transaction details as pdf
} 
//})