const psl = require("psl")

const urlToDomain = (url) => {
  if (url.includes("http")) {
    const hostName = url.split("/")[2]
    const parsed = psl.parse(hostName)
    return parsed.domain
  }
  return url
}

module.exports = {
  urlToDomain
}
