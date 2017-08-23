/*
  I need to modify this code to make it asynchronous using fetch and promises in the right way like I tried to do in code below.
  I need to handle errors to display a message if something wrong happened.
  I need to add a "+" button in order to add wallets.
  I need to update the value and balance in the saved Data in the json file when I download the data from the server.
  I need to use CSS to add style to the table so that my extension looks good.
*/


window.addEventListener("load", function load() {
  window.removeEventListener("load", load, false);
  // Loads the data in memory and renders it when the body is loaded
  displayWallets(getWalletsData(syncJSONFetch("data.json")));
});

function getWalletsData(dataObj) {
  let timestamp = Date.now(); // now timestamp to prevent the user to load more than once every 5 minutes
  let walletsData = [];
  if ((timestamp - dataObj.last_update)/60000 > 5) {
    //data is old, so we need to fetch new data from blockchain explorers
    exchangeRates = getExchangeRates(dataObj.currency, dataObj.list);
    for (wallet of dataObj.list) {
      if (wallet.type == "ltc" || wallet.type == "btc" || wallet.type == "doge") { // if crypto type is LTC, BTC or DOGE, use chain.so API
        let balance = 0.0;
        for (address of wallet.addr) { // get all balances
          let url = "https://chain.so/api/v2/get_address_balance/" + wallet.type.toUpperCase() + "/" + address; // create URL of request
          let walletData = syncJSONFetch(url); // get the json object from the api, TODO handle error
          balance += parseFloat(walletData.data.confirmed_balance);
        }
        walletsData.push([wallet.type, balance, balance * exchangeRates[wallet.type], dataObj.currency]); // push a new wallet balance, value pair
      }
    }

  } else {
    // data is not old, so we just need to format it
    for (wallet of dataObj.list) {
      walletsData.push([wallet.type, wallet.balance, wallet.value, dataObj.currency]); // push a new wallet balance, value pair
    }
  }
  return walletsData;
}

function getExchangeRates(curr, list) {
  let exRates = {};
  for (wallet of list) {
    if (!exRates.hasOwnProperty(wallet.type)) {
      // if not already encountered this type of cryptocurrency, add it to the list of exchange rates
      obj = syncJSONFetch("https://api.cryptonator.com/api/ticker/"+wallet.type+"-"+curr) // TODO handle error
      exRates[wallet.type] = obj.ticker.price;
    }
  }
  return exRates;
}

function syncJSONFetch(url) {
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", url, false); // open a synchronous request to the data
  if (xmlhttp.overrideMimeType) { // make sure that the file is read as JSON if supported by browser
    xmlhttp.overrideMimeType("application/json");
  }
  xmlhttp.send(); // send the request
  if (xmlhttp.status == 200) { // if the reques is successful, return the object that was read
    return JSON.parse(xmlhttp.responseText);
  } else { // handle errors
    // TODO throw an error
    console.log(xmlhttp.status);
    return {"error" : 1};
  }
}

function displayWallets(walletsData) {
  // displays all the wallets balance, value pairs in a a nice table that is easy to format.
  innerHtml = "<table>"
  for (wallet of walletsData) {
  innerHtml += `<tr>
    <td class="balance">${wallet[1].toFixed(2)}</td>
    <td class="crypto_typ">${wallet[0].toUpperCase()}</td>
    <td class="value_fiat">${wallet[2].toFixed(2)}</td>
    <td class="fiat">${wallet[3].toUpperCase()}</td>
  </tr>
`;
}

  innerHtml += "</table>";
  document.body.innerHTML = innerHtml; // loads the inner html in the body
}


/*

***************** This is old async code that I will need to reuse after ********************
function renderData(dataObj) {
  // Renders all the balances in the html body
  let timestamp = Date.now(); // now timestamp to prevent the user to load more than once every 5 minutes
  if ((timestamp - dataObj.last_update)/60000 > 5) {
    fiatCurrency = dataObj.currency;
    for (let item of dataObj.list) { // goes through all the addresses saved by the user
      if (item.type == "ltc" || item.type == "btc" || item.type == "doge") { // if crypto type is LTC, BTC or DOGE, use chain.so API
        let url = "https://chain.so/api/v2/get_address_balance/" + item.type.toUpperCase() + "/" + item.addr; // create URL of request
        fetch(url).then( // fetch the request and send it to renderLineWithChain() function.
          function(response) {

            return response.json();
        }).then(renderLineWithChain);
      }
    }
  }
}

function renderLineWithChain(jsonResponse) {
  if (jsonResponse.status == "success") {
    let text = "Balance : " + jsonResponse.data.confirmed_balance + " " + jsonResponse.data.network + " = ";
    fetch("https://api.cryptonator.com/api/ticker/"+jsonResponse.data.network.toLowerCase()+"-"+fiatCurrency).then(
    function(response){
      return response.json();
    }).then(function(obj) {
      text += parseFloat(jsonResponse.data.confirmed_balance) * parseFloat(obj.ticker.price) + " " + obj.ticker.target;
    });
    document.body.append(document.createTextNode(text));
  }
}
*/
