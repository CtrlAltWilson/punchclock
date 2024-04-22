const app = 'HMG PunchClock Admin'

var buildingdataset = 0,
  staffchanged = 0,
  isDebug = 0,
  api_con = 0,
  demo = 0

var cur_page = ''

var dashboarddata = {},
  getdata = { buildings: '', active: '' },
  gdata = { active: '', buildings: [] },
  getdate = { startdate: '', enddate: '', lastsync: '', lastarsync: '' },
  staffdata = {},
  archstaffdata = {},
  buildingdata = {},
  approvaldata = {}

var token = null,
  load = null,
  iplog = null,
  API_KEY = null

const modulebody = document.querySelector('.mainContent.clearfix')
function getdemo () {
  demo = 1
  var staffdata = {
    1: {
      id: 1,
      first_name: 'Jake',
      middle_name: 'Henry',
      last_name: 'Long',
      job_role: 'Nurse',
      sex: 'M',
      birthdate: '01-01-01',
      buiding: 'Katy',
      thours: '80'
    }
  }
  for (i = 2; i < 50; i++) {
    let secondarystaffdata = {
      i: {
        id: 1,
        first_name: 'Sam',
        middle_name: 'J',
        Kyrie: 'Long',
        job_role: 'Nurse',
        sex: Math.floor(Math.random() * 2) == 1 ? 'M' : 'F',
        birthdate: '1993-01-07',
        buiding: 'Pasadena',
        timelog: {
          date:
            Math.floor(Math.random() * 2) == 1 ? '2023-01-10' : '2023-01-11',
          clock_in:
            Math.floor(Math.random() * 2) == 1 ? '08:00:000' : '10:00:000',
          clock_out:
            Math.floor(Math.random() * 2) == 1 ? '16:00:000' : '22:00:000',
          needs_review: Math.floor(Math.random() * 2) == 1 ? true : false
        }
      }
    }
    staffdata = Object.assign({}, staffdata, secondarystaffdata)
  }
  gdata['buildings'] = ['Katy', 'Pearland', 'North']
  getVersion()
  main()
}


if (isDebug) {
  var debug = console.log.bind(window.console)
  API_URL = 'http://localhost:5000/'
} else {
  var debug = function () {}
}

//Waits for the page to load before running functions
window.onload = () => {
  auth()
}

//Auth
function auth () {
  setip()
  document.body.appendChild(loading())
  load = document.querySelector('.loading')
  document.body.appendChild(
    input_popup('api', 'Enter API Key<h6>(enter Demo for sample):</h6>')
  )
  getAPI('api')
}

async function getAPI (apiinput) {
  let check = await get_sync(apiinput)
  debug(check)
  debug(check != undefined)
  if (check != undefined && !check.includes('Invalid')) {
    API_KEY = check
    await getToken()
    if (api_con === 1) {
      debug('clearing api modal')
      buffergdata()
      return
    }
  }
  document.querySelector('.api').style.display = 'flex'
}

async function buffergdata () {
  try {
    store_sync('api', API_KEY)
    getVersion()
    debug('getting gdata')
    await get_gdata()

    debug(`Get data is ${gdata['active']}`)
    main()
    load.style.display = 'none'
    /*
    if (gdata['active'] === true) {
      main()
      load.style.display = 'none'
    } else {
      //servererror()
    }*/
  } catch (err) {
    debug(err)
    //servererror()
  }
}

//Main Loader
async function main () {
  await setDates()
  await getstaffdata(0)
  //await getdashboarddata()
  //await get_gdata()
  getstaffdata(0)
  document.querySelector('body').appendChild(addemployeebtn())
  document.querySelector('body').appendChild(addbuildingsbtn())
  document.querySelector('body').appendChild(addhoursbtn())
  document.body.appendChild(input_popup('trpop', ''))
  await eventlisteners()
  await curpage()
  load.style.display = 'none'
  await getLockStatus()
  setInterval(pollstaffdata, 5000)
}

function setip () {
  $.getJSON('https://api.ipify.org?format=json', function (t) {
    iplog = t.ip
    httpr('POST', 'hmgpcip', `&ip=${iplog}`)
  })
}

//Loads event listeners for buttons that are active on page
function eventlisteners () {
  //sidebar menu
  const sidebar = document.querySelector('#sidebar')
  sidebar.addEventListener('click', event => {
    debug(event.target.textContent)
    cur_page = event.target.textContent
    curpage()
  })

  //listener for enddate
  const enddate = document.getElementById('end-date')
  enddate.addEventListener('change', function () {
    getdate['enddate'] = this.value
    updatedate('enddate', getdate['enddate'])
    //store_session('enddate', getdate['enddate'])
    //getstaffdata(1)
    //curpage()
  })

  //listener for startdate
  const startdate = document.getElementById('start-date')
  startdate.addEventListener('change', function () {
    getdate['startdate'] = this.value
    //store_session('startdate', getdate['startdate'])
    updatedate('startdate', getdate['startdate'])
    //getstaffdata(1)
    //curpage()
  })

  const new_emp = document.getElementById('new_emp')
  new_emp.addEventListener('click', function () {
    debug('addemployeebtn')
    addemployee.style.display = 'flex'
    //const selectedBuilding = document.getElementById('buildingSelect');
    //const selectedIndex = selectedBuilding.selectedIndex;
    //selectedBuilding.value = getdata['Cur_building']
    //document.querySelector('body').style.height = '450px'
  })

  //Ignore the naming convention this is to add buildings
  const edit_buildings = document.getElementById('edit_build')
  edit_buildings.addEventListener('click', function () {
    debug('edit buildings btn')
    editbuildings.style.display = 'flex'
  })

  //Ignore the naming convention this is to add buildings
  const addhoursbtn = document.getElementById('addhours')
  addhoursbtn.addEventListener('click', function () {
    debug('add hours btn')
    addhoursmodal.style.display = 'flex'
  })

  const homebtn = document.getElementById('home')
  homebtn.addEventListener('click', function () {
    debug('homebtn')
    cur_page = 'dashboard'
    curpage()
    //const selectedBuilding = document.getElementById('buildingSelect');
    //const selectedIndex = selectedBuilding.selectedIndex;
    //selectedBuilding.value = getdata['Cur_building']
    //document.querySelector('body').style.height = '450px'
  })

  const printbtn = document.querySelector('.profiles-setting')
  printbtn.addEventListener('click', function () {
    let getid = document.querySelector('.mainContent.clearfix table').id
    let getheader = document.querySelector('.mainContent.clearfix .header')
      .lastChild.textContent
    printTable(getid, getheader)
  })

    // Get all elements with the class "material-symbols-outlined" and "select"
    const printButtons = document.querySelectorAll(".material-symbols-outlined.select");

    // Add an onclick event listener to each element with the class
    printButtons.forEach(function(printButton) {
      printButton.addEventListener("click", function() {
        // Get the table element by its ID
        const table = document.getElementById("staff-table");
        const timesheetheader = document.querySelector('.header').textContent
        if (timesheetheader == 'badgeTimesheet Approval Queue'){
          // Get all the rows (excluding the header row)
          const rows = table.querySelectorAll("tr");
    
          // Check if checkboxes are already present in the rows
          const checkboxesExist = rows[0] && rows[0].querySelector("input[type='checkbox']");
          const multiselGroup = document.getElementById('multiselbtns');

          if (checkboxesExist) {
            // Checkboxes are already present, remove them
            rows.forEach(function(row) {
              row.removeChild(row.firstElementChild); // Remove the first cell (checkbox)
            });
            multiselGroup.innerHTML = ''
            multiselGroup.classList.remove('active')
          } else {
            // Checkboxes are not present, add them
            rows.forEach(function(row, index) {
              // Create a new checkbox element
              const checkbox = document.createElement("input");
              checkbox.type = "checkbox";
      
              // Insert the checkbox as the first cell in the row
              const firstCell = row.insertCell(0);
      
              if (index === 0) {
                // This is the header row, create a "Select All" checkbox
                checkbox.id = "selectAll";
                checkbox.addEventListener("change", function() {
                  // Select or deselect all other checkboxes based on the "Select All" checkbox state
                  const otherCheckboxes = table.querySelectorAll("input[type='checkbox']:not(#selectAll)");
                  otherCheckboxes.forEach(function(otherCheckbox) {
                    otherCheckbox.checked = checkbox.checked;
                  });
                });
              }
      
              firstCell.appendChild(checkbox);
              
              if (!multiselGroup.classList.contains('active')){
                var appallbtn = document.createElement("button");
                appallbtn.textContent = 'Approve Selected'
                appallbtn.id='approveall'
                var denallbtn = document.createElement("button");
                denallbtn.textContent = 'Deny Selected'
                denallbtn.id='denyall'
                var delallbtn = document.createElement("button");
                delallbtn.textContent = 'Delete Selected'
                delallbtn.id='deleteall'
                multiselGroup.classList.add('active')
                multiselGroup.appendChild(appallbtn);
                multiselGroup.appendChild(denallbtn);
                multiselGroup.appendChild(delallbtn);
                appallbtn.addEventListener('click', ()=> {
                  var checkeditems = table.querySelectorAll("input[type='checkbox']:checked");
                  var tabletbody = document.querySelector('#staff-table').querySelector('tbody')
                  checkeditems.forEach(function(e){
                    var parentrow = e.closest('tr')
                    var bid = parentrow.id, co, mem
                    try{
                      co = parentrow.querySelectorAll('td')[7].textContent
                    } catch { co = ''}
                    try {
                    mem = parentrow.querySelectorAll('td')[8].textContent
                    } catch { mem = ''}
                    console.log(bid + co + mem)

                    let updatebd = `&id=${bid}&com=${co}&dec=1&mem=${mem}`
                    httprbuffer('POST', 'employeepending', updatebd)
                    try{
                      tabletbody.removeChild(parentrow)
                    } catch {}
                  })
                  staffdatabuffer()
                })
                denallbtn.addEventListener('click', ()=> {
                  var checkeditems = table.querySelectorAll("input[type='checkbox']:checked");
                  var tabletbody = document.querySelector('#staff-table').querySelector('tbody')
                  checkeditems.forEach(function(e){
                    var parentrow = e.closest('tr')
                    var bid = parentrow.id, co,mem
                    try{
                      co = parentrow.querySelectorAll('td')[7].textContent
                    } catch { co = ''}

                    try {
                      mem = parentrow.querySelectorAll('td')[8].textContent
                    } catch {mem = ''}
                    console.log(bid + co + mem)

                    let updatebd = `&id=${bid}&com=${co}&dec=0&mem=${mem}`
                    httprbuffer('POST', 'employeepending', updatebd)
                    tabletbody.removeChild(parentrow)
                  })
                  staffdatabuffer()
                })

                delallbtn.addEventListener('click', ()=> {
                  var checkeditems = table.querySelectorAll("input[type='checkbox']:checked");
                  var tabletbody = document.querySelector('#staff-table').querySelector('tbody')
                  checkeditems.forEach(function(e){
                    var parentrow = e.closest('tr')
                    var bid = parentrow.id,co,mem
                    try{
                      co = parentrow.querySelectorAll('td')[7].textContent
                    } catch {co = ''}

                    try{
                      mem = parentrow.querySelectorAll('td')[8].textContent
                    } catch { mem = ''}
                    console.log(bid + co + mem)

                    let updatebd = `&id=${bid}&com=${co}&dec=2&mem=${mem}`
                    httprbuffer('POST', 'employeepending', updatebd)
                    tabletbody.removeChild(parentrow)
                  })
                  staffdatabuffer()
                })

              }//end if multisel
            });
        }
        }
        
      });
    });

async function staffdatabuffer(){
  await getstaffdata(1)
}
async function httprbuffer(type, meth, data){
  await httpr(type, meth, data)
}

    /*    const allRows = document.querySelectorAll('#staff-table tbody tr');
    allRows.forEach(row => {
      if (row !== hoveredRow) {
        const saveButton = row.querySelector('#saveData');
        const delButton = row.querySelector('#delData');

        if (saveButton) {
          row.removeChild(saveButton);
        }

        if (delButton) {
          row.removeChild(delButton);
        }
      }
    });
    */
}

async function updatedate (type, data) {
  await store_session(type, data)
  await getstaffdata(1)
  await getarchstaffdata(1)
  curpage()
}

//Loading screen
function loading () {
  tolo = document.createElement('div')

  lo = document.createElement('div')
  lo.className = 'loading'

  clo = document.createElement('div')
  clo.className = 'loading-clock'

  spa = document.createElement('span')

  clo.appendChild(spa)
  lo.appendChild(clo)

  fad = document.createElement('div')
  fad.className = 'fade'

  tolo.appendChild(lo)
  return tolo
}

function printTable (tableId, header) {
  if (
    document.querySelector('.profiles-setting a span').textContent ==
    'print_disabled'
  )
    return
  const table = document.getElementById(tableId)
  const newWindow = window.open()
  newWindow.document.write(`
    <html>
      <head>
        <style>
          /* Add styles for the table here */
          table {
            border-collapse: collapse;
            width: 100%;
            font-size: 12px;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          .no-result, #selprint{
            display: none;
          }
          h1, h2 {
            text-align: center;
          }
        </style>
      </head>
      <body>
          <h1>Timesheet for ${header}</h1>
          <h2>${getdate['startdate']} - ${getdate['enddate']}</h2>
        ${table.outerHTML}
      </body>
    </html>
  `)
  newWindow.print()
  newWindow.close()
}

//Loads the current page. This will help with users who are refreshing the page or if the page needs to be refreshed/relaoded.
function curpage () {
  let link = window.location.href.toLowerCase()
  debug('setting cur_page to ' + cur_page)
  const multiselGroup = document.getElementById('multiselbtns');
  if (multiselGroup){
    multiselGroup.innerHTML = ''
    multiselGroup.classList.remove('active')
  }
  if (cur_page === '') {
    switch (true) {
      case link.includes('settings'):
        cur_page = 'settings'
        break
      case link.includes('buildings'):
        cur_page = 'buildings'
        break
      case link.includes('overtime'):
        cur_page = 'overtime'
        break
      case link.includes('activestaff'):
        cur_page = 'active staff'
        break
      case link.includes('needsreview'):
        cur_page = 'needs review'
        break
      case link.includes('archivedstaff'):
        cur_page = 'archived staff'
        break
      case link.includes('parttime staff'):
        cur_page = 'parttime staff'
        break
      case link.includes('approvalqueue'):
        cur_page = 'approval queue'
        break
      case link.includes('fulltime staff'):
        cur_page = 'fulltime staff'
        break
      case link.includes('staff'):
        cur_page = 'all staff'
        break
      default:
        cur_page = 'dashboard'
        break
    }
  }
  switch (cur_page) {
    case 'settings':
      settingsmodule()
      break
    case 'buildings':
      buildingsmodule()
      break
    case 'all staff':
      staffmodule('all')
      break
    case 'overtime':
      staffmodule('overtime')
      break
    case 'active staff':
      staffmodule('active')
      break
    case 'needs review':
      staffmodule('needs_review')
      break
    case 'archived staff':
      staffmodule('archived')
      break
    case 'parttime staff':
      staffmodule('parttime')
      break
    case 'fulltime staff':
      staffmodule('fulltime')
      break
    case 'approval queue':
      approvalqueuemodule()
      break
    default:
      dashboardmodule()
      break
  }
}

