# RecyclableWaste
It's a proof of concept demostration for tracking recyclable wastes using hyperledger fabric (specially, private data collection (PDC)).

Chaincode: my-private-asset-contract.ts

createMyPrivateAsset(...): 
Creates product with the following properties: privateValue, ID, Type, Owner, Region. "myPrivateAssetId" is the public unique key. Only manufacturers can create assets.

public async readMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<string> 
//The owner of an asset can see the details of their asset via this contract

public async readAllOfMyPrivateAsset(ctx: Context): Promise<string> 
//An entity can check all of their possession via this function

public async updateMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<void> 
//The owner can update the attributes of their asset. Update is done via transient data

public async deleteMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<void> 
//The owner can delete the their asset.
    
public async verifyMyPrivateAsset(ctx: Context, mspid: string, myPrivateAssetId: string, objectToVerify: MyPrivateAsset): Promise<boolean> 
// Compare the hash calculated (from object provided) and the hash stored on public ledger

public async checkAnEntity(ctx: Context, entityID: string): Promise<string> 
//The auditor or the oversight participant can see the status of a particular entity

public async readEntirePDC(ctx: Context): Promise<string>
//The auditor or the oversight wallet can see the entire private data collection

public async checkARegion(ctx: Context, Region: string): Promise<number> 
//Any participant can check the count of products in a region. The product-structure supports product statistics by type by region.

  
  
