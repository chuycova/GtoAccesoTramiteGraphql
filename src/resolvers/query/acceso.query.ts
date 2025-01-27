import JWT from "../../lib/jwt";
import {
  get_PermisionPolicyUserXControlAccesos,
  getLoginUsuarioAcceso,
  get_BuscarInvitado,
  get_LoginUsuarioAccesoInactivo,
  get_SolicitudesAcceso,
  get_SolicitudesAccesoPaginado,
  get_SolicitudAccesoOid,
  get_ExisteUsuarioAcceso,
  get_UsuarioAccesoRecuperar,
  get_RolUsuarioLogin,
  get_PermisosRol,
  get_TiempoToken,
  get_Rol,
  get_Procedencias,
  get_SolicitudAccesoOidValidarHoy,
  get_LugarAcceso,
  get_CatalogoPosicion,
  get_CatalogoIdentificaion,
  get_InvitadoTotalVistasFecha,
  get_SolicitudAccesoInvitadoXHoy,
  get_SolicitudesAccesoTotalRegistrosUsuario,
  get_EntradasSalidasOidInvitado,
  get_TodoDirectorioUsuarioLogin,
  get_SolicitudesAccesoGrupo,
  get_SolicitudesAccesoGrupoPaginado,
  get_SolicitudesAccesoGrupoTotalRegistrosUsuario,
  get_BuscarGrupo,
  get_InvitadosXGrupo,
  get_InvitadosXGrupoPaginado,
  get_BuscarGrupoPaginado,
  get_Grupos,
  get_Grupo,
  get_InvitadosXGrupoAll,
  get_SolicitudAccesoGrupoOid,
  get_SolicitudesAccesoInvitadosGrupo,
  get_SolicitudesAccesoInvitadosGrupoPaginado,
  get_VisitasXGrupo,
  get_VisitasXGrupoPaginado,
  get_CatalogoEstacionamiento
} from "../../constants/acceso-db-operations";
import { NoSqlInyection } from "../../lib/RemplazarSQL";
import { Utils } from "../../lib/utils";
import { get_ListaNegra, get_ListaNegraFiltro, get_ListaNegraOid, get_ListaNegraPaginado } from "../../constants/acceso-lista-negra-db-operations";
import { ApiWelcome } from "../../data/envio-cita-app";

var noSqlInyection = new NoSqlInyection();
const _ApiWelcome = new ApiWelcome();

