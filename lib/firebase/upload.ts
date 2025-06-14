import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const uploadMultipleFiles = async (
  files: File[],
  basePath: string
): Promise<string[]> => {
  const uploadPromises = files.map((file, index) => {
    const path = `${basePath}/${Date.now()}_${index}_${file.name}`;
    return uploadFile(file, path);
  });

  return Promise.all(uploadPromises);
};

export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
}; 