const puppeteer =require('puppeteer')
const {nanoid} =require('nanoid')
const fs = require('fs');
const {getDiscountsForInvoice} = require('./AdjustmentProcessing')

const { MongoClient } = require('mongodb');
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = 'mongodb+srv://doadmin:3UAzS8db4ci65701@db-mongodb-nyc3-07265-dd6a67db.mongo.ondigitalocean.com/admin?authSource=admin&replicaSet=db-mongodb-nyc3-07265&tls=true&tlsCAFile=ca-certificate.crt';
const client = new MongoClient(url);

// Database Name
const dbName = 'admin';

async function mainDB(CommissionInvoices) {
  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  const collection = db.collection('spicecommissioninvoices');

  // the following code examples can be pasted here...

  const insertResult = await collection.insertMany(CommissionInvoices);
console.log('Inserted documents =>', insertResult);

// const findResult = await collection.find({}).toArray();
// console.log('Found documents =>', findResult);


// const filteredDocs = await collection.find({ a: 3 }).toArray();
// console.log('Found documents filtered by { a: 3 } =>', filteredDocs);


// const updateResult = await collection.updateOne({ a: 3 }, { $set: { b: 1 } });
// console.log('Updated documents =>', updateResult);

// const deleteResult = await collection.deleteMany({ a: 3 });
// console.log('Deleted documents =>', deleteResult);

// const indexName = await collection.createIndex({ a: 1 });
// console.log('index name =', indexName);


  return 'done.';
}


function n(num, len = 2) {
  return `${num}`.padStart(len, '0');
}
let ticketPurchases = []
let AdjustmentsListing=[]
let EventTicketTypes = []
let CommissionInvoices=[]
let bookings = []
const StartApp = async (query) => {
console.log('RESETTING ALL COLLECTIONS FOR NEW INCOMING REQUESTS')
ticketPurchases = []
AdjustmentsListing=[]
EventTicketTypes = []
CommissionInvoices=[]
  console.log('OPENING BROWSER AND GOING TO THE SPICE UK TMS ADMIN PORTAL')
  const [browser, page ]= await openBrowserAndLoginPage()
  console.log('loginToPage - IM GOING TO LOGIN TO THE WEBSITE')
  await loginToPage(page)
  console.log('goToEventsListing - IM GOING TO THE EVENTS PAGE RIGHT NOW')
  await goToEventsListing(page)
  // query = 'SCO0015718'
  // const eventRef = query
  const eventRef = query
  console.log('enterEventRef - ENTERING THE EVENT REF FOR THE CORRECT SCOPE')
  await enterEventRef(page, eventRef)
  // await clickOnCommencesFrom(page)
  console.log('getEventSummaryData - GET THE EVENT DATA FROM THE MAIN SUMMARY TABLE')
  await getEventSummaryDataForOneEventOnly(page)
  console.log('clickOnEvent - IM GOING TO CLICK ON A SPECIFIC EVENT')
  await clickOnEvent(page)
  console.log('getEventSetupData - IM GOING TO CLICK ON A SPECIFIC EVENT')
  const eventData = await getEventSetupData(page)

  console.log('switchTraitsab - IM GOING TO SWITCH TO THE TRAITS TAB')
await switchToTraitsTab(page)

  

  console.log('switchToBookingsTab - IM GOING TO SWITCH TO THE BOOKINGS REPORT TAB')
  await switchToBookingsTab(page)
  console.log('getBookings - IM GOING TO START TO GET BOOKINGS')
  await getBookings(page)
  console.log('switchToBookingsReportTab - IM GOING TO SWITCH TO THE BOOKINGS TAB')
  await switchToBookingReportTab(page)
  console.log('GOING TO THE EVENT TYPES PAGES')
  await clickOnTicketTypes(page)
  console.log('GETTING THE TICKET TYPE DATA')
  const ticketTypes = await getTicketTypeDetails(page)
  console.log(ticketTypes)
  console.log('clickOnTicketPurchases ABOUT TO START')
  await clickOnTicketPurchases(page)
  console.log('getTransactionsDetails ABOUT TO START')
  let [stillToProcess,NumTicketPurchasesRows,totalTicketsSold,txnSeenSoFar] = await getTransactionNumbers(page)
  console.log(stillToProcess,NumTicketPurchasesRows,totalTicketsSold,txnSeenSoFar)
  await getAllTransactionsFromPage(page, NumTicketPurchasesRows, bookings)
  console.log('STARTING THE RECURSIVE ALGO TO LOOP THROUGH PAGES AND SCOOP UP ALL THE TICKET SALES DATA')
  await loopAllTicketPurchasePages(stillToProcess,NumTicketPurchasesRows,totalTicketsSold,txnSeenSoFar, page,bookings)
  // console.log(ticketPurchases,'IVE JUST PUT THIS HERE')
  console.log(ticketPurchases.length)
  const enrichedTicketsDataArray = await enrichTheTicketData(AdjustmentsListing, ticketPurchases, eventData)
  console.log(enrichedTicketsDataArray)
  let totalSalesForEvent = parseFloat(ticketPurchases.reduce(function (acc, curr) {
    return acc + curr.ticketquantity * curr.ticketprice
},0)).toFixed(2);
const NumTixSold = ticketPurchases.length
  await myBatchOfInvoices(enrichedTicketsDataArray)
  console.log(JSON.stringify(CommissionInvoices))
  mainDB(CommissionInvoices)
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());

  console.log('closeTheBrowser ABOUT TO START')
  await closeTheBrowser(browser)
var jsonContent = JSON.stringify({NumTixSold,totalSalesForEvent, eventData, ticketPurchases,ticketTypes, AdjustmentsListing, CommissionInvoices});
fs.writeFile("output.json", jsonContent, 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
 
    console.log("JSON file has been saved.");
});

  return JSON.stringify({NumTixSold,totalSalesForEvent, eventData, ticketPurchases,ticketTypes, AdjustmentsListing, CommissionInvoices})

}

const userName='stuart.wilson'
const password='Acc0unts'

