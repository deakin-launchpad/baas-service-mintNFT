import algosdk, { encodeUint64 } from "algosdk";
import axios from "axios";

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
