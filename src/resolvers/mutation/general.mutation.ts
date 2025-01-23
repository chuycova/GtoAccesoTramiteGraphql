import { get_LoginUsuarioAccesoInactivo, get_TiempoToken } from "../../constants/acceso-db-operations";
import { getLoginAcceso } from "../../constants/db-operations";
// import { ApiWelcome } from "../../data/envio-cita-app";
import { MailAPI } from "../../data/mail-source";
import { NoSqlInyection } from "../../lib/RemplazarSQL";
import JWT from "../../lib/jwt";
import { ApiArchivos } from "../../utils/api-archivos";

// const _ApiWelcome = new ApiWelcome();
const _ApiEnviarArchivo = new ApiArchivos();
const _ApiMail = new MailAPI();
var noSqlInyection = new NoSqlInyection();

const mutationGeneral = {
  Mutation: {
    /* Envio de Correo */
      api_postEnviarMail:async(_:any,parent:any) =>{
        try {
            const response = await _ApiMail.envioMail(parent.body);
            return response;
        }catch (error) {
            console.error(error);
            throw new Error('No se pudo obtener el usuario ApiMail.');
      }
    },
    /* Envio de Correo CC_CCO*/
      api_postEnviarMailCC_CCO:async(_:any,parent:any) =>{
        try {
            const response = await _ApiMail.envioMailCC_CCO(parent.body);
            return response;
        }catch (error) {
            console.error(error);
            throw new Error('No se pudo obtener el usuario ApiMail Copia.');
      }
    },
    api_postEnviarImagen: async (_: any, parent: any) => {
      try {
        const response = await _ApiEnviarArchivo.envioArchivo(parent.body);
        return {
          exitoso: true,
          data: response,
        };
      } catch (error) {
        // console.error(error);
            throw new Error('No se pudo. Api Imagen.');
      }
    },
    /* Login para obtener token */
    loginAcceso: async (_: any, parent: any, { psql }: any) => {
      let correo = noSqlInyection.remplazar(parent.correo);

      let eventQueryBloqueado = get_LoginUsuarioAccesoInactivo(correo);
      let resBloqueado = await psql.oneOrNone(eventQueryBloqueado);

      //No existe el Usuario
      if (resBloqueado == null) {
        return {
          status: false,
          message: "Incorrecto",
        };
      }
      //El Usuario no esta Activo
      if (!resBloqueado["Activo"]) {
        return {
          status: false,
          message: "Incorrecto",
        };
      }
      
      //Se validan Credenciales
      let eventQuery = getLoginAcceso(correo, parent.pass);
      let res = await psql.oneOrNone(eventQuery);
     
      //Las Credenciales son incorrectas
      if (res == null) {
        return {
          status: false,
          message: "Incorrecto",
        };
      }
      
      //Se obtiene el tiempo de Token
      let eventQueryTiempoToken = get_TiempoToken(res.Oid);
      let resTiempoToken = await psql.oneOrNone(eventQueryTiempoToken);
      
      //Credenciales son correctas
      return {
        status: true,
        message: "Correcto",
        token: new JWT().sign(res,resTiempoToken.TiempoToken==0?10:resTiempoToken.TiempoToken*3600),
      };
    },
    /* Envio de WhatsApp */
    api_postEnviarWhatsApp: async (_: any, parent: any, { token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {
        throw new Error("Error de tiempo de respuesta");
      }
      const estructura = parent.estructura;
      let body = {
        correo_O_Numero: estructura.Numero,
        titulo: estructura.Titulo,
        mensaje: estructura.Texto,
        adjuntos: estructura.Adjuntos,
        tipo: estructura.Tipo,
      };
      /*
      const response = await _ApiWelcome.api_whatsApp_cita_solicitud(body);
      if(response==''){
        return { status: true, message: "WhatsApp Enviado" };
      }
      */
      return { status: false, message: "WhatsApp Error" };
    },
  },
};

export default mutationGeneral;
