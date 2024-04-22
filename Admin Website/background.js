chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    )
  }
})

chrome.action.onClicked.addListener(tab => {
  var newURL = chrome.runtime.getURL('pc.html')
  chrome.tabs.create({ url: newURL + '?=' + '#dashboard' })
  //chrome.tabs.create({ url: newURL + '?=' + tab.url + '#dashboard' })
})
