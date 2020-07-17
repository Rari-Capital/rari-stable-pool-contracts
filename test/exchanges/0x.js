"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https = require('https');
class ZeroExExchange {
    constructor(web3) {
        this.web3 = web3;
    }
    getPrice(inputTokenSymbol, outputTokenSymbol) {
        return new Promise((resolve, reject) => {
            https.get('https://api.0x.org/swap/v0/prices?sellToken=' + inputTokenSymbol, (resp) => {
                let data = '';
                // A chunk of data has been recieved
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received
                resp.on('end', () => {
                    var decoded = JSON.parse(data);
                    if (!decoded)
                        reject("Failed to decode prices from 0x swap API");
                    if (!decoded.records)
                        reject("No prices found on 0x swap API");
                    // TODO: Make sure orders from API are sorted in ascending order of price
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
            https.get('https://api.0x.org/swap/v0/quote?sellToken=' + inputTokenAddress + '&buyToken=' + outputTokenAddress + '&sellAmount=' + maxInputAmountBN.toString(), (resp) => {
                let data = '';
                // A chunk of data has been recieved
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received
                resp.on('end', () => {
                    var decoded = JSON.parse(data);
                    if (!decoded)
                        reject("Failed to decode quote from 0x swap API");
                    if (!decoded.orders)
                        reject("No orders found on 0x swap API");
                    decoded.orders.sort((a, b) => (a.makerAssetAmount / (a.takerAssetAmount + a.takerFee) < b.makerAssetAmount / (b.takerAssetAmount + b.takerFee)) ? 1 : -1);
                    var orders = [];
                    var totalInputAmountBN = this.web3.utils.toBN(0);
                    var takerAssetFilledAmountBN = this.web3.utils.toBN(0);
                    for (var i = 0; i < decoded.orders.length; i++) {
                        if (decoded.orders[i].takerFee > 0 && decoded.orders[i].takerFeeAssetData.toLowerCase() !== "0xf47261b0000000000000000000000000" + inputTokenAddress.toLowerCase())
                            continue;
                        var takerAssetAmountBN = this.web3.utils.toBN(decoded.orders[i].takerAssetAmount);
                        var takerFeeBN = this.web3.utils.toBN(decoded.orders[i].takerFee);
                        var orderMaxInputAmountBN = takerAssetAmountBN.add(takerFeeBN);
                        if (this.web3.utils.toBN(decoded.orders[i].makerAssetAmount).lt(orderMaxInputAmountBN.mul(minMarginalOutputAmountBN).div(this.web3.utils.toBN(10).pow(this.web3.utils.toBN(inputTokenDecimals)))))
                            break;
                        var orderInputAmountBN = maxInputAmountBN.sub(totalInputAmountBN).lte(orderMaxInputAmountBN) ? maxInputAmountBN.sub(totalInputAmountBN) : orderMaxInputAmountBN;
                        totalInputAmountBN.iadd(orderInputAmountBN);
                        takerAssetFilledAmountBN.iadd(orderInputAmountBN.mul(takerAssetAmountBN).div(orderMaxInputAmountBN));
                        orders.push(decoded.orders[i]);
                        if (totalInputAmountBN.gte(maxInputAmountBN))
                            break;
                    }
                    if (takerAssetFilledAmountBN.isZero())
                        reject("No orders satisfying minMarginalOutputAmountBN found on 0x swap API");
                    resolve([orders, totalInputAmountBN, decoded.protocolFee, takerAssetFilledAmountBN]);
                });
            }).on("error", (err) => {
                reject("Error requesting quote from 0x swap API: " + err.message);
            });
        });
    }
}
exports.default = ZeroExExchange;
//# sourceMappingURL=0x.js.map