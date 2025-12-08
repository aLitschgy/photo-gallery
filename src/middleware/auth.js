import { PASSWORD } from "../config/config.js";

export function auth(req, res, next) {
    if (req.session.logged) return next();
    res.redirect("/login");
}

export function loginHandler(req, res) {
    if (req.body.password === PASSWORD) {
        req.session.logged = true;
        return res.redirect("/admin.html");
    }
    res.send("Mot de passe incorrect");
}
