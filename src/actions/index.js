const { BOT_EMOJI, TEMP_FOLDER, OPENAI_API_KEY, CREDENTIALS } = require("../config")
const { extractDataFromMessage, downloadImage, downloadSticker } = require("../utils")
const path = require('path')
const { exec } = require('child_process')
const fs = require('fs')
const axios = require("axios")
const { config } = require("process")
const { Configuration, OpenAIApi } = require("openai")
const { Translate } = require('@google-cloud/translate').v2




class Action {

    constructor(bot, baileysMessage) {
        const { remoteJid, args, isImage, isVideo, isSticker } = extractDataFromMessage(baileysMessage)
        
        this.bot = bot
        this.remoteJid = remoteJid
        this.args = args
        this.isImage = isImage
        this.isSticker = isSticker 
        this.baileysMessage = baileysMessage
    }

    async sticker() {
        if(!this.isImage){
            await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} ❌ Erro! Envie uma imagem!`})
            return
        }

        if (this.isImage){
            const inputPath = await downloadImage(this.baileysMessage, 'input')
            const outputPath = path.resolve(TEMP_FOLDER, 'output.webp')

            exec(`ffmpeg -i ${inputPath} -vf scale=512:512 ${outputPath}`, async (error) => {
                if (error) {
                    await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} ❌ Erro ao converter a imagem para figurinha`})
                    return
                }

                await this.bot.sendMessage(this.remoteJid, {
                    sticker: { url: outputPath }
                })

                fs.unlinkSync(inputPath)
                fs.unlinkSync(outputPath)
        })
    } 
}

        

    async toImage() {
        if(!this.isSticker){
            await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} ❌ Erro! Envie uma figurinha!`})
            return
        }

        const inputPath = await downloadSticker (this.baileysMessage, 'input')
        const outputPath = path.resolve(TEMP_FOLDER, 'output.png')

        exec(`ffmpeg -i ${inputPath} ${outputPath}`, async (error) => {

            if (error) {
                await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} ❌ Erro ao converter a figurinha para imagem`})
                return
            }

            await this.bot.sendMessage(this.remoteJid, {
                image: { url: outputPath }
            })

            fs.unlinkSync(inputPath)
            fs.unlinkSync(outputPath)
        })

    }

    async gpt() {

        await this.bot.sendMessage(this.remoteJid, {
            react: {
                text: '⏳',
                key: this.baileysMessage.key
            }
        })

        const { data } = await axios.post(
            `https://api.openai.com/v1/chat/completions`,
            {
                model: "gpt-3.5-turbo",
                messages: [{role: "user", content: this.args}],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
            }
        )

        await this.bot.sendMessage(this.remoteJid,{
            react: {
                text: "✔️",
                key: this.baileysMessage.key,
            },
        })

        const responseText = data.choices[0].message.content

        await this.bot.sendMessage(this.remoteJid,{
            text: `${BOT_EMOJI} ${responseText}`,
        },
        {
            quoted: this.baileysMessage
        })
    }

    async generateImage() {
        const prompt = this.baileysMessage.message.conversation; // Obtém o prompt da mensagem recebida
    
        await this.bot.sendMessage(this.remoteJid, {
            react: {
                text: '⏳',
                key: this.baileysMessage.key
            }
        });
    
        try {
            // Chame a função que gera a imagem com base no prompt
            const { data } = await axios.post(
                'https://api.openai.com/v1/images/generations',
                {
                    prompt: prompt
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${OPENAI_API_KEY}`
                    }
                }
            );
    
            console.log('Resposta da API:', data);
    
            const imageUrl = data.data[0].url;
    
            // Envia a imagem de volta para o chat do WhatsApp
            await this.bot.sendMessage(this.remoteJid, {
                image: {
                    url: imageUrl
                }
            }, {
                quoted: this.baileysMessage
            });
    
            console.log('Imagem enviada com sucesso');
        } catch (error) {
            console.error('Erro ao gerar a imagem:', error);
    
            await this.bot.sendMessage(this.remoteJid, {
                text: `${BOT_EMOJI} Ocorreu um erro ao gerar a imagem. Por favor, tente novamente.`
            }, {
                quoted: this.baileysMessage
            });
        }
    }

    async translate() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          });
      
          // Inicialize o cliente de tradução
          const translate = new Translate({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });
      
          // Realize a tradução do texto
          const [translation] = await translate.translate(this.args, 'pt-BR') // Traduz para o idioma desejado, neste caso, inglês
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          });
      
          await this.bot.sendMessage(this.remoteJid, {
            text: `${BOT_EMOJI} ${translation}`
          }, {
            quoted: this.baileysMessage
          })
        } catch (error) {
          console.error('Erro durante a tradução:', error)
        }
      }      
   


    } 
module.exports = Action