const myBatchOfInvoices = async (enrichedTicketsDataArray) => {
  // let bookings = [...ticketPurchases]
  
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }
  
  function add(accumulator, a) {
    return accumulator + a;
  }
  
  let extractClientOwners = enrichedTicketsDataArray.map(a => a.clientOwnerAtPurchaseDate);
  
  let uniqueListClientOwners = extractClientOwners.filter(onlyUnique);
  
  function getAgentContactDetails(agentName) {
    var options = {
      'Spice Scotland': JSON.stringify({companyName: 'Spice Scotland'}),
      'Spice West Midlands': JSON.stringify({companyName: 'Spice West Midlands'}),
      'Spice London': JSON.stringify({name: 'test'}),
      'Spice Yorkshire': JSON.stringify({companyName: 'Spice Yorkshire', address:'Yorkshire'}),
      'Spice South West': JSON.stringify({name: 'test'}),
      'Spice Wales': JSON.stringify({name: 'test'}),
      'Spice East Midlands': JSON.stringify({name: 'test'}),
      'Spice Thames Valley & Solent': JSON.stringify({name: 'test'}),
      'Spice London': JSON.stringify({name: 'test'}),
      'AGENT_DOESNT_EXIST': 'CREATE AGENT DETAILS FIRST'
    };
    return `${(options[agentName] || options['AGENT_DOESNT_EXIST'])}`;
  }
  
  for (var agent of uniqueListClientOwners) {
    const oneGroupBookings = enrichedTicketsDataArray.filter(g => g.clientOwnerAtPurchaseDate === agent)
    // console.log(oneGroupBookings)
    let extractEventOwners = oneGroupBookings.map(a => a.eventOwner);
    let extractTicketCategories = oneGroupBookings.map(a => a.ticketoption);
    let uniqueListEventOwners = extractEventOwners.filter(onlyUnique);
    let extractEventNames = oneGroupBookings.map(a => a.eventName);
    let extractEventRefs = oneGroupBookings.map(a => a.eventRef);
    let extractEventTypes = oneGroupBookings.map(a => a.eventType);
    let extractEventCommences = oneGroupBookings.map(a => a.eventCommences);
    let uniqueListEventRefs = extractEventRefs.filter(onlyUnique);
    let uniqueListEventTypes = extractEventTypes.filter(onlyUnique);
    let uniqueListEventNames = extractEventNames.filter(onlyUnique);
    let uniqueListTicketOptions = extractTicketCategories.filter(onlyUnique);
    let uniqueListEventCommences = extractEventCommences.filter(onlyUnique);
    const invoiceTo = agent
    const invoiceFrom = uniqueListEventOwners[0]
    if (invoiceTo != invoiceFrom ){
    const eventName=uniqueListEventNames[0]
    const eventRef=uniqueListEventRefs[0]
    const eventType=uniqueListEventTypes[0]
    const eventCommences=uniqueListEventCommences[0]
    debugger;
    let ticketamounts = oneGroupBookings.map(a => a.totaldueCalc);
    let discountamounts = oneGroupBookings.map(a => Number(a.discountTotal));
    const total_sales_received = Number(ticketamounts.reduce(add, 0))
    const totalDiscounts = Number(discountamounts.reduce(add, 0))
    const total_comm_due = parseFloat(Number((total_sales_received + totalDiscounts) * 0.05)).toFixed(2)
    const invoice_total = parseFloat(Number(total_sales_received + totalDiscounts - total_comm_due)).toFixed(2)
    // const invoiceMainData={invoiceTo,invoiceFrom, eventName,eventCommences,invoice_total,total_comm_due,total_sales_received,totalDiscounts}
    let lineItemsArray=[]
      for (var tickettype of uniqueListTicketOptions) {
              var newArray = oneGroupBookings.filter(function (el) {
                  return el.clientOwnerAtPurchaseDate == agent &&
                         el.ticketoption == tickettype  
                });
        // console.log(newArray,'NEW ARRAY')
        let arrayOfTicketQuantities = newArray.map(a => a.ticketquantity);
        let arrayOfTicketPrices = newArray.map(a => a.ticketprice);
        let arrayOfDiscountAmounts = newArray.map(a => Number(a.discountTotal));
        let totalcategorydiscount = 0;
        let ticketcategorytotaldue = 0;
  for(var i=0; i< arrayOfTicketQuantities.length; i++) {
      ticketcategorytotaldue += arrayOfTicketQuantities[i]*arrayOfTicketPrices[i];
      totalcategorydiscount += arrayOfDiscountAmounts[i];
  }
        // console.log(arrayOfTicketQuantities,arrayOfTicketPrices)
        const subtotal_tickets_sold = Number(arrayOfTicketQuantities.reduce(add, 0))
        // const subtotal_due = parseInt(arrayOfTicketQuantities.reduce(add, 0))
        let ticketsubtotalamounts = newArray.map(a => Number(a.totaldueCalc));
        // const ticketType = tickettype
        const subtotal_sales_received = Number(ticketsubtotalamounts.reduce(add, 0))
        const subtotalforticketypelessDiscount = subtotal_sales_received + totalcategorydiscount
  console.log(subtotalforticketypelessDiscount)
        // const subtotal_sales_received_less_discount = subtotal_sales_received * discount_per_pound
        // console.log(subtotal_sales_received_less_discount)
        const subtotal_comm_due = Number((subtotal_sales_received + totalcategorydiscount) * 0.05).toFixed(2);
        const subinvoice_total = Number((subtotal_sales_received -subtotal_comm_due)).toFixed(2);
        const ticketPrice = arrayOfTicketPrices[0].toFixed(2);
        lineItemsArray.push({subtotal_tickets_sold,tickettype,subtotal_sales_received,subinvoice_total,subtotal_comm_due,ticketcategorytotaldue,totalcategorydiscount,subtotalforticketypelessDiscount,ticketPrice})
      }
    
  CommissionInvoices.push({invoiceTo,invoiceFrom,eventType, eventRef,eventName,eventCommences,invoice_total,total_comm_due,total_sales_received,totalDiscounts,lineItemsArray})
  
      }
  
  }
    }

