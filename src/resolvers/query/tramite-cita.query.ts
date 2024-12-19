// import JWT from "../../lib/jwt";
// import {
//   all_EntidadesFederativas,
//   all_TipoGrupo,
//   get_AllVisitas,
//   get_CancelacionVisitaValida,
//   get_ConfiguracionCorreo,
//   get_DiasTipoVisita,
//   get_ExisteSolicitante,
//   get_HorarioVisitaDisponibles,
//   get_InformacionPaginaPrincipal,
//   get_LimiteVisitaSolicitante,
//   get_LoginSolicitante,
//   get_LoginSolicitanteBloqueado,
//   get_MisVisitas,
//   get_MisVisitasPaginado,
//   get_Solicitante,
//   get_SolicitanteRecuperar,
//   get_TiposVisitas,
//   get_Visita,
//   get_VisitaXOid,
// } from "../../constants/TramiteCita-db-operations";

import { get_ConfiguracionCorreo, get_ExistePostulacionInvitado, get_HorariosXSedeTramiteXFecha, get_SedeTramiteXTramite, get_SolicitudCitaTramiteXOid } from "../../constants/tramite-cita-db-operations";

const queryTramiteCita = {
  Query: {
    getPostulacionInvitado: async (_: any, parent: any, { psql }: any) => {
        let eventQueryExiste = get_ExistePostulacionInvitado(parent.Oid);
        let resExiste = await psql.oneOrNone(eventQueryExiste);
        if (resExiste != null) {
          if (resExiste["Aceptado"] != true) {
            return {
              status: false,
              message: "Aceptado",
            };
          } else  if (resExiste["CitaRealizada"] == true && resExiste["Confirmar"] == false) {
            return {
              status: false,
              message: "CitaRealizada",
              postulante: resExiste,
            };
          } else {
              return {
                status: true,
                message: "Postulación Correcto",
                postulante: resExiste,
              };
            }
        } else {
          return {
            status: false,
            message: "No postulante.",
          };
        }
      },
      getSedeTramiteXTramite: async (_: any, parent: any, { psql }: any) => {
        let eventQuery = get_SedeTramiteXTramite(parent.Oid);
        let res = await psql.manyOrNone(eventQuery);
        return res;
      },
      getHorariosXSedeTramiteXFecha: async (_: any, parent: any, { psql }: any) => {
        let eventQuery = get_HorariosXSedeTramiteXFecha(parent.SedeTramite,parent.Fecha);
        let res = await psql.manyOrNone(eventQuery);
        return res;
      },
      getSolicitudTramiteCitaXOid: async (_: any, parent: any, { psql }: any) => {
        
        let uuidRegex: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (uuidRegex.test(parent.Oid)) {
          let eventQuery = get_SolicitudCitaTramiteXOid(parent.Oid);
          let res = await psql.oneOrNone(eventQuery);
          return res;
        }
        return null;
      },
    // /* Se consulta si hay un Solicitante el correo con la contraseña correcta, se devuelve un token*/
    // getLoginSolicitante: async (_: any, parent: any, { psql }: any) => {
    //   let eventQueryBloqueado = get_LoginSolicitanteBloqueado(parent.correo);
    //   let resBloqueado = await psql.oneOrNone(eventQueryBloqueado);
    //   if (resBloqueado != null) {
    //     if (resBloqueado["Bloqueado"]) {
    //       return {
    //         status: true,
    //         message: "Bloqueado",
    //       };
    //     } else {
    //       let eventQuery = get_LoginSolicitante(parent.correo, parent.pass);
    //       let res = await psql.oneOrNone(eventQuery);
    //       if (res != null) {
    //         return {
    //           status: true,
    //           message: "Usuario Correcto",
    //           token: new JWT().sign(res),
    //         };
    //       } else {
    //         return {
    //           status: false,
    //           message: "Usuario Inorrecto",
    //         };
    //       }
    //     }
    //   } else {
    //     return {
    //       status: false,
    //       message: "Usuario Inorrecto",
    //     };
    //   }
    // },
    // /* Se descomprime el token que recibe, 
    //   si el token esta activo regresa la información del Usuario que tiene el token
    //   si no esta activo no manda la información*/
    // miPerfil: async (_: void, __: any, { token }: any) => {
    //   let info: any = new JWT().verify(token);
    //   if (
    //     // No modificar mensaje, debe ser igual en este componente y en el de jwt par que funcione.
    //     info === "Token es inválida."
    //   ) {
    //     return {
    //       status: false,
    //       message: info,
    //       user: null,
    //     };
    //   }
    //   return {
    //     status: true,
    //     message: "Token correcto",
    //     user: info.user,
    //   };
    // },
    // /* Se obtienen todas las visitas del solicitante por medio de su Oid */
    // getAllVisitas: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_AllVisitas(parent.Oid);
    //   let res = await psql.query(eventQuery);
    //   return res;
    // },
    // /* Se obtienen todas las visitas del solicitante por medio de su Oid */
    // getMisVisitas: async (_: any, parent: any, { psql }: any) => {
    //   let filtros = parent.filtro;
    //   let eventQuery = get_MisVisitas(filtros);
    //   let res = await psql.manyOrNone(eventQuery);
    //   if (res.length == 0) {
    //     return {
    //       status: true,
    //       paginas: 0,
    //     };
    //   }

    //   let eventQueryPaginas = get_MisVisitasPaginado(filtros);
    //   let resPaginas = await psql.oneOrNone(eventQueryPaginas);
    //   return {
    //     status: true,
    //     totalRegistros: resPaginas["TotalRegistros"],
    //     paginas: resPaginas["Paginas"],
    //     visitas: res,
    //   };
    // },
    // /* Se obtienen la Informacion de una Vista por medio de su Oid */
    // getVisitaXOid: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_VisitaXOid(parent.Oid);
    //   let res = await psql.oneOrNone(eventQuery);
    //   return res;
    // },
    // getCancelacionVisitaValida: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_CancelacionVisitaValida(parent.Oid);
    //   let res = await psql.oneOrNone(eventQuery);
    //   return res;
    // },
    // /* Se obtiene la visitas del solicitante por medio de su Oid y la fecha de la visita */
    // getVisita: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_Visita(parent.Oid, parent.FechaVisita);
    //   let res = await psql.query(eventQuery);
    //   return res;
    // },
    // /* Validar si existe un usuario con el mismo correo */
    // getExisteSolicitante: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_ExisteSolicitante(parent.correo);
    //   let res = await psql.oneOrNone(eventQuery);
    //   if (res == null) {
    //     return {
    //       status: false,
    //       message: "Correo no registrado",
    //     };
    //   }

    //   let eventQueryBloqueado = get_LoginSolicitanteBloqueado(parent.correo);
    //   let resBloqueado = await psql.oneOrNone(eventQueryBloqueado);

    //   if (resBloqueado["Bloqueado"]) {
    //     return {
    //       status: true,
    //       message: "Bloqueado",
    //     };
    //   }

    //   //El Usuario Ya esta registrado
    //   return {
    //     status: true,
    //     message: "Correo ya registrado",
    //     user: res,
    //   };
    // },
    // /* Obtine todos los datos de un Usuario por el Oid*/
    // getSolicitante: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_Solicitante(parent.oid);
    //   let res = await psql.oneOrNone(eventQuery);
    //   if (res != null) {
    //     return {
    //       status: true,
    //       message: "Datos del Solicitante",
    //       user: res,
    //     };
    //   } else {
    //     return {
    //       status: false,
    //       message: "Error al obtener los datos del Solicitante",
    //     };
    //   }
    // },
    // /*Se busca el Solicitante para recuperar la contraseña y regresa un token con 5 min de duración */
    // getSolicitanteRecuperar: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_SolicitanteRecuperar(parent.oid);
    //   let res = await psql.oneOrNone(eventQuery);
    //   if (res != null) {
    //     return {
    //       status: true,
    //       message: "Usuario",
    //       token: new JWT().sign(res, 300),
    //     };
    //   } else {
    //     return {
    //       status: false,
    //       message: "Usuario Inorrecto",
    //     };
    //   }
    // },
    /* Configuración de Correo */
    getConfiguracionCorreo: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_ConfiguracionCorreo(parent.Tipo);
      let res = await psql.oneOrNone(eventQuery);
      return res;
    },

    // /* Limite de Visitas por Mes de Solicitante*/
    // getLimiteVisitaMesSolicitante: async (
    //   _: any,
    //   parent: any,
    //   { psql }: any
    // ) => {
    //   let eventQuery = get_LimiteVisitaSolicitante(parent.Oid, parent.Fecha);
    //   let res = await psql.oneOrNone(eventQuery);
    //   return res;
    // },

    // /* Tipos de Visita segun al Visitante*/
    // getTipoVisita: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_TiposVisitas(parent.OidVistaA);
    //   let res = await psql.manyOrNone(eventQuery);
    //   return res;
    // },

    // /* Dias permitidos de un Tipo de Visita*/
    // getDiasTipoVisita: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_DiasTipoVisita(parent.Oid);
    //   let res = await psql.oneOrNone(eventQuery);
    //   return res;
    // },

    // /* Entidades Federativas */
    // allEntidadesFederativas: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = all_EntidadesFederativas;
    //   let res = await psql.manyOrNone(eventQuery);
    //   return res;
    // },

    // /* Tipo de Grupo */
    // allTipoGrupo: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = all_TipoGrupo;
    //   let res = await psql.manyOrNone(eventQuery);
    //   return res;
    // },

    // /* Informacion Pagina Principal */
    // getInformacionPaginaPrincipal: async (
    //   _: any,
    //   parent: any,
    //   { psql }: any
    // ) => {
    //   let eventQuery = get_InformacionPaginaPrincipal;
    //   let res = await psql.oneOrNone(eventQuery);
    //   return res;
    // },

    // /* Horarios Diponibles*/
    // getHorarioVisitaDisponibles: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_HorarioVisitaDisponibles(
    //     parent.Fecha,
    //     parent.Hora,
    //     parent.TipoVisita
    //   );
    //   let res = await psql.manyOrNone(eventQuery);
    //   return res;
    // },
  },
};
export default queryTramiteCita;

