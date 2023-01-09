import algosdk, { encodeUint64 } from "algosdk";
import axios from "axios";
import bs58 from "bs58";
import fs from "fs";
const algodClient = new algosdk.Algodv2(process.env.algodClientToken, process.env.algodClientUrl, process.env.algodClientPort);
const indexerClient = new algosdk.Indexer(process.env.indexerToken, process.env.indexerUrl, process.env.indexerPort);
import { assetMetadata } from "../helpers/assetMetaData.js";
import pinataSdk from "@pinata/sdk";
const pinata = new pinataSdk(process.env.pinataApiKey, process.env.pinataApiSecret);

/**
 *
 * @param {String} token
 * @param {String} server
 * @param {Number} port
 */
export function connectToAlgorand(token, server, port) {
	console.log("=== CONNECT TO NETWORK ===");
	const algoClient = new algosdk.Algodv2(token, server, port);
	return algoClient;
}

export function getBlockchainAccount() {
	console.log("=== GET ACCOUNT ===");
	const account = algosdk.mnemonicToSecretKey(process.env.MNEMONIC);
	console.log("Account: " + account.addr);
	return account;
}

/**
 *
 * @param {String} algoClient
 * @param {Object} account
 * @param {Object} transaction
 * @param {Object} data
 * @param {any} signedTx
 * @param {Callback} callback
 */
export async function createAndSignTransaction(algoClient, account, transaction, data, signedTx, callback) {
	console.log("=== CREATE AND SIGN TRANSACTION ===");
	let suggestedParams, signed;
	await algoClient
		.getTransactionParams()
		.do()
		.then(async (value) => {
			suggestedParams = value;
			const appIndex = 103723509;
			const appArgs = [new Uint8Array(Buffer.from("set_number")), encodeUint64(parseInt(data.numberToSet))];
			transaction = algosdk.makeApplicationNoOpTxn(account.addr, suggestedParams, appIndex, appArgs);
			signedTx = await algosdk.signTransaction(transaction, account.sk);
			signed = signedTx;
		})
		.catch((err) => {
			return callback(err);
		});
	return signed;
}

/**
 *
 * @param {String} algoClient
 * @param {any} callback
 */
export async function sendTransaction(algoClient, signedTx, txnId, cb) {
	console.log("=== SEND TRANSACTION ===");
	await algoClient
		.sendRawTransaction(signedTx.blob)
		.do()
		.then((_txnId) => {
			txnId = _txnId;
			console.log(txnId);
			return;
		})
		.catch((e) => {
			return cb(e);
		});
	return cb();
}

/**
 *
 * @param {Object} payloadData
 * @param {any} cb
 */
export function respondToServer(payloadData, cb) {
	console.log("=== RESPOND TO SERVER ===");
	let service = payloadData;
	let destination = service.datashopServerAddress + "/api/job/updateJob";
	let lambdaInput = {
		insightFileURL: service.dataFileURL,
		jobid: service.jobID,
	};
	axios.put(destination, lambdaInput).catch((e) => {
		cb(e);
	});
	console.log("=== JOB RESPONDED ===");
	return;
}

export async function createAsset(data, algoClient, account) {
	console.log("=== CREATE ASSET ===");
	const creator = account.addr;
	const defaultFrozen = true;
	const unitName = data.unitName;
	const assetName = data.assetName;
	const assetUrl = data.url;
	let note = undefined;
	let manager = undefined;
	let reserve = undefined;
	let freeze = undefined;
	let clawback = undefined;
	let assetMetaDataHash = undefined;
	const total = 1;
	const decimals = 0;

	let params = await algoClient.getTransactionParams().do();
	let asset = await algosdk.makeAssetCreateTxnWithSuggestedParams(
		creator,
		note,
		total,
		decimals,
		defaultFrozen,
		manager,
		reserve,
		freeze,
		clawback,
		unitName,
		assetName,
		assetUrl,
		assetMetaDataHash,
		params
	);
	return asset;
}

export async function signAndSendTransaction(asset, algoClient, account) {
	try {
		console.log("=== SIGN AND CONFRIM TRANSACTION ===");
		const rawSignedTxn = asset.signTxn(account.sk);
		const tx = await algoClient.sendRawTransaction(rawSignedTxn).do();
		const confirmedTxn = await algosdk.waitForConfirmation(algoClient, tx.txId, 4);
		const assetID = confirmedTxn["asset-index"];
		console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
		return assetID;
	} catch (err) {
		return err;
	}
}

export const printCreatedAsset = async function (algodClient, account, assetid) {
	let accountInfo = await algodClient.accountInformation(account).do();
	for (let idx = 0; idx < accountInfo["created-assets"].length; idx++) {
		let scrutinizedAsset = accountInfo["created-assets"][idx];
		if (scrutinizedAsset["index"] == assetid) {
			console.log("AssetID = " + scrutinizedAsset["index"]);
			let myparms = JSON.stringify(scrutinizedAsset["params"], undefined, 2);
			console.log("parms = " + myparms);
			break;
		}
	}
};