const openBrowserAndLoginPage = async () => {
  const browser = await puppeteer.launch({ headless: false, args:[
    '--start-maximized',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process'
 ] });
  const page = await browser.newPage();
  page.setViewport({ width: 0, height: 0 });
  await page.goto('https://tms.spiceuk.com/Login/UserLogin.aspx', {"waitUntil" : "networkidle0", });
   const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      deviceScaleFactor: window.devicePixelRatio,
    };
  });
  console.log('Dimensions:', dimensions);
  return [browser, page]
}

const loginToPage = async (page) => {
  await page.type('input[id="ctl00_Content_txtUsername"]', userName, {delay: 20})
  await page.type('input[id="ctl00_Content_txtPassword"]', password, {delay: 20})
  await page.click('#ctl00_Content_lnkLogin')
  await page.waitForTimeout(8000);
}

const goToEventsListing = async (page) => {

  await page.click('#Events > div.Icon')
  await page.waitForTimeout(10000);
  var eventsWindow = await page.frames()[5]
  await eventsWindow.waitForTimeout(10000);
  const owningSubAccountDropdown = await eventsWindow.$("#ctl00_Content_ucxList_ddlFilterBy_SelectByOwningSubAccount");
  await owningSubAccountDropdown.type('-All-')
  await page.waitForTimeout(3000);
  await eventsWindow.evaluate(() => {
    document.querySelector("#ctl00_Content_ucxList_chkCheckBoxFilter_1").click();
  });

    await eventsWindow.waitForTimeout(5000);
  const numTableRows = await eventsWindow.$$eval('#ctl00_Content_ucxList_updDataListTable > div.row.control-set > div.row > div > table > tbody td.ColEventName', tds => tds.map((td) => td.innerText.trim()).length)
  console.log(numTableRows)
  return [numTableRows, eventsWindow]
}

const clickOnEvent = async (page) => {
  var eventsWindow = await page.frames()[5]
let step = 0
  console.log(`I've just clicked on:  #ctl00_Content_ucxList_rptList_ctl${n(step)}_trRow`);
  await eventsWindow.click(`#ctl00_Content_ucxList_rptList_ctl${n(step)}_trRow`)
  await eventsWindow.waitForTimeout(10000);
}

const switchToBookingReportTab = async (page) => {
  console.log('IM TAKING US TO THE BOOKINGS REPORT TAB')
  var eventsDetailWindow = await page.frames()[6]
  await eventsDetailWindow.click(`#__tab_ctl00_Content_ucxEvents_Edit_tabSet_tab9`)
  await eventsDetailWindow.waitForTimeout(10000);
  return eventsDetailWindow
}



const switchToBookingsTab = async (page) => {
  console.log('IM TAKING US TO THE BOOKINGS TAB')
  var eventsDetailWindow = await page.frames()[6]
  await eventsDetailWindow.waitForTimeout(5000);
  await eventsDetailWindow.click(`#ctl00_Content_ucxEvents_Edit_tabSet_tab1_tab`)
  return;
}




const switchToTraitsTab = async (page) => {
  console.log('IM TAKING US TO THE TRAITS TAB')
  let eventsDetailWindow = await page.frames()[6]
  await eventsDetailWindow.waitForTimeout(5000);
  await eventsDetailWindow.click(`#ctl00_Content_ucxEvents_Edit_tabSet_tab6_tab`)
  await eventsDetailWindow.waitForSelector(`#ctl00_Content_ucxEvents_Edit_tabSet_tab6_ucxEventTraitsEditor_rptTraitTypes_ctl00_rptTraits_ctl01_divTraitButton`)
  let element = await eventsDetailWindow.$('#ctl00_Content_ucxEvents_Edit_tabSet_tab6_ucxEventTraitsEditor_rptTraitTypes_ctl00_rptTraits_ctl01_divTraitButton')
  let value = await eventsDetailWindow.evaluate(el => el.getAttribute('class'), element)
  console.log(value,'IM THE TRAITS CLASS VALUE')
  let result = value.includes("TraitActive");
  console.log(result, 'im the result')
}




const clickOnTicketPurchases = async (page) => {
  var eventsTicketPurchaseTab = await page.frames()[7]
  const ticketPurchasesLink = await eventsTicketPurchaseTab.waitForXPath("/html/body/form/div[3]/div/ul/li[3]/a");
  await ticketPurchasesLink.click();
  
  return [eventsTicketPurchaseTab]
}

const clickOnTicketTypes = async (page) => {
  var eventsTicketPurchaseTab = await page.frames()[7]
  const ticketPurchasesLink = await eventsTicketPurchaseTab.waitForXPath("/html/body/form/div[3]/div/ul/li[1]/a");
  await ticketPurchasesLink.click();
  await eventsTicketPurchaseTab.waitForTimeout(3000);
  await eventsTicketPurchaseTab.select('.EventBookingsTicketTypes > div:nth-child(1) > div:nth-child(1) > label:nth-child(1) > select:nth-child(1)', '100')
}

async function getTransactionNumbers(page) {
  console.log('starting gettransaction numbers')
  var eventsTicketPurchaseTab = await page.frames()[7]
  let NumTransactionsDataLabel =  await eventsTicketPurchaseTab.$eval('.EventBookingsTicketPurchases > div:nth-child(1) > div:nth-child(4)', el => el.innerText)
  let NumTicketsSoldInTotal = NumTransactionsDataLabel.split(/(\s+)/)
  let txnSeenSoFar = NumTicketsSoldInTotal[6]
  let totalTicketsSold = NumTicketsSoldInTotal[10]
  let tableSelector = '.EventBookingsTicketPurchases > div:nth-child(1) > table:nth-child(3) > tbody:nth-child(2)'
  let NumTicketPurchasesRows = await eventsTicketPurchaseTab.$$eval(`${tableSelector} > tr`, el => el.length)
  let stillToProcess = (totalTicketsSold - txnSeenSoFar)
  console.log(NumTicketPurchasesRows, "Num rows on the table from getTranNums")
  console.log(stillToProcess,'the stilltoprocess from getTranNums')
  return [stillToProcess,NumTicketPurchasesRows,totalTicketsSold,txnSeenSoFar]
}

