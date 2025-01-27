import {
  get_CatalogoPosicion,
  get_InvitadosXGrupoAll,
  get_Oid,
  get_RolUsuarioLogin,
  get_SolicitudAccesoOid,
  get_SolicitudVisitaXOid,
  set_CambiarContraseniaUsuaroAcceso,
  set_CambiarNotificado,
  set_FotoInvitado,
  set_FotoObservaciones,
  set_NombreLimpio,
  set_NombreLimpioListaNegra,
  set_NuevoGrupo,
  set_actualizarGrupo,
  set_actualizarGrupoInvitado,
  set_actualizarInvitado,
  set_actualizarInvitado_Grupo,
  set_actualizarSolicitud,
  set_actualizarSolicitudVisita,
  set_cancelarSolicitud,
  set_nuevaEntradaSalida,
  set_nuevaSolicitudAcceso,
  set_nuevaVisitaGrupo,
  set_nuevaSolicitudAccesoVisitaGrupo,
  set_nuevoCargo,
  set_nuevoGrupoInvitado,
  set_nuevoInvitado,
  get_SolicitudesAccesoInvitadosGrupoAll,
  get_SolicitudAccesoGrupoOid,
  set_CambiarNotificadoGrupoVisita,
  set_cancelarSolicitudGrupoVisita,
  set_actualizarSolicitudGrupoVisita,
  set_actualizarInvitado_GrupoVisita,
  set_CambiarNotificadoVigencia,
} from "../../constants/acceso-db-operations";
import { get_ListaNegra } from "../../constants/acceso-lista-negra-db-operations";
import { get_PermisionPolicyUser } from "../../constants/db-operations";
import { add_PlacasInvitado, add_PlacasInvitadoXVisita, get_ConfiguracionCorreo, update_ConfirmarCita } from "../../constants/tramite-cita-db-operations";
import { ApiWelcome } from "../../data/envio-cita-app";
import { MailAPI } from "../../data/mail-source";
import { NoSqlInyection } from "../../lib/RemplazarSQL";
import JWT from "../../lib/jwt";
import { qrcode } from "../../lib/qrcode";
import { Utils } from "../../lib/utils";
import { ApiArchivos } from "../../utils/api-archivos";
import { NotificionVisita } from "../../utils/notificacion-visita";
const _ApiEnviarArchivo = new ApiArchivos();
const _ApiWelcome = new ApiWelcome();
var noSqlInyection = new NoSqlInyection();