//Sets the dates on load to the current date - 15 days.
async function setDates () {
  getdate['startdate'] = await get_session('startdate')
  debug(getdate['startdate'])
  if (getdate['startdate'] === undefined || getdate['startdate'] === '') {
    let today = new Date()
    getdate['enddate'] = setdatehelper(today)
    debug('startdate is set to ' + getdate['startdate'])

    today.setDate(today.getDate() - 15)
    getdate['startdate'] = setdatehelper(today)

    store_session('enddate', getdate['enddate'])
    store_session('startdate', getdate['startdate'])
  } else {
    getdate['enddate'] = await get_session('enddate')
  }
  debug('setting dates')
  debug(getdate)
  document
    .querySelector('#start-date')
    .setAttribute('value', getdate['startdate'])
  document.querySelector('#end-date').setAttribute('value', getdate['enddate'])
}
//Date Helper: returns the fixed date
function setdatehelper (date) {
  const year = date.getFullYear()
  let month = date.getMonth() + 1 // January is 0, so we need to add 1
  let day = date.getDate()

  // Pad the month and date values with leading zeros if necessary
  if (month < 10) {
    month = `0${month}`
  }
  if (day < 10) {
    day = `0${day}`
  }

  return `${year}-${month}-${day}`
}

//XHR request to get dashboard data
async function getdashboarddata () {
  debug(dashboarddata)
  let req = `&sd=${getdate['startdate']}&ed=${getdate['enddate']}`
  dashboarddata = await httpr('GET', 'dashboard', req)
  debug(dashboarddata)
  debug('buildings are ' + dashboarddata['buildings'])
  debug(Object.keys(dashboarddata).length)
  debug(Object.keys(dashboarddata))
  gdata['buildings'] = []
  for (buildings in dashboarddata['buildings']) {
    debug(buildings)
    gdata['buildings'].push([buildings, dashboarddata['buildings'][buildings]])
  }
  debug(gdata['buildings'])
}

//XHR request to get staff data
async function getbuildingdata (bypass) {
  debug('getbuildingdata')
  if (buildingdataset === 0 || bypass === 1) {
    let req = `&target=all`
    buildingdata = await httpr('GET', 'buildings', req)
    buildingdataset = 1
  }
  getdata['buildings'] = await httpr('GET', 'buildings', '')
  debug(buildingdata)
}

//XHR request to get staff data
async function getstaffdata (bypass) {
  debug(getdate['startdate'] + getdate['enddate'])
  cur_time = new Date().getTime()
  if (bypass == 0) {
    if (getdate['lastsync'] == '') {
      getdate['lastsync'] = cur_time
    } else if (cur_time < getdate['lastsync'] + 300000) {
      return
    }
  }

  getdate['lastsync'] = cur_time
  let req = `&sd=${getdate['startdate']}&ed=${getdate['enddate']}`
  staffdata = await httpr('GET', 'employeelogs', req)
  debug(staffdata)
  let getbul = await getbuildingdata()
}

function areObjectsEqual(obj1, obj2) {
  console.log(obj1)
  console.log(obj2)
  const json1 = JSON.stringify(obj1);
  const json2 = JSON.stringify(obj2);
  return json1 === json2;
}

var cur_id,cur_type,cur_atdata,cur_popupTable,cur_sort,cur_curpage
var cur_pagecounter = 0
async function pollstaffdata(){
  try {
    if (cur_pagecounter == 999){
      return 0
    }
    if (cur_curpage == cur_page){
      cur_pagecounter += 1
      if (cur_pagecounter >= 120){
        toggleSync()
      }
    } else {
      cur_pagecounter = 0
      cur_curpage = cur_page
    }

    getdate['lastsync'] = cur_time
    let req = `&sd=${getdate['startdate']}&ed=${getdate['enddate']}`
    let newstaffdata = await httpr('GET', 'employeelogs', req)
    let isEqual = areObjectsEqual(newstaffdata,staffdata)

    if (!isEqual){
      console.log(isEqual)
      staffdata = newstaffdata
      //staffmodule
      //approvalqueuemodule
      //updateapprovaltable
      //updatetablebuffer(id, 'POST', atdata, popupTable) 
      switch (cur_page) {
        case 'settings':
          //settingsmodule()
          break
        case 'buildings':
          //buildingsmodule()
          break
        case 'all staff':
          //staffmodule('all')
          updatetablebuffer(cur_id, 'POST', '1', cur_popupTable,cur_sort) 
          break
        case 'overtime':
          //staffmodule('overtime')
          updatetablebuffer(cur_id, 'POST', '1', cur_popupTable,cur_sort) 
          break
        case 'active staff':
          //staffmodule('active')
          updatetablebuffer(cur_id, 'POST', '1', cur_popupTable,cur_sort) 
          break
        case 'needs review':
          //staffmodule('needs_review')
          updatetablebuffer(cur_id, 'POST', '1', cur_popupTable,cur_sort) 
          break
        case 'archived staff':
          //staffmodule('archived')
          updatetablebuffer(cur_id, 'POST', '1', cur_popupTable,cur_sort) 
          break
        case 'parttime staff':
          //staffmodule('parttime')
          updatetablebuffer(cur_id, 'POST', '1', cur_popupTable,cur_sort) 
          break
        case 'fulltime staff':
          //staffmodule('fulltime')
          updatetablebuffer(cur_id, 'POST', '1', cur_popupTable,cur_sort) 
          break
        case 'approval queue':
          //approvalqueuemodule()
          updatetablebuffer(0, 'POST', '1', cur_popupTable,cur_sort)
          break
        default:
          //dashboardmodule()
          break
      }
    }
  } catch {}


  /*
  switch (cur_page) {
    case 'settings':
      settingsmodule()
      break
    case 'buildings':
      buildingsmodule()
      break
    case 'all staff':
      staffmodule('all')
      break
    case 'overtime':
      staffmodule('overtime')
      break
    case 'active staff':
      staffmodule('active')
      break
    case 'needs review':
      staffmodule('needs_review')
      break
    case 'archived staff':
      staffmodule('archived')
      break
    case 'parttime staff':
      staffmodule('parttime')
      break
    case 'fulltime staff':
      staffmodule('fulltime')
      break
    case 'approval queue':
      approvalqueuemodule()
      break
    default:
      dashboardmodule()
      break
  }
  */
}

//XHR request to get staff data
async function getapprovaldata () {
  //bypass) {
  /*
  debug(getdate['startdate'] + getdate['enddate'])
  cur_time = new Date().getTime()
  if (bypass == 0) {
    if (getdate['lastsync'] == '') {
      getdate['lastsync'] = cur_time
    } else if (cur_time < getdate['lastsync'] + 300000) {
      return
    }
  }
  getdate['lastsync'] = cur_time
  */
  //let req = `&sd=${getdate['startdate']}&ed=${getdate['enddate']}`
  req = ''
  approvaldata = await httpr('GET', 'employeepending', req)
  approvaldata = approvaldata[0]
  debug(approvaldata)
}

//Staff Module Helper: Returns '' if the data is null and if the data has 'GMT' in it, fixes the date.
function fixstaffdata (data) {
  if (data == null) {
    data = ''
  }
  if (data.includes('GMT')) {
    const seldate = new Date(data)
    const selformattedDate = seldate.toISOString().substring(0, 10)
    data = selformattedDate
  }

  return data
}

//Loads the Dashboard Module
async function dashboardmodule () {
  if (!demo) {
    await getdashboarddata()
  }
  debug('Loading Dashboard Module')
  document.querySelector('.profiles-setting a span').textContent =
    'print_disabled'
  modulebody.innerHTML = ''
  const dashboardDiv = document.createElement('div')
  dashboardDiv.id = 'dashboard'

  const dashboardHeader = document.createElement('h2')
  dashboardHeader.classList.add('header')

  const dashboardIcon = document.createElement('span')
  dashboardIcon.classList.add('icon')

  dashboardHeader.appendChild(dashboardIcon)
  dashboardHeader.appendChild(document.createTextNode('Dashboard'))

  const monitorDiv = document.createElement('div')
  monitorDiv.classList.add('monitor')

  const monitorHeader = document.createElement('h4')
  monitorHeader.appendChild(document.createTextNode('Overview'))

  const clearfixDiv = document.createElement('div')
  clearfixDiv.classList.add('clearfix')

  const contentUl = document.createElement('ul')
  contentUl.classList.add('content')

  let topow = document.createElement('li')
  topow.textContent = 'Building Hours'
  contentUl.appendChild(topow)
  debug(gdata['buildings'])
  btotal = 0
  for (building of gdata['buildings']) {
    const bLi = document.createElement('li')
    bLi.id = building[0]

    const bCountSpan = document.createElement('span')
    bCountSpan.classList.add('count')
    bCountSpan.appendChild(document.createTextNode(building[1]))
    debug(btotal)
    debug(building[1])
    btotal += parseFloat(building[1])

    const bLink = document.createElement('a')
    bLink.href = ''
    bLink.appendChild(document.createTextNode(building[0]))

    bLi.appendChild(bCountSpan)
    bLi.appendChild(bLink)
    contentUl.appendChild(bLi)
  }

  // Append the other list items in the same way

  const discussionsUl = document.createElement('ul')
  discussionsUl.classList.add('discussions')

  let topow2 = document.createElement('li')
  topow2.textContent = 'Stats'
  discussionsUl.appendChild(topow2)
  /*
    let getStats = {'isovertime':'Overtime','needsreview':'Needs Review','totalhours':'Total Hours'}

    for (stat in getStats){
        const statLi = document.createElement("li");
        statLi.id = stat;

        const statCountSpan = document.createElement("span");
        statCountSpan.classList.add("count");
        statCountSpan.appendChild(document.createTextNode("2"));

        statLi.appendChild(statCountSpan);
        statLi.appendChild(document.createTextNode(getStats[stat]));
        discussionsUl.appendChild(statLi);
    }
    */
  let statLi = document.createElement('li')
  statLi.id = 'needs_review'

  let statCountSpan = document.createElement('span')
  statCountSpan.classList.add('count')
  statCountSpan.appendChild(
    document.createTextNode(dashboarddata['needs_review'])
  )

  statLi.appendChild(statCountSpan)
  statLi.appendChild(document.createTextNode('Needs Review'))
  discussionsUl.appendChild(statLi)

  statLi = document.createElement('li')
  statLi.id = 'total_hours'

  statCountSpan = document.createElement('span')
  statCountSpan.classList.add('count')

  statCountSpan.appendChild(document.createTextNode(btotal.toFixed(2)))

  statLi.appendChild(statCountSpan)
  statLi.appendChild(document.createTextNode('Total Hours'))
  discussionsUl.appendChild(statLi)

  //discussionsUl.appendChild(document.createTextNode("Stats"));

  // Append the other list items in the same way

  clearfixDiv.appendChild(contentUl)
  clearfixDiv.appendChild(discussionsUl)

  monitorDiv.appendChild(monitorHeader)
  monitorDiv.appendChild(clearfixDiv)

  dashboardDiv.appendChild(dashboardHeader)
  dashboardDiv.appendChild(monitorDiv)

  modulebody.appendChild(dashboardDiv)
}

