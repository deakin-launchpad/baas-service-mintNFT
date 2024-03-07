import async from "async";
import UniversalFunctions from "../../utils/universalFunctions.js";
import {
	connectToAlgorand,
	getBlockchainAccount,
	// signAndSendAssetTransaction,
	createSignSendAssetOptInTxn,
	createSignSendAssetTransferTxn,
	// createIPFSAsset,
	createArc3Asset,
	respondToServer,
} from "../../helpers/helperFunctions.js";
const ERROR = UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR;

const mintNftIPFS = (payloadData, callback) => {
	let algoClient, account, assetID, optInTxId, assetTransferTxId;
	const data = payloadData.dataFileURL.json;
	const tasks = {
		connectToBlockchain: (cb) => {
			algoClient = connectToAlgorand("", "https://testnet-api.algonode.cloud", 443);
			if (!algoClient) return cb(ERROR.APP_ERROR);
			cb();
		},
		getAccount: (cb) => {
			account = getBlockchainAccount();
			if (!account) return cb(ERROR.APP_ERROR);
			cb();
		},
		// createIPFSAsset: (cb) => {
		// 	createIPFSAsset(data.blob, data.assetName).then((res) => {
		// 		asset = res;
		// 		if (!asset || isError(assetID)) return cb(ERROR.APP_ERROR);
		// 		cb();
		// 	});
		// },
		createAsset: (cb) => {
			createArc3Asset(algoClient, data, account).then((res) => {
				assetID = res;
				if (!assetID || isError(assetID)) return cb(ERROR.APP_ERROR);
				cb();
			});
		},
		createSignSendOptInTransaction: (cb) => {
			createSignSendAssetOptInTxn(algoClient, data.receiver, assetID, data.signedLogicSig).then((res) => {
				optInTxId = res;
				if (!optInTxId) return cb(ERROR.APP_ERROR);
				cb();
			});
		},
		createSignSendAssetTransferTransaction: (cb) => {
			assetTransferTxId = createSignSendAssetTransferTxn(algoClient, assetID, account, data).then((res) => {
				assetTransferTxId = res;
				if (!assetTransferTxId || isError(assetID)) return cb(ERROR.APP_ERROR);
				cb();
			});
		},
	};
	async.series(tasks, (err, result) => {
		let returnData;
		// if (err) return callback(err);
		// return callback(null, { assetID })
		if (err || !assetID) {
			// respond to server with error
			returnData = null;
		} else {
			// respond to server with success
			returnData = { assetID };
		}
		respondToServer(payloadData, returnData, (err, result) => {
			if (err) {
				console.log(err);
			} else {
				console.log(result);
			}
		});
	});
};

const isError = (e) => {
	return e && e.stack && e.message && typeof e.stack === "string" && typeof e.message === "string";
};

export default {
	mintNftIPFS: mintNftIPFS,
};
