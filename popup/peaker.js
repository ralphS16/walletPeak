/*
  I need to handle errors to display a message if something wrong happened.
  I need to add a "-" button to delete wallets
  I need to use CSS to add style to the table so that my extension looks good.
*/


window.addEventListener("load", function load() {
  window.removeEventListener("load", load, false); // removes the listener because we want this to be fired once
  browser.storage.local.get("data", function(obj){processData(obj.data);}); // gets data from browser local storage and processes it
});

function processData(dataObj) {
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
      }
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
  innerHtml = "<table>"
  let n = 0; //counts the wallets
  for (wallet of walletsData.list) { // iterates through all wallets
    // add a table row with usefull information and css classes to make it easy to style
    innerHtml += `<tr>
      <td class="balance">${wallet["balance"].toFixed(2)}</td>
      <td class="crypto_type">${wallet["type"].toUpperCase()}</td>
      <td class="value_fiat">${wallet["value"].toFixed(2)}</td>
      <td class="fiat">${wallet["convert"].toUpperCase()}</td>
      <td class="delwall"><a href="delForm.html?n=${n}">Delete this wallet</a></td>
    </tr>`;
    n++;
  }
  innerHtml += `<tr><td colspan=4 class="addwall"><a href="addForm.html">Add a wallet</a></td></tr>`
  innerHtml += "</table>";
  document.body.innerHTML = innerHtml; // loads the inner html in the body
}
