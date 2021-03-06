/*
  I need to improve my CSS styling
*/
let browser = chrome || browser;

window.addEventListener("load", function load() {
  window.removeEventListener("load", load, false); // removes the listener because we want this to be fired once
  browser.storage.local.get("data", function(obj){processData(obj.data);}); // gets data from browser local storage and processes it
});

function processData(dataObj) {
  if (!dataObj) {
    dataObj = {};
    dataObj["last_update"] = Date.now();
    dataObj["list"] = [];
    browser.storage.local.set({"data" : dataObj});
  }
  let timestamp = Date.now(); // now timestamp to prevent the user to load more than once every 10 minutes
  if ((timestamp - dataObj.last_update)/60000 > 10) {
    //data is old, so we need to fetch new data from blockchain explorers
    // run the exRates and balances generator in a promise and when it is resolved, send it to updateData with the dataObj function
    Promise.all([runGenerator(getExchangeRates, dataObj.list), runGenerator(getBalances, dataObj.list)]).then((x) => updateData(...x, dataObj));
  } else {
    // data is not old, so we just need to format it
    displayWallets(dataObj);
  }
}

function updateData(exRates, balances, dataObj){
  let walletList = dataObj.list;
  for (let i = 0; i < walletList.length; i++) { // iterates through every wallet
    let wallet = walletList[i];
    wallet.balance = balances[i]; // get the new balance and value using the data returned by the generators
    wallet.value = balances[i] * exRates[wallet.type+"-"+wallet.convert];
  }
  dataObj.last_update = Date.now(); // the object was last updateed now
  browser.storage.local.set({"data" : dataObj}); // updates the data in local storage
  displayWallets(dataObj); // display the wallets
}

function *getBalances(walletList) {
  let balances = []; // contains the balances for the wallets in order
  for (let i = 0; i < walletList.length; i++) { // iterates through every wallet
    balances[i] = 0;
    for (let j = 0; j < walletList[i].addr.length; j++) { //iterates through every address in the wallet
      if (walletList[i].type == "ltc" || walletList[i].type == "btc" || walletList[i].type == "doge" || walletList[i].type == "dash") { // if the crypto is supported by SoChain
        let uri = "https://chain.so/api/v2/get_address_balance/" + walletList[i].type.toUpperCase() + "/" + walletList[i].addr[j]; // create URI of request
        let response = yield fetch(uri); // get api response
        let post = yield response.json(); // extract json object

        balances[i] += parseFloat(post.data.confirmed_balance); // add the confirmed balance of this address to the total balance
      } else if (walletList[i].type == "eth" ) { // eth is handled by the blockcypher API
        let uri = "https://api.blockcypher.com/v1/eth/main/addrs/" + walletList[i].addr[j] + "/balance"; // create URI of request
        console.log(uri);
        let response = yield fetch(uri); // get api response
        let post = yield response.json(); // extract json object

        balances[i] += parseInt(post.balance) / Math.pow(10,18); // add the confirmed balance of this address to the total balance (convert from wei to ETH)
      }
      /* else if (walletList[i].type == "vtc" ) { // if the crypto is supported by vtconline
        /***********THIS ALWAYS GETS A NETWORK ERROR ... *************
        let uri = "https://explorer.vertcoin.org/ext/getbalance/" + walletList[i].addr[j]; // create URI of request
        console.log(uri);
        let response = yield fetch(uri, {mode:'cors'}); // get api response
        let post = yield response.json(); // extract json object

        balances[i] += parseFloat(post); // add the confirmed balance of this address to the total balance
      } */
    }
  }
  // when all wallets were processed, return the balances array
  return balances;
}

function *getExchangeRates(walletList) {
  const exRates = {}; // get a list of exhange rates
  for (let i = 0; i < walletList.length; i++) { // iterates through every wallet
    if (!exRates.hasOwnProperty(walletList[i].type+"-"+walletList[i].convert)) {
      // if not already encountered this type of cryptocurrency, add it to the list of exchange rates
      let uri = "https://api.cryptonator.com/api/ticker/"+walletList[i].type+"-"+walletList[i].convert; // create URI of request
      let response = yield fetch(uri); // get api response
      let post = yield response.json(); // extract json object

      exRates[walletList[i].type+"-"+walletList[i].convert] = post.ticker.price; // add this conversion rate to exRates
    }
  }
  // when all wallets were processed, yield the exRates object
  return exRates;
}

