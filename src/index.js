import express from 'express'
import puppeteer from 'puppeteer'
import ModelGolf from './lib/models/golfModel'
require('./lib/db')
const push = async () => {
    const newGof = new ModelGolf({ cStatus: true })
    return newGof
}
push()
const app = express()
// const iPhone = puppeteer.devices['iPhone 6']
const fs = require('fs')
// console.log(iPhone)
async function doWebScraping() {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--start-maximized',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--allow-external-pages',
            '--allow-third-party-modules',
            '--data-reduction-proxy-http-proxies',
            '--no-sandbox'
        ]
    })
    const page = await browser.newPage()
    // get dimentions
    const dimensions = await page.evaluate(() => {
        return {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
            deviceScaleFactor: window.devicePixelRatio
        }
    })
    // Create a new page in a pristine context.
    // Do stuff
    await page.evaluate(() => window.scrollBy(0, 1000))
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
    await page.select('select#PaymentStatusId', '1')
    await page.click('#btnSearchClient')
    // const end = Date.now() + 50000
    await page.screenshot({ path: 'example.png' })
    await page.waitForTimeout(30000);
    // const link = await page.evaluate(() => Array.from(document.querySelectorAll('.travel-search-client .table tr td > a'), element => element.href));
    // console.log(link)
    // await page.waitForSelector('.travel-search-client .table tr td a')
    // DOBLE EVENTO
    // await videos[2].click()
    // const link = await page.evaluate(() => Array.from(document.querySelectorAll('.travel-search-client .table tr td > a'), element => element.href));
    // console.log(link)
    // for (let i = 0, total_urls = link.length; i < total_urls; i++) {
    //     await page.goto(link[i])
    //     // Get the data ...
    // }
    // const itemsList = await page.$('.travel-search-client .table tr') // Using '.$' is the puppeteer equivalent of 'querySelector'
    // const elements = await itemsList.$$('td > a') // Using '.$$' is the puppeteer equivalent of 'querySelectorAll'

    // const data = []
    // elements.forEach(async element => {
    //     // await element.click()
    //     console.log(element)
    // })
    // await page.evaluate(async () => {
    //     await new Promise(function (resolve) {
    //         setTimeout(resolve, 1000)
    //     })
    // })

    const urls = await page.$$eval('.travel-search-client .table tr', links => {
        // Extract the links from the data
        links = links.filter(
            link => link.querySelector('td > a') !== null || undefined || ''
        )
        links = links.map(el => el.querySelector('td > a').href)
        console.log(links, 'LOSLINS')
        const records = []
        return links
    })
    // for (let i = 0; i < links.length; i++) {
    //     console.log('helloooooooo')
    //     records.push({
    //         ref: 'holaa'
    //     })
    //     console.log(records)
    // }
    // await newPage.goto(link)
    // resolve(dataObj)
    // })
    console.log(urls, 'HERE')

    const dataObj = {}
    for (let i = 0, totalUrls = urls.length; i < totalUrls; i++) {
        const newPage = await browser.newPage()
        await newPage.goto(urls[i]);
        dataObj['Client'] = await newPage.$eval('#lblClientRefNo', text => text.textContent);
        console.log(dataObj)
        await newPage.close()
        // Get the data ...
    }

    // // find the link, by going over all links on the page
    // async function findByLink(page, linkString) {
    //     const links = await page.$$('a')
    //     for (let i = 0; i < links.length; i++) {
    //         const valueHandle = await links[i].getProperty('innerText')
    //         const linkText = await valueHandle.jsonValue()
    //         const text = getText(linkText)
    //         if (linkString == text) {
    //             console.log(linkString)
    //             console.log(text)
    //             console.log('Found')
    //             return links[i]
    //         }
    //     }
    //     return null
    // }

    const nextPageButton = await page.waitForXPath(
        '//*[@id="clientDetails"]/div[2]/ul/li[11]'
    )
    console.log(nextPageButton)
    await nextPageButton.click()

    // #tableClientList > tbody > tr:nth-child(100)
    // #clientDetails > div.pager > ul > li:nth-child(11)

    const html = await page.content()
    console.log('Dimensions:', dimensions)
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
