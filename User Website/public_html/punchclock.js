const app = 'HMG PunchClock'
const isDebug = 0
var api_con = 0
var version = 2;
var refresh = 0
var staffdata = {}

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

    // Retrieving the value from localStorage
    API_KEY = localStorage.getItem('hmg_authenticated');
    body.appendChild(input_popup('api', 'Enter Passcode: '))
    load = document.querySelector('.loading')
    document.querySelector('.api').style.display = 'flex'
    setTokenbuffer()
  } catch (e) {}
}

async function getAPI (apiinput) {
  if (apiinput != '' || apiinput != undefined){
    API_KEY = apiinput
    await getToken()
    if (api_con === 1) {
      // Storing the value in localStorage
      buffergdata()
      return
    }
  }
  document.querySelector('.api').style.display = 'flex'
}

function getVersion () {
  let versioncheck = document.getElementById('versionCheck')
  versioncheck.innerHTML = 'v' + version

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
  document.body.appendChild(input_popup('trpop', ''))
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
  document.querySelector('#employees').click()
  debug(getdata['Cur_building'])
  let employees = await httpr(
    'GET',
    'employees',
    `&building=${getdata['Cur_building']}`
  )
/*
  let ref_emp = document.createElement('button')
  ref_emp.id = 'employees'
  ref_emp.innerText = 'Refresh'
  ref_emp.type = 'button'
  document.querySelector('#employees').outerHTML = ref_emp.outerHTML

  document.querySelector('#employees').addEventListener('click', function () {
    debug("Refreshing List")
    refresh = 0;
    refresh_employee_list(employees)
  })
*/
  refresh_employee_list(employees)
}

function refresh_employee_list (employees) {
  debug(employees)
  debug(typeof employees)
  debug('fill employee list')
  sel = document.querySelector('#employees')
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
    op.id = 'offline'
    if (employee[5] != null && employee[5] == '23:59:00'){
      op.id = 'online'
    }
    sel.appendChild(op)
  }
  //document.querySelector('#employees').outerHTML = sel.outerHTML
  document.querySelector('#buildings').click()
  //refresh_employee_list(employees)
  
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

  const manage_button = document.createElement('button')
  manage_button.id = 'manage'
  manage_button.type = 'button'
  manage_button.innerText = 'Manage'

  info.appendChild(clocked_status)
  form.appendChild(clockin_button)
  form.appendChild(clockout_button)
  form.appendChild(manage_button)

  return form
}

function selectedBuildings () {
  const selectedBuilding = document.getElementById('buildings')
  const selectedIndex = selectedBuilding.selectedIndex
  const selectedOption = selectedBuilding.options[selectedIndex]
  getdata['Cur_building'] = getdata['buildings'][0]
  getdata['Cur_building'] = selectedOption.value
  selectedBuilding.value = getdata['Cur_building']
  fill_employee_list()
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
        getdata['Cur_building'] = selectedOption.value
        fill_employee_list()
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

    //manage
  
    const manageButton = document.getElementById('manage')
    manageButton.disabled = true
    manageButton.addEventListener('click', function () {
      if (getemployee['eid'] === '') return
      c_mode = 'mge'
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
  inputField.type = (type == 'pin'||type == 'api') ? 'password': 'text'
  inputField.id = 'inputField'
  inputField.setAttribute( "autocomplete", "off" ); 
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
      debug(API_KEY)
      setTokenbuffer()
      /*
      if (api_con === 1) {
        buffergdata()
        popup.style.display = 'none'
      }
      */
    }
  })

  return popup
}

function runvalidation(){
  api_con = 1;
  buffergdata()
  //document.querySelector('.api').style.display = 'none'
  /*debug("Validating from inputpopup")
  API_KEY = input
  debug(API_KEY)
  setTokenbuffer()*/
}

async function setTokenbuffer(){
  await setToken()
}

