let browser = chrome || browser;
let delN = window.location.href.split("=")[1]; //get the index of wallet to delete from url
browser.storage.local.get("data", function(obj){
  obj.data.list.splice(parseInt(delN), 1); // pop the undesired wallet
  browser.storage.local.set({"data": obj.data}); // store the updated wallet
  document.body.innerHTML = `<p class="delSuccess">You successfully deleted a wallet.</p>`;
});
