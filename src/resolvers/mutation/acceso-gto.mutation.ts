import { ApolloError } from "apollo-server-express";
import { get_SolicitudVisitaXOid, set_CambiarNotificado } from "../../constants/acceso-db-operations";
import {get_InvitadoXCURP, add_SolicitudCitaGTO, add_nuevaSolicitud, update_ResponseSolicitudCitaGTO, add_nuevoInvitadoGTO, get_SedeGTO, add_nuevoDependenciaVisitaAGTO, get_estacionamientoSedeGTO, get_SolicitudAccesoGTO, update_SolicitudCitaGTO, get_ObtenerEstacionamientoSedeGTO, update_EstatusSolicitudCitaGTO, update_ModificacionSolicitudCitaGTO } from "../../constants/acceso-gto-db-operations";
import { add_PlacasInvitadoXVisita, get_ConfiguracionCorreo } from "../../constants/tramite-cita-db-operations";
import { ApiWelcome } from "../../data/envio-cita-app";
import JWT from "../../lib/jwt";
import { qrcode } from "../../lib/qrcode";
import { Utils } from "../../lib/utils";
import { NotificionVisita } from "../../utils/notificacion-visita";
const { v4: uuidv4 } = require('uuid');
const { validate: uuidValidate } = require('uuid');
  
  const _ApiWelcome = new ApiWelcome();
  let util = new Utils();
  
  const mutationAccesoGto = {
    Mutation: {
      // Solicitud que manda GTO
      NuevaSolicitudCitaGTO: async (_: any, parent: any, { psql,token }: any) => {
        /**Estatus
          public enum estatusGTO
          {
              Creado,
              ErrorSede,
              EnviadoZZ,
              ErrorApiZZ,
              ExitosoZZ,
              ExitosoSolicitud,
              NotificacionEnviada
          }*/
        const solicitud = (parent.solicitud == null || parent.solicitud == undefined)?{}:parent.solicitud;
        const solicitudTramite = (solicitud.solicitudTramite == null || solicitud.solicitudTramite == undefined)?{}:solicitud.solicitudTramite;
        
        if(solicitud == null || solicitud.solicitud != "6T0"+ util.formatDateToYYYYMMDD(new Date()))
          return {
            estado:0,
            estadoDescripcion:"Error",
            error:1,
            errorDesc:"Tiempo de espera terminado",
            citaId:null,
            qr:null
          };

        let newUuid = solicitud.ouuid; //uuidv4();

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

        //Validaciones para mandar por defal datos        
        let body = {
          solicitudId: (solicitud.solicitudId == null || solicitud.solicitudId == undefined)?0:solicitud.solicitudId,
          uuid: (solicitud.uuid == null || solicitud.uuid == undefined)?"":solicitud.uuid,
          sucursalGuid: (solicitud.sucursalGuid == null || solicitud.sucursalGuid == undefined)?"":solicitud.sucursalGuid,
          personaFotografia: (solicitud.personaFotografia == null || solicitud.personaFotografia == undefined)?"":solicitud.personaFotografia,
          solicitudTramite: {
            tramiteSincronizar: (solicitudTramite.tramiteSincronizar == null || solicitudTramite.tramiteSincronizar == undefined)?false:solicitudTramite.tramiteSincronizar,
            tramiteTipo: (solicitudTramite.tramiteTipo == null || solicitudTramite.tramiteTipo == undefined)?0:solicitudTramite.tramiteTipo,
            tramiteVentanillaNumero: (solicitudTramite.tramiteVentanillaNumero == null || solicitudTramite.tramiteVentanillaNumero == undefined)?"":solicitudTramite.tramiteVentanillaNumero,
            tramiteHorario: (solicitudTramite.tramiteHorario == null || solicitudTramite.tramiteHorario == undefined)?"":solicitudTramite.tramiteHorario,
            tramiteUbicacion: (solicitudTramite.tramiteUbicacion == null || solicitudTramite.tramiteUbicacion == undefined)?"":solicitudTramite.tramiteUbicacion,
          },
          solicitudConCita: (solicitud.solicitudConCita == null || solicitud.solicitudConCita == undefined)?true:solicitud.solicitudConCita,
          actualizarSolicitud: (solicitud.actualizarSolicitud == null || solicitud.actualizarSolicitud == undefined)?false:solicitud.actualizarSolicitud,
          solicitudEsTramite: (solicitud.solicitudEsTramite == null || solicitud.solicitudEsTramite == undefined)?false:solicitud.solicitudEsTramite,
          solicitudTipo: (solicitud.solicitudTipo == null || solicitud.solicitudTipo == undefined)?5:solicitud.solicitudTipo,
          solicitudCancelada: (solicitud.solicitudCancelada == null || solicitud.solicitudCancelada == undefined)?0:solicitud.solicitudCancelada,
          solicitudFecha: (solicitud.solicitudFecha == null || solicitud.solicitudFecha == undefined)?formattedDate:solicitud.solicitudFecha,
          solicitudEmail: (solicitud.solicitudEmail == null || solicitud.solicitudEmail == undefined)?"":solicitud.solicitudEmail,
          solicitudTelefono: (solicitud.solicitudTelefono == null || solicitud.solicitudTelefono == undefined)?"":solicitud.solicitudTelefono,
          solicitudEsDiscapacitado: (solicitud.solicitudEsDiscapacitado == null || solicitud.solicitudEsDiscapacitado == undefined)?0:solicitud.solicitudEsDiscapacitado,
          solicitudFechaCita: (solicitud.solicitudFechaCita == null || solicitud.solicitudFechaCita == undefined)?null:solicitud.solicitudFechaCita,
          solicitudFechaCitaTermina: (solicitud.solicitudFechaCitaTermina == null || solicitud.solicitudFechaCitaTermina == undefined)?solicitud.solicitudFechaCita:solicitud.solicitudFechaCitaTermina,
          personaNombre: (solicitud.personaNombre == null || solicitud.personaNombre == undefined)?"":solicitud.personaNombre,
          personaCurp: (solicitud.personaCurp == null || solicitud.personaCurp == undefined)?"":solicitud.personaCurp,
          personaPuesto: (solicitud.personaPuesto == null || solicitud.personaPuesto == undefined)?"":solicitud.personaPuesto,
          solicitudUsuario: (solicitud.solicitudUsuario == null || solicitud.solicitudUsuario == undefined)?0:solicitud.solicitudUsuario,
          solicitudTramiteNombre: (solicitud.solicitudTramiteNombre == null || solicitud.solicitudTramiteNombre == undefined)?0:solicitud.solicitudTramiteNombre,
          solicitudPlacaVehicular: (solicitud.solicitudPlacaVehicular == null || solicitud.solicitudPlacaVehicular == undefined)?"":solicitud.solicitudPlacaVehicular,
          solicitudVehiculoColor: (solicitud.solicitudVehiculoColor == null || solicitud.solicitudVehiculoColor == undefined)?"":solicitud.solicitudVehiculoColor,
          solicitudVehiculoModelo: (solicitud.solicitudVehiculoModelo == null || solicitud.solicitudVehiculoModelo == undefined)?"":solicitud.solicitudVehiculoModelo,
          solicitudVehiculoMarca: (solicitud.solicitudVehiculoMarca == null || solicitud.solicitudVehiculoMarca == undefined)?"":solicitud.solicitudVehiculoMarca,
          solicitudPlacaCheck: (solicitud.solicitudPlacaCheck == null || solicitud.solicitudPlacaCheck == undefined)?0:solicitud.solicitudPlacaCheck,
          ouuid: newUuid,
          dependenciaNombre: (solicitud.dependenciaNombre == null || solicitud.dependenciaNombre == undefined)?"":solicitud.dependenciaNombre,
          solicitudHoraCitaInicia: (solicitud.solicitudHoraCitaInicia == null || solicitud.solicitudHoraCitaInicia == undefined)?"":solicitud.solicitudHoraCitaInicia,
          solicitudHoraCitaTermina: (solicitud.solicitudHoraCitaTermina == null || solicitud.solicitudHoraCitaTermina == undefined)?"":solicitud.solicitudHoraCitaTermina,
          acompanantes: (solicitud.acompanantes == null || solicitud.acompanantes == undefined)?"":solicitud.acompanantes,
          version: (solicitud.version == null || solicitud.version == undefined)?"":solicitud.version,
        };

        //Se guarda en Posgres la petición
        let eventQuerySolicitudGTO = add_SolicitudCitaGTO(body,JSON.stringify(body));
        let resSolicitudGTO = await psql.oneOrNone(eventQuerySolicitudGTO);

        //Obtengo los datos de la Sede
        let eventQuerySede = get_SedeGTO(body.solicitudTramite.tramiteUbicacion);
        let resSede = await psql.oneOrNone(eventQuerySede);
        
        if(resSede==null){
          let resp  = {
            estado:1,
            estadoDescripcion:"",
            error:0,
            errorDesc:"",
            citaId:""
          };

          //Se guarda la respuesta del servicio de Ommar Estatus = 1 ErrorSede
          let eventQueryResponse = update_ResponseSolicitudCitaGTO(resSolicitudGTO.Oid,"No se envia a servicio por que no se encontro la Sede",1);
          let resResponse = await psql.oneOrNone(eventQueryResponse);
          
          return resp;
        }

        //Validar datos del servicio FECHA y OUUID
        if (!uuidValidate(newUuid)) {
          newUuid = uuidv4();
          body.ouuid = newUuid;
          let eventQueryModificado = update_ModificacionSolicitudCitaGTO(resSolicitudGTO.Oid,`Ouuid: ${solicitud.ouuid} se cambia por ${newUuid}`);
          let resModificado = await psql.oneOrNone(eventQueryModificado);
        }
        // Procesar las fechas de cita y término
        await procesarFecha(body.solicitudFecha, 'solicitudFecha', body, resSolicitudGTO,psql);
        await procesarFecha(body.solicitudFechaCita, 'solicitudFechaCita', body, resSolicitudGTO,psql);
        await procesarFecha(body.solicitudFechaCitaTermina, 'solicitudFechaCitaTermina', body, resSolicitudGTO,psql);

        //Modificamos el body para la Sucrusal
        body.sucursalGuid = resSede.Clave;

        //Se manda al Servicio de Ommar
        let respuestaApi:any=null;
        // try {
          const response = await _ApiWelcome.api_cita_solicitud_GTO(body,token);
          respuestaApi=response;

          //Se guarda la respuesta del servicio de Ommar Estatus 2 EnviadoZZ
          let respuesta = JSON.stringify(response).replace(/'/g, "''");
          let eventQueryResponse = update_ResponseSolicitudCitaGTO(resSolicitudGTO.Oid,respuesta,2);
          let resResponse = await psql.oneOrNone(eventQueryResponse);

          //Error de Registro
          if(response.status != undefined && response.status != null){
            if(response.status >= 400 ){
              let men = `${response.status}: Code:${response.code} - ${response.message}`;
              //  Estatus 3 ErrorZZ
              let eventQueryEstatus = update_EstatusSolicitudCitaGTO(resSolicitudGTO.Oid,3);
              let resEstatus = await psql.oneOrNone(eventQueryEstatus);

              throw new ApolloError(men, response.status);
            }
            let men = (response.message.Message)?response.message.Message:response.message;
            //  Estatus 3 ErrorZZ
            let eventQueryEstatus = update_EstatusSolicitudCitaGTO(resSolicitudGTO.Oid,3);
            let resEstatus = await psql.oneOrNone(eventQueryEstatus);
            throw new ApolloError(men, response.statusText);
          }

          if(response.error > 0 || response.estado == undefined || response.estado == null){
            //  Estatus 3 ErrorZZ
            let eventQueryEstatus = update_EstatusSolicitudCitaGTO(resSolicitudGTO.Oid,3);
            let resEstatus = await psql.oneOrNone(eventQueryEstatus);

            return response;
          }
        // } catch (error:any) {
        //   let resp  = {
        //     estado:0,
        //     estadoDescripcion:"Catch",
        //     error:1,
        //     errorDesc:error,
        //     citaId:""
        //   };
        //   //Se guarda la respuesta del servicio de Ommar
        //   let eventQueryResponse = update_ResponseSolicitudCitaGTO(resSolicitudGTO.Oid,JSON.stringify(error));
        //   let resResponse = await psql.oneOrNone(eventQueryResponse);
          
        //   return resp;
        // }

        //  Estatus 4 ExitosoZZ
        let eventQueryEstatus = update_EstatusSolicitudCitaGTO(resSolicitudGTO.Oid,4);
        let resEstatus = await psql.oneOrNone(eventQueryEstatus);

        //Valido invitado para saber si lo tengo que crear
        let nombrecompleto = body.personaNombre.split(" ");
        let invitado = {
          Nombres: nombrecompleto.length>0?nombrecompleto.slice(0, nombrecompleto.length>3?nombrecompleto.length-2:0).join(' '):"",
          PrimerApellido: nombrecompleto.length>1?nombrecompleto[nombrecompleto.length-2]:"",
          SegundoApellido: nombrecompleto.length>2?nombrecompleto[nombrecompleto.length-1]:"",
          CURP: body.personaCurp,
          Correo: body.solicitudEmail,
          Telefono: body.solicitudTelefono,
          FotografiaB64: body.personaFotografia,
          PreRegistro: true,
          Placa: body.solicitudPlacaVehicular,
        }
        
        let eventQueryInvitado = add_nuevoInvitadoGTO(invitado);
        let resInvitado = await psql.oneOrNone(eventQueryInvitado);

        //Valido Dependencia para saber si la tengo que crear
        const newUuidDependencia = uuidv4();
        let eventQueryDependenciaVisitaA = add_nuevoDependenciaVisitaAGTO(resSede.Oid,body.dependenciaNombre,newUuidDependencia);
        let resDependenciaVisitaA = await psql.oneOrNone(eventQueryDependenciaVisitaA);

        //Obtener el Estacionamiento segun la sede
        let oidEstacionamiento = null;
        if(body.solicitudEsDiscapacitado==1){
          let eventQueryEstacionamiento = get_estacionamientoSedeGTO(resSede.Oid);
          let resEstacionamiento = await psql.oneOrNone(eventQueryEstacionamiento);
          oidEstacionamiento = resEstacionamiento.Oid;
        }

        if(body.solicitudPlacaVehicular!=''){
          let eventQueryPlacas = add_PlacasInvitadoXVisita(
            body.solicitudPlacaVehicular,
            body.solicitudVehiculoMarca,
            body.solicitudVehiculoModelo,
            body.solicitudVehiculoColor,
            resInvitado.Oid);
          let resPlacas = await psql.query(eventQueryPlacas);
        }

        //Guardo la Solicitud
        let solicitudAcceso = {
          Oid: newUuid,
          Invitado: resInvitado.Oid,
          VisitaA: resDependenciaVisitaA.Oid,
          Sede: resDependenciaVisitaA.OidSedeDependencia,
          Dependencia: resDependenciaVisitaA.OidDependencia,
          Placa: body.solicitudPlacaVehicular,
          Marca: body.solicitudVehiculoMarca,
          Modelo: body.solicitudVehiculoModelo,
          Color: body.solicitudVehiculoColor,
          TipoEstacionamiento:oidEstacionamiento,
          FotografiaB64: body.personaFotografia,
          FechaHoraVisita: body.solicitudFechaCita,
          FechaHoraFinVisita: body.solicitudFechaCitaTermina==""?body.solicitudFechaCita:body.solicitudFechaCitaTermina,
          PreRegistro: true,
          Acompanantes: body.acompanantes
        }
        let eventQuerySolicitud = add_nuevaSolicitud(solicitudAcceso);
        let resSolicitud = await psql.oneOrNone(eventQuerySolicitud);
      
        //  Estatus 5 ExitosoSolicitud
        eventQueryEstatus = update_EstatusSolicitudCitaGTO(resSolicitudGTO.Oid,5);
        resEstatus = await psql.oneOrNone(eventQueryEstatus);

        try {
          let eventQuery = get_SolicitudAccesoGTO(resSolicitud.Oid);
          let res = await psql.oneOrNone(eventQuery);

          //Se pone la Direccion de la Sede
          res.SedeDireccion = resSede.Direccion;

          const notificionVisita = new NotificionVisita();

          // if(process.env.CORREO_COMPLETAR_INFORMACION_GTO == 'true'){


            //Información de la plantilla de correo (11)
            let eventQueryCorreo = get_ConfiguracionCorreo('11');
            let resCorreo = await psql.oneOrNone(eventQueryCorreo);
            /*Envio de Notificaciones*/
            const qrCode = new qrcode();
            //Crear QR
            let qr = await qrCode.generarQR(res.Oid);

            //Envio de Correos
            let enviarCorreo = await notificionVisita.notificacionCorreoGTO(resCorreo,res,qr);

            if(enviarCorreo){
              
              //  Estatus 6 ExitosoSolicitud
              eventQueryEstatus = update_EstatusSolicitudCitaGTO(resSolicitudGTO.Oid,6);
              resEstatus = await psql.oneOrNone(eventQueryEstatus);

              let eventQueryNotificacion = set_CambiarNotificado(res.Oid);
              let resNotificacion = await psql.oneOrNone(eventQueryNotificacion);
            }


          // }else{
          //   /*Envio de Notificaciones*/
          //   const qrCode = new qrcode();

          //   //Información de la plantilla de correo (4)
          //   let eventQueryCorreo = get_ConfiguracionCorreo('4');
          //   let resCorreo = await psql.oneOrNone(eventQueryCorreo);

          //   //Información de la plantilla de WhatsApp 
          //   let eventQueryWhatsApp = get_ConfiguracionCorreo('5');
          //   let resWhatsApp = await psql.oneOrNone(eventQueryWhatsApp);

          //   //Crear QR
          //   let qr = await qrCode.generarQR(res.Oid);
          //   //Envio de Correos
          //   let enviarCorreo = await notificionVisita.notificacionCorreo(resCorreo,'',res,qr);
          //   //Envio de WhatsApp
          //   let enviarWhatsApp = await notificionVisita.notificacionWhatsApp(resWhatsApp,res,qr);
            
          //   if(enviarCorreo || enviarWhatsApp.status){
          //     let eventQueryNotificacion = set_CambiarNotificado(res.Oid);
          //     let resNotificacion = await psql.oneOrNone(eventQueryNotificacion);
          //   }
          // }
        } catch (error) {
          // console.log(error)
        }
        return respuestaApi;
      },
      // Actualizar Solicitud que manda GTO
      ActualizarSolicitudCitaGTO: async (_: any, parent: any, { psql,token }: any) => { 
        let info: any = new JWT().verify(token);
        if (
          info === "Token es inválida."
        ) {        
          throw new Error("Error de tiempo de respuesta");
        }
        const solicitud = parent.solicitud;
        let eventQuerySol = get_SolicitudAccesoGTO(solicitud.Oid);
        let resSol = await psql.oneOrNone(eventQuerySol);

        solicitud.Invitado =  resSol.OidInvitado;
  

        let OidEstacionamiento = null;
        if(solicitud.Placa != ''){

          //Obtener estacionamiento
          let eventQuery = get_ObtenerEstacionamientoSedeGTO(solicitud.Oid,solicitud.ConDiscapacidad);
          let res = await psql.oneOrNone(eventQuery);
          OidEstacionamiento = res.Oid;

          //Actualizar Arreglo de Placas
          let eventQueryPlacas = add_PlacasInvitadoXVisita(
            solicitud.Placa,
            solicitud.Marca,
            solicitud.Modelo,
            solicitud.Color,
            solicitud.Invitado);
          let resPlacas = await psql.query(eventQueryPlacas);
        }
        //Se actualiza Solicitud de GTO
        let eventQuery = update_SolicitudCitaGTO(solicitud,OidEstacionamiento);
        let res = await psql.oneOrNone(eventQuery);

        let eventQuerySolicitud = get_SolicitudAccesoGTO(solicitud.Oid);
        let resSolicitud = await psql.oneOrNone(eventQuerySolicitud);

        //NOTIFICO AL INVITADO LA VISITA
        try {
          /*Envio de Notificaciones*/
          const notificionVisita = new NotificionVisita();
          const qrCode = new qrcode();

          //Información de la plantilla de correo (4)
          let eventQueryCorreo = get_ConfiguracionCorreo('12');
          let resCorreo = await psql.oneOrNone(eventQueryCorreo);

          // //Información de la plantilla de WhatsApp 
          // let eventQueryWhatsApp = get_ConfiguracionCorreo('5');
          // let resWhatsApp = await psql.oneOrNone(eventQueryWhatsApp);

          //Crear QR
          let qr = await qrCode.generarQR(resSolicitud.Oid);
          //Envio de Correos
          let enviarCorreo = await notificionVisita.notificacionCorreo(resCorreo,info.user.CopiaCita,info.user.Correo,resSolicitud,qr);
          //Envio de WhatsApp
          // let enviarWhatsApp = await notificionVisita.notificacionWhatsApp(resWhatsApp,resSolicitud,qr);
          
          if(enviarCorreo){// || enviarWhatsApp.status){
            let eventQueryNotificacion = set_CambiarNotificado(resSolicitud.Oid);
            let resNotificacion = await psql.oneOrNone(eventQueryNotificacion);
          }
          
        } catch (error) {
          // console.log(error)
        }

        //Mandamos los datos a O.O.
        try {
          let body = {
            ouuid: res.Oid,
            solicitudFecha: resSolicitud.FechaHoraSolicitud.replace(/\//g,'-'),
            solicitudFechaCita: resSolicitud.FechaHoraVisita.replace(/\//g,'-'),
            solicitudFechaCitaTermina: resSolicitud.FechaHoraFinVisita.replace(/\//g,'-'),
            personaNombre: `${resSolicitud.Nombres} ${resSolicitud.PrimerApellido} ${resSolicitud.SegundoApellido}`,
            personaCurp: resSolicitud.CURP,
            solicitudPlacaVehicular: resSolicitud.Placas,
            solicitudEstacionamiento: resSolicitud.OidTipoEstacionamiento,
            solicitudVehiculoMarca: resSolicitud.MarcaVehicular,
            solicitudVehiculoModelo: resSolicitud.ModeloVehicular,
            solicitudVehiculoColor: resSolicitud.ColorVehicular,
            solicitudEsDiscapacitado:solicitud.ConDiscapacidad?1:0,
            actualizarSolicitud:true
          };
          const response = await _ApiWelcome.api_cita_solicitud(body);
          if(response.error == 0){
            ///Rgistrar en tabla teporal
            ///Rgistrar en tabla teporal

          }else{
            // let eventQueryApi = update_ConfirmarCita(res.Oid,4);
            // let resApi = await psql.oneOrNone(eventQueryApi);
          }
        } catch (error) {
          
        } 
       


      return {
        status: true,
        modificado: true,
        vencido: false,
        mensaje: "Actualizado",
      };
        
      },
    },
  };
  export default mutationAccesoGto;
  
  async function procesarFecha(fecha:string, campo:string, body:any, resSolicitudGTO:any,psql:any) {
    // Expresión regular para el formato yyyy-MM-dd o yyyy/MM/dd
    const regexFormato1 = /^\d{4}[-\/](0[1-9]|1[0-2])[-\/](0[1-9]|[12][0-9]|3[01])$/;
    // Expresión regular para el formato dd-MM-yyyy o dd/MM/yyyy
    const regexFormato2 = /^(0[1-9]|[12][0-9]|3[01])[-\/](0[1-9]|1[0-2])[-\/]\d{4}$/;
    // Expresión regular para el formato HH:mm:ss
    const regexHora = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

    // Verificar si la fecha cumple con cualquiera de los formatos válidos
    if (regexFormato1.test(fecha) || regexFormato2.test(fecha)) {
        // Reemplazar "/" por "-" si es necesario
        fecha = fecha.replace(/\//g, "-");

        // Convertir de yyyy-MM-dd a dd-MM-yyyy si es necesario
        if (regexFormato1.test(fecha)) {
            const [anio, mes, dia] = fecha.split("-");
            fecha = `${dia}-${mes}-${anio}`;
        }

        // Verificar y corregir el formato de la hora
        let hora = body.solicitudTramite.tramiteHorario;
        if (!regexHora.test(hora)) {
            hora += ":00";  // Agregar los segundos si no están presentes
        }

        // Formatear la fecha como dd-MM-yyyy HH:mm:ss
        const formatFecha = `${fecha} ${hora}`;

        // Asignar el valor formateado al campo correspondiente
        body[campo] = formatFecha;

        // Registrar el cambio en la base de datos
        const eventQueryModificado = update_ModificacionSolicitudCitaGTO(resSolicitudGTO.Oid, `${campo}: ${fecha} se cambia por ${formatFecha}`);
        const resModificado = await psql.oneOrNone(eventQueryModificado);

        return resModificado;
    }else if(fecha.includes('/')){
      let formatFecha = fecha.replace(/\//g, "-");
      // Asignar el valor formateado al campo correspondiente
      body[campo] = formatFecha;
      // Registrar el cambio en la base de datos
      const eventQueryModificado = update_ModificacionSolicitudCitaGTO(resSolicitudGTO.Oid, `${campo}: ${fecha} se cambia por ${formatFecha}`);
      const resModificado = await psql.oneOrNone(eventQueryModificado);

    }
    return null;
}