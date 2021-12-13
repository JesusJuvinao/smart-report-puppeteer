/* eslint-disable no-param-reassign */
const express = require('express')
const app = express()
const puppeteer = require('puppeteer')

// const iPhone = puppeteer.devices['iPhone 6']
const fs = require('fs')
// console.log(iPhone)
async function doWebScraping() {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--start-maximized',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    })
    const page = await browser.newPage()
    const context = await browser.createIncognitoBrowserContext()
    // get dimentions
    const dimensions = await page.evaluate(() => {
        return {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
            deviceScaleFactor: window.devicePixelRatio
        }
    })
    // Create a new page in a pristine context.
    await context.newPage()
    // Do stuff
    await page.setDefaultNavigationTimeout(0)
    await page.setViewport({ width: 1480, height: 800 })
    // await page.goto('https://www.pts.cloud/', { waitUntil: 'networkidle2' })
    await page.goto('https://www.pts.cloud/', { waitUntil: 'networkidle2' })
    await page.waitForSelector('.login-page')
    await page.waitForSelector('#Username')
    await page.waitForSelector('#Password')
    await page.type('#Username', 'stuart.wilson@smartaccountingonline.com')
    // const videos = await page.$$('https://www.pts.cloud/client/ClientSearchView')
    await page.type('#Password', 'Spice1441$')
    await page.screenshot({ path: 'buddy-screenshot.png' })
    // espera por 5 SEGUNDOS
    // await page.waitFor(5000) --------
    await page.click('#loginBtn')
    // await page.waitFor(5000) --------
    // await page.keyboard.press('Enter')
    // ESPERA PORO LA CARGA DE LA PAGINA
    // const videos = await page.$$('ytd-thumbnail.ytd-video-renderer')
    await page.waitForSelector('.activeClass')
    await page.click('.activeClass')
    await page.waitForSelector('.custom_class')
    await page.click('.custom_class li > a ')
    await page.waitForSelector('#PaymentStatusId')
    await page.waitFor(2000)
    // await page.click('#PaymentStatusId')
    // const selectElem = await page.$('select[name="PaymentStatusId"]');
    // await selectElem.type('alue 2');
    await page.select('select#PaymentStatusId', '1')
    await page.click('#btnSearchClient')
    await page.waitFor(2000)
    // await page.keyboard.press('ArrowDown');
    // await page.click('#value')
    // await page.waitForSelector('.travel-search-client .heading')
    const end = Date.now() + 120000
    while (Date.now() < end) {
        console.log('START')
    }
    console.log('END')
    // DOBLE EVENTO
    // await videos[2].click()
    // Get the link to all the required books
    // const urls = await page.$$eval('section ol > li', links => {
    //     // Make sure the book to be scraped is in stock
    //     links = links.filter(
    //         link => link.querySelector('.instock.availability > i').textContent !==
    //             'In stock'
    //     )
    //     // Extract the links from the data
    //     links = links.map(el => el.querySelector('h3 > a').href)
    //     return links
    // })
    // Loop through each of those links, open a new page instance and get the relevant data from them
    // const pagePromise = link => new Promise(async (resolve, reject) => {
    //     const dataObj = {}
    //     const newPage = await browser.newPage()
    //     await newPage.goto(link)
    //     dataObj['bookTitle'] = await newPage.$eval(
    //         '.product_main > h1',
    //         text => text.textContent
    //     )
    //     dataObj['bookPrice'] = await newPage.$eval(
    //         '.price_color',
    //         text => text.textContent
    //     )
    //     dataObj['noAvailable'] = await newPage.$eval(
    //         '.instock.availability',
    //         text => {
    //             // Strip new line and tab spaces
    //             text = text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, '')
    //             // Get the number of stock available
    //             const regexp = /^.*\((.*)\).*$/i
    //             const stockAvailable = regexp.exec(text)[1].split(' ')[0]
    //             return stockAvailable
    //         }
    //     )
    //     dataObj['imageUrl'] = await newPage.$eval(
    //         '#product_gallery img',
    //         img => img.src
    //     )
    //     dataObj['bookDescription'] = await newPage.$eval(
    //         '#product_description',
    //         div => div.nextSibling.nextSibling.textContent
    //     )
    //     dataObj['upc'] = await newPage.$eval(
    //         '.table.table-striped > tbody > tr > td',
    //         table => table.textContent
    //     )
    //     resolve(dataObj)
    //     await newPage.close()
    // })
    // for (link in urls) {
    //     const currentPageData = await pagePromise(urls[link])
    //     // scrapedData.push(currentPageData);
    //     console.log(currentPageData)
    // }
    // console.log(urls)
    // await page.emulate(iPhone)

    console.log('Dimensions:', dimensions)
    const html = await page.content()
    fs.writeFile('page.html', html, function (err) {
        if (err) throw err

        console.log('Html Saved')
    })
}
doWebScraping()
    .then(articles => {
        console.log('articles: ', articles)
    })
    .catch(err => {
        console.log(err)
        if (err instanceof puppeteer.errors.TimeoutError) {
            console.log(err, 'error de tiempo de espera')
            // Do something if this is a timeout.
        }
    })
app.get('/', (req, res) => {
    res.send('Server online')
})
app.listen(3000)
console.log('Estas en el puerto 3000')