export const printAssetHolding = async function (algodClient, account, assetid) {
	let accountInfo = await algodClient.accountInformation(account).do();
	for (let idx = 0; idx < accountInfo["assets"].length; idx++) {
		let scrutinizedAsset = accountInfo["assets"][idx];
		if (scrutinizedAsset["asset-id"] == assetid) {
			let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
			console.log("assetholdinginfo = " + myassetholding);
			break;
		}
	}
};

const ipfsHash = (cid) => {
	const cidUint8Arr = bs58.decode(cid).slice(2);
	const cidBase64 = cidUint8Arr.toString("base64");
	return { cidUint8Arr, cidBase64 };
};

export async function createIPFSAsset() {
	let asset = await pinata
		.testAuthentication()
		.then(async (res) => {
			console.log("Pinata test authentication: ", res);
			return assetPinnedToIpfs("orange.jpeg", "image/jpeg", "Orange", "Orange JPEG image pinned to IPFS");
		})
		.catch((err) => {
			return console.log(err);
		});
	return asset;
}

export const assetPinnedToIpfs = async (nftFilePath, mimeType, assetName, assetDesc) => {
	const nftFile = fs.createReadStream(nftFilePath);
	const nftFileName = nftFilePath.split("/").pop();

	const properties = {
		file_url: nftFileName,
		file_url_integrity: "",
		file_url_mimetype: mimeType,
	};

	const pinMeta = {
		pinataMetadata: {
			name: assetName,
			keyvalues: {
				url: nftFileName,
				mimetype: mimeType,
			},
		},
		pinataOptions: {
			cidVersion: 0,
		},
	};

	const resultFile = await pinata.pinFileToIPFS(nftFile, pinMeta);
	console.log("Asset pinned to IPFS via Pinata: ", resultFile);

	let metadata = assetMetadata.arc3MetadataJson;

	const integrity = ipfsHash(resultFile.IpfsHash);

	metadata.name = `${assetName}@arc3`;
	metadata.description = assetDesc;
	metadata.image = `ipfs://${resultFile.IpfsHash}`;
	metadata.image_integrity = `${integrity.cidBase64}`;
	metadata.image_mimetype = mimeType;
	metadata.properties = properties;
	metadata.properties.file_url = `https://ipfs.io/ipfs/${resultFile.IpfsHash}`;
	metadata.properties.file_url_integrity = `${integrity.cidBase64}`;

	console.log("Algorand NFT-IPFS metadata: ", metadata);

	const resultMeta = await pinata.pinJSONToIPFS(metadata, pinMeta);
	const metaIntegrity = ipfsHash(resultMeta.IpfsHash);
	console.log("Asset metadata pinned to IPFS via Pinata: ", resultMeta);

	return {
		name: `${assetName}@arc3`,
		url: `ipfs://${resultMeta.IpfsHash}`,
		metadata: metaIntegrity.cidUint8Arr,
		integrity: metaIntegrity.cidBase64,
	};
};

const waitForConfirmation = async (txId) => {
	const status = await algodClient.status().do();
	let lastRound = status["last-round"];
	let txInfo = null;

	while (true) {
		txInfo = await algodClient.pendingTransactionInformation(txId).do();
		if (txInfo["confirmed-round"] !== null && txInfo["confirmed-round"] > 0) {
			console.log("Transaction " + txId + " confirmed in round " + txInfo["confirmed-round"]);
			break;
		}
		lastRound++;
		await algodClient.statusAfterBlock(lastRound).do();
	}

	return txInfo;
};

export const createArc3Asset = async (asset, account) => {
	(async () => {
		let acct = await indexerClient.lookupAccountByID(account.addr).do();
		console.log("Account Address: " + acct["account"]["address"]);
		console.log("         Amount: " + acct["account"]["amount"]);
		console.log("        Rewards: " + acct["account"]["rewards"]);
		console.log(" Created Assets: " + acct["account"]["total-created-assets"]);
		console.log("  Current Round: " + acct["current-round"]);
	})().catch((e) => {
		console.error(e);
		console.trace();
	});

	console.log(asset);

	const txParams = await algodClient.getTransactionParams().do();

	const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
		from: account.addr,
		total: 1,
		decimals: 0,
		defaultFrozen: false,
		manager: account.addr,
		reserve: undefined,
		freeze: undefined,
		clawback: undefined,
		unitName: "nft",
		assetName: asset.name,
		assetURL: asset.url,
		assetMetadataHash: new Uint8Array(asset.metadata),
		suggestedParams: txParams,
	});

	const rawSignedTxn = txn.signTxn(account.sk);
	const tx = await algodClient.sendRawTransaction(rawSignedTxn).do();

	const confirmedTxn = await waitForConfirmation(tx.txId);
	const txInfo = await algodClient.pendingTransactionInformation(tx.txId).do();

	const assetID = txInfo["asset-index"];

	console.log("Account ", account.addr, " has created ARC3 compliant NFT with asset ID", assetID);
	console.log(`Check it out at https://testnet.algoexplorer.io/asset/${assetID}`);

	return { assetID };
};
