const psl = require("psl")

const urlToDomain = (url) => {
  const extractHostname = (url) => {
    let hostname;

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    hostname = hostname.split(':')[0];
    hostname = hostname.split('?')[0];

    return hostname;
  }

  const hostName = extractHostname(url)
  const parsed = psl.parse(hostName)
  if (parsed.sld === "wordpress") {
    return parsed.input
  }
  return psl.parse(hostName).domain
}

module.exports = {
  urlToDomain
}
