//imports
const axios = require("axios");
const cheerio = require("cheerio");
const app = require('express')();
const NodeCache = require("node-cache");
const cron = require("node-cron");
const cache = new NodeCache( { useClones: false, maxKeys: 5, deleteOnExpire: true } );

//settings
const port = 3000
const version = "2.7.1"
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
    res.send(cache.get("vaccination"));
})

//router for hospitalisierung
app.get(uri + '/hospital', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(cache.get("hospital"));
})

//router for all
app.get(uri + '/all', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(cache.get("all"));
})

function parseComparisonText(text){
    return [text.substring(text.length - (text.length - 1), 0), text.substring(1, text.length)]
}


const fetchCounts = async () => {
    const cachevar = cache.get("cases");

    if(isUndefined(cachevar)){

        //Fallzahlen
        const allChildren = $('#execphp-13 > div').children();
        const allText = $(allChildren[0]).text()
        const all = parseInt(allText.substring(2, allText.length - 2));
        const allComparisonText = $(allChildren[2]).text()
        const allComparison = allComparisonText.substring(1, allComparisonText.length - 12)


        const activeText = $('#execphp-14 > div > span:nth-child(1)').text();
        const active = parseInt(activeText.substring(2, activeText.length - 2));


        const healedChildren = $('#execphp-15 > div').children();
        const healedText = $(healedChildren[0]).text()
        const healed = parseInt(healedText.substring(2, healedText.length - 2));
        const healedComparisonText = $(healedChildren[2]).text()
        const healedComparison = healedComparisonText.substring(1, healedComparisonText.length - 12)

        const deadChildren = $('#execphp-16 > div').children();
        const deadText = $(deadChildren[0]).text()
        const dead = parseInt(deadText.substring(2, deadText.length - 2));
        const deadComparisonText = $(deadChildren[2]).text()
        const deadComparison = deadComparisonText.substring(1, deadComparisonText.length - 12)


        //Inzidenzen
        const landkreis = $('#execphp-17 > div > strong').text();
        const stadt = $('#execphp-18 > div > strong').text();

        const callback = (isAll = false) => {
            const returnData = {
                incidence: {
                    district: landkreis,
                    city: stadt
                },
                infections: {
                    current: active,
                    total: {
                        count: all,
                        comparison: parseComparisonText(allComparison)
                    },
                    healthy: {
                        count: healed,
                        comparison: parseComparisonText(healedComparison)
                    },
                    dead: {
                        count: dead,
                        comparison: parseComparisonText(deadComparison)
                    }
                }
            };
            if(!isAll){
                Object.assign(returnData, {success: true})
                Object.assign(returnData, {version: version})
                Object.assign(returnData, {timestamp: new Date().toISOString()})
            }
            return returnData;
        }

        const allCache = cache.get("all");
        allCache[0] = callback(true)
        cache.set("all", allCache)

        cache.set("cases", callback);

        return callback(false);
    }else {
        return cachevar;
    }


};

const fetchVacc = async () => {
    const cachevar = cache.get("vaccination");

    if(isUndefined(cachevar)){
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const firstVaccTxt = $('#execphp-46 > div').text();
        const firstVacc = parseInt(firstVaccTxt.substring(2, firstVaccTxt.length - 2));
        const firstVaccPercent = $('#execphp-47 > div > strong').text().replace(",", ".");


        const secondVaccTxt = $('#execphp-22 > div').text();
        const secondVacc = parseInt(secondVaccTxt.substring(2, secondVaccTxt.length - 2));
        const secondVaccPercent = $('#execphp-30 > div > strong').text().replace(",", ".");


        const thirdVaccTxt = $('#execphp-23 > div').text();
        const thirdVacc = parseInt(thirdVaccTxt.substring(2, thirdVaccTxt.length - 2));
        const thirdVaccPercent = $('#execphp-44 > div > strong').text().replace(",", ".");


        const over5YearPercent = $('#execphp-28 > div > strong').text().replace(",", ".");

        const callback = (isAll = false) => {
            const returnData = {
                image: "https://www.impfung-hoferland.de/impfquote.png",
                quote: {
                    first: firstVaccPercent,
                    second: secondVaccPercent,
                    third: thirdVaccPercent,
                    over_5_years: over5YearPercent
                },
                vaccination: {
                    first: firstVacc,
                    second: secondVacc,
                    third: thirdVacc
                }
            };
            if(!isAll){
                Object.assign(returnData, {success: true})
                Object.assign(returnData, {version: version})
                Object.assign(returnData, {timestamp: new Date().toISOString()})
            }
            return returnData;
        }

        const allCache = cache.get("all");
        allCache[1] = callback(true)
        cache.set("all", allCache)

        cache.set("vaccination", callback);
        return callback(false)
    }else {
        return cachevar;
    }
   };

