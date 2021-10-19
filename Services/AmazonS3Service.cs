using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using LumenWorks.Framework.IO.Csv;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace tasklist.Services
{
	public class AmazonS3Service
	{
		private AmazonS3Client _client;

		public AmazonS3Service()
		{
			BasicAWSCredentials awsCreds = getCredentialsFromCSV();
			_client = new AmazonS3Client(awsCreds, RegionEndpoint.EUCentral1);
		}

		/// <summary>
		/// 
		/// </summary>
		/// <returns></returns>
		private BasicAWSCredentials getCredentialsFromCSV()
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

		// POST: api/Tasks/Sensor/SensorBox_01/processed_SensorBox_01_data_07_09_2021_2.json
		/// <summary>
		/// 
		/// https://docs.aws.amazon.com/code-samples/latest/catalog/dotnetv3-S3-ListObjectsExample-ListObjectsExample-ListObjects.cs.html
		/// </summary>
		/// <param name="folderName"></param>
		/// <param name="fileName"></param>
		/// <returns></returns>
		public async Task NewSensorInformationAvailable(string folderName, string fileName)
		{
			string bucketName = "general-system-data";

			try
			{
				GetObjectRequest request = new()
				{
					BucketName = bucketName,
					Key = "processed-data/" + folderName + "/" + fileName,// processed-data/SensorBox_01/processed_SensorBox_01_data_07_09_2021_2.json
				};

				// Issue request and remember to dispose of the response
				using GetObjectResponse response = await _client.GetObjectAsync(request);

				using StreamReader reader = new StreamReader(response.ResponseStream);

				string contents = reader.ReadToEnd();
			}
			catch (AmazonS3Exception ex)
			{
				Console.WriteLine($"Error encountered on server. Message:'{ex.Message}' getting list of objects.");
			}

		}
	}
}
