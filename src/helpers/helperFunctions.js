import algosdk, { encodeUint64 } from "algosdk";
import axios from "axios";
import bs58 from "bs58";
import fs from "fs";
import Path from "path";
import { fileURLToPath } from "url";
import { assetMetadata } from "../helpers/assetMetaData.js";
import pinataSdk from "@pinata/sdk";
const pinata = new pinataSdk(process.env.pinataApiKey, process.env.pinataApiSecret);

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
export function respondToServer(payloadData, data, cb) {
	console.log("=== RESPOND TO SERVER ===");
	let service = payloadData;
	let destination = service.datashopServerAddress + "/api/job/updateJob";
	let lambdaInput;
	let assetId = "The application ID is: " + data + ` Visit https://testnet.algoexplorer.io/asset/${data} to see the asset`;
	if (data) {
		lambdaInput = {
			insightFileURL: service.dataFileURL,
			jobid: service.jobID,
			returnData: assetId,
		};
	} else {
		lambdaInput = {
			insightFileURL: service.dataFileURL,
			jobid: service.jobID,
		};
	}
	axios.put(destination, lambdaInput).catch((e) => {
		cb(e);
	});
	console.log("=== JOB RESPONDED ===");
	return;
}

export async function signAndSendAssetTransaction(asset, algoClient, account) {
	console.log("=== SIGN AND CONFRIM ASSET TRANSACTION ===");
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
		console.log(err);
		return err;
	}
}

export const createSignSendAssetOptInTxn = async (algodclient, accountAddr, assetID, signedLogicSig) => {
	console.log("=== CREATE ASSET OPT IN TRANSACTION ===");
	try {
		const params = await algodclient.getTransactionParams().do();

		const sender = accountAddr;
		const recipient = accountAddr;
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

export const createSignSendAssetTransferTxn = async (algodClient, assetID, sender, recipient, senderSig) => {
	console.log(sender, recipient);
	console.log("=== CREATE SEND-ASSET TRANSACTION ===");
	try {
		const params = await algodClient.getTransactionParams().do();

		const revocationTarget = undefined;
		const closeRemainderTo = undefined;
		const note = undefined;
		const amount = 1;

		const txn = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo, revocationTarget, amount, note, assetID, params);

		const txId = await signAndSendTransaction(algodClient, txn, senderSig);
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

const ipfsHash = (cid) => {
	const cidUint8Arr = bs58.decode(cid).slice(2);
	const cidBase64 = cidUint8Arr.toString("base64");
	return { cidUint8Arr, cidBase64 };
};

export async function createIPFSAsset(imageBlob, assetName) {
	let asset = await pinata
		.testAuthentication()
		.then(async (res) => {
			console.log("Pinata test authentication: ", res);
			return assetPinnedToIpfs(imageBlob, "image", assetName, "JPEG image pinned to IPFS");
		})
		.catch((err) => {
			console.log(err);
			return err;
		});
	return asset;
}

export const assetPinnedToIpfs = async (blob, mimeType, assetName, assetDesc) => {
	let [format, base64Image] = blob.split("data:image/")[1].split(";base64,");
	mimeType += "/" + format;
	const buffer = Buffer.from(base64Image, "base64");
	const imageFileName = "image." + format;
	fs.writeFileSync(imageFileName, buffer);
	const nftFile = fs.createReadStream(imageFileName);

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
	fs.unlinkSync(imageFileName);

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

export const createArc3Asset = async (algoClient, asset, account) => {
	console.log("=== CREATE ARC3 ASSET ===");
	const txParams = await algoClient.getTransactionParams().do();
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
