"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTanto = getTanto;
const tantoService_1 = require("../services/tantoService");
async function getTanto(req, res) {
    try {
        const tantoList = await (0, tantoService_1.getTantoList)();
        res.json(tantoList);
    }
    catch (error) {
        console.error('Error getting tanto list:', error);
        res.status(500).send('Error fetching tanto data');
    }
}
