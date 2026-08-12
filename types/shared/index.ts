import { email, int, number, z } from 'zod';
import { FeatureAction, MapAction } from '../frontend';

export const SessionUser = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().nullish()
});

export type SessionUserType = z.infer<typeof SessionUser>;

export const blipFeatureFormValidationSchema = z.object({
  title: z.string().max(100),
  description: z.string().max(500),
  imageFiles: z.unknown().transform(value => {
    return value as FileList;
  }),
  audioFiles: z.unknown().transform(value => {
    return value as FileList;
  }),
  videoFiles: z.unknown().transform(value => {
    return value as FileList;
  }),
});

// Account Creation Types
export const usernameValidation = z
  .string()
  .min(3, { error: "Username Too Short" })
  .max(32, { error: "Username Too Long" })
  .regex(
    /^[a-zA-Z0-9]{3,32}$/,
    { error:  "Username must not contain special characters"}
  )
  .optional()

export const passwordValidation = z
  .string()
  .min(8, { error: "Password Too Short" })
  .max(50, { error: "Password Too Long" })
  .regex(/^(?=.*[A-Z]).{8,}$/, { error: "Password Must Contain At Least 1 Uppercase letter" })

export const accountCreationValidationSchema = z.object({
  username: usernameValidation,
  email: z.email(),
  password: passwordValidation,
});

export const loginValidationSchema = z.object({
  email: z.email(),
  password: passwordValidation,
  rememberMe: z.literal(["on", "off"]),
})

export const uploadMapValidationSchema = z.object({
  mapJobId: z.uuid(),
  mapName: z.string(),
  image: z.instanceof(File),
  description: z.string().max(256).nullable(),
  imageWidth: z.number(),
  imageHeight: z.number(),
  imageSize: z.number(),
});

export interface PublishedMap {
  id: string;
  manifest_path: string;
  img_thumbnail_path: string;
  official: boolean | null;
  description: string | null;
  name: string | null;
  user_id: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserMapJoinTable | null;
}

interface UserMapJoinTable {
  name: string | null ;
  username: string | null;
  id: string;
}

export interface MapInstance {
  id: string;
  user_id: string | null;
  map_id: string | null;
  visible: boolean;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserMapJoinTable | null
}

export interface MapInstanceCreate {
  id: string;
  user_id: string;
  map_id: string;
  name: string;
}

export interface MapInstanceUpdate {
  id: string;
  user_id: string;
  name?: string;
  visible?: boolean
}

export interface MapUpdate {
  id: string;
  user_id: string;
  name?: string;
  description?: string;
}

export type MapUploadType = z.infer<typeof uploadMapValidationSchema>;

export interface Response {
  success: boolean,
  message?: string;
}

export interface MapUploadActionResponse { 
  success: boolean;
  map_job?: string;
  message?: string;
}

export interface ManifestFileUpload {
  mapName: string;
  userDirectoryKey: string;
  mapJobDirectoryKey: string;
  description: string | null;
  bucketName: string;
  mapImageKey: string;
  mapDimensionsX: string;
  mapDimensionsY: string;
  mapSize: string;
}

export interface ManifestFile extends ManifestFileUpload {
  mapDirectoryKey: string;
}

export interface FeatureCreate {
  id: string;
  user_id: string;
  map_instance_id: string;
  value: string;
  action: FeatureAction;
}

export interface SQSMessageBody {
  mapJobId: string;
  manifestFileDirPath: string;
  bucket: string;
  userMapJobDirPath: string;
}

export type JobStatus = "PENDING" | "PROCESSING" | "FAILED" | "COMPLETED"

export interface ImageBodyType {
  type: "IMAGE";
  contentType: string;
  file: File;
};