//Loads the Buildings Module
async function buildingsmodule () {
  let staffheaders = [
    'ID',
    'Building Name',
    'Address 1',
    'Address 2',
    'City',
    'State',
    'Zip',
    'Phone'
  ]

  if (!demo) {
    await getbuildingdata(0)
  }
  document.querySelector('.profiles-setting a span').textContent = 'print'
  const error2 = new Error()
  debug(`Line number: ${error2.lineNumber}`)
  debug('Loading Building Module')
  modulebody.innerHTML = ''
  const staffDiv = document.createElement('div')
  staffDiv.id = 'building'

  const staffHeader = document.createElement('h2')
  staffHeader.classList.add('header')

  const staffIcon = document.createElement('span')
  staffIcon.classList.add('icon')
  const span = document.createElement('span')
  span.classList.add('material-symbols-outlined')
  span.appendChild(document.createTextNode('badge'))
  staffIcon.appendChild(span)

  staffHeader.appendChild(staffIcon)
  staffHeader.appendChild(document.createTextNode('Buildings'))
  staffDiv.appendChild(staffHeader)

  const formGroup = document.createElement('div')
  formGroup.classList.add('form-group', 'pull-right')
  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.classList.add('search', 'form-control')
  searchInput.placeholder = 'Search Building'
  formGroup.appendChild(searchInput)
  staffDiv.appendChild(formGroup)

  const counterSpan = document.createElement('span')
  counterSpan.classList.add('counter', 'pull-right')
  staffDiv.appendChild(counterSpan)

  const table = document.createElement('table')
  table.id = 'building-table'
  table.classList.add('table', 'table-hover', 'table-bordered', 'results')

  const thead = document.createElement('thead')
  const tr = document.createElement('tr')
  for (head of staffheaders) {
    const th = document.createElement('th')
    th.classList.add('col-md-3', 'col-xs-3')
    th.appendChild(document.createTextNode(head))
    tr.appendChild(th)
    thead.appendChild(tr)
  }
  const warningTr = document.createElement('tr')
  warningTr.classList.add('warning', 'no-result')
  const td = document.createElement('td')
  td.colSpan = '4'

  const warningIcon = document.createElement('i')
  warningIcon.classList.add('fa', 'fa-warning')
  td.appendChild(warningIcon)
  td.appendChild(document.createTextNode(' No result'))
  warningTr.appendChild(td)
  thead.appendChild(warningTr)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  debug('Loading building table')
  for (staff_d in buildingdata) {
    const staffTr = document.createElement('tr')
    staffTr.id = staff_d
    //for (info of staff) {
    //debug(info.first_name)
    let staff = buildingdata[staff_d]
    let staffTd = document.createElement('td')
    staffTd.appendChild(document.createTextNode(staff['id']))
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['building_name'])}`)
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['address_1'])}`)
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['address_2'])}`)
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['city'])}`)
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['state_prov'])}`)
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['zip_code'])}`)
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['phone'])}`)
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)
    /*
        staffTd = document.createElement('td')
        staffTd.appendChild(document.createTextNode(`${totalh.toFixed(2)}`))
        staffTr.appendChild(staffTd)
        */
    //if (staff[staff.length-1] >= 80){
    //    staffTr.setAttribute("id","overtime");
    //}
    //}
    tbody.appendChild(staffTr)
  }

  table.appendChild(tbody)
  staffDiv.appendChild(table)
  staffDiv.appendChild(table)

  modulebody.appendChild(staffDiv)

  const trselection = document.querySelector('tbody')
  trselection.addEventListener('click', event => {
    debug(event.target.id)
    //getSelectedItem('buildings', event.target.id)
  })

  //edit table
  const logtable = document.querySelector('tbody')
  logtable.addEventListener('dblclick', function (e) {
    if (e.target.tagName === 'TD') {
      debug(e.target.innerHTML)
      if (!e.target.parentNode.innerHTML.includes('button')) {
        const row = e.target.parentNode
        // Make the content of the row editable
        row.contentEditable = true

        // Add a save button
        const saveButton = document.createElement('button')
        saveButton.innerHTML = 'Save'
        saveButton.id = 'saveData'
        row.appendChild(saveButton)

        saveButton.addEventListener('click', function () {
          // Save the edited content
          row.contentEditable = false
          // You could send the new data to the server here
          // E.g. using an XMLHttpRequest or fetch API
          // For now, let's just log the content
          let bid = row.id,
            bn = row.children[1].textContent,
            a1 = row.children[2].textContent,
            a2 = row.children[3].textContent,
            ct = row.children[4].textContent,
            st = row.children[5].textContent,
            zi = row.children[6].textContent,
            ph = row.children[7].textContent
          debug(bid + bn + a1 + a2 + ct + st + zi + ph)
          let updatebd = `&id=${bid}&bn=${bn}&a1=${a1}&a2=${a2}&ct=${ct}&st=${st}&zi=${zi}&ph=${ph}`
          postdata('PATCH', 'buildings', updatebd)
          //remove the save button
          row.removeChild(saveButton)
        })

        const delButton = document.createElement('button')
        delButton.innerHTML = 'Delete'
        delButton.id = 'delData'
        row.appendChild(delButton)

        delButton.addEventListener('click', function () {
          // Save the edited content
          row.contentEditable = false
          // You could send the new data to the server here
          // E.g. using an XMLHttpRequest or fetch API
          // For now, let's just log the content
          let bid = row.id,
            bn = '',
            a1 = row.children[2].textContent,
            a2 = row.children[3].textContent,
            ct = row.children[4].textContent,
            st = row.children[5].textContent,
            zi = row.children[6].textContent,
            ph = row.children[7].textContent
          debug(bid + bn + a1 + a2 + ct + st + zi + ph)
          let updatebd = `&id=${bid}&bn=${bn}&a1=${a1}&a2=${a2}&ct=${ct}&st=${st}&zi=${zi}&ph=${ph}`
          postdata('PATCH', 'buildings', updatebd)
          //remove the save button
          row.removeChild(saveButton)
        })
      }
    }
  })

  $('.search').keyup(function () {
    var searchTerm = $('.search').val()
    var listItem = $('.results tbody').children('tr')
    var searchSplit = searchTerm.replace(/ /g, "'):containsi('")

    $.extend($.expr[':'], {
      containsi: function (elem, i, match, array) {
        return (
          (elem.textContent || elem.innerText || '')
            .toLowerCase()
            .indexOf((match[3] || '').toLowerCase()) >= 0
        )
      }
    })
    $('.results tbody tr')
      .not(":containsi('" + searchSplit + "')")
      .each(function (e) {
        $(this).attr('visible', 'false')
      })

    $(".results tbody tr:containsi('" + searchSplit + "')").each(function (e) {
      $(this).attr('visible', 'true')
    })

    var jobCount = $('.results tbody tr[visible="true"]').length
    $('.counter').text(jobCount + ' item')

    if (jobCount == '0') {
      $('.no-result').show()
    } else {
      $('.no-result').hide()
    }
  })
}

//Loads the Staff Module
async function staffmodule (type) {
  if (!demo && type != 'archived') {
    await getstaffdata(0)
  }
  if (!demo && type === 'archived') {
    await getarchstaffdata(0)
  }

  document.querySelector('.profiles-setting a span').textContent = 'print'
  let staffheaders = [
    'ID',
    'Name / Surname',
    'Role',
    'Gender',
    'Birthdate',
    'Building',
    'Full Time',
    'Total Hours'
  ]
  const error2 = new Error()
  debug(`Line number: ${error2.lineNumber}`)
  debug('Loading Staff Module')
  modulebody.innerHTML = ''
  const staffDiv = document.createElement('div')
  staffDiv.id = 'staff'

  const staffHeader = document.createElement('h2')
  staffHeader.classList.add('header')

  const staffIcon = document.createElement('span')
  staffIcon.classList.add('icon')
  const span = document.createElement('span')
  span.classList.add('material-symbols-outlined')
  span.appendChild(document.createTextNode('badge'))
  staffIcon.appendChild(span)

  let staffheadertext = 'Staff'

  switch (type) {
    case 'overtime':
      staffheadertext = 'Staff Overtime'
      break
    case 'needs_review':
      staffheadertext = 'Staff Needs Review'
      break
    case 'active':
      staffheadertext = 'Active Staff'
      break
    case 'archived':
      staffheadertext = 'Archived Staff'
      break
    case 'parttime':
      staffheadertext = 'Parttime Staff'
      break
    case 'fulltime':
      staffheadertext = 'Fulltime Staff'
      break
    default:
      staffheadertext = 'Staff'
      break
  }

  staffHeader.appendChild(staffIcon)
  staffHeader.appendChild(document.createTextNode(staffheadertext))
  staffDiv.appendChild(staffHeader)

  const formGroup = document.createElement('div')
  formGroup.classList.add('form-group', 'pull-right')
  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.classList.add('search', 'form-control')
  searchInput.placeholder = 'Search Staff'
  formGroup.appendChild(searchInput)
  staffDiv.appendChild(formGroup)

  const counterSpan = document.createElement('span')
  counterSpan.classList.add('counter', 'pull-right')
  staffDiv.appendChild(counterSpan)

  const table = document.createElement('table')
  table.id = 'staff-table'
  table.classList.add('table', 'table-hover', 'table-bordered', 'results')

  const thead = document.createElement('thead')
  const tr = document.createElement('tr')
  for (head of staffheaders) {
    const th = document.createElement('th')
    th.classList.add('col-md-3', 'col-xs-3')
    th.appendChild(document.createTextNode(head))
    tr.appendChild(th)
    thead.appendChild(tr)
  }
  const warningTr = document.createElement('tr')
  warningTr.classList.add('warning', 'no-result')
  const td = document.createElement('td')
  td.colSpan = '4'

  const warningIcon = document.createElement('i')
  warningIcon.classList.add('fa', 'fa-warning')
  td.appendChild(warningIcon)
  td.appendChild(document.createTextNode(' No result'))
  warningTr.appendChild(td)
  thead.appendChild(warningTr)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  let today = new Date()
  let todayset = setdatehelper(today)
  let curstaffdata = type === 'archived' ? archstaffdata : staffdata
  for (staff_d in curstaffdata) {
    const staffTr = document.createElement('tr')
    staffTr.id = staff_d
    //for (info of staff) {
    //debug(info.first_name)
    let staff = curstaffdata[staff_d]
    let staffTd = document.createElement('td')
    staffTd.appendChild(document.createTextNode(staff['employee_id']))
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(
        `${staff['first_name']} ${fixstaffdata(staff['middle_name'])} ${
          staff['last_name']
        }`
      )
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['job_role'])}`)
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['sex'])}`)
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['birthdate'])}`)
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['building'])}`)
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.innerHTML = staff['full_time']
      ? '<span class="material-symbols-outlined" id="staff-profile-btns">check</span>'
      : ''
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    let totalh = 0
    let needs_rev = false
    //debug('getting timelog for ' + staff['timelog'])
    for (c_logs of staff['timelog']) {
      //debug(c_logs)
      let date1 = new Date('1970-01-01' + 'T' + c_logs['clock_in'])
      let date2 = new Date('1970-01-01' + 'T' + c_logs['clock_out'])
      //console.log(c_logs['clock_out'])
      if (c_logs['clock_out'] != '23:59:00' && c_logs['clock_in'] != '23:59:00'){
        let milis = date2.getTime() - date1.getTime()

        let tHours = milis / 1000 / 60 / 60
        //debug(tHours)
        totalh += tHours
      }
      if (c_logs['needs_review'] == true) {
        //&& c_logs['date'] != todayset){
        debug(c_logs['date'] + 'today is ' + todayset)
        staffTr.setAttribute('class', 'needs_review')
        needs_rev = true
      }
    }
    staffTd = document.createElement('td')
    staffTd.appendChild(document.createTextNode(`${totalh.toFixed(2)}`))
    staffTr.appendChild(staffTd)
    if (totalh >= 80) {
      staffTr.classList.add('overtime')
    }
    switch (type) {
      case 'overtime':
        if (totalh >= 80) {
          tbody.appendChild(staffTr)
        }
        break
      case 'needs_review':
        if (needs_rev) {
          tbody.appendChild(staffTr)
        }
        break
      case 'active':
        if (totalh > 0) {
          tbody.appendChild(staffTr)
        }
        break
      case 'fulltime':
        if (staff['full_time']) {
          tbody.appendChild(staffTr)
        }
        break
      case 'parttime':
        if (!staff['full_time']) {
          tbody.appendChild(staffTr)
        }
        break
      default:
        tbody.appendChild(staffTr)
        break
    }
  }

  table.appendChild(tbody)
  staffDiv.appendChild(table)
  staffDiv.appendChild(table)

  modulebody.appendChild(staffDiv)

  /*
  const trselection = document.querySelector('tbody')
  trselection.addEventListener('dblclick', event => {
    debug(event.target.id)
    getSelectedItem('employee', event.target.id)
  })
  */
  $('.search').keyup(function () {
    var searchTerm = $('.search').val()
    var listItem = $('.results tbody').children('tr')
    var searchSplit = searchTerm.replace(/ /g, "'):containsi('")

    $.extend($.expr[':'], {
      containsi: function (elem, i, match, array) {
        return (
          (elem.textContent || elem.innerText || '')
            .toLowerCase()
            .indexOf((match[3] || '').toLowerCase()) >= 0
        )
      }
    })
    $('.results tbody tr')
      .not(":containsi('" + searchSplit + "')")
      .each(function (e) {
        $(this).attr('visible', 'false')
      })

    $(".results tbody tr:containsi('" + searchSplit + "')").each(function (e) {
      $(this).attr('visible', 'true')
    })

    var jobCount = $('.results tbody tr[visible="true"]').length
    $('.counter').text(jobCount + ' item')

    if (jobCount == '0') {
      $('.no-result').show()
    } else {
      $('.no-result').hide()
    }
  })
  const trselection = document.querySelector('tbody')
  trselection.addEventListener('dblclick', event => {
    debug(event.target.id)
    getSelectedItem(
      type === 'archived' ? 'archem' : 'employee',
      event.target.id
    )
  })
  /*
  if (type === "archived"){
    //edit table
    const logtable = document.querySelector('.mainContent.clearfix tbody')
    logtable.addEventListener('dblclick', function (e) {
      if (e.target.tagName === 'TD') {
        debug(e.target.innerHTML)
        if (!e.target.parentNode.innerHTML.includes('button')) {
          const row = e.target.parentNode
          // Make the content of the row editable
          //row.contentEditable = true
          debug(row.id)
          // Add a save button
          const resButton = document.createElement('button')
          resButton.innerHTML = 'Restore'
          resButton.id = 'restoreData'
          row.appendChild(resButton)
          resButton.addEventListener('click', function () {
            // Save the edited content
            //row.contentEditable = false
            // You could send the new data to the server here
            // E.g. using an XMLHttpRequest or fetch API
            // For now, let's just log the content
            //debug(row);
            let bid = row.id
            debug(bid)
            let updatebd = `&id=${bid}&target=restore`
            //updatetablebuffer(id,'PATCH',updatebd,popupTable)
            //httpr('PATCH', 'employeelogs', updatebd)
            updateemployee(updatebd)
            //remove the save button
            staffchanged = 1
            row.removeChild(resButton)
          })


        }
      }
    })
  } else {
  }
  */
}

//Loads the Staff Module
async function approvalqueuemodule () {
  if (!demo) {
    await getapprovaldata(0)
  }
  let staffdata = approvaldata
  document.querySelector('.profiles-setting a span').textContent = 'print'
  let staffheaders = [
    'ID',
    'Name / Surname',
    'Date',
    'Building',
    'Clock In',
    'Clock Out',
    'Comments',
    'Memo',
    'Status',
    'Total Time'
  ]
  const error2 = new Error()
  debug(`Line number: ${error2.lineNumber}`)
  debug('Loading Staff Module')
  modulebody.innerHTML = ''
  const staffDiv = document.createElement('div')
  staffDiv.id = 'staff'

  const staffHeader = document.createElement('h2')
  staffHeader.classList.add('header')

  const staffIcon = document.createElement('span')
  staffIcon.classList.add('icon')
  const span = document.createElement('span')
  span.classList.add('material-symbols-outlined')
  span.appendChild(document.createTextNode('badge'))
  staffIcon.appendChild(span)

  let staffheadertext = 'Timesheet Approval Queue'

  staffHeader.appendChild(staffIcon)
  staffHeader.appendChild(document.createTextNode(staffheadertext))
  staffDiv.appendChild(staffHeader)

  const formGroup = document.createElement('div')
  formGroup.classList.add('form-group', 'pull-right')
  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.classList.add('search', 'form-control')
  searchInput.placeholder = 'Search Staff'
  formGroup.appendChild(searchInput)
  staffDiv.appendChild(formGroup)

  const counterSpan = document.createElement('span')
  counterSpan.classList.add('counter', 'pull-right')
  staffDiv.appendChild(counterSpan)

  const table = document.createElement('table')
  table.id = 'staff-table'
  table.classList.add('table', 'table-hover', 'table-bordered', 'results')

  const thead = document.createElement('thead')
  const tr = document.createElement('tr')
  for (head of staffheaders) {
    const th = document.createElement('th')
    th.classList.add('col-md-3', 'col-xs-3')
    if (head.includes('Clock')){
      th.id = 'timesheet-clock'
      //th.style.width = '200px'
      th.style.width = '13%'
      th.style.fontSize = '15px'
    }
    th.appendChild(document.createTextNode(head))
    tr.appendChild(th)
    thead.appendChild(tr)
  }
  const warningTr = document.createElement('tr')
  warningTr.classList.add('warning', 'no-result')
  const td = document.createElement('td')
  td.colSpan = '4'

  const warningIcon = document.createElement('i')
  warningIcon.classList.add('fa', 'fa-warning')
  td.appendChild(warningIcon)
  td.appendChild(document.createTextNode(' No result'))
  warningTr.appendChild(td)
  thead.appendChild(warningTr)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  let today = new Date()
  let todayset = setdatehelper(today)
  let curstaffdata = Object.values(staffdata);
  curstaffdata.sort((a, b) => b.date.localeCompare(a.date));
  let updatebd = `&target=restore`
  updatetablebuffer(0, 'GET', updatebd, table)
  return
  
}


async function updateapprovaltable (id, type, data, popupTable) {
  if (data != '' && data != '1') {
    await httpr(type, 'employeepending', data)
    //await getstaffdata(1)
  }
  if (!demo) {
    await getapprovaldata(0)
  }
  let staffdata = approvaldata
  document.querySelector('.profiles-setting a span').textContent = 'print'
  let staffheaders = [
    'ID',
    'Name / Surname',
    'Date',
    'Building',
    'Clock In',
    'Clock Out',
    'Comments',
    'Memo',
    'Status',
    'Total Time'
  ]
  const error2 = new Error()
  debug(`Line number: ${error2.lineNumber}`)
  debug('Loading Staff Module')
  modulebody.innerHTML = ''
  const staffDiv = document.createElement('div')
  staffDiv.id = 'staff'

  const staffHeader = document.createElement('h2')
  staffHeader.classList.add('header')

  const staffIcon = document.createElement('span')
  staffIcon.classList.add('icon')
  const span = document.createElement('span')
  span.classList.add('material-symbols-outlined')
  span.appendChild(document.createTextNode('badge'))
  staffIcon.appendChild(span)

  let staffheadertext = 'Timesheet Approval Queue'

  staffHeader.appendChild(staffIcon)
  staffHeader.appendChild(document.createTextNode(staffheadertext))
  staffDiv.appendChild(staffHeader)

  const formGroup = document.createElement('div')
  formGroup.classList.add('form-group', 'pull-right')
  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.classList.add('search', 'form-control')
  searchInput.placeholder = 'Search Staff'
  formGroup.appendChild(searchInput)
  staffDiv.appendChild(formGroup)

  const counterSpan = document.createElement('span')
  counterSpan.classList.add('counter', 'pull-right')
  staffDiv.appendChild(counterSpan)

  const table = document.createElement('table')
  table.id = 'staff-table'
  table.classList.add('table', 'table-hover', 'table-bordered', 'results')

  const thead = document.createElement('thead')
  const tr = document.createElement('tr')
  for (head of staffheaders) {
    const th = document.createElement('th')
    th.classList.add('col-md-3', 'col-xs-3')
    if (head.includes('Clock')){
      th.id = 'timesheet-clock'
      //th.style.width = '200px'
      th.style.width = '13%'
      th.style.fontSize = '15px'
    }
    th.appendChild(document.createTextNode(head))
    tr.appendChild(th)
    thead.appendChild(tr)
  }
  const warningTr = document.createElement('tr')
  warningTr.classList.add('warning', 'no-result')
  const td = document.createElement('td')
  td.colSpan = '4'

  const warningIcon = document.createElement('i')
  warningIcon.classList.add('fa', 'fa-warning')
  td.appendChild(warningIcon)
  td.appendChild(document.createTextNode(' No result'))
  warningTr.appendChild(td)
  thead.appendChild(warningTr)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  let today = new Date()
  let todayset = setdatehelper(today)
  let curstaffdata = staffdata
  //console.log(typeof curstaffdata)
  //console.log(curstaffdata)
  for (staff_d in curstaffdata) {
    const staffTr = document.createElement('tr')
    let staff = curstaffdata[staff_d]
    staffTr.id = staff['id']
    //for (info of staff) {
    //debug(info.first_name)
    let staffTd = document.createElement('td')
    staffTd.appendChild(document.createTextNode(staff['employee_id']))
    staffTd.id = staff['id']
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(
        `${staff['first_name']} ${fixstaffdata(staff['middle_name'])} ${
          staff['last_name']
        }`
      )
    )
    staffTd.id = staff['id']
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['date'])}`)
    )
    staffTd.id = staff['id']
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['building'])}`)
    )
    staffTd.id = staff['id']
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.className = 'timesheet-clock'
    let initial_time = convertTo12HourTime(staff['clock_in'])
    let ending_time = convertTo12HourTime(staff['proposed_in'])
    let initial_change = 0
    if (initial_time == "12:00 AM"){
      initial_time = "New"
    }
    if ((convertTo12HourTime(staff['proposed_in']) == convertTo12HourTime(staff['proposed_out'])) && (convertTo12HourTime(staff['proposed_out'])== "12:00 AM")){
      //staffTd.innerHTML = `${convertTo12HourTime(staff['clock_in'])}<span class="material-symbols-outlined">chevron_right</span>Delete`
      ending_time = "Delete"
      staffTd.classList.add('changed')
      initial_change = 1
    } else if (convertTo12HourTime(staff['proposed_in'])!=convertTo12HourTime(staff['clock_in'])){
      //staffTd.innerHTML = `${convertTo12HourTime(staff['clock_in'])}<span class="material-symbols-outlined">chevron_right</span>${convertTo12HourTime(staff['proposed_in'])}`
      staffTd.classList.add('changed')
      initial_change = 1
    } //else {


    if (initial_change == 0){
      staffTd.innerHTML = `${convertTo12HourTime(staff['clock_in'])}`
    } else {
      staffTd.innerHTML = `${initial_time}<span class="material-symbols-outlined">chevron_right</span>${ending_time}`
    }
    
    /*
    staffTd.appendChild(
      document.createTextNode(`${convertTo12HourTime(staff['clock_in'])}`)
    )
    */
    staffTd.id = staff['id']
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.className = 'timesheet-clock'

    let initial_time_out = convertTo12HourTime(staff['clock_out'])
    let ending_time_out = convertTo12HourTime(staff['proposed_out'])
    let out_change = 0

    if (initial_time_out == "12:00 AM"){
      initial_time_out = "New"
    }

    if ((convertTo12HourTime(staff['proposed_in']) == convertTo12HourTime(staff['proposed_out'])) && (convertTo12HourTime(staff['proposed_out'])== "12:00 AM")){
      //staffTd.innerHTML = `${convertTo12HourTime(staff['clock_out'])}<span class="material-symbols-outlined">chevron_right</span>Delete`
      ending_time_out = "Delete"
      staffTd.classList.add('changed')
      out_change = 1
    } else if (convertTo12HourTime(staff['clock_out'])!=convertTo12HourTime(staff['proposed_out'])){
      //staffTd.innerHTML = `${convertTo12HourTime(staff['clock_out'])}<span class="material-symbols-outlined">chevron_right</span>${convertTo12HourTime(staff['proposed_out'])}`
      staffTd.classList.add('changed')
      out_change = 1
    } 
    
    if (out_change == 0){
      staffTd.innerHTML = `${convertTo12HourTime(staff['clock_out'])}`
    } else {
      staffTd.innerHTML = `${initial_time_out}<span class="material-symbols-outlined">chevron_right</span>${ending_time_out}`
    }
    
    
    /*
    staffTd.appendChild(
      document.createTextNode(`${convertTo12HourTime(staff['clock_out'])}`)
    )
    */
    staffTd.id = staff['id']
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['comments'])}`)
    )
    staffTd.id = staff['id']
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['memo'])}`)
    )
    //console.log(fixstaffdata(staff['memo']))
    staffTd.id = staff['id']
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(`${fixstaffdata(staff['approved'])}`)
    )
    staffTd.id = staff['id']
    staffTr.appendChild(staffTd)
    /*
    staffTd = document.createElement('td')
    staffTd.innerHTML = staff['full_time']
      ? '<span class="material-symbols-outlined" id="staff-profile-btns">check</span>'
      : ''
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)
      */
    let totalh = 0
    let needs_rev = false
    let date1 = new Date('1970-01-01' + 'T' + staff['proposed_in'])
    let date2 = new Date('1970-01-01' + 'T' + staff['proposed_out'])

    let milis = date2.getTime() - date1.getTime()

    let tHours = milis / 1000 / 60 / 60
    //debug(tHours)
    totalh += tHours
    //debug('getting timelog for ' + staff['timelog'])
    /*
    for (c_logs of staff['timelog']) {
      //debug(c_logs)
      let date1 = new Date('1970-01-01' + 'T' + c_logs['clock_in'])
      let date2 = new Date('1970-01-01' + 'T' + c_logs['clock_out'])

      let milis = date2.getTime() - date1.getTime()

      let tHours = milis / 1000 / 60 / 60
      //debug(tHours)
      totalh += tHours

      if (c_logs['needs_review'] == true) {
        //&& c_logs['date'] != todayset){
        debug(c_logs['date'] + 'today is ' + todayset)
        staffTr.setAttribute('class', 'needs_review')
        needs_rev = true
      }
    }
    */
    staffTd = document.createElement('td')
    staffTd.appendChild(document.createTextNode(`${totalh.toFixed(2)}`))
    staffTr.appendChild(staffTd)
    tbody.appendChild(staffTr)
  }

  table.appendChild(tbody)
  staffDiv.appendChild(table)
  staffDiv.appendChild(table)

  modulebody.appendChild(staffDiv)

  /*
  const trselection = document.querySelector('tbody')
  trselection.addEventListener('dblclick', event => {
    debug(event.target.id)
    getSelectedItem('employee', event.target.id)
  })
  */
  $('.search').keyup(function () {
    var searchTerm = $('.search').val()
    var listItem = $('.results tbody').children('tr')
    var searchSplit = searchTerm.replace(/ /g, "'):containsi('")

    $.extend($.expr[':'], {
      containsi: function (elem, i, match, array) {
        return (
          (elem.textContent || elem.innerText || '')
            .toLowerCase()
            .indexOf((match[3] || '').toLowerCase()) >= 0
        )
      }
    })
    $('.results tbody tr')
      .not(":containsi('" + searchSplit + "')")
      .each(function (e) {
        $(this).attr('visible', 'false')
      })

    $(".results tbody tr:containsi('" + searchSplit + "')").each(function (e) {
      $(this).attr('visible', 'true')
    })

    var jobCount = $('.results tbody tr[visible="true"]').length
    $('.counter').text(jobCount + ' item')

    if (jobCount == '0') {
      $('.no-result').show()
    } else {
      $('.no-result').hide()
    }
  })
  const trselection = document.querySelector('tbody')
  trselection.addEventListener('dblclick', event => {
    debug(event.target.id)
    getSelectedItem(
      type === 'archived' ? 'archem' : 'employee',
      event.target.id
    )
  })
  /*
  if (type === "archived"){
    //edit table
    const logtable = document.querySelector('.mainContent.clearfix tbody')
    logtable.addEventListener('dblclick', function (e) {
      if (e.target.tagName === 'TD') {
        debug(e.target.innerHTML)
        if (!e.target.parentNode.innerHTML.includes('button')) {
          const row = e.target.parentNode
          // Make the content of the row editable
          //row.contentEditable = true
          debug(row.id)
          // Add a save button
          const resButton = document.createElement('button')
          resButton.innerHTML = 'Restore'
          resButton.id = 'restoreData'
          row.appendChild(resButton)
          resButton.addEventListener('click', function () {
            // Save the edited content
            //row.contentEditable = false
            // You could send the new data to the server here
            // E.g. using an XMLHttpRequest or fetch API
            // For now, let's just log the content
            //debug(row);
            let bid = row.id
            debug(bid)
            let updatebd = `&id=${bid}&target=restore`
            //updatetablebuffer(id,'PATCH',updatebd,popupTable)
            //httpr('PATCH', 'employeelogs', updatebd)
            updateemployee(updatebd)
            //remove the save button
            staffchanged = 1
            row.removeChild(resButton)
          })


        }
      }
    })
  } else {
  }
  */
  //select rows

  //edit table
  let curtrid = 0
  //cur_id = 0

  const logtable = document.querySelector('#staff-table tbody')
  logtable.addEventListener('mouseover', function (e) {
    const rows = table.querySelectorAll("tr");
    const checkboxesExist = rows[0] && rows[0].querySelector("input[type='checkbox']");
    logtable.forEach
    if (e.target.tagName === 'TD') {
      debug(e.target.innerHTML)
      if (!e.target.parentNode.innerHTML.includes('button') && !checkboxesExist) {
        curtrid = e.target.parentNode.id
        //console.log(curtrid)
        const row = e.target.parentNode

        // Make the content of the row editable
        row.contentEditable = true

        // Add a save button
        const saveButton = document.createElement('button')
        saveButton.innerHTML = 'Approve'
        saveButton.id = 'saveData'
        row.appendChild(saveButton)
        //updateapprovaltable
        saveButton.addEventListener('click', function () {
          // Save the edited content
          row.contentEditable = false
          // You could send the new data to the server here
          // E.g. using an XMLHttpRequest or fetch API
          // For now, let's just log the content
          //debug(row);
          let bid = row.id, co, mem
          try{
            co = row.children[6].textContent
          } catch { co = ''}
          try {
            mem = row.children[7].textContent
          } catch { mem = ''}
          //debug(bid + dt + ci + co))
          let dec = '1'
          if (row.children[4].textContent.includes('Delete') && row.children[5].textContent.includes('Delete')){
            dec = '2'
          }
          let updatebd = `&id=${bid}&com=${co}&dec=${dec}&mem=${mem}`
          //console.log(updatebd)
          updatetablebuffer(0, 'POST', updatebd, table)
          //httpr('PATCH', 'employeelogs', updatebd)

          //remove the save button
          staffchanged = 1
          row.removeChild(saveButton)
        })

        // Add a Del button
        const delButton = document.createElement('button')
        delButton.innerHTML = 'Deny'
        delButton.id = 'delData'

        row.appendChild(delButton)

        delButton.addEventListener('click', function () {
          // Save the edited content
          row.contentEditable = false
          // You could send the new data to the server here
          // E.g. using an XMLHttpRequest or fetch API
          // For now, let's just log the content
          //debug(row);
          let bid = row.id,
            co = row.children[6].textContent,
            mem = row.children[7].textContent
          //debug(bid + dt + ci + co)
          let updatebd = `&id=${bid}&com=${co}&dec=0&mem=${mem}`
          updatetablebuffer(0, 'POST', updatebd, table)
          //console.log(updatebd)
          //httpr('PATCH', 'employeelogs', updatebd)

          //remove the save button
          staffchanged = 1
          row.removeChild(delButton)
        })
      }
    }
    
    const hoveredRow = e.target.parentNode;
    const allRows = document.querySelectorAll('#staff-table tbody tr');
    allRows.forEach(row => {
      if (row !== hoveredRow) {
        const saveButton = row.querySelector('#saveData');
        const delButton = row.querySelector('#delData');

        if (saveButton) {
          row.removeChild(saveButton);
        }

        if (delButton) {
          row.removeChild(delButton);
        }
      }
    });
    
  })
}


//XHR request to get archived staff data
async function getarchstaffdata (bypass) {
  debug(getdate['startdate'] + getdate['enddate'])
  let cur_time = new Date().getTime()
  if (bypass == 0) {
    if (getdate['lastarsync'] == '') {
      getdate['lastarsync'] = cur_time
    } else if (cur_time < getdate['lastarsync'] + 300000) {
      return
    }
  }

  getdate['lastarsync'] = cur_time
  let req = `&sd=${getdate['startdate']}&ed=${getdate['enddate']}&target=archived`
  archstaffdata = await httpr('GET', 'employeelogs', req)
  debug(archstaffdata)
}

//Loads the Settings Module
function settingsmodule () {
  debug('Loading Settings Module')
  modulebody.innerHTML = ''
}

function convertTo12HourTime (timeString) {
  let tempdat = timeString.split('.')
  timeString = tempdat[0]
  // Parse the time string using the Date object
  const date = new Date(`1970-01-01 ${timeString}:00`)

  // Extract the hours and minutes from the date object
  const hours = date.getHours()
  const minutes = date.getMinutes()

  // Determine whether the time is AM or PM
  let ampm = 'AM'
  if (hours >= 12) {
    ampm = 'PM'
  }

  // Convert the hours to 12 hour format
  let hour12 = hours % 12
  if (hour12 === 0) {
    hour12 = 12
  }

  // Format the minutes as a 2-digit string
  const minuteString = (minutes < 10 ? '0' : '') + minutes

  // Return the formatted time string
  return `${hour12}:${minuteString} ${ampm}`
}

async function getSelectedItem (type, id) {
  //input_popup(type,'Hello!',id)
  trpop = document.querySelector('#trpop')
  trpop.innerHTML = ''
  var seldata = ''
  debug(type)
  switch (type) {
    case 'employee':
      seldata = staffdata[id]
      debug(staffdata[id])
      break
    case 'archem':
      seldata = archstaffdata[id]
      debug(archstaffdata[id])
      break
  }

  if (seldata === '') return

  // Create the pop-up window element
  const popup = document.querySelector('#trpop')
  //document.createElement('div');
  //popup.classList.add('addemployee');
  //popup.id = 'addemployee';

  // Create the pop-up content element
  const popupContent = document.createElement('div')
  popupContent.classList.add('popup-content')
  popup.appendChild(popupContent)

  var xbtn = document.createElement('BUTTON')
  xbtn.innerHTML = 'X'
  xbtn.classList.add('closeBtn')
  popupContent.appendChild(xbtn)

  // Create the pop-up header element
  const popupHeader = document.createElement('div')
  popupHeader.classList.add('popup-header')
  popupContent.appendChild(popupHeader)

  // Create the pop-up header title element
  const popupTitle = document.createElement('h1')
  popupTitle.textContent = seldata['first_name'] + ' ' + seldata['last_name']
  
  // Add print button to title
  const printButton = document.createElement('button')
  printButton.innerHTML =
    '<span class="material-symbols-outlined" id="staff-profile-btns">print</span>'
  printButton.id = 'staff-print'
  popupTitle.appendChild(printButton)

  // Add print button to title
  const exportcsvButton = document.createElement('button')
  exportcsvButton.innerHTML =
    '<span class="material-symbols-outlined" id="sheet">rubric</span>'
  exportcsvButton.id = 'exportCSVBtn'
  popupTitle.appendChild(exportcsvButton)

  // Add delete or restore button to title
  const delresstaffButton = document.createElement('button')
  let delresicon =
    cur_page === 'archived staff' ? 'restore_from_trash' : 'delete'
  delresstaffButton.innerHTML = `<span class="material-symbols-outlined" id="staff-profile-btns">${delresicon}</span>`
  let delresid =
    cur_page === 'archived staff' ? 'restore-staff' : 'delete-staff'
  delresstaffButton.id = delresid
  popupTitle.appendChild(delresstaffButton)
  popupHeader.appendChild(popupTitle)

  const profilediv = document.createElement('div')
  profilediv.id = 'profile-div-btns'

  const editprofile = document.createElement('button')
  editprofile.classList.add('edit-staff-profile')
  editprofile.textContent = 'Edit Staff'
  profilediv.appendChild(editprofile)
  //popupHeader.appendChild(editprofile)

  const addtprofile = document.createElement('button')
  addtprofile.classList.add('add-time-profile')
  addtprofile.textContent = 'Add Time'
  profilediv.appendChild(addtprofile)
  //popupHeader.appendChild(addtprofile)

  popupHeader.appendChild(profilediv)

  // Create the pop-up body element
  const popupBody = document.createElement('div')
  popupBody.classList.add('popup-body')
  popupContent.appendChild(popupBody)

  // Create the full time select field
  const ftInputGroup = document.createElement('div')
  ftInputGroup.classList.add('form-group')
  popupBody.appendChild(ftInputGroup)

  const ftLabel = document.createElement('label')
  ftLabel.setAttribute('for', 'ftSelect')
  ftLabel.textContent = 'Fulltime: ' + seldata['full_time']
  ftInputGroup.appendChild(ftLabel)

  const ftSelect = document.createElement('select')
  ftSelect.classList.add('form-control')
  ftSelect.id = 'ftSelect'
  ftInputGroup.appendChild(ftSelect)
  let ftpt = [true, false]
  for (ft of ftpt) {
    const ftOption = document.createElement('option')
    ftOption.setAttribute('value', ft)
    ftOption.textContent = ft
    ftSelect.appendChild(ftOption)
  }

  ftSelect.value = seldata['full_time']

  const firstNameInputGroup = document.createElement('div')
  firstNameInputGroup.classList.add('form-group', 'inline-inputs')
  popupBody.appendChild(firstNameInputGroup)

  const firstNameLabel = document.createElement('label')
  firstNameLabel.setAttribute('for', 'firstNameInput')
  firstNameLabel.textContent =
    'First Name: ' + fixstaffdata(seldata['first_name'])
  firstNameInputGroup.appendChild(firstNameLabel)

  const firstNameInput = document.createElement('input')
  firstNameInput.classList.add('form-control')
  firstNameInput.id = 'firstNameInput'
  firstNameInput.value = fixstaffdata(seldata['first_name'])
  firstNameInput.setAttribute('type', 'text')
  firstNameInput.setAttribute('required', true)
  firstNameInputGroup.appendChild(firstNameInput)

  // Create the middle name input field
  const middleNameInputGroup = document.createElement('div')
  middleNameInputGroup.classList.add('form-group', 'inline-inputs')
  popupBody.appendChild(middleNameInputGroup)

  const middleNameLabel = document.createElement('label')
  middleNameLabel.setAttribute('for', 'middleNameInput')
  middleNameLabel.textContent =
    'Middle Name: ' + fixstaffdata(seldata['middle_name'])
  middleNameInputGroup.appendChild(middleNameLabel)

  const middleNameInput = document.createElement('input')
  middleNameInput.classList.add('form-control')
  middleNameInput.id = 'middleNameInput'
  middleNameInput.value = fixstaffdata(seldata['middle_name'])
  middleNameInput.setAttribute('type', 'text')
  middleNameInputGroup.appendChild(middleNameInput)

  // Create the last name input field
  const lastNameInputGroup = document.createElement('div')
  lastNameInputGroup.classList.add('form-group', 'inline-inputs')
  popupBody.appendChild(lastNameInputGroup)

  const lastNameLabel = document.createElement('label')
  lastNameLabel.setAttribute('for', 'lastNameInput')
  lastNameLabel.textContent = 'Last Name: ' + fixstaffdata(seldata['last_name'])
  lastNameInputGroup.appendChild(lastNameLabel)

  const lastNameInput = document.createElement('input')
  lastNameInput.classList.add('form-control')
  lastNameInput.id = 'lastNameInput'
  lastNameInput.value = fixstaffdata(seldata['last_name'])
  lastNameInput.setAttribute('type', 'text')
  lastNameInput.setAttribute('required', true)
  lastNameInputGroup.appendChild(lastNameInput)

  // Create the pin input field
  const pinInputGroup = document.createElement('div')
  pinInputGroup.classList.add('form-group')
  popupBody.appendChild(pinInputGroup)

  const pinLabel = document.createElement('label')
  pinLabel.setAttribute('for', 'pinInput')
  pinLabel.textContent = 'PIN'
  pinInputGroup.appendChild(pinLabel)

  const pinInput = document.createElement('input')
  pinInput.setAttribute('type', 'text')
  pinInput.setAttribute('pattern', '[0-9]*')
  pinInput.setAttribute('required', true)
  pinInput.classList.add('form-control')
  pinInput.id = 'pinInput'
  pinInputGroup.appendChild(pinInput)

  // Create the job role input field
  const jobRoleInputGroup = document.createElement('div')
  jobRoleInputGroup.classList.add('form-group')
  popupBody.appendChild(jobRoleInputGroup)

  const jobRoleLabel = document.createElement('label')
  jobRoleLabel.setAttribute('for', 'jobRoleInput')
  //jobRoleLabel.setAttribute('data-target','jobRoleInput')
  jobRoleLabel.textContent = 'Job Role: ' + fixstaffdata(seldata['job_role'])
  jobRoleInputGroup.appendChild(jobRoleLabel)

  const jobRoleInput = document.createElement('input')
  jobRoleInput.setAttribute('type', 'text')
  jobRoleInput.classList.add('form-control')
  jobRoleInput.id = 'jobRoleInput'
  jobRoleInput.value = fixstaffdata(seldata['job_role'])
  //jobRoleInput.style.display = 'none';
  jobRoleInputGroup.appendChild(jobRoleInput)

  // Create the gender select field
  const genderInputGroup = document.createElement('div')
  genderInputGroup.classList.add('form-group')
  popupBody.appendChild(genderInputGroup)

  const genderLabel = document.createElement('label')
  genderLabel.setAttribute('for', 'genderSelect')
  genderLabel.textContent = 'Gender: ' + seldata['sex']
  genderInputGroup.appendChild(genderLabel)

  const genderSelect = document.createElement('select')
  genderSelect.classList.add('form-control')
  genderSelect.id = 'genderSelect'
  genderInputGroup.appendChild(genderSelect)

  const genderOption2 = document.createElement('option')
  genderOption2.setAttribute('value', 'F')
  genderOption2.textContent = 'Female'
  genderSelect.appendChild(genderOption2)

  const genderOption1 = document.createElement('option')
  genderOption1.setAttribute('value', 'M')
  genderOption1.textContent = 'Male'
  genderSelect.appendChild(genderOption1)

  genderSelect.value = seldata['sex']
  // Create the birthdate input field
  const birthdateInputGroup = document.createElement('div')
  birthdateInputGroup.classList.add('form-group')
  popupBody.appendChild(birthdateInputGroup)

  const birthdateLabel = document.createElement('label')
  birthdateLabel.setAttribute('for', 'birthdateInput')
  birthdateLabel.textContent =
    'Birthdate: ' + fixstaffdata(seldata['birthdate'])
  birthdateInputGroup.appendChild(birthdateLabel)

  const birthdateInput = document.createElement('input')
  birthdateInput.setAttribute('type', 'date')
  birthdateInput.classList.add('form-control')
  birthdateInput.id = 'birthdateInput'
  birthdateInput.setAttribute('value', fixstaffdata(seldata['birthdate']))

  birthdateInputGroup.appendChild(birthdateInput)

  // Create the building select field
  const buildingInputGroup = document.createElement('div')
  buildingInputGroup.classList.add('form-group')
  popupBody.appendChild(buildingInputGroup)

  const buildingLabel = document.createElement('label')
  buildingLabel.setAttribute('for', 'buildingSelect')
  buildingLabel.textContent = 'Building: ' + seldata['building']
  buildingInputGroup.appendChild(buildingLabel)

  const buildingSelect = document.createElement('select')
  buildingSelect.classList.add('form-control')
  buildingSelect.id = 'buildingSelect'
  buildingInputGroup.appendChild(buildingSelect)
  debug('Buildings are ')
  debug(getdata['buildings'])
  for (building of getdata['buildings']) {
    const buildingOption = document.createElement('option')
    buildingOption.setAttribute('value', building)
    buildingOption.textContent = building
    buildingSelect.appendChild(buildingOption)
  }

  buildingSelect.value = seldata['building']
  /*             add time                     */
  const addtime = document.createElement('div')
  addtime.id = 'profile-add-time'

  // Create the date input field
  const dateInputGroup = document.createElement('div')
  dateInputGroup.classList.add('form-group')
  addtime.appendChild(dateInputGroup)

  const dateLabel = document.createElement('label')
  dateLabel.setAttribute('for', 'dateInput')
  dateLabel.textContent = 'Date'
  dateInputGroup.appendChild(dateLabel)

  const dateInput = document.createElement('input')
  dateInput.setAttribute('type', 'date')
  //dateInput.classList.add('form-control')
  dateInput.id = 'dateInput'
  dateInput.setAttribute('value', getdate['enddate'])

  dateInputGroup.appendChild(dateInput)

  //Clock in label
  const tpcinInputGroup = document.createElement('div')
  tpcinInputGroup.classList.add('form-group')
  addtime.appendChild(tpcinInputGroup)

  const tpcinLabel = document.createElement('label')
  tpcinLabel.setAttribute('for', 'tpcinInput')
  tpcinLabel.textContent = 'Clock In'
  tpcinInputGroup.appendChild(tpcinLabel)

  const tp_cin = document.createElement('input')
  tp_cin.setAttribute('type', 'text')
  tp_cin.id = 'timepickerin'
  tpcinInputGroup.appendChild(tp_cin)

  //Clock out label
  const tpcoInputGroup = document.createElement('div')
  tpcoInputGroup.classList.add('form-group')
  addtime.appendChild(tpcoInputGroup)

  const tpcoLabel = document.createElement('label')
  tpcoLabel.setAttribute('for', 'tpcoInput')
  tpcoLabel.textContent = 'Clock Out'
  tpcoInputGroup.appendChild(tpcoLabel)

  const tp_co = document.createElement('input')
  tp_co.setAttribute('type', 'text')
  tp_co.id = 'timepickerout'
  tpcoInputGroup.appendChild(tp_co)

  //Reason label
  const rsonInputGroup = document.createElement('div')
  rsonInputGroup.classList.add('form-group')
  addtime.appendChild(rsonInputGroup)

  const reasonlabel = document.createElement('label');
  reasonlabel.textContent = 'Reason';
  reasonlabel.setAttribute('for', 'reason');
  
  const rsselect = document.createElement('select');
  rsselect.id = 'reason';
  
  const vacationOption = new Option('Vacation', 'Vacation');
  const sickOption = new Option('Sick', 'Sick');
  const OtherOption = new Option('Other', 'Other');
  OtherOption.selected = true;
  
  rsselect.appendChild(vacationOption);
  rsselect.appendChild(sickOption);
  rsselect.appendChild(OtherOption);
  
  rsonInputGroup.appendChild(reasonlabel);
  rsonInputGroup.appendChild(rsselect);

  // COMMENTS
  const cmmtInputGroup = document.createElement('div')
  cmmtInputGroup.classList.add('form-group')
  addtime.appendChild(cmmtInputGroup)

  const commentsLabel = document.createElement('label');
  commentsLabel.textContent = 'Comments:';
  commentsLabel.setAttribute('for', 'comments');

  const commentsInput = document.createElement('input');
  commentsInput.type = 'text';
  commentsInput.id = 'comments';

  cmmtInputGroup.appendChild(commentsLabel)
  cmmtInputGroup.appendChild(commentsInput)

  const addtimeButton = document.createElement('button')
  addtimeButton.classList.add('btn', 'add-time-save')
  addtimeButton.textContent = 'Save'
  addtime.appendChild(addtimeButton)

  popupContent.appendChild(addtime)

  const popupTable = document.createElement('div')
  popupTable.classList.add('popup-Table')
  popupContent.appendChild(popupTable)
  updatetablebuffer(id, 'None', '', popupTable)
  //popupTable.appendChild(table)

  /*                                 */
  // Create the cancel and ok buttons
  const popupFooter = document.createElement('div')
  popupFooter.classList.add('popup-footer')
  popupBody.appendChild(popupFooter)

  const cancelButton = document.createElement('button')
  cancelButton.classList.add('btn', 'cancel-profile')
  cancelButton.textContent = 'Cancel'
  popupFooter.appendChild(cancelButton)

  const okButton = document.createElement('button')
  okButton.classList.add('btn', 'save-profile')
  okButton.textContent = 'Save'
  popupFooter.appendChild(okButton)

  popup.style.display = 'none'

  // Attach an event listener to the button
  printButton.addEventListener('click', function () {
    //printTable(tableId);
    let selheader = seldata['first_name'] + ' ' + seldata['last_name']
    let tableid = 'staff-profile'
    printTable(tableid, selheader)
  })
  $(function () {
    $('#timepickerin').timepicker({
      minTime: '7:00am',
      maxTime: '7:00pm'
    })
    $('#timepickerout').timepicker({
      minTime: '7:00am',
      maxTime: '7:00pm'
    })

    //Slide toggle for add time
    $('.trpop #profile-add-time').css('display', 'none')
    $('.add-time-profile').click(function () {
      $('.trpop #profile-add-time').slideToggle()
    })
  })

  addtimeButton.addEventListener('click', () => {
    let at_date = dateInput.value
    let at_cin = tp_cin.value
    let at_co = tp_co.value
    let at_rs = rsselect.value
    let at_com = commentsInput.value
    if (![at_date, at_cin, at_co].includes('')) {
      let atdata = `&id=${id}&cin=${at_cin}&co=${at_co}&dt=${at_date}&bd=${seldata['building']}&ip=${iplog}&mem=${at_rs}&com=${at_com}`
      debug(atdata)
      //httpr('POST', 'employeelogs', atdata)
      //console.log(atdata)
      updatetablebuffer(id, 'POST', atdata, popupTable)
      staffchanged = 1
      document.querySelectorAll('.trpop #profile-add-time input').forEach(e => {
        e.value = ''
      })
      $('.trpop #profile-add-time').slideToggle()
    }
  })

  //Slide toggle for editing staff data
  $(document).ready(function () {
    $('.trpop .popup-body').css('display', 'none')
    $('#delete-staff').css('display', 'none')
    $('#restore-staff').css('display', 'none')
    $('.edit-staff-profile').click(function () {
      $('.trpop #delete-staff').slideToggle()
      $('.trpop #restore-staff').slideToggle()
      $('.trpop .popup-body').slideToggle()
    })
  })

  xbtn.addEventListener('click', () => {
    if (staffchanged == 1) {
      staffchanged = 0
      getstaffdata(1)
    }
    //document.querySelector('body').style.height = '266px'
    popup.style.display = 'none'
  })

  //edit table
  /*
  const logtable = document.querySelector('.trpop #staff-profile tbody')
  logtable.addEventListener('dblclick', function (e) {
    if (e.target.tagName === 'TD') {
      debug(e.target.innerHTML)
      if (!e.target.parentNode.innerHTML.includes('button')) {
        const row = e.target.parentNode
        // Make the content of the row editable
        row.contentEditable = true

        // Add a save button
        const saveButton = document.createElement('button')
        saveButton.innerHTML = 'Save'
        saveButton.id = 'saveData'

        row.appendChild(saveButton)

        saveButton.addEventListener('click', function () {
          // Save the edited content
          row.contentEditable = false
          // You could send the new data to the server here
          // E.g. using an XMLHttpRequest or fetch API
          // For now, let's just log the content
          //debug(row);
          let bid = row.id,
            dt = row.children[1].textContent,
            ci = row.children[2].textContent,
            co = row.children[3].textContent
          debug(bid + dt + ci + co)
          let updatebd = `&id=${bid}&dt=${dt}&ci=${ci}&co=${co}`
          updatetablebuffer(id,'PATCH',updatebd)
          //httpr('PATCH', 'employeelogs', updatebd)

          //remove the save button
          staffchanged = 1
          row.removeChild(saveButton)
        })

        // Add a Del button
        const delButton = document.createElement('button')
        delButton.innerHTML = 'Delete'
        delButton.id = 'delData'

        row.appendChild(delButton)

        delButton.addEventListener('click', function () {
          // Save the edited content
          row.contentEditable = false
          // You could send the new data to the server here
          // E.g. using an XMLHttpRequest or fetch API
          // For now, let's just log the content
          //debug(row);
          let bid = row.id,
            dt = '',
            ci = row.children[2].textContent,
            co = row.children[3].textContent
          debug(bid + dt + ci + co)
          let updatebd = `&id=${bid}&dt=${dt}&ci=${ci}&co=${co}`
          updatetablebuffer(id,'PATCH',updatebd)
          //httpr('PATCH', 'employeelogs', updatebd)

          //remove the save button
          staffchanged = 1
          row.removeChild(delButton)
        })


      }
    }
  }) */

  exportcsvButton.addEventListener("click", function() {

    let url = `${API_URL}/AppHMG/export_csv?Authorization=Bearer%20${token}&eid=${id}`
    // Make a GET request to the API endpoint
    let date2 = new Date();

    let day = date2.getDate();
    let month = date2.getMonth() + 1;
    let year = date2.getFullYear();
    let sheetdate = year + "_" + month + "_" + day;

    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            // Create a temporary link element
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            //let csvtitle = $`Punchclock_${fullname}_${sheetdate}.csv`
            //let fullname = seldata['first_name'] + '_' + seldata['last_name']
            csvtitle = "Punchclock_" + seldata['first_name'] + '_' + seldata['last_name'] + "_" + sheetdate + ".csv"
            link.setAttribute('download', csvtitle);
            // Trigger the download
            document.body.appendChild(link);
            link.click();
            // Cleanup
            link.parentNode.removeChild(link);
        })
        .catch(error => console.error('Error exporting data:', error));
    });
  

  delresstaffButton.addEventListener('click', () => {
    try {
      const emfirstName = ''
      const emmiddleName = middleNameInput.value
      const emlastName = lastNameInput.value
      const empin = pinInput.value
      const emjobRole = jobRoleInput.value
      const emgender = genderSelect.value
      const embirthdate = birthdateInput.value
      const embuilding = buildingSelect.value

      debug(
        emfirstName,
        emmiddleName,
        emlastName,
        empin,
        emjobRole,
        emgender,
        embirthdate,
        embuilding
      )
      if (cur_page === 'archived staff') {
        let updateem = `&id=${id}&target=restore`
        debug(updateem)
        updateemployee(updateem)
      } else {
        let updateem = `&id=${id}&fn=${emfirstName}&mn=${emmiddleName}&ln=${emlastName}&jr=${emjobRole}&sex=${emgender}&bd=${embirthdate}&bu=${embuilding}&pn=${empin}`
        debug(updateem)
        postdata('PATCH', 'employees', updateem)
      }
    } catch (err) {
      debug(err)
    }
    // Do something with the input
    document.querySelectorAll('.addemployee input').forEach(e => {
      e.value = ''
    })
    //document.querySelector('body').style.height = '266px'
    popup.style.display = 'none'
  })

  // Handle the "Cancel" button
  cancelButton.addEventListener('click', () => {
    $('.trpop .popup-body').slideToggle()
  })

  // Handle the "OK" button
  okButton.addEventListener('click', () => {
    try {
      const emfulltime = ftSelect.value
      const emfirstName = firstNameInput.value
      const emmiddleName = middleNameInput.value
      const emlastName = lastNameInput.value
      const empin = pinInput.value
      const emjobRole = jobRoleInput.value
      const emgender = genderSelect.value
      const embirthdate = birthdateInput.value
      const embuilding = buildingSelect.value

      debug(
        emfulltime,
        emfirstName,
        emmiddleName,
        emlastName,
        empin,
        emjobRole,
        emgender,
        embirthdate,
        embuilding
      )
      let updateem = `&id=${id}&fn=${emfirstName}&mn=${emmiddleName}&ln=${emlastName}&jr=${emjobRole}&sex=${emgender}&bd=${embirthdate}&bu=${embuilding}&pn=${empin}&ft=${emfulltime}`
      debug(updateem)
      postdata('PATCH', 'employees', updateem)
    } catch (err) {
      debug(err)
    }
    // Do something with the input
    document.querySelectorAll('.addemployee input').forEach(e => {
      e.value = ''
    })
    //document.querySelector('body').style.height = '266px'
    popup.style.display = 'none'
  })
  /*
        let popbody = document.querySelector('.popup-body')
        popbody.addEventListener('click', event => {
            //document.getElementById(event.target.id).style.display = 'flex'
            debug(event.target.id)
            //event.target.id.classList.toggle('show')
            document.querySelector(`.trpop #${event.target.id}`).classList.toggle('show')
            //event.target.style.display = 'block'
        })
        */
  trpop.style.display = 'flex'
  return popup
}

