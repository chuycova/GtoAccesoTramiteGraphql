const QRCode = require('qrcode');

export class qrcode{

    constructor() {
    }
  
    async generarQR(valor: string): Promise<string> {
      try {
        const opciones = {
          width: 300
        };
        const url = await QRCode.toDataURL(valor,opciones);
        return url;
      } catch (err:any) {
        throw new Error('Error al generar el código QR: ' + err.message);
      }
    }
  }