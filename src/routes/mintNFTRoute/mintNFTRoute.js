import UniversalFunctions from "../../utils/universalFunctions.js";
import Joi from "joi";
import Controller from "../../controllers/index.js";
const Config = UniversalFunctions.CONFIG;

const mintNFT = {
	method: "POST",
	path: "/api/demo/createArc3Asset",
	options: {
		description: "create an arc3 asset on the algorand testnet",
		tags: ["api"],
		handler: function (request, h) {
			var payloadData = request.payload;
			return new Promise((resolve, reject) => {
				Controller.MintNFTController.createAlgoAsset(payloadData, function (err, data) {
					if (err) reject(UniversalFunctions.sendError(err));
					else resolve(UniversalFunctions.sendSuccess(Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data));
				});
			});
		},
		validate: {
			payload: Joi.object({
				unitName: Joi.string().required(),
				assetName: Joi.string().required(),
				url: Joi.string().required(),
			}).label("Demo Model"),
			failAction: UniversalFunctions.failActionFunction,
		},
		plugins: {
			"hapi-swagger": {
				responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages,
			},
		},
	},
};

const mintNftIPFS = {
	method: "POST",
	path: "/api/demo/mintNftIPFS",
	options: {
		description: "mint a non fungible token using algorand to IPFS",
		tags: ["api"],
		handler: function (request, h) {
			var payloadData = request.payload;
			return new Promise((resolve, reject) => {
				Controller.MintNFTController.mintNftIPFS(payloadData, function (err, data) {
					if (err) reject(UniversalFunctions.sendError(err));
					else resolve(UniversalFunctions.sendSuccess(Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data));
				});
			});
		},
		// validate: {
		// 	payload: Joi.object({
		// 		unitName: Joi.string().required(),
		// 		assetName: Joi.string().required(),
		// 		url: Joi.string().required(),
		// 	}).label("Demo Model"),
		// 	failAction: UniversalFunctions.failActionFunction,
		// },
		plugins: {
			"hapi-swagger": {
				responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages,
			},
		},
	},
};

export default [mintNFT, mintNftIPFS];
