const app = 'HMG PunchClock'
const isDebug = 0
var api_con = 0

if (isDebug) {
  var debug = console.log.bind(window.console)
  //API_URL = 'http://localhost:5000/'
} else {
  var debug = function () {}
}

var startTime = null,
  timeworked = null,
  lastlog = null,
  iplog = null,
  cur_time = null,
  API_KEY = null,
  temppin = null,
  c_mode = null,
  load = null,
  token = null

var getemployee = { fn: '', ln: '', eid: '', log: '' }
var getdata = { buildings: '', employees: '', active: '', Cur_building: '' }

window.onload = async e => {
  try {
    let body = document.querySelector('body')
    body.appendChild(loading())

    setip()
    body.appendChild(input_popup('api', 'Enter API Key: '))
    load = document.querySelector('.loading')

    getAPI('api')
  } catch (e) {}
}

async function getAPI (apiinput) {
  let check = await get_sync(apiinput)
  if (check != undefined) {
    API_KEY = check
    getToken()
    if (api_con === 1) {
      buffergdata()
      return
    }
  }
  document.querySelector('.api').style.display = 'flex'
}

function getVersion () {
  let version = document.getElementById('versionCheck')
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

function servererror () {
  // Create the message element
  const message = document.createElement('div')
  message.innerHTML =
    'SERVER ERROR: Unable to connect to server. Please note your hours manually'

  // Style the message element
  message.style.fontSize = '20px'
  message.style.fontWeight = 'bold'
  message.style.color = 'darkred'
  message.style.textAlign = 'center'
  message.style.position = 'absolute'
  message.style.top = '50%'
  message.style.left = '50%'
  message.style.transform = 'translate(-50%, -50%)'

  // Add the message element to the page
  let body = document.querySelector('body')
  body.innerHTML = ''
  body.appendChild(message)
  body.style.height = '266px'
}

function main () {
  //banner = banner()
  col1 = column_1()
  col2 = column_2()

  let columns = document.querySelector('#columns')
  columns.appendChild(col1)
  columns.appendChild(col2)
  document.querySelector('body').appendChild(input_popup('pin', 'Enter Pin: '))
  document.querySelector('body').appendChild(addemployeebtn())
  buildbuttons()

  setInterval(updateClock, 1000) // Updates the clock every 1 second
}

function banner () {
  ban = document.querySelector('#banner')
  ban.innerText = 'Punch Clock'
  return ban
}

function column_1 () {
  col1 = createColumns('col1')

  bld = building_list()
  col1.appendChild(bld)

  emp = employee_list()
  col1.appendChild(emp)

  let new_emp = new_employ_btn()

  col1.appendChild(new_emp)

  return col1
}

function new_employ_btn () {
  let new_emp = document.createElement('button')
  new_emp.id = 'new_emp'
  new_emp.innerText = 'Add Employee'
  new_emp.type = 'button'

  new_emp.addEventListener('click', function () {
    debug('addemployeebtn')
    addemployee.style.display = 'flex'
    const selectedBuilding = document.getElementById('buildingSelect')
    const selectedIndex = selectedBuilding.selectedIndex
    selectedBuilding.value = getdata['Cur_building']
    document.querySelector('body').style.height = '450px'
  })

  return new_emp
}

function column_2 () {
  col2 = createColumns('col2')

  em_name = document.createElement('div')
  em_name.id = 'ename'
  em_name.innerText = 'Punch Clock'
  col2.appendChild(em_name)

  info = document.createElement('div')
  info.id = 'info'
  const date_dc = getclock('date2')
  const clock = getclock('clock')
  info.appendChild(clock)
  info.appendChild(date_dc)

  col2.appendChild(info)

  form = createForm()
  col2.appendChild(form)

  timeworked = document.createElement('div')
  timeworked.id = 'time-worked'
  timeworked.innerText = ''
  col2.appendChild(timeworked)

  return col2
}

function getclock (format) {
  dcinfo = document.createElement('div')
  dcinfo.id = format
  return dcinfo
}

function updateClock () {
  const date = new Date()
  const time = date.toLocaleTimeString()
  clock.textContent = time
  cur_time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
  date2.textContent = `${
    date.getMonth() + 1
  }-${date.getDate()}-${date.getFullYear()}`
}

function building_list () {
  drop = document.createElement('select')
  drop.id = 'buildings'
  for (const building of getdata['buildings']) {
    dwn = document.createElement('option')
    dwn.value = building
    dwn.innerText = building
    drop.appendChild(dwn)
  }

  return drop
}

function employee_list () {
  debug('employees')
  sel = document.createElement('select')
  sel.multiple = true
  sel.id = 'employees'

  return sel
}

async function fill_employee_list () {
  debug(getdata['Cur_building'])
  let employees = await httpr(
    'GET',
    'employees',
    `&building=${getdata['Cur_building']}`
  )
  debug(employees)
  debug(typeof employees)
  debug('fill employee list')
  sel = document.getElementById('employees')
  sel.innerHTML = ''
  for (const employee of employees) {
    op = document.createElement('option')
    op.value = employee[0]
    if (employee[2] === null) {
      op.innerText = employee[1] + ' ' + employee[3]
    } else {
      op.innerText =
        employee[1] + ' ' + employee[2].charAt(0) + ' ' + employee[3]
    }
    sel.appendChild(op)
  }
}

function createColumns (col_num) {
  col = document.createElement('div')
  col.id = col_num
  return col
}

function createForm () {
  form = document.createElement('form')
  const clocked_status = document.createElement('div')
  clocked_status.id = 'status'

  const clockin_button = document.createElement('button')
  clockin_button.id = 'clock-in'
  clockin_button.type = 'button'
  clockin_button.innerText = 'Clock In'

  const clockout_button = document.createElement('button')
  clockout_button.id = 'clock-out'
  clockout_button.type = 'button'
  clockout_button.innerText = 'Clock Out'

  info.appendChild(clocked_status)
  form.appendChild(clockin_button)
  form.appendChild(clockout_button)

  return form
}

function selectedBuildings () {
  const selectedBuilding = document.getElementById('buildings')
  const selectedIndex = selectedBuilding.selectedIndex
  const selectedOption = selectedBuilding.options[selectedIndex]
  chrome.storage.session.get('Cur_building', result => {
    getdata['Cur_building'] = getdata['buildings'][0]
    if (result.Cur_building === null || result.Cur_building === undefined) {
      chrome.storage.session.set({ Cur_building: selectedOption.value }, () => {
        getdata['Cur_building'] = selectedOption.value
      })
    } else {
      debug(result.Cur_building)
      getdata['Cur_building'] = result.Cur_building
      selectedBuilding.value = getdata['Cur_building']
    }
    fill_employee_list()
  })
}

function buildbuttons () {
  const selectedBuilding = document.getElementById('buildings')
  selectedBuildings()
  selectedBuilding.addEventListener('click', function () {
    const selectedIndex = selectedBuilding.selectedIndex
    const selectedOption = selectedBuilding.options[selectedIndex]
    debug(getdata['Cur_building'])
    debug(selectedOption.value)
    if (getdata['Cur_building'] != selectedOption.value) {
      chrome.storage.session.set({ Cur_building: selectedOption.value }, () => {
        getdata['Cur_building'] = selectedOption.value
        fill_employee_list()
      })
    }
  })

  //Clock In
  const clockInButton = document.getElementById('clock-in')
  clockInButton.addEventListener('click', function () {
    if (getemployee['eid'] === '') return
    c_mode = 'cin'
    document.querySelector('.pin').style.display = 'flex'
  })

  //Clock Out
  const clockOutButton = document.getElementById('clock-out')
  clockOutButton.disabled = true
  clockOutButton.addEventListener('click', function () {
    if (getemployee['eid'] === '') return
    c_mode = 'cout'
    document.querySelector('.pin').style.display = 'flex'
  })

  const select = document.getElementById('employees')
  select.addEventListener('change', event => {
    const options = event.target.options
    for (const option of options) {
      if (option.selected) {
        debug(`Option selected: ${option.value}`)
        ename = document.querySelector('#ename')
        ename.innerText = option.innerText
        document.getElementById('time-worked').innerHTML = 'Last Log: '
        splitnm = option.innerText.split(' ')
        getemployee['fn'] = splitnm[0]
        getemployee['ln'] = splitnm[1]
        getemployee['eid'] = option.value
        getSelectedEmployee()
      }
    }
  })
}

function setip () {
  $.getJSON('https://api.ipify.org?format=json', function (t) {
    iplog = t.ip
    httpr('POST','hmgpcip',`&ip=${iplog}`);
  })
}

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
        let ftpt = [true,false]
        for (ft of ftpt) {
          const ftOption = document.createElement('option')
          ftOption.setAttribute('value', ft)
          ftOption.textContent = ft
          ftSelect.appendChild(ftOption)
        }
        
        ftSelect.value = true

  const firstNameInputGroup = document.createElement('div')
  firstNameInputGroup.classList.add('form-group', 'inline-inputs')
  popupBody.appendChild(firstNameInputGroup)

  const firstNameLabel = document.createElement('label')
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
  pinInput.setAttribute('type', 'password')
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
    document.querySelector('body').style.height = '266px'
    popup.style.display = 'none'
  })

  // Handle the "OK" button
  okButton.addEventListener('click', () => {
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
    } else {
      document.querySelector('#status').textContent = 'CANCELLED'
      document.querySelector('#status').style.color = 'black'
      setTimeout(() => {
        getSelectedEmployee()
      }, 3000)
    }
    // Do something with the input
    document.querySelectorAll('.addemployee input').forEach(e => {
      e.value = ''
    })
    document.querySelector('body').style.height = '266px'
    popup.style.display = 'none'
  })

  return popup
}

