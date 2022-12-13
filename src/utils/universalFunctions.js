import Boom from "@hapi/boom";
import CONFIG from "../config/index.js";

const sendError = (data) => {
	console.trace("ERROR OCCURED ", data);
	if (typeof data == "object" && data.hasOwnProperty("statusCode") && data.hasOwnProperty("customMessage")) {
		appLogger.info("attaching resposnetype", data.type);
		let errorToSend = new Boom.Boom(data.customMessage, { statusCode: data.statusCode });
		errorToSend.output.payload.responseType = data.type;
		return errorToSend;
	} else {
		let errorToSend = "";
		if (typeof data == "object") {
			if (data.name == "MongoError") {
				errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DB_ERROR.customMessage;
				if ((data.code = 11000)) {
					let duplicateValue = data.errmsg && data.errmsg.substr(data.errmsg.lastIndexOf('{ : "') + 5);
					duplicateValue = duplicateValue.replace("}", "");
					errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DUPLICATE.customMessage + " : " + duplicateValue;
					if (data.message.indexOf("customer_1_streetAddress_1_city_1_state_1_country_1_zip_1") > -1) {
						errorToSend = CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DUPLICATE_ADDRESS.customMessage;
					}
				}
			} else if (data.name == "ApplicationError") {
				errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.APP_ERROR.customMessage + " : ";
			} else if (data.name == "ValidationError") {
				errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.APP_ERROR.customMessage + data.message;
			} else if (data.name == "CastError") {
				errorToSend +=
					CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DB_ERROR.customMessage + CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_ID.customMessage + data.value;
			}
		} else {
			errorToSend = data;
		}
		var customErrorMessage = errorToSend;
		if (typeof customErrorMessage == "string") {
			if (errorToSend.indexOf("[") > -1) {
				customErrorMessage = errorToSend.substr(errorToSend.indexOf("["));
			}
			customErrorMessage = customErrorMessage && customErrorMessage.replace(/"/g, "");
			customErrorMessage = customErrorMessage && customErrorMessage.replace("[", "");
			customErrorMessage = customErrorMessage && customErrorMessage.replace("]", "");
		}
		return new Boom.Boom(customErrorMessage, { statusCode: 400 });
	}
};

const sendSuccess = (successMsg, data) => {
	successMsg = successMsg || CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT.customMessage;
	if (typeof successMsg == "object" && successMsg.hasOwnProperty("statusCode") && successMsg.hasOwnProperty("customMessage")) {
		return { statusCode: successMsg.statusCode, message: successMsg.customMessage, data: data || {} };
	} else {
		return { statusCode: 200, message: successMsg, data: data || {} };
	}
};
const failActionFunction = (request, reply, error) => {
	var customErrorMessage = "";
	if (error.output.payload.message.indexOf("[") > -1) {
		customErrorMessage = error.output.payload.message.substr(error.output.payload.message.indexOf("["));
	} else {
		customErrorMessage = error.output.payload.message;
	}
	customErrorMessage = customErrorMessage.replace(/"/g, "");
	customErrorMessage = customErrorMessage.replace("[", "");
	customErrorMessage = customErrorMessage.replace("]", "");
	error.output.payload.message = customErrorMessage;
	delete error.output.payload.validation;
	return error;
};

const validateString = (str, pattern) => {
	appLogger.info(str, pattern, str.match(pattern));
	return str.match(pattern);
};

const universalFunctions = {
	CONFIG,
	sendError,
	sendSuccess,
	failActionFunction,
	validateString,
};

export default universalFunctions;