async function buffergdata () {
  try {
    getVersion()
    debug('getting gdata')
    await gdata()

    debug(`Get data is ${getdata['active']}`)
    if (getdata['active'] === true) {
      main()
      load.style.display = 'none'
    } //else {
      //servererror()
    //}
  } catch (err) {
    debug(err)
    //servererror()
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
        `&eid=${getemployee['eid']}&pin=${temppin}&time=${cur_time}&ip=${iplog}`
      )
      break
      case 'mge':
        res = await httpr(
          'POST',
          'validate_pin',
          `&eid=${getemployee['eid']}&pin=${temppin}`
          )
        if (res == '1'){
          debug('true!')
          getSelectedItem ('employee',getemployee['eid'])
        }
  }
  temppin = null
  debug(typeof res)
  debug('res is' + res)
  debug(res[0])
  let newstatus = document.querySelector('#status')
  if (res[0] === 'INVALID PIN' || res[0] === '0') {
    newstatus.textContent = 'INVALID PIN'
    newstatus.style.color = 'red'

    setTimeout(function () {
      getSelectedEmployee()
    }, 3000)
  } else if (res[0] === 'INVALID IP'){
    newstatus.textContent = 'INVALID IP'
    newstatus.style.color = 'red'

    setTimeout(function () {
      getSelectedEmployee()
    }, 3000)
  }
  else {
    getSelectedEmployee()
  }
  fill_employee_list()
}

/*
async function isActive () {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', `${API_URL}/v1/apps?app=${encodeURIComponent(app)}`, false)
  return new Promise((resolve, reject) => {
    xhr.onload = function () {
      if (this.status === 200) {
        const response = JSON.parse(this.responseText)
        debug('response is ' + response.enabled)
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
*/
//XHR request: Check if app is active
async function isActive() {
  let url = `${API_URL}/v1/apps?app=${encodeURIComponent(app)}`;
  return fetch(url)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error(response);
      }
    })
    .then((response) => {
      debug(response.enabled);
      return response.enabled;
    })
    .catch((error) => {
      throw new Error(error);
    });
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
  manageButton = document.getElementById('manage')
  let getstatus = document.getElementById('status')

  clockInButton.disabled = false
  clockOutButton.disabled = true
  manageButton.disabled = false
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
function convertTo12HourTime(timeString) {
  // Remove milliseconds and keep only HH:mm:ss
  const cleanedTime = timeString.slice(0, 8);

  // Parse the cleaned time string using the Date object
  const date = new Date(`1970-01-01 ${cleanedTime}`);

  // Extract the hours and minutes from the date object
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Determine whether the time is AM or PM
  let ampm = 'AM';
  if (hours >= 12) {
    ampm = 'PM';
  }

  // Convert the hours to 12-hour format
  let hour12 = hours % 12;
  if (hour12 === 0) {
    hour12 = 12;
  }

  // Format the minutes as a 2-digit string
  const minuteString = (minutes < 10 ? '0' : '') + minutes;

  // Return the formatted time string
  return `${hour12}:${minuteString} ${ampm}`;
}

async function gdata () {
  getdata['active'] = await isActive()
  getdata['buildings'] = await gdata_checker('buildings', 'buildings')
  getdata['buildings']
  debug(`gdata ${getdata['buildings'][0]}`)
  return 1
}

async function gdata_checker (key, dir) {
  return await httpr('GET', dir, '')
}
/*
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
*/
//XHR request: gets token for XHR send/receive
async function getToken() {
  try {
    let url = `${API_URL}/token?api_key=${API_KEY}&app_p=hmg_punchclock`;
    return fetch(url)
      .then((response) => {
        debug(response)
        if (response.status === 200) {
          return response.text();
        } else {
          throw new Error(response);
        }
      })
      .then((token) => {
        if (token !== 'Invalid API Key') {
          if (api_con === 0) {
            api_con = 1;
            localStorage.setItem('hmg_authenticated', API_KEY);
            buffergdata()
            document.querySelector('.api').style.display = 'none'
          }
        }
        return token;
      })
      .catch((error) => {
        if (api_con !== 0) {
          servererror();
        }
        throw new Error(error);
      });
  } catch (err) {
    servererror();
  }
}


async function setToken () {
  token = await getToken()
}
/*
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
*/