const getPageNumbers = async (page) => {
  var eventsTicketPurchaseTab = await page.frames()[7]
  let PagingLabel =  await eventsTicketPurchaseTab.$eval('.EventBookingsTicketTypes > div:nth-child(1) > div:nth-child(4)', el => el.innerText)
  let NumTicketsSoldInTotal = PagingLabel.split(/(\s+)/)
  let totalRowsOnTable = NumTicketsSoldInTotal[10]
  console.log(totalRowsOnTable, 'rows on this table on the ticket types page')
return totalRowsOnTable

}

async function clickNextPage(page) {
  var eventsTicketPurchaseTab = await page.frames()[7]
  await eventsTicketPurchaseTab.click(`.EventBookingsTicketPurchases > div:nth-child(1) > div:nth-child(5) > a:nth-child(3)`)
  await eventsTicketPurchaseTab.waitForTimeout(4000);
}

async function clickOnCloseButton(page) {
  console.log('CLICK CLOSE BUTTON')
// wait until the element appears
const linkHandler = await page.waitForXPath("/html/body/form/div[3]/div[2]/div[2]/div[12]/div[1]/div[2]/div[1]/div[2]/div[8]");
await linkHandler.click();
}



class TicketPurchase {
  constructor(id, bookingRef, bookedOn, client, ticketoption, ticketquantity, ticketprice, totaldue,totaldueCalc, totalpaid, balancedue, agentCode, clientOwnerAtPurchase, bookingStatus, eventName, eventOwner, eventCommences) {
    this.id = id
    this.bookingRef = bookingRef
    this.bookedOn = bookedOn
    this.client = client
    this.ticketoption = ticketoption
    this.ticketquantity = parseInt(ticketquantity)
    this.ticketprice = parseFloat(ticketprice)
    this.totaldue = parseFloat(totaldue)
    this.totaldueCalc = parseFloat(totaldueCalc)
    this.totalpaid = parseFloat(totalpaid)
    this.balancedue = parseFloat(balancedue)
    this.commissionRatePercent = 5
    this.commissionpayable = parseFloat((totaldue * 5 / 100).toFixed(2))
    this.agentCode=agentCode
    this.clientOwnerAtPurchaseDate=clientOwnerAtPurchase
    this.bookingStatus=bookingStatus
    this.eventName=eventName
    this.eventOwner=eventOwner
    this.eventCommences=eventCommences
  }
}

async function getTransactionsDetails(page,NumTicketPurchasesRows, bookings) {
try {
  var eventsTicketPurchaseTab = await page.frames()[7]
  let tableSelector = '.EventBookingsTicketPurchases > div:nth-child(1) > table:nth-child(3) > tbody:nth-child(2)'
  debugger;
  let i = NumTicketPurchasesRows
  console.log(i,'I AM HERE')
  console.log(NumTicketPurchasesRows,'NUM TIX PURCH ROWS')
      const id = nanoid()
      const bookingRef = await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(1)`))
      const bookingItem = bookings.filter(booking => booking.bookingRef === bookingRef);
      const bookedOn = bookingItem[0].bookedOn
      const client = await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(3)`))
      const ticketoption = await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(4)`))
      const ticketquantity = parseInt(await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(5)`)))
      const TicketTypeInfo = EventTicketTypes.find(o => o.ticketType === ticketoption);
      const ticketprice = parseFloat(TicketTypeInfo.ticketPrice).toFixed(2)
      const totaldue = parseFloat(await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(6)`)))
      const totalpaid = parseFloat(await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(7)`)))
      const balancedue = parseFloat(await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(8)`)))
      const totaldueCalc = parseFloat((ticketquantity * ticketprice)).toFixed(2)
      const diffinAmountsDue = parseFloat((totaldue - totaldueCalc)).toFixed(2)
      const agentCode = bookingItem[0].clientOwnerAtPurchaseDate
      const clientOwnerAtPurchase = bookingItem[0].clientOwnerAtPurchaseDate
      const bookingStatus = bookingItem[0].bookingStatus
      const eventName = bookingItem[0].eventName
      const eventOwner = bookingItem[0].eventOwner
      const eventCommences = bookingItem[0].eventCommences
      // console.log(bookingItem,'THIS IS THE BOOKING ITEM FROM THE TICKETS')
      const actualTicketPurchaseItem = new TicketPurchase(id, bookingRef, bookedOn, client, ticketoption, ticketquantity, ticketprice, totaldue, totaldueCalc, totalpaid, balancedue, agentCode, clientOwnerAtPurchase, bookingStatus, eventName, eventOwner, eventCommences)
      console.log(actualTicketPurchaseItem)
      if(diffinAmountsDue!=0) {
        const costAdjustedTicket = ({reason: 'COST_ADJUSTMENT',id, bookingRef, bookedOn, client, ticketoption, ticketquantity, ticketprice, totaldue, totaldueCalc, totalpaid, balancedue, agentCode, clientOwnerAtPurchase, bookingStatus, eventName, eventOwner, eventCommences})
        AdjustmentsListing.push(costAdjustedTicket)
    }
      // console.log(diffinAmountsDue)
        // console.log(diffinAmountsDue,'diff in amounts pushed to an exception list for review')
        ticketPurchases.push(actualTicketPurchaseItem)
} catch(err){
  console.log(err)
}

      }

async function getBookings(page) {
  console.log('INSIDE GET BOOKINGS')
  let eventsDetailWindow = await page.frames()[6]
  await eventsDetailWindow.waitForTimeout(3000);

  const found = await eventsDetailWindow.evaluate(() => window.find("Page "));
  console.log(found)
  let lastPageOfLoop
  if (found != false) {
    const element = await eventsDetailWindow.$x('//*[@id="ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_updDataListTable"]/div[3]/table/tbody/tr/td/center/table/tbody/tr/td[1]')
    const textObject = await element[0].getProperty('textContent');
    const pageNumberBlock = textObject._remoteObject.value
    const pageBlockSplit = pageNumberBlock.split("");
    const pageNumbers = pageBlockSplit.filter(Number)
    console.log(pageNumbers)
   lastPageOfLoop = pageNumbers[1]
  // const thelastpage = lastPageOfLoop
  console.log(lastPageOfLoop)
  // console.log(thelastpage)
  } else {
    lastPageOfLoop = 1
  }
  

for (let j = 0; j < lastPageOfLoop; j++) {
  let numTableRows = await eventsDetailWindow.$$eval('.table > tbody > tr',elements => elements.length)
  await eventsDetailWindow.waitForTimeout(2000);
  debugger;
  console.log(numTableRows)
  console.log(j)
  for (let i = 0; i <= numTableRows - 1; i++) {
    console.log(i)
// await eventsDetailWindow.waitForTimeout(4000);

    i = n(i)
    let bookingRef = await eventsDetailWindow.$eval(`#ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_rptList_ctl${i}_trRow > td.ColBookingReference`, td => td.innerText)
    let bookedOn = await eventsDetailWindow.$eval(`#ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_rptList_ctl${i}_trRow > td.ColBookedOn`, td => td.innerText)
    let clientFirstName = await eventsDetailWindow.$eval(`#ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_rptList_ctl${i}_trRow > td.ColFirstName`, td => td.innerText)
    let clientLastName = await eventsDetailWindow.$eval(`#ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_rptList_ctl${i}_trRow > td.ColLastName`, td => td.innerText) 
    let clientOwnerAtPurchaseDate = await eventsDetailWindow.$eval(`#ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_rptList_ctl${i}_trRow > td.ColClientOwningSubAccountGID`, td => td.innerText)
    let eventName = await eventsDetailWindow.$eval(`#ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_rptList_ctl${i}_trRow > td.ColEventName`, td => td.innerText)
    let eventCommences = await eventsDetailWindow.$eval(`#ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_rptList_ctl${i}_trRow > td.ColCommences`, td => td.innerText)
    let eventOwner = await eventsDetailWindow.$eval(`#ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_rptList_ctl${i}_trRow > td.ColEventOwningSubAccountGID`, td => td.innerText)
    let ticketQuantity = await eventsDetailWindow.$eval(`#ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_rptList_ctl${i}_trRow > td.ColTicketQty`, td => td.innerText)
    let bookingStatus = await eventsDetailWindow.$eval(`#ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_rptList_ctl${i}_trRow > td.ColBookingStatusGID`, td => td.innerText)
    const bookingData = {bookingRef, bookedOn, clientFirstName, clientLastName, clientOwnerAtPurchaseDate, eventName,eventCommences,eventOwner,ticketQuantity,bookingStatus}
    // console.log(bookingData)
    bookings.push(bookingData)

    }

    if (found != false) {
      const nextPageButton = await eventsDetailWindow.waitForXPath(`//*[@id="ctl00_Content_ucxEvents_Edit_tabSet_tab1_ucxEventsBookings_List_ctrlPagingBar_btnNextPage"]`);
      await nextPageButton.click();
      await eventsDetailWindow.waitForTimeout(4000);
    
    } else {
    }
}
// console.log('clickOnCloseButton ABOUT TO START')
// await clickOnCloseButton(page)
// console.log(bookings)
return bookings
}


