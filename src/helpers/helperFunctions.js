import algosdk, { encodeUint64 } from "algosdk";
import axios from "axios";
import fs from "fs";
import Path from "path";
import { fileURLToPath } from "url";
import { assetMetadata } from "../helpers/assetMetaData.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

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
 * @param {Object} payloadData
 * @param {any} cb
 */
export function respondToServer(serviceData, assetId, cb) {
	console.log("=== RESPOND TO SERVER ===");
	let destination = serviceData.datashopServerAddress + "/api/job/updateJob";
	let lambdaInput;
	if (assetId) {
		lambdaInput = {
			insightFileURL: serviceData.dataFileURL,
			jobid: serviceData.jobID,
			returnData: assetId,
		};
	} else {
		lambdaInput = {
			insightFileURL: serviceData.dataFileURL,
			jobid: serviceData.jobID,
		};
	}
	axios.put(destination, lambdaInput).catch((e) => {
		cb(e);
	});
	console.log("=== JOB RESPONDED ===");
	return;
}

// export async function signAndSendAssetTransaction(asset, algoClient, account) {
// 	console.log("=== SIGN AND CONFRIM ASSET TRANSACTION ===");
// 	try {
// 		const rawSignedTxn = asset.signTxn(account.sk);
// 		const tx = await algoClient.sendRawTransaction(rawSignedTxn).do();
// 		const confirmedTxn = await algosdk.waitForConfirmation(algoClient, tx.txId, 4);
// 		const assetID = confirmedTxn["asset-index"];
// console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
// console.log("Account ", account.addr, " has created ARC3 compliant NFT with asset ID", assetID);
// console.log(`Check it out at https://testnet.algoexplorer.io/asset/${assetID}`);
// 		return assetID;
// 	} catch (err) {
// 		console.log(err);
// 		return err;
// 	}
// }

export const createSignSendAssetOptInTxn = async (algodclient, receiverAddress, assetID, signedLogicSig) => {
	console.log("=== CREATE ASSET OPT IN TRANSACTION ===");
	try {
		const params = await algodclient.getTransactionParams().do();

		const sender = receiverAddress;
		const recipient = receiverAddress;
		const revocationTarget = undefined;
		const closeRemainderTo = undefined;
		const note = undefined;
		const amount = 0;

		const opttxn = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo, revocationTarget, amount, note, assetID, params);

		const signedLogicSigArr = Uint8Array.from(signedLogicSig);

		const filePath = Path.join(__dirname, "assetOptinApproval.teal");
		const program = fs.readFileSync(filePath);
		const results = await algodclient.compile(program).do();
		const compiledProgram = new Uint8Array(Buffer.from(results.result, "base64"));
		let lsig = new algosdk.LogicSig(compiledProgram);
		lsig.sig = signedLogicSigArr;

		const txId = logicSignAndSendTransaction(algodclient, opttxn, lsig);
		return txId;
	} catch (err) {
		console.log(err);
		return err;
	}
};

const logicSignAndSendTransaction = async (algodclient, txn, lsig) => {
	console.log("=== SIGN AND SEND TRANSACTION SIGNED BY LOGIC SIG ===");
	try {
		const rawSignedTxn = algosdk.signLogicSigTransactionObject(txn, lsig);
		const tx = await algodclient.sendRawTransaction(rawSignedTxn.blob).do();
		const confirmedTxn = await algosdk.waitForConfirmation(algodclient, tx.txId, 4);
		console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
		return tx.txId;
	} catch (err) {
		console.log(err);
		return err;
	}
};

export const createSignSendAssetTransferTxn = async (algodClient, assetID, senderAccount, data) => {
	console.log("=== CREATE SEND-ASSET TRANSACTION ===");
	try {
		const params = await algodClient.getTransactionParams().do();

		const revocationTarget = undefined;
		const closeRemainderTo = undefined;
		const note = undefined;
		const amount = data.totalSupply;

		const txn = algosdk.makeAssetTransferTxnWithSuggestedParams(senderAccount.addr, data.receiver, closeRemainderTo, revocationTarget, amount, note, assetID, params);

		const txId = await signAndSendTransaction(algodClient, txn, senderAccount.sk);
		return txId;
	} catch (err) {
		console.log(err);
		return err;
	}
};

const signAndSendTransaction = async (algodclient, txn, sig) => {
	console.log("=== SIGN AND SEND TRANSACTION ===");
	try {
		const rawSignedTxn = txn.signTxn(sig);
		const tx = await algodclient.sendRawTransaction(rawSignedTxn).do();
		const confirmedTxn = await algosdk.waitForConfirmation(algodclient, tx.txId, 4);
		console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
		return tx.txId;
	} catch (err) {
		console.log(err);
		return err;
	}
};