async function postemployee (data) {
  resp = await httpr('POST', 'employees', data)
  if (resp[0] === 'Employee Added') {
    fill_employee_list()
  }
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
  inputField.type = (type == 'pin') ? 'password': 'text'
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
    document.querySelector('#pin input').value = ''
    popup.style.display = 'none'
  })

  // Handle the "OK" button
  okButton.addEventListener('click', () => {
    let input = inputField.value
    debug(inputField.value)
    if (input != '' && popup.id == 'pin') {
      temppin = input
      document.querySelector('#pin input').value = ''
      buffterxhr()
      popup.style.display = 'none'
    }

    if (input != '' && popup.id == 'api' && (input.length > 50 || input.length <= 10 )) {
      debug("Validating from inputpopup")
      API_KEY = input
      setToken()
      if (api_con === 1) {
        buffergdata()
        popup.style.display = 'none'
      }
    }
  })

  return popup
}

async function buffergdata () {
  try {
    store_sync('api', API_KEY)
    getVersion()
    debug('getting gdata')
    await gdata()

    debug(`Get data is ${getdata['active']}`)
    if (getdata['active'] === true) {
      main()
      load.style.display = 'none'
    } else {
      servererror()
    }
  } catch (err) {
    debug(err)
    servererror()
  }
}