const calcCommissions = (agentCode,bookings) => {
  // const Transactions= ticketPurchases.find(o => o.agentCode === agentCode);
  // console.log(Transactions)
let filteredTrans= ticketPurchases.filter(tix => tix.agentCode === agentCode);
// console.log(filteredTrans, 'transactions only for agent code:',agentCode)
let totalSales = parseFloat(filteredTrans.reduce(function (acc, curr) {
  return acc + curr.ticketquantity * curr.ticketprice;
},0)).toFixed(2)
let totalCommissionPayable = parseFloat(filteredTrans.reduce(function (acc, curr) {
  return acc + curr.commissionpayable
},0)).toFixed(2)
let cashExpectedToBeReceived = parseFloat((totalSales - totalCommissionPayable)).toFixed(2)
let totalTicketsSold = parseInt(filteredTrans.reduce(function (acc, curr) {
  return acc + curr.ticketquantity
},0));
console.log(totalTicketsSold,'TOTAL TICKETS SOLD BY AGENT:', agentCode)
console.log(totalSales,'TOTAL SALES BY AGENT:', agentCode)
console.log(totalCommissionPayable,'TOTAL COMMISSION PAYABLE TO AGENT:', agentCode)
console.log(cashExpectedToBeReceived,'TOTAL CASH TO BE RECEIVED FROM AGENTl', agentCode)

return [totalSales, totalCommissionPayable,cashExpectedToBeReceived, agentCode]
}
async function getTicketTypeDetails(page) {
  console.log('we are getting the ticket types')
  var eventsTicketPurchaseTab = await page.frames()[7]
  let totalRowsOnTable= await getPageNumbers(page)
  console.log(totalRowsOnTable)
  let tableSelector = '.EventBookingsTicketTypes > div:nth-child(1) > table:nth-child(3) > tbody:nth-child(2)'
  for (let i = 1; i <= totalRowsOnTable; i++) {
    console.log(i)
    const id = nanoid()
    const ticketType = await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(1)`))
    const ticketDepositAmount = parseFloat(await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(2)`))).toFixed(2)
    const ticketDepositDueBy = await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(3)`))
    const ticketPrice = parseFloat(await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(4)`))).toFixed(2)
    const ticketBalanceAmount = parseFloat(ticketPrice - ticketDepositAmount).toFixed(2)
    const ticketBalanceDueBy = await eventsTicketPurchaseTab.evaluate(el => el.innerText, await eventsTicketPurchaseTab.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(5)`))
    const actualTicketTypeItem = {id, ticketType, ticketDepositAmount, ticketDepositDueBy,ticketPrice,ticketBalanceAmount,ticketBalanceDueBy}
    // console.log(id, ticketType, ticketDepositAmount, ticketDepositDueBy,ticketPrice,ticketBalanceAmount,ticketBalanceDueBy)
    // console.log(actualTicketTypeItem)
    EventTicketTypes.push(actualTicketTypeItem)
  }
  }
  const getEventSummaryDataForOneEventOnly = async (page) => {
  console.log('STARTING TO COLLECT THE EVENT METADATA')
  var eventsWindow = await page.frames()[5]
  const eventName = await eventsWindow.$$eval('#ctl00_Content_ucxList_updDataListTable > div.row.control-set > div.row > div > table > tbody td.ColEventName', tds => tds.map((td) => td.innerText.trim())).then(e => e.toString())
  const eventOwner = await eventsWindow.$$eval('#ctl00_Content_ucxList_updDataListTable > div.row.control-set > div.row > div > table > tbody td.ColOwningSubAccount', tds => tds.map((td) => td.innerText.trim())).then(e => e.toString())
  const eventRef= await eventsWindow.$$eval('#ctl00_Content_ucxList_updDataListTable > div.row.control-set > div.row > div > table > tbody td.ColUserReference', tds => tds.map((td) => td.innerText.trim())).then(e => e.toString())
  const eventCommencesDateTime = await eventsWindow.$$eval('#ctl00_Content_ucxList_updDataListTable > div.row.control-set > div.row > div > table > tbody td.ColCommences', tds => tds.map((td) => td.innerText.trim())).then(e => e.toString())
  const eventStatus = await eventsWindow.$$eval('#ctl00_Content_ucxList_updDataListTable > div.row.control-set > div.row > div > table > tbody td.ColEventStatusID', tds => tds.map((td) => td.innerText.trim())).then(e => e.toString())
  const eventCurrentAvailableQuantity = await eventsWindow.$$eval('#ctl00_Content_ucxList_updDataListTable > div.row.control-set > div.row > div > table > tbody td.ColCurrentAvailableQuantity', tds => tds.map((td) => td.innerText.trim())).then(e => e.toString())
  const eventSoldTickets = await eventsWindow.$$eval('#ctl00_Content_ucxList_updDataListTable > div.row.control-set > div.row > div > table > tbody td.ColCurrentSoldQuantity', tds => tds.map((td) => td.innerText.trim())).then(e => e.toString())
  const eventLastUpdatedDateTime = await eventsWindow.$$eval('#ctl00_Content_ucxList_updDataListTable > div.row.control-set > div.row > div > table > tbody td.ColLastUpdatedDate', tds => tds.map((td) => td.innerText.trim())).then(e => e.toString())
  console.log(eventName, eventOwner, eventRef, eventCommencesDateTime, eventStatus, eventCurrentAvailableQuantity,eventSoldTickets,eventLastUpdatedDateTime)
  return eventName, eventOwner, eventRef, eventCommencesDateTime, eventStatus, eventCurrentAvailableQuantity,eventSoldTickets,eventLastUpdatedDateTime
  }

   const closeTheBrowser = async (browser) => {
    await browser.close();
  }


const enterEventRef = async (page, eventRef) => {
  var eventsWindow = await page.frames()[5]
  await eventsWindow.type('input[id="ctl00_Content_ucxList_txtSearchByTextSearchByEventExRef"]', eventRef, {delay: 20})
  await page.keyboard.press('Enter')
  await eventsWindow.waitForTimeout(3000);
  
}

const clickOnCommencesFrom = async (page) => {
  var eventsWindow = await page.frames()[5]
  const commencesFromInput = await eventsWindow.waitForXPath(`//*[@id="ctl00_Content_ucxList_txtFilterBy_SearchByCommenceDate_From"]`);
  await commencesFromInput.click();
}

