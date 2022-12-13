import async from "async";
import UniversalFunctions from "../../utils/universalFunctions.js";
const ERROR = UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR;
import { connectToAlgorand, getBlockchainAccount, createAndSignTransaction, sendTransaction, respondToServer } from "../../helpers/helperFunctions.js";

/**
 * @param {Object} payloadData
 * @param {String} payloadData.numberToSet
 * @param {Function} callback
 */
const counter = (payloadData, callback) => {
	let data = JSON.parse(payloadData.dataFileURL.json);
	let algoClient;
	let account;
	let transaction;
	let signedTx;
	let txnId;

	const tasks = {
		connectToBlockchain: (cb) => {
			algoClient = connectToAlgorand("", "https://testnet-api.algonode.cloud", 443);
			if (!algoClient) return cb(ERROR.APP_ERROR);
			cb();
		},
		getBlockchainAccount: (cb) => {
			account = getBlockchainAccount();
			if (!account) return cb(ERROR.APP_ERROR);
			cb();
		},
		createAndSignTxn: async (cb) => {
			signedTx = await createAndSignTransaction(algoClient, account, transaction, data, signedTx, cb);
		},
		sendTxn: (cb) => {
			sendTransaction(algoClient, signedTx, txnId, cb);
		},
		response: (cb) => {
			respondToServer(payloadData, cb);
		},
	};
	async.series(tasks, (err, result) => {
		if (err) return callback(err);
		return callback(null, { result });
	});
};

export default counter;