async function buffterxhr () {
  debug(c_mode)
  switch (c_mode) {
    case 'cin':
      res = await httpr(
        'POST',
        'clockin',
        `&eid=${getemployee['eid']}&ip=${iplog}&bn=${getdata['Cur_building']}&pin=${temppin}&time=${cur_time}`
      )
      break
    case 'cout':
      res = await httpr(
        'POST',
        'clockout',
        `&eid=${getemployee['eid']}&pin=${temppin}&time=${cur_time}`
      )
      break
  }
  temppin = null
  debug(typeof res)
  debug('res is' + res)
  debug(res[0])
  let newstatus = document.querySelector('#status')
  if (res[0] === 'INVALID PIN') {
    newstatus.textContent = 'INVALID PIN'
    newstatus.style.color = 'red'

    setTimeout(function () {
      getSelectedEmployee()
    }, 3000)
  } else {
    getSelectedEmployee()
  }
}

async function isActive () {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', `${API_URL}/v1/apps?app=${encodeURIComponent(app)}`, false)
  return new Promise((resolve, reject) => {
    xhr.onload = function () {
      if (this.status === 200) {
        const response = JSON.parse(this.responseText)
        debug(response.enabled)
        resolve(response.enabled)
      } else {
        reject(xhr.response)
      }
    }
    xhr.onerror = () => {
      reject(xhr.response)
    }
    xhr.send()
  })
}

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

