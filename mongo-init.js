db = db.getSiblingDB('TasklistDb');

db.createCollection('Credentials');

db.Credentials.insertOne(
		{
			username: "s3-processed-data-read-access-user",
			access_key_id: "AKIA3XRN4IIB6P4QEL46",
			secret_access_key: "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"
		}
);