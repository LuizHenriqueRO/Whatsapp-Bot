const { BOT_EMOJI } = require('./config')
const { isCommand, extractDataFromMessage } = require('./utils')
const Action = require('./actions')

async function middlewares(bot) {
    bot.ev.on('messages.upsert', async ({ messages }) => {
        const baileysMessage = messages[0]

        if (!baileysMessage?.message || !isCommand(baileysMessage)) {
            return
        }

        const action = new Action(bot, baileysMessage)

        const { command, remoteJid } = extractDataFromMessage(baileysMessage)

        switch (command.toLowerCase()){
            case 'figurinha':
            case 'fig':
            case 'sticker':      
                await action.sticker()
                break

            case 'ping':
                await bot.sendMessage(remoteJid, { text: `${BOT_EMOJI}Pong!` })
                break

            case 'toimage':
            case 'toimg':
                await action.toImage()
                break

            case 'gpt':
                await action.gpt()
                break

            case 'img':
            case 'imagem':
                await action.generateImage()
                break

            case 'traduzir':
            case 'tr':
            case 'trad':
                await action.translatePt()
                break

            case 'ing':
            case 'ingles':
                await action.translateEng()
                break

            case 'texto':
                await action.audiotexto()
                break

            case 'text':
                await action.audiotext()
                break
            
            case 'textoing':
                await action.audiotexting()
                break
            
            case 'textopt':
                await action.audiotextpt()
                break

            case 'lens':
                await action.gvisiontext()
                break

            case 'objeto':
                await action.gvisionobject()
                break

            case 'biblia':
            case 'bíblia':
                await action.biblia()
                break

            case 'audio1':
                await action.textaudioA()
                break
            
            case 'audio2':
                await action.textaudioB()
                break

            case 'audio3':
                await action.textaudioC()
                break
            
            case 'audioing1':
                await action.textaudioingA()
                break    

            case 'audioing2':
                await action.textaudioingC()
                break    
              
            case 'audioing3':
                await action.textaudioingD()
                break    
            
            case 'auding':
                await action.traducaoaudioing()
                break    
            
            case 'audpt':
                await action.traducaoaudiopt()
                break  
            
            case 'traudpt':
                await action.AudAudPt()
                break  
            
            case 'trauding':
                await action.AudAudIng()
                break  

            case 'hino1':
            case 'santosantosanto':
                await action.hino1()
                break
            
            case 'hino2':
            case 'oadoraiosenhor':
                await action.hino2()
                break
            
            case 'hino3':
            case 'odeuseternoreina':
                await action.hino3()
                break

            case 'hino4':
            case 'louvoraottrinodeus':
                await action.hino4()
                break
            
            case 'hino5':
            case 'jubilososteadoramos':
                await action.hino5()
                break
            
            case 'hino6':
            case 'nosteadoramos':
                await action.hino6()
                break
            
            case 'hino7':
            case 'sejaslouvado':
                await action.hino7()
                break

            case 'hino8':
            case 'odeusdeamor':
                await action.hino8()
                break
            
            case 'hino9':
            case 'santosantopaibondoso':
                await action.hino9()
                break

            case 'hino10':
            case 'osenhorestaaqui':
                await action.hino10()
                break

            case 'licaoadultossabado':
            case 'licaoadultos05/08':
                await action.adultosab()
                break
            
            case 'licaoadultosdomingo':
            case 'licaoadultos06/08':
                await action.adultodom()
                break
            
            case 'licaoadultossegunda':
            case 'licaoadultos07/08':
                await action.adultoseg()
                break
            
            case 'licaoadultosterca':
            case 'licaoadultos08/08':
                await action.adultoter()
                break
            
            case 'licaoadultosquarta':
            case 'licaoadultos09/08':
                await action.adultoquar()
                break
            
            case 'licaoadultosquinta':
            case 'licaoadultos10/08':
                await action.adultoquin()
                break
            
            case 'licaoadultossexta':
            case 'licaoadultos11/08':
                await action.adultosext()
                break

            case 'oamorvive':
                await action.oamorvive()
                break
            
            case 'egw':
                await action.ellenwhite()
                break

            case 'mp3':
                await action.convmp3()
                break

        }

    })    
}

module.exports = middlewares