//XHR request module
async function httpr(type, dir, data) {
  debug('Getting HTTPR')
  if (token === null) {
    token = await getToken()
  }

  let qdata = null
  let url = `${API_URL}/AppHMG/${dir}?Authorization=Bearer%20${token}`;
  qdata = data;
  if (qdata !== null) {
    url += qdata;
  }

  return fetch(url, {
    method: type,
  })
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else if (response.status === 401) {
        return setToken().then(() => httpr(type, dir, data));
      } else {
        throw new Error(response);
      }
    })
    .catch((error) => {
      throw new Error(error);
    });
}
// Get today's date
const today = new Date();

// Get the date 15 days ago
const fifteenDaysAgo = new Date();
fifteenDaysAgo.setDate(today.getDate() - 15);

// Formatting the dates as strings in "YYYY-MM-DD" format
const formatDate = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const todayFormatted = formatDate(today);
const fifteenDaysAgoFormatted = formatDate(fifteenDaysAgo);

var ldate = fifteenDaysAgoFormatted
var rdate = todayFormatted


async function getSelectedItem (type, id) {
  //input_popup(type,'Hello!',id)

  //let req = `&sd=${ldate}&ed=${rdate}&id=${id}`
  //staffdata = await httpr('GET', 'employeelogs', req)
  staffdata = await getstaffdata(id)
  trpop = document.querySelector('#trpop')
  trpop.innerHTML = ''
  var seldata = ''
  debug(type)
  switch (type){
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
  
  /*
  // Add delete or restore button to title
  const delresstaffButton = document.createElement('button')
  let delresicon = (cur_page === 'archived staff') ? 'restore_from_trash' : 'delete'
  delresstaffButton.innerHTML =
    `<span class="material-symbols-outlined" id="staff-profile-btns">${delresicon}</span>`
  let delresid = (cur_page === 'archived staff') ? 'restore-staff' : 'delete-staff'
  delresstaffButton.id = delresid
  popupTitle.appendChild(delresstaffButton)
  */
  popupHeader.appendChild(popupTitle)
  // Create the date input field
  const dateRangeGroup = document.createElement('div')
  dateRangeGroup.classList.add('form-group')

  const inlinedateGroup = document.createElement('div')
  inlinedateGroup.classList.add('inline-date')
  
  const dateRLabel = document.createElement('label')
  dateRLabel.setAttribute('for', 'dateInput')
  dateRLabel.textContent = 'Date Range: '
  dateRangeGroup.appendChild(dateRLabel)
  
  const dateLInput = document.createElement('input')
  dateLInput.setAttribute('type', 'date')
  //dateInput.classList.add('form-control')
  dateLInput.id = 'dateInput'
  dateLInput.setAttribute('value', ldate)
  inlinedateGroup.appendChild(dateLInput)

  const dateRInput = document.createElement('input')
  dateRInput.setAttribute('type', 'date')
  //dateInput.classList.add('form-control')
  dateRInput.id = 'dateInput'
  dateRInput.setAttribute('value', rdate)
  inlinedateGroup.appendChild(dateRInput)

  dateRangeGroup.appendChild(inlinedateGroup)
  popupHeader.appendChild(dateRangeGroup)

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
    ftLabel.textContent = 'Fulltime: '
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
  
  ftSelect.value = seldata['full_time']

  const firstNameInputGroup = document.createElement('div')
  firstNameInputGroup.classList.add('form-group', 'inline-inputs')
  popupBody.appendChild(firstNameInputGroup)

  const firstNameLabel = document.createElement('label')
  firstNameLabel.setAttribute('for', 'firstNameInput')
  firstNameLabel.textContent ='First Name: '
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
  middleNameLabel.textContent = 'Middle Name: '
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
  lastNameLabel.textContent = 'Last Name: '
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
  jobRoleLabel.textContent = 'Job Role: '
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
  genderLabel.textContent = 'Gender: '
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
  birthdateLabel.textContent ='Birthdate:'
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
  buildingLabel.textContent = 'Building: '
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
  dateLabel.textContent = 'Date: '
  dateInputGroup.appendChild(dateLabel)

  const dateInput = document.createElement('input')
  dateInput.setAttribute('type', 'date')
  //dateInput.classList.add('form-control')
  dateInput.id = 'dateInput'
  dateInput.setAttribute('value', rdate)

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

  const addtimeButton = document.createElement('button')
  addtimeButton.classList.add('btn', 'add-time-save')
  addtimeButton.textContent = 'Save'
  addtime.appendChild(addtimeButton)

  popupContent.appendChild(addtime)

  const popupTable = document.createElement('div')
  popupTable.classList.add('popup-Table')
  popupContent.appendChild(popupTable)
  updatetablebuffer(id,'None','',popupTable)
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
    $('#timepickerin').timepicker({})
    $('#timepickerout').timepicker({})

    //Slide toggle for add time
    $('.trpop #profile-add-time').css('display', 'none')
    $('.add-time-profile').click(function () {
      $('.trpop #profile-add-time').slideToggle()
    })
  })
  dateLInput.addEventListener('change', function(event) {
    const selectedDate = event.target.value;
    debug('Selected date:', selectedDate);
    ldate = selectedDate
    //document.querySelector('#staff-profile').innerHTML = ''
    const staffProfileTable = document.getElementById('staff-profile');

    // Check if the element exists before attempting to remove it
    if (staffProfileTable) {
      // Remove the element from the DOM
      staffProfileTable.remove();
    }
    updatetablebuffer(id,'None','',popupTable)
    // You can perform any desired actions with the selected date here
  });

  dateRInput.addEventListener('change', function(event) {
    const selectedDate = event.target.value;
    debug('Selected date:', selectedDate);
    rdate = selectedDate
    document.querySelector('#staff-profile')
    //document.querySelector('#staff-profile').innerHTML = ''
    const staffProfileTable = document.getElementById('staff-profile');

    // Check if the element exists before attempting to remove it
    if (staffProfileTable) {
      // Remove the element from the DOM
      staffProfileTable.remove();
    }

    updatetablebuffer(id,'None','',popupTable)
    // You can perform any desired actions with the selected date here
  });
  addtimeButton.addEventListener('click', () => {
    let at_date = dateInput.value
    let at_cin = tp_cin.value
    let at_co = tp_co.value
    if (![at_date, at_cin, at_co].includes('')) {
      let atdata = `&id=${id}&cin=${at_cin}&co=${at_co}&dt=${at_date}&bd=${seldata['building']}&ip=${iplog}&targ=emp`
      debug(atdata)
      //httpr('POST', 'employeelogs', atdata)
      updatetablebuffer(id,'POST',atdata,popupTable)
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
    $('#delete-staff').css('display','none')
    $('#restore-staff').css('display','none')
    $('.edit-staff-profile').click(function () {
      $('.trpop #delete-staff').slideToggle()
      $('.trpop #restore-staff').slideToggle()
      $('.trpop .popup-body').slideToggle()
    })
  })

  xbtn.addEventListener('click', () => {
    /*
    if (staffchanged == 1) {
      staffchanged = 0
      //getstaffdata(1)
    }*/
    //document.querySelector('body').style.height = '266px'
    ldate = fifteenDaysAgoFormatted
    rdate = todayFormatted
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
  /*
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
      if (cur_page === 'archived staff'){
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
  */
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
//XHR request to get staff data
async function getstaffdata (id) {
  debug(ldate + rdate)

  let req = `&sd=${ldate}&ed=${rdate}&id=${id}`
  staffdata = await httpr('GET', 'employeelogs', req)
  debug(staffdata)
  return staffdata
}

async function updatetablebuffer(id,type,data,popupTable){
  await updatetable(id,type,data,popupTable)
}

async function updatetable (id,type,data,popupTable){
  if (data != ''){
    if (data.includes('targ=emp')){
      await httpr(type, 'employeelogs', data)  
    } else {
      await httpr(type, 'modifyhours', data)
    }
  }
  staffdata = await getstaffdata(id)
  let seldata = staffdata[id]
  let staffheaders = ['ID', 'Date', 'Clock in', 'Clock out','Approval','Comment', 'Total Hours']
  const table = document.createElement('table')
  table.id = 'staff-profile'
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
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  let grandtotal = 0
  let seldata_sorted = seldata['timelog']
  seldata_sorted.sort((a, b) => b.id - a.id);
  for (staff_d in seldata_sorted) {
    const staffTr = document.createElement('tr')
    //staffTr.id = staff_d
    //for (info of staff) {
    //debug(info.first_name)
    debug(seldata['timelog'][staff_d])
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
    let date1 = ''
    let date2 = ''
    if (staff['proposed_in'] != null){
      staffTd.appendChild(
        document.createTextNode(convertTo12HourTime(staff['proposed_in']))
      )
      date1 = new Date('1970-01-01' + 'T' + staff['proposed_in'])
      debug(date1)
    } else {
      staffTd.appendChild(
              document.createTextNode(convertTo12HourTime(staff['clock_in']))
      )
      date1 = new Date('1970-01-01' + 'T' + staff['clock_in'])
    }
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    if (staff['proposed_out'] != null){
      staffTd.appendChild(
        document.createTextNode(convertTo12HourTime(staff['proposed_out']))
      )
      date2 = new Date('1970-01-01' + 'T' + staff['proposed_out'])
      debug(date2)
    } else {
      staffTd.appendChild(
        document.createTextNode(convertTo12HourTime(staff['clock_out']))
      )
      date2 = new Date('1970-01-01' + 'T' + staff['clock_out'])
    }
    //staffTd.appendChild(
    //  document.createTextNode(convertTo12HourTime(staff['clock_out']))
    //)
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    if (staff['clock_out'] != '23:59:00' || convertTo12HourTime(staff['clock_out']) != '11:59 PM'){
      staffTd.appendChild(
        document.createTextNode(staff['approved'])
      )
      staffTd.id = staff_d
      staffTd.className = staff['approved']
      staffTr.appendChild(staffTd)
    } else {
      staffTd.appendChild(
        document.createTextNode('pending')
      )
      staffTd.id = staff_d
      staffTd.className = 'pending'
      staffTr.appendChild(staffTd)
    }


    staffTd = document.createElement('td')
    staff_comment = ''
    if (staff['comments'] != null){
      staff_comment = staff['comments']
    }
    staffTd.appendChild(document.createTextNode(staff_comment))
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    let totalh = 0
    let needs_rev = false
    //let date1 = new Date('1970-01-01' + 'T' + staff['clock_in'])
    //let date2 = new Date('1970-01-01' + 'T' + staff['clock_out'])
    let milis = date2.getTime() - date1.getTime()

    let tHours = milis / 1000 / 60 / 60
    //debug(tHours)
    totalh += tHours

    if (staff['needs_review'] == true) {
      //&& c_logs['date'] != todayset){
      staffTr.setAttribute('class', 'needs_review')
      needs_rev = true
    }

    staffTd = document.createElement('td')
    staffTd.appendChild(document.createTextNode(`${totalh.toFixed(2)}`))
    staffTr.appendChild(staffTd)
    if (staff['approved'] != 'denied'){
      grandtotal += totalh
    }
    //if (staff[staff.length-1] >= 80){
    //    staffTr.setAttribute("id","overtime");
    //}
    //}
    tbody.appendChild(staffTr)
    /*
            switch(type){
                case "overtime": if (totalh >= 80){tbody.appendChild(staffTr)}; break;
                case "needs_review": if (needs_rev){tbody.appendChild(staffTr)}; break;
                case "active": if (totalh > 0){tbody.appendChild(staffTr)}; break;
                default: tbody.appendChild(staffTr); break;
            }*/
    if (staff['proposed_in'] != null && staff['approved'] != 'approved'){
      previousrow = deniedpreviousrow(seldata,staff_d, grandtotal)
      tbody.appendChild(previousrow[0])
      grandtotal = previousrow[1]
    }
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
  if (data === ''){
    popupTable.appendChild(table);
  } else {
    const popupTable2 = document.createElement('div')
    popupTable2.classList.add('popup-Table')
    popupTable2.appendChild(table)
    document.querySelector('.trpop .popup-Table').outerHTML = popupTable2.outerHTML
  }

    //edit table
    const logtable = document.querySelector('.trpop #staff-profile tbody')
    if (logtable){
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
                com = row.children[5].textContent
              debug(bid + dt + ci + co)
              let updatebd = `&recordid=${bid}&cin=${ci}&cout=${co}&com=${com}`
              debug(id)
              debug(updatebd)
              debug(popupTable)
              debug(com)
              updatetablebuffer(id,'PATCH',updatebd,popupTable)

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
              com = row.children[5].textContent
            debug(bid + dt + ci + co)
            //let updatebd = `&id=${bid}&dt=${dt}&ci=${ci}&co=${co}`
            let updatebd = `&recordid=${bid}&cin=0:00 AM&cout=0:00 AM&com=${com}`
            debug(id)
            debug(updatebd)
            debug(popupTable)
            updatetablebuffer(id,'PATCH',updatebd,popupTable)
            //httpr('PATCH', 'employeelogs', updatebd)

            //remove the save button
            staffchanged = 1
            row.removeChild(delButton)
          })


          }
        }
      }) //end logtable
    }
}

