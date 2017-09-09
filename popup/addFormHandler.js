let browser = chrome || browser;

window.addEventListener("load", function load() {
  window.removeEventListener("load", load, false); // removes the listener because we want this to be fired once
  document.getElementById("addbtn").addEventListener("click", addWallet, false);
});

function verifyAddresses(){
  let addresses = document.getElementById("addresses").value.split("\n");
  let valid = true;
  //TODO actually validate addresses
  for (addr of addresses) {
    if (/[^a-zA-Z0-9]/.test(addr)) {
      valid = false;
      break;
    }
  }
  if (!valid) {
    document.getElementById("addresses").style.border = '2px solid red';
    addresses = [];
  } else {
    document.getElementById("addresses").style.border = '';
  }
  return addresses
}
function addWallet(e){
  let addresses = verifyAddresses()
  if (addresses) {
    newWallet = {"balance" : 0.0, "value" : 0.0};
    newWallet["addr"] = addresses;
    newWallet["type"] = document.getElementById("typeSelect").value;
    newWallet["convert"] = document.getElementById("convertSelect").value;
    browser.storage.local.get("data", function(obj){
      obj.data.list.push(newWallet); // push the new wallet in the list of wallet
      obj.data.last_update = 0; // reset update time so that it updates the new wallet
      browser.storage.local.set({"data": obj.data}); // store the updated wallet
      document.body.innerHTML = `<p class="addSuccess">You successfully added a new wallet.</p>`;
    });
  }
}
