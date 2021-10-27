db = db.getSiblingDB('TasklistDb');

db.createCollection('Credentials');

db.Credentials.insertOne(
		{
			username: "s3-processed-data-read-access-user",
			access_key_id: "AKIA3XRN4IIBWSRT3QOA",
			secret_access_key: "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"
		}
);