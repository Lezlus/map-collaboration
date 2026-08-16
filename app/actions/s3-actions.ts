"use server";

import { s3Client } from "../lib/aws/s3";
import { PutObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ImageBodyType } from "@/types";
import { nanoid } from "nanoid";


interface S3ResponseFail {
  success: "NO";
  message?: string;
}

interface S3ResponsePass {
  success: "YES";
  url: string;
  s3Key: string;
  file: File;
}

type S3PreSignedURLResponse = S3ResponseFail | S3ResponsePass;

export async function generatePreSignedPutObjectUrl(userId: string, body: ImageBodyType): Promise<S3PreSignedURLResponse> {

  try {
    const { contentType, file } = body;
    const fileExtension = file.type.split("/")[1];
    const key = [userId, "images", `${nanoid()}.${fileExtension}`].join('/');
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    return {
      success: "YES",
      url,
      s3Key: key,
      file
    }
  } catch (err) {
    let response: S3ResponseFail = { success: "NO" };
    if (err instanceof S3ServiceException && err.name === "EntityTooLarge") {
      response = { ...response, message: "Entity Too Large" }
    } else if (err instanceof S3ServiceException) {
      response = { ...response, message: "Error Uploading To S3" }
    } else {
      response = { ...response, message: "Unknown Error" }
    }
    return response;
  } 
}