const clickOnFinishesTo = async (page) => {
  var eventsWindow = await page.frames()[5]
  const commencesFromInput = await eventsWindow.waitForXPath(`//*[@id="ctl00_Content_ucxList_txtFilterBy_SearchByCommenceDate_To"]`);
  await commencesFromInput.click();
}

// program to count down numbers to 1
async function getAllTransactionsFromPage(page, NumTicketPurchasesRows, bookings) {

  //  do something
  await getTransactionsDetails(page,NumTicketPurchasesRows, bookings)
  // console.log(bookings,'THIS IS THE GETALLTRANSACTIONSFROMPAGE')
  // decrease the numTransOnPage after iteration
  const newTransOnPage = NumTicketPurchasesRows - 1;

  // base case
  if (newTransOnPage > 0) {
    await getAllTransactionsFromPage(page, newTransOnPage, bookings);
  }
}

const getEventSetupData = async (page) => {
        console.log('WE ARE INSIDE THE GETEVENTSSETUPDATA')
        const eventsDetailWindow = await page.frames()[6]
        await eventsDetailWindow.waitForTimeout(10000);

        const getEventType  = await eventsDetailWindow.evaluate(()=> {
          var eventTypeSelected = document.querySelectorAll('#ctl00_Content_ucxEvents_Edit_tabSet_tab0_ddlEventTypeID')[0].selectedOptions[0].innerText
          return eventTypeSelected;
        });

        const getCommencesTime = await eventsDetailWindow.evaluate(() => {
        let el = document.querySelector("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtCommences_Time")
                return el ? el.getAttribute("value") : "00:00"
              })
        const getFinishesTime = await eventsDetailWindow.evaluate(() => {
          console.log('GET COMMENCES TIME')
          let el = document.querySelector("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtFinishes_Time")
          return el ? el.getAttribute("value") : "00:00"
        })
        const getEventStatus  = await eventsDetailWindow.evaluate(()=> {
          var eventStatusSelected = document.querySelectorAll('#ctl00_Content_ucxEvents_Edit_tabSet_tab0_ddlEventStatusID')[0].selectedOptions[0].innerText
          return eventStatusSelected;
        });
        const getEventOwner  = await eventsDetailWindow.evaluate(()=> {
          var eventOwnerSelected = document.querySelectorAll('#ctl00_Content_ucxEvents_Edit_tabSet_tab0_ddlOwningSubAccount')[0].selectedOptions[0].innerText
          return eventOwnerSelected;
        });

        const getEventRef = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtUserReference", (input) => {
        return input.getAttribute("value")
        })
        const getEventName = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtEventName", (input) => input.getAttribute("value"));
        const getCommencesDate = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtCommences_Date", (input) => input.getAttribute("value"));
        const getFinishesDate = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtFinishes_Date", (input) => input.getAttribute("value"))
        const getEventAddress1 = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtAddressLine1", (input) => input.getAttribute("value"))
        const getEventAddress2 = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtAddressLine2", (input) => input.getAttribute("value"))
        const getEventAddress3 = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtAddressLine3", (input) => input.getAttribute("value"))
        const getEventTown = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtTown", (input)  => input.getAttribute("value"))
        const getEventCounty = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtCounty", (input) => input.getAttribute("value"))
        const getEventCountry = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtCountry", (input) => input.getAttribute("value"))
        const getEventPostCode = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtPostalCode", (input) => input.getAttribute("value"))
        const getEventMaxQuantity = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtMaximumAvailableQuantity", (input) => input.getAttribute("value"))
        const getEventCurrentAvailableQuantity = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtCurrentAvailableQuantity", (input) => input.getAttribute("value"))
        const getEventCurrentSoldQuantity = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtCurrentSoldQuantity", (input) => input.getAttribute("value"))
        const getEventLastUpdatedDate = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtLastUpdatedDate_Date", (input) => input.getAttribute("value"))
        const getEventLastUpdatedTime = await eventsDetailWindow.$eval("#ctl00_Content_ucxEvents_Edit_tabSet_tab0_txtLastUpdatedDate_Time", (input) => input.getAttribute("value"))
        const getEventCancellationPolicy  = await eventsDetailWindow.evaluate(()=> {
          var eventCancellationPolicySelected= document.querySelectorAll(' #ctl00_Content_ucxEvents_Edit_tabSet_tab0_ddlCancellationPolicy')[0].selectedOptions[0].innerText
          return eventCancellationPolicySelected;
        });
        //Wait for result and log it outside of the evaluate function
        const eventType = await getEventType;
        const eventRef = await getEventRef;
        const eventName = await getEventName;
        const eventCommencesDate = await getCommencesDate;
        const eventCommencesTime = await getCommencesTime;
        const eventFinishesDate = await getFinishesDate;
        const eventFinishesTime = await getFinishesTime;
        const eventStatus = await getEventStatus;
        const eventOwner = await getEventOwner;
        const eventAddress1 = await getEventAddress1
        const eventAddress2= await getEventAddress2
        const eventAddress3= await getEventAddress3
        const eventTown= await getEventTown
        const eventCounty= await getEventCounty
        const eventCountry= await getEventCountry
        const eventPostCode= await getEventPostCode;
        const eventMaxQuantity= await getEventMaxQuantity
        const eventCurrentAvailQuantity = await getEventCurrentAvailableQuantity
        const eventCurrentSold = await getEventCurrentSoldQuantity
        const eventLastUpdatedDate = await getEventLastUpdatedDate
        const eventLastUpdatedTime = await getEventLastUpdatedTime
        const eventCancelledPolicy = await getEventCancellationPolicy

        const eventData = {eventType,eventRef,eventName,eventCommencesDate,eventCommencesTime,eventFinishesDate,eventFinishesTime,eventStatus,eventOwner,eventAddress1,eventAddress2,eventAddress3, eventTown, eventCounty, eventCountry, eventPostCode, eventMaxQuantity,eventCurrentAvailQuantity,eventCurrentSold,eventLastUpdatedDate,eventLastUpdatedTime,eventCancelledPolicy}
        // console.log(eventData)
        return eventData
}

