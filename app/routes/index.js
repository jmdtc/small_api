const domainsRoute = require("./domains")

module.exports = function (app, db) {
  //route(app, db)
  domainsRoute(app, db)
};
