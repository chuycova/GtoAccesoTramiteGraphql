import {
  add_PlacasInvitado,
  add_SolicitudCita,
  get_SolicitudCitaTramiteXOid,
  get_VentanillaDisponible,
  update_ConfirmarCita,
  update_HorarioCita,
  update_SolicitudCita,
} from "../../constants/tramite-cita-db-operations";
import { ApiWelcome } from "../../data/envio-cita-app";

const _ApiWelcome = new ApiWelcome();

const mutationTramiteCita = {
  Mutation: {
    // /*Registro de de un nuevo Solicitante, regresa el Oid del Solicitante nuevo */
    // NuevoSolicitante: async (_: any, parent: any, { psql }: any) => {
    //   const solicitante = parent.solicitante;

    //   const Oid =
    //     "(SELECT(uuid_in(overlay(overlay(md5(random()::text || ':' || clock_timestamp()::text) placing '4' from 13) placing to_hex(floor(random()*(11-8+1) + 8)::int)::text from 17)::cstring)))";
    //   let eventQuery = `INSERT INTO "Solicitante"
    //       ("Oid", "Nombres", "PrimerApellido", "SegundoApellido", "Correo", "FechaCreacion", "Pass","Bloqueado","MaxVisitasMes","Mailing",
    //       "OptimisticLockField","GCRecord") VALUES
    //       (${Oid},'${noSqlInyection.remplazar(
    //     solicitante.Nombres
    //   )}','${noSqlInyection.remplazar(
    //     solicitante.PrimerApellido
    //   )}','${noSqlInyection.remplazar(
    //     solicitante.SegundoApellido
    //   )}','${noSqlInyection.remplazar(solicitante.Correo)}',(SELECT NOW()),'${
    //     solicitante.Pass
    //   }',false,2,${solicitante.Mailing},
    //       1,NULL)
    //       RETURNING "Oid"
    //       -- , "Nombres", "PrimerApellido",  "SegundoApellido",CONCAT("Nombres",' ',"PrimerApellido",' ',"SegundoApellido") AS "NombreSolicitante","Correo"
    //       ;
    //       `;
    //   let res = await psql.oneOrNone(eventQuery);
    //   if (res != null) {
    //     return {
    //       status: true,
    //       message: "Se guardo correctamente el Usuario",
    //       user: res,
    //     };
    //   } else {
    //     return {
    //       status: false,
    //       message: "Ha ocurrido un error, por favor valide sus datos.",
    //     };
    //   }
    // },
    /* Registro de una nueva Solicitud */
    NuevaSolicitudCita: async (_: any, parent: any, { psql }: any) => {
      const solicitud = parent.solicitud;

      let eventQueryVentanillaD = get_VentanillaDisponible(solicitud.HoraCita);
      let resVentanillaD = await psql.oneOrNone(eventQueryVentanillaD);

      if (resVentanillaD == null)
        return {
          status: false,
          message: "Horario",
        };
      else {
        let eventQuery = add_SolicitudCita(solicitud,resVentanillaD);
        let res = await psql.oneOrNone(eventQuery);
        if(res==null)
          return {
            status: false,
            message:"Error al Registrar cita"
          }
        // else{
        //   let eventQueryActualizarHorario = update_HorarioCita(solicitud.HoraCita);
        //   let resActualizarHorario = await psql.oneOrNone(eventQueryActualizarHorario);

        //   if(solicitud.Placas!=''){
        //     let eventQueryPlacas = add_PlacasInvitado(solicitud.Placas,solicitud.InvitadoTramiteCita);
        //     let resPlacas = await psql.query(eventQueryPlacas);
        //   }
        // }
        return {
          status: true,
          message: "Cita Registrada",
          cita: res
        };
      }
    },
    ConfirmarSolicitudCita: async (_: any, parent: any, { psql }: any) => {
      const solicitud = parent.solicitud;

      let eventQueryVentanillaD = get_VentanillaDisponible(solicitud.HoraCita);
      let resVentanillaD = await psql.oneOrNone(eventQueryVentanillaD);
      if (resVentanillaD == null)
        return {
          status: false,
          message: "Horario",
        };
      else {

        let eventQuerySolicitud = get_SolicitudCitaTramiteXOid(solicitud.Oid);
        let resSolicitud = await psql.oneOrNone(eventQuerySolicitud);
        if(resSolicitud!=null){

          //Actualizamos Horarios
          let eventQueryActualizarHorario = update_HorarioCita(solicitud.HoraCita);
          let resActualizarHorario = await psql.oneOrNone(eventQueryActualizarHorario);

          //Actualizamos Placas Invitado
          if(solicitud.Placas!=''){
            let eventQueryPlacas = add_PlacasInvitado(solicitud.Placas,solicitud.InvitadoTramiteCita);
            let resPlacas = await psql.query(eventQueryPlacas);
          }

          let eventQuery = update_ConfirmarCita(solicitud.Oid,1);
          let res = await psql.oneOrNone(eventQuery);
          try {
            let body = {
              solicitudId: 0,
              ouuid: solicitud.Oid,
              sucursalGuid:resSolicitud.SedeClave,
              solicitudTramite: {
                tramiteSincronizar: false,
                tramiteTipo: 2,
                tramiteVentanillaNumero: resSolicitud.Ventanilla,
                tramiteHorario: resSolicitud.HorarioCita,
                tramiteUnicacion: resSolicitud.VentanillaUbicacion,
              },
              solicitudConCita: true,
              solicitudEsTramite: true,
              solicitudTipo: 3,
              solicitudFecha: resSolicitud.FechaHoraSolicitud.replace(/\//g,'-'),
              solicitudFechaCita: resSolicitud.FechaHoraVisita.replace(/\//g,'-'),
              solicitudFechaCitaTermina: resSolicitud.FechaHoraFinVisita.replace(/\//g,'-'),
              personaFotografia: resSolicitud.UrlFoto,
              personaNombre: `${resSolicitud.Nombres} ${resSolicitud.PrimerApellido} ${resSolicitud.SegundoApellido}`,
              personaCurp: resSolicitud.CURP,
              personaPuesto: "--",
              solicitudUsuario: 11,
              solicitudPlacaVehicular: resSolicitud.Placas,
              solicitudPlacaCheck: 13,
              solicitudTramiteNombre:resSolicitud.Tramite,
              dependenciaNombre:resSolicitud.Dependencia,
              solicitudHoraCitaInicia: resSolicitud.FechaHoraVisita.split(' ')[1],
              solicitudHoraCitaTermina: resSolicitud.FechaHoraFinVisita.split(' ')[1],
              acompanantes:0,
              actualizarSolicitud:false,
              version:2
            };
            const response = await _ApiWelcome.api_cita_solicitud(body);
            if(response.error == 0){

              ///Rgistrar en tabla teporal
              ///Rgistrar en tabla teporal
              ///Rgistrar en tabla teporal
              ///Rgistrar en tabla teporal
              ///Rgistrar en tabla teporal
              ///Rgistrar en tabla teporal
              ///Rgistrar en tabla teporal

              return {
                status: true,
                message: "Cita Exitosa",
                cita: res
              };
            }else{
              let eventQuery = update_ConfirmarCita(solicitud.Oid,0);
              let res = await psql.oneOrNone(eventQuery);
              return {
                status: false,
                message: "Error en API"
              };
            }
          } catch (error) {
            let eventQuery = update_ConfirmarCita(solicitud.Oid,0);
            let res = await psql.oneOrNone(eventQuery);
            return {
              status: false,
              message: "Error en API"
            };
          } 
        }

      }
    },
    ActualizarSolicitudCitaNoConfirmada: async (_: any, parent: any, { psql }: any) => {
      const solicitud = parent.solicitud;

      let eventQueryVentanillaD = get_VentanillaDisponible(solicitud.HoraCita);
      let resVentanillaD = await psql.oneOrNone(eventQueryVentanillaD);

      if (resVentanillaD == null)
        return {
          status: false,
          message: "Horario",
        };
      else {
        let eventQuery = update_SolicitudCita(solicitud,resVentanillaD);
        let res = await psql.oneOrNone(eventQuery);
        if(res==null)
          return {
            status: false,
            message:"Error al guardar cita"
          }

        return {
          status: true,
          message: "Actualización Cita Exitosa",
          cita: [], //res
        };
      }
    },
    // CancelarSolicitud: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = `UPDATE "Solicitud"
    //       SET "MotivoCancelacion" = '${noSqlInyection.remplazar(
    //         parent.Motivo
    //       )}',
    //       "Estatus" = 3,
    //       "FechaHoraCancelacion" = (SELECT now())
    //       WHERE "Oid" = '${parent.Oid}'
    //       RETURNING
    //         "Oid";
    //       `;
    //   let res = await psql.oneOrNone(eventQuery);
    //   return res;
    // },
    // /* Cambio de Contraseña del Solicitante */
    // CambiarContraseniaSolicitud: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = `UPDATE "Solicitante"
    //       SET "Pass" = '${parent.pass}'
    //       WHERE "Oid" = '${parent.oid}'
    //       RETURNING
    //         "Oid",
    //         CONCAT("Nombres",' ',"PrimerApellido",' ',"SegundoApellido") AS "NombreSolicitante",
    //         "Nombres",
    //         "PrimerApellido",
    //         "SegundoApellido",
    //         "Correo";
    //       `;
    //   let res = await psql.oneOrNone(eventQuery);
    //   if (res != null) {
    //     return {
    //       status: true,
    //       message: "Se cambio contraseña el Usuario",
    //       user: res,
    //     };
    //   } else {
    //     return {
    //       status: false,
    //       message:
    //         "Ha ocurrido un error al cambiar contraseña, por favor valide sus datos.",
    //     };
    //   }
    // },
    // /* Actualización de datos del Solicitante */
    // ActualizarSolicitante: async (_: any, parent: any, { psql }: any) => {
    //   const solicitante = parent.solicitante;

    //   let eventQuery = `UPDATE "Solicitante"
    //       SET "Nombres" = '${noSqlInyection.remplazar(solicitante.Nombres)}',
    //       "PrimerApellido" = '${noSqlInyection.remplazar(
    //         solicitante.PrimerApellido
    //       )}',
    //       "SegundoApellido" = '${noSqlInyection.remplazar(
    //         solicitante.SegundoApellido
    //       )}',
    //       "Telefono" = '${noSqlInyection.remplazar(solicitante.Telefono)}',
    //       "Mailing" = ${solicitante.Mailing},
    //       "FotografiaDelanteraINEB64" = '${
    //         solicitante.FotografiaDelanteraINEB64
    //       }',
    //       "FotografiaTraseraINEB64" = '${solicitante.FotografiaTraseraINEB64}',
    //       "FotografiaCaraSolicitanteB64" = '${
    //         solicitante.FotografiaCaraSolicitanteB64
    //       }'
    //     WHERE "Oid" = '${solicitante.Oid}'
    //     RETURNING
    //       "Oid",
    //       CONCAT("Nombres",' ',"PrimerApellido",' ',"SegundoApellido") AS "NombreSolicitante",
    //       "Nombres",
    //       "PrimerApellido",
    //       "SegundoApellido",
    //       "Correo",
    //       CASE
    //         WHEN "FotografiaCaraSolicitanteB64" IS NOT NULL AND "FotografiaDelanteraINEB64" IS NOT NULL AND "FotografiaTraseraINEB64" IS NOT NULL THEN true
    //         ELSE false
    //       END AS "Fotos";
    //     `;
    //   let res = await psql.oneOrNone(eventQuery);
    //   if (res != null) {
    //     return {
    //       status: true,
    //       message: "Se actualizo la información del Usuario",
    //       token: new JWT().sign(res),
    //     };
    //   } else {
    //     return {
    //       status: false,
    //       message:
    //         "Ha ocurrido un error al actualizar la información del Usuario, por favor valide sus datos.",
    //     };
    //   }
    // },
    // /*Dar de Baja Suscripción */
    // BajaSuscripcion: async (_: any, parent: any, { psql }: any) => {
    //   let oidUsuarioVisita = "";
    //   let oidSuscriptor = "";
    //   try {
    //     let UsuarioVisita = Buffer.from(
    //       parent.usuarioVisita,
    //       "base64"
    //     ).toString("ascii");
    //     let Suscriptor = Buffer.from(parent.suscriptor, "base64").toString(
    //       "ascii"
    //     );

    //     oidUsuarioVisita = UsuarioVisita.split("").reverse().join("");
    //     oidSuscriptor = Suscriptor.split("").reverse().join("");
    //   } catch (e) {
    //     return {
    //       status: false,
    //       message: "Parametros no validos",
    //     };
    //   }

    //   try {

    //     let eventQuery = `SELECT "Oid" FROM
    //       "SuscriptoresAreaUsuario" WHERE "Oid" = '${oidSuscriptor}' and "UsuarioArea"='${oidUsuarioVisita}'
    //       AND "GCRecord" IS NULL `;
    //     let res = await psql.oneOrNone(eventQuery);

    //     if (res == null) {
    //       return {
    //         status: false,
    //         message: "Suscripción no encontrada",
    //       };
    //     }
    //   } catch (e) {
    //     return {
    //       status: false,
    //       message: "Parametros no validos",
    //     };
    //   }
    //   let eventQueryBaja = `SELECT "Oid" FROM
    //       "SuscriptoresAreaUsuario" WHERE "Oid" = '${oidSuscriptor}' and "UsuarioArea"='${oidUsuarioVisita}'
    //       AND "BajaMailing" IS TRUE
    //       AND "GCRecord" IS NULL
    //     `;
    //     let resBaja = await psql.oneOrNone(eventQueryBaja);

    //     if (resBaja != null) {
    //       return {
    //         status: false,
    //         message: "Ya se desactivo su suscripcion, previamente",
    //       };
    //     }

    //     let eventQuery = `UPDATE "SuscriptoresAreaUsuario"
    //       SET "BajaMailing" = TRUE,
    //       "FechaBajaMailing" = (SELECT NOW()),
    //       "MotivoBaja" = 1
    //       WHERE "Oid" = '${oidSuscriptor}' and "UsuarioArea"='${oidUsuarioVisita}'
    //       AND "GCRecord" IS NULL
    //     `;
    //     let res = await psql.oneOrNone(eventQuery);

    //     return {
    //       status: true,
    //       message: "Se actualizo la información del Suscriptor",
    //     };

    // },
  },
};
export default mutationTramiteCita;
