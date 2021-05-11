const https = require("https")
const sgMail = require('@sendgrid/mail');

const APPOINTMENT_API = 'www.doctolib.de';
const API_PATH = "/availabilities.json";

function getConf() {
    if(process.env.CONF) {
        console.log('reading conf from env');
        console.log(process.env.CONF);
        return JSON.parse(process.env.CONF);
    } else {
        console.log('reading conf from file');
        const conf = require('./conf.json');
        return conf;
    }
}

const conf = getConf();
sgMail.setApiKey(conf.sendgridApiKey);

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
            const nbAvail = parsedData.availabilities.length;
            const nextSlot = parsedData.next_slot;
            console.log(`Number of availabilities: ${nbAvail}`);
            console.log(`Next slot: ${nextSlot}`);

            if(nbAvail > 0) {
                const emailContent = `There are at least ${parsedData.availabilities.length} appointments available. \n Next slot date: ${nextSlot}`;
                sgMail.send({
                    from: conf.email.from,
                    to: conf.email.to,
                    subject: conf.email.subject,
                    html: emailContent,
                    text: emailContent,
                  })
                  .then((response) => {
                    console.log(response[0].statusCode)
                    console.log(response[0].headers)
                  })
                  .catch((error) => {
                    console.error(error)
                  });
            } else {
                console.log('No slot available :( sorry Brubo');
            }
        }
      })
    }
  )
  .end();
