import domains from "./domains/domains"
import login from "./login/login"

export default function (app, db) {
  //route(app, db)
  login(app, db)
  domains(app, db)
};
