import algosdk, { encodeUint64 } from "algosdk";
import axios from "axios";
import bs58 from "bs58";
import fs from "fs";
import { assetMetadata } from "../helpers/assetMetaData.js";
import pinataSdk from "@pinata/sdk";
const pinata = new pinataSdk(process.env.pinataApiKey, process.env.pinataApiSecret);
const algodClient = new algosdk.Algodv2(process.env.algodClientToken, process.env.algodClientUrl, process.env.algodClientPort);

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
	console.log("=== SIGN AND CONFRIM TRANSACTION ===");
	try {
		const rawSignedTxn = asset.signTxn(account.sk);
		const tx = await algoClient.sendRawTransaction(rawSignedTxn).do();
		const confirmedTxn = await algosdk.waitForConfirmation(algoClient, tx.txId, 4);
		const assetID = confirmedTxn["asset-index"];
		console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
		console.log("Account ", account.addr, " has created ARC3 compliant NFT with asset ID", assetID);
		console.log(`Check it out at https://testnet.algoexplorer.io/asset/${assetID}`);
		return assetID;
	} catch (err) {
		return err;
	}
}

const ipfsHash = (cid) => {
	const cidUint8Arr = bs58.decode(cid).slice(2);
	const cidBase64 = cidUint8Arr.toString("base64");
	return { cidUint8Arr, cidBase64 };
};

export async function createIPFSAsset(image) {
	let asset = await pinata
		.testAuthentication()
		.then(async (res) => {
			console.log("Pinata test authentication: ", res);
			return assetPinnedToIpfs(image, "image/jpeg", "Image", "JPEG image pinned to IPFS");
		})
		.catch((err) => {
			return console.log(err);
		});
	return asset;
}

export const assetPinnedToIpfs = async (image, mimeType, assetName, assetDesc) => {
	const img = image.blob;
	let base64Image = img.split("data:image/jpeg;base64,").pop();
	const buffer = Buffer.from(base64Image, "base64");
	fs.writeFileSync("image.jpeg", buffer);
	const nftFile = fs.createReadStream("image.jpeg");

	const properties = {
		file_url: "trial",
		file_url_integrity: "",
		file_url_mimetype: mimeType,
	};
	const pinMeta = {
		pinataMetadata: {
			name: "trial",
			keyvalues: {
				url: "trial",
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
		name: `${assetName}`,
		url: `ipfs://${resultMeta.IpfsHash}`,
		metadata: metaIntegrity.cidUint8Arr,
		integrity: metaIntegrity.cidBase64,
	};
};

export const createArc3Asset = async (asset, account) => {
	console.log("=== CREATE ARC3 ASSET ===");
	const txParams = await algodClient.getTransactionParams().do();
	const algoAsset = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
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
	return { algoAsset };
};
