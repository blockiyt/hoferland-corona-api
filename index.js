//imports
const axios = require("axios");
const cheerio = require("cheerio");
const app = require('express')();
const NodeCache = require("node-cache");
const cron = require("node-cron");
const cache = new NodeCache( { useClones: false, maxKeys: 4, deleteOnExpire: true } );

//settings
const port = 3000
const version = "2.6.2"
const uri = "/v1/hofland/corona"
const url = "https://www.landkreis-hof.de/coronavirus-wir-informieren/"
let $ = null;

//app startup
app.listen(port, () => {
    log("----------")
    log(`HoferLand Corona API (v${version}) by Luca Hess on port ${port}`)
    log("----------")

    //now get data and cache it
    getData()
})

//cache flusher
cron.schedule('0 0 * * *', () => {
    log(`flushed cache with ` + cache.getStats().keys + ` keys`);
    cache.flushAll();

    getData()
}, {
    scheduled: true,
    timezone: "Europe/Berlin"
});


//router for fallzahlen
app.get(uri + "/", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(cache.get("cases"));
})

//router for impfzahlen
app.get(uri + '/vaccination', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(cache.get("cases"));
})

//router for hospitalisierung
app.get(uri + '/hospital', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(cache.get("cases"));
})

//router for all
/*app.get(uri + '/all', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(cache.get("all"));
})*/


const fetchCounts = async () => {
    const cachevar = cache.get("cases");

    if(isUndefined(cachevar)){
        //Fallzahlen
        const activeraw = $('.execphpwidget' ,'#execphp-14').children().first();
        const activetxt = activeraw.text();
        const active = parseInt(activetxt.substring(2, activetxt.length - 2));

        const allraw = $('.execphpwidget' ,'#execphp-13').children().first();
        const alltxt = allraw.text();
        const all = parseInt(alltxt.substring(2, alltxt.length - 2));

        const healedraw = $('.execphpwidget' ,'#execphp-15').children().first();
        const healedtxt = healedraw.text();
        const healed = parseInt(healedtxt.substring(2, healedtxt.length - 2));

        const deadraw = $('.execphpwidget' ,'#execphp-16').children().first();
        const deadtxt = deadraw.text();
        const dead = parseInt(deadtxt.substring(2, deadtxt.length - 2));


        //Inzidenzen
        const falllkraw = $('.execphpwidget > strong' ,'#execphp-17');
        const falllk = falllkraw.text();

        const fallstadtraw = $('.execphpwidget > strong' ,'#execphp-18');
        const fallstadt = fallstadtraw.text();

        //freezing this object so it won't be overwritten
        const callback = {
            success: true,
            version: version,
            incidence: {
                district: falllk,
                city: fallstadt
            },
            infections: {
                current: active,
                total: all,
                healthy: healed,
                dead: dead
            },
            timestamp: new Date().toISOString()
        }

        cache.set("cases", callback);
        return callback;
    }else {
        return cachevar;
    }


};

const fetchVacc = async () => {
    const cachevar = cache.get("vaccination");

    if(isUndefined(cachevar)){
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const firstVaccRaw = $('.execphpwidget' ,'#execphp-46') ;
        const firstVaccTxt = firstVaccRaw.text();
        const firstVacc = parseInt(firstVaccTxt.substring(2, firstVaccTxt.length - 2));

        const firstVaccPercentRaw = $('.execphpwidget > strong' ,'#execphp-47') ;
        const firstVaccPercentTxt = firstVaccPercentRaw.text();
        const firstVaccPercent = firstVaccPercentTxt.replace(",", ".");

        const secondVaccRaw = $('.execphpwidget' ,'#execphp-22') ;
        const secondVaccTxt = secondVaccRaw.text();
        const secondVacc = parseInt(secondVaccTxt.substring(2, secondVaccTxt.length - 2));

        const secondVaccPercentRaw = $('.execphpwidget > strong' ,'#execphp-30') ;
        const secondVaccPercentTxt = secondVaccPercentRaw.text();
        const secondVaccPercent = secondVaccPercentTxt.replace(",", ".");

        const thirdVaccRaw = $('.execphpwidget' ,'#execphp-23') ;
        const thirdVaccTxt = thirdVaccRaw.text();
        const thirdVacc = parseInt(thirdVaccTxt.substring(2, thirdVaccTxt.length - 2));

        const thirdVaccPercentRaw = $('.execphpwidget > strong' ,'#execphp-44') ;
        const thirdVaccPercentTxt = thirdVaccPercentRaw.text();
        const thirdVaccPercent = thirdVaccPercentTxt.replace(",", ".");

        const over5PercentRaw = $('.execphpwidget > strong' ,'#execphp-28') ;
        const over5PercentTxt = over5PercentRaw.text();
        const over5Percent = over5PercentTxt.replace(",", ".");

        //freezing this object so it won't be overwritten
        const callback = {
            success: true,
            version: version,
            image: "https://www.impfung-hoferland.de/impfquote.png",
            quote: {
                first: firstVaccPercent,
                second: secondVaccPercent,
                third: thirdVaccPercent,
                over_5_years: over5Percent
            },
            vaccination: {
                first: firstVacc,
                second: secondVacc,
                third: thirdVacc
            },
            timestamp: new Date().toISOString()
        }


        cache.set("vaccination", callback);
        return callback
    }else {
        return cachevar;
    }


   };

