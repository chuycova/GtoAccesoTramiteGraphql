import { get_SolicitudAccesoGTO } from "../../constants/acceso-gto-db-operations";
const { validate: uuidValidate } = require('uuid');
import JWT from "../../lib/jwt";

const queryAccesoGto = {
  Query: {
    /* Se obtiene los datos de la Solicitud de GTO */
    getSolicitudAccesoGTO: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      //Validar que sea un Guid
      if(!uuidValidate(parent.Oid)){
        return {
          status:false,
          mensaje: "La información es incorrecta."
        }
      }

      let eventQuery = get_SolicitudAccesoGTO(parent.Oid);
      let res = await psql.oneOrNone(eventQuery);

      if(res!=null){
        if(res.ModificadoPorInvitado || res.Vencido)
            return {
                status:true,
                modificado:res.ModificadoPorInvitado,
                vencido:res.Vencido,
            }
        
        return {
            status:true,
            modificado:false,
            vencido:false,
            solicitud:res
        }
      }

      return {
        status:false,
        mensaje: "No se encontro información de visita."
      }
    },
  },
};

export default queryAccesoGto;
