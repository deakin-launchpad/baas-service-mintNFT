import async from "async";
import UniversalFunctions from "../../utils/universalFunctions.js";
const ERROR = UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR;
import { connectToAlgorand, createAsset, getBlockchainAccount, printCreatedAsset, printAssetHolding } from "../../helpers/helperFunctions.js";
import algosdk from "algosdk";

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
			console.log("=== SIGN AND CONFRIM TRANSACTION ===");
			const rawSignedTxn = asset.signTxn(account.sk);
			const tx = await algoClient.sendRawTransaction(rawSignedTxn).do();
			const confirmedTxn = await algosdk.waitForConfirmation(algoClient, tx.txId, 4);

			console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
			assetID = confirmedTxn["asset-index"];

			await printCreatedAsset(algoClient, account.addr, assetID);
			await printAssetHolding(algoClient, account.addr, assetID);
			// nft is deployed now needs to be owned by user
		},
	};
	async.series(tasks, (err, result) => {
		if (err) return callback(err);
		return callback(null, { result });
	});
};

export default mintNFT;
