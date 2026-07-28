"use server";
import { s3Client } from "../lib/aws/s3";
import { 
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { sqsClient } from "../lib/aws/sqs";
import { MapUploadType, MapUploadActionResponse, Response, ManifestFileUpload, SQSMessageBody } from "@/types";
import { auth } from "../lib/auth";
import { supabaseClient } from "@/utils/supabase/client";
import { headers } from "next/headers";
import { SendMessageCommand, SQSServiceException } from "@aws-sdk/client-sqs";

interface JSONBodyType {
  type: "JSON";
  data: string;
}

interface ImageBodyType {
  type: "IMAGE";
  contentType: string;
  file: File;
}

type BodyType = JSONBodyType | ImageBodyType;

async function uploadObject(key: string, body: BodyType): Promise<Response> {
  let command: PutObjectCommand;
  let response: Response = { success: false };
  try {
    if (body.type === "IMAGE") {
      const { contentType, file } = body;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });
    } else {
      const { data } = body;
      command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: data,
      });
    }
    await s3Client.send(command);
    response = { success: true };
  } catch (err) {
    if (err instanceof S3ServiceException && err.name === "EntityTooLarge") {
      response = { success: false, message: "Entity Too Large" }
    } else if (err instanceof S3ServiceException) {
      response = { success: false, message: "Error Uploading To S3" }
    } else {
      response = { success: false, message: "Unknown Error" }
    }
  } finally {
    return response;
  }
}

async function createMapJob(id: string, userId: string, manifestFileKey: string): Promise<Response> {
  let response: Response = { success: true }

  const { error } = await supabaseClient
  .from("map_job")
  .upsert({
    id,
    user_id: userId,
    status: "PENDING",
    manifest_file_url: manifestFileKey,
  }, {onConflict: "id", ignoreDuplicates: true});
  if (error) {
    response = { success: false, message: error.message }
  }
  return response
}

async function sendSQSMessage(message: SQSMessageBody) {
  let response: Response = { success: false };
  const command = new SendMessageCommand({
    QueueUrl: process.env.SQS_URL!,
    MessageBody: JSON.stringify(message),
  })
  try {
    await sqsClient.send(command);
    response = { success: true };
  } catch (error) {
    if (error instanceof SQSServiceException) {
      response = { success: false, message: error.message };
    }
  } finally {
    return response;
  }
}

export async function uploadMap(data: MapUploadType) {
  let response: MapUploadActionResponse = { success: false };
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user) {
      const userId = session.user.id;
      const { mapJobId, mapName, image, imageHeight, imageWidth, imageSize, description } = data;
      const sanitizedMapname = mapName.trim().replaceAll(" ", "-").toLocaleLowerCase();
      const imageExtension = image.type.split('/')[1];
      const userDirectoryKey = userId;
      const mapJobDirectoryKey = `${mapJobId}-${userId}`;
      const userMapJobDirectory = [userDirectoryKey, mapJobDirectoryKey].join("/");
      const mapImageKey = `${sanitizedMapname}-master.${imageExtension}`;
      const bucketName = process.env.S3_BUCKET_NAME!;

      // Create image first then manifest file
      const imageUploadData: ImageBodyType = {
        type: "IMAGE",
        contentType: image.type,
        file: image,
      }
      const imageUploadKey = [userMapJobDirectory, mapImageKey].join("/");
      const imagePutResponse = await uploadObject(imageUploadKey, imageUploadData);
      if (!imagePutResponse.success) {
        throw new Error(imagePutResponse.message);
      }

      const manifestData: ManifestFileUpload = {
        mapName,
        userDirectoryKey,
        mapJobDirectoryKey,
        bucketName,
        description,
        mapImageKey,
        mapDimensionsX: imageWidth.toString(),
        mapDimensionsY: imageHeight.toString(),
        mapSize: imageSize.toString(),
      }
      const manifestFileUploadKey = [userDirectoryKey, mapJobDirectoryKey, "manifest.json"].join("/");
      const manifestFileUploadData: JSONBodyType = {
        type: "JSON",
        data: JSON.stringify(manifestData),
      };
      const manifestUploadResponse = await uploadObject(manifestFileUploadKey, manifestFileUploadData);
      if (!manifestUploadResponse.success) {
        throw new Error(manifestUploadResponse.message);
      }
      const mapJobUploadResponse = await createMapJob(mapJobId, userId, manifestFileUploadKey);
      if (!manifestUploadResponse.success) {
        throw new Error(mapJobUploadResponse.message);
      }

      // All thhat is left is creating the mapjob then sending a message to SQS
      const sqsMessageData: SQSMessageBody = {
        mapJobId,
        manifestFileDirPath: manifestFileUploadKey,
        bucket: bucketName,
        userMapJobDirPath: userMapJobDirectory
      };
      const sqsResponse = await sendSQSMessage(sqsMessageData);
      if (!sqsResponse.success) {
        throw new Error(sqsResponse.message);
      }
      response = { success: true, map_job: mapJobId };
    }

  } catch (error) {
    if (error instanceof Error) {
      response = { success: false, message: error.message }
    }
  } finally {
    return response;
  }
}