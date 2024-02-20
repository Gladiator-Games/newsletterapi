const path = require("path");
const express = require("express");
const fs = require("fs");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const util = require("util");
const { createLogger, transports, format } = require("winston");

const app = express();

app.use(express.json());

const limiter = rateLimit({
	windowMs: 24 * 60 * 60 * 1000, // 24 hours
	max: 5,
	message: "Too many requests, please try again after 24 hours",
	headers: true,
});

const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
	host: emailHost,
	port: emailPort,
	secure: true,
	auth: {
		user: emailUser,
		pass: emailPass,
	},
});

const logger = createLogger({
	transports: [new transports.File({ filename: "log.log" })],
	format: format.combine(format.timestamp(), format.json()),
});

const uri = process.env.URI;
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function connectToMongo() {
	try {
		logger.info("Attempting connection");
		await client.connect();
		logger.info("Connected to MongoDB successfully");
	} catch (error) {
		logger.error(`Error occurred connecting to MONGO: ${error}`);
	}
}

connectToMongo();

const db = client.db("newsletter");
const subscribersCollection = db.collection("subscribers");

app.post("/subscribe", limiter, async (req, res) => {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ success: false, message: "Email is required" });
	}

	const isValidEmail = validateEmail(email);
	if (!isValidEmail) {
		return res.status(400).json({ success: false, message: "Invalid email format" });
	}

	try {
		const existingSubscriber = await subscribersCollection.findOne({ email });

		if (existingSubscriber) {
			return res.status(400).json({ success: false, message: "Email already exists" });
		}

		await subscribersCollection.insertOne({ email });

		const unsubscribeUrl = `http://${req.headers.host}/unsubscribe?email=${encodeURIComponent(email)}`; // Generate Unsubscribe URL

		const COMPANY_NAME = process.env.COMPANY_NAME;

		let htmlContent = fs.readFileSync("subscribe.html", "utf8");
		htmlContent = htmlContent.replace(/%EMAILHERE%/g, unsubscribeUrl).replace(/%COMPANYNAME%/g, COMPANY_NAME);

		const fromEmail = process.env.FROM_EMAIL;
		const unsubscribeMailOptions = {
			from: fromEmail,
			to: email,
			subject: "Thank for subscribing to Gladiator Games Newsletter",
			html: htmlContent,
			headers: {
				"List-Unsubscribe": `<${unsubscribeUrl}>`,
			},
		};

		transporter.sendMail(unsubscribeMailOptions, (error, info) => {
			if (error) {
				logger.error(`Error occurred: ${error}`);
			} else {
				logger.info(`Email sent to ${email}: ${info.response}`);
			}
		});

		res.status(200).json({ success: true, message: "Subscribed successfully", email: unsubscribeUrl });
	} catch (error) {
		logger.error(error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
});

app.get("/unsubscribe", async (req, res) => {
	const { email } = req.query;

	if (!email) {
		return res.status(400).json({ success: false, message: "Email is required" });
	}

	try {
		const result = await subscribersCollection.deleteOne({ email });

		if (result.deletedCount === 0) {
			res.status(400).json({ success: false, message: "Email does not exist" });
		}

		var htmlContent = fs.readFileSync("unsubscribe.html", "utf8");
		const COMPANY_NAME = process.env.COMPANY_NAME;
		htmlContent = htmlContent.replace(/%COMPANYNAME%/g, COMPANY_NAME);

		const fromEmail = process.env.FROM_EMAIL;
		const unsubscribeMailOptions = {
			from: fromEmail,
			to: email,
			subject: "You've unsubscribed from Gladiator Game's newsletter",
			html: htmlContent,
		};

		transporter.sendMail(unsubscribeMailOptions, (error, info) => {
			if (error) {
				logger.error(`Error occurred: ${error}`);
			} else {
				logger.info(`Email sent to ${email}: ${info.response}`);
			}
		});

		const htmlFilePath = path.join(__dirname, "unsubscribe.html");

		res.status(200).send(htmlContent);
	} catch (error) {
		logger.error(error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
});

const port = process.env.PORT;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

function validateEmail(email) {
	const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	return re.test(String(email).toLowerCase());
}