const mutationAcceso = {
  Mutation: {
    /* Cambio de Contraseña del Usuario Acceso */
    CambiarContraseniaUsuaroAcceso: async (
      _: any,
      parent: any,
      { psql }: any
    ) => {
      let eventQuery = set_CambiarContraseniaUsuaroAcceso(
        parent.oid,
        parent.pass
      );
      let res = await psql.oneOrNone(eventQuery);
      if (res != null) {
        return {
          status: true,
          message: "Se cambio contraseña el Usuario",
          user: res,
        };
      } else {
        return {
          status: false,
          message:
            "Ha ocurrido un error al cambiar contraseña, por favor valide sus datos.",
        };
      }
    },
    /* Agregar un Nuevo Invitado */
    nuevoInvitado: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {
        throw new Error("Error de tiempo de respuesta");
      }
      let invitado = parent.invitado; //Rol 3 PreRegistro
      try {
        let eventQueryUsuario = get_RolUsuarioLogin(invitado.UsuarioRegistra);
        let resRol3 = await psql.manyOrNone(eventQueryUsuario);

        invitado.PreRegistro = resRol3.length == 1;
      } catch {}
      let eventQuery = set_nuevoInvitado(invitado);
      let res = await psql.oneOrNone(eventQuery);
      return res;
      
    },
    /* Actualizar Datos de Invitado */
    cambiarDatosInvitado: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      const invitado = parent.invitado;
      let eventQuery = set_actualizarInvitado(invitado);
      let res = await psql.oneOrNone(eventQuery);
      return res;      
    },
    /* Agregar una Solicitud de Acceso de un Invitado */
    nuevaSolicitudAcceso: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {   
        throw new Error("Error de tiempo de respuesta");
      }
      const eventQueryOid = await get_Oid;
      let resOid = await psql.oneOrNone(eventQueryOid);
      let solicitudAcceso = parent.solicitudAcceso;

      /*Validar Foto*/
      let responseUrlImagen = "";
      if (solicitudAcceso.FotografiaB64 != "") {
        let imagenBase64 = solicitudAcceso.FotografiaB64.split(",");
        let body = {
          interno: true,
          subcarpetadestinoftp: "AccesoTramiteInvitado",
          nombrearchivo: `${resOid.uuid_in}.png`,
          archivoB64: imagenBase64[1],
        };
        let _responseUrlImagen = await _ApiEnviarArchivo.envioArchivo(body);
        if(_responseUrlImagen != null && _responseUrlImagen.Exitosa == true)
          responseUrlImagen = _responseUrlImagen.Mensaje;
        solicitudAcceso.FotografiaB64 = responseUrlImagen;
      }

      /*Validar Cargo de la Persona de Visita*/
      let cargo: any;
      if (solicitudAcceso.CargoPersonaVisitada != "") {
        let util = new Utils();
        let eventQueryCargo = get_CatalogoPosicion;
        let resCargo = await psql.manyOrNone(eventQueryCargo);

        let CargoLimpio = util.removeAccents(
          solicitudAcceso.CargoPersonaVisitada.trim().toUpperCase()
        );
        let Micargo = resCargo.filter(
          (pos: any) =>
            util.removeAccents(pos.Nombre.trim().toUpperCase()) == CargoLimpio
        );
        if (Micargo.length == 0) {
          let eventQuery = set_nuevoCargo(CargoLimpio);
          cargo = await psql.oneOrNone(eventQuery);
        } else cargo = Micargo[0];

        solicitudAcceso.CargoPersonaVisitada = cargo.Oid;
      }

      //Rol 3 PreRegistro
      try {
        let eventQueryUsuario = get_RolUsuarioLogin(
          solicitudAcceso.RegistraEnVentanilla
        );
        let resRol3 = await psql.manyOrNone(eventQueryUsuario);

        solicitudAcceso.PreRegistro = resRol3.length == 1;
      } catch {}

      //Se Actualiza la foto de Invitado
      // try {
      //   let eventUpdateFotoInvitado = set_FotoInvitado(
      //     solicitudAcceso.Invitado,
      //     responseUrlImagen
      //   );
      //   let resUpdateFotoInvitado = await psql.manyOrNone(
      //     eventUpdateFotoInvitado
      //   );
      // } catch {}

      if (solicitudAcceso.PorcentajeListaNegra == undefined)
        solicitudAcceso.PorcentajeListaNegra = 0;
      
      
      if(solicitudAcceso.Vigencia.Dias.length>0){
        solicitudAcceso.EsPrincipal=true;
      }else
        solicitudAcceso.EsPrincipal=false;


      solicitudAcceso.SolicitudPrincipal=null;
      let eventQuery = set_nuevaSolicitudAcceso(solicitudAcceso);
      let res = await psql.oneOrNone(eventQuery);   
      //Actualizamos Placas Invitado
      if(solicitudAcceso.Placa!=''){
        let eventQueryPlacas = add_PlacasInvitadoXVisita(
          solicitudAcceso.Placa,
          solicitudAcceso.Marca,
          solicitudAcceso.Modelo,
          solicitudAcceso.Color,
          solicitudAcceso.Invitado);
        let resPlacas = await psql.query(eventQueryPlacas);
      }
        
      let dias = solicitudAcceso.Vigencia.Dias;
      if(dias.length==0){
        if(res!=null){

          //Actualizamos Placas Invitado
          if(solicitudAcceso.Placa!=''){
            let eventQueryPlacas = add_PlacasInvitadoXVisita(
              solicitudAcceso.Placa,
              solicitudAcceso.Marca,
              solicitudAcceso.Modelo,
              solicitudAcceso.Color,
              solicitudAcceso.Invitado);
            let resPlacas = await psql.query(eventQueryPlacas);
          }

          let eventQuerySolicitud = get_SolicitudVisitaXOid(res.Oid);
          let resSolicitud = await psql.oneOrNone(eventQuerySolicitud);
          try {
            let body = {
              solicitudId: 0,
              ouuid: res.Oid,
              sucursalGuid:resSolicitud.SedeClave,
              solicitudTramite: {
                tramiteSincronizar: false,
                tramiteTipo: 0,
                tramiteVentanillaNumero: "",
                tramiteHorario: "",
                tramiteUnicacion: "",
              },
              solicitudConCita: false,
              solicitudEsTramite: false,
              solicitudTipo: resSolicitud.TipoVisita,
              solicitudFecha: resSolicitud.FechaHoraSolicitud.replace(/\//g,'-'),
              solicitudFechaCita: resSolicitud.FechaHoraVisita.replace(/\//g,'-'),
              solicitudFechaCitaTermina: resSolicitud.FechaHoraFinVisita.replace(/\//g,'-'),
              personaFotografia: responseUrlImagen,
              personaNombre: `${resSolicitud.Nombres} ${resSolicitud.PrimerApellido} ${resSolicitud.SegundoApellido}`,
              personaCurp: resSolicitud.CURP,
              personaPuesto: "--",
              solicitudUsuario: 0,
              solicitudPlacaVehicular: resSolicitud.Placas,
              solicitudEstacionamiento: resSolicitud.OidTipoEstacionamiento,
              solicitudVehiculoMarca: resSolicitud.MarcaVehicular,
              solicitudVehiculoModelo: resSolicitud.ModeloVehicular,
              solicitudVehiculoColor: resSolicitud.ColorVehicular,
              solicitudPlacaCheck: 0,
              //solicitudTramiteNombre:resSolicitud.Tramite,
              dependenciaNombre:resSolicitud.Dependencia,
              solicitudHoraCitaInicia: resSolicitud.FechaHoraVisita.split(' ')[1],
              solicitudHoraCitaTermina: resSolicitud.FechaHoraFinVisita.split(' ')[1], 
              acompanantes: resSolicitud.NoAcompaniantes,
              actualizarSolicitud:false,
              cancelarSolicitud: false,
              version:2
            };
            const response = await _ApiWelcome.api_cita_solicitud(body);
            //Error de Registro
            if((response.status != undefined && response.status != null) ||
            response.error > 0 || response.estado == undefined || response.estado == null){
              //  Estatus 3 ErrorZZ
              //throw new ApolloError(men, response.statusText);
            }else{

              // let eventQueryApi = update_ConfirmarCita(res.Oid,4);
              // let resApi = await psql.oneOrNone(eventQueryApi);
            }
          } catch (error) {
            // console.log(error)

            // let eventQueryApi = update_ConfirmarCita(res.Oid,4);
            // let resApi = await psql.oneOrNone(eventQueryApi);
          } 
        }
      }
      else{
        solicitudAcceso.EsPrincipal=false;
        solicitudAcceso.SolicitudPrincipal=res.Oid;

        const convertirFechaStringAFecha= (fechaString:String) => {
          const [fecha, hora] = fechaString.split('T');
          const [year, month, day] = fecha.split('-').map(Number);
          const [hours, minutes] = hora.split(':').map(Number);
        
          // Recuerda que en JavaScript, el mes es 0-indexed (Enero es 0)
          return new Date(year, month - 1, day);
        };

        const convertirFechaAFechaStringCita = (fecha:Date,fechaHora:String) => {
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0'); // +1 porque los meses son 0-indexed
          const day = String(fecha.getDate()).padStart(2, '0');
          
          const hora = fechaHora.split('T')[1];
        
          // Recuerda que en JavaScript, el mes es 0-indexed (Enero es 0)
          return `${year}-${month}-${day}T${hora}`;
        };

        let _fechaInicio = solicitudAcceso.FechaHoraVisita;
        let _fechaFin = solicitudAcceso.Vigencia.FechaHoraFinVisita;
        let fechaConsecutivo =  convertirFechaStringAFecha(_fechaInicio);
        let fechaFin = convertirFechaStringAFecha(_fechaFin);
        let primero = true;
        //let _dias = ["D","L","M","X","J","V","S"]

        do{
          let numDia = fechaConsecutivo.getDay();
          if(primero || dias[numDia]){

            solicitudAcceso.FechaHoraVisita = convertirFechaAFechaStringCita(fechaConsecutivo,_fechaInicio)
            solicitudAcceso.FechaHoraFinVisita = convertirFechaAFechaStringCita(fechaConsecutivo,_fechaFin)

            let eventQueryConsecutivo = set_nuevaSolicitudAcceso(solicitudAcceso);
            let resConsecutivo = await psql.oneOrNone(eventQueryConsecutivo);
 
            if(resConsecutivo!=null){
              solicitudAcceso.FechaHoraVisita = fechaConsecutivo

              let eventQuerySolicitudConsecutivo = get_SolicitudVisitaXOid(resConsecutivo.Oid);
              let resSolicitudConsecutivo = await psql.oneOrNone(eventQuerySolicitudConsecutivo);
              try {
                let body = {
                  solicitudId: 0,
                  ouuid: resConsecutivo.Oid,
                  sucursalGuid:resSolicitudConsecutivo.SedeClave,
                  solicitudTramite: {
                    tramiteSincronizar: false,
                    tramiteTipo: 0,
                    tramiteVentanillaNumero: "",
                    tramiteHorario: "",
                    tramiteUnicacion: "",
                  },
                  solicitudConCita: false,
                  solicitudEsTramite: false,
                  solicitudTipo: resSolicitudConsecutivo.TipoVisita,
                  solicitudFecha: resSolicitudConsecutivo.FechaHoraSolicitud.replace(/\//g,'-'),
                  solicitudFechaCita: resSolicitudConsecutivo.FechaHoraVisita.replace(/\//g,'-'),
                  solicitudFechaCitaTermina: resSolicitudConsecutivo.FechaHoraFinVisita.replace(/\//g,'-'),
                  personaFotografia: responseUrlImagen,
                  personaNombre: `${resSolicitudConsecutivo.Nombres} ${resSolicitudConsecutivo.PrimerApellido} ${resSolicitudConsecutivo.SegundoApellido}`,
                  personaCurp: resSolicitudConsecutivo.CURP,
                  personaPuesto: "--",
                  solicitudUsuario: 0,
                  solicitudPlacaVehicular: resSolicitudConsecutivo.Placas,
                  solicitudEstacionamiento: resSolicitudConsecutivo.OidTipoEstacionamiento,
                  solicitudVehiculoMarca: resSolicitudConsecutivo.MarcaVehicular,
                  solicitudVehiculoModelo: resSolicitudConsecutivo.ModeloVehicular,
                  solicitudVehiculoColor: resSolicitudConsecutivo.ColorVehicular,
                  solicitudPlacaCheck: 0,
                  //solicitudTramiteNombre:resSolicitud.Tramite,
                  dependenciaNombre:resSolicitudConsecutivo.Dependencia,
                  solicitudHoraCitaInicia: resSolicitudConsecutivo.FechaHoraVisita.split(' ')[1],
                  solicitudHoraCitaTermina: resSolicitudConsecutivo.FechaHoraFinVisita.split(' ')[1],
                  acompanantes: resSolicitudConsecutivo.NoAcompaniantes,
                  actualizarSolicitud:false,
                  cancelarSolicitud: false,
                  version:2
                };
                const response = await _ApiWelcome.api_cita_solicitud(body);
                //Error de Registro
                if((response.status != undefined && response.status != null) ||
                response.error > 0 || response.estado == undefined || response.estado == null){
                  //  Estatus 3 ErrorZZ
                  //throw new ApolloError(men, response.statusText);
                }else{
                  
                }
              } catch (error) {
                // console.log(error)
      
                // let eventQueryApi = update_ConfirmarCita(res.Oid,4);
                // let resApi = await psql.oneOrNone(eventQueryApi);
              } 
            }
          }

          // Siguiente día
          fechaConsecutivo.setDate(fechaConsecutivo.getDate() + 1);
          primero = false;

        }while(fechaConsecutivo <= fechaFin);
        
        let eventQueryNotificacionVigencia = set_CambiarNotificadoVigencia(res.Oid);
        let resNotificacionVigencia = await psql.oneOrNone(eventQueryNotificacionVigencia);
        
        try {
          let eventQuerySolicitud = get_SolicitudVisitaXOid(res.Oid);
          let resSolicitud = await psql.oneOrNone(eventQuerySolicitud);
          if(resSolicitud.Correo!="" && resSolicitud.Correo!=null){
            //Información de la plantilla de correo para Visitas con Vigencias (13)
            let eventQueryCorreo = get_ConfiguracionCorreo('13');
            let resCorreo = await psql.oneOrNone(eventQueryCorreo);
            /*Envio de Notificaciones*/
            const notificionVisita = new NotificionVisita();
            const qrCode = new qrcode();
            //Crear QR
            let qr = await qrCode.generarQR(res.Oid);
            //Envio de Correos
            let enviarCorreo = await notificionVisita.notificacionCorreoVigencia(resCorreo,info.user.CopiaCita,info.user.Correo,resSolicitud,qr);
          }
        } catch (error) {
          console.log(error)
        }
      }

      return res;
      
    },
    /* Actualizar Datos de Visita PreRegistro */
    cambiarSolicitudAccesoVisita: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let solicitudAcceso = parent.solicitudAcceso;

      let eventQuery = set_actualizarSolicitudVisita(solicitudAcceso);
      let res = await psql.oneOrNone(eventQuery);

      let eventQuerySolicitud = get_SolicitudVisitaXOid(solicitudAcceso.Oid);
      let resSolicitud = await psql.oneOrNone(eventQuerySolicitud);
      try {
        let body = {
          solicitudId: 0,
          ouuid: res.Oid,
          sucursalGuid:resSolicitud.SedeClave,
          solicitudTramite: {
            tramiteSincronizar: false,
            tramiteTipo: 0,
            tramiteVentanillaNumero: "",
            tramiteHorario: "",
            tramiteUnicacion: "",
          },
          solicitudConCita: false,
          solicitudEsTramite: false,
          solicitudTipo: resSolicitud.TipoVisita,
          solicitudFecha: resSolicitud.FechaHoraSolicitud.replace(/\//g,'-'),
          solicitudFechaCita: resSolicitud.FechaHoraVisita.replace(/\//g,'-'),
          solicitudFechaCitaTermina: resSolicitud.FechaHoraFinVisita.replace(/\//g,'-'),
          personaFotografia: "",
          personaNombre: `${resSolicitud.Nombres} ${resSolicitud.PrimerApellido} ${resSolicitud.SegundoApellido}`,
          personaCurp: resSolicitud.CURP,
          personaPuesto: "--",
          solicitudUsuario: 0,
          solicitudPlacaVehicular: resSolicitud.Placas,
          solicitudEstacionamiento: resSolicitud.OidTipoEstacionamiento,
          solicitudVehiculoMarca: resSolicitud.MarcaVehicular,
          solicitudVehiculoModelo: resSolicitud.ModeloVehicular,
          solicitudVehiculoColor: resSolicitud.ColorVehicular,
          solicitudPlacaCheck: 0,
          //solicitudTramiteNombre:resSolicitud.Tramite,
          dependenciaNombre:resSolicitud.Dependencia,
          solicitudHoraCitaInicia: resSolicitud.FechaHoraVisita.split(' ')[1],
          solicitudHoraCitaTermina: resSolicitud.FechaHoraFinVisita.split(' ')[1],
          acompanantes: resSolicitud.NoAcompaniantes,
          actualizarSolicitud:true,
          cancelarSolicitud: false,
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

        }else{
          
          // let eventQueryApi = update_ConfirmarCita(res.Oid,4);
          // let resApi = await psql.oneOrNone(eventQueryApi);
        }
      } catch (error) {

        // let eventQueryApi = update_ConfirmarCita(res.Oid,4);
        // let resApi = await psql.oneOrNone(eventQueryApi);
      } 

      return res;
      
    },
    /* Cancelar Visita */
    cancelarSolicitudAcceso: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let solicitudAcceso = parent.solicitudAcceso;

      solicitudAcceso.RegistraEnVentanilla = info.user.Oid;

      let eventQuery = set_cancelarSolicitud(solicitudAcceso);
      let res = await psql.oneOrNone(eventQuery);
      
      let eventQuerySolicitud = get_SolicitudVisitaXOid(solicitudAcceso.Oid);
      let resSolicitud = await psql.oneOrNone(eventQuerySolicitud);
      try {
        let body = {
          solicitudId: 0,
          ouuid: res.Oid,
          // sucursalGuid:resSolicitud.SedeClave,
          // solicitudTramite: {
          //   tramiteSincronizar: false,
          //   tramiteTipo: 0,
          //   tramiteVentanillaNumero: "",
          //   tramiteHorario: "",
          //   tramiteUnicacion: "",
          // },
          // solicitudConCita: false,
          // solicitudEsTramite: false,
          // solicitudTipo: resSolicitud.TipoVisita,
          // solicitudFecha: resSolicitud.FechaHoraSolicitud.replace(/\//g,'-'),
          // solicitudFechaCita: resSolicitud.FechaHoraVisita.replace(/\//g,'-'),
          // solicitudFechaCitaTermina: resSolicitud.FechaHoraFinVisita.replace(/\//g,'-'),
          // personaFotografia: "",
          // personaNombre: `${resSolicitud.Nombres} ${resSolicitud.PrimerApellido} ${resSolicitud.SegundoApellido}`,
          // personaCurp: resSolicitud.CURP,
          // personaPuesto: "--",
          // solicitudUsuario: 0,
          // solicitudPlacaVehicular: resSolicitud.Placas,
          // solicitudEstacionamiento: resSolicitud.OidTipoEstacionamiento,
          // solicitudVehiculoMarca: resSolicitud.MarcaVehicular,
          // solicitudVehiculoModelo: resSolicitud.ModeloVehicular,
          // solicitudVehiculoColor: resSolicitud.ColorVehicular,
          // solicitudPlacaCheck: 0,
          // //solicitudTramiteNombre:resSolicitud.Tramite,
          // dependenciaNombre:resSolicitud.Dependencia,
          // solicitudHoraCitaInicia: resSolicitud.FechaHoraVisita.split(' ')[1],
          // solicitudHoraCitaTermina: resSolicitud.FechaHoraFinVisita.split(' ')[1],
          actualizarSolicitud:false,
          cancelarSolicitud: true,
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

        }else{
          
          // let eventQueryApi = update_ConfirmarCita(res.Oid,4);
          // let resApi = await psql.oneOrNone(eventQueryApi);
        }
      } catch (error) {
        // console.log(error)

        // let eventQueryApi = update_ConfirmarCita(res.Oid,4);
        // let resApi = await psql.oneOrNone(eventQueryApi);
      } 

      return res;
      
    },
    /* Actualizar Datos de Solicitud PreRegistro */
    cambiarSolicitudAcceso: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let solicitudAcceso = parent.solicitudAcceso;

      /*Validar Foto*/
      let responseUrlImagen = "";
      if (solicitudAcceso.FotografiaB64 != "") {
        let imagenBase64 = solicitudAcceso.FotografiaB64.split(",");
        let body = {
          interno: true,
          subcarpetadestinoftp: "AccesoTramiteInvitado",
          nombrearchivo: `${solicitudAcceso.Oid}.png`,
          archivoB64: imagenBase64[1],
        };
        let _responseUrlImagen = await _ApiEnviarArchivo.envioArchivo(body);
        if(_responseUrlImagen != null && _responseUrlImagen.Exitosa == true)
          responseUrlImagen = _responseUrlImagen.Mensaje;
        solicitudAcceso.FotografiaB64 = responseUrlImagen;
      }
      if (solicitudAcceso.PorcentajeListaNegra == undefined)
        solicitudAcceso.PorcentajeListaNegra = 0;

      // //Se Actualiza la foto de Invitado
      // try {
      //   let eventOidInvitado = get_SolicitudAccesoOid(solicitudAcceso.Oid);
      //   let resOidInvitado = await psql.oneOrNone(eventOidInvitado);

      //   let eventUpdateFotoInvitado = set_FotoInvitado(resOidInvitado.OidInvitado,responseUrlImagen);
      //   let resUpdateFotoInvitado = await psql.manyOrNone(eventUpdateFotoInvitado);
      // } catch {}

      let eventQuery = set_actualizarSolicitud(solicitudAcceso);
      let res = await psql.oneOrNone(eventQuery);

      
      if(res!=null){
        let eventQuerySolicitud = get_SolicitudVisitaXOid(res.Oid);
        let resSolicitud = await psql.oneOrNone(eventQuerySolicitud);
        //Actualizamos Placas Invitado
        if(solicitudAcceso.Placa!=''){
          let eventQueryPlacas = add_PlacasInvitadoXVisita(
            solicitudAcceso.Placa,
            solicitudAcceso.Marca,
            solicitudAcceso.Modelo,
            solicitudAcceso.Color,
            resSolicitud.Invitado);
          let resPlacas = await psql.query(eventQueryPlacas);
        }
        try {
          let body = {
            solicitudId: 0,
            ouuid: res.Oid,
            sucursalGuid:resSolicitud.SedeClave,
            solicitudTramite: {
              tramiteSincronizar: false,
              tramiteTipo: 0,
              tramiteVentanillaNumero: "",
              tramiteHorario: "",
              tramiteUnicacion: "",
            },
            solicitudConCita: false,
            solicitudEsTramite: false,
            solicitudTipo: resSolicitud.TipoVisita,
            solicitudFecha: resSolicitud.FechaHoraSolicitud.replace(/\//g,'-'),
            solicitudFechaCita: resSolicitud.FechaHoraVisita.replace(/\//g,'-'),
            solicitudFechaCitaTermina: resSolicitud.FechaHoraFinVisita.replace(/\//g,'-'),
            personaFotografia: responseUrlImagen,
            personaNombre: `${resSolicitud.Nombres} ${resSolicitud.PrimerApellido} ${resSolicitud.SegundoApellido}`,
            personaCurp: resSolicitud.CURP,
            personaPuesto: "--",
            solicitudUsuario: 0,
            solicitudPlacaVehicular: resSolicitud.Placas,
            solicitudEstacionamiento: resSolicitud.OidTipoEstacionamiento,
            solicitudVehiculoMarca: resSolicitud.MarcaVehicular,
            solicitudVehiculoModelo: resSolicitud.ModeloVehicular,
            solicitudVehiculoColor: resSolicitud.ColorVehicular,
            solicitudPlacaCheck: 0,
            //solicitudTramiteNombre:resSolicitud.Tramite,
            dependenciaNombre:resSolicitud.Dependencia,
            solicitudHoraCitaInicia: resSolicitud.FechaHoraVisita.split(' ')[1],
            solicitudHoraCitaTermina: resSolicitud.FechaHoraFinVisita.split(' ')[1],
            acompanantes: resSolicitud.NoAcompaniantes,
            actualizarSolicitud:true,
            cancelarSolicitud: false,
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
  
          }else{
            
            // let eventQueryApi = update_ConfirmarCita(res.Oid,4);
            // let resApi = await psql.oneOrNone(eventQueryApi);
          }
        } catch (error) {
          // console.log(error)
  
          // let eventQueryApi = update_ConfirmarCita(res.Oid,4);
          // let resApi = await psql.oneOrNone(eventQueryApi);
        } 
      }
      return res;
      
    },
    /* Agregar un Entrada o Salida de Solicitud */
    nuevaEntradaSalida: async (_: any, parent: any, { psql }: any) => {
      const entradaSalida = parent.entradaSalida;
      let eventQuery = set_nuevaEntradaSalida(entradaSalida);
      let res = await psql.oneOrNone(eventQuery);
      return res;
    },
    /* Modificar que ya se mando Notificación al Invitado*/
    cambiarNotificado: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {
        throw new Error("Error de tiempo de respuesta");
      }
      const OidInvitado = parent.Oid;
      let eventQuery = set_CambiarNotificado(OidInvitado);
      let res = await psql.oneOrNone(eventQuery);
      if (res != null)
        return {
          status: true,
        };

      return {
        status: false,
      };
      
    },
    /* Modificar la Foto del Invitado y poder adjuntar comentarios */
    cambiarFotoObservaciones: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      const solicitud = parent.solicitud;
      /*Validar Foto*/
      let responseUrlImagen = "";
      if(solicitud.FotografiaB64.startsWith("https")){
        responseUrlImagen = solicitud.FotografiaB64;
      }else {
        if (solicitud.FotografiaB64 != "") {
          let imagenBase64 = solicitud.FotografiaB64.split(",");
          let body = {
            interno: true,
            subcarpetadestinoftp: "AccesoTramiteInvitado",
            nombrearchivo: `${solicitud.Oid}.png`,
            archivoB64: imagenBase64[1],
          };
          let _responseUrlImagen = await _ApiEnviarArchivo.envioArchivo(body);
          if(_responseUrlImagen != null && _responseUrlImagen.Exitosa == true)
            responseUrlImagen = _responseUrlImagen.Mensaje;
          solicitud.FotografiaB64 = responseUrlImagen;
        }
      }

      // //Se Actualiza la foto de Invitado
      // try {
      //   let eventOidInvitado = get_SolicitudAccesoOid(solicitud.Oid);
      //   let resOidInvitado = await psql.oneOrNone(eventOidInvitado);
        
      //   let eventUpdateFotoInvitado = set_FotoInvitado(resOidInvitado.OidInvitado,responseUrlImagen);
      //   let resUpdateFotoInvitado = await psql.manyOrNone(eventUpdateFotoInvitado);
      // } catch {}

      let eventQuery = set_FotoObservaciones(
        solicitud.Oid,
        solicitud.FotografiaB64,
        solicitud.Asunto
      );

      let res = await psql.oneOrNone(eventQuery);
      if (res != null)
        return {
          status: true,
        };

      return {
        status: false,
      };
    },
    /* Agregar un grupo */
    nuevoGrupo: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      const grupo = parent.grupo;

      let eventQuery = set_NuevoGrupo(grupo,info.user.Oid);
      let res = await psql.oneOrNone(eventQuery);
      if(res!=null){
        //Agregar Invitados a Grupo
        for (let element of grupo.Invitados) {
          let invitado = {...element};
          let oid = invitado.OidInvitado;
          if(invitado.OidInvitado == ""){
            invitado.OidSexo = '';
            invitado.Procedencia = '';
            invitado.FotografiaB64 = '';
            invitado.UsuarioRegistra = info.user.Oid;
            invitado.PreRegistro = true;
            let eventQueryInvitado = set_nuevoInvitado(invitado);
            let resInvitado = await psql.oneOrNone(eventQueryInvitado);
            oid = resInvitado.Oid;
          }else{
            let eventQueryInvitado = set_actualizarInvitado_Grupo(element);
            let resInvitado = await psql.oneOrNone(eventQueryInvitado);
          }
          
          let eventQueryGrupoInvitado = set_nuevoGrupoInvitado(res.Oid,oid,info.user.Oid);
          let resGrupoInvitado = await psql.oneOrNone(eventQueryGrupoInvitado);
        }
      }
      return res;
    
    },
    /* Actualizar un grupo */
    actualiarGrupo: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      const grupo = parent.grupo;
      let eventQuery = set_actualizarGrupo(grupo);
      let res = await psql.oneOrNone(eventQuery);
      if(res!=null){
        //Agregar Invitados a Grupo
        for (let element of grupo.Invitados) {
          let invitado = {...element};
          let oid = invitado.OidInvitado;
          if(invitado.OidInvitado == ""){
            invitado.OidSexo = '';
            invitado.Procedencia = '';
            invitado.FotografiaB64 = '';
            invitado.UsuarioRegistra = info.user.Oid;
            invitado.PreRegistro = true;
            let eventQueryInvitado = set_nuevoInvitado(invitado);
            let resInvitado = await psql.oneOrNone(eventQueryInvitado);
            oid = resInvitado.Oid;
          }else{
            let eventQueryInvitado = set_actualizarInvitado_Grupo(element);
            let resInvitado = await psql.oneOrNone(eventQueryInvitado);
          }
          if(invitado.Oid==""){
            let eventQueryGrupoInvitado = set_nuevoGrupoInvitado(res.Oid,oid,info.user.Oid);
            let resGrupoInvitado = await psql.oneOrNone(eventQueryGrupoInvitado);
          }else{
            let eventQueryGrupoInvitado = set_actualizarGrupoInvitado(invitado.Oid,invitado.Activo);
            let resGrupoInvitado = await psql.oneOrNone(eventQueryGrupoInvitado);
          }
        }
      }
      return res;
    },

    /* Agregar una Solicitud de Acceso en Grupo */
    nuevaVisitaGrupo: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      const solicitud = parent.solicitudAccesoGrupo;

      //Rol 3 PreRegistro
      try {
        let eventQueryUsuario = get_RolUsuarioLogin(info.user.Oid);
        let resRol3 = await psql.manyOrNone(eventQueryUsuario);

        solicitud.PreRegistro = resRol3.length == 1;
      } catch {}
      
      let eventQuery = set_nuevaVisitaGrupo(solicitud,info.user.Oid);
      let res = await psql.oneOrNone(eventQuery);
      
      if(res!=null){

        for (let element of solicitud.Invitados) {
          if(element.ActualizarEstacionamientoInvitado){
            let eventQueryInvitado = set_actualizarInvitado_GrupoVisita(element);
            let resInvitado = await psql.oneOrNone(eventQueryInvitado);
          } 
        }

        //Obtenemos los invitados Activos de ese grupo
        let eventQueryInvitados = get_InvitadosXGrupoAll({OidGrupo:solicitud.OidGrupo,Activo:true});
        let resInvitados = await psql.manyOrNone(eventQueryInvitados);

        //Realizar las Solicitudes de Acceso
        for (let element of resInvitados) {

          let solicitudAcceso = {
            GrupoVisita: res.Oid,
            VisitaA: solicitud.VisitaA,
            Invitado: element.OidInvitado,
            Asunto: solicitud.Comentario,
            RegistraEnVentanilla: info.user.Oid,
            FechaHoraVisita: solicitud.FechaHoraVisita,
            FechaHoraFinVisita: solicitud.FechaHoraFinVisita,
            TipoVisita: solicitud.TipoVisita,
            Placas: element.Placa,
            TipoEstacionamiento: (solicitud.TipoEstacionamiento == null || solicitud.TipoEstacionamiento== undefined || solicitud.TipoEstacionamiento== "")?element.OidTipoEstacionamiento:solicitud.TipoEstacionamiento,
            PreRegistro: solicitud.PreRegistro,
            Contacto: solicitud.Contacto,
            CorreoContacto: solicitud.CorreoContacto,
            TelefonoContacto: solicitud.TelefonoContacto,
            ExtensionContacto: solicitud.ExtensionContacto,
          }
          let eventQueryNuevaSolicitud = set_nuevaSolicitudAccesoVisitaGrupo(solicitudAcceso);
          let resNuevaSolicitud = await psql.oneOrNone(eventQueryNuevaSolicitud);

          if(resNuevaSolicitud!=null){

            let eventQuerySolicitud = get_SolicitudVisitaXOid(resNuevaSolicitud.Oid);
            let resSolicitud = await psql.oneOrNone(eventQuerySolicitud);
            let datos = {
              OidSolicitud: resNuevaSolicitud.Oid,
              SedeClave: resSolicitud.SedeClave,
              TipoVisita: resSolicitud.TipoVisita,
              FechaHoraSolicitud: resSolicitud.FechaHoraSolicitud,
              FechaHoraVisita: resSolicitud.FechaHoraVisita,
              FechaHoraFinVisita: resSolicitud.FechaHoraFinVisita,
              Nombres: resSolicitud.Nombres,
              PrimerApellido: resSolicitud.PrimerApellido,
              SegundoApellido: resSolicitud.SegundoApellido,
              CURP: resSolicitud.CURP,
              Placas: resSolicitud.Placas,
              Estacionamiento: resSolicitud.OidTipoEstacionamiento,
              MarcaVehicular: resSolicitud.MarcaVehicular,
              ModeloVehicular: resSolicitud.ModeloVehicular,
              ColorVehicular: resSolicitud.ColorVehicular,
              Dependencia: resSolicitud.Dependencia,
              NoAcompaniantes:0,
              Actualizar:false,
              CancelarVisita: false
            }
            mandarApiZZGrupo(datos,psql);
          }
        }
      }
      return res;
    
    },
    
    /* Modificar que ya se mando Notificación al Invitado*/
    cambiarNotificadoVisitaGrupo: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {
        throw new Error("Error de tiempo de respuesta");
      }
      const OidGrupoVisita = parent.Oid;

      //Información de la plantilla de correo (4)
      let eventQueryCorreo = get_ConfiguracionCorreo('4');
      let resCorreo = await psql.oneOrNone(eventQueryCorreo);

      //Información de la plantilla de WhatsApp 
      let eventQueryWhatsApp = get_ConfiguracionCorreo('5');
      let resWhatsApp = await psql.oneOrNone(eventQueryWhatsApp);
      
      //Solicitudes que tienen asociado al GrupoVisita
      let eventQuerySolicitudes = get_SolicitudesAccesoInvitadosGrupoAll(OidGrupoVisita);
      let resSolicitudes = await psql.manyOrNone(eventQuerySolicitudes);
      let exitosos=0;
      if(resSolicitudes!=null){
        const qrCode = new qrcode();
        const notificionVisita = new NotificionVisita();

        for (let sol of resSolicitudes) {
          try {
            //Crear QR
            let qr = await qrCode.generarQR(sol.Oid);
            //Envio de Correos
            let enviarCorreo = await notificionVisita.notificacionCorreo(resCorreo,info.user.CopiaCita,info.user.Correo,sol,qr);
            //Envio de WhatsApp
            let enviarWhatsApp = await notificionVisita.notificacionWhatsApp(resWhatsApp,sol,qr);
            
            if(enviarCorreo || enviarWhatsApp.status){
              let eventQuery = set_CambiarNotificado(sol.Oid);
              let res = await psql.oneOrNone(eventQuery);
              exitosos++;
            }

          } catch (error) {
            // console.log(error)
          }

          
        }
      
      }
      if(exitosos>0){

        let eventQuery = set_CambiarNotificadoGrupoVisita(OidGrupoVisita);
        let res = await psql.oneOrNone(eventQuery);

        return {
          status: true,
          message: `${exitosos}/${resSolicitudes.length}`
        };

      }
      
      return {
        status: false
      };
    },

    /* Cancelar Visita de Grupo */
    cancelarSolicitudAccesoVisitaGrupo: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let OidGrupoVisita = parent.Oid;

      //Solicitudes que tienen asociado al GrupoVisita
      let eventQuerySolicitudes = get_SolicitudesAccesoInvitadosGrupoAll(OidGrupoVisita);
      let resSolicitudes = await psql.manyOrNone(eventQuerySolicitudes);
      let exitosos=0;
      if(resSolicitudes!=null){
        for (let sol of resSolicitudes) {
          try {
            let eventQuerySolicitud = set_cancelarSolicitud({Oid:sol.Oid,RegistraEnVentanilla:info.user.Oid});
            let resSolicitud = await psql.oneOrNone(eventQuerySolicitud);
            if(resSolicitud!=null){
              exitosos++;
            }
            let eventQuerySolicitudConsulta = get_SolicitudVisitaXOid(sol.Oid);
            let resSolicitudConsulta = await psql.oneOrNone(eventQuerySolicitudConsulta);
            let datos = {
              OidSolicitud: resSolicitudConsulta.Oid,
              SedeClave: resSolicitudConsulta.SedeClave,
              TipoVisita: resSolicitudConsulta.TipoVisita,
              FechaHoraSolicitud: resSolicitudConsulta.FechaHoraSolicitud,
              FechaHoraVisita: resSolicitudConsulta.FechaHoraVisita,
              FechaHoraFinVisita: resSolicitudConsulta.FechaHoraFinVisita,
              Nombres: resSolicitudConsulta.Nombres,
              PrimerApellido: resSolicitudConsulta.PrimerApellido,
              SegundoApellido: resSolicitudConsulta.SegundoApellido,
              CURP: resSolicitudConsulta.CURP,
              Placas: resSolicitudConsulta.Placas,
              Estacionamiento: resSolicitudConsulta.OidTipoEstacionamiento,
              MarcaVehicular: resSolicitudConsulta.MarcaVehicular,
              ModeloVehicular: resSolicitudConsulta.ModeloVehicular,
              ColorVehicular: resSolicitudConsulta.ColorVehicular,
              Dependencia: resSolicitudConsulta.Dependencia,
              NoAcompaniantes:0,
              Actualizar:true,
              CancelarVisita: true
            }
            mandarApiZZGrupo(datos,psql);

          } catch (error) {
          }
        }
      }

      if(exitosos==resSolicitudes.length){
        let eventQuery = set_cancelarSolicitudGrupoVisita(OidGrupoVisita,info.user.Oid);
        let res = await psql.oneOrNone(eventQuery);
        return {
          status: true,
          message: `${exitosos}/${resSolicitudes.length}`
        };
      }
      return {
        status: false,
        message: `${exitosos}/${resSolicitudes.length}`
      };
      
    },
    
    /* Cancelar Visita de Grupo (VisitaA, Fecha, Hora, Autoriza)*/
    cambiarSolicitudAccesoVisitaGrupo: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let GrupoVisita = parent.solicitudAccesoVisitaGrupo;

      //Solicitudes que tienen asociado al GrupoVisita
      let eventQuerySolicitudes = get_SolicitudesAccesoInvitadosGrupoAll(GrupoVisita.Oid);
      let resSolicitudes = await psql.manyOrNone(eventQuerySolicitudes);
      let exitosos=0;

      if(resSolicitudes!=null){
        for (let sol of resSolicitudes) {
          try {
            let solicitud = {...GrupoVisita};
            solicitud.Oid = sol.Oid;
            let eventQuerySolicitud = set_actualizarSolicitudVisita(solicitud);
            let resSolicitud = await psql.oneOrNone(eventQuerySolicitud);
            if(resSolicitud!=null){
              exitosos++;
            }

            let eventQuerySolicitudConsulta = get_SolicitudVisitaXOid(sol.Oid);
            let resSolicitudConsulta = await psql.oneOrNone(eventQuerySolicitudConsulta);
            let datos = {
              OidSolicitud: resSolicitudConsulta.Oid,
              SedeClave: resSolicitudConsulta.SedeClave,
              TipoVisita: resSolicitudConsulta.TipoVisita,
              FechaHoraSolicitud: resSolicitudConsulta.FechaHoraSolicitud,
              FechaHoraVisita: resSolicitudConsulta.FechaHoraVisita,
              FechaHoraFinVisita: resSolicitudConsulta.FechaHoraFinVisita,
              Nombres: resSolicitudConsulta.Nombres,
              PrimerApellido: resSolicitudConsulta.PrimerApellido,
              SegundoApellido: resSolicitudConsulta.SegundoApellido,
              CURP: resSolicitudConsulta.CURP,
              Placas: resSolicitudConsulta.Placas,
              Estacionamiento: resSolicitudConsulta.OidTipoEstacionamiento,
              MarcaVehicular: resSolicitudConsulta.MarcaVehicular,
              ModeloVehicular: resSolicitudConsulta.ModeloVehicular,
              ColorVehicular: resSolicitudConsulta.ColorVehicular,
              Dependencia: resSolicitudConsulta.Dependencia,
              NoAcompaniantes:0,
              Actualizar:true,
              CancelarVisita: false
            }
            mandarApiZZGrupo(datos,psql);

          } catch (error) {
          }
        }
      }

      if(exitosos==resSolicitudes.length){
        let eventQuery = set_actualizarSolicitudGrupoVisita(GrupoVisita);
        let res = await psql.oneOrNone(eventQuery);
        return {
          status: true,
          message: `${exitosos}/${resSolicitudes.length}`
        };
      }
      return {
        status: false,
        message: `${exitosos}/${resSolicitudes.length}`
      };
      
    },

    /* Normalizar los nombres de los Usuarios (Visita A) */
    normalizarNombreUsuario: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_PermisionPolicyUser(parent.grupo);
      let res = await psql.query(eventQuery);
      let eventQueryUpdate = "";
      res.forEach((element: any) => {
        let nomLimpio = element.Nombre.normalize("NFD").replace(
          /[\u0300-\u0301]/g,
          ""
        );
        eventQueryUpdate += set_NombreLimpio(element.Oid, nomLimpio);
      });
      let resMutation = await psql.oneOrNone(eventQueryUpdate);
      return {
        status: true,
      };
    },
    normalizarNombreListaNegra: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_ListaNegra;
      let res = await psql.query(eventQuery);
      let eventQueryUpdate = "";
      res.forEach((element: any) => {
        let nomLimpio = element.NombreInvitado.normalize("NFD").replace(
          /[\u0300-\u0301]/g,
          ""
        );
        eventQueryUpdate += set_NombreLimpioListaNegra(element.Oid, nomLimpio);
      });
      let resMutation = await psql.oneOrNone(eventQueryUpdate);
      return {
        status: true,
      };
    },
  },
};

