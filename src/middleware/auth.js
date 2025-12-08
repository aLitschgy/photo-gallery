import jwt from "jsonwebtoken";
import { PASSWORD, SESSION_SECRET } from "../config/config.js";

export function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token manquant" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, SESSION_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token invalide" });
    }
}

export function loginHandler(req, res) {
    if (req.body.password === PASSWORD) {
        const token = jwt.sign({ user: "admin" }, SESSION_SECRET, { expiresIn: "2h" });
        return res.json({ token });
    }
    res.status(401).json({ error: "Mot de passe incorrect" });
}
