import async from "async";
import UniversalFunctions from "../../utils/universalFunctions.js";
const ERROR = UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR;
import {
	connectToAlgorand,
	createAsset,
	getBlockchainAccount,
	printCreatedAsset,
	printAssetHolding,
	signAndSendTransaction,
} from "../../helpers/helperFunctions.js";

const mintNFT = (payloadData, callback) => {
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
			console.log(assetID + " HELLOOO");
			await printCreatedAsset(algoClient, account.addr, assetID);
			await printAssetHolding(algoClient, account.addr, assetID);
			if (!assetID) return cb(ERROR.APP_ERROR);
		},
	};
	async.series(tasks, (err, result) => {
		if (err) return callback(err);
		return callback(null, { result });
	});
};

export default mintNFT;
