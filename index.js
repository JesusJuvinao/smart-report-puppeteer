const express = require('express')
const app = express()
app.get('/', (req, res) => {
    res.send('Server online')
})

const puppeteer = require('puppeteer')
const fs = require('fs');

async function doWebScraping() {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setDefaultNavigationTimeout(0);
    await page.setViewport({ width: 1280, height: 800 })
    await page.goto('https://www.amazon.com.mx', { waitUntil: 'networkidle2' })

    const html = await page.content();
    fs.writeFile('page.html', html, function(err) {
        if (err) throw err;

        console.log('Html Saved');
    });
}

doWebScraping()
    .then(articles => {
        console.log('articles: ', articles);
    })
    .catch(err => console.log(err));

app.listen(3000)
console.log('Estas en el puerto 3000')
