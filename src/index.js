/* eslint-disable no-param-reassign */
import express from 'express'
import puppeteer from 'puppeteer'
import cron from 'node-cron'
cron.schedule('15 * * * *', () => {
    console.log('hola hola hola')
})
import ModelGolf from './lib/models/golfModel'
require('./lib/db')
const push = async () => {
    const newGof = new ModelGolf({ cStatus: true })
    return newGof
}

// Connection URL
const { MongoClient } = require('mongodb');
const url = 'mongodb+srv://doadmin:3UAzS8db4ci65701@db-mongodb-nyc3-07265-dd6a67db.mongo.ondigitalocean.com/admin?authSource=admin&replicaSet=db-mongodb-nyc3-07265&tls=true&tlsCAFile=ca-certificate.crt';
const client = new MongoClient(url);

push()
const app = express()
// const iPhone = puppeteer.devices['iPhone 6']
const fs = require('fs')
const dbName = 'admin';

// console.log(iPhone)

async function mainDB(DataGolfPts) {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('clientPst');
    const insertResult = await collection.insertMany(DataGolfPts);
    console.log('Inserted documents =>', insertResult);

    return 'done.';
}
const DataGolfPts=[]
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
    await page.evaluate(() => window.scrollBy(0, 1000))
    await page.setDefaultNavigationTimeout(0)
    await page.setViewport({ width: 2080, height: 1000 })
    // await page.goto('https://www.pts.cloud/', { waitUntil: 'networkidle2' })
    await page.goto('https://www.pts.cloud/', { waitUntil: 'networkidle2' })
    await page.waitForSelector('.login-page')
    await page.waitForSelector('#Username')
    await page.waitForSelector('#Password')
    await page.type('#Username', 'stuart.wilson@smartaccountingonline.com')
    // const videos = await page.$$('https://www.pts.cloud/client/ClientSearchView')
    await page.type('#Password', 'Spice1441$')
    await page.screenshot({ path: 'buddy-screenshot.png' })
    await page.click('#loginBtn')
    await page.waitForSelector('.activeClass')
    await page.click('.activeClass')
    await page.waitForSelector('.custom_class')
    await page.click('.custom_class li > a ')
    await page.waitForSelector('#PaymentStatusId')
    await page.waitForTimeout(2000)
    await page.select('select#PaymentStatusId', '1')
    await page.click('#btnSearchClient')
    await page.screenshot({ path: 'example.png' })
    await page.waitForTimeout(50000)
    const movies = await page.evaluate(() => {
        const titlesList = document.querySelectorAll('#clientDetails th')
        const movieArr = []
        for (let i = 0; i < titlesList.length; i++) {
            movieArr[i] = {
                title: titlesList[i].textContent.trim()
            }
        }
        return movieArr
    })
    console.log(movies)
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
    console.log(urls, 'HERE')
    const pagePromise = link => new Promise(async (resolve, reject) => {
        const dataObj = {}
        const newPage = await browser.newPage()
        newPage.waitForNavigation(),
        newPage.goto(link),
        newPage.waitForSelector('#lblClientRefNo')
        const info = await newPage.$eval('#lblClientRefNo', e => e.innerText);
        console.log(info, 'sesuponia')
        await newPage.evaluate(() => {
            const radio = document.querySelector('#lblClientRefNo');
            console.log(radio)
        });
        // const getFinishesDate = await newPage.$eval('.input-wth-place yellow-bg', input => input.getAttribute('value'))
        // DataGolfPts = {
        //     ...getFinishesDate
        // }
        // mainDB(DataGolfPts)
        //     .then(console.log)
        //     .catch(console.error)
        //     .finally(() => client.close());
        console.log(DataGolfPts)
        resolve(dataObj)
        await page.waitForTimeout(7000)
        await newPage.close()
    })
    for (let i = 0, totalUrls = urls.length; i < totalUrls; i++) {
        const currentPageData = await pagePromise(urls[i])
        console.log(currentPageData)
    }
    const nextPageButton = await page.waitForXPath('/html/body/div[5]/div[2]/ul/li[6]/a')
    console.log(nextPageButton, 'PERO QUE PASA CHAVALES')
    await nextPageButton.click()

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