async function updatetablebuffer (id, type, data, popupTable, sort = 'date-desc') {
  cur_id = id, cur_type = type, cur_atdata = data, cur_popupTable = popupTable, cur_sort = sort
  if (id == 0){
    await updateapprovaltable(id,type,data,popupTable)
  } else {
    await updatetable(id, type, data, popupTable, sort)
  }
}

async function updatetable (id, type, data, popupTable, sort) {
  if (data == '1'){
    data = ''
    let staff_profile_table = document.querySelector('#staff-profile')
    popupTable.removeChild(staff_profile_table)
  } else if (data.includes('dec=2')){
    await httpr(type, 'employeepending', data)
    await getstaffdata(1)
  } else if (data != '' && data !='1') {
      await httpr(type, 'employeelogs', data)
      await getstaffdata(1)
  }
  console.log(data)
  console.log(data.includes('dec=2'))
  let seldata =
    cur_page === 'archived staff' ? archstaffdata[id] : staffdata[id]
  let staffheaders = ['ID', 'Date', 'Clock in', 'Clock out','Comments','Memo', 'Total Hours']
  const table = document.createElement('table')
  table.id = 'staff-profile'
  table.classList.add('table', 'table-hover', 'table-bordered', 'results')

  const thead = document.createElement('thead')
  const tr = document.createElement('tr')
  for (head of staffheaders) {
    const th = document.createElement('th')
    th.classList.add('col-md-3', 'col-xs-3')
    th.id = head
    if (head == 'Date'){
      if (sort.includes('date-')){
        head = sort == 'date-desc' ? head + ' v' : head + ' ^';
      }
      th.addEventListener('click', function () {
        if (sort == 'date-desc'){
          updatetablebuffer(id,type,'1',popupTable, 'date-asc')
        } else {
          updatetablebuffer(id,type,'1',popupTable, 'date-desc')
        }
      })
    }
    if (head == 'ID'){
      if (sort.includes('id-')){
        head = sort == 'id-desc' ? head + ' v' : head + ' ^';
      }
      th.addEventListener('click', function () {
        if (sort == 'id-desc'){
          updatetablebuffer(id,type,'1',popupTable, 'id-asc')
        } else {
          updatetablebuffer(id,type,'1',popupTable, 'id-desc')
        }
      })
    }
    if (head == 'Memo'){
      if (sort.includes('memo-')){
        head = sort == 'memo-desc' ? head + ' v' : head + ' ^';
      }
      th.addEventListener('click', function () {
        if (sort == 'memo-desc'){
          updatetablebuffer(id,type,'1',popupTable, 'memo-asc')
        } else {
          updatetablebuffer(id,type,'1',popupTable, 'memo-desc')
        }
      })
    }
    th.appendChild(document.createTextNode(head))
    tr.appendChild(th)
    thead.appendChild(tr)
  }
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  let grandtotal = 0
  let seldata_sorted = seldata['timelog']
  switch (sort){
    case 'date-asc': seldata_sorted.sort((a, b) => a.date.localeCompare(b.date)); break;    //seldata_sorted.sort((a, b) => a.date - b.date);break;//oldest to newest
    case 'date-desc': seldata_sorted.sort((a, b) => b.date.localeCompare(a.date)); break; //seldata_sorted.sort((a, b) => b.date - a.date); break;//newest to oldest
    case 'id-asc': seldata_sorted.sort((a, b) => a.id - b.id); break; //lowest to highest
    case 'id-desc': seldata_sorted.sort((a, b) => b.id - a.id); break; //highest to lowest
    case 'memo-asc': seldata_sorted.sort((a, b) => (a.memo || '').localeCompare(b.memo || '')); break; //less to most
    case 'memo-desc': seldata_sorted.sort((a, b) => (b.memo || '').localeCompare(a.memo || '')); break; //most to less
    default: seldata_sorted.sort((a, b) => b.date - a.date); break;//date-desc
  }
  for (staff_d in seldata_sorted) {
    const staffTr = document.createElement('tr')
    //staffTr.id = staff_d
    //for (info of staff) {
    //debug(info.first_name)
    debug(seldata['timelog'][staff_d])
    let staff = seldata['timelog'][staff_d]
    staffTr.id = staff['id']
    let staffTd = document.createElement('td')
    staffTd.appendChild(document.createTextNode(staff['id']))
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(document.createTextNode(staff['date']))
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    debug(staff['clock_in'])
    staffTd.appendChild(
      document.createTextNode(convertTo12HourTime(staff['clock_in']))
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(convertTo12HourTime(staff['clock_out']))
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(fixstaffdata(staff['comments']))
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode(fixstaffdata(staff['memo']))
    )
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    let totalh = 0
    let needs_rev = false
    let date1 = new Date('1970-01-01' + 'T' + staff['clock_in'])
    let date2 = new Date('1970-01-01' + 'T' + staff['clock_out'])

    let milis = date2.getTime() - date1.getTime()

    let tHours = milis / 1000 / 60 / 60
    //debug(tHours)
    totalh += tHours
    
    totalhourscell = totalh.toFixed(2)
    if (staff['needs_review'] == true) {
      //&& c_logs['date'] != todayset){
      staffTr.setAttribute('class', 'needs_review')
      needs_rev = true
      totalhourscell = "NEEDS REVIEW"
      totalh = 0
    }

    staffTd = document.createElement('td')
    staffTd.appendChild(document.createTextNode(`${totalhourscell}`))
    staffTr.appendChild(staffTd)
    grandtotal += totalh
    //if (staff[staff.length-1] >= 80){
    //    staffTr.setAttribute("id","overtime");
    //}
    //}
    /*
    if (staff['approved']=='approved'){
      tbody.appendChild(staffTr)
    }
    */
    if ((convertTo12HourTime(staff['clock_in']) != convertTo12HourTime(staff['clock_out'])) && (convertTo12HourTime(staff['clock_out']) != "12:00 AM")){
      tbody.appendChild(staffTr)
    }
    
    /*
            switch(type){
                case "overtime": if (totalh >= 80){tbody.appendChild(staffTr)}; break;
                case "needs_review": if (needs_rev){tbody.appendChild(staffTr)}; break;
                case "active": if (totalh > 0){tbody.appendChild(staffTr)}; break;
                default: tbody.appendChild(staffTr); break;
            }*/
  }
  let staffTr = document.createElement('tr')
  let staffTd = document.createElement('td')
  let staffgrandarr = ['', '', '','','', 'Grand Total', `${grandtotal.toFixed(2)}`]
  for (cell of staffgrandarr) {
    staffTd = document.createElement('td')
    staffTd.appendChild(document.createTextNode(cell))
    staffTd.style.fontWeight = 'bold'
    staffTr.appendChild(staffTd)
  }
  tbody.appendChild(staffTr)

  table.appendChild(tbody)
  if (data === '') {
    popupTable.appendChild(table)
  } else {
    const popupTable2 = document.createElement('div')
    popupTable2.classList.add('popup-Table')
    popupTable2.appendChild(table)
    document.querySelector('.trpop .popup-Table').outerHTML =
      popupTable2.outerHTML
  }

  //edit table
  const logtable = document.querySelector('.trpop #staff-profile tbody')
  logtable.addEventListener('dblclick', function (e) {
    if (e.target.tagName === 'TD') {
      debug(e.target.innerHTML)
      if (!e.target.parentNode.innerHTML.includes('button')) {
        const row = e.target.parentNode
        // Make the content of the row editable
        row.contentEditable = true

        // Add a save button
        const saveButton = document.createElement('button')
        saveButton.innerHTML = 'Save'
        saveButton.id = 'saveData'
        row.appendChild(saveButton)
        saveButton.addEventListener('click', function () {
          // Save the edited content
          row.contentEditable = false
          // You could send the new data to the server here
          // E.g. using an XMLHttpRequest or fetch API
          // For now, let's just log the content
          //debug(row);
          let bid = row.id,
            dt = row.children[1].textContent,
            ci = row.children[2].textContent,
            co = row.children[3].textContent,
            com = row.children[4].textContent,
            mem = row.children[5].textContent
          debug(bid + dt + ci + co)
          let updatebd = `&id=${bid}&dt=${dt}&ci=${ci}&co=${co}&com=${com}&mem=${mem}`
          updatetablebuffer(id, 'PATCH', updatebd, popupTable, sort)
          //httpr('PATCH', 'employeelogs', updatebd)

          //remove the save button
          staffchanged = 1
          row.removeChild(saveButton)
        })

        // Add a Del button
        const delButton = document.createElement('button')
        delButton.innerHTML = 'Delete'
        delButton.id = 'delData'

        row.appendChild(delButton)

        delButton.addEventListener('click', function () {
          // Save the edited content
          row.contentEditable = false
          // You could send the new data to the server here
          // E.g. using an XMLHttpRequest or fetch API
          // For now, let's just log the content
          //debug(row);
          let bid = row.id,
            dt = '',
            ci = row.children[2].textContent,
            co = row.children[3].textContent,
            mem = row.children[5].textContent
          debug(bid + dt + ci + co)
          //let updatebd = `&id=${bid}&dt=${dt}&ci=${ci}&co=${co}`
          let updatebd = `&id=${bid}&com=${co}&dec=2&mem=${mem}`
          updatetablebuffer(id, 'POST', updatebd, popupTable,sort)
          //updatetablebuffer(id, 'PATCH', updatebd, popupTable,sort)
          //httpr('PATCH', 'employeelogs', updatebd)

          //remove the save button
          staffchanged = 1
          row.removeChild(delButton)
        })
      }
    }
  })
}

