
const { PREFIX, TEMP_FOLDER } = require('../config')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const path = require('path')
const { writeFile } = require('fs/promises')
const { write } = require('fs')
const ffmpeg = require('fluent-ffmpeg')

function extractDataFromMessage(baileysMessage) {
    const textMessage = baileysMessage.message?.conversation
    const extendedTextMessage = baileysMessage.message?.extendedTextMessage?.text
    const imageTextMessage = baileysMessage.message?.imageMessage?.caption
    const audioTextMessage = baileysMessage.message?.videoTextMessage?.caption

    const fullMessage = textMessage || extendedTextMessage || imageTextMessage || audioTextMessage;

    if (!fullMessage) {
        return {
            remoteJid: '',
            fullMessage: '',
            command: '',
            args: '',
            isImage: false,
            isSticker: false,
            isAudio : false
        }
    }

    const isImage = is(baileysMessage, 'image')
    const isSticker = is(baileysMessage, 'sticker')
    const isAudio = is(baileysMessage, 'audio')

    const [command, ...args] = fullMessage.trim().split(' ')

    const arg = args.reduce((acc, arg) => acc + ' ' + arg, '').trim();

    return {
        remoteJid: baileysMessage?.key?.remoteJid,
        fullMessage,
        command: command.replace(PREFIX, '').trim(),
        args: arg.trim(),
        isImage,
        isAudio,
        isSticker
    }

}

function is(baileysMessage, context) {
    return !!baileysMessage.message?.[`${context}Message`] ||
         !!baileysMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[`${context}Message`]
}

function getContent(baileysMessage, context) {
    return baileysMessage.message?.[`${context}Message`] ||
         baileysMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[`${context}Message`]
}

function isCommand(baileysMessage){
    const { fullMessage } = extractDataFromMessage(baileysMessage)

    return fullMessage && fullMessage.startsWith(PREFIX)
}

async function downloadMessage(baileysMessage, fileName) {
    if (baileysMessage.message?.conversation) {
      const text = baileysMessage.message.conversation;
      const filePath = path.resolve(TEMP_FOLDER, fileName);
      fs.writeFileSync(filePath, text);
      return filePath;
    }
    return ''; // Retorna uma string vazia em vez de null
  }
  
async function downloadImage(baileysMessage, fileName){
    const content = getContent (baileysMessage, 'image')

    if (!content) {
        return null
    }

    const stream = await downloadContentFromMessage(content, 'image')

    let buffer = Buffer.from([])

    for await (const chunk of stream){
        buffer = Buffer.concat([buffer, chunk])
    }

    const filePath = path.resolve(TEMP_FOLDER, `${fileName}.png`)

    await writeFile(filePath, buffer)

    return filePath
}

async function downloadSticker(baileysMessage, fileName){
    const content = getContent (baileysMessage, 'sticker')

    if (!content) {
        return null
    }

    const stream = await downloadContentFromMessage(content, 'sticker')

    let buffer = Buffer.from([])

    for await (const chunk of stream){
        buffer = Buffer.concat([buffer, chunk])
    }

    const filePath = path.resolve(TEMP_FOLDER, `${fileName}.webp`)

    await writeFile(filePath, buffer)

    return filePath
}

async function downloadAudio(baileysMessage, fileName){
    const content = getContent (baileysMessage, 'audio')

    if (!content) {
        return null
    }

    const stream = await downloadContentFromMessage(content, 'audio')

    let buffer = Buffer.from([])

    for await (const chunk of stream){
        buffer = Buffer.concat([buffer, chunk])
    }

    const filePath = path.resolve(TEMP_FOLDER, `${fileName}`)

    await writeFile(filePath, buffer)

    return filePath
}

  async function convertAudioToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioChannels(1) // Define o número de canais como 1 (mono)
      .toFormat('wav')
      .on('error', error => reject(error))
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
}

    async function downloadPDF(baileysMessage, fileName) {
        try {
            const content = getContent(baileysMessage, 'document');
        
            if (!content) {
            console.error('No content found in message');
            return null;
            }
        
            const stream = await downloadContentFromMessage(content, 'document');
        
            if (!stream) {
            console.error('Failed to download content from message');
            return null;
            }
        
            let buffer = Buffer.from([]);
        
            for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
            }
        
            const filePath = path.resolve(TEMP_FOLDER, `${fileName}.pdf`);
        
            await writeFile(filePath, buffer);
        
            return filePath;
        } catch (error) {
            console.error('An error occurred:', error);
            return null;
        }
    }

    function extractVideoId(url) {
        const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

  
module.exports = {
    downloadSticker,
    downloadImage,
    downloadAudio,
    downloadMessage,
    downloadPDF,
    extractDataFromMessage,
    extractVideoId,
    convertAudioToWav,
    isCommand
}
