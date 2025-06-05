const axios = require('axios');

const token = 'sk_33ed3140aca24e4c98cd75b52b5c7722'; // Reemplaza con tu API Key
const phoneNumberId = '508852171945366'; // ID de WhatsApp Business
const fromNumber = '18096690177';

async function enviarMensajeWhatsApp(numeroDestino, mensaje) {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  try {
    await axios.post(url, {
      messaging_product: 'whatsapp',
      to: numeroDestino,
      type: 'text',
      text: { body: mensaje }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Mensaje enviado a ${numeroDestino}`);
  } catch (error) {
    console.error('Error enviando WhatsApp:', error.response?.data || error.message);
  }
}

module.exports = { enviarMensajeWhatsApp };