let loopAllTicketPurchasePages = async (stillToProcess,NumTicketPurchasesRows,totalTicketsSold,txnSeenSoFar, page, bookings) => {
  console.log('loopAllTicketPurchasePages just started')
  //base case
  // console.log(stillToProcess,NumTicketPurchasesRows,totalTicketsSold,txnSeenSoFar, bookings,'console logging from the recursive algo')
  if (stillToProcess === 0) {
      return;
  }
  await clickNextPage(page)
  let [stillToProcess1,NumTicketPurchasesRows1,totalTicketsSold1,txnSeenSoFar1]=await getTransactionNumbers(page)
  await getAllTransactionsFromPage(page, NumTicketPurchasesRows1, bookings)
  // console.log(stillToProcess,NumTicketPurchasesRows,totalTicketsSold,txnSeenSoFar, bookings,'FROM INSIDE THE BIG LOOP!');
  return loopAllTicketPurchasePages(stillToProcess1,NumTicketPurchasesRows1,totalTicketsSold1,txnSeenSoFar1, page, bookings);
};


//"id":"7pKBQdn0b7y-ov_rTcMtI","bookingRef":"EM0200483","bookedOn":"24/10/2021 08:37","client":"David Cowper","ticketoption":"Member Party Only","ticketquantity":1,"ticketprice":45.5,"totaldue":100,"totaldueCalc":45.5,"totalpaid":100,"balancedue":0,"commissionRatePercent":5,"commissionpayable":5,"agentCode":"Spice East Midlands","clientOwnerAtPurchaseDate":"Spice East Midlands","bookingStatus":"Booked","eventName":"Spice East Midlands Christmas Dinner Dance","eventOwner":"Spice East Midlands","eventCommences":"18/12/2021 18:30"}
const enrichTheTicketData = async (AdjustmentsListing, ticketPurchases, eventData) => {
  console.log(eventData,'IM THE EVENT DATA')
  let enrichedTicketsArray = []
  const myCopyAdjustmentsListing= AdjustmentsListing.slice()
  console.log('ENRICHMENT OF TICKET PURCHASES WITH THE DISCOUNT CALCULATED LATER')
  const myCopyticketPurchases = ticketPurchases.slice()
  for (let ticket of myCopyticketPurchases) {
    console.log(ticket, 'THIS IS THE TICKET INFORMATION FOR EDITING WITH THE DISCOUNT PER POUND OF SALES')
    let bookingRef = ticket.bookingRef
    console.log(bookingRef)
   const discountRate = await getDiscountsForInvoice(AdjustmentsListing,bookingRef)
   console.log(discountRate, 'THIS IS MY DATA!   THIS IS WHERE THE DISCOUNT IS COMING FROM TO APPLY TO THE TICKET PURCHASES!')
   const newEnrichedTicket = {...ticket, discountRate, discountTotal: parseFloat(ticket.totaldueCalc * discountRate).toFixed(2), discountedTotalDue: parseFloat((ticket.totaldueCalc * discountRate)+ticket.totaldueCalc).toFixed(2)}
   const discountedTotalDueForTicket = Number(newEnrichedTicket.discountedTotalDue)
   const commissionRatePercent = Number(newEnrichedTicket.commissionRatePercent)
   console.log(discountedTotalDueForTicket,commissionRatePercent,'THIS IS THE COMMISSION DUE FOR THE TICKET AFTER THE DISCOUNT')
   const totalComm = Number(discountedTotalDueForTicket * commissionRatePercent / 100)
   console.log(totalComm)
   const newnewEnrichedTicket = {...newEnrichedTicket, commissionpayable: parseFloat(totalComm).toFixed(2), eventRef: eventData.eventRef, eventType: eventData.eventType}
   enrichedTicketsArray.push(newnewEnrichedTicket)
  }
  console.log(enrichedTicketsArray, 'THIS IS THE NEW ENRICHED TICKETS')
    // stringify JSON Object
    var jsonContent3 = JSON.stringify(enrichedTicketsArray);
    // console.log(jsonContent);
     
    fs.writeFile("enrichedticketsoutput.json", jsonContent3, 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
     
        console.log("JSON file has been saved - THE ENRICHED TICKETS HAVE BEEN SAVED READY TO RECOMPUTE THE COMMISSION INVOICES.");
    });
