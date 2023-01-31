import async from "async";
import UniversalFunctions from "../../utils/universalFunctions.js";
import {
	connectToAlgorand,
	getBlockchainAccount,
	signAndSendAssetTransaction,
	createSignSendAssetOptInTxn,
	createSignSendAssetTransferTxn,
	createIPFSAsset,
	createArc3Asset,
	respondToServer,
} from "../../helpers/helperFunctions.js";
const ERROR = UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR;

const mintNftIPFS = (payloadData, callback) => {
	let algoClient, account, asset, algoAsset, assetID, optInTxId, assetTransferTxId;
	const data = JSON.parse(payloadData.dataFileURL.json);
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
		createIPFSAsset: (cb) => {
			createIPFSAsset(data.blob, data.assetName).then((res) => {
				asset = res;
				if (!asset || isError(assetID)) return cb(ERROR.APP_ERROR);
				cb();
			});
		},
		createAsset: (cb) => {
			createArc3Asset(algoClient, asset, account).then((res) => {
				algoAsset = res;
				if (!algoAsset || isError(assetID)) return cb(ERROR.APP_ERROR);
				cb();
			});
		},
		signTransaction: (cb) => {
			signAndSendAssetTransaction(algoAsset.algoAsset, algoClient, account).then((res) => {
				assetID = res;
				if (!assetID || isError(assetID)) return cb(ERROR.APP_ERROR);
				cb();
			});
		},
		createSignSendOptInTransaction: (cb) => {
			createSignSendAssetOptInTxn(algoClient, data.receiver, assetID, data.signedLogicSig).then((res) => {
				optInTxId = res;
				if (!optInTxId || isError(assetID)) return cb(ERROR.APP_ERROR);
				cb();
			});
		},
		createSignSendAssetTransferTransaction: (cb) => {
			assetTransferTxId = createSignSendAssetTransferTxn(algoClient, assetID, account.addr, data.receiver, account.sk).then((res) => {
				assetTransferTxId = res;
				if (!assetTransferTxId || isError(assetID)) return cb(ERROR.APP_ERROR);
				cb();
			});
		},
		response: (cb) => {
			respondToServer(payloadData, assetID, cb);
		},
	};
	async.series(tasks, (err, result) => {
		if (err) return callback(err);
		return callback(null, { result });
	});
};

const isError = (e) => {
	return e && e.stack && e.message && typeof e.stack === "string" && typeof e.message === "string";
};

export default {
	mintNftIPFS: mintNftIPFS,
};
