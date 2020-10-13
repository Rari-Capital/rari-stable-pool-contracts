"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
class ZeroExExchange {
    constructor(web3) {
        this.web3 = web3;
    }
    getPrice(inputTokenSymbol, outputTokenSymbol) {
        return new Promise((resolve, reject) => {
            https_1.default.get('https://api.0x.org/swap/v0/prices?sellToken=' + inputTokenSymbol, (resp) => {
                let data = '';
                // A chunk of data has been recieved
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received
                resp.on('end', () => {
                    var decoded = JSON.parse(data);
                    if (!decoded)
                        return reject("Failed to decode prices from 0x swap API");
                    if (!decoded.records)
                        return reject("No prices found on 0x swap API");
                    for (var i = 0; i < decoded.records.length; i++)
                        if (decoded.records[i].symbol === outputTokenSymbol)
                            resolve(decoded.records[i].price);
                    reject("Price not found on 0x swap API");
                });
            }).on("error", (err) => {
                reject("Error requesting prices from 0x swap API: " + err.message);
            });
        });
    }
    getSwapOrders(inputTokenAddress, inputTokenDecimals, outputTokenAddress, maxInputAmountBN, minMarginalOutputAmountBN) {
        return new Promise((resolve, reject) => {
            https_1.default.get('https://api.0x.org/swap/v0/quote?sellToken=' + inputTokenAddress + '&buyToken=' + outputTokenAddress + '&sellAmount=' + maxInputAmountBN.toString(), (resp) => {
                let data = '';
                // A chunk of data has been recieved
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received
                resp.on('end', () => {
                    var decoded = JSON.parse(data);
                    if (!decoded)
                        return reject("Failed to decode quote from 0x swap API");
                    if (!decoded.orders)
                        return reject("No orders found on 0x swap API");
                    decoded.orders.sort((a, b) => (a.makerAssetAmount / (a.takerAssetAmount + a.takerFee) < b.makerAssetAmount / (b.takerAssetAmount + b.takerFee)) ? 1 : -1);
                    var orders = [];
                    var inputFilledAmountBN = this.web3.utils.toBN(0);
                    var takerAssetFilledAmountBN = this.web3.utils.toBN(0);
                    for (var i = 0; i < decoded.orders.length; i++) {
                        if (decoded.orders[i].takerFee > 0 && decoded.orders[i].takerFeeAssetData.toLowerCase() !== "0xf47261b0000000000000000000000000" + inputTokenAddress.toLowerCase())
                            continue;
                        var takerAssetAmountBN = this.web3.utils.toBN(decoded.orders[i].takerAssetAmount);
                        var takerFeeBN = this.web3.utils.toBN(decoded.orders[i].takerFee);
                        var orderInputAmountBN = takerAssetAmountBN.add(takerFeeBN); // Maximum amount we can send to this order including the taker fee
                        var makerAssetAmountBN = this.web3.utils.toBN(decoded.orders[i].makerAssetAmount);
                        // Check minMarginalOutputAmountBN
                        if (makerAssetAmountBN.lt(orderInputAmountBN.mul(minMarginalOutputAmountBN).div(this.web3.utils.toBN(10).pow(this.web3.utils.toBN(inputTokenDecimals)))))
                            break;
                        // Fill whole order by default
                        var orderInputFillAmountBN = orderInputAmountBN;
                        var orderTakerAssetFillAmountBN = takerAssetAmountBN;
                        // Calculate orderInputFillAmountBN and orderTakerAssetFillAmountBN from the remaining maxInputAmountBN if we are limited by it
                        if (maxInputAmountBN.sub(inputFilledAmountBN).lte(orderInputAmountBN)) {
                            orderInputFillAmountBN = maxInputAmountBN.sub(inputFilledAmountBN);
                            orderTakerAssetFillAmountBN = orderInputFillAmountBN.mul(takerAssetAmountBN).div(orderInputAmountBN);
                        }
                        // Add order to returned array
                        orders.push(decoded.orders[i]);
                        // Add order fill amounts to total fill amounts
                        inputFilledAmountBN.iadd(orderInputFillAmountBN);
                        takerAssetFilledAmountBN.iadd(orderTakerAssetFillAmountBN);
                        // Check if we have hit maxInputAmountBN
                        if (inputFilledAmountBN.gte(maxInputAmountBN))
                            break;
                    }
                    if (takerAssetFilledAmountBN.isZero())
                        return reject("No orders satisfying minMarginalOutputAmountBN found on 0x swap API");
                    resolve([orders, inputFilledAmountBN, decoded.protocolFee, takerAssetFilledAmountBN, decoded.gasPrice]);
                });
            }).on("error", (err) => {
                reject("Error requesting quote from 0x swap API: " + err.message);
            });
        });
    }
}
exports.default = ZeroExExchange;
//# sourceMappingURL=0x.js.map