function runGenerator(gen, arg) { // run the generator, code inspired by a FunFunFunction episode on Generators
  const iterator = gen(arg);
  const iteration = iterator.next();
  function iterate(iteration) {
    if (iteration.done) {
      //console.log(iteration.value);
      return iteration.value;
    }
    const promise = iteration.value;
    return promise.then(function(res) {
      return iterate(iterator.next(res));
    });
  }
  return iterate(iteration);
}

function displayWallets(walletsData) {
  // displays all the wallets balance, value pairs in a a nice table that is easy to format.
  let body = document.getElementsByTagName("body")[0];
  let table = document.createElement("table");
  let n = 0; //counts the wallets
  for (wallet of walletsData.list) { // iterates through all wallets
    // add a table row with usefull information and css classes to make it easy to style
    let row = document.createElement("tr");
    row.classList.add("walletrow");

    let col = document.createElement("td");
    col.classList.add("balance");
    col.appendChild(document.createTextNode(wallet["balance"].toFixed(2)));
    row.appendChild(col);

    col = document.createElement("td");
    col.classList.add("cryptotype");
    col.appendChild(document.createTextNode(wallet["type"].toUpperCase()));
    row.appendChild(col);

    col = document.createElement("td");
    col.classList.add("valuefiat");
    col.appendChild(document.createTextNode(wallet["value"].toFixed(2)));
    row.appendChild(col);

    col = document.createElement("td");
    col.classList.add("fiat");
    col.appendChild(document.createTextNode(wallet["convert"].toUpperCase()));
    row.appendChild(col);

    col = document.createElement("td");
    col.classList.add("delwall");
    let link = document.createElement("a");
    link.setAttribute("href", "delForm.html?n="+n);
    let image = document.createElement("img");
    image.setAttribute("alt", "Delete this wallet");
    image.setAttribute("width", "30");
    image.setAttribute("height", "30");
    image.setAttribute("src", "../icons/minussign.png");
    link.appendChild(image);
    col.appendChild(link);
    row.appendChild(col);
    table.appendChild(row);
    n++;
  }

  let row = document.createElement("tr");
  row.classList.add("addrow");
  let col = document.createElement("td");
  col.setAttribute("colspan", 4);
  row.appendChild(col);
  col = document.createElement("td");
  col.classList.add("addwall");
  let link = document.createElement("a");
  link.setAttribute("href", "addForm.html");
  let image = document.createElement("img");
  image.setAttribute("alt", "Add a wallet");
  image.setAttribute("width", "30");
  image.setAttribute("height", "30");
  image.setAttribute("src", "../icons/plussign.png");
  link.appendChild(image);
  col.appendChild(link);
  row.appendChild(col);
  table.appendChild(row);
  body.appendChild(table);
}

/*
function displayWallets(walletsData) {
  // displays all the wallets balance, value pairs in a a nice table that is easy to format.
  innerHtml = "<table>"
  let n = 0; //counts the wallets
  for (wallet of walletsData.list) { // iterates through all wallets
    // add a table row with usefull information and css classes to make it easy to style
    innerHtml += `<tr>
      <td class="balance">${wallet["balance"].toFixed(2)}</td>
      <td class="cryptotype">${wallet["type"].toUpperCase()}</td>
      <td class="valuefiat">${wallet["value"].toFixed(2)}</td>
      <td class="fiat">${wallet["convert"].toUpperCase()}</td>
      <td class="delwall"><a href="delForm.html?n=${n}"><img alt="Delete this wallet" width="30" height="30" src="../icons/minussign.png"></a></td>
    </tr>`;
    n++;
  }
  //last line to have an add button
  innerHtml += `<tr><td colspan=4></td> <td class="addwall"><a href="addForm.html"><img alt="Add a wallet" width="30" height="30" src="../icons/plussign.png"></a></td></tr>`
  innerHtml += "</table>";
  document.body.innerHTML = innerHtml; // loads the inner html in the body
}*/
