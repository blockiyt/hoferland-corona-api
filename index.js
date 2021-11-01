//imports
const axios = require("axios");
const cheerio = require("cheerio");
const app = require('express')()

//settings
const port = 3000
const version = "2.1.0"

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
app.get('/v1/hofland/corona/vaccination', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    fetchImpfs()
    .then(count => {
        res.send(count);
    })
    .catch(error => {
        res.send(JSON.stringify({ success: false, version: version }));
    });
})

//router for hospitalisierung
app.get('/v1/hofland/corona/hospital', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    fetchHospital()
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

const fetchHospital = async () => {
    try {
        const response = await axios.get('https://www.landkreis-hof.de/coronavirus-wir-informieren/');

        const $ = cheerio.load(response.data);

        //naila - nailaNormalStationSuspected
        const nnssRaw = $('.execphpwidget' ,'#execphp-43');
        const nnssTxt = nnssRaw.text();
        const nnss = nnssTxt.substring(2, nnssTxt.length - 2);
        //naila - nailaNormalStationConfirmed
        const nnscRaw = $('.execphpwidget' ,'#execphp-42');
        const nnscTxt = nnscRaw.text();
        const nnsc = nnscTxt.substring(2, nnscTxt.length - 2);
        //naila - nailaIntensiveCareUnitSuspected
        const nicusRaw = $('.execphpwidget' ,'#execphp-41');
        const nicusTxt = nicusRaw.text();
        const nicus = nicusTxt.substring(2, nicusTxt.length - 2);
        //naila - nailaIntensiveCareUnitSuspected
        const nicucRaw = $('.execphpwidget' ,'#execphp-40');
        const nicucTxt = nicucRaw.text();
        const nicuc = nicucTxt.substring(2, nicucTxt.length - 2);


        //muenchberg - muenchbergNormalStationSuspected
        const mnssRaw = $('.execphpwidget' ,'#execphp-39');
        const mnssTxt = mnssRaw.text();
        const mnss = mnssTxt.substring(2, mnssTxt.length - 2);
        //muenchberg - muenchbergNormalStationConfirmed
        const mnscRaw = $('.execphpwidget' ,'#execphp-38');
        const mnscTxt = mnscRaw.text();
        const mnsc = mnscTxt.substring(2, mnscTxt.length - 2);
        //muenchberg - muenchbergIntensiveCareUnitSuspected
        const micusRaw = $('.execphpwidget' ,'#execphp-37');
        const micusTxt = micusRaw.text();
        const micus = micusTxt.substring(2, micusTxt.length - 2);
        //muenchberg - muenchbergIntensiveCareUnitSuspected
        const micucRaw = $('.execphpwidget' ,'#execphp-36');
        const micucTxt = micucRaw.text();
        const micuc = micucTxt.substring(2, micucTxt.length - 2);

        //hof - hofNormalStationSuspected
        const hnssRaw = $('.execphpwidget' ,'#execphp-35');
        const hnssTxt = hnssRaw.text();
        const hnss = hnssTxt.substring(2, hnssTxt.length - 2);
        //hof - hofNormalStationConfirmed
        const hnscRaw = $('.execphpwidget' ,'#execphp-34');
        const hnscTxt = hnscRaw.text();
        const hnsc = hnscTxt.substring(2, hnscTxt.length - 2);
        //hof - hofIntensiveCareUnitSuspected
        const hicusRaw = $('.execphpwidget' ,'#execphp-33');
        const hicusTxt = hicusRaw.text();
        const hicus = hicusTxt.substring(2, hicusTxt.length - 2);
        //hof - hofIntensiveCareUnitSuspected
        const hicucRaw = $('.execphpwidget' ,'#execphp-32');
        const hicucTxt = hicucRaw.text();
        const hicuc = hicucTxt.substring(2, hicucTxt.length - 2);


        return JSON.stringify({ success: true, version: version, data: { naila: { name: "Klinik Naila", normalStation: { suspected: nnss, confirmed: nnsc}, intenseCareUnitStation:{ suspected: nicus, confirmed: nicuc } }, muenchberg: { name: "Klinik Münchberg", normalStation: { suspected: mnss, confirmed: mnsc}, intenseCareUnitStation:{ name: "Sana Klinikum Hof", suspected: micus, confirmed: micuc } }, hof: { normalStation: { suspected: hnss, confirmed: hnsc}, intenseCareUnitStation:{ suspected: hicus, confirmed: hicuc } },  } ,timestamp: new Date().toISOString() })
    } catch (error) {
        throw error;
    }
};