return enrichedTicketsArray
}



(async()=>{
  const myEvents= ['EM0031514','EM0031502','EM0031513','EM0031453','EM0031540','EM0031256','EM0031520','EM0031528','EM0031475','EM0031548','EM0031529','EM0030874','EM0031507','EM0031543','EM0031544','EM0031545','EM0031553','EM0031554','EM0031547','EM0031546','EM0031539','EM0031555','EM0031413','EM0031393','EM0031559','EM0031494','EM0031469','EM0031524','EM0031569','EM0031417','EM0031207','EM0031533','EM0031572','EM0031465','EM0031535','EM0031581','EM0031457','EM0031495','EM0031550','EM0031526','EM0031585','EM0031503','EM0031560','EM0031589','EM0031551','EM0031530','EM0031511','EM0031568','EM0031593','EM0031534','EM0031423','EM0031574','EM0031563','EM0031594','EM0031556','EM0031587','EM0031575','EM0031542','EM0031536','EM0031608','EM0031611','EM0031610','EM0031549','EM0031566','EM0031590','EM0031580','EM0031576','EM0031582','EM0031410','EM0031492','EM0031613','EM0031552','EM0031595','EM0031415','EM0031614','EM0031609','EM0031616','EM0031370','EM0031527','EM0031493','EM0031619','EM0031412','EM0031491','EM0031604','EM0031579','EM0031622','WM030241','SH0000212','SH0000213','SH0000144','SH0000145','SH0000269','SH0000272','SH0000254','SH0000252','SH0000267','SH0000268','SH0000255','SH0000271','SH0000266','SH0000257']
  let eventsprocessedjson = fs.readFileSync("eventsprocessed.json","utf-8");
      console.log(eventsprocessedjson)
      let events = JSON.parse(eventsprocessedjson);
  let difference = myEvents.filter(x => !events.includes(x));
  console.log(difference)
  var arrayLength = difference.length;
  console.log(myEvents)
  for (var i = 0; i < arrayLength; i++) {
      console.log(difference[i]);
      const query = difference[i]

      (async () => {
        const profile = JSON.parse(fs.readFileSync("./settings.json"));    
        await Promise.all(profile.map(({email}) => botRun(email)));
      })();
      await StartApp(query)
      events.push(difference[i]);
      eventsprocessedjson = JSON.stringify(events);
      fs.writeFileSync("eventsprocessed.json",eventsprocessedjson,"utf-8");
      eventsprocessedjson = fs.readFileSync("eventsprocessed.json","utf-8");
      console.log(eventsprocessedjson)
  }
  
 
 
 })()
 process.on('unhandledRejection', (err, promise) => {
  
(async()=>{
  const myEvents= ['EM0031514','EM0031502','EM0031513','EM0031453','EM0031540','EM0031256','EM0031520','EM0031528','EM0031475','EM0031548','EM0031529','EM0030874','EM0031507','EM0031543','EM0031544','EM0031545','EM0031553','EM0031554','EM0031547','EM0031546','EM0031539','EM0031555','EM0031413','EM0031393','EM0031559','EM0031494','EM0031469','EM0031524','EM0031569','EM0031417','EM0031207','EM0031533','EM0031572','EM0031465','EM0031535','EM0031581','EM0031457','EM0031495','EM0031550','EM0031526','EM0031585','EM0031503','EM0031560','EM0031589','EM0031551','EM0031530','EM0031511','EM0031568','EM0031593','EM0031534','EM0031423','EM0031574','EM0031563','EM0031594','EM0031556','EM0031587','EM0031575','EM0031542','EM0031536','EM0031608','EM0031611','EM0031610','EM0031549','EM0031566','EM0031590','EM0031580','EM0031576','EM0031582','EM0031492','EM0031613','EM0031552','EM0031595','EM0031415','EM0031614','EM0031609','EM0031616','EM0031370','EM0031527','EM0031493','EM0031619','EM0031412','EM0031491','EM0031604','EM0031579','EM0031622','WM030241','SH0000212','SH0000213','SH0000144','SH0000145','SH0000269','SH0000272','SH0000254','SH0000252','SH0000267','SH0000268','SH0000255','SH0000271','SH0000266','SH0000257']
  let eventsprocessedjson = fs.readFileSync("eventsprocessed.json","utf-8");
      console.log(eventsprocessedjson)
      let events = JSON.parse(eventsprocessedjson);
  let difference = myEvents.filter(x => !events.includes(x));
  console.log(difference)
  var arrayLength = difference.length;
  console.log(myEvents)
  for (var i = 0; i < arrayLength; i++) {
      console.log(difference[i]);
      const query = difference[i]
      await StartApp(query)
      events.push(difference[i]);
      eventsprocessedjson = JSON.stringify(events);
      fs.writeFileSync("eventsprocessed.json",eventsprocessedjson,"utf-8");
      eventsprocessedjson = fs.readFileSync("eventsprocessed.json","utf-8");
      console.log(eventsprocessedjson)
  }
  
 
 
 })()


});




 module.exports = {
   StartApp
 }