const fetchHospital = async () => {
    const cachevar = cache.get("hospital");

    if(isUndefined(cachevar)){
        //naila - nailaNormalStationSuspected
        const nnssRaw = $('.execphpwidget' ,'#execphp-43');
        const nnssTxt = nnssRaw.text();
        const nnss = parseInt(nnssTxt.substring(2, nnssTxt.length - 2));
        //naila - nailaNormalStationConfirmed
        const nnscRaw = $('.execphpwidget' ,'#execphp-42');
        const nnscTxt = nnscRaw.text();
        const nnsc = parseInt(nnscTxt.substring(2, nnscTxt.length - 2));
        //naila - nailaIntensiveCareUnitSuspected
        const nicusRaw = $('.execphpwidget' ,'#execphp-41');
        const nicusTxt = nicusRaw.text();
        const nicus = parseInt(nicusTxt.substring(2, nicusTxt.length - 2));
        //naila - nailaIntensiveCareUnitSuspected
        const nicucRaw = $('.execphpwidget' ,'#execphp-40');
        const nicucTxt = nicucRaw.text();
        const nicuc = parseInt(nicucTxt.substring(2, nicucTxt.length - 2));


        //muenchberg - muenchbergNormalStationSuspected
        const mnssRaw = $('.execphpwidget' ,'#execphp-39');
        const mnssTxt = mnssRaw.text();
        const mnss = parseInt(mnssTxt.substring(2, mnssTxt.length - 2));
        //muenchberg - muenchbergNormalStationConfirmed
        const mnscRaw = $('.execphpwidget' ,'#execphp-38');
        const mnscTxt = mnscRaw.text();
        const mnsc = parseInt(mnscTxt.substring(2, mnscTxt.length - 2));
        //muenchberg - muenchbergIntensiveCareUnitSuspected
        const micusRaw = $('.execphpwidget' ,'#execphp-37');
        const micusTxt = micusRaw.text();
        const micus = parseInt(micusTxt.substring(2, micusTxt.length - 2));
        //muenchberg - muenchbergIntensiveCareUnitSuspected
        const micucRaw = $('.execphpwidget' ,'#execphp-36');
        const micucTxt = micucRaw.text();
        const micuc = parseInt(micucTxt.substring(2, micucTxt.length - 2));

        //hof - hofNormalStationSuspected
        const hnssRaw = $('.execphpwidget' ,'#execphp-35');
        const hnssTxt = hnssRaw.text();
        const hnss = parseInt(hnssTxt.substring(2, hnssTxt.length - 2));
        //hof - hofNormalStationConfirmed
        const hnscRaw = $('.execphpwidget' ,'#execphp-34');
        const hnscTxt = hnscRaw.text();
        const hnsc = parseInt(hnscTxt.substring(2, hnscTxt.length - 2));
        //hof - hofIntensiveCareUnitSuspected
        const hicusRaw = $('.execphpwidget' ,'#execphp-33');
        const hicusTxt = hicusRaw.text();
        const hicus = parseInt(hicusTxt.substring(2, hicusTxt.length - 2));
        //hof - hofIntensiveCareUnitSuspected
        const hicucRaw = $('.execphpwidget' ,'#execphp-32');
        const hicucTxt = hicucRaw.text();
        const hicuc = parseInt(hicucTxt.substring(2, hicucTxt.length - 2));

        //freezing this object so it won't be overwritten
        const callback = {
            success: true,
            version: version,
            naila: {
                name: "Klinik Naila",
                normalStation: {
                    suspected: nnss,
                    confirmed: nnsc
                },
                intenseCareUnitStation: {
                    suspected: nicus,
                    confirmed: nicuc
                }
            },
            muenchberg: {
                name: "Klinik Münchberg",
                normalStation: {
                    suspected: mnss,
                    confirmed: mnsc
                },
                intenseCareUnitStation: {
                    name: "Sana Klinikum Hof",
                    suspected: micus,
                    confirmed: micuc
                }
            },
            hof: {
                normalStation: {
                    suspected: hnss,
                    confirmed: hnsc
                },
                intenseCareUnitStation: {
                    suspected: hicus,
                    confirmed: hicuc
                }
            },
            timestamp: new Date().toISOString()
        }

        cache.set("hospital", callback)
        return callback;
    }else {
        return cachevar;
    }
};

let setCacheUpdateCount = 0;
function setCache(data, cache){
    setCacheUpdateCount++;
    if(setCacheUpdateCount === 3){
        //reset update count
        setCacheUpdateCount = 0;
        /*data.forEach(res => {
            delete res.success;
            delete res.version;
            delete res.timestamp;
        })
        const callback = {
            success: true,
            version: version,
            timestamp: new Date().toISOString(),
            data: data
        }
        cache.set("all", callback)*/
        log("loaded all data and saved it, api now usable")
    }
}

async function getData() {
    log("getting data from " + url)

    const response = await axios.get(url);
    $ = cheerio.load(response.data);

    log("loaded data and processing it...")

    let loc = [];

    fetchCounts()
        .then(count => {
            //save to cache for function
            cache.set("cases", count);
            log("loaded case data and saved it to cache")

            //caching
            loc[0] = count;

            //save to cache for "all"
            setCache(loc, cache)
        })

    fetchVacc()
        .then(count => {
            //save to cache for function
            cache.set("vaccination", count);
            log("loaded vaccination data and saved it to cache")

            //caching
            loc[1] = count;

            //save to cache for "all"
            setCache(loc, cache)
        })

    fetchHospital()
        .then(count => {
            //save to cache for function
            cache.set("hospital", count);
            log("loaded hospital data and saved it to cache")

            //caching
            loc[2] = count

            //save to cache for "all"
            setCache(loc, cache)
        })
}

function log(msg){
    const date = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
    console.log("[Corona-API (" + date + ")] " + msg)
}

function isUndefined(obj){
    return typeof obj == "undefined";
}