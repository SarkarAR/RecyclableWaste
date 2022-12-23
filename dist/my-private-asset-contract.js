"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyPrivateAssetContract = void 0;
const crypto = require("crypto");
const fabric_contract_api_1 = require("fabric-contract-api");
const my_private_asset_1 = require("./my-private-asset");
//import { Gateway, Wallets } from 'fabric-network';
//import * as path from 'path';
//import * as fs from 'fs';
async function getCollectionName(ctx) {
    const mspid = ctx.clientIdentity.getMSPID();
    const collectionName = `_implicit_org_${mspid}`;
    return collectionName;
}
let MyPrivateAssetContract = class MyPrivateAssetContract extends fabric_contract_api_1.Contract {
    //Returns true if an asset with "myPrivateAssetId" exists in the private data collection (PDC)
    async myPrivateAssetExists(ctx, myPrivateAssetId) {
        const collectionName = await getCollectionName(ctx);
        const data = await ctx.stub.getPrivateDataHash(collectionName, myPrivateAssetId);
        return (!!data && data.length > 0);
    }
    //Returns the EnrollmentID of a ClientIdentity
    async checkIdentity(ctx) {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity = new ClientIdentity(ctx.stub);
        return identity.getAttributeValue('hf.EnrollmentID');
    }
    //Creates product with the following properties: privateValue, ID, Type, Owner, Region
    //"myPrivateAssetId" is the public unique key
    //Only manufacturers can create assets.
    async createMyPrivateAsset(ctx, myPrivateAssetId) {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity = new ClientIdentity(ctx.stub);
        const checkAttr = identity.assertAttributeValue('manufacturer', 'true');
        if (!checkAttr) {
            throw new Error('You must be a manufacturer to carry out this transaction!');
        }
        const exists = await this.myPrivateAssetExists(ctx, myPrivateAssetId);
        if (exists) {
            throw new Error(`The asset my private asset ${myPrivateAssetId} already exists`);
        }
        const privateAsset = new my_private_asset_1.MyPrivateAsset();
        const transientData = ctx.stub.getTransient();
        if (transientData.size === 0 || !transientData.has('privateValue')) {
            throw new Error('The privateValue key was not specified in transient data. Please try again.');
        }
        privateAsset.privateValue = transientData.get('privateValue').toString();
        privateAsset.ID = transientData.get('ID').toString();
        privateAsset.Type = transientData.get('Type').toString();
        privateAsset.Owner = transientData.get('Owner').toString();
        privateAsset.Region = transientData.get('Region').toString();
        const collectionName = await getCollectionName(ctx);
        await ctx.stub.putPrivateData(collectionName, myPrivateAssetId, Buffer.from(JSON.stringify(privateAsset)));
    }
    async readMyPrivateAsset(ctx, myPrivateAssetId) {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity = new ClientIdentity(ctx.stub);
        const exists = await this.myPrivateAssetExists(ctx, myPrivateAssetId);
        if (!exists) {
            throw new Error(`The asset my private asset ${myPrivateAssetId} does not exist`);
        }
        let privateDataObj;
        const collectionName = await getCollectionName(ctx);
        const privateData = await ctx.stub.getPrivateData(collectionName, myPrivateAssetId);
        privateDataObj = JSON.parse(privateData.toString());
        if (privateDataObj.Owner != identity.getAttributeValue('hf.EnrollmentID')) {
            throw new Error('You must be the owner to see the details');
        }
        return JSON.stringify(privateDataObj);
    }
    async readAllOfMyPrivateAsset(ctx) {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity = new ClientIdentity(ctx.stub);
        const allResults = [];
        const collectionName = await getCollectionName(ctx);
        const { iterator } = (await ctx.stub.getPrivateDataByRange(collectionName, '', ''));
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            }
            catch (err) {
                console.log(err);
                record = strValue;
            }
            if (record.Owner == identity.getAttributeValue('hf.EnrollmentID')) {
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
    async readEntirePDC(ctx) {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity = new ClientIdentity(ctx.stub);
        //const checkAttr: boolean = identity.assertAttributeValue('role', 'oversight') || identity.assertAttributeValue('role', 'auditor');
        const checkAttr = true;
        if (!checkAttr) {
            throw new Error('You must be an auditor or an oversight inspector to carry out this transaction!');
        }
        const allResults = [];
        const collectionName = await getCollectionName(ctx);
        const { iterator } = (await ctx.stub.getPrivateDataByRange(collectionName, '', ''));
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            }
            catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
    async checkAnEntity(ctx, entityID) {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity = new ClientIdentity(ctx.stub);
        const checkAttr = identity.assertAttributeValue('role', 'oversight') || identity.assertAttributeValue('role', 'auditor');
        if (!checkAttr) {
            throw new Error('You must be an auditor or an oversight inspector to carry out this transaction!');
        }
        const allResults = [];
        const collectionName = await getCollectionName(ctx);
        const { iterator } = (await ctx.stub.getPrivateDataByRange(collectionName, '', ''));
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            }
            catch (err) {
                console.log(err);
                record = strValue;
            }
            if (record.Owner == entityID) {
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
    async updateMyPrivateAsset(ctx, myPrivateAssetId) {
        const exists = await this.myPrivateAssetExists(ctx, myPrivateAssetId);
        if (!exists) {
            throw new Error(`The asset my private asset ${myPrivateAssetId} does not exist`);
        }
        const privateAsset = new my_private_asset_1.MyPrivateAsset();
        const transientData = ctx.stub.getTransient();
        if (transientData.size === 0 || !transientData.has('privateValue')) {
            throw new Error('The privateValue key was not specified in transient data. Please try again.');
        }
        privateAsset.privateValue = transientData.get('privateValue').toString();
        privateAsset.ID = transientData.get('ID').toString();
        privateAsset.Type = transientData.get('Type').toString();
        privateAsset.Owner = transientData.get('Owner').toString();
        privateAsset.Region = transientData.get('Region').toString();
        const collectionName = await getCollectionName(ctx);
        await ctx.stub.putPrivateData(collectionName, myPrivateAssetId, Buffer.from(JSON.stringify(privateAsset)));
    }
    async deleteMyPrivateAsset(ctx, myPrivateAssetId) {
        const exists = await this.myPrivateAssetExists(ctx, myPrivateAssetId);
        if (!exists) {
            throw new Error(`The asset my private asset ${myPrivateAssetId} does not exist`);
        }
        const collectionName = await getCollectionName(ctx);
        await ctx.stub.deletePrivateData(collectionName, myPrivateAssetId);
    }
    async verifyMyPrivateAsset(ctx, mspid, myPrivateAssetId, objectToVerify) {
        // Convert user provided object into a hash
        const hashToVerify = crypto.createHash('sha256').update(JSON.stringify(objectToVerify)).digest('hex');
        const pdHashBytes = await ctx.stub.getPrivateDataHash(`_implicit_org_${mspid}`, myPrivateAssetId);
        if (pdHashBytes.length === 0) {
            throw new Error(`No private data hash with the Key: ${myPrivateAssetId}`);
        }
        const actualHash = Buffer.from(pdHashBytes).toString('hex');
        // Compare the hash calculated (from object provided) and the hash stored on public ledger
        if (hashToVerify === actualHash) {
            return true;
        }
        else {
            return false;
        }
    }
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            }
            catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
};
__decorate([
    fabric_contract_api_1.Transaction(false),
    fabric_contract_api_1.Returns('boolean'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], MyPrivateAssetContract.prototype, "myPrivateAssetExists", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    fabric_contract_api_1.Returns('string'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], MyPrivateAssetContract.prototype, "checkIdentity", null);
__decorate([
    fabric_contract_api_1.Transaction(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], MyPrivateAssetContract.prototype, "createMyPrivateAsset", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    fabric_contract_api_1.Returns('MyPrivateAsset'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], MyPrivateAssetContract.prototype, "readMyPrivateAsset", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    fabric_contract_api_1.Returns('MyPrivateAsset'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], MyPrivateAssetContract.prototype, "readAllOfMyPrivateAsset", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    fabric_contract_api_1.Returns('MyPrivateAsset'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], MyPrivateAssetContract.prototype, "readEntirePDC", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    fabric_contract_api_1.Returns('MyPrivateAsset'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], MyPrivateAssetContract.prototype, "checkAnEntity", null);
__decorate([
    fabric_contract_api_1.Transaction(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], MyPrivateAssetContract.prototype, "updateMyPrivateAsset", null);
__decorate([
    fabric_contract_api_1.Transaction(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], MyPrivateAssetContract.prototype, "deleteMyPrivateAsset", null);
__decorate([
    fabric_contract_api_1.Transaction(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String, my_private_asset_1.MyPrivateAsset]),
    __metadata("design:returntype", Promise)
], MyPrivateAssetContract.prototype, "verifyMyPrivateAsset", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    fabric_contract_api_1.Returns('string'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], MyPrivateAssetContract.prototype, "GetAllAssets", null);
MyPrivateAssetContract = __decorate([
    fabric_contract_api_1.Info({ title: 'MyPrivateAssetContract', description: 'My Private Data Smart Contract' })
], MyPrivateAssetContract);
exports.MyPrivateAssetContract = MyPrivateAssetContract;
//# sourceMappingURL=my-private-asset-contract.js.map