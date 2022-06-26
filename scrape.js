const axios = require('axios')
const cheerio = require('cheerio')
require('dotenv').config()

const accountSid = process.env.TWILIO_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
const myPhoneNumber = process.env.MY_PHONE_NUMBER

const client = require('twilio')(accountSid, authToken)
const wantedProducts = require('./wanted-products')
const currentProduct = { name: '', price: '', url: ''}

// Scrape for all products every 24 hrs
let scrapeInterval = setInterval(() => {
   wantedProducts.forEach(p => {
      scrape(p.url, p.wantedPrice)
   })
}, 1000 * 60 * 60 * 24);


async function scrape(url, wantedPrice) {
   const { data } = await axios.get(url)
   const $ = cheerio.load(data)
   const container = $('div#dp-container')

   currentProduct.name = $(container).find('span#currentProductTitle').text().trim()
   currentProduct.url = url
   currentProduct.price = parseInt($(container).find('.a-price-whole')
      .first()
      .text()
      .replace(/[,.]/g, ''))

   if (currentProduct.price < wantedPrice) {
      client.messages.create({
         body: `The price of ${currentProduct.name} is ${currentProduct.price}$. Purchase it at ${currentProduct.url}!`,
         from: twilioPhoneNumber,
         to: myPhoneNumber,
      }).then(message => {
         console.log(message); 
      }).catch(err => {
         console.error(err);
      })
   }
}