const queryAcceso = {
  Query: {
    
    /* Se obtiene los usuarios XAF que pueden recibir visitas */
    getPermisionPolicyUserXControlAccesos: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery = get_PermisionPolicyUserXControlAccesos(parent.oidUsuarioControlAcceso,parent.grupo);
      let res = await psql.query(eventQuery);
      return res;
    },
    /* LOGIN CONTROL ACCESO */
    getLoginUsuarioAcceso: async (_: any, parent: any, { psql }: any) => {
      let correo = noSqlInyection.remplazar(parent.correo);

      let eventQueryBloqueado = get_LoginUsuarioAccesoInactivo(correo);
      let resBloqueado = await psql.oneOrNone(eventQueryBloqueado);

      //No existe el Usuario
      if (resBloqueado == null) {
        return {
          status: false,
          message: "Usuario Incorrecto",
        };
      }
      //El Usuario no esta Activo
      if (!resBloqueado["Activo"]) {
        return {
          status: true,
          message: "Inactivado",
        };
      }

      //Se validan Credenciales
      let eventQuery = getLoginUsuarioAcceso(correo, parent.pass);
      let res = await psql.oneOrNone(eventQuery);

      //Las Credenciales son incorrectas
      if (res == null) {
        return {
          status: false,
          message: "Usuario Incorrecto",
        };
      }

      //Se obtiene el tiempo de Token
      let eventQueryTiempoToken = get_TiempoToken(res.Oid);
      let resTiempoToken = await psql.oneOrNone(eventQueryTiempoToken);

      //Roles
      let eventQueryRol = get_Rol(res.Oid);
      let resRol = await psql.manyOrNone(eventQueryRol);
      res.RolesArray = resRol.map(({ Oid }:any) => Oid).flat();
      

      //Permisos
      let eventQueryPermisos = get_PermisosRol(res.Roles.toString());
      let resPermisos = await psql.manyOrNone(eventQueryPermisos);
      res.Permisos = resPermisos.map(({ OID }:any) => OID).flat();

      //Credenciales son correctas
      return {
        status: true,
        message: "Usuario Correcto",
        token: new JWT().sign(res,resTiempoToken.TiempoToken==null?3600:resTiempoToken.TiempoToken*3600),
      };
    },
    /* Se descomprime el token que recibe, 
      si el token esta activo regresa la información del Usuario que tiene el token
      si no esta activo no manda la información*/
    miPerfilUsaurioAcceso: async (_: void, __: any, { token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        // No modificar mensaje, debe ser igual en este componente y en el de jwt par que funcione.
        info === "Token es inválida."
      ) {
        return {
          status: false,
          message: info,
          user: null,
        };
      }
      return {
        status: true,
        message: "Token correcto",
        user: info.user,
      };
    },
    /* Validar si existe un usuario con el mismo correo */
    getExisteUsuarioAcceso: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_ExisteUsuarioAcceso(parent.correo);
      let res = await psql.oneOrNone(eventQuery);
      if (res == null) {
        return {
          status: false,
          message: "Correo no registrado",
        };
      }

      let eventQueryBloqueado = get_LoginUsuarioAccesoInactivo(parent.correo);
      let resBloqueado = await psql.oneOrNone(eventQueryBloqueado);
      //El Usuario no esta Activo
      if (!resBloqueado["Activo"]) {
        return {
          status: true,
          message: "Inactivado",
        };
      }

      //El Usuario Ya esta registrado
      return {
        status: true,
        message: "Correo ya registrado",
        user: res,
      };
    },
    /*Se busca el Usuario Acceso para recuperar la contraseña y regresa un token con 5 min de duración */
    getUsuarioAccesoRecuperar: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_UsuarioAccesoRecuperar(parent.oid);
      let res = await psql.oneOrNone(eventQuery);
      if (res != null) {
        return {
          status: true,
          message: "Usuario",
          token: new JWT().sign(res, 300),
        };
      } else {
        return {
          status: false,
          message: "Usuario Inorrecto",
        };
      }
    },
    /*Lista de Negra*/
    getListaNegra: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let filtros = parent.filtro;
      filtros.NombreCompleto = parent.filtro.NombreCompleto.normalize('NFD').replace(/[\u0300-\u0301]/g, '');

      let eventQuery = get_ListaNegraFiltro(filtros);
      let res = await psql.manyOrNone(eventQuery);
      if (res.length == 0) {
        return {
          status: true,
          paginas: 0,
        };
      }

      let eventQueryPaginas = get_ListaNegraPaginado(
        filtros
      );
      let resPaginas = await psql.oneOrNone(eventQueryPaginas);
      return {
        status: true,
        totalExcepciones: resPaginas["TotalRegistros"],
        paginas: resPaginas["Paginas"],
        excepciones: res,
      };
      return res;
    },
    /*Lista de Negra por OID*/
    getListaNegraOid: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery = get_ListaNegraOid(parent.Oid);
      let res = await psql.oneOrNone(eventQuery);
      return res;
    },
    /*Lista de Prcedencias (Institución origen)*/
    getProcedencias: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery = get_Procedencias;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    /*Lista de Entradas*/
    getLugarAcceso: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery = get_LugarAcceso;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    /*Lista de Cargos (Posicion)*/
    getCargo: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery = get_CatalogoPosicion;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    /*Lista de Tipos Identificaciones*/
    getIdentificacion: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery = get_CatalogoIdentificaion;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    /*Lista de Estacionamiento segun el Usuario que Visita*/
    getEstacionamiento: async (_: any, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery = get_CatalogoEstacionamiento(parent.OidVisitaA);
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    /*Lista de Negra con filtros*/
    getBuscarEnListaNegra: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      //Si nombreCompleto como parametro esta vacio
      if(parent.nombreCompleto.trim()=='')
        return [];
 
      let eventQuery = get_ListaNegra;
      let res = await psql.manyOrNone(eventQuery);
      
      //Si no hay registros en lista Negra
      if(parent.nombreCompleto.trim()=='')
        return [];

      let util = new Utils();
      //Se limpia la cadena del nombre que se esta buscando
      let cadaneLimpia = util.removeAccents(
        parent.nombreCompleto.trim().toUpperCase()
      );
      let NombreVisitante = cadaneLimpia.split(" ").filter(x=>x.length>2);

      // Se recorr la lista negra
      let newListaNegra = res.filter((inv:any) => {

        const nombreListaNegra = inv.NombreLimpio.trim().toUpperCase();
        //Obtenemos un arreglo del nombre en lista negra
        let NombreListaNegra = nombreListaNegra.split(" ").filter((x:any)=>x.length>2);
        //Variables para promedio por Comparación general
        let promedioComparacion=0;
        let countComparacion=0;

        //Recorremos nuestro arreglo del nombre en lista negra
        NombreListaNegra.forEach((listanegra:any) => {
          countComparacion++;
          //Variables para promedio por Comparación de palabra
          let porc = 0;
          let count = 0;
          //Recorremos nuestro arreglo del nombre de visitante
          NombreVisitante.forEach(visitante => {
            count++;

            let distance = util.levenshteinDistance(listanegra.trim(), visitante.trim());
            let maxLength = Math.max(listanegra.trim().length,  visitante.trim().length);
            let porcentaje = ((maxLength - distance) / maxLength) * 100;
            //Si el porcentaje es igual 100%
            if(distance<=1 && porc < porcentaje)
              porc = porcentaje;
            // else
            // //Si el porcentaje es menor 100%
            // if(porc<100)
            //   porc += porcentaje;
          });
          //Sumamos nuestro promedio por palabra al promedio general
          //Se valida si es 100%, lo sume pero si es menor lo divida entre la cantidad de palabras que se recorrieron
          promedioComparacion += porc//(porc==100)?100:porc/count;
        });
        
        inv.TotalPorcentaje = Math.round(promedioComparacion/countComparacion);
        return inv.TotalPorcentaje >= 75; // Porcentaje que se necesita ver
      });
      
      // //Se separa por palabra nuestro Nombre a Buscar
      // let NombreVisitante = cadaneLimpia.split(" ");
      // //Cuantas palabras
      // let NSubCadena = NombreVisitante.length;

      // let listaNegra: any[] = [];

      // //Se busca en nuestra lista los nombres que contengan alguna palabra de nuestro Nombre a Buscar
      // let resultadoBusqueda = res.filter((item: any) => {
      //   return NombreVisitante.some((substring) =>
      //     util
      //       .removeAccents(item.NombreInvitado.toUpperCase())
      //       .includes(substring)
      //   );
      // });

      // //Se asigna el resultado de la busqueda anterior
      // listaNegra = resultadoBusqueda;

      // //Recorremos cada palabra del nombre
      // NombreVisitante.forEach((element) => {
      //   let result = res.filter((item: any) =>
      //     util
      //       .removeAccents(item.NombreInvitado.toUpperCase())
      //       .includes(element)
      //   );
      //   result.forEach((element: any) => {
      //     element.TotalPalabrasNombre =
      //       element.NombreInvitado.split(" ").length;
      //     listaNegra.filter((item: any) => {
      //       if (item.Oid == element.Oid)
      //         item.Count = item.Count == null ? 1 : item.Count + 1;
      //     });
      //   });
      // });

      // listaNegra.forEach((item: any) => {
      //   item.CountPorciento = (item.Count * 100) / item.TotalPalabrasNombre;
      //   item.NumLetrasPorciento =
      //     (util.removeEspacios(cadaneLimpia).length * 100) /
      //     util.removeEspacios(
      //       util.removeAccents(item.NombreInvitado.toUpperCase())
      //     ).length;
      //   item.TotalPorcentaje =
      //     ((item.CountPorciento > 100
      //       ? item.CountPorciento > 200
      //         ? 0
      //         : 200 - item.CountPorciento
      //       : item.CountPorciento) +
      //       (item.NumLetrasPorciento > 100
      //         ? item.NumLetrasPorciento > 200
      //           ? 0
      //           : 200 - item.NumLetrasPorciento
      //         : item.NumLetrasPorciento)) /
      //     2;
      // });
      
      return newListaNegra;//.filter(ln=>ln.TotalPorcentaje>50);
    },
    /*Lista de Invitados*/
    getBuscarInvitado: async (_: void, parent: any, { psql,token }: any) => {       
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let buscar = parent.filtro;
      let condicionRol3 = '';

      //Rol 3 PreRegistro
      try {
        let eventQueryUsuario = get_RolUsuarioLogin(buscar.UsuarioLogin);
        let resRol3 = await psql.manyOrNone(eventQueryUsuario);
        if (resRol3.length == 1) {
          condicionRol3 = `AND i."UsuarioRegistra" = '${buscar.UsuarioLogin}' AND i."EsPreregistro" IS TRUE`;
        }
      } catch {}

      let eventQuery = get_BuscarInvitado(buscar.palabraBuscar,buscar.fecha,condicionRol3);
      let res = await psql.manyOrNone(eventQuery);

      //No existe el Usuario
      if (res.length == 0) {
        return {
          status: false,
          message: "No hay Registro de Invitado",
        };
      }
      return {
        status: true,
        message: res.length,
        invitados: res,
      };
    },
    /*Total Visitas por Fecha*/
    getInvitadoTotalVistasFecha: async (_: void, parent: any, { psql,token }: any) => { 
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery =await get_InvitadoTotalVistasFecha(parent.invitado,parent.fecha);
      let res = await psql.oneOrNone(eventQuery);

         
      let eventQueryHS =await get_EntradasSalidasOidInvitado(parent.invitado)
      let resHS = await psql.manyOrNone(eventQueryHS); 
      
      let resultQuerys = {
        ...res, 
        HistorialES: resHS
      } 

      return resultQuerys;
    },
    /*Lista de Solicitudes con filtros*/
    getSolicitudesAcceso: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let filtros = parent.filtro;
      let condicionRol3 = "";
      try {
        let eventQueryUsuario = get_RolUsuarioLogin(filtros.UsuarioLogin);
        let resRol3 = await psql.manyOrNone(eventQueryUsuario);
        if (resRol3.length == 1) {
          condicionRol3 = `AND s."RegistraEnVentanilla" = '${filtros.UsuarioLogin}'`;
        }
      } catch {}
      // //Para lista de Visitas ZZ
      let verTodo = true;
      try {
        let eventQueryUsuarioTodos   = get_TodoDirectorioUsuarioLogin(filtros.UsuarioLogin);
        let resTodos = await psql.manyOrNone(eventQueryUsuarioTodos);
        if (resTodos.length == 0 && condicionRol3=='') {
          verTodo = false;
        }
      } catch {} 

      let eventQuery = get_SolicitudesAcceso(filtros, condicionRol3,verTodo);
      let res = await psql.manyOrNone(eventQuery);
      if (res.length == 0) {
        return {
          status: true,
          paginas: 0,
        };
      }

      let eventQueryPaginas = get_SolicitudesAccesoPaginado(
        filtros,
        condicionRol3,
        verTodo
      );
      let resPaginas = await psql.oneOrNone(eventQueryPaginas);
      
      let eventQueryTotalRegistrosUsuario = get_SolicitudesAccesoTotalRegistrosUsuario(filtros);
      let resTotalRegistrosUsuario = await psql.oneOrNone(eventQueryTotalRegistrosUsuario);
      
      return {
        status: true,
        totalRegistros: resPaginas["TotalRegistros"],
        totalRegistrosPorUsuario: resTotalRegistrosUsuario["TotalRegistros"],
        paginas: resPaginas["Paginas"],
        solicitudes: res,
      };
    },
    /*Detalle de una Solicitud*/
    getSolicitudAccesoOid: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery = get_SolicitudAccesoOid(parent.Oid);
      let res = await psql.oneOrNone(eventQuery);
      return res;
    },
    /*Lista de Solicitudes por Día de un Invitado*/
    getSolicitudAccesoInvitadoXHoy: async (_: void, parent: any, { psql,token }: any) => { 
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery = get_SolicitudAccesoInvitadoXHoy(parent.Invitado);
      let res = await psql.manyOrNone(eventQuery); 
      return res;
    },
    /*Validar si esta Activa para HOY Solicitud de una Solicitud*/
    getSolicitudAccesoOidActivaHoy: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery = get_SolicitudAccesoOidValidarHoy(parent.Oid);
      let res = await psql.oneOrNone(eventQuery);
      return res;
    },
    
    /*-------Query para esperar el tiempo de espuesta de Lista Blanca para imprimir QR (Jesus)----- */
    getSolicitudAccesoImprimirQR: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      // Obtener la fecha de creación de la solicitud
      const eventQuery = get_SolicitudAccesoOid(parent.Oid);
      const solicitudRes = await psql.oneOrNone(eventQuery);

      if (!solicitudRes || !solicitudRes.FechaHoraSolicitud) {
        throw new Error("No se pudo obtener la Visita.");
      }

      const fechaCreacion = new Date(solicitudRes.FechaHoraSolicitud.replace(" ", "T"));

      if (isNaN(fechaCreacion.getTime())) {
        throw new Error("La fecha de creación no es válida.");
      }

      let condicionCumplida = false;
      let tiempoTranscurrido = 0;
      const intervaloEspera = 5000; // 5 segundos
      const tiempoLimite = 60000; // 60 segundos (1 minuto)

      do {
        
        const response = await _ApiWelcome.api_qr_solicitud({Oid:parent.Oid});
        if(response.status == 200){
          condicionCumplida = true;
          break;
        }else{

        }
        
        // Espera antes de la siguiente iteración
        await new Promise((resolve) => setTimeout(resolve, intervaloEspera));
        tiempoTranscurrido += intervaloEspera;

      } while (!condicionCumplida && tiempoTranscurrido < tiempoLimite);

      // Retornar el estado y el tiempo transcurrido
      return {
        status: condicionCumplida,
        tiempo: tiempoTranscurrido / 1000, // Convertir milisegundos a segundos
      };
    },
    /*--------Querys de Solicitudes por Grupo*/
    getGrupos: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let UsuarioLogin =info.user.Oid;
      let condicionRol3 = '';

      //Rol 3 PreRegistro
      try {
        let eventQueryUsuario = get_RolUsuarioLogin(UsuarioLogin);
        let resRol3 = await psql.manyOrNone(eventQueryUsuario);
        if (resRol3.length == 1) {
          condicionRol3 = `AND g."UsuarioRegistra" = '${UsuarioLogin}'`;
        }
      } catch {}

      let eventQuery = get_Grupos(condicionRol3);
      let res = await psql.manyOrNone(eventQuery);

      //No existe el Usuario
      if (res.length == 0) {
        return {
          status: false,
          message: "No hay Registro de Grupo",
        };
      }
      return {
        status: true,
        message: res.length,
        grupos: res,
      };
    },
    getGrupo: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let OidGrupo = parent.Oid;
      let UsuarioLogin =info.user.Oid;
      let condicionRol3 = '';

      //Rol 3 PreRegistro
      try {
        let eventQueryUsuario = get_RolUsuarioLogin(UsuarioLogin);
        let resRol3 = await psql.manyOrNone(eventQueryUsuario);
        if (resRol3.length == 1) {
          condicionRol3 = `AND g."UsuarioRegistra" = '${UsuarioLogin}'`;
        }
      } catch {}

      let eventQuery = get_Grupo(OidGrupo,condicionRol3);
      let res = await psql.oneOrNone(eventQuery);
      return res;
    },
    getVisitasXGrupo: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let filtros = parent.filtro;

      let eventQuery = get_VisitasXGrupo(filtros);
      let res = await psql.manyOrNone(eventQuery);
      if (res.length == 0) {
        return {
          status: true,
          paginas: 0,
        };
      }

      let eventQueryPaginas = get_VisitasXGrupoPaginado(
        filtros
      );
      let resPaginas = await psql.oneOrNone(eventQueryPaginas);
      
      return {
        status: true,
        totalRegistros: resPaginas["TotalRegistros"],
        paginas: resPaginas["Paginas"],
        solicitudes: res,
      };
    },
    getInvitadosXGrupoAll: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let filtros = parent.filtro;
      // let UsuarioLogin =info.user.Oid;
      // let condicionRol3 = '';

      // //Rol 3 PreRegistro
      // try {
      //   let eventQueryUsuario = get_RolUsuarioLogin(UsuarioLogin);
      //   let resRol3 = await psql.manyOrNone(eventQueryUsuario);
      //   if (resRol3.length == 1) {
      //     condicionRol3 = `AND g."UsuarioRegistra" = '${UsuarioLogin}'`;
      //   }
      // } catch {}

      let eventQuery = get_InvitadosXGrupoAll(filtros);
      let res = await psql.manyOrNone(eventQuery);
      return {
        status: true,
        invitados: res,
      };
    },
    getInvitadosXGrupo: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let filtros = parent.filtro;
      // let UsuarioLogin =info.user.Oid;
      // let condicionRol3 = '';

      // //Rol 3 PreRegistro
      // try {
      //   let eventQueryUsuario = get_RolUsuarioLogin(UsuarioLogin);
      //   let resRol3 = await psql.manyOrNone(eventQueryUsuario);
      //   if (resRol3.length == 1) {
      //     condicionRol3 = `AND g."UsuarioRegistra" = '${UsuarioLogin}'`;
      //   }
      // } catch {}

      let eventQuery = get_InvitadosXGrupo(filtros);
      let res = await psql.manyOrNone(eventQuery);
      if (res.length == 0) {
        return {
          status: true,
          paginas: 0,
          totalRegistros: 0,
        };
      }
      let eventQueryPaginas = get_InvitadosXGrupoPaginado(filtros);
      let resPaginas = await psql.oneOrNone(eventQueryPaginas);
      
      return {
        status: true,
        totalRegistros: resPaginas["TotalRegistros"],
        paginas: resPaginas["Paginas"],
        invitados: res,
      };
    },
    getBuscarGrupo: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let filtros = parent.filtro;
      let UsuarioLogin =info.user.Oid;
      let condicionRol3 = '';

      //Rol 3 PreRegistro
      try {
        let eventQueryUsuario = get_RolUsuarioLogin(UsuarioLogin);
        let resRol3 = await psql.manyOrNone(eventQueryUsuario);
        if (resRol3.length == 1) {
          condicionRol3 = `AND g."UsuarioRegistra" = '${UsuarioLogin}'`;
        }
      } catch {}

      let eventQuery = get_BuscarGrupo(filtros,condicionRol3);
      let res = await psql.manyOrNone(eventQuery);
      if (res.length == 0) {
        return {
          status: true,
          paginas: 0,
          totalRegistros: 0,
        };
      }
      let eventQueryPaginas = get_BuscarGrupoPaginado(filtros,condicionRol3);
      let resPaginas = await psql.oneOrNone(eventQueryPaginas);
      
      return {
        status: true,
        totalRegistros: resPaginas["TotalRegistros"],
        paginas: resPaginas["Paginas"],
        grupos: res,
      };
    },
    /*Lista de Solicitudes con filtros*/
    getSolicitudesAccesoGrupo: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let filtros = parent.filtro;
      filtros.UsuarioLogin =info.user.Oid;
      let condicionRol3 = "";
      try {
        let eventQueryUsuario = get_RolUsuarioLogin(filtros.UsuarioLogin);
        let resRol3 = await psql.manyOrNone(eventQueryUsuario);
        if (resRol3.length == 1) {
          condicionRol3 = `AND gv."UsuarioRegistra" = '${filtros.UsuarioLogin}'`;
        }
      } catch {}

      let eventQuery = get_SolicitudesAccesoGrupo(filtros, condicionRol3);
      let res = await psql.manyOrNone(eventQuery);
      if (res.length == 0) {
        return {
          status: true,
          paginas: 0,
        };
      }

      let eventQueryPaginas = get_SolicitudesAccesoGrupoPaginado(
        filtros,
        condicionRol3
      );
      let resPaginas = await psql.oneOrNone(eventQueryPaginas);
      
      let eventQueryTotalRegistrosUsuario = get_SolicitudesAccesoGrupoTotalRegistrosUsuario(filtros);
      let resTotalRegistrosUsuario = await psql.oneOrNone(eventQueryTotalRegistrosUsuario);
      
      return {
        status: true,
        totalRegistros: resPaginas["TotalRegistros"],
        totalRegistrosPorUsuario: resTotalRegistrosUsuario["TotalRegistros"],
        paginas: resPaginas["Paginas"],
        solicitudes: res,
      };
    },
    getSolicitudAccesoGrupoOid: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let eventQuery = get_SolicitudAccesoGrupoOid(parent.Oid);
      let res = await psql.oneOrNone(eventQuery);
      return res;
    },
    getSolicitudesAccesoInvitadosGrupoOid: async (_: void, parent: any, { psql,token }: any) => {
      let info: any = new JWT().verify(token);
      if (
        info === "Token es inválida."
      ) {        
        throw new Error("Error de tiempo de respuesta");
      }
      let filtros = parent.filtro;

      let eventQuery = get_SolicitudesAccesoInvitadosGrupo(filtros);
      let res = await psql.manyOrNone(eventQuery);
      if (res.length == 0) {
        return {
          status: true,
          paginas: 0,
        };
      }

      let eventQueryPaginas = get_SolicitudesAccesoInvitadosGrupoPaginado(filtros);
      let resPaginas = await psql.oneOrNone(eventQueryPaginas);

      return {
        status: true,
        totalRegistros: resPaginas["TotalRegistros"],
        paginas: resPaginas["Paginas"],
        solicitudes: res,
      };
    },
  },
};

export default queryAcceso;
