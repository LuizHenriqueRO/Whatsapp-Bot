const { BOT_EMOJI, TEMP_FOLDER, OPENAI_API_KEY, CREDENTIALS, YTAPI1, YTAPI2 } = require("../config")
const { extractDataFromMessage, downloadImage, downloadSticker, downloadAudio, convertAudioToWav, extractVideoId } = require("../utils")
const path = require('path')
const { exec } = require('child_process')
const fs = require('fs')
const axios = require("axios")
const { config } = require("process")
const { Configuration, OpenAIApi } = require("openai")
const { Translate } = require('@google-cloud/translate').v2
const speech = require('@google-cloud/speech')
const { SpeechClient } = require('@google-cloud/speech')
const { v1 } = require('@google-cloud/vision')
const { getContentType } = require("@whiskeysockets/baileys")
const { TextToSpeechClient } = require('@google-cloud/text-to-speech')
const { v4: uuidv4 } = require('uuid');
const { collection, query, where, getDocs } = require("firebase/firestore");
const { Database } = require('../firebase');

class Action {

    constructor(bot, baileysMessage) {
        const { remoteJid, args, isImage, isAudio, isSticker } = extractDataFromMessage(baileysMessage)
        
        this.bot = bot
        this.remoteJid = remoteJid
        this.args = args
        this.isImage = isImage
        this.isSticker = isSticker 
        this.isAudio = isAudio
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
                text: "✅",
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

    async translatePt() {
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
        const [translation] = await translate.translate(this.args, 'pt_BR') // Traduz para o idioma desejado, neste caso, inglês
    
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
        
    async translateEng() {
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
        const [translation] = await translate.translate(this.args, 'en-US') // Traduz para o idioma desejado, neste caso, inglês
    
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

      async audiotexto() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          })

          const client = new SpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          })
      
          // Caminho do arquivo de áudio OGG
          const inputPath = await downloadAudio(this.baileysMessage, 'input')
      
          // Caminho de saída para o arquivo convertido em WAV
          const outputPath = path.resolve(TEMP_FOLDER, 'output.wav')
      
          // Converter o áudio para WAV
          await convertAudioToWav(inputPath, outputPath)

          // Realiza a transcrição do áudio para texto
          const config = {
            encoding: 'LINEAR16',
            languageCode: 'pt-BR',
            enableAutomaticPunctuation: true
          }
      
          const request = {
            audio: {
              content: fs.readFileSync(outputPath).toString('base64')
            },
            config: config
          }
      
          const [response] = await client.recognize(request);
          const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          })
      
          await this.bot.sendMessage(this.remoteJid, {
            text: `${BOT_EMOJI} ${transcription}`
          }, {
            quoted: this.baileysMessage
          })
        } catch (error) {
          console.error('Erro durante a transcrição:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Audio muito longo, por favor, envie um áudio com até 1 minuto`})
        }
      }

      async audiotext() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          })

          const client = new SpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          })
      
          // Caminho do arquivo de áudio OGG
          const inputPath = await downloadAudio(this.baileysMessage, 'input')
      
          // Caminho de saída para o arquivo convertido em WAV
          const outputPath = path.resolve(TEMP_FOLDER, 'output.wav')
      
          // Converter o áudio para WAV
          await convertAudioToWav(inputPath, outputPath)

          // Realiza a transcrição do áudio para texto
          const config = {
            encoding: 'LINEAR16',
            languageCode: 'en-US',
            enableAutomaticPunctuation: true
          }
      
          const request = {
            audio: {
              content: fs.readFileSync(outputPath).toString('base64')
            },
            config: config
          }
      
          const [response] = await client.recognize(request);
          const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          })
      
          await this.bot.sendMessage(this.remoteJid, {
            text: `${BOT_EMOJI} ${transcription}`
          }, {
            quoted: this.baileysMessage
          })
        } catch (error) {
          console.error('Erro durante a transcrição:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Audio muito longo, por favor, envie um áudio com até 1 minuto`})
        }
      }

      async audiotextpt() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          })

          const client = new SpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          })
      
          // Caminho do arquivo de áudio OGG
          const inputPath = await downloadAudio(this.baileysMessage, 'input')
      
          // Caminho de saída para o arquivo convertido em WAV
          const outputPath = path.resolve(TEMP_FOLDER, 'output.wav')
      
          // Converter o áudio para WAV
          await convertAudioToWav(inputPath, outputPath)

          // Realiza a transcrição do áudio para texto
          const config = {
            encoding: 'LINEAR16',
            languageCode: 'en-US',
            enableAutomaticPunctuation: true
          }
      
          const request = {
            audio: {
              content: fs.readFileSync(outputPath).toString('base64')
            },
            config: config
          }
      
          const [response] = await client.recognize(request);
          const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

          const translate = new Translate({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });

          const [translation] = await translate.translate(transcription, 'pt-BR')
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          })
      
          await this.bot.sendMessage(this.remoteJid, {
            text: `${BOT_EMOJI} ${translation}`
          }, {
            quoted: this.baileysMessage
          })
        } catch (error) {
          console.error('Erro durante a transcrição:', error);
        }
      }

      async audiotexting() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          })

          const client = new SpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          })
      
          // Caminho do arquivo de áudio OGG
          const inputPath = await downloadAudio(this.baileysMessage, 'input')
      
          // Caminho de saída para o arquivo convertido em WAV
          const outputPath = path.resolve(TEMP_FOLDER, 'output.wav')
      
          // Converter o áudio para WAV
          await convertAudioToWav(inputPath, outputPath)

          // Realiza a transcrição do áudio para texto
          const config = {
            encoding: 'LINEAR16',
            languageCode: 'pt-BR',
            enableAutomaticPunctuation: true
          }
      
          const request = {
            audio: {
              content: fs.readFileSync(outputPath).toString('base64')
            },
            config: config
          }
      
          const [response] = await client.recognize(request);
          const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

          const translate = new Translate({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });

          const [translation] = await translate.translate(transcription, 'en-US')
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          })
      
          await this.bot.sendMessage(this.remoteJid, {
            text: `${BOT_EMOJI} ${translation}`
          }, {
            quoted: this.baileysMessage
          })
        } catch (error) {
          console.error('Erro durante a transcrição:', error);
        }
      }

      async gvisiontext() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          });

          const inputPath = await downloadImage(this.baileysMessage, 'input')
          const outputPath = path.resolve(TEMP_FOLDER, 'output.webp')
      
          // Inicialize o cliente do Google Vision
          const visionClient = new v1.ImageAnnotatorClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.project_id
          });
      
          // Realize a análise da imagem
          const [result] = await visionClient.textDetection(inputPath, {});
          const textAnnotations = result.textAnnotations;
          const extractedText = textAnnotations ? textAnnotations[0].description : 'Nenhum texto encontrado na imagem.';
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          });
      
          await this.bot.sendMessage(this.remoteJid, {
            text: `${BOT_EMOJI} ${extractedText}`
          }, {
            quoted: this.baileysMessage
          });
        } catch (error) {
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Nenhum texto encontrado na imagem`})
          console.error('Erro durante a análise da imagem:', error);
        }
      }
      
      async gvisionobject() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          });
      
          const inputPath = await downloadImage(this.baileysMessage, 'input')
      
          // Inicialize o cliente do Google Vision
          const visionClient = new v1.ImageAnnotatorClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.project_id
          });

          // Realize a análise da imagem para identificação de objetos
          const [result] = await visionClient.objectLocalization(inputPath)
      
          const objects = result.localizedObjectAnnotations;
      
          if (objects && objects.length > 0) {
            const detectedObjects = objects.map((object) => object.name).join(', ')
      
            await this.bot.sendMessage(this.remoteJid, {
              react: {
                text: '✅',
                key: this.baileysMessage.key
              }
            });

            const translate = new Translate({
              credentials: CREDENTIALS,
              projectId: CREDENTIALS.project_id
            });

            const [translation] = await translate.translate(detectedObjects, 'pt_BR')
      
            await this.bot.sendMessage(this.remoteJid, {
              text: `${BOT_EMOJI} Objetos detectados: ${translation}`
            }, {
              quoted: this.baileysMessage
            })
          } else {
      
            await this.bot.sendMessage(this.remoteJid, {
              text: `${BOT_EMOJI} Nenhum objeto detectado na imagem`
            });
          }
        } catch (error) {
          console.error('Erro durante a análise da imagem:', error);
        }
      }

      async textaudioA() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          });
      
          const client = new TextToSpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });
      
          // Configuração da requisição
          const request = {
            input: { text: this.args },
            voice: { languageCode: 'pt-BR', name: 'pt-BR-Neural2-A' },
            audioConfig: {
              audioEncoding: 'OGG_OPUS', // Utiliza o formato OGG com codec Opus
              sampleRateHertz: 44100,    // Taxa de amostragem de 44100 Hz
              bitrateBps: 32000          // Bitrate fixo de 32 kbps
            }
          };
      
          // Realiza a síntese de fala
          const [response] = await client.synthesizeSpeech(request);
      
          // Caminho do arquivo de saída de áudio
          const outputPath = path.resolve(TEMP_FOLDER, 'output.ogg');
      
          // Salva o áudio no arquivo de saída
          fs.writeFileSync(outputPath, response.audioContent, 'binary');
      
          // Envia o áudio como resposta no WhatsApp
          await this.bot.sendMessage(this.remoteJid, {
            audio: {
              url: outputPath
            }
          });
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          });
      
          return outputPath;
        } catch (error) {
          console.error('Erro durante a síntese de fala:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Texto muito longo, envie um menor`})
          return null;
        }
      }
      
      async textaudioB() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          });
      
          const client = new TextToSpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });
      
          // Configuração da requisição
          const request = {
            input: { text: this.args },
            voice: { languageCode: 'pt-BR', name: 'pt-BR-Neural2-B' },
            audioConfig: {
              audioEncoding: 'OGG_OPUS', // Utiliza o formato OGG com codec Opus
              sampleRateHertz: 44100,    // Taxa de amostragem de 44100 Hz
              bitrateBps: 32000          // Bitrate fixo de 32 kbps
            }
          };
      
          // Realiza a síntese de fala
          const [response] = await client.synthesizeSpeech(request);
      
          // Caminho do arquivo de saída de áudio
          const outputPath = path.resolve(TEMP_FOLDER, 'output.ogg');
      
          // Salva o áudio no arquivo de saída
          fs.writeFileSync(outputPath, response.audioContent, 'binary');
      
          // Envia o áudio como resposta no WhatsApp
          await this.bot.sendMessage(this.remoteJid, {
            audio: {
              url: outputPath
            }
          });
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          });
      
          return outputPath;
        } catch (error) {
          console.error('Erro durante a síntese de fala:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Texto muito longo, envie um menor`})
          return null;
        }
      }

      async textaudioC() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          });
      
          const client = new TextToSpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });
      
          // Configuração da requisição
          const request = {
            input: { text: this.args },
            voice: { languageCode: 'pt-BR', name: 'pt-BR-Neural2-C' },
            audioConfig: {
              audioEncoding: 'OGG_OPUS', // Utiliza o formato OGG com codec Opus
              sampleRateHertz: 44100,    // Taxa de amostragem de 44100 Hz
              bitrateBps: 32000          // Bitrate fixo de 32 kbps
            }
          };
      
          // Realiza a síntese de fala
          const [response] = await client.synthesizeSpeech(request);
      
          // Caminho do arquivo de saída de áudio
          const outputPath = path.resolve(TEMP_FOLDER, 'output.ogg');
      
          // Salva o áudio no arquivo de saída
          fs.writeFileSync(outputPath, response.audioContent, 'binary');
      
          // Envia o áudio como resposta no WhatsApp
          await this.bot.sendMessage(this.remoteJid, {
            audio: {
              url: outputPath
            }
          });
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          });
      
          return outputPath;
        } catch (error) {
          console.error('Erro durante a síntese de fala:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Texto muito longo, envie um menor`})
          return null;
        }
      }

      async textaudioingA() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          });
      
          const client = new TextToSpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });
      
          // Configuração da requisição
          const request = {
            input: { text: this.args },
            voice: { languageCode: 'en-US', name: 'en-US-Neural2-A' },
            audioConfig: {
              audioEncoding: 'OGG_OPUS', // Utiliza o formato OGG com codec Opus
              sampleRateHertz: 44100,    // Taxa de amostragem de 44100 Hz
              bitrateBps: 32000          // Bitrate fixo de 32 kbps
            }
          };
      
          // Realiza a síntese de fala
          const [response] = await client.synthesizeSpeech(request);
      
          // Caminho do arquivo de saída de áudio
          const outputPath = path.resolve(TEMP_FOLDER, 'output.ogg');
      
          // Salva o áudio no arquivo de saída
          fs.writeFileSync(outputPath, response.audioContent, 'binary');
      
          // Envia o áudio como resposta no WhatsApp
          await this.bot.sendMessage(this.remoteJid, {
            audio: {
              url: outputPath
            }
          });
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          });
      
          return outputPath;
        } catch (error) {
          console.error('Erro durante a síntese de fala:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Texto muito longo, envie um menor`})
          return null;
        }
      }

      async textaudioingC() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          });
      
          const client = new TextToSpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });
      
          // Configuração da requisição
          const request = {
            input: { text: this.args },
            voice: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
            audioConfig: {
              audioEncoding: 'OGG_OPUS', // Utiliza o formato OGG com codec Opus
              sampleRateHertz: 44100,    // Taxa de amostragem de 44100 Hz
              bitrateBps: 32000          // Bitrate fixo de 32 kbps
            }
          };
      
          // Realiza a síntese de fala
          const [response] = await client.synthesizeSpeech(request);
      
          // Caminho do arquivo de saída de áudio
          const outputPath = path.resolve(TEMP_FOLDER, 'output.ogg');
      
          // Salva o áudio no arquivo de saída
          fs.writeFileSync(outputPath, response.audioContent, 'binary');
      
          // Envia o áudio como resposta no WhatsApp
          await this.bot.sendMessage(this.remoteJid, {
            audio: {
              url: outputPath
            }
          });
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          });
      
          return outputPath;
        } catch (error) {
          console.error('Erro durante a síntese de fala:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Texto muito longo, envie um menor`})
          return null;
        }
      }

      async textaudioingD() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          });
      
          const client = new TextToSpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });
      
          // Configuração da requisição
          const request = {
            input: { text: this.args },
            voice: { languageCode: 'en-US', name: 'en-US-Neural2-D' },
            audioConfig: {
              audioEncoding: 'OGG_OPUS', // Utiliza o formato OGG com codec Opus
              sampleRateHertz: 44100,    // Taxa de amostragem de 44100 Hz
              bitrateBps: 32000          // Bitrate fixo de 32 kbps
            }
          };
      
          // Realiza a síntese de fala
          const [response] = await client.synthesizeSpeech(request);
      
          // Caminho do arquivo de saída de áudio
          const outputPath = path.resolve(TEMP_FOLDER, 'output.ogg');
      
          // Salva o áudio no arquivo de saída
          fs.writeFileSync(outputPath, response.audioContent, 'binary');
      
          // Envia o áudio como resposta no WhatsApp
          await this.bot.sendMessage(this.remoteJid, {
            audio: {
              url: outputPath
            }
          });
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          });
      
          return outputPath;
        } catch (error) {
          console.error('Erro durante a síntese de fala:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Texto muito longo, envie um menor`})
          return null;
        }
      }

      async traducaoaudioing() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          });

          const translate = new Translate({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });

          const [translation] = await translate.translate(this.args, 'en-US')
      
          const client = new TextToSpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });
      
          // Configuração da requisição
          const request = {
            input: { text: translation },
            voice: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
            audioConfig: {
              audioEncoding: 'OGG_OPUS', // Utiliza o formato OGG com codec Opus
              sampleRateHertz: 44100,    // Taxa de amostragem de 44100 Hz
              bitrateBps: 32000          // Bitrate fixo de 32 kbps
            }
          };
      
          // Realiza a síntese de fala
          const [response] = await client.synthesizeSpeech(request);
      
          // Caminho do arquivo de saída de áudio
          const outputPath = path.resolve(TEMP_FOLDER, 'output.ogg');
      
          // Salva o áudio no arquivo de saída
          fs.writeFileSync(outputPath, response.audioContent, 'binary');
      
          // Envia o áudio como resposta no WhatsApp
          await this.bot.sendMessage(this.remoteJid, {
            audio: {
              url: outputPath
            }
          });
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          });
      
          return outputPath;
        } catch (error) {
          console.error('Erro durante a síntese de fala:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Texto muito longo, envie um menor`})
          return null;
        }
      }

      async traducaoaudiopt() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          });

          const translate = new Translate({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });

          const [translation] = await translate.translate(this.args, 'pt-BR')
      
          const client = new TextToSpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });
      
          // Configuração da requisição
          const request = {
            input: { text: translation },
            voice: { languageCode: 'pt-BR', name: 'pt-BR-Neural2-C' },
            audioConfig: {
              audioEncoding: 'OGG_OPUS', // Utiliza o formato OGG com codec Opus
              sampleRateHertz: 44100,    // Taxa de amostragem de 44100 Hz
              bitrateBps: 32000          // Bitrate fixo de 32 kbps
            }
          };
      
          // Realiza a síntese de fala
          const [response] = await client.synthesizeSpeech(request);
      
          // Caminho do arquivo de saída de áudio
          const outputPath = path.resolve(TEMP_FOLDER, 'output.ogg');
      
          // Salva o áudio no arquivo de saída
          fs.writeFileSync(outputPath, response.audioContent, 'binary');
      
          // Envia o áudio como resposta no WhatsApp
          await this.bot.sendMessage(this.remoteJid, {
            audio: {
              url: outputPath
            }
          });
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          });
      
          return outputPath;
        } catch (error) {
          console.error('Erro durante a síntese de fala:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Texto muito longo, envie um menor`})
          return null;
        }
      }

      async AudAudPt() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          })

          const client = new SpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          })
      
          // Caminho do arquivo de áudio OGG
          const inputPath = await downloadAudio(this.baileysMessage, 'input')
      
          // Caminho de saída para o arquivo convertido em WAV
          const outputPath = path.resolve(TEMP_FOLDER, 'output.wav')
      
          // Converter o áudio para WAV
          await convertAudioToWav(inputPath, outputPath)

          // Realiza a transcrição do áudio para texto
          const config = {
            encoding: 'LINEAR16',
            languageCode: 'en-US',
            enableAutomaticPunctuation: true
          }
      
          const request = {
            audio: {
              content: fs.readFileSync(outputPath).toString('base64')
            },
            config: config
          }
      
          const [response] = await client.recognize(request);
          const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

          const translate = new Translate({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });

          const [translation] = await translate.translate(transcription, 'pt-BR')

          const speechclient = new TextToSpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });

          // Configuração da requisição
          const request2 = {
            input: { text: translation },
            voice: { languageCode: 'pt-BR', name: 'pt-BR-Neural2-C' },
            audioConfig: {
              audioEncoding: 'OGG_OPUS', // Utiliza o formato OGG com codec Opus
              sampleRateHertz: 44100,    // Taxa de amostragem de 44100 Hz
              bitrateBps: 32000          // Bitrate fixo de 32 kbps
            }
          };
      
          // Realiza a síntese de fala
          const [response2] = await speechclient.synthesizeSpeech(request2);
      
          // Caminho do arquivo de saída de áudio
          const outputPath2 = path.resolve(TEMP_FOLDER, 'output2.ogg');
      
          // Salva o áudio no arquivo de saída
          fs.writeFileSync(outputPath2, response2.audioContent, 'binary');
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          })
      
          // Envia o áudio como resposta no WhatsApp
          await this.bot.sendMessage(this.remoteJid, {
            audio: {
              url: outputPath2
            }
          });

        } catch (error) {
          console.error('Erro durante a transcrição:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Erro durante a transcrição, tente novamente`})
          return null;
        }
      }

      async AudAudIng() {
        try {
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '⏳',
              key: this.baileysMessage.key
            }
          })

          const client = new SpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          })
      
          // Caminho do arquivo de áudio OGG
          const inputPath = await downloadAudio(this.baileysMessage, 'input')
      
          // Caminho de saída para o arquivo convertido em WAV
          const outputPath = path.resolve(TEMP_FOLDER, 'output.wav')
      
          // Converter o áudio para WAV
          await convertAudioToWav(inputPath, outputPath)

          // Realiza a transcrição do áudio para texto
          const config = {
            encoding: 'LINEAR16',
            languageCode: 'pt-BR',
            enableAutomaticPunctuation: true
          }
      
          const request = {
            audio: {
              content: fs.readFileSync(outputPath).toString('base64')
            },
            config: config
          }
      
          const [response] = await client.recognize(request);
          const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

          const translate = new Translate({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });

          const [translation] = await translate.translate(transcription, 'en-US')

          const speechclient = new TextToSpeechClient({
            credentials: CREDENTIALS,
            projectId: CREDENTIALS.projectId
          });

          // Configuração da requisição
          const request2 = {
            input: { text: translation },
            voice: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
            audioConfig: {
              audioEncoding: 'OGG_OPUS', // Utiliza o formato OGG com codec Opus
              sampleRateHertz: 44100,    // Taxa de amostragem de 44100 Hz
              bitrateBps: 32000          // Bitrate fixo de 32 kbps
            }
          };
      
          // Realiza a síntese de fala
          const [response2] = await speechclient.synthesizeSpeech(request2);
      
          // Caminho do arquivo de saída de áudio
          const outputPath2 = path.resolve(TEMP_FOLDER, 'output2.ogg');
      
          // Salva o áudio no arquivo de saída
          fs.writeFileSync(outputPath2, response2.audioContent, 'binary');
      
          await this.bot.sendMessage(this.remoteJid, {
            react: {
              text: '✅',
              key: this.baileysMessage.key
            }
          })
      
          // Envia o áudio como resposta no WhatsApp
          await this.bot.sendMessage(this.remoteJid, {
            audio: {
              url: outputPath2
            }
          });

        } catch (error) {
          console.error('Erro durante a transcrição:', error);
          await this.bot.sendMessage(this.remoteJid, { text: `${BOT_EMOJI} Erro durante a transcrição, tente novamente`})
          return null;
        }
      }

      async biblia() {

        await this.bot.sendMessage(this.remoteJid, {
            react: {
                text: '⏳',
                key: this.baileysMessage.key
            }
        })
    
        const textobiblico = `
Salmo 119:1-20

1 Bem-aventurados os irrepreensíveis no seu caminho, que andam na lei do Senhor.

2 Bem-aventurados os que guardam as suas prescrições e o buscam de todo o coração.

3 Eles não praticam iniquidade, mas andam nos seus caminhos.

4 Tu ordenaste os teus preceitos para que sejam diligentemente observados.

5 Quem dera que os meus caminhos fossem dirigidos de maneira a observar os teus estatutos!

6 Então, não serei envergonhado, atentando para todos os teus mandamentos.

7 Louvar-te-ei com coração sincero quando tiver aprendido os teus justos juízos.

8 Observarei os teus estatutos; não me desampares inteiramente.

9 Como purificará o jovem o seu caminho? Observando-o segundo a tua palavra.

10 De todo o meu coração te busquei; não me deixes fugir aos teus mandamentos.

11 Escondi a tua palavra no meu coração para não pecar contra ti.

12 Bendito és tu, ó Senhor! Ensina-me os teus estatutos!

13 Com os meus lábios repeti todos os juízos da tua boca.

14 Regozijo-me mais com o caminho dos teus testemunhos do que com todas as riquezas.

15 Meditarei nos teus preceitos e contemplarei os teus caminhos.

16 Deleitar-me-ei nos teus estatutos; não me esquecerei da tua palavra.

17 Faze bem ao teu servo para que viva, para que eu observe a tua palavra.

18 Desvenda os meus olhos para que contemple os feitos maravilhosos da tua lei.

19 Sou peregrino na terra, não escondas de mim os teus mandamentos.

20 A minha alma consome-se de paixão e desejo por teus juízos em todo o tempo.
`;

        // Define the conversation context
        const context = [
            {role: "system", content: "Você é um banco de dados da bíblia da Nova Versão Internacional, você vai fornecer textos da bíblia, mas sem comentar, e qualquer pedido diferente de um texto retirado da bíblia, você enviará a mensagem 'Desculpe, mas eu só forneço textos referentes a bíblia.'"},
            {role: "system", content: "Se por acaso for pedido um texto muito grande da bíblia, exemplo salmo 119, não justifique o porque não pode trazer um texto tão grande, apenas escreva o máximo que puder, e quando não puder mais, escreva um sinal de continuação no final"},
            {role: "system", content: "Escreva o texto separado por versículos, e enumere cada um"},
            {role: "user", content: "Apocalipse 21:1-5"},
            {role: "assistant", content: "\"Vi novo céu e nova terra, pois o primeiro céu e a primeira terra passaram, e o mar já não existe. Vi a santa cidade, a nova Jerusalém, que descia do céu, da parte de Deus, preparada como uma noiva adornada para o seu marido. E ouvi uma forte voz que vinha do trono e dizia: 'Eis o tabernáculo de Deus com os homens. Deus habitará com eles. Eles serão povos de Deus e Deus mesmo estará com eles e será o seu Deus. Ele enxugará dos seus olhos toda lágrima; não haverá mais morte, nem haverá mais tristeza, nem choro, nem dor, porque as primeiras coisas já passaram'. E aquele que estava assentado no trono disse: 'Eis que faço novas todas as coisas'. E acrescentou: 'Escreve, porque estas palavras são verdadeiras e fiéis\"'. (Apocalipse 21:1-5)"},
            {role: "user", content: "salmo 119 primeiros 20 versículos"},
            {role: "assistant", content: (textobiblico) },
            {role: "user", content: "Quero uma receita de bolo"},
            {role: "assistant", content:"Desculpe, mas eu só forneço textos referentes a bíblia."}
        ]
    
        const { data } = await axios.post(
            `https://api.openai.com/v1/chat/completions`,
            {
                model: "gpt-3.5-turbo",
                messages: [...context, {role: "user", content: this.args}],
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
                text: "✅",
                key: this.baileysMessage.key,
            },
        })
    
        const responseText = data.choices[0].message.content
    
        await this.bot.sendMessage(this.remoteJid,{
            text: `📖 ${responseText}`,
        },
        {
            quoted: this.baileysMessage
        })
    }
    
    //PARTE HINO -------------------------------------
    async hino() {
      const db = Database;
      try {
        const q = query(collection(db, 'musicas'), where('titulo', '==', this.args));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          this.bot.sendMessage(this.remoteJid, {
            text: doc.data().letra,
          }, {
            quoted: this.baileysMessage,
          });
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }
    async hino1() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/hinos/hino1.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async hino2() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/hinos/hino2.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async hino3() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/hinos/hino3.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async hino4() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/hinos/hino4.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async hino5() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/hinos/hino5.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async hino6() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/hinos/hino6.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async hino7() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/hinos/hino7.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async hino8() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/hinos/hino8.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async hino9() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/hinos/hino9.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async hino10() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/hinos/hino10.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    //PARTE LIÇÃO -------------------------------------

    async adultosab() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/licaoadulto/1.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async adultodom() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/licaoadulto/2.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async adultoseg() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/licaoadulto/3.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async adultoter() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/licaoadulto/4.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async adultoquar() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/licaoadulto/5.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async adultoquin() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/licaoadulto/6.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async adultosext() {
      try {
        const filePath = '/home/luizpro/project/bot-whatsapp/src/licaoadulto/7.txt';
        const texto = await fs.readFileSync(filePath, 'utf-8');
    
        await this.bot.sendMessage(this.remoteJid, {
          text: texto,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
      }
    }

    async oamorvive() {
      try {

        await this.bot.sendMessage(this.remoteJid, {
          react: {
            text: '⏳',
            key: this.baileysMessage.key
          }
        })

        const filePath = '/home/luizpro/project/bot-whatsapp/src/musicas/O Amor Vive.ogg'

        const fileBuffer = fs.readFileSync(filePath)
    
        await this.bot.sendMessage(this.remoteJid, {
          audio: fileBuffer,
        }, {
          quoted: this.baileysMessage,
        });
      } catch (error) {
        console.error('Erro ao enviar música', error);
      }

      await this.bot.sendMessage(this.remoteJid, {
        react: {
          text: '✅',
          key: this.baileysMessage.key
        }
      });

    }

    async ellenwhite() {

      await this.bot.sendMessage(this.remoteJid, {
          react: {
              text: '⏳',
              key: this.baileysMessage.key
          }
      })

      const textoel = `1. "Cristo é nosso Advogado, nosso Intercessor, na presença do Pai. E Ele Se oferece a Si mesmo como sacrifício pelo pecado. Não fazem os descrentes idéia do pecado, e, portanto, não apreciam a obra de Cristo em sua ligação com o pecado, sua maravilhosa eficiência para a sua destruição. Através do seu ministério sacerdotal, Ele é o mediador entre Deus e o homem. Ele imolou a si mesmo como sacrifício. Ele é a nossa intercessão; o perdão de nossos pecados é obtido em Seu nome" (Mensagens Escolhidas, vol. 1, p. 343).

      2. "Cristo, o grande Sumo Sacerdote celeste, está a seu serviço. Ele procura livrar a alma do pecado, purificar-lhe o coração, colocar-lhe nos lábios um cântico de louvor e alegria, acordar-lhe gratidão que está morta, despertar-lhe o amor pelos homens para com Deus, o amor que foi comparado ao amor de Deus para com o mundo. Não há um pecado pelos quais o coração culpado pode estar em falta que Jesus não tenha provido um remédio" (Testemunhos Seletos, vol. 1, p. 180).
      
      3. "Cristo foi para o Céu, não somente como nosso Sacrificador para oferecer Sua própria vida-obra mortal para ser aceita pela fé, mas como nosso fiel Advogado. Aquele que é todo-justo é feito justiça para nós. O cristão não tem desculpa para desespero e desânimo" (Testemunhos para Ministros e Obreiros Evangélicos, p. 433).
      
      4. "Na presença de Deus, o Pai, nosso grande Sumo Sacerdote apresenta Seu sangue derramado por nós. Ele afirma todo o Seu poder em nosso favor, a fim de sermos admitidos na presença do Pai" (O Grande Conflito, p. 489).
      
      5. "A obra do ministério de Cristo, enquanto nosso grande Sumo Sacerdote, é não somente oferecer o sacrifício, mas apresentá-lo pela fé como nosso Advogado, para que possamos receber o perdão do pecado e ser aperfeiçoados na justiça" (O Desejado de Todas as Nações, p. 299).
      
      Estes são alguns exemplos de textos de Ellen White que discutem o ministério sacerdotal de Cristo no céu. Ela enfatiza a mediação de Cristo como nosso Advogado e Intercessor diante de Deus, sua eficiência para destruir o pecado e a importância da fé em seu sacrifício para obter o perdão dos pecados.`


      const cafe = `Um grande mal é que muitos têm usado o café como um estimulante. Isto leva-os a se conduzirem como loucos. O café não está tornando as pessoas mais fortes nem mais sábias; ele está fazendo delas escravos. Eles parecem não ter vontade própria. Raramente podem descartar essa bebida. Muitas vezes estão trabalhando em desvantagem porque o excesso de cafeína no sistema os torna propensos a cometer erros" (Conselhos sobre o Regime Alimentar, p. 425).

      "O café é prejudicial ao organismo. Freqüentemente funciona de maneira poderosa, estimulando o sistema nervoso, e assim proveniente do princípio que dá força, causa inflamação, e consiste de uma droga venenosa" (Testemunhos para a Igreja, vol. 4, p. 402).
      
      "O café embota as percepções, estimula temporariamente a mente a ações mais vigorosas, mas deixa o usuário mais fraco e menos com a capacidade de fazer esforço mental e físico vigoroso" (Conselhos Sobre o Regime Alimentar, p. 429).
      
      Esses são alguns exemplos dos escritos de Ellen White que expressam os malefícios do café. Ela descreve o café como uma bebida que pode levar ao vício, interferir na capacidade de tomar decisões corretas e causar estimulação e inflamação prejudiciais para o corpo.`

      // Define the conversation context
      const context = [
          {role: "system", content: "Você é um banco de dados de textos da Ellen White, você apenas fornecerá dados com base nos textos da Ellen White, porém, sem fazer nenhum comentário, apenas forneça o texto com suas respectivas referências"},
          {role: "system", content: "Se alguém questionar sobre o que ou quem você é, diga que você é uma ferramenta que traz textos da Ellen White"},
          {role: "system", content: "Qualquer assunto perguntado a você, busque se Ellen White diz algo sobre, ou alguma relação de Ellen White sobre o tema"},
          {role: "system", content: "Toda citação que você fizer, escreva o livro e a página de onde foi retirada a informação"},
          {role: "user", content: "Textos de Ellen White sobre o ministério sacerdotal de Cristo no céu"},
          {role: "assistant", content: (textoel)},
          {role: "user", content: "Quero uma receita de bolo"},
          {role: "assistant", content:"Desculpe, mas eu só forneço textos da Ellen White."},
          {role: "user", content: "O que você é?"},
          {role: "assistant", content:"Eu sou uma ferramenta que fornece Textos da Ellen White"},
          {role: "user", content: "O que você faz?"},
          {role: "assistant", content:"Eu sou uma ferramenta que fornece Textos da Ellen White"},
          {role: "user", content: "Quem você é?"},
          {role: "assistant", content:"Eu sou uma ferramenta que fornece Textos da Ellen White"},
          {role: "user", content: "malefícios do café"},
          {role: "assistant", content: (cafe)},
          {role: "user", content: "café"},
          {role: "assistant", content: (cafe)},
          
          
      ]
  
      const { data } = await axios.post(
          `https://api.openai.com/v1/chat/completions`,
          {
              model: "gpt-3.5-turbo",
              messages: [...context, {role: "user", content: this.args}],
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
              text: "✅",
              key: this.baileysMessage.key,
          },
      })
  
      const responseText = data.choices[0].message.content
  
      await this.bot.sendMessage(this.remoteJid,{
          text: `📖 ${responseText}`,
      },
      {
          quoted: this.baileysMessage
      })
  }

  async convmp3() {
    try {
        await this.bot.sendMessage(this.remoteJid, {
            react: {
                text: '⏳',
                key: this.baileysMessage.key,
            }
        });

        // Convert short YouTube URL to regular format
        if (this.args.startsWith('https://youtu.be/')) {
            this.args = 'https://www.youtube.com/watch?v=' + this.args.substring('https://youtu.be/'.length);
        }

        // Remove "feature=share" from the URL
        let youtubeUrl = this.args;
        const urlObj = new URL(youtubeUrl);
        urlObj.searchParams.delete('feature');
        youtubeUrl = urlObj.toString();
        
        // Extract video ID from the modified YouTube URL
        const videoId = extractVideoId(youtubeUrl);

        const options = {
            method: 'GET',
            url: 'https://youtube-mp36.p.rapidapi.com/dl',
            params: {id: videoId},
            headers: {
                'X-RapidAPI-Key': YTAPI1,
                'X-RapidAPI-Host': YTAPI2
            }
        };

        let response;
        let attempts = 0;
        const maxAttempts = 5; // Number of times to retry getting the link
        const waitTime = 2000; // Time in milliseconds to wait between attempts

        while (attempts < maxAttempts) {
            response = await axios.request(options);
            
            if (response && response.data && response.data.link && response.data.link.trim() !== "") {
                // If the URL Result is valid, break out of the loop
                break;
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, waitTime));  // Wait for the specified time before next attempt
        }

        if (response && response.data && response.data.link && response.data.link.trim() !== "") {
            // Send the audio as a response on WhatsApp
            await this.bot.sendMessage(this.remoteJid, {
                text: response.data.link
            });

            await this.bot.sendMessage(this.remoteJid, {
                react: {
                    text: "✅",
                    key: this.baileysMessage.key,
                },
            });
        } else {
            throw new Error('URL Result is empty or invalid after all attempts.');
        }

    } catch (error) {
        console.error('Erro ao processar o vídeo:', error);
        await this.bot.sendMessage(this.remoteJid, {
            text: 'Ocorreu um erro ao processar o vídeo.'
        });
    }
}

    } 
module.exports = Action