function input_popup (type, question) {
  // Create the pop-up element
  const popup = document.createElement('div')
  popup.className = type
  popup.id = type

  // Create the content element
  const content = document.createElement('div')
  content.className = 'popup-content'

  // Create the header element
  const header = document.createElement('div')
  header.className = 'popup-header'

  // Create the header title
  const title = document.createElement('h1')
  title.innerHTML = question
  header.appendChild(title)

  // Create the body element
  const body = document.createElement('div')
  body.className = 'popup-body'

  // Create the input field
  const inputField = document.createElement('input')
  inputField.type = 'text'
  inputField.id = 'inputField'
  body.appendChild(inputField)

  // Create the footer element
  const footer = document.createElement('div')
  footer.className = 'popup-footer'

  // Create the "Cancel" button
  const cancelButton = document.createElement('button')
  cancelButton.id = 'cancelButton'
  cancelButton.innerHTML = 'Cancel'

  // Create the "OK" button
  const okButton = document.createElement('button')
  okButton.id = 'okButton'
  okButton.innerHTML = 'OK'

  // Append the buttons to the footer
  footer.appendChild(cancelButton)
  footer.appendChild(okButton)

  // Append the header, body, and footer to the content
  content.appendChild(header)
  content.appendChild(body)
  content.appendChild(footer)

  // Append the content to the pop-up
  popup.appendChild(content)

  // Show the pop-up window
  popup.style.display = 'none'

  // Handle the "Cancel" button
  cancelButton.addEventListener('click', () => {
    //document.querySelector('#pin input').value = '';
    popup.style.display = 'none'
  })

  // Handle the "OK" button
  okButton.addEventListener('click', () => {
    let input = inputField.value
    debug(inputField.value)
    if (input != '' && popup.id == 'pin') {
      temppin = input
      //document.querySelector('#pin input').value = '';
      buffterxhr()
      popup.style.display = 'none'
    }
    if (input.toLowerCase() == 'demo' && popup.id == 'api') {
      api_con = 1
      getdemo()
      popup.style.display = 'none'
    }
    if (input != '' && popup.id == 'api' && input.length > 50) {
      API_KEY = input
      getToken()
      if (api_con === 1) {
        buffergdata()
        location.reload();
        popup.style.display = 'none'
      }
    }
  })

  return popup
}