const fetchHospital = async () => {
    const cachevar = cache.get("hospital");

    if(isUndefined(cachevar)){
        //naila - nailaNormalStationSuspected
        const nnssTxt = $('#execphp-43 > div').text();
        const nnss = parseInt(nnssTxt.substring(2, nnssTxt.length - 2));
        //naila - nailaNormalStationConfirmed
        const nnscTxt = $('#execphp-42 > div').text();
        const nnsc = parseInt(nnscTxt.substring(2, nnscTxt.length - 2));
        //naila - nailaIntensiveCareUnitSuspected
        const nicusTxt = $('#execphp-41 > div').text();
        const nicus = parseInt(nicusTxt.substring(2, nicusTxt.length - 2));
        //naila - nailaIntensiveCareUnitSuspected
        const nicucTxt = $('#execphp-40 > div').text();
        const nicuc = parseInt(nicucTxt.substring(2, nicucTxt.length - 2));


        //muenchberg - muenchbergNormalStationSuspected
        const mnssTxt = $('#execphp-39 > div').text();
        const mnss = parseInt(mnssTxt.substring(2, mnssTxt.length - 2));
        //muenchberg - muenchbergNormalStationConfirmed
        const mnscTxt = $('#execphp-38 > div').text();
        const mnsc = parseInt(mnscTxt.substring(2, mnscTxt.length - 2));
        //muenchberg - muenchbergIntensiveCareUnitSuspected
        const micusTxt = $('#execphp-37 > div').text();
        const micus = parseInt(micusTxt.substring(2, micusTxt.length - 2));
        //muenchberg - muenchbergIntensiveCareUnitSuspected
        const micucTxt = $('#execphp-36 > div').text();
        const micuc = parseInt(micucTxt.substring(2, micucTxt.length - 2));

        //hof - hofNormalStationSuspected
        const hnssTxt = $('#execphp-35 > div').text();
        const hnss = parseInt(hnssTxt.substring(2, hnssTxt.length - 2));
        //hof - hofNormalStationConfirmed
        const hnscTxt = $('#execphp-34 > div').text();
        const hnsc = parseInt(hnscTxt.substring(2, hnscTxt.length - 2));
        //hof - hofIntensiveCareUnitSuspected
        const hicusTxt = $('#execphp-33 > div').text();
        const hicus = parseInt(hicusTxt.substring(2, hicusTxt.length - 2));
        //hof - hofIntensiveCareUnitSuspected
        const hicucTxt = $('#execphp-32 > div').text();
        const hicuc = parseInt(hicucTxt.substring(2, hicucTxt.length - 2));

        const callback = (isAll = false) => {
            const returnData = {
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
                }
            };
            if(!isAll){
                Object.assign(returnData, {success: true})
                Object.assign(returnData, {version: version})
                Object.assign(returnData, {timestamp: new Date().toISOString()})
            }
            return returnData;
        }

        const allCache = cache.get("all");
        allCache[2] = callback(true)
        cache.set("all", allCache)

        cache.set("hospital", callback)
        return callback(false);
    }else {
        return cachevar;
    }
};

async function getData() {
    log("getting data from " + url)

    const response = await axios.get(url);
    $ = cheerio.load(response.data);

    log("loaded data and processing it...")

    cache.set("all", []);

    fetchCounts()
        .then(count => {
            //save to cache for function
            cache.set("cases", count);
            log("loaded case data and saved it to cache")

            countToFinish()
        })

    fetchVacc()
        .then(count => {
            //save to cache for function
            cache.set("vaccination", count);
            log("loaded vaccination data and saved it to cache")

            countToFinish()
        })

    fetchHospital()
        .then(count => {
            //save to cache for function
            cache.set("hospital", count);
            log("loaded hospital data and saved it to cache")

            countToFinish()
        })

    let count = 0;
    function countToFinish(){
        count++;
        if(count === 3){
            count = 0;
            log("loaded all data and saved it, api now usable")
        }
    }
}

function log(msg){
    const date = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
    console.log("[Corona-API (" + date + ")] " + msg)
}

function isUndefined(obj){
    return typeof obj == "undefined";
}