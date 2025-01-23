import {
  get_Cat_TIPO_VISITA,
  get_DiasInhabiles,
  get_PermisionPolicyUser,
  get_Sexo,
} from "../../constants/db-operations";
// import { ApiWelcome } from "../../data/envio-cita-app";
import { MailService } from "../../data/mail-send";

const _mailService = new MailService();

const queryGeneral = {
  Query: {
    /* Se obtiene los usuarios que pueden recibir visitas */
    getPermisionPolicyUser: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_PermisionPolicyUser(parent.grupo);
      let res = await psql.query(eventQuery);
      return res;
    },
    /* Envio de Correo */
    enviarCorreo: async (_: any, parent: any, { psql }: any) => {
      const correo = parent.estructura;
      _mailService.sendMail(
        correo.From,
        correo.To,
        correo.Subject,
        correo.Text
      );
      return { status: true, message: "Correo Enviado" };
    },
    /* Días Inhabiles*/
    getDiasInhabiles: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_DiasInhabiles;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    /* Catalogo de Sexo*/
    getSexo: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_Sexo;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },

    getFechaHora: async (_: void, parent: any, { psql }: any) => {
      let date = new Date(); 
      const currentDate = new Date();

      const gmtOffsetMinutes = currentDate.getTimezoneOffset();
      const gmtOffsetHours = gmtOffsetMinutes / 60;

      const fechaCompleta =new Intl.DateTimeFormat("es-Mx", {
        day: "2-digit",
        dayPeriod: "long",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Etc/GMT+6",
      })
        .format(date)
        .toString();

      return {
        FechaHora:fechaCompleta,
        Fecha: fechaCompleta.slice(0,10),
        Hora: fechaCompleta.slice(11,19),
        Zona: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      
    },
    /* Se obtiene los usuarios que pueden recibir visitas */
    getCatalogoTipoVista: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_Cat_TIPO_VISITA;
      let res = await psql.query(eventQuery);
      return res;
    },
  },
};
export default queryGeneral;
