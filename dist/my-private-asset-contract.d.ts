import { Context, Contract } from 'fabric-contract-api';
import { MyPrivateAsset } from './my-private-asset';
export declare class MyPrivateAssetContract extends Contract {
    myPrivateAssetExists(ctx: Context, myPrivateAssetId: string): Promise<boolean>;
    checkIdentity(ctx: Context): Promise<string>;
    createMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<void>;
    readMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<string>;
    readAllOfMyPrivateAsset(ctx: Context): Promise<string>;
    readEntirePDC(ctx: Context): Promise<string>;
    checkAnEntity(ctx: Context, entityID: string): Promise<string>;
    updateMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<void>;
    deleteMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<void>;
    verifyMyPrivateAsset(ctx: Context, mspid: string, myPrivateAssetId: string, objectToVerify: MyPrivateAsset): Promise<boolean>;
    GetAllAssets(ctx: Context): Promise<string>;
}