async function getSelectedEmployee () {
  let employee = await httpr(
    'GET',
    'employees',
    `&building=${getdata['Cur_building']}&eid=${getemployee['eid']}`
  )
  clockInButton = document.getElementById('clock-in')
  clockOutButton = document.getElementById('clock-out')
  let getstatus = document.getElementById('status')

  clockInButton.disabled = false
  clockOutButton.disabled = true
  document.getElementById('status').innerHTML = 'Clocked Out'
  getstatus.style.color = 'orange'

  if (employee.length === 0) {
    getemployee['log'] = ''
    document.getElementById('time-worked').innerHTML = ''
    return
  }

  if (employee[1] == '23:59:00') {
    getemployee['log'] = employee[0]
    clockInButton.disabled = true
    clockOutButton.disabled = false
    getstatus.innerHTML = 'Clocked In'
    getstatus.style.color = 'green'
    document.getElementById('time-worked').innerHTML =
      'Last Log: ' + convertTo12HourTime(employee[0])
    return
  }

  getemployee['log'] = employee[1]
  document.getElementById('time-worked').innerHTML =
    'Last Log: ' + convertTo12HourTime(employee[1])
}

function convertTo12HourTime (timeString) {
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

async function gdata () {
  getdata['active'] = await gdata_checker('active', '')
  getdata['buildings'] = await gdata_checker('buildings', 'buildings')
  getdata['buildings']
  debug(`gdata ${getdata['buildings'][0]}`)
  return 1
}

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

async function store_sync (key, value) {
  debug(`Storing ${key}`)
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [key]: value }, () => {
      debug(`${value} stored into ${key}`)
      resolve(1)
    })
  })
}

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
      reject(undefined)
    }
  })
}

async function store_session (key, value) {
  debug(`Storing ${key}`)
  return new Promise((resolve, reject) => {
    chrome.storage.session.set({ [key]: value }, () => {
      debug(`${value} stored into ${key}`)
      resolve(1)
    })
  })
}

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

async function getToken () {
  try {
    const xhr = new XMLHttpRequest()
    xhr.open(
      'GET',
      `${API_URL}/token?api_key=${API_KEY}&app_p=hmg_punchclock`,
      false
    )
    return new Promise((resolve, reject) => {
      xhr.onload = function () {
        if (this.status === 200) {
          token = this.responseText
          debug('token is ' + token)
          if (token != 'Invalid API Key') {
            api_con = 1
          }
          resolve(token)
        }
        reject(false)
      }
      try {
        xhr.send()
      } catch (e) {
        if (api_con != 0) {
          servererror()
        }
        reject(false)
      }
    })
  } catch (err) {
    servererror()
  }
}

async function setToken () {
  token = await getToken()
}

async function httpr (type, dir, data) {
  debug('Getting HTTPR')
  if (token === null) {
    token = await getToken()
  }

  qdata = null
  const xhr = new XMLHttpRequest()
  qdata = data
  if (data != '') {
    switch (data[0]) {
      case 'addemployee':
        break
      case 'clockin':
        break
      case 'clockout':
        break
      default:
        break
    }
  }

  xhr.open(
    type,
    `${API_URL}/AppHMG/${dir}?Authorization=Bearer%20${token}${qdata}`,
    false
  )

  return new Promise((resolve, reject) => {
    xhr.onload = function () {
      load.style.display = 'flex'
      if (this.status === 200) {
        let response = ''
        try {
          response = JSON.parse(this.responseText)
        } catch (err) {
          debug(err)
          resolve('No')
        }
        load.style.display = 'none'
        resolve(response)
      } else if (this.status === 401) {
        setToken()
        resolve(httpr(type, dir, data))
      } else {
        reject(xhr.response)
      }
    }
    xhr.onerror = () => {
      reject(xhr.response)
    }
    try {
      xhr.send()
    } catch (err) {
      setToken()
      resolve(httpr(type, dir, data))
    }
  })
}
