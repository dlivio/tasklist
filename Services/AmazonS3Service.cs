using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using LumenWorks.Framework.IO.Csv;
using MongoDB.Driver;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Threading.Tasks;
using tasklist.Models;

namespace tasklist.Services
{
	public class AmazonS3Service
	{
		private AmazonS3Client _client;
		private readonly IMongoCollection<Credentials> _credentials;

		public AmazonS3Service(ICredentialsDatabaseSettings settings)
		{
			var client = new MongoClient(settings.ConnectionString);
			var database = client.GetDatabase(settings.DatabaseName);

			_credentials = database.GetCollection<Credentials>(settings.CredentialsCollectionName);

			BasicAWSCredentials awsCreds = GetCredentialsFromDatabase();
			_client = new AmazonS3Client(awsCreds, RegionEndpoint.EUCentral1);
		}

		/// <summary>
		/// Auxiliary method that retrieves the credentials from Database to build and return the 
		/// BasicAWSCredentials object.
		/// </summary>
		/// <returns>a BasicAWSCredentials object with the credentials</returns>
		private BasicAWSCredentials GetCredentialsFromDatabase()
		{
			/*
			var csvTable = new DataTable();

			string test = AppDomain.CurrentDomain.BaseDirectory;

			using var csvReader = new CsvReader(new StreamReader(
				File.OpenRead("./AWSCredentials/user_access_to_s3_credentials.csv") ), true);
			csvTable.Load(csvReader);

			if (csvTable.Rows[1][1] == null || csvTable.Rows[2][1] == null)
			{
				throw new KeyNotFoundException();
			}

			string accessKeyId = csvTable.Rows[1][1].ToString().Trim();
			string secretAccessKey = csvTable.Rows[2][1].ToString().Trim();
			*/

			Credentials cred = _credentials.Find(credentials => true).ToList()[0];

			return new BasicAWSCredentials(cred.Access_key_id, cred.Secret_access_key);
		}

		/// <summary>
		/// Method that fetches the latest sensor information JSON file from AWS S3 and parses it to a 
		/// List of 'AmazonS3SensorInfo' objects. 
		/// 
		/// This method is based on the sample provided at:
		/// https://docs.aws.amazon.com/code-samples/latest/catalog/dotnetv3-S3-GetObjectExample-GetObjectExample-GetObject.cs.html
		/// </summary>
		/// <param name="folderName"></param>
		/// <param name="fileName"></param>
		/// <returns>a list containing the latest sensor information</returns>
		public async Task<List<AmazonS3SensorInfo>> GetSensorInformation(string folderName, string fileName)
		{
			string bucketName = "general-system-data";

			List<AmazonS3SensorInfo> list = new();

			try
			{
				// build the request object with the bucket name and key (path to file) defined in AWS
				GetObjectRequest request = new()
				{
					BucketName = bucketName,
					Key = "processed-data/" + folderName + "/" + fileName,
				};

				// processed-data/SensorBox_01/processed_SensorBox_01_data_07_09_2021_2.json
				// processed-data/SensorBox_01/processed_SensorBox_01_data_07_09_2021_1.json

				using GetObjectResponse response = await _client.GetObjectAsync(request);

				// read the stream and convert it to our structures
				using StreamReader reader = new StreamReader(response.ResponseStream);

				string fakeInfo = "[{\"BoxId\": 1, \"Car\": \"Corvette C4_0\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631005262, \"EndTimestamp\": 1631005432}, {\"BoxId\": 1, \"Car\": \"Corvette C4_0\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631005432, \"EndTimestamp\": 1631005545}, {\"BoxId\": 1, \"Car\": \"Corvette C4_0\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631005545, \"EndTimestamp\": 1631006064}, {\"BoxId\": 1, \"Car\": \"Corvette C4_0\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631006064, \"EndTimestamp\": 1631006064}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631006149, \"EndTimestamp\": 1631006234}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631006234, \"EndTimestamp\": 1631006335}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631006335, \"EndTimestamp\": 1631006758}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631006758, \"EndTimestamp\": 1631007114}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631007114, \"EndTimestamp\": 1631007396}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631007396, \"EndTimestamp\": 1631008119}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631008119, \"EndTimestamp\": 1631008361}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631008361, \"EndTimestamp\": 1631008998}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631008998, \"EndTimestamp\": 1631009061}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631009061, \"EndTimestamp\": 1631009574}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631009574, \"EndTimestamp\": 1631009743}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631009743, \"EndTimestamp\": 1631009839}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631009839, \"EndTimestamp\": 1631009964}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631009964, \"EndTimestamp\": 1631010612}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631010612, \"EndTimestamp\": 1631010686}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631010686, \"EndTimestamp\": 1631011573}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631011573, \"EndTimestamp\": 1631011719}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631011719, \"EndTimestamp\": 1631011866}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631011866, \"EndTimestamp\": 1631012047}, {\"BoxId\": 1, \"Car\": \"Mercedes_32WA83\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631012047, \"EndTimestamp\": 1631012413}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631012701, \"EndTimestamp\": 1631012774}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631012774, \"EndTimestamp\": 1631012954}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631012954, \"EndTimestamp\": 1631013017}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631013017, \"EndTimestamp\": 1631013344}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631013344, \"EndTimestamp\": 1631013417}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631013417, \"EndTimestamp\": 1631014224}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631014224, \"EndTimestamp\": 1631015178}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631015178, \"EndTimestamp\": 1631015291}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631015291, \"EndTimestamp\": 1631015602}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631015602, \"EndTimestamp\": 1631016099}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631016099, \"EndTimestamp\": 1631016183}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631016183, \"EndTimestamp\": 1631016709}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631016709, \"EndTimestamp\": 1631016760}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631016760, \"EndTimestamp\": 1631016811}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631016811, \"EndTimestamp\": 1631017065}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631017065, \"EndTimestamp\": 1631017116}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631017116, \"EndTimestamp\": 1631017251}, {\"BoxId\": 1, \"Car\": \"Aston_25AS19\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631017251, \"EndTimestamp\": 1631017443}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631017505, \"EndTimestamp\": 1631017765}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631017765, \"EndTimestamp\": 1631017828}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631017828, \"EndTimestamp\": 1631018121}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631018121, \"EndTimestamp\": 1631018172}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631018172, \"EndTimestamp\": 1631018246}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631018246, \"EndTimestamp\": 1631018437}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631018437, \"EndTimestamp\": 1631018595}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631018595, \"EndTimestamp\": 1631019036}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631019036, \"EndTimestamp\": 1631019200}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631019200, \"EndTimestamp\": 1631019534}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Polisher\"], \"StartTimestamp\": 1631019534, \"EndTimestamp\": 1631019584}, {\"BoxId\": 1, \"Car\": \"Ferrari_12OE75\", \"Location\": 3, \"Event\": [\"Electric Sander\"], \"StartTimestamp\": 1631019584, \"EndTimestamp\": 1631019584}]";

				list = JsonConvert.DeserializeObject<List<AmazonS3SensorInfo>>(fakeInfo);//reader.ReadToEnd());

				return list;
			}
			catch (AmazonS3Exception ex)
			{
				Console.WriteLine($"Error encountered on server. Message:'{ex.Message}' getting list of objects.");
			}

			return list;
		}
	}
}