async function mandarApiZZGrupo(datos:any,psql:any){
  try {
    let body = {
      solicitudId: 0,
      ouuid: datos.OidSolicitud,
      sucursalGuid: datos.SedeClave,
      solicitudTramite: {
        tramiteSincronizar: false,
        tramiteTipo: 0,
        tramiteVentanillaNumero: "",
        tramiteHorario: "",
        tramiteUnicacion: "",
      },
      solicitudConCita: false,
      solicitudEsTramite: false,
      solicitudTipo: datos.TipoVisita,
      solicitudFecha: datos.FechaHoraSolicitud.replace(/\//g,'-'),
      solicitudFechaCita: datos.FechaHoraVisita.replace(/\//g,'-'),
      solicitudFechaCitaTermina: datos.FechaHoraFinVisita.replace(/\//g,'-'),
      personaFotografia: '',
      personaNombre: `${datos.Nombres} ${datos.PrimerApellido} ${datos.SegundoApellido}`,
      personaCurp: datos.CURP,
      personaPuesto: "--",
      solicitudUsuario: 0,
      solicitudPlacaVehicular: datos.Placas,
      solicitudVehiculoMarca: datos.MarcaVehicular,
      solicitudVehiculoModelo: datos.ModeloVehicular,
      solicitudVehiculoColor: datos.ColorVehicular,
      solicitudEstacionamiento: datos.Estacionamiento,
      solicitudPlacaCheck: 0,
      //solicitudTramiteNombre:resSolicitud.Tramite,
      dependenciaNombre: datos.Dependencia,
      solicitudHoraCitaInicia: datos.FechaHoraVisita.split(' ')[1],
      solicitudHoraCitaTermina: datos.FechaHoraFinVisita.split(' ')[1],
      acompanantes: datos.NoAcompaniantes,
      actualizarSolicitud: datos.Actualizar,
      cancelarSolicitud: datos.Cancelar,
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

    }else{
      let eventQueryApi = update_ConfirmarCita(datos.OidSolicitud,4);
      let resApi = await psql.oneOrNone(eventQueryApi);
    }
  } catch (error) {
    let eventQueryApi = update_ConfirmarCita(datos.OidSolicitud,4);
    let resApi = await psql.oneOrNone(eventQueryApi);
  } 
}

export default mutationAcceso;
