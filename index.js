//imports
const axios = require("axios");
const cheerio = require("cheerio");
const app = require('express')();
const NodeCache = require("node-cache");
const cron = require("node-cron");
const cache = new NodeCache( { useClones: false, maxKeys: 2, deleteOnExpire: true } );

//settings
const port = 3000
const version = "2.2.2"

//cache flusher
cron.schedule('0 0 * * *', () => {
    console.log(`${new Date().toUTCString()} : Flushed cache with ` + cache.getStats().keys + `keys`);
    cache.flushAll();
}, {
    scheduled: true,
    timezone: "Europe/Berlin"
});


//router for fallzahlen
app.get('/v1/hofland/corona', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const tempcachevar = cache.get("cases");

    if(tempcachevar == null){
        fetchCounts()
            .then(count => {
                res.send(count);
                cache.set("cases", count);
            })
            .catch(error => {
                res.send(JSON.stringify({ success: false, version: version }));
            });
    }else {
        res.send(tempcachevar);
    }
})

//router for impfzahlen
app.get('/v1/hofland/corona/vaccination', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const tempcachevar = cache.get("vaccination");

    if(tempcachevar == null){
    fetchImpfs()
        .then(count => {
            res.send(count);
            cache.set("vaccination", count);
        })
        .catch(error => {
            res.send(JSON.stringify({ success: false, version: version }));
        });
    }else {
        res.send(tempcachevar);
    }
})

//router for hospitalisierung
app.get('/v1/hofland/corona/hospital', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const tempcachevar = cache.get("hospital");

    if(tempcachevar != null){
        fetchHospital()
            .then(count => {
                res.send(count);
                cache.set("hospital", count)
            })
            .catch(error => {
                res.send(JSON.stringify({ success: false, version: version }));
            });
    }else {
        res.send(tempcachevar)
    }
})

app.listen(port, () => {
    console.log(`HoferLand Corona API (v${version}) by Luca Heß on port ${port}`)
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

     const callback = {
         success: true,
         version: version,
         incidence: {
             land: falllk,
             stadt: fallstadt
         },
         values: {
             currentInfected: active,
             totalInfected: all,
             healed: healed,
             death: dead
         },
         timestamp: new Date().toISOString()
     }

    //return as JSON
    return JSON.stringify(callback);
 } catch (error) {
  throw error;
 }
};

const fetchImpfs = async () => {
    try {
       const response = await axios.get('https://www.landkreis-hof.de/coronavirus-wir-informieren/');

       const $ = cheerio.load(response.data);

       const firstVaccRaw = $('.execphpwidget' ,'#execphp-46') ;
       const firstVaccTxt = firstVaccRaw.text();
       const firstVacc = firstVaccTxt.substring(2, firstVaccTxt.length - 2);

        const firstVaccPercentRaw = $('.execphpwidget > strong' ,'#execphp-47') ;
        const firstVaccPercentTxt = firstVaccPercentRaw.text();
        const firstVaccPercent = firstVaccPercentTxt.replace(",", ".");

        const secondVaccRaw = $('.execphpwidget' ,'#execphp-22') ;
        const secondVaccTxt = secondVaccRaw.text();
        const secondVacc = secondVaccTxt.substring(2, secondVaccTxt.length - 2);

        const secondVaccPercentRaw = $('.execphpwidget > strong' ,'#execphp-30') ;
        const secondVaccPercentTxt = secondVaccPercentRaw.text();
        const secondVaccPercent = secondVaccPercentTxt.replace(",", ".");

        const thirdVaccRaw = $('.execphpwidget' ,'#execphp-23') ;
        const thirdVaccTxt = thirdVaccRaw.text();
        const thirdVacc = thirdVaccTxt.substring(2, thirdVaccTxt.length - 2);

        const thirdVaccPercentRaw = $('.execphpwidget > strong' ,'#execphp-44') ;
        const thirdVaccPercentTxt = thirdVaccPercentRaw.text();
        const thirdVaccPercent = thirdVaccPercentTxt.replace(",", ".");

        const over5PercentRaw = $('.execphpwidget > strong' ,'#execphp-28') ;
        const over5PercentTxt = over5PercentRaw.text();
        const over5Percent = over5PercentTxt.replace(",", ".");

        const callback = {
            success: true,
            version: version,
            quote: {
                first: firstVaccPercent,
                second: secondVaccPercent,
                third: thirdVaccPercent,
                over_5_years: over5Percent
            },
            values: {
                first: firstVacc,
                second: secondVacc,
                third: thirdVacc
            },
            timestamp: new Date().toISOString()
        }

       return JSON.stringify(callback)
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