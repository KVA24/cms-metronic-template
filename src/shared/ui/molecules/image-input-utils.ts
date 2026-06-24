import { MutableRefObject } from 'react';
import { ImageInputFiles } from './image-input';

export const openFileDialog = (
  inputRef: MutableRefObject<HTMLInputElement | null>,
): void => {
  if (!inputRef.current) {
    return;
  }
  inputRef.current.click();
};

export const getAcceptTypeString = (
  acceptType?: string[],
  allowNonImageType?: boolean,
) => {
  if (acceptType?.length)
    return acceptType.map((item) => `.${item}`).join(', ');
  if (allowNonImageType) return '';
  return 'image/*';
};

export const getBase64 = async (file: File): Promise<string> => {
  const reader = new FileReader();
  return await new Promise((resolve, reject) => {
    const handleLoad = () => {
      resolve(String(reader.result));
      cleanup();
    };
    
    const handleError = () => {
      reject(new Error('Failed to read file'));
      cleanup();
    };
    
    const cleanup = () => {
      reader.removeEventListener('load', handleLoad);
      reader.removeEventListener('error', handleError);
    };
    
    reader.addEventListener('load', handleLoad);
    reader.addEventListener('error', handleError);
    reader.readAsDataURL(file);
  });
};

export const getImage = async (file: File): Promise<HTMLImageElement> => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  
  return await new Promise((resolve, reject) => {
    const handleLoad = () => {
      URL.revokeObjectURL(objectUrl); // Clean up object URL
      resolve(image);
      cleanup();
    };
    
    const handleError = () => {
      URL.revokeObjectURL(objectUrl); // Clean up object URL
      reject(new Error('Failed to load image'));
      cleanup();
    };
    
    const cleanup = () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
    
    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);
    image.src = objectUrl;
  });
};

export const getListFiles = async (
  files: FileList,
  dataURLKey: string,
): Promise<ImageInputFiles> => {
  const promiseFiles: Array<Promise<string>> = [];
  for (let i = 0; i < files.length; i += 1) {
    promiseFiles.push(getBase64(files[i]));
  }
  return await Promise.all(promiseFiles).then((fileListBase64: string[]) => {
    const fileList: ImageInputFiles = fileListBase64.map((base64, index) => ({
      [dataURLKey]: base64,
      file: files[index],
    }));
    return fileList;
  });
};
