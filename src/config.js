const path = require('path')

const PREFIX = '/'
const BOT_EMOJI = '🤖'
const TEMP_FOLDER = path.resolve(__dirname, '..', 'assets', 'temp')

const OPENAI_API_KEY = "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"
const CREDENTIALS = { "type": "service_account", "project_id": "adept-snow-386921", "private_key_id": "a5e92c72d76ac79eb0bb3c68b0386a07b92b35c9", "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC7K5DpypPP13cM\nrcCymAh/87Y4VYHpRvgKuqI4/AK5uGk5DBUe1pEFIzBoxtp0BCleMD9y/s5mCbcO\nNcjA9JIduZHHlDXxvKT9hsPqYnnxXs0pOSqeXnI0A5CTHfQ45/MXiDmabt0N1tl9\n6aCmNQ3mh8k4z4J31sKlt6whWIT7wx0RpaIXLJ+5RGi7C9JEpo40PsSQba6Kj4+O\n06YX0wIhCGkDegzInAlAh4y7JoXmYQ33PMJEu5pBAgLMBEoMKJe0j8DYNNh1z4XK\nE4Jvf02Xm9ubUSt2yuiAJUN9nnGu1RmFqeEVJ45dIEl/ZlkMi5Ro60qEhVMZ//Gm\nd2ZWYv63AgMBAAECggEAFEDBFAM3HljWyXjtroWT+eBxucPK5GapBWQvlJH0a4tA\nW4tqp6UZGSC3JsdJsR8YKNh4rSVUSSdI9xEr0XFFdFD1rM5lTeyXP9W60lxojI0x\nDwJgEbXvjqBKHxkxKY0zuTqk3QidA9fZPe4vU3zPLcBIrkyJ9hS3iD4JMqyE60cA\njjh8wr6ZsEOOUtO402g7bwl6YSm3NNCXVdPenIGNGzM7PvEb4ouoWayDQdaNGbay\n650p2FEO3tgNRAkOcvoe12PhALhQ+ptlj7wfDemCpkJbzFSN9YNYHYmw4Ud89Zkf\nslsnB0/pZ7N2Jhz80GSUbEz9axHxJZPUXXOpEPkFIQKBgQDuKIb/06sftIocWj++\ni/x8jmALtkC//IHs566E5cI7emIZ87U3hRA73vbk4Ib0RhDzbloDpV49GvN+CfCB\n6t383ZBHpVf+WDcdbgUGNBSSS8D1ddC1ddWRXwB44M0htLE7re4taZn+8uWRmn77\nXh8XpSD7VtgAFfV7FinB3Y/5oQKBgQDJMSw+eeUVRuhN2CihesmgLWQTrHO1sm5N\n915wnnwT7llmkv76R0NIMqicN59om4l2BIquZYAoNlKGtE/MPoLx24CfmuPdvxK5\nlC9OsPkIqn1hi8bz8+EetcpmsKi6V2HbXuCZiQtAQzqGc/9bUjYXi8RTsE7vJUoX\nNvAbnR6JVwKBgH5kecj5r/7ClO2ZI+1fY59C/Ewa7GA3hUiSaHdVbHCeccPuKAWQ\nE96CZStw0Y6AROy8av82Wz44uHLymXaJjEhv2et8H6f3b0CqK/Zv218M3xol7Z7w\nK2jcL2b3f0ZdHBZdJ2NogPbiN92/TZbgC8ZDt65MF5RsEvzA9WZSzN8hAoGAPGv6\nH6E3/VXYOliqiyR3HRXEsmveLDk0C1I5GJVgKhQw4S9QSBXSzQH5xUCnLSFY/QqM\nI6fz/x+hVTcdp/c2GDCVxlkcCeJyWy13r6hSghnBoeP6khUyDKkH6iMv6RaJGvq5\ndSLFMD2AfBSmIeTkvdmJ0qBmdEe8opArN//Nxe0CgYATAdwTmJlzr2T9S6Ivau9H\n64jHUkLzGRZsfJRbZcqnRa3Zuk+iaC6E086m62VSQ5TEXOmSlASEwRedjS32O9sx\np9yZ5XQpfx/ts8gJmQEh5Q1a9JIrAEo52IXbOitwwuDGRmOfhnM3wjhrexK/MQjh\ntm8SIMDwDbebGWCsiRwwCA==\n-----END PRIVATE KEY-----\n", "client_email": "tradutorintegra-o@adept-snow-386921.iam.gserviceaccount.com", "client_id": "118133338320981209299", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/tradutorintegra-o%40adept-snow-386921.iam.gserviceaccount.com", "universe_domain": "googleapis.com"
  }
  

module.exports = {
    BOT_EMOJI,
    PREFIX,
    TEMP_FOLDER,
    OPENAI_API_KEY,
    CREDENTIALS
}