//Modal for Adding Buildings
function addhoursbtn () {
  // Create the pop-up window element
  const popup = document.createElement('div')
  popup.classList.add('addhoursmodal')
  popup.id = 'addhoursmodal'

  // Create the pop-up content element
  const popupContent = document.createElement('div')
  popupContent.classList.add('popup-content')
  popup.appendChild(popupContent)

  // Create the pop-up header element
  const popupHeader = document.createElement('div')
  popupHeader.classList.add('popup-header')
  popupContent.appendChild(popupHeader)

  // Create the pop-up header title element
  const popupTitle = document.createElement('h1')
  popupTitle.textContent = 'Add Hours'
  popupHeader.appendChild(popupTitle)

  const popupSubTitle = document.createElement('h4')
  popupSubTitle.textContent =
    'Do you want to add 8 additional hours for all full time staff? This is intended for holiday hours.'
  popupHeader.appendChild(popupSubTitle)
  // Create the pop-up body element
  const popupBody = document.createElement('div')
  popupBody.classList.add('popup-body')
  popupContent.appendChild(popupBody)

  // Create the date input field
  const atdateInputGroup = document.createElement('div')
  atdateInputGroup.classList.add('form-group')
  popupBody.appendChild(atdateInputGroup)

  const atdateLabel = document.createElement('label')
  atdateLabel.setAttribute('for', 'atdateInput')
  atdateLabel.textContent = 'Select Date:'
  atdateInputGroup.appendChild(atdateLabel)

  const atdateInput = document.createElement('input')
  atdateInput.setAttribute('type', 'date')
  //dateInput.classList.add('form-control')
  atdateInput.id = 'atdateInput'
  atdateInput.setAttribute('value', getdate['enddate'])

  atdateInputGroup.appendChild(atdateInput)

  // Create the cancel and ok buttons
  const popupFooter = document.createElement('div')
  popupFooter.classList.add('popup-footer')
  popupBody.appendChild(popupFooter)

  const cancelButton = document.createElement('button')
  cancelButton.classList.add('btn', 'btn-secondary')
  cancelButton.textContent = 'Cancel'
  popupFooter.appendChild(cancelButton)

  const okButton = document.createElement('button')
  okButton.classList.add('btn', 'btn-primary')
  okButton.textContent = 'OK'
  popupFooter.appendChild(okButton)

  popup.style.display = 'none'

  // Handle the "Cancel" button
  cancelButton.addEventListener('click', () => {
    popup.style.display = 'none'
  })

  // Handle the "OK" button
  okButton.addEventListener('click', () => {
    try {
      const atdate = atdateInput.value
      let ademdata = `&dt=${atdate}&ip=${iplog}`
      postdata('POST', 'addhours', ademdata)
    } catch (err) {
      debug(err)
    }
    // Do something with the input
    //document.querySelector('body').style.height = '266px'
    popup.style.display = 'none'
  })

  return popup
}