function deniedpreviousrow(seldata,staff_d, grandtotal){
  const staffTr = document.createElement('tr')
    //staffTr.id = staff_d
    //for (info of staff) {
    //debug(info.first_name)
    debug(seldata['timelog'][staff_d])
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
    let date1 = ''
    let date2 = ''

    staffTd.appendChild(
            document.createTextNode(convertTo12HourTime(staff['clock_in']))
    )
    date1 = new Date('1970-01-01' + 'T' + staff['clock_in'])

    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')

    staffTd.appendChild(
      document.createTextNode(convertTo12HourTime(staff['clock_out']))
    )
    date2 = new Date('1970-01-01' + 'T' + staff['clock_out'])

    //staffTd.appendChild(
    //  document.createTextNode(convertTo12HourTime(staff['clock_out']))
    //)
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staffTd.appendChild(
      document.createTextNode('approved')
    )
    staffTd.id = staff_d
    staffTd.className = 'approved'
    staffTr.appendChild(staffTd)

    staffTd = document.createElement('td')
    staff_comment = ''

    staffTd.appendChild(document.createTextNode(staff_comment))
    staffTd.id = staff_d
    staffTr.appendChild(staffTd)

    let totalh = 0
    let needs_rev = false
    //let date1 = new Date('1970-01-01' + 'T' + staff['clock_in'])
    //let date2 = new Date('1970-01-01' + 'T' + staff['clock_out'])
    let milis = date2.getTime() - date1.getTime()

    let tHours = milis / 1000 / 60 / 60
    //debug(tHours)
    totalh += tHours

    if (staff['needs_review'] == true) {
      //&& c_logs['date'] != todayset){
      staffTr.setAttribute('class', 'needs_review')
      needs_rev = true
    }

    staffTd = document.createElement('td')
    staffTd.appendChild(document.createTextNode(`${totalh.toFixed(2)}`))
    staffTr.appendChild(staffTd)
    grandtotal += totalh
    //if (staff[staff.length-1] >= 80){
    //    staffTr.setAttribute("id","overtime");
    //}
    //}
    //tbody.appendChild(staffTr)
    return [staffTr, grandtotal]
    /*
            switch(type){
                case "overtime": if (totalh >= 80){tbody.appendChild(staffTr)}; break;
                case "needs_review": if (needs_rev){tbody.appendChild(staffTr)}; break;
                case "active": if (totalh > 0){tbody.appendChild(staffTr)}; break;
                default: tbody.appendChild(staffTr); break;
            }*/
}

async function postdata (type,loc,data){
  resp = await httpr(type,loc,data)
}

function printTable (tableId, header) {
  /*
  if (
    document.querySelector('.profiles-setting a span').textContent ==
    'print_disabled'
  ){return}*/
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
          <h2>${ldate} to ${rdate}</h2>
        ${table.outerHTML}
      </body>
    </html>
  `)
  newWindow.print()
  //newWindow.close()
}