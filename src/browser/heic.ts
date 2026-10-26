const heicHeaders = ["ftypmif1", "ftypmsf1", "ftypheic", "ftypheix", "ftyphevc", "ftyphevx"];

export const isHeicImage = (buffer: ArrayBuffer): boolean => {
  const header = new Uint8Array(buffer.slice(4, 12)).reduce(
    (result, byte) => result + String.fromCharCode(byte),
    "",
  );
  return heicHeaders.includes(header);
};

export const convertHeicImage = async (buffer: ArrayBuffer): Promise<string> => {
  const heic2any = (await import("heic2any")).default;
  const blob = await heic2any({ blob: new Blob([buffer]), toType: "image/png" });
  if (Array.isArray(blob)) throw new Error("HEIC conversion returned multiple images");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unable to read converted image"));
    };
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error("Image reading aborted"));
    reader.readAsDataURL(blob);
  });
};
