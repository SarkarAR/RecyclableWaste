/*
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto = require('crypto');
import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { MyPrivateAsset } from './my-private-asset';
//import { Gateway, Wallets } from 'fabric-network';
//import * as path from 'path';
//import * as fs from 'fs';

async function getCollectionName(ctx: Context): Promise<string> {
    const mspid: string = ctx.clientIdentity.getMSPID();
    const collectionName: string = `_implicit_org_${mspid}`;
    return collectionName;
}

@Info({title: 'MyPrivateAssetContract', description: 'My Private Data Smart Contract' })
export class MyPrivateAssetContract extends Contract {

    //Returns true if an asset with "myPrivateAssetId" exists in the private data collection (PDC)
    @Transaction(false)
    @Returns('boolean')
    public async myPrivateAssetExists(ctx: Context, myPrivateAssetId: string): Promise<boolean> {
        const collectionName: string = await getCollectionName(ctx);
        const data: Uint8Array = await ctx.stub.getPrivateDataHash(collectionName, myPrivateAssetId);
        return (!!data && data.length > 0);
    }

    //Returns the EnrollmentID of a ClientIdentity
    @Transaction(false)
    @Returns('string')
    public async checkIdentity(ctx: Context): Promise<string> {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity= new ClientIdentity(ctx.stub);
        return identity.getAttributeValue('hf.EnrollmentID');
    }

    //Creates product with the following properties: privateValue, ID, Type, Owner, Region
    //"myPrivateAssetId" is the public unique key
    //Only manufacturers can create assets.
    @Transaction()
    public async createMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<void> {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity= new ClientIdentity(ctx.stub);
        const checkAttr: boolean = identity.assertAttributeValue('manufacturer', 'true');
        if(!checkAttr){
            throw new Error('You must be a manufacturer to carry out this transaction!');
        }
        const exists: boolean = await this.myPrivateAssetExists(ctx, myPrivateAssetId);
        if (exists) {
            throw new Error(`The asset my private asset ${myPrivateAssetId} already exists`);
        }

        const privateAsset: MyPrivateAsset = new MyPrivateAsset();

        const transientData: Map<string, Uint8Array> = ctx.stub.getTransient();
        if (transientData.size === 0 || !transientData.has('privateValue')) {
            throw new Error('The privateValue key was not specified in transient data. Please try again.');
        }
        privateAsset.privateValue = transientData.get('privateValue').toString();
        privateAsset.ID = transientData.get('ID').toString();
        privateAsset.Type = transientData.get('Type').toString();
        privateAsset.Owner = transientData.get('Owner').toString();
        privateAsset.Region = transientData.get('Region').toString();

        const collectionName: string = await getCollectionName(ctx);
        await ctx.stub.putPrivateData(collectionName, myPrivateAssetId, Buffer.from(JSON.stringify(privateAsset)));
    }

    //The owner of an asset can see the details of their asset via this function
    @Transaction(false)
    @Returns('MyPrivateAsset')
    public async readMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<string> {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity= new ClientIdentity(ctx.stub);

        const exists: boolean = await this.myPrivateAssetExists(ctx, myPrivateAssetId);
        if (!exists) {
            throw new Error(`The asset my private asset ${myPrivateAssetId} does not exist`);
        }

        let privateDataObj: MyPrivateAsset;

        const collectionName: string = await getCollectionName(ctx);
        const privateData: Uint8Array = await ctx.stub.getPrivateData(collectionName, myPrivateAssetId);

        privateDataObj = JSON.parse(privateData.toString());

        if(privateDataObj.Owner != identity.getAttributeValue('hf.EnrollmentID')){
            throw new Error('You must be the owner to see the details');
        }

        return JSON.stringify(privateDataObj);
    }

    //An entity can check all of their possession via this function
    @Transaction(false)
    @Returns('MyPrivateAsset')
    public async readAllOfMyPrivateAsset(ctx: Context): Promise<string> {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity= new ClientIdentity(ctx.stub);
        const allResults = [];
        const collectionName: string = await getCollectionName(ctx);
        const { iterator } = (await ctx.stub.getPrivateDataByRange(collectionName, '', '')) as any;

        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            
            if(record.Owner==identity.getAttributeValue('hf.EnrollmentID')){
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    //The auditor or the oversight wallet can see the entire private data collection
    @Transaction(false)
    @Returns('MyPrivateAsset')
    public async readEntirePDC(ctx: Context): Promise<string> {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity= new ClientIdentity(ctx.stub);
        const checkAttr: boolean = identity.assertAttributeValue('role', 'oversight') || identity.assertAttributeValue('role', 'auditor');
        if(!checkAttr){
            throw new Error('You must be an auditor or an oversight inspector to carry out this transaction!');
        }
        
        const allResults = [];
        const collectionName: string = await getCollectionName(ctx);
        const { iterator } = (await ctx.stub.getPrivateDataByRange(collectionName, '', '')) as any;

        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    //The auditor or the oversight participant can see the status of a particular entity
    @Transaction(false)
    @Returns('MyPrivateAsset')
    public async checkAnEntity(ctx: Context, entityID: string): Promise<string> {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity= new ClientIdentity(ctx.stub);
        const checkAttr: boolean = identity.assertAttributeValue('role', 'oversight') || identity.assertAttributeValue('role', 'auditor');
        if(!checkAttr){
            throw new Error('You must be an auditor or an oversight inspector to carry out this transaction!');
        }

        const allResults = [];
        const collectionName: string = await getCollectionName(ctx);
        const { iterator } = (await ctx.stub.getPrivateDataByRange(collectionName, '', '')) as any;

        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            
            if(record.Owner==entityID){
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    
    //Any participant can check the count of products in a region.
    //The product-structure support product statistics by type by region.
    @Transaction(false)
    @Returns('MyPrivateAsset')
    public async checkARegion(ctx: Context, Region: string): Promise<number> {
        var ine: number;
        ine=0;
        const allResults = [];
        const collectionName: string = await getCollectionName(ctx);
        const { iterator } = (await ctx.stub.getPrivateDataByRange(collectionName, '', '')) as any;

        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            
            if(record.Region==Region){
                ine =ine + 1;
            }
            result = await iterator.next();
        }
        return ine;
    }

    //The owner can update the attributes of their asset.
    @Transaction()
    public async updateMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<void> {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity= new ClientIdentity(ctx.stub);

        const exists: boolean = await this.myPrivateAssetExists(ctx, myPrivateAssetId);
        if (!exists) {
            throw new Error(`The asset my private asset ${myPrivateAssetId} does not exist`);
        }

        const privateAsset: MyPrivateAsset = new MyPrivateAsset();

        const transientData: Map<string, Uint8Array> = ctx.stub.getTransient();
        if (transientData.size === 0 || !transientData.has('privateValue')) {
            throw new Error('The privateValue key was not specified in transient data. Please try again.');
        }
        if (transientData.get('Owner').toString()!= identity.getAttributeValue('hf.EnrollmentID')){
            throw new Error(`You are not the owner`);
        }
        privateAsset.privateValue = transientData.get('privateValue').toString();
        privateAsset.ID = transientData.get('ID').toString();
        privateAsset.Type = transientData.get('Type').toString();
        privateAsset.Owner = transientData.get('Owner').toString();
        privateAsset.Region = transientData.get('Region').toString();

        const collectionName: string = await getCollectionName(ctx);
        await ctx.stub.putPrivateData(collectionName, myPrivateAssetId, Buffer.from(JSON.stringify(privateAsset)));
    }

    //The owner can delete the their asset.
    @Transaction()
    public async deleteMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<void> {
        const ClientIdentity = require('fabric-shim').ClientIdentity;
        let identity= new ClientIdentity(ctx.stub);
        const exists: boolean = await this.myPrivateAssetExists(ctx, myPrivateAssetId);
        if (!exists) {
            throw new Error(`The asset my private asset ${myPrivateAssetId} does not exist`);
        }

        const collectionName: string = await getCollectionName(ctx);

        const transientData: Map<string, Uint8Array> = ctx.stub.getTransient();
        if (transientData.get('Owner').toString()!= identity.getAttributeValue('hf.EnrollmentID')){
            throw new Error(`You are not the owner`);
        }
        await ctx.stub.deletePrivateData(collectionName, myPrivateAssetId);
    }

    @Transaction()
    public async verifyMyPrivateAsset(ctx: Context, mspid: string, myPrivateAssetId: string, objectToVerify: MyPrivateAsset): Promise<boolean> {
        // Convert user provided object into a hash
        const hashToVerify: string = crypto.createHash('sha256').update(JSON.stringify(objectToVerify)).digest('hex');
        const pdHashBytes: Uint8Array = await ctx.stub.getPrivateDataHash(`_implicit_org_${mspid}`, myPrivateAssetId);
        if (pdHashBytes.length === 0) {
            throw new Error(`No private data hash with the Key: ${myPrivateAssetId}`);
        }

        const actualHash: string = Buffer.from(pdHashBytes).toString('hex');

        // Compare the hash calculated (from object provided) and the hash stored on public ledger
        if (hashToVerify === actualHash) {
            return true;
        } else {
            return false;
        }
    }


}