// const ipfsHash = (cid) => {
// 	const cidUint8Arr = bs58.decode(cid).slice(2);
// 	const cidBase64 = cidUint8Arr.toString("base64");
// 	return { cidUint8Arr, cidBase64 };
// };

// export async function createIPFSAsset(imageBlob, assetName) {
// 	let asset = await pinata
// 		.testAuthentication()
// 		.then(async (res) => {
// 			console.log("Pinata test authentication: ", res);
// 			return assetPinnedToIpfs(imageBlob, "image", assetName, "JPEG image pinned to IPFS");
// 		})
// 		.catch((err) => {
// 			console.log(err);
// 			return err;
// 		});
// 	return asset;
// }

// export const assetPinnedToIpfs = async (blob, mimeType, assetName, assetDesc) => {
// 	let [format, base64Image] = blob.split("data:image/")[1].split(";base64,");
// 	mimeType += "/" + format;
// 	const buffer = Buffer.from(base64Image, "base64");
// 	const imageFileName = "image." + format;
// 	fs.writeFileSync(imageFileName, buffer);
// 	const nftFile = fs.createReadStream(imageFileName);

// 	const properties = {
// 		file_url: "trial",
// 		file_url_integrity: "",
// 		file_url_mimetype: mimeType,
// 	};
// 	const pinMeta = {
// 		pinataMetadata: {
// 			name: "trial",
// 			keyvalues: {
// 				url: "trial",
// 				mimetype: mimeType,
// 			},
// 		},
// 		pinataOptions: {
// 			cidVersion: 0,
// 		},
// 	};

// 	const resultFile = await pinata.pinFileToIPFS(nftFile, pinMeta);
// 	console.log("Asset pinned to IPFS via Pinata: ", resultFile);
// 	fs.unlinkSync(imageFileName);

// 	let metadata = assetMetadata.arc3MetadataJson;
// 	const integrity = ipfsHash(resultFile.IpfsHash);

// 	metadata.name = `${assetName}@arc3`;
// 	metadata.description = assetDesc;
// 	metadata.image = `ipfs://${resultFile.IpfsHash}`;
// 	metadata.image_integrity = `${integrity.cidBase64}`;
// 	metadata.image_mimetype = mimeType;
// 	metadata.properties = properties;
// 	metadata.properties.file_url = `https://ipfs.io/ipfs/${resultFile.IpfsHash}`;
// 	metadata.properties.file_url_integrity = `${integrity.cidBase64}`;

// 	console.log("Algorand NFT-IPFS metadata: ", metadata);
// 	const resultMeta = await pinata.pinJSONToIPFS(metadata, pinMeta);
// 	const metaIntegrity = ipfsHash(resultMeta.IpfsHash);
// 	console.log("Asset metadata pinned to IPFS via Pinata: ", resultMeta);

// 	return {
// 		name: `${assetName}`,
// 		url: `ipfs://${resultMeta.IpfsHash}`,
// 		metadata: metaIntegrity.cidUint8Arr,
// 		integrity: metaIntegrity.cidBase64,
// 	};
// };

/**
 * 
 * @param {AlgoClient} algoClient 
 * @param {Object} asset 
 * @param {String} asset.name
 * @param {String} asset.unitName
 * @param {String} asset.url
 * @param {Number} asset.totalSupply
 * @param {Number} asset.decimals
 * @param {Object} asset.metadata
 * @param {Object} asset.receiver
 * @param {Account} account 
 * @returns Object of created asset
 */
export const createArc3Asset = async (algoClient, asset, account) => {
	console.log("=== CREATE ARC3 ASSET ===");
	let metadata = assetMetadata.arc3MetadataJson;
	metadata.image = `ipfs://${asset.assetURL}`;
	metadata.fileURL = `https://ipfs.io/ipfs/${asset.assetURL}`;
	metadata.name = asset.assetName;

	const txParams = await algoClient.getTransactionParams().do();
	const algoAsset = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
		from: account.addr,
		total: asset.totalSupply,
		decimals: asset.decimals,
		unitName: asset.assetUnitName,
		assetName: `${asset.assetName}@arc3`,
		assetURL: asset.assetURL ? `ipfs://${asset.assetURL}` : "",
		// assetMetadataHash: asset.metadata ? new Uint8Array(asset.metadata) : null,
		suggestedParams: txParams,
		manager: asset.receiver,
		reserve: undefined,
		freeze: undefined,
		clawback: undefined,
		defaultFrozen: false,
	});

	console.log("=== Signing ASSET CREATION TXN ===");
	const rawSignedTxn = algoAsset.signTxn(account.sk);

	console.log("=== Sending ASSET CREATION TXN ===");
	const tx = await algoClient.sendRawTransaction(rawSignedTxn).do();

	const confirmedTxn = await algosdk.waitForConfirmation(algoClient, tx.txId, 4);
	const assetID = confirmedTxn["asset-index"];

	return assetID;
};
