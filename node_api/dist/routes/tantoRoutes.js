"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tantoController_1 = require("../controllers/tantoController");
const router = (0, express_1.Router)();
router.get('/', tantoController_1.getTanto); // /api/tantos にGETリクエストが来た時にgetTantoを実行
exports.default = router;
