//imports
const axios = require("axios");
const cheerio = require("cheerio");
const app = require('express')();
const NodeCache = require("node-cache");
const cron = require("node-cron");
const cache = new NodeCache( { useClones: false, maxKeys: 4, deleteOnExpire: true } );

//settings
const port = 3000
const version = "2.5.0"

//cache flusher
cron.schedule('0 0 * * *', () => {
    log(`flushed cache with ` + cache.getStats().keys + `keys`);
    cache.flushAll();
}, {
    scheduled: true,
    timezone: "Europe/Berlin"
});


//router for fallzahlen
app.get('/v1/hofland/corona', (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    fetchCounts()
        .then(count => {
            res.send(count);
        })
        .catch(error => {
            log("MODE 1 | " + error)
            res.send(JSON.stringify({ success: false, version: version, mode: 1 }));
        });

})

//router for impfzahlen
app.get('/v1/hofland/corona/vaccination', (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    fetchVacc()
        .then(count => {
            res.send(count);
        })
        .catch(error => {
            log("MODE 2 | " + error)
            res.send(JSON.stringify({ success: false, version: version, mode: 2 }));
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
            log("MODE 3 | " + error)
            res.send(JSON.stringify({ success: false, version: version, mode: 3 }));
        });

})

//router for all
app.get('/v1/hofland/corona/all', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const cachevar = cache.get("all");

    if(isUndefined(cachevar)){
        let data = [];

        fetchCounts()
            .then(count => {
                data[0] = count;
                delete data[0].timestamp;
                data[0].name = "count";
                sendAll(res, data, cache)
            })

        fetchVacc()
            .then(count => {
                delete count.timestamp;
                count.name = "vaccination"
                data[1] = count;
                sendAll(res, data, cache)
            })

        fetchHospital()
            .then(count => {
                delete count.timestamp;
                count.name = "hospital"
                data[2] = count
                sendAll(res, data, cache)
            })

    }else {
        res.send(cachevar);
    }
})

app.listen(port, () => {
    log(`HoferLand Corona API (v${version}) by Luca Hess on port ${port}`)
})


const fetchCounts = async () => {
    const cachevar = cache.get("cases");

    if(isUndefined(cachevar)){
        try {
            const response = await axios.get('https://www.landkreis-hof.de/coronavirus-wir-informieren/');
            const $ = cheerio.load(response.data);

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
            const callback = Object.freeze({
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
            })

            cache.set("cases", callback);
            return callback;
        } catch (error) {
            throw error;
        }
    }else {
        return cachevar;
    }


};

const fetchVacc = async () => {
    const cachevar = cache.get("vaccination");

    if(isUndefined(cachevar)){
        try {
            const response = await axios.get('https://www.landkreis-hof.de/coronavirus-wir-informieren/');
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
            const callback = Object.freeze({
                success: true,
                version: version,
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
            })


            cache.set("vaccination", callback);
            return callback
        } catch (error) {
            throw error;
        }
    }else {
        return cachevar;
    }


   };

const fetchHospital = async () => {
    const cachevar = cache.get("hospital");

    if(isUndefined(cachevar)){
        try {
            const response = await axios.get('https://www.landkreis-hof.de/coronavirus-wir-informieren/');
            const $ = cheerio.load(response.data);

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
            const callback = Object.freeze({
                success: true,
                version: version,
                data: {
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
                },
                timestamp: new Date().toISOString()
            })

            cache.set("hospital", callback)
            return callback
        } catch (error) {
            throw error;
        }
    }else {
        return cachevar;
    }
};

let update = 0
function sendAll(res, data, cache){
    update++;
    if(update === 3){
        const callback = {
            data: data,
            timestamp: new Date().toISOString()
        }
        cache.set("all", callback)
        res.send(callback);
    }
}

function log(msg){
    const date = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
    console.log("[Corona-API (" + date + ")] " + msg)
}

function isUndefined(obj){
    return typeof obj == "undefined";
}