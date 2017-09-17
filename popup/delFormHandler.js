let browser = chrome || browser;
let delN = window.location.href.split("=")[1]; //get the index of wallet to delete from url
browser.storage.local.get("data", function(obj){
  obj.data.list.splice(parseInt(delN), 1); // pop the undesired wallet
  browser.storage.local.set({"data": obj.data}); // store the updated wallet

  //display text to show that the wallet was deleted
  document.body = document.createElement("body");
  let text = document.createElement("p");
  text.classList.add("delSuccess");
  text.appendChild(document.createTextNode("You successfully deleted a wallet."));
  document.body.appendChild(text);
});
