const https = require("https")
const sendmail = require('sendmail')();

const APPOINTMENT_API = 'www.doctolib.de';
const API_PATH = "/availabilities.json";

function getConf() {
    if(process.env.CONF) {
        console.log(process.env.CONF);
        return JSON.parse(process.env.CONF);
    } else {
        const conf = require('./conf.json');
        return conf;
    }
}

https
  .request(
    {
      hostname: APPOINTMENT_API,
      path: `${API_PATH}?start_date=2021-05-11&visit_motive_ids=2495719&agenda_ids=397800-397776-402408-397766&insurance_sector=public&practice_ids=158431&destroy_temporary=true&limit=4`,
    },
    res => {
      let data = "";

      res.on("data", d => {
        data += d;
      })
      res.on("end", () => {
        /**
         * data: {"availabilities":[],"total":0,"reason":"no_availabilities","message":"Diese Termine stehen zu einem späteren Zeitpunkt wieder für eine Online-Buchung zur Verfügung. ","number_future_vaccinations":79818}
         */
        const parsedData = JSON.parse(data);
        if(parsedData.availabilities) {
            console.log(parsedData.availabilities.length);
            console.log(parsedData.total);
            const conf = getConf();
            sendmail({
                from: conf.email.from,
                to: conf.email.to,
                subject: conf.email.subject,
                html: 'Mail of test sendmail ',
              }, (err, reply) => {
                console.log(err && err.stack);
                console.dir(reply);
            });
        }
      })
    }
  )
  .end();
