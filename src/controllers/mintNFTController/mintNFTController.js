import async from "async";
import UniversalFunctions from "../../utils/universalFunctions.js";
import {
	connectToAlgorand,
	createAsset,
	getBlockchainAccount,
	signAndSendTransaction,
	createIPFSAsset,
	createArc3Asset,
} from "../../helpers/helperFunctions.js";
const ERROR = UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR;

const createAlgoAsset = (payloadData, callback) => {
	let algoClient, account, asset, assetID;

	const tasks = {
		connectToBlockchain: (cb) => {
			algoClient = connectToAlgorand("", "https://testnet-api.algonode.cloud", 443);
			if (!algoClient) return cb(ERROR.APP_ERROR);
			cb();
		},
		getAccount: async (cb) => {
			account = await getBlockchainAccount();
			if (!account) return cb(ERROR.APP_ERROR);
		},
		createAsset: async (cb) => {
			asset = await createAsset(payloadData, algoClient, account);
			if (!asset) return cb(ERROR.APP_ERROR);
		},
		signTransaction: async (cb) => {
			assetID = await signAndSendTransaction(asset, algoClient, account);
			if (!assetID) return cb(ERROR.APP_ERROR);
		},
	};
	async.series(tasks, (err, result) => {
		if (err) return callback(err);
		return callback(null, { result });
	});
};

const mintNftIPFS = (payloadData, callback) => {
	let algoClient, account, asset, algoAsset, assetID;
	const tasks = {
		connectToBlockchain: (cb) => {
			algoClient = connectToAlgorand("", "https://testnet-api.algonode.cloud", 443);
			if (!algoClient) return cb(ERROR.APP_ERROR);
			cb();
		},
		getAccount: async (cb) => {
			account = await getBlockchainAccount();
			if (!account) return cb(ERROR.APP_ERROR);
		},
		createIPFSAsset: async (cb) => {
			asset = await createIPFSAsset();
			if (!asset) return cb(ERROR.APP_ERROR);
		},
		createAsset: async (cb) => {
			algoAsset = await createArc3Asset(asset, account);
			if (!algoAsset) return cb(ERROR.APP_ERROR);
		},
		signTransaction: async (cb) => {
			assetID = await signAndSendTransaction(algoAsset.algoAsset, algoClient, account);
			if (!assetID) return cb(ERROR.APP_ERROR);
		},
	};
	async.series(tasks, (err, result) => {
		if (err) return callback(err);
		return callback(null, { result });
	});
};

export default {
	createAlgoAsset: createAlgoAsset,
	mintNftIPFS: mintNftIPFS,
};
