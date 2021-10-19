using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using LumenWorks.Framework.IO.Csv;
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

		public AmazonS3Service()
		{
			BasicAWSCredentials awsCreds = GetCredentialsFromCSV();
			_client = new AmazonS3Client(awsCreds, RegionEndpoint.EUCentral1);
		}

		/// <summary>
		/// Auxiliary method that retrieves the credentials from the CSV file defined previously.
		/// </summary>
		/// <returns>a BasicAWSCredentials object with the credentials</returns>
		private static BasicAWSCredentials GetCredentialsFromCSV()
		{
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

			return new BasicAWSCredentials(accessKeyId, secretAccessKey);
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
					Key = "processed-data/" + folderName + "/" + fileName,// processed-data/SensorBox_01/processed_SensorBox_01_data_07_09_2021_2.json
				};

				using GetObjectResponse response = await _client.GetObjectAsync(request);

				// read the stream and convert it to our structures
				using StreamReader reader = new StreamReader(response.ResponseStream);
				list = JsonConvert.DeserializeObject<List<AmazonS3SensorInfo>>(reader.ReadToEnd());

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
