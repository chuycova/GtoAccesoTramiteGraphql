const axios = require('axios');
export class ApiArchivos {
    private baseURL = process.env.URL_API_NETCORE;
    constructor() {}

    async envioArchivo(body: any): Promise<any> {
        const now = new Date();
        const formattedDate = `${(now.getDate() < 10 ? '0' : '')}${now.getDate()}${(now.getMonth() < 9 ? '0' : '')}${now.getMonth() + 1}${now.getFullYear()}hcd2023`;
        let headers={
            'token': formattedDate
          }
        try {
          const response = await axios.post(
            `${this.baseURL}api/UploadFilesFTP/GuardarArchivo/`,
            body,{
            headers}    
          );
          return response.data;
        } catch (error) {
          throw new Error('No se pudo guardar Documento.');
        }
      }
}