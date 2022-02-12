
# HoferLand Corona API 🦠

An json API to get the current infection data from https://landkreis-hof.de/ written in NodeJS.


## Features ⚙️

- show current incidence of city and district
- show current infected count of district
- show current lifetime infected count of district
- show current healed count of district
- show current death count of district
- show hospital count
- show current timestamp


## Feedback ⁉️

If you have any feedback, please reach out to me at developement@luca-hess.de


## Installation 👇🏼

To install the project, download screen with `apt install screen`, then clone it to your local machine and run `npm i`.
Lastly do `./start.sh` and visit your browser on http://ip-of-your-machine:3000
  
## Deployment 🏹

To deploy this project simply type `node index.js` and let it run in a screen. Then route your reverse proxy to the port `3000` or just connect to it over this port.


## Tech Stack 💻

**Server:** Node, Express, Cheerio, Axios


## Authors 🙇🏽‍♂️

- [@blocki](https://luca-hess.de/)


## Links 🔗

[Documentation](https://wiki.hoferlandstrikesback.de/website/corona-api), 
[Demo](https://api.hoferlandstrikesback.de/v1/hofland/corona)
