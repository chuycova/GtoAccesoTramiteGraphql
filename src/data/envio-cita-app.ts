const axios = require("axios");

export class ApiWelcome {
  private baseURL = process.env.URL_API_WELCOME;
  private loginAppKey = process.env.URL_API_WELCOME_APP_KEY;
  private loginUser = process.env.URL_API_WELCOME_USER;
  private loginPass = process.env.URL_API_WELCOME_PASS;
  private apiWLC_URL = process.env.URL_API_WLC;

  constructor() {}

  async api_login(): Promise<any> {
    try {
      const url = `${this.baseURL}api/login`;
      const requestBody = {
        appkey: this.loginAppKey,
      };
      const config = {
        auth: {
          username: this.loginUser,
          password: this.loginPass,
        },
        headers: {
          "Content-Type": "application/json",
        },
      };

      const response = await axios.post(url, requestBody, config);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error request:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
      throw new Error("No se pudo Login: " + error.message);
    }
  }

  async api_cita_solicitud(body: any): Promise<any> {
    try {
      let _login = await this.api_login();
      if (_login) {
        const url = `${this.baseURL}api/citaSolicitud`;
        const config = {
          headers: {
            'Authorization': `Bearer ${_login.token}`,
            "Content-Type": "application/json",
          },
        };

        const response = await axios.post(url, body, config);
        return response.data;
      }
    } catch (error: any) {
      // if (error.response) {
      //   console.error("Cita Error response data:", error.response.data);
      //   console.error("Cita Error response status:", error.response.status);
      //   console.error("Cita Error response headers:", error.response.headers);
      // } else if (error.request) {
      //   console.error("Cita Error request:", error.request);
      // } else {
      //   console.error("Cita Error message:", error.message);
      // }
      throw new Error("No se pudo enviar Solicitud API:" + error);
    }
  }
  async api_cita_solicitud_GTO(body: any,token:any): Promise<any> {
    try {
      const url = `${this.baseURL}api/citaSolicitud`;
      const config = {
        headers: {
          'Authorization': `${token}`,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.post(url, body, config);
      return response.data;
    } catch (error: any) {
      // if (error.response) {
      //   console.error("Cita Error response data:", error.response.data);
      //   console.error("Cita Error response status:", error.response.status);
      //   console.error("Cita Error response headers:", error.response.headers);
      // } else if (error.request) {
      //   console.error("Cita Error request:", error.request);
      // } else {
      //   console.error("Cita Error message:", error.message);
      // }
      return {
        status: error.response.status,
        message:error.response.data,
        code: error.response.statusText,
      };
      // throw new Error(error.response ? error.response.status + ": " + error.response.data : error.message);
    }
  }
  async api_whatsApp_cita_solicitud(body: any): Promise<any> {
    try {
      let _login = await this.api_login();
      if (_login) {
        const url = `${this.baseURL}api/notificaciones`;
        const config = {
          headers: {
            'Authorization': `Bearer ${_login.token}`,
            "Content-Type": "application/json",
          },
        };

        const response = await axios.post(url, body, config);
        return response.data;
      }
    } catch (error: any) {
      // if (error.response) {
      //   console.error("WhatsApp Error response data:", error.response.data);
      //   console.error("WhatsApp Error response status:", error.response.status);
      //   console.error("WhatsApp Error response headers:", error.response.headers);
      // } else if (error.request) {
      //   console.error("WhatsApp Error request:", error.request);
      // } else {
      //   console.error("WhatsApp Error message:", error.message);
      // }
      throw new Error("No se pudo enviar Solicitud API:" + error);
    }
  }
  async api_qr_solicitud(body: any): Promise<any> {
    try {
      const url = `${this.apiWLC_URL}api/QR/getQR?qr=${body.Oid}`;
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const response = await axios.get(url, config);
      return response.data;
    
  } catch (error: any) {
    // if (error.response) {
    //   console.error("WhatsApp Error response data:", error.response.data);
    //   console.error("WhatsApp Error response status:", error.response.status);
    //   console.error("WhatsApp Error response headers:", error.response.headers);
    // } else if (error.request) {
    //   console.error("WhatsApp Error request:", error.request);
    // } else {
    //   console.error("WhatsApp Error message:", error.message);
    // }
    throw new Error("No se pudo consultar QR API:" + error);
  }
  }
}
