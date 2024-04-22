var ext_version = ['v1'],
  ext_updatenotes = [['Initial Release']],
  queryUpdates = document.querySelector('[class=update]'),
  br = document.createElement('br')
for (const e of ext_version) {
  var updatesVersion = document.createElement('b'),
    updatesContent = document.createTextNode(e)
  updatesVersion.appendChild(updatesContent),
    updatesVersion.appendChild(br.cloneNode(!0)),
    queryUpdates.appendChild(updatesVersion)
  for (const o of ext_updatenotes[ext_version.indexOf(e)]) {
    var updatelog = document.createTextNode('-' + o)
    queryUpdates.appendChild(updatelog),
      queryUpdates.appendChild(br.cloneNode(!0)),
      queryUpdates.appendChild(br.cloneNode(!0))
  }
}