//Modal for Adding Buildings TODO
function addbuildingsbtn () {
  // Create the pop-up window element
  const popup = document.createElement('div')
  popup.classList.add('editbuildings')
  popup.id = 'editbuildings'

  // Create the pop-up content element
  const popupContent = document.createElement('div')
  popupContent.classList.add('popup-content')
  popup.appendChild(popupContent)

  // Create the pop-up header element
  const popupHeader = document.createElement('div')
  popupHeader.classList.add('popup-header')
  popupContent.appendChild(popupHeader)

  // Create the pop-up header title element
  const popupTitle = document.createElement('h1')
  popupTitle.textContent = 'Add New Building'
  popupHeader.appendChild(popupTitle)

  // Create the pop-up body element
  const popupBody = document.createElement('div')
  popupBody.classList.add('popup-body')
  popupContent.appendChild(popupBody)

  const buildNameInputGroup = document.createElement('div')
  buildNameInputGroup.classList.add('form-group', 'inline-inputs')
  popupBody.appendChild(buildNameInputGroup)

  const buildNameLabel = document.createElement('label')
  buildNameLabel.setAttribute('for', 'buildNameInput')
  buildNameLabel.textContent = 'Building Name:'
  buildNameInputGroup.appendChild(buildNameLabel)

  const buildNameInput = document.createElement('input')
  buildNameInput.classList.add('form-control')
  buildNameInput.id = 'buildNameInput'
  buildNameInput.setAttribute('type', 'text')
  //buildNameInput.setAttribute('required',true)
  buildNameInputGroup.appendChild(buildNameInput)

  // Create the address 1 input field
  const address1InputGroup = document.createElement('div')
  address1InputGroup.classList.add('form-group', 'inline-inputs')
  popupBody.appendChild(address1InputGroup)

  const address1Label = document.createElement('label')
  address1Label.setAttribute('for', 'address1Input')
  address1Label.textContent = 'Address 1:'
  address1InputGroup.appendChild(address1Label)

  const address1Input = document.createElement('input')
  address1Input.classList.add('form-control')
  address1Input.id = 'address1Input'
  address1Input.setAttribute('type', 'text')
  address1InputGroup.appendChild(address1Input)

  // Create the last name input field
  const address2InputGroup = document.createElement('div')
  address2InputGroup.classList.add('form-group', 'inline-inputs')
  popupBody.appendChild(address2InputGroup)

  const address2Label = document.createElement('label')
  address2Label.setAttribute('for', 'address2Input')
  address2Label.textContent = 'Address 2:'
  address2InputGroup.appendChild(address2Label)

  const address2Input = document.createElement('input')
  address2Input.classList.add('form-control')
  address2Input.id = 'address2Input'
  address2Input.setAttribute('type', 'text')
  //address2Input.setAttribute('required',true)
  address2InputGroup.appendChild(address2Input)

  // Create the city input field
  const cityInputGroup = document.createElement('div')
  cityInputGroup.classList.add('form-group')
  popupBody.appendChild(cityInputGroup)

  const cityLabel = document.createElement('label')
  cityLabel.setAttribute('for', 'cityInput')
  cityLabel.textContent = 'City:'
  cityInputGroup.appendChild(cityLabel)

  const cityInput = document.createElement('input')
  cityInput.setAttribute('type', 'text')
  cityInput.setAttribute('pattern', '[0-9]*')
  //cityInput.setAttribute('required',true)
  cityInput.classList.add('form-control')
  cityInput.id = 'cityInput'
  cityInputGroup.appendChild(cityInput)

  // Create the job role input field
  const stateInputGroup = document.createElement('div')
  stateInputGroup.classList.add('form-group')
  popupBody.appendChild(stateInputGroup)

  const stateLabel = document.createElement('label')
  stateLabel.setAttribute('for', 'stateInput')
  stateLabel.textContent = 'State:'
  stateInputGroup.appendChild(stateLabel)

  const stateInput = document.createElement('input')
  stateInput.setAttribute('type', 'text')
  stateInput.classList.add('form-control')
  stateInput.id = 'stateInput'
  stateInputGroup.appendChild(stateInput)

  // Create the job role input field
  const zipInputGroup = document.createElement('div')
  zipInputGroup.classList.add('form-group')
  popupBody.appendChild(zipInputGroup)

  const zipLabel = document.createElement('label')
  zipLabel.setAttribute('for', 'zipInput')
  zipLabel.textContent = 'Zip:'
  zipInputGroup.appendChild(zipLabel)

  const zipInput = document.createElement('input')
  zipInput.setAttribute('type', 'text')
  zipInput.classList.add('form-control')
  zipInput.id = 'zipInput'
  zipInputGroup.appendChild(zipInput)

  // Create the job role input field
  const phoneInputGroup = document.createElement('div')
  phoneInputGroup.classList.add('form-group')
  popupBody.appendChild(phoneInputGroup)

  const phoneLabel = document.createElement('label')
  phoneLabel.setAttribute('for', 'phoneInput')
  phoneLabel.textContent = 'Phone:'
  phoneInputGroup.appendChild(phoneLabel)

  const phoneInput = document.createElement('input')
  phoneInput.setAttribute('type', 'text')
  phoneInput.classList.add('form-control')
  phoneInput.id = 'phoneInput'
  phoneInputGroup.appendChild(phoneInput)

  // Create the cancel and ok buttons
  const popupFooter = document.createElement('div')
  popupFooter.classList.add('popup-footer')
  popupBody.appendChild(popupFooter)

  const cancelButton = document.createElement('button')
  cancelButton.classList.add('btn', 'btn-secondary')
  cancelButton.textContent = 'Cancel'
  popupFooter.appendChild(cancelButton)

  const okButton = document.createElement('button')
  okButton.classList.add('btn', 'btn-primary')
  okButton.textContent = 'OK'
  popupFooter.appendChild(okButton)

  popup.style.display = 'none'

  // Handle the "Cancel" button
  cancelButton.addEventListener('click', () => {
    document.querySelectorAll('.addemployee input').forEach(e => {
      e.value = ''
    })
    //document.querySelector('body').style.height = '266px'
    popup.style.display = 'none'
  })

  // Handle the "OK" button
  okButton.addEventListener('click', () => {
    try {
      const embuildName = buildNameInput.value
      const emaddress1 = address1Input.value
      const emaddress2 = address2Input.value
      const emcity = cityInput.value
      const emstate = stateInput.value
      const emzip = zipInput.value
      const emphone = phoneInput.value

      debug(
        embuildName,
        emaddress1,
        emaddress2,
        emcity,
        emstate,
        emzip,
        emphone
      )
      if (embuildName != '') {
        let ademdata = `&bn=${embuildName}&a1=${emaddress1}&a2=${emaddress2}&sp=${emstate}&zip=${emzip}&ct=${emcity}&ph=${emphone}`
        postbuilding(ademdata)
      }
    } catch (err) {
      debug(err)
    }
    // Do something with the input
    //document.querySelector('body').style.height = '266px'
    document.querySelectorAll('.popup-body input').forEach(e => {
      e.value = ''
    })
    popup.style.display = 'none'
  })

  return popup
}

