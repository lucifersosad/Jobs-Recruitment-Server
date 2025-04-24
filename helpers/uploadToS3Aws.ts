import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
  }
})

export const putObject = async (file, fileName, type) => {
  try {
    const params: any = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${fileName}`,
      Body: file,
      // ContentType: "image/jpg,jpeg,png"
      // ContentType: "application/pdf"
    }

    switch (type) {
      case "image": 
        params.ContentType = "image/jpg,jpeg,png"
        break;
      case "file": 
        params.ContentType = "application/pdf"
        break;
    }

    const command = new PutObjectCommand(params)
    const data = await s3Client.send(command)

    if (data.$metadata.httpStatusCode !== 200) {
      return
    }

    let url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${params.Key}`
    
    return {url, key: params.Key};

  } catch(error) {
    console.log("🚀 ~ putObject ~ error:", error)
  }
}