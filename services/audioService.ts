/**
 * Decodes a base64 string into a raw byte array.
 */
function decodeBase64(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    throw new Error("فشل في فك تشفير بيانات الصوت (Base64 invalid).");
  }
}

/**
 * Decodes raw PCM audio data into an AudioBuffer using AudioContext.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  try {
    // Convert Uint8Array to Int16Array (PCM 16-bit)
    const dataInt16 = new Int16Array(data.buffer);
    
    // Create an AudioBuffer
    const buffer = ctx.createBuffer(numChannels, dataInt16.length, sampleRate);
    
    // Fill the buffer with data (normalized to -1.0 to 1.0)
    const channelData = buffer.getChannelData(0); // Assuming mono for TTS
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    
    return buffer;
  } catch (error) {
    console.error("Audio Decoding Error:", error);
    throw new Error("فشل في معالجة بيانات الصوت (Decoding Error).");
  }
}

/**
 * Plays PCM Audio Data from Base64 string.
 */
export const playAudioFromBase64 = async (base64Audio: string, sampleRate: number = 24000): Promise<void> => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  
  if (!AudioContextClass) {
    throw new Error("عذراً، متصفحك لا يدعم تشغيل الصوت.");
  }

  if (!base64Audio) {
    throw new Error("لا توجد بيانات صوتية لتشغيلها.");
  }

  const audioContext = new AudioContextClass({ sampleRate });

  try {
    const bytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(bytes, audioContext, sampleRate);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
    
    // Return a promise that resolves when audio finishes
    return new Promise((resolve, reject) => {
        source.onended = () => {
            resolve();
            audioContext.close().catch(console.error);
        };
        source.onabort = () => {
            resolve(); // Treat stop as resolved
            audioContext.close().catch(console.error);
        }
    });

  } catch (error: any) {
    await audioContext.close().catch(() => {}); // Ensure cleanup
    console.error("Error playing audio:", error);
    throw new Error(error.message || "حدث خطأ غير متوقع أثناء تشغيل الصوت.");
  }
};