//imports
const axios = require("axios");
const cheerio = require("cheerio");
const app = require('express')()

//settings
const port = 3000
const version = "2.0.0"

//router for fallzahlen
app.get('/v1/hofland/corona', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    fetchCounts()
    .then(count => {
        res.send(count);
    })
    .catch(error => {
        res.send(JSON.stringify({ success: false, version: version }));
    });
})

//router for impfzahlen
app.get('/v1/hofland/corona/impfung', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    fetchImpfs()
    .then(count => {
        res.send(count);
    })
    .catch(error => {
        res.send(JSON.stringify({ success: false, version: version }));
    });
})

app.listen(port, () => {
    console.log(`HoferLand Corona API (v${version}) by HLSB auf Port ${port}`)
})


const fetchCounts = async () => {
 try {
     const response = await axios.get('https://www.landkreis-hof.de/coronavirus-wir-informieren/');

     const $ = cheerio.load(response.data);

     //Fallzahlen
     const activeraw = $('.execphpwidget' ,'#execphp-14').children().first();
     const activetxt = activeraw.text();
     const active = activetxt.substring(2, activetxt.length - 2);

     const allraw = $('.execphpwidget' ,'#execphp-13').children().first();
     const alltxt = allraw.text();
     const all = alltxt.substring(2, alltxt.length - 2);

     const healedraw = $('.execphpwidget' ,'#execphp-15').children().first();
     const healedtxt = healedraw.text();
     const healed = healedtxt.substring(2, healedtxt.length - 2);

     const deadraw = $('.execphpwidget' ,'#execphp-16').children().first();
     const deadtxt = deadraw.text();
     const dead = deadtxt.substring(2, deadtxt.length - 2);


     //Inzidenzen
     const falllkraw = $('.execphpwidget > strong' ,'#execphp-17');
     const falllktxt = falllkraw.text();
     const falllk = falllktxt.replace(",", ".");

     const fallstadtraw = $('.execphpwidget > strong' ,'#execphp-18');
     const fallstadttxt = fallstadtraw.text();
     const fallstadt = fallstadttxt.replace(",", ".");

     //return as JSON
    return JSON.stringify({ succes: true, version: version, inzidenz: { land: falllk, stadt: fallstadt }, werte: { currentInfected: active, totalInfected: all, healed: healed, deaths: dead}, timestamp: new Date().toISOString()});
 } catch (error) {
  throw error;
 }
};

const fetchImpfs = async () => {
    try {
       const response = await axios.get('https://www.landkreis-hof.de/coronavirus-wir-informieren/');

       const $ = cheerio.load(response.data);

        //Impfzahlen
        const ImpfZentrumGesamtRaw = $('.execphpwidget' ,'#execphp-22');
        const ImpfZentrumGesamtTxt = ImpfZentrumGesamtRaw.text();
        const impfZentrumGesamt = ImpfZentrumGesamtTxt.substring(2, ImpfZentrumGesamtTxt.length - 2);

        const ImpfZentrumErstRaw = $('.execphpwidget' ,'#execphp-23');
        const ImpfZentrumErstTxt = ImpfZentrumErstRaw.text();
        const impfZentrumErst = ImpfZentrumErstTxt.substring(2, ImpfZentrumErstTxt.length - 2);

        const HausartztGesamtRaw = $('.execphpwidget' ,'#execphp-24');
        const HausartztGesamtTxt = HausartztGesamtRaw.text();
        const hausartztGesamt = HausartztGesamtTxt.substring(2, HausartztGesamtTxt.length - 2);

        const HausartztErstRaw = $('.execphpwidget' ,'#execphp-25');
        const HausartztErstTxt = HausartztErstRaw.text();
        const hausartztErst = HausartztErstTxt.substring(2, HausartztErstTxt.length - 2);

        //Quote
        const QuoteHoferLandRaw = $('.execphpwidget > strong' ,'#execphp-26');
        const QuoteHoferLandTxt = QuoteHoferLandRaw.text();
        const quoteHoferLand = QuoteHoferLandTxt.replace(",", ".");

        const QuoteUeber12Raw = $('.execphpwidget > strong' ,'#execphp-28');
        const QuoteUeber12Txt = QuoteUeber12Raw.text();
        const quoteUeber12 = QuoteUeber12Txt.replace(",", ".");

        const VollRaw = $('.execphpwidget > strong' ,'#execphp-30');
        const VollTxt = VollRaw.text();
        const voll = VollTxt.replace(",", ".");

       return JSON.stringify({ success: true, version: version, impfQuote: { quoteHofLand: quoteHoferLand, quoteUeber12: quoteUeber12, voll: voll}, werte: { impfZentrumErst: impfZentrumErst, impfZentrumGesamt: impfZentrumGesamt, hausartztErst: hausartztErst, hausartztGesamt: hausartztGesamt}, timestamp: new Date().toISOString()})
    } catch (error) {
     throw error;
    }
   };