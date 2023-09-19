import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import https from 'https';
import fetch from 'node-fetch';
import { capitalizeFirstLetter } from 'src/utils/stringUtils';
import { jsonToCsv } from 'src/utils/conversionUtils';


// Presigned Put URL
export async function createPresignedPutUrlWithClient(
  bucket: string,
  key: string
): Promise<any> {
  try {
    const client = new S3Client({
      region: 'us-east-1'
    });
  
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key
    });
  
    return await getSignedUrl(client, command, {expiresIn: 120});
  }
  catch (err) {
    console.log('Error creating pre-signed PUT Url', err);
  }
};

// Presigned Get URL
export async function createPresignedGetUrlWithClient(
  bucket: string,
  key: string,
  entity: string,
): Promise<any> {
  try {
    const capitalizedEntity = capitalizeFirstLetter(entity)

    const client = new S3Client({
      region: 'us-east-1'
    });
  
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentType: 'text/csv',
      ResponseContentDisposition: `inline; filename=${capitalizedEntity}.csv`
    });
  
    return await getSignedUrl(client, command, {expiresIn: 300});
  }
  catch (err) {
    console.log('Error creating presigned GET Url', err);
  }
};

// Put Object
export async function putObject(
  url: string,
  data: any,
): Promise<any> {
  try {
    return new Promise((resolve, reject) => {
      const contentLength = Buffer.byteLength(data, 'utf-8');
      const req = https.request(
        url,
        {
          method: 'PUT',
          headers: {
            'Content-Length': contentLength,
            'Content-Type': 'text/csv'
          }
        },
        (res) => {
          let responseBody = '';
          res.on('data', (chunk) => {
            responseBody += chunk;
          });
          res.on('end', () => {
            resolve(responseBody);
          });
        }
      );
      req.on('error', (err) => {
        reject(err);
      });
      req.write(data);
      req.end();
    });
  }
  catch (err) {
    console.log('Error putting object into bucket', err)
  }
}

// Fetch Entity Data
export async function fetchData(
  entity: string,
  skip: number,
  take: number
): Promise<any> {
  try {
    const baseUrl = process.env.BASE_URL!;
    const url = `${baseUrl}${entity}?skip=${skip}&take=${take}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  }
  catch (err) {
    console.log('Error fetching data', err)
  }
}