//Modal for Adding Employees
function addemployeebtn () {
  // Create the pop-up window element
  const popup = document.createElement('div')
  popup.classList.add('addemployee')
  popup.id = 'addemployee'

  // Create the pop-up content element
  const popupContent = document.createElement('div')
  popupContent.classList.add('popup-content')
  popup.appendChild(popupContent)

  // Create the pop-up header element
  const popupHeader = document.createElement('div')
  popupHeader.classList.add('popup-header')
  popupContent.appendChild(popupHeader)

  // Create the pop-up header title element
  const popupTitle = document.createElement('h1')
  popupTitle.textContent = 'Add New Employee'
  popupHeader.appendChild(popupTitle)

  // Create the pop-up body element
  const popupBody = document.createElement('div')
  popupBody.classList.add('popup-body')
  popupContent.appendChild(popupBody)

  // Create the full time select field
  const ftInputGroup = document.createElement('div')
  ftInputGroup.classList.add('form-group')
  popupBody.appendChild(ftInputGroup)

  const ftLabel = document.createElement('label')
  ftLabel.setAttribute('for', 'ftSelect')
  ftLabel.textContent = 'Fulltime:'
  ftInputGroup.appendChild(ftLabel)

  const ftSelect = document.createElement('select')
  ftSelect.classList.add('form-control')
  ftSelect.id = 'ftSelect'
  ftInputGroup.appendChild(ftSelect)
  let ftpt = [true, false]
  for (ft of ftpt) {
    const ftOption = document.createElement('option')
    ftOption.setAttribute('value', ft)
    ftOption.textContent = ft
    ftSelect.appendChild(ftOption)
  }

  ftSelect.value = true

  const firstNameLabel = document.createElement('label')

  const firstNameInputGroup = document.createElement('div')
  firstNameInputGroup.classList.add('form-group', 'inline-inputs')
  popupBody.appendChild(firstNameInputGroup)

  firstNameLabel.setAttribute('for', 'firstNameInput')
  firstNameLabel.textContent = 'First Name*:'
  firstNameInputGroup.appendChild(firstNameLabel)

  const firstNameInput = document.createElement('input')
  firstNameInput.classList.add('form-control')
  firstNameInput.id = 'firstNameInput'
  firstNameInput.setAttribute('type', 'text')
  firstNameInput.setAttribute('required', true)
  firstNameInputGroup.appendChild(firstNameInput)

  // Create the middle name input field
  const middleNameInputGroup = document.createElement('div')
  middleNameInputGroup.classList.add('form-group', 'inline-inputs')
  popupBody.appendChild(middleNameInputGroup)

  const middleNameLabel = document.createElement('label')
  middleNameLabel.setAttribute('for', 'middleNameInput')
  middleNameLabel.textContent = 'Middle Name:'
  middleNameInputGroup.appendChild(middleNameLabel)

  const middleNameInput = document.createElement('input')
  middleNameInput.classList.add('form-control')
  middleNameInput.id = 'middleNameInput'
  middleNameInput.setAttribute('type', 'text')
  middleNameInputGroup.appendChild(middleNameInput)

  // Create the last name input field
  const lastNameInputGroup = document.createElement('div')
  lastNameInputGroup.classList.add('form-group', 'inline-inputs')
  popupBody.appendChild(lastNameInputGroup)

  const lastNameLabel = document.createElement('label')
  lastNameLabel.setAttribute('for', 'lastNameInput')
  lastNameLabel.textContent = 'Last Name*:'
  lastNameInputGroup.appendChild(lastNameLabel)

  const lastNameInput = document.createElement('input')
  lastNameInput.classList.add('form-control')
  lastNameInput.id = 'lastNameInput'
  lastNameInput.setAttribute('type', 'text')
  lastNameInput.setAttribute('required', true)
  lastNameInputGroup.appendChild(lastNameInput)

  // Create the pin input field
  const pinInputGroup = document.createElement('div')
  pinInputGroup.classList.add('form-group')
  popupBody.appendChild(pinInputGroup)

  const pinLabel = document.createElement('label')
  pinLabel.setAttribute('for', 'pinInput')
  pinLabel.textContent = 'PIN*:'
  pinInputGroup.appendChild(pinLabel)

  const pinInput = document.createElement('input')
  pinInput.setAttribute('type', 'text')
  pinInput.setAttribute('pattern', '[0-9]*')
  pinInput.setAttribute('required', true)
  pinInput.classList.add('form-control')
  pinInput.id = 'pinInput'
  pinInputGroup.appendChild(pinInput)

  // Create the job role input field
  const jobRoleInputGroup = document.createElement('div')
  jobRoleInputGroup.classList.add('form-group')
  popupBody.appendChild(jobRoleInputGroup)

  const jobRoleLabel = document.createElement('label')
  jobRoleLabel.setAttribute('for', 'jobRoleInput')
  jobRoleLabel.textContent = 'Job Role:'
  jobRoleInputGroup.appendChild(jobRoleLabel)

  const jobRoleInput = document.createElement('input')
  jobRoleInput.setAttribute('type', 'text')
  jobRoleInput.classList.add('form-control')
  jobRoleInput.id = 'jobRoleInput'
  jobRoleInputGroup.appendChild(jobRoleInput)

  // Create the gender select field
  const genderInputGroup = document.createElement('div')
  genderInputGroup.classList.add('form-group')
  popupBody.appendChild(genderInputGroup)

  const genderLabel = document.createElement('label')
  genderLabel.setAttribute('for', 'genderSelect')
  genderLabel.textContent = 'Gender:'
  genderInputGroup.appendChild(genderLabel)

  const genderSelect = document.createElement('select')
  genderSelect.classList.add('form-control')
  genderSelect.id = 'genderSelect'
  genderInputGroup.appendChild(genderSelect)

  const genderOption2 = document.createElement('option')
  genderOption2.setAttribute('value', 'F')
  genderOption2.textContent = 'Female'
  genderSelect.appendChild(genderOption2)

  const genderOption1 = document.createElement('option')
  genderOption1.setAttribute('value', 'M')
  genderOption1.textContent = 'Male'
  genderSelect.appendChild(genderOption1)

  // Create the birthdate input field
  const birthdateInputGroup = document.createElement('div')
  birthdateInputGroup.classList.add('form-group')
  popupBody.appendChild(birthdateInputGroup)

  const birthdateLabel = document.createElement('label')
  birthdateLabel.setAttribute('for', 'birthdateInput')
  birthdateLabel.textContent = 'Birthdate:'
  birthdateInputGroup.appendChild(birthdateLabel)

  const birthdateInput = document.createElement('input')
  birthdateInput.setAttribute('type', 'date')
  birthdateInput.classList.add('form-control')
  birthdateInput.id = 'birthdateInput'
  birthdateInput.setAttribute('value', '1990-01-01')

  birthdateInputGroup.appendChild(birthdateInput)

  // Create the building select field
  const buildingInputGroup = document.createElement('div')
  buildingInputGroup.classList.add('form-group')
  popupBody.appendChild(buildingInputGroup)

  const buildingLabel = document.createElement('label')
  buildingLabel.setAttribute('for', 'buildingSelect')
  buildingLabel.textContent = 'Building:'
  buildingInputGroup.appendChild(buildingLabel)

  const buildingSelect = document.createElement('select')
  buildingSelect.classList.add('form-control')
  buildingSelect.id = 'buildingSelect'
  buildingInputGroup.appendChild(buildingSelect)
  debug('Buildings are ')
  debug(getdata['buildings'])
  for (building of getdata['buildings']) {
    const buildingOption = document.createElement('option')
    buildingOption.setAttribute('value', building)
    buildingOption.textContent = building
    buildingSelect.appendChild(buildingOption)
  }

  // Create the cancel and ok buttons
  const popupFooter = document.createElement('div')
  popupFooter.classList.add('popup-footer')
  popupBody.appendChild(popupFooter)

  const cancelButton = document.createElement('button')
  cancelButton.classList.add('btn', 'btn-secondary')
  cancelButton.textContent = 'Cancel'
  popupFooter.appendChild(cancelButton)

  const okButton = document.createElement('button')
  okButton.classList.add('btn', 'btn-primary')
  okButton.textContent = 'OK'
  popupFooter.appendChild(okButton)

  popup.style.display = 'none'

  // Handle the "Cancel" button
  cancelButton.addEventListener('click', () => {
    document.querySelectorAll('.addemployee input').forEach(e => {
      e.value = ''
    })
    //document.querySelector('body').style.height = '266px'
    popup.style.display = 'none'
  })

  // Handle the "OK" button
  okButton.addEventListener('click', () => {
    try {
      const emfulltime = ftSelect.value
      const emfirstName = firstNameInput.value
      const emmiddleName = middleNameInput.value
      const emlastName = lastNameInput.value
      const empin = pinInput.value
      const emjobRole = jobRoleInput.value
      const emgender = genderSelect.value
      const embirthdate = birthdateInput.value
      const embuilding = buildingSelect.value

      debug(
        emfulltime,
        emfirstName,
        emmiddleName,
        emlastName,
        empin,
        emjobRole,
        emgender,
        embirthdate,
        embuilding
      )
      if (![emfirstName, emlastName, empin].includes('')) {
        let ademdata = `&fn=${emfirstName}&mn=${emmiddleName}&ln=${emlastName}&jr=${emjobRole}&sex=${emgender}&bd=${embirthdate}&bu=${embuilding}&pn=${empin}&ft=${emfulltime}`
        postemployee(ademdata)
      }
    } catch (err) {
      debug(err)
    }
    document.querySelectorAll('.popup-body input').forEach(e => {
      e.value = ''
    })
    //document.querySelector('body').style.height = '266px'
    popup.style.display = 'none'
  })

  return popup
}

//XHR request, Add Employee Helper: Sends new data to the server
async function postemployee (data) {
  resp = await httpr('POST', 'employees', data)
  if (resp[0] === 'Employee Added') {
    await getstaffdata(1)
    debug(resp[0])
    if (cur_page.includes('staff')) {
      curpage()
    }
  }
}

//XHR request, Add Employee Helper: Sends new data to the server
async function updateemployee (data) {
  resp = await httpr('PATCH', 'employees', data)
  if (resp[0] === 'Employee Updated') {
    await getarchstaffdata(1)
    await getstaffdata(1)
    debug(resp[0])
    if (cur_page.includes('staff')) {
      curpage()
    }
  }
}

//XHR request, Add Employee Helper: Sends new data to the server
async function postbuilding (data) {
  resp = await httpr('POST', 'buildings', data)
  if (resp[0] === 'Building Added') {
    await getbuildingdata(1)
    //TODO
    debug(resp[0])
    if (cur_page == 'buildings') {
      buildingsmodule()
    }
  }
}

async function postdata (type, loc, data) {
  resp = await httpr(type, loc, data)
  switch (loc) {
    case 'employees':
      await getstaffdata(1)
      break
    case 'addhours':
      await getstaffdata(1)
      break
    case 'buildings':
      await getbuildingdata(1)
      break
  }
  curpage()
}

//Catures version on manifest and display it on page
function getVersion () {
  let version = document.getElementById('version')
  version.innerHTML = 'v' + chrome.runtime.getManifest().version

  let i,
    coll = document.getElementsByClassName('collapsible')
  let getcontent = document.querySelector('.content')
  for (i = 0; i < coll.length; i++)
    coll[i].addEventListener('click', function () {
      this.classList.toggle('active')
      if (i == 2) {
        debug('getVersion')
        getcontent.classList.toggle('active')
      }
      'block' === this.nextElementSibling.style.display
        ? $('.content').slideUp()
        : $('.content').slideDown()
    })
}

//XHR request: Check if app is active
async function isActive () {
  let url = `${API_URL}/v1/apps?app=${encodeURIComponent(app)}`
  return fetch(url)
    .then(response => {
      if (response.status === 200) {
        return response.json()
      } else {
        throw new Error(response)
      }
    })
    .then(response => {
      debug(response.enabled)
      return response.enabled
    })
    .catch(error => {
      throw new Error(error)
    })
}

//XHR request: preset for data
async function get_gdata () {
  gdata['active'] = await gdata_checker('active', '')
  getdata['buildings'] = await gdata_checker('buildings', 'buildings')
  debug(`gdata ${getdata['buildings'][0]}`)
  return 1
}

//Check if the keys are stored in Chrome storage then XHR request if not.
async function gdata_checker (key, dir) {
  let check = await get_session(key)
  if (check != undefined) return check
  if (key === 'active') {
    await store_session(key, await isActive())
  } else if ((await check) === undefined) {
    debug('getting from server')
    await store_session(key, await httpr('GET', dir, ''))
  }
  return await get_session(key)
}

//Chrome storage: stores key and value into sync storage
async function store_sync (key, value) {
  debug(`Storing ${key}`)
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [key]: value }, () => {
      debug(`${value} stored into ${key}`)
      resolve(1)
    })
  })
}

//Chrome storage: get key and value into sync storage
async function get_sync (key) {
  debug(`get_session for ${key}`)
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(key, result => {
        debug(`${key} is ${Object.values(result)[0]}`)
        resolve(Object.values(result)[0])
      })
    } catch (err) {
      debug(err)
      resolve(undefined)
    }
  })
}

//Chrome storage: stores key and value into session storage
async function store_session (key, value) {
  debug(`Storing ${key}`)
  return new Promise((resolve, reject) => {
    chrome.storage.session.set({ [key]: value }, () => {
      debug(`${value} stored into ${key}`)
      resolve(1)
    })
  })
}

//Chrome storage: get key and value into sync storage
async function get_session (key) {
  debug(`get_session for ${key}`)
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.session.get(key, result => {
        debug(`${key} is ${Object.values(result)[0]}`)
        resolve(Object.values(result)[0])
      })
    } catch (err) {
      debug(err)
      reject(undefined)
    }
  })
}

//XHR request: gets token for XHR send/receive
async function getToken () {
  try {
    let url = `${API_URL}/token?api_key=${API_KEY}&app_p=hmg_punchclock_admin`
    return fetch(url)
      .then(response => {
        if (response.status === 200) {
          return response.text()
        } else {
          throw new Error(response)
        }
      })
      .then(token => {
        if (token !== 'Invalid API Key') {
          api_con = 1
        }
        return token
      })
      .catch(error => {
        if (api_con !== 0) {
          servererror()
        }
        throw new Error(error)
      })
  } catch (err) {
    servererror()
  }
}

//XHR request: set the token to the global variable
async function setToken () {
  token = await getToken()
}

//XHR request module
async function httpr (type, dir, data) {
  debug('Getting HTTPR')
  if (demo === 1) {
    return
  }
  if (token === null) {
    token = await getToken()
  }

  let qdata = null
  if (token.includes('Invalid')) {
    console.log('invalid token')
    return
  }
  let url = `${API_URL}/AppHMG/${dir}?Authorization=Bearer%20${token}`
  qdata = data
  if (qdata !== null) {
    url += qdata
  }

  return fetch(url, {
    method: type
  })
    .then(response => {
      if (response.status === 200) {
        return response.json()
      } else if (response.status === 401) {
        return setToken().then(() => httpr(type, dir, data))
      } else {
        throw new Error(response)
      }
    })
    .catch(error => {
      return 0 
      //throw new Error(error)
    })
}



/*                  LOCK ICON                                */
// Initial state
let isLocked = false;

// Get the span element
const lockSpan = document.querySelector('.material-symbols-outlined.lock');

// Function to toggle the lock and update cur_pagecounter
function toggleLock() {
    if (isLocked) {
        lockSpan.textContent = 'lock_open';
        setLockStatus('0')
    } else {
        lockSpan.textContent = 'lock';
        setLockStatus('1')
    }
    isLocked = !isLocked;
}

// Add a click event listener to the span element
lockSpan.addEventListener('click', toggleLock);

async function getLockStatus(){
  let httpisLocked = await httpr('GET', 'settings', '&it=isLocked')
  console.log(httpisLocked)
  if (httpisLocked == '1' && isLocked == false){
    //toggleLock()
    lockSpan.textContent = 'lock';
    isLocked = !isLocked;
  }
}

async function setLockStatus(value){
  await httpr('POST', 'settings', `&it=isLocked&v=${value}`)
}


/*                  SYNC BUTTON                                */
// Initial state
let isPaused = true;
cur_pagecounter = 999;
// Get the span element
const pauseSpan = document.querySelector('.material-symbols-outlined.sync');
pauseSpan.textContent = 'pause';
// Function to toggle the lock and update cur_pagecounter
function toggleSync() {
    if (isPaused) {
        pauseSpan.textContent = 'sync';
        cur_pagecounter = 0;
    } else {
        pauseSpan.textContent = 'pause';
        cur_pagecounter = 999;
    }
    isPaused = !isPaused;
}

// Add a click event listener to the span element
pauseSpan.addEventListener('click', toggleSync);

