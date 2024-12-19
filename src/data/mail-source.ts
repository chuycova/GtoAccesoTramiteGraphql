
const axios = require('axios');

export class MailAPI{
  private baseURL = process.env.URL_API_NETCORE;

  constructor() {}
  
  async envioMail(body: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}api/apiMailEnvioMail/`,
        body
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error('No se pudo enviar Correo:'+error);
    }
  }

  async envioMailCC_CCO(body: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}api/apiMail/EnviarMultiplesConCopia/`,
        body
      );
      return response.data;
    } catch (error) {
      // console.error(error);
      throw new Error('No se pudo enviar Correo CCO:'+error);
    }
  }
}
