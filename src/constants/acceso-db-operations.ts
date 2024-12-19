import { NoSqlInyection } from "../lib/RemplazarSQL";
import { Utils } from "../lib/utils";

export const get_PermisionPolicyUserXControlAccesos = (
  OidUsuarioControlAcceso: String,
  grupo: String
) => {
  const query = `SELECT 
    DISTINCT u."Oid",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "NombreCompleto",
    u."Titulo",
    u."NombreCompleto" AS "Nombre",
    u."NombreCompletoNombreApellidos" AS "NombreCompletoPorNombre",
    u."Correo" ,
    cd."Nombre" AS "Departamento",
    cp."Nombre" AS "Posicion",
    co."Nombre" AS "Oficina",
    ce."Nombre" AS "Edificio",
    s."Nombre" AS "Sede",
    d."Titulo" AS "Dependencia",
    u."EdificioUbicacion",
    u."ExtensionTelefonica",
    (SELECT COUNT(*) FROM "Solicitud" s 
    where s."RegistraEnVentanilla" = u."Oid"
    and to_char(s."FechaHoraVisita",'dd-MM-yyyy') = to_char((select now()),'dd-MM-yyyy')) AS "VisitasHoy"
  FROM "Usuario" u
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  LEFT JOIN "UsuarioUsuariosXAF_UsuarioAccesoUsuariosAcceso" xaf_ua ON xaf_ua."UsuariosXAF" = u."Oid"
  LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  LEFT JOIN "CatalogoOficina" co ON co."Oid" = u."Oficina" AND co."Activo" is true AND co."GCRecord" IS NULL
  LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
  LEFT JOIN "Dependencia" d ON d."Oid" = u."Dependencia" AND d."GCRecord" IS NULL
  LEFT JOIN "SedeDependencia" sd ON sd."Oid" = u."Sede" AND sd."Visible" is true AND sd."GCRecord" IS NULL
  LEFT JOIN "Sede" s ON s."Oid" = sd."Sede" AND s."Visible" is true AND s."GCRecord" IS NULL
  WHERE ppu."GCRecord" IS null
  AND (xaf_ua."UsuariosAcceso" = '${OidUsuarioControlAcceso}' OR u."Correo"  = (SELECT ua."Correo" FROM "UsuarioAcceso" ua WHERE ua."Oid" = '${OidUsuarioControlAcceso}'))
  AND u."Grupos" ILIKE '%${grupo}%'
  AND u."Visible" IS TRUE;`;
  return query;
};

export const getLoginUsuarioAcceso = (correo: String, pass: String) => {
  const query = ` SELECT 
      ua."Oid", 
      CONCAT( ua."Nombres",' ', ua."PrimerApellido",' ', ua."SegundoApellido") AS "NombreUsuarioAcceso", 
      ua."Nombres", 
      ua."PrimerApellido", 
      ua."SegundoApellido", 
      ua."VerTodosUsuariosXAF",
      ua."Correo",
      ua."CambiarContrasenia",
      (SELECT STRING_AGG(ur."Rol"::varchar(100), ',') As "Roles" 
       FROM "RolUsuarioAcceso" ur
       INNER JOIN "RolControlAcceso" rca ON rca."OID" = ur."Rol"
       WHERE ur."UsuarioAcceso" = ua."Oid"
       AND rca."Activo" IS TRUE
       AND ur."Activo" IS TRUE),
      cli."OID" AS "OidLugarIngreso",
      cli."Nombre" AS "LugarIngreso",
      ua."RecibirCopiaCita" AS "CopiaCita"
    FROM "UsuarioAcceso" ua
    LEFT JOIN "CatalogoLugarIngreso" cli ON cli."OID" = ua."LugarIngreso"
    WHERE ua."GCRecord" IS NULL
    AND ua."Correo" = '${correo}' AND ua."Contrasenia" = '${pass}'
    AND ua."Activo" = true;`;
  return query;
};

export const get_Rol = (oid: String) => {
  const query = `SELECT 
    ur."Rol" AS "Oid"
  FROM "RolUsuarioAcceso" ur
  INNER JOIN "RolControlAcceso" rca ON rca."OID" = ur."Rol"
  WHERE ur."UsuarioAcceso" = '${oid}'
  AND rca."Activo" IS TRUE
  AND ur."Activo" IS true
  ORDER BY ur."Rol";`;
  return query;
};

export const get_PermisosRol = (roles: String) => {
  const query = ` SELECT 
      DISTINCT(pua."OID") AS "OID"
      --,pua."Nombre"
    FROM "PermisoUsuarioAcceso" pua
    INNER JOIN "RolControlAccesoRoles_PermisoUsuarioAccesoPermisos" d ON d."Permisos" = pua."OID"
    WHERE pua."GCRecord" IS NULL
    AND d."Roles" IN (${roles})
    AND pua."Activo" IS TRUE
    ORDER BY pua."OID";`;
  return query;
};

export const get_TiempoToken = (oid: String) => {
  const query = ` SELECT 
      ua."TiempoToken"
    FROM "UsuarioAcceso" ua
    WHERE ua."GCRecord" IS NULL
    AND ua."Oid" = '${oid}';`;
  return query;
};

export const get_ExisteUsuarioAcceso = (correo: String) => {
  const query = `SELECT 
    ua."Oid", 
    CONCAT( ua."Nombres",' ', ua."PrimerApellido",' ', ua."SegundoApellido") AS "NombreUsuarioAcceso", 
    ua."Correo" 
  FROM "UsuarioAcceso" ua
  WHERE ua."GCRecord" IS NULL
  AND ua."Correo" = '${correo}';`;
  return query;
};

export const get_UsuarioAccesoRecuperar = (Oid: String) => {
  const query = `SELECT 
        ua."Oid", 
        CONCAT( ua."Nombres",' ', ua."PrimerApellido",' ', ua."SegundoApellido") AS "NombreUsuarioAcceso", 
        ua."Correo" 
      FROM "UsuarioAcceso" ua
      WHERE ua."GCRecord" IS NULL
      AND ua."Oid" = '${Oid}'
      AND ua."Activo" = true;`;
  return query;
};

export const get_LoginUsuarioAccesoInactivo = (correo: String) => {
  const query = ` SELECT 
      ua."Activo"
    FROM "UsuarioAcceso" ua
    WHERE ua."GCRecord" IS NULL
    AND ua."Correo" = '${correo}';`;
  return query;
};

export const get_RolUsuarioLogin = (OidUsuarioLogin: string) => {
  let param ='';
  
  if(OidUsuarioLogin != undefined && OidUsuarioLogin != null && OidUsuarioLogin != ''){
    param = ` AND ua."Oid" = '${OidUsuarioLogin}' `
  }

  const query = ` SELECT 
    ua."Oid", 
    CONCAT( ua."Nombres",' ', ua."PrimerApellido",' ', ua."SegundoApellido") AS "NombreUsuarioAcceso"
  FROM "UsuarioAcceso" ua
  INNER JOIN "RolUsuarioAcceso" ur ON ur."UsuarioAcceso" = ua."Oid" AND ur."Rol" = 3
  WHERE ua."GCRecord" IS NULL
  ${param}
  AND ur."Activo" = true
  AND ua."Activo" = true;`;
  return query;
};
//Para lista de Visitas ZZ
export const get_TodoDirectorioUsuarioLogin = (OidUsuarioLogin: string) => {
  let param ='';
  
  if(OidUsuarioLogin != undefined && OidUsuarioLogin != null && OidUsuarioLogin != ''){
    param = ` AND ua."Oid" = '${OidUsuarioLogin}' `
  }

  const query = ` SELECT 
    ua."Oid", 
    CONCAT( ua."Nombres",' ', ua."PrimerApellido",' ', ua."SegundoApellido") AS "NombreUsuarioAcceso",
    ua."VerTodosUsuariosXAF" AS "VerTodo"
  FROM "UsuarioAcceso" ua
  WHERE ua."GCRecord" IS NULL
  ${param}
  AND ua."VerTodosUsuariosXAF" IS TRUE
  AND ua."Activo" = true;`;
  return query;
};

export const get_Procedencias = ` SELECT 
    DISTINCT s."InstitucionOrigen" AS "Nombre"
  FROM "Solicitud" s
  WHERE s."GCRecord" IS NULL
  AND s."InstitucionOrigen" IS NOT NULL 
  ORDER BY s."InstitucionOrigen";`;

export const get_LugarAcceso = ` SELECT 
    cli."OID", cli."Nombre" 
  FROM "CatalogoLugarIngreso" cli
  WHERE cli."GCRecord" IS NULL
  AND cli."Activo"  IS TRUE
  ORDER BY cli."Nombre" ;`;

export const get_CatalogoPosicion = ` SELECT 
    cp."Oid",cp."Nombre"
  FROM "CatalogoPosicion" cp 
  WHERE cp."GCRecord" IS NULL
  AND cp."Activo"  IS TRUE
  ORDER BY cp."Nombre" ;`;

  export const get_CatalogoIdentificaion = ` SELECT 
  ci."Oid",ci."Nombre"
FROM "CatalogoIdentificacion" ci 
WHERE ci."GCRecord" IS NULL
AND ci."Activo"  IS TRUE
ORDER BY ci."Nombre" ;`;

export const get_CatalogoEstacionamiento = (oidVisitaA: string) => {
  const query = `SELECT 
      ce."Oid",
      ce."Nombre"
    FROM "CatalogoEstacionamiento" ce
    INNER JOIN "Sede" s ON s."Oid" = ce."Sede" AND s."GCRecord" IS NULL
    INNER JOIN "SedeDependencia" sd ON s."Oid" = sd."Sede"  AND sd."GCRecord" IS NULL
    INNER JOIN "Usuario" u ON u."Sede" = sd."Oid"
    WHERE u."Oid" = '${oidVisitaA}'
    AND ce."Activo" IS TRUE
    AND ce."GCRecord" IS NULL
    ORDER BY ce."Orden", ce."Nombre"`;
  return query;
};
  
export const get_BuscarInvitado = (palabraBusqueda: string, fecha: string,condicionRol3:string) => {
  let util = new Utils();
  const query = `SELECT 
        distinct(i."Oid"),
        CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
        i."Nombres",
        i."PrimerApellido",
        i."SegundoApellido",
        COALESCE(i."CURP", '') AS "CURP",
        cs."Oid" AS "OidSexo",
        cs."Nombre" AS "Sexo",
        s."InstitucionOrigen" AS "Procedencia",
        i."Correo",
        i."Telefono",
        i."FotografiaB64",
        ultimo_s."TotalVisitas",
        (SELECT COUNT(*) 
          FROM "Solicitud" sv 
          WHERE sv."Invitado" = i."Oid" 
          AND sv."FechaHoraVisita"::date = '${fecha}') AS "TotalVisitasHoy",
        u."Oid" AS "OidVisitaA",
        COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
        s."PersonaVisitada",
        s."TipoVisita" AS "OidTipoVisita",
        ctv."Nombre" AS "TipoVisita",
        s."Estacionamiento" AS "OidTipoEstacionamiento",
        e."Nombre" AS "TipoEstacionamiento",
        i."Placa" AS "PlacaInvitado",
        COALESCE(s."Placas", '') AS "Placa",
        COALESCE(s."Marca", '') AS "MarcaVehicular",
        COALESCE(s."Modelo", '') AS "ModeloVehicular",
        COALESCE(s."Color", '') AS "ColorVehicular",
        cps."Oid" AS "OidCargoPersonaVisitada",
        cps."Nombre" AS "CargoPersonaVisitada",
        cis."Oid" AS "OidMedioIdentificacion",
        cis."Nombre" AS "MedioIdentificacion"
      FROM "Invitado" i
      LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS NULL
      LEFT JOIN "Solicitud" s ON s."Invitado" = i."Oid"
      LEFT JOIN (SELECT s1."Invitado",count(s1."Oid") AS "TotalVisitas" ,max(s1."FechaHoraSolicitud") AS "FechaHoraSolicitud" FROM "Solicitud" s1 WHERE s1."GCRecord" IS NULL GROUP BY s1."Invitado") ultimo_s ON s."Invitado" = ultimo_s."Invitado" 
      LEFT JOIN "CatalogoEstacionamiento" e ON e."Oid" = s."Estacionamiento"
      LEFT JOIN "Catalogo_TipoVisita" ctv ON ctv."OID" = s."TipoVisita"
      LEFT JOIN "CatalogoPosicion" cps ON cps."Oid" = s."CargoPersonaVisitada" AND cps."Activo" is true AND cps."GCRecord" IS NULL
      LEFT JOIN "CatalogoIdentificacion" cis ON cis."Oid" = s."MedioIdentificacion" AND cis."Activo" is true AND cis."GCRecord" IS NULL
      LEFT JOIN "Usuario" u ON u."Oid" = s."VisitaA"
      WHERE (
        --i."CURP" ILIKE '%${palabraBusqueda}%' OR 
        i."Correo" ILIKE '%${palabraBusqueda}%' OR i."Telefono" ILIKE '%${palabraBusqueda}%' OR 
      TRANSLATE(CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido"),'ÁÉÍÓÚáéíóú','AEIOUaeiou') ILIKE '%${util.removeAccents(palabraBusqueda)}%')
      ${condicionRol3}
      AND s."FechaHoraSolicitud"=ultimo_s."FechaHoraSolicitud"
      AND i."GCRecord" IS NULL;`;
  return query;
};

export const get_InvitadoTotalVistasFecha = (oid: string, fecha: string) => {
  let util = new Utils();
  const query = `SELECT 
      sv."Invitado" AS "Oid",
      '${fecha}' AS "FechaVisita",
      COUNT(*) AS "TotalVisitasHoy"
    FROM "Solicitud" sv 
    WHERE sv."Invitado" = '${oid}'
    AND sv."FechaHoraVisita"::date = '${fecha}'
    AND sv."GCRecord" IS null
    AND sv."EsPrincipal" IS NOT TRUE
    AND sv."Cancelado" IS NOT TRUE 
    GROUP BY  sv."Invitado";`;
  return query;
};

export const get_SolicitudesAcceso = (filtro: any, condicionRol3: string, verTodo:boolean) => {
  let buscar =
    filtro.Nombre != "" && filtro.Nombre != null ? filtro.Nombre : null;
  let visitaA =
    filtro.VisitaA != "" && filtro.VisitaA != null ? filtro.VisitaA.normalize('NFD').replace(/[\u0300-\u0301]/g, '') : null;
  let fechaInicio =
    filtro.FechaInicio != "" && filtro.FechaInicio != null
      ? filtro.FechaInicio
      : null;
  let fechaFin =
    filtro.FechaFin != "" && filtro.FechaFin != null ? filtro.FechaFin : null;
  let orden =
    filtro.Ordenar == 0
      ? `5`
      : filtro.Ordenar == 1
      ? 's."FechaHoraVisita"'
      : filtro.Ordenar == 3
      ? 's."FechaHoraSolicitud"'
      : 's."FechaHoraVisita"';
  let tipoorden =
    filtro.TipoOrden != "" && filtro.TipoOrden != null
      ? " " + filtro.TipoOrden
      : " DESC";

  let estatus =
   filtro.Estatus == 1 // Agendada
      ? ` AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) IS NULL AND s."EsPreregistro" IS TRUE`
      : filtro.Estatus == 2 // Ingreso
      ? ' AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) = 1'
      : filtro.Estatus == 3 // Salida
      ? ' AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) = 2'
      : null;
  let inicio = filtro.Offset;
  let limit = filtro.Limit;

  let filter = ``;
  let filterOrden = ``;

  if (buscar != null) {
    filter += ` AND CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") ILIKE '%${buscar}%'`;
  }
  if (visitaA != null) {
    filter += ` AND (COALESCE(u."Titulo"||' ', '')||u."NombreCompletoLimpio") ILIKE '%${visitaA}%'`;
  }
  if (fechaInicio != null) {
    filter += ` AND s."FechaHoraVisita"::date <= '${fechaFin}'`;
  }
  if (fechaFin != null) {
    filter += ` AND s."FechaHoraFinVisita"::date >= '${fechaInicio}'`;
  }
  if (estatus != null) {
    filter += estatus;
  }

  if (orden != null) {
    filterOrden = orden;
  }

  if (fechaInicio == null && fechaFin == null) {
    filter += ` AND s."FechaHoraVisita"::date <= (SELECT NOW()::date) AND s."FechaHoraFinVisita"::date >= (SELECT NOW()::date)`;
  }

  if (filtro.MisRegistros && condicionRol3=='') {
    filter += ` AND (s."RegistraEnVentanilla" = '${filtro.UsuarioLogin}' OR s."PersonaModifica" = '${filtro.UsuarioLogin}')`;
  }
  let INNER_NoVerTodo = '';
  if (!verTodo) {
    INNER_NoVerTodo += `INNER JOIN "UsuarioUsuariosXAF_UsuarioAccesoUsuariosAcceso" uuxuaua on u."Oid" = uuxuaua."UsuariosXAF" and uuxuaua."UsuariosAcceso" = '${filtro.UsuarioLogin}'`;
  }

  const query = `SELECT 
    s."Oid",
    to_char(s."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
    to_char(s."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
    s."PersonaVisitada",
    i."Oid" AS "OidInvitado",
    CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado",
    s."InstitucionOrigen" AS "Procedencia",
    s."FotografiaB64",
    s."NumeroTarjeta",
    s."RegistraEnVentanilla",
    s."EsPreregistro",
    s."PorcentajeListaNegra",
    cps."Nombre" AS "CargoPersonaVisitada",
    cd."Nombre" AS "Departamento",
    cp."Nombre" AS "Posicion",
    (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) AS "EntradaSalida",
    (SELECT to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" AND hes."Tipo" = 1 ORDER BY hes."FechaHora" DESC LIMIT 1) as "FechaUltimaHoraEntrada",
    (SELECT to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" AND hes."Tipo" = 2 ORDER BY hes."FechaHora" DESC LIMIT 1) as "FechaUltimaHoraSalida"
  FROM "Solicitud" s
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid" 
  ${INNER_NoVerTodo}
  INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cps ON cps."Oid" = s."CargoPersonaVisitada" AND cps."Activo" is true AND cps."GCRecord" IS NULL
  LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  WHERE s."GCRecord" IS NULL 
  AND s."EsPrincipal" IS FALSE 
  AND s."Cancelado" IS NOT TRUE ${condicionRol3} 
  ${filter}
  ORDER BY ${filterOrden} ${tipoorden}
  OFFSET ${inicio} LIMIT ${limit}`;
  
  return query;
};

export const get_SolicitudesAccesoPaginado = (
  filtro: any,
  condicionRol3: string,
  verTodo: boolean
) => {
  let buscar =
    filtro.Nombre != "" && filtro.Nombre != null ? filtro.Nombre : null;
  let visitaA =
    filtro.VisitaA != "" && filtro.VisitaA != null ? filtro.VisitaA : null;
  let fechaInicio =
    filtro.FechaInicio != "" && filtro.FechaInicio != null
      ? filtro.FechaInicio
      : null;
  let fechaFin =
    filtro.FechaFin != "" && filtro.FechaFin != null ? filtro.FechaFin : null;
  let estatus =
    filtro.Estatus == 1 // Agendada
       ? ` AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) IS NULL AND s."EsPreregistro" IS TRUE`
       : filtro.Estatus == 2 // Ingreso
       ? ' AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) = 1'
       : filtro.Estatus == 3 // Salida
       ? ' AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) = 2'
       : null;

  let limit = filtro.Limit;

  let filter = ``;

  if (buscar != null) {
    filter += ` AND CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") ILIKE '%${buscar}%'`;
  }
  if (visitaA != null) {
    filter += ` AND (COALESCE(u."Titulo"||' ', '')||u."NombreCompletoLimpio") ILIKE '%${visitaA}%'`;
  }
  if (fechaInicio != null) {
    filter += ` AND s."FechaHoraVisita"::date <= '${fechaFin}'`;
  }
  if (fechaFin != null) {
    filter += ` AND s."FechaHoraFinVisita"::date >= '${fechaInicio}'`;
  }
  if (estatus != null) {
    filter += estatus;
  }


  if (fechaInicio == null && fechaFin == null) {
    filter += ` AND s."FechaHoraVisita"::date <= (SELECT NOW()::date) AND s."FechaHoraFinVisita"::date >= (SELECT NOW()::date)`;
  }
  
  if (filtro.MisRegistros && condicionRol3=='') {
    filter += ` AND (s."RegistraEnVentanilla" = '${filtro.UsuarioLogin}' OR s."PersonaModifica" = '${filtro.UsuarioLogin}')`;
  }
  let INNER_NoVerTodo = '';
  if (!verTodo) {
    INNER_NoVerTodo += `INNER JOIN "UsuarioUsuariosXAF_UsuarioAccesoUsuariosAcceso" uuxuaua on u."Oid" = uuxuaua."UsuariosXAF" and uuxuaua."UsuariosAcceso" = '${filtro.UsuarioLogin}'`;
  }


  const query = `SELECT 
    count(*) AS "TotalRegistros",
    ceiling(count(*)/${limit}.00) AS "Paginas"
  FROM "Solicitud" s
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"  
  ${INNER_NoVerTodo}
  INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  WHERE s."GCRecord" IS NULL 
  AND s."EsPrincipal" IS FALSE 
  AND s."Cancelado" IS NOT TRUE ${condicionRol3} 
  ${filter}`;
  return query;
};
export const get_SolicitudesAccesoTotalRegistrosUsuario = (
  filtro: any
) => {
  let buscar =
    filtro.Nombre != "" && filtro.Nombre != null ? filtro.Nombre : null;
  let visitaA =
    filtro.VisitaA != "" && filtro.VisitaA != null ? filtro.VisitaA : null;
  let fechaInicio =
    filtro.FechaInicio != "" && filtro.FechaInicio != null
      ? filtro.FechaInicio
      : null;
  let fechaFin =
    filtro.FechaFin != "" && filtro.FechaFin != null ? filtro.FechaFin : null;
  let estatus =
    filtro.Estatus == 1 // Agendada
       ? ` AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) IS NULL AND s."EsPreregistro" IS TRUE`
       : filtro.Estatus == 2 // Ingreso
       ? ' AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) = 1'
       : filtro.Estatus == 3 // Salida
       ? ' AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) = 2'
       : null;
  let filter = ``;

  if (buscar != null) {
    filter += ` AND CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") ILIKE '%${buscar}%'`;
  }
  if (visitaA != null) {
    filter += ` AND (COALESCE(u."Titulo"||' ', '')||u."NombreCompletoLimpio") ILIKE '%${visitaA}%'`;
  }
  if (fechaInicio != null) {
    filter += ` AND s."FechaHoraVisita"::date <= '${fechaFin}'`;
  }
  if (fechaFin != null) {
    filter += ` AND s."FechaHoraFinVisita"::date >= '${fechaInicio}'`;
  }

  if (fechaInicio == null && fechaFin == null) {
    filter += ` AND s."FechaHoraVisita"::date <= (SELECT NOW()::date) AND s."FechaHoraFinVisita"::date >= (SELECT NOW()::date)`;
  }
  
  if (estatus != null) {
    filter += estatus;
  } 

  const query = `SELECT 
    count(*) AS "TotalRegistros"
  FROM "Solicitud" s
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  WHERE s."GCRecord" IS NULL AND s."Cancelado" IS NOT TRUE AND (s."RegistraEnVentanilla" = '${filtro.UsuarioLogin}' OR s."PersonaModifica" = '${filtro.UsuarioLogin}')
  ${filter}`;
  return query;
};

export const get_SolicitudAccesoOid = (oid: String) => {
  const query = `SELECT 
    s."Oid", 
    s."TipoVisita" AS "OidTipoVisita",
    ctv."Nombre" AS "TipoVisita",
    s."Estacionamiento" AS "OidTipoEstacionamiento",
    e."Nombre" AS "TipoEstacionamiento",
    e."ImagenBase64" AS "TipoEstacionamientoBase64",
    s."Placas" AS "Placa",
    s."Marca" AS "MarcaVehicular",
    s."Modelo" AS "ModeloVehicular",
    s."Color" AS "ColorVehicular",
    s."NoAcompaniantes" AS "NoAcompaniantes",
    i."CURP",
    s."Asunto",
    CASE 
      WHEN to_char(s."FechaHoraVisita",'yyyy-MM-dd') >= to_char((select now()),'yyyy-MM-dd') THEN true
      ELSE false
    END AS "Activa",
    to_char(s."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
    to_char(s."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
    to_char(s."FechaHoraAceptacion",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraAceptacion",
    to_char(s."FechaHoraSolicitud",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraSolicitud",
    u."Oid" AS "OidVisitaA",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
    s."PersonaVisitada",
    cps."Nombre" AS "CargoPersonaVisitada",
    cis."Nombre" AS "MedioIdentificacion",
    cis."Oid" AS "OidMedioIdentificacion",
    s."NumeroTarjeta",
    s."IngresaEquipo",
    l."Romano" AS "Legislacion",
    u."Correo" AS "CorreoVisitaA",
    u."EdificioUbicacion",
    u."ExtensionTelefonica",
    cd."Nombre" AS "Departamento",
    cp."Nombre" AS "Posicion",
    co."Nombre" AS "Oficina",
    ce."Nombre" AS "Edificio",
    sede."Nombre" AS "Sede",
    sede."Direccion" AS "SedeDireccion",
    d."Titulo" AS "Dependencia",
    i."Oid" AS "OidInvitado",
    CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
    i."Nombres",
    i."PrimerApellido",
    i."SegundoApellido",
    cs."Oid" AS "OidSexo",
    cs."Nombre" AS "Sexo",
    COALESCE(s."InstitucionOrigen", '') AS "Procedencia",
    i."Correo" AS "CorreoInvitado",
    i."Telefono",
    s."FotografiaB64",
    s."Notificado",
    s."PorcentajeListaNegra",
    s."EsPreregistro",
    s."PorCita",
    (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) AS "EntradaSalida",
    uap."Oid" AS "OidPersonaModifica",
    CONCAT( uap."Nombres",' ', uap."PrimerApellido",' ', uap."SegundoApellido") AS "PersonaModifica",
    ua."Oid" AS "OidRegistradoPor",
    CONCAT( ua."Nombres",' ', ua."PrimerApellido",' ', ua."SegundoApellido") AS "RegistraEnVentanilla",
    (SELECT COUNT(*) 
        FROM "Solicitud" sv 
        WHERE sv."Invitado" = i."Oid" 
        AND sv."FechaHoraVisita"::date = s."FechaHoraVisita"::date) AS "TotalVisitasHoy",
        (SELECT COUNT(*) 
            FROM "Solicitud" sv 
            WHERE sv."Invitado" = i."Oid" ) AS "TotalVisitas",
    s."SolicitudPrincipal"
  FROM "Solicitud" s
  LEFT JOIN "CatalogoEstacionamiento" e ON e."Oid" = s."Estacionamiento"
  LEFT JOIN "Catalogo_TipoVisita" ctv ON ctv."OID" = s."TipoVisita"
  LEFT JOIN "UsuarioAcceso" ua ON ua."Oid" = s."RegistraEnVentanilla"
  LEFT JOIN "UsuarioAcceso" uap ON uap."Oid" = s."PersonaModifica"
  LEFT JOIN "CatalogoPosicion" cps ON cps."Oid" = s."CargoPersonaVisitada" AND cps."Activo" is true AND cps."GCRecord" IS NULL
  LEFT JOIN "CatalogoIdentificacion" cis ON cis."Oid" = s."MedioIdentificacion" AND cis."Activo" is true AND cis."GCRecord" IS NULL
  LEFT JOIN "Legislacion" l ON l."Oid" = s."Legislacion" AND l."GCRecord" IS NULL
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  LEFT JOIN "CatalogoOficina" co ON co."Oid" = u."Oficina" AND co."Activo" is true AND co."GCRecord" IS NULL
  LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
  LEFT JOIN "Dependencia" d ON d."Oid" = u."Dependencia" AND d."GCRecord" IS NULL
  LEFT JOIN "SedeDependencia" sd ON sd."Oid" = u."Sede" AND sd."Visible" is true AND sd."GCRecord" IS NULL
  LEFT JOIN "Sede" sede ON sede."Oid" = sd."Sede" AND sede."Visible" is true AND sede."GCRecord" IS NULL
  INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS NULL
  WHERE s."GCRecord" IS NULL  
  AND s."Cancelado" IS NOT TRUE
  AND s."Oid" = '${oid}'`;
  return query;
};

export const get_SolicitudAccesoInvitadoXHoy = (invitado: String) => {
  const query = `SELECT 
  s."Oid",
  s."Asunto",
  CASE 
    WHEN to_char(s."FechaHoraVisita",'yyyy-MM-dd') >= to_char((select now()),'yyyy-MM-dd') THEN true
    ELSE false
  END AS "Activa",
  to_char(s."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
  to_char(s."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
  to_char(s."FechaHoraAceptacion",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraAceptacion",
  to_char(s."FechaHoraSolicitud",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraSolicitud",
  COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
  u."Correo" AS "CorreoVisitaA",
  u."EdificioUbicacion",
  u."ExtensionTelefonica",
  cd."Nombre" AS "Departamento",
  cp."Nombre" AS "Posicion",
  co."Nombre" AS "Oficina",
  ce."Nombre" AS "Edificio",
  i."Oid" AS "OidInvitado",
  CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
  i."Nombres",
  i."PrimerApellido",
  i."SegundoApellido",
  cs."Oid" AS "OidSexo",
  cs."Nombre" AS "Sexo",
  s."InstitucionOrigen" AS "Procedencia",
  i."Correo" AS "CorreoInvitado",
  i."Telefono",
  s."FotografiaB64",
  s."Notificado",
  concat(ua."Nombres",' ',ua."PrimerApellido",' ', ua."SegundoApellido") as "NombreCompletoRegistra",
  l."Romano" as "NumeroRomano",
  l."Numero" as "NumeroLegislatura",
  ci."Nombre" as "TipoIdentificacion",
  s."PersonaVisitada",
  s."IngresaEquipo",
  s."NumeroTarjeta",
( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes where hes."Solicitud" = s."Oid" and hes."Tipo" = 1  order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraEntrada",
( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes where hes."Solicitud" = s."Oid" and hes."Tipo" = 2  order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraSalida",
 (SELECT COUNT(*) FROM "Solicitud" s 
where s."Invitado" = i."Oid") AS "TotalNumVisitas",
cps."Nombre" as "CargoPersonaVisitada"
FROM "Solicitud" s
INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
LEFT JOIN "CatalogoOficina" co ON co."Oid" = u."Oficina" AND co."Activo" is true AND co."GCRecord" IS NULL
LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS null
LEFT JOIN "UsuarioAcceso" ua ON ua."Oid" = s."RegistraEnVentanilla" AND ua."Activo" is true AND ua."GCRecord" IS null
LEFT JOIN "Legislacion" l ON l."Oid" = s."Legislacion"  AND l."GCRecord" IS null
LEFT JOIN "CatalogoIdentificacion" ci ON ci."Oid" = s."MedioIdentificacion"  AND ci."GCRecord" IS null
LEFT JOIN "CatalogoPosicion" cps ON cps."Oid" = s."CargoPersonaVisitada" AND cp."Activo" is true AND cp."GCRecord" IS NULL
WHERE s."GCRecord" IS null
AND s."Cancelado" IS NOT TRUE
AND s."EsPrincipal" IS NOT TRUE
AND i."Oid" = '${invitado}'
AND s."FechaHoraVisita"::date = (SELECT NOW()::date)
order by s."FechaHoraVisita" desc;
  `;
  return query;
};

export const get_SolicitudAccesoOidValidarHoy = (oid: String) => {
  const query = `SELECT 
    s."Oid",
    s."Asunto",
    CASE 
      WHEN to_char(s."FechaHoraVisita",'yyyy-MM-dd') = to_char((select now()),'yyyy-MM-dd') THEN true
      ELSE false
    END AS "Activa",
    to_char(s."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
    to_char(s."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
    to_char(s."FechaHoraAceptacion",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraAceptacion",
    to_char(s."FechaHoraSolicitud",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraSolicitud",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
    u."Correo" AS "CorreoVisitaA",
    u."EdificioUbicacion",
    u."ExtensionTelefonica",
    cd."Nombre" AS "Departamento",
    --cp."Nombre" AS "Posicion",
    --co."Nombre" AS "Oficina",
    --ce."Nombre" AS "Edificio",
    i."Oid" AS "OidInvitado",
    CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
    --i."Nombres",
    --i."PrimerApellido",
    --i."SegundoApellido",
    --cs."Oid" AS "OidSexo",
    cs."Nombre" AS "Sexo",
    s."InstitucionOrigen" AS "Procedencia",
    --i."Correo" AS "CorreoInvitado",
    --i."Telefono",
    s."FotografiaB64",
    s."Notificado",
    CONCAT( ua."Nombres",' ', ua."PrimerApellido",' ', ua."SegundoApellido") AS "RegistraEnVentanilla"
  FROM "Solicitud" s
  LEFT JOIN "UsuarioAcceso" ua ON ua."Oid" = s."RegistraEnVentanilla"
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  LEFT JOIN "CatalogoOficina" co ON co."Oid" = u."Oficina" AND co."Activo" is true AND co."GCRecord" IS NULL
  LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
  INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS NULL
  WHERE s."GCRecord" IS NULL 
  AND s."Cancelado" IS NOT TRUE
  AND s."Oid" = '${oid}'`;
  return query;
};

export const get_HistorialEntradaSalidaSolicitudAcceso = (
  oid: String,
  tipo: Number
) => {
  const query = `SELECT 
    hes."Oid",
    hes."Tipo" AS "IdTipo",
    CASE 
      WHEN hes."Tipo" = 1 THEN 'Entrada' 
      WHEN hes."Tipo" = 2 THEN'Salida'
      ELSE '-'
    END AS "Tipo",
    to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') AS "FechaHora",
    cli."OID" AS "OidLugarIngreso",
    cli."Nombre" AS "LugarIngreso"
  FROM "HistorialEntradaSalida" hes
  INNER JOIN "Solicitud" s ON s."Oid" = hes."Solicitud"
  INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  LEFT JOIN "CatalogoLugarIngreso" cli ON cli."OID" = hes."LugarIngreso"
  WHERE hes."GCRecord" IS NULL 
  AND s."Oid" = '${oid}'
  AND hes."Tipo" = '${tipo}'
  ORDER BY hes."FechaHora" DESC`;
  return query;
};

export const get_SolicitudVisitaXOid = (
  oid: String
) => {
  const query = `select 
  s."Oid",
  s."Invitado",
  s."TipoVisita",
  ctv."Nombre" as "TipoVisitaNombre",
  --it."Folio",
  i."Nombres",
  i."PrimerApellido",
  i."SegundoApellido",
   CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
  COALESCE(i."CURP", '') AS "CURP",
  i."FotografiaB64" as "UrlFoto",
  cs."Oid" AS "OidSexo",
  cs."Nombre" AS "Sexo",
  s."InstitucionOrigen" AS "Procedencia",
  i."Correo",
  i."Telefono",
  --s."InvitadoTramite",
  s."Sede" as "OidSede",
  se."Nombre" as "Sede",
  se."Clave" as "SedeClave",
  se."Direccion",
  s."Dependencia" as "OidDependencia",
  d."Titulo" as "Dependencia",
  ce."Nombre" AS "Edificio",
  --s."Ventanilla" as "OidVentanilla",
  --sv."Nombre" as "Ventanilla",
  --COALESCE(sv."Ubicacion", '') AS "VentanillaUbicacion",
  --s."Tramite" as "OidTramite",
  --t."Titulo" as "Tramite",
  --s."HorarioCita" as "OidHorarioCita",
  --hc."IniciaCita" as "HorarioCita",
  to_char(s."FechaHoraVisita",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraVisita",
  to_char(s."FechaHoraFinVisita",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraFinVisita",  
  to_char(s."FechaHoraVisita",'dd/MM/yyyy') AS "fechaFormateada",
  to_char(s."FechaHoraVisita",'HH24:mi') AS "horaFormateada",
  s."Placas",
  s."Marca" AS "MarcaVehicular",
  s."Modelo" AS "ModeloVehicular",
  s."Color" AS "ColorVehicular",
  s."NoAcompaniantes",
  s."Estacionamiento" AS "OidTipoEstacionamiento",
  e."Nombre" AS "TipoEstacionamiento",
  e."ImagenBase64" AS "TipoEstacionamientoBase64",
  CASE 
       WHEN s."Estatus" = 0 THEN 'Pendiente'
       WHEN s."Estatus" = 1 THEN 'Aceptado'
       WHEN s."Estatus" = 2 THEN 'Rechazado'
       WHEN s."Estatus" = 3 THEN 'Cancelado'
       ELSE '--'
     END AS "Estatus",
  to_char(s."FechaHoraSolicitud",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraSolicitud",
  s."EsPrincipal",
  s."SolicitudPrincipal",
  (SELECT 
    string_agg(
      to_char(solic."FechaHoraVisita", 'dd/MM/yyyy') || ' ' || 
      to_char(solic."FechaHoraVisita", 'HH24:mi') || ' Hrs.',';') AS "fechasVigentes"
    FROM "Solicitud" solic
    WHERE solic."GCRecord" IS NULL AND solic."Cancelado" IS NOT TRUE
    AND solic."SolicitudPrincipal" = s."Oid") AS "fechasVigentes"
  from "Solicitud" s
  inner join "Invitado" i on i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  --inner join "InvitadoTramite" it on it."Oid" = s."InvitadoTramite" AND it."GCRecord" IS NULL
  LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS null
  LEFT JOIN "CatalogoEstacionamiento" e ON e."Oid" = s."Estacionamiento"
  LEFT JOIN "Catalogo_TipoVisita" ctv ON ctv."OID" = s."TipoVisita"
  LEFT JOIN "Dependencia" d ON d."Oid" = s."Dependencia"  AND d."GCRecord" IS NULL
  LEFT JOIN "SedeDependencia" sd ON sd."Oid" = s."Sede"  AND sd."GCRecord" IS NULL
  LEFT JOIN "Sede" se ON se."Oid" = sd."Sede"  AND se."GCRecord" IS NULL
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
  --INNER JOIN "SedeVentanilla" sv ON sv."Oid" = s."Ventanilla"  AND sv."GCRecord" IS NULL
  --INNER JOIN "TramiteVentanilla" tv ON tv."Oid" = s."Tramite"  AND tv."GCRecord" IS NULL
  --INNER JOIN "SedeTramite" st ON st."Oid" = tv."Tramite"  AND st."GCRecord" IS NULL
  --INNER JOIN "Tramite" t ON t."Oid" = st."Tramite"  AND t."GCRecord" IS NULL
  --INNER JOIN "HorarioCita" hc ON hc."Oid" = s."HorarioCita"  AND hc."GCRecord" IS NULL
  where s."GCRecord" is null AND s."Cancelado" IS NOT TRUE --and s."Estatus" = 1
  AND s."Oid"  = '${oid}'
  limit 1;`;
  return query;
};



/*===============Solicitudes por Grupo================*/

export const get_SolicitudesAccesoGrupo = (filtro: any, condicionRol3: string) => {
  let buscar =
    filtro.NombreGrupo != "" && filtro.NombreGrupo != null ? filtro.NombreGrupo : null;
  let visitaA =
    filtro.VisitaA != "" && filtro.VisitaA != null ? filtro.VisitaA.normalize('NFD').replace(/[\u0300-\u0301]/g, '') : null;
  let fechaInicio =
    filtro.FechaInicio != "" && filtro.FechaInicio != null
      ? filtro.FechaInicio
      : null;
  let fechaFin =
    filtro.FechaFin != "" && filtro.FechaFin != null ? filtro.FechaFin : null;
  let orden =
    filtro.Ordenar == 0
      ? `5`
      : filtro.Ordenar == 1
      ? 'gv."FechaHoraVisita"'
      : filtro.Ordenar == 3
      ? 'gv."FechaHoraSolicitud"'
      : 'gv."FechaHoraVisita"';
  let tipoorden =
    filtro.TipoOrden != "" && filtro.TipoOrden != null
      ? " " + filtro.TipoOrden
      : " DESC";

  let inicio = filtro.Offset;
  let limit = filtro.Limit;

  let filter = ``;
  let filterOrden = ``;

  if (buscar != null) {
    filter += ` AND g."Nombre" ILIKE '%${buscar}%'`;
  }
  if (visitaA != null) {
    filter += ` AND (COALESCE(u."Titulo"||' ', '')||u."NombreCompletoLimpio") ILIKE '%${visitaA}%'`;
  }
  if (fechaInicio != null) {
    filter += ` AND gv."FechaHoraVisita"::date <= '${fechaFin}'`;
  }
  if (fechaFin != null) {
    filter += ` AND gv."FechaHoraFinVisita"::date >= '${fechaInicio}'`;
  }

  if (orden != null) {
    filterOrden = orden;
  }

  if (fechaInicio == null && fechaFin == null) {
    filter += ` AND gv."FechaHoraVisita"::date <= (SELECT NOW()::date) AND gv."FechaHoraFinVisita"::date >= (SELECT NOW()::date)`;
  }

  if (filtro.MisRegistros && condicionRol3=='') {
    filter += ` AND (gv."UsuarioRegistra" = '${filtro.UsuarioLogin}')`;
  }

  const query = `SELECT 
    gv."Oid",
    g."Oid" AS "OidGrupo",
    g."Nombre" AS "NombreGrupo",
    to_char(gv."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
    to_char(gv."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
    gv."UsuarioRegistra",
    gv."EsPreregistro",
    gv."Estacionamiento" AS "OidTipoEstacionamiento",
    e."Nombre" AS "TipoEstacionamiento",
    COUNT(s."Oid") AS "TotalSolicitudes"
  FROM "GrupoVisita" gv
  LEFT JOIN "CatalogoEstacionamiento" e ON e."Oid" = gv."Estacionamiento"
  INNER JOIN "Grupo" g ON g."Oid" = gv."Grupo" AND gv."GCRecord" IS NULL
  INNER JOIN "Usuario" u ON u."Oid" = gv."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  LEFT JOIN "Solicitud" s ON s."Grupo" = gv."Oid"
  WHERE gv."GCRecord" IS NULL 
  AND gv."Cancelado" IS NOT TRUE ${condicionRol3} 
  ${filter}
  GROUP BY gv."Oid",g."Oid",u."Oid",e."Oid"
  ORDER BY ${filterOrden} ${tipoorden}
  OFFSET ${inicio} LIMIT ${limit}`;
  
  return query;
};
export const get_SolicitudAccesoGrupoOid = (Oid:string) => {

  const query = `SELECT 
    gv."Oid",
    gv."Comentarios",
    g."Oid" AS "OidGrupo",
    g."Nombre" AS "NombreGrupo",
    to_char(gv."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
    to_char(gv."FechaCreacion",'yyyy-MM-dd HH24:mi:ss') AS "FechaCreacion",
    to_char(gv."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
    gv."UsuarioRegistra",
    gv."EsPreregistro",
    gv."Notificado",
    u."Correo" AS "CorreoVisitaA",
    u."EdificioUbicacion",
    u."ExtensionTelefonica",
    cd."Nombre" AS "Departamento",
    cp."Nombre" AS "Posicion",
    co."Nombre" AS "Oficina",
    ce."Nombre" AS "Edificio",
    sede."Oid" AS "OidSede",
    sede."Nombre" AS "Sede",
    sede."Clave" as "SedeClave",
    sede."Direccion" AS "SedeDireccion",
    d."Oid" AS "OidDependencia",
    d."Titulo" AS "Dependencia",
    gv."Estacionamiento" AS "OidTipoEstacionamiento",
    e."Nombre" AS "TipoEstacionamiento"
  FROM "GrupoVisita" gv
  LEFT JOIN "CatalogoEstacionamiento" e ON e."Oid" = gv."Estacionamiento"
  INNER JOIN "Grupo" g ON g."Oid" = gv."Grupo" AND gv."GCRecord" IS NULL
  INNER JOIN "Usuario" u ON u."Oid" = gv."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  LEFT JOIN "Catalogo_TipoVisita" ctv on ctv."OID" = gv."TipoVisita"
  LEFT JOIN "Dependencia" d ON d."Oid" = u."Dependencia"  AND d."GCRecord" IS NULL
  LEFT JOIN "SedeDependencia" sd ON sd."Oid" = u."Sede"  AND sd."GCRecord" IS NULL
  LEFT JOIN "Sede" sede ON sede."Oid" = sd."Sede"  AND sede."GCRecord" IS NULL
  LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  LEFT JOIN "CatalogoOficina" co ON co."Oid" = u."Oficina" AND co."Activo" is true AND co."GCRecord" IS NULL
  LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
  WHERE gv."GCRecord" IS NULL
  AND gv."Cancelado" IS NOT TRUE
  AND gv."Oid" = '${Oid}';`;
  return query;
};
export const get_SolicitudesAccesoInvitadosGrupo = (filtro:any)=>{
  let buscar =
    filtro.Nombre != "" && filtro.Nombre != null ? filtro.Nombre : null;
  let orden =
    filtro.Ordenar == 0
      ? `7`
      : filtro.Ordenar == 1
      ? 's."FechaHoraVisita"'
      : filtro.Ordenar == 3
      ? 's."FechaHoraSolicitud"'
      : 's."FechaHoraVisita"';
  let tipoorden =
    filtro.TipoOrden != "" && filtro.TipoOrden != null
      ? " " + filtro.TipoOrden
      : " DESC";

  let estatus =
   filtro.Estatus == 1 // Agendada
      ? ` AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) IS NULL AND s."EsPreregistro" IS TRUE`
      : filtro.Estatus == 2 // Ingreso
      ? ' AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) = 1'
      : filtro.Estatus == 3 // Salida
      ? ' AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) = 2'
      : null;

  let inicio = filtro.Offset;
  let limit = filtro.Limit;

  let filter = ``;
  let filterOrden = ``;

  if (buscar != null) {
    filter += ` AND CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") ILIKE '%${buscar}%'`;
  }
  if (estatus != null) {
    filter += estatus;
  }

  if (orden != null) {
    filterOrden = orden;
  }

  const query = `SELECT 
    s."Oid",
    to_char(s."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
    to_char(s."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
    s."PersonaVisitada",
    i."Oid" AS "OidInvitado",
    CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado",
    i."Correo" AS "CorreoInvitado",
    i."Telefono",
    s."InstitucionOrigen" AS "Procedencia",
    s."FotografiaB64",
    s."NumeroTarjeta",
    s."RegistraEnVentanilla",
    s."EsPreregistro",
    s."PorcentajeListaNegra",
    s."Notificado",
    cps."Nombre" AS "CargoPersonaVisitada",
    cd."Nombre" AS "Departamento",
    cp."Nombre" AS "Posicion",
    s."Estacionamiento" AS "OidTipoEstacionamiento",
    e."Nombre" AS "TipoEstacionamiento",
    (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) AS "EntradaSalida",
    (SELECT to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" AND hes."Tipo" = 1 ORDER BY hes."FechaHora" DESC LIMIT 1) as "FechaUltimaHoraEntrada",
    (SELECT to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" AND hes."Tipo" = 2 ORDER BY hes."FechaHora" DESC LIMIT 1) as "FechaUltimaHoraSalida"
  FROM "Solicitud" s
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cps ON cps."Oid" = s."CargoPersonaVisitada" AND cps."Activo" is true AND cps."GCRecord" IS NULL
  LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  LEFT JOIN "CatalogoEstacionamiento" e ON e."Oid" = s."Estacionamiento"
  WHERE s."GCRecord" IS NULL 
  AND s."Cancelado" IS NOT TRUE
  AND s."Grupo" = '${filtro.OidGrupoVisita}'
  ${filter}
  ORDER BY ${filterOrden} ${tipoorden}
  OFFSET ${inicio} LIMIT ${limit}`;
  
  return query;
}
export const get_SolicitudesAccesoInvitadosGrupoAll = (OidGrupoVisita:string)=>{
  const query = `SELECT 
    s."Oid",
    to_char(s."FechaHoraVisita",'dd/MM/yyyy') AS "fechaFormateada",
    to_char(s."FechaHoraVisita",'HH24:mi') AS "horaFormateada",
    CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado",
    i."Correo" AS "CorreoInvitado",
    i."Telefono",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
    u."EdificioUbicacion",
    u."ExtensionTelefonica",
    cd."Nombre" AS "Departamento",
    cp."Nombre" AS "Posicion",
    co."Nombre" AS "Oficina",
    ce."Nombre" AS "Edificio",
    sede."Oid" AS "OidSede",
    sede."Nombre" AS "Sede",
    sede."Clave" as "SedeClave",
    sede."Direccion" AS "SedeDireccion",
    s."Estacionamiento" AS "OidTipoEstacionamiento",
    e."Nombre" AS "TipoEstacionamiento",
    e."ImagenBase64" AS "TipoEstacionamientoBase64"
  FROM "Solicitud" s
  LEFT JOIN "CatalogoEstacionamiento" e ON e."Oid" = s."Estacionamiento"
  INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  LEFT JOIN "Dependencia" d ON d."Oid" = u."Dependencia"  AND d."GCRecord" IS NULL
  LEFT JOIN "SedeDependencia" sd ON sd."Oid" = u."Sede"  AND sd."GCRecord" IS NULL
  LEFT JOIN "Sede" sede ON sede."Oid" = sd."Sede"  AND sede."GCRecord" IS NULL
  LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  LEFT JOIN "CatalogoOficina" co ON co."Oid" = u."Oficina" AND co."Activo" is true AND co."GCRecord" IS NULL
  LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
  WHERE s."GCRecord" IS NULL 
  AND s."Cancelado" IS NOT TRUE
  AND s."Grupo" = '${OidGrupoVisita}'`;
  return query;
}
export const get_SolicitudesAccesoInvitadosGrupoPaginado = (filtro:any)=>{
  let buscar =
    filtro.Nombre != "" && filtro.Nombre != null ? filtro.Nombre : null;

  let estatus =
   filtro.Estatus == 1 // Agendada
      ? ` AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) IS NULL AND s."EsPreregistro" IS TRUE`
      : filtro.Estatus == 2 // Ingreso
      ? ' AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) = 1'
      : filtro.Estatus == 3 // Salida
      ? ' AND  (SELECT hes."Tipo" FROM "HistorialEntradaSalida" hes WHERE hes."Solicitud" = s."Oid" ORDER BY hes."FechaHora" DESC LIMIT 1) = 2'
      : null;

  let limit = filtro.Limit;

  let filter = ``;

  if (buscar != null) {
    filter += ` AND CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") ILIKE '%${buscar}%'`;
  }
  if (estatus != null) {
    filter += estatus;
  }


  const query = `SELECT 
    count(*) AS "TotalRegistros",
    ceiling(count(*)/${limit}.00) AS "Paginas"
  FROM "Solicitud" s
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  WHERE s."GCRecord" IS NULL 
  AND s."Cancelado" IS NOT TRUE
  AND s."Grupo" = '${filtro.OidGrupoVisita}'
  ${filter}`;
  return query;
}
export const get_SolicitudesAccesoGrupoPaginado = (
  filtro: any,
  condicionRol3: string
) => {
  let buscar =
    filtro.NombreGrupo != "" && filtro.NombreGrupo != null ? filtro.NombreGrupo : null;
  let visitaA =
    filtro.VisitaA != "" && filtro.VisitaA != null ? filtro.VisitaA.normalize('NFD').replace(/[\u0300-\u0301]/g, '') : null;
  let fechaInicio =
    filtro.FechaInicio != "" && filtro.FechaInicio != null
      ? filtro.FechaInicio
      : null;
  let fechaFin =
    filtro.FechaFin != "" && filtro.FechaFin != null ? filtro.FechaFin : null;

  let limit = filtro.Limit;

  let filter = ``;

  if (buscar != null) {
    filter += ` AND g."Nombre" ILIKE '%${buscar}%'`;
  }
  if (visitaA != null) {
    filter += ` AND (COALESCE(u."Titulo"||' ', '')||u."NombreCompletoLimpio") ILIKE '%${visitaA}%'`;
  }
  if (fechaInicio != null) {
    filter += ` AND gv."FechaHoraVisita"::date <= '${fechaFin}'`;
  }
  if (fechaFin != null) {
    filter += ` AND gv."FechaHoraFinVisita"::date >= '${fechaInicio}'`;
  }

  if (fechaInicio == null && fechaFin == null) {
    filter += ` AND gv."FechaHoraVisita"::date <= (SELECT NOW()::date) AND gv."FechaHoraFinVisita"::date >= (SELECT NOW()::date)`;
  }

  if (filtro.MisRegistros && condicionRol3=='') {
    filter += ` AND (gv."UsuarioRegistra" = '${filtro.UsuarioLogin}')`;
  }


  const query = `SELECT 
    count(*) AS "TotalRegistros",
    ceiling(count(*)/${limit}.00) AS "Paginas"
  FROM "GrupoVisita" gv
  INNER JOIN "Grupo" g ON g."Oid" = gv."Grupo" AND gv."GCRecord" IS NULL
  INNER JOIN "Usuario" u ON u."Oid" = gv."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  WHERE gv."GCRecord" IS NULL 
  AND gv."Cancelado" IS NOT TRUE ${condicionRol3} 
  ${filter}`;
  return query;
};
export const get_SolicitudesAccesoGrupoTotalRegistrosUsuario = (filtro: any) => {
  let buscar =
    filtro.NombreGrupo != "" && filtro.NombreGrupo != null ? filtro.NombreGrupo : null;
  let visitaA =
    filtro.VisitaA != "" && filtro.VisitaA != null ? filtro.VisitaA.normalize('NFD').replace(/[\u0300-\u0301]/g, '') : null;
  let fechaInicio =
    filtro.FechaInicio != "" && filtro.FechaInicio != null
      ? filtro.FechaInicio
      : null;
  let fechaFin =
    filtro.FechaFin != "" && filtro.FechaFin != null ? filtro.FechaFin : null;

  let filter = ``;

  if (buscar != null) {
    filter += ` AND g."Nombre" ILIKE '%${buscar}%'`;
  }
  if (visitaA != null) {
    filter += ` AND (COALESCE(u."Titulo"||' ', '')||u."NombreCompletoLimpio") ILIKE '%${visitaA}%'`;
  }
  if (fechaInicio != null) {
    filter += ` AND gv."FechaHoraVisita"::date <= '${fechaFin}'`;
  }
  if (fechaFin != null) {
    filter += ` AND gv."FechaHoraFinVisita"::date >= '${fechaInicio}'`;
  }

  if (fechaInicio == null && fechaFin == null) {
    filter += ` AND gv."FechaHoraVisita"::date <= (SELECT NOW()::date) AND gv."FechaHoraFinVisita"::date >= (SELECT NOW()::date)`;
  }

  const query = `SELECT 
    count(*) AS "TotalRegistros"
  FROM "GrupoVisita" gv
  INNER JOIN "Grupo" g ON g."Oid" = gv."Grupo" AND gv."GCRecord" IS NULL
  INNER JOIN "Usuario" u ON u."Oid" = gv."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  WHERE gv."GCRecord" IS NULL AND gv."Cancelado" IS NOT TRUE AND (gv."UsuarioRegistra" = '${filtro.UsuarioLogin}')
  ${filter}`;
  return query;
};

export const get_Grupos = (condicionRol3:string) => {
  let util = new Utils();
  const query = `SELECT 
        distinct(g."Oid"),
        g."Nombre",
        g."Clave",
        g."Sede" as "OidSedeDependencia",
        se."Nombre" as "Sede",
        g."Dependencia" as "OidDependencia",
        d."Titulo" as "Dependencia",
        g."Responsable",
        g."Telefono",
        g."Activo",
        g."UsuarioRegistra" AS "OidUsuarioRegistra",
        COALESCE(u."Nombres"||' ', '')||coalesce(u."PrimerApellido",'') ||coalesce(u."SegundoApellido",'') AS "UsuarioRegistra",
        g."Activo"
      FROM "Grupo" g
      LEFT JOIN "Dependencia" d ON d."Oid" = g."Dependencia"  AND d."GCRecord" IS NULL
      LEFT JOIN "SedeDependencia" sd ON sd."Oid" = g."Sede"  AND sd."GCRecord" IS NULL
      LEFT JOIN "Sede" se ON se."Oid" = sd."Sede"  AND se."GCRecord" IS NULL
      LEFT JOIN "UsuarioAcceso" u ON u."Oid" = g."UsuarioRegistra"
      WHERE g."GCRecord" IS NULL
      ${condicionRol3};`;
  return query;
};
export const get_Grupo = (oid:String,condicionRol3:string) => {
  const query = `SELECT 
        distinct(g."Oid"),
        g."Nombre",
        g."Clave",
        g."Sede" as "OidSedeDependencia",
        se."Nombre" as "Sede",
        g."Dependencia" as "OidDependencia",
        d."Titulo" as "Dependencia",
        g."Responsable",
        g."Telefono",
        g."Activo",
        to_char(g."FechaCreacion",'yyyy-MM-dd HH24:mi:ss') AS "FechaCreacion",
        g."UsuarioRegistra" AS "OidUsuarioRegistra",
        COALESCE(u."Nombres"||' ', '')||coalesce(u."PrimerApellido",'') ||coalesce(u."SegundoApellido",'') AS "UsuarioRegistra",
        g."Activo"
      FROM "Grupo" g
      LEFT JOIN "Dependencia" d ON d."Oid" = g."Dependencia"  AND d."GCRecord" IS NULL
      LEFT JOIN "SedeDependencia" sd ON sd."Oid" = g."Sede"  AND sd."GCRecord" IS NULL
      LEFT JOIN "Sede" se ON se."Oid" = sd."Sede"  AND se."GCRecord" IS NULL
      LEFT JOIN "UsuarioAcceso" u ON u."Oid" = g."UsuarioRegistra"
      WHERE g."GCRecord" IS NULL
      AND g."Oid" = '${oid}'
      ${condicionRol3};`;
  return query;
};
export const get_VisitasXGrupo = (filtro:any)=>{
  let OidGrupo= filtro.OidGrupo;
  
  let inicio = filtro.Offset;
  let limit = filtro.Limit;

  let filter = ``;

  if (OidGrupo != '') {
    filter += ` AND g."Oid" = '${OidGrupo}'`;
  }

  const query = `SELECT 
    gv."Oid",
    g."Oid" AS "OidGrupo",
    g."Nombre" AS "NombreGrupo",
    to_char(gv."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
    to_char(gv."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
    gv."UsuarioRegistra",
    gv."EsPreregistro",
    gv."Comentarios",
    COUNT(s."Oid") AS "TotalSolicitudes"
  FROM "GrupoVisita" gv
  INNER JOIN "Grupo" g ON g."Oid" = gv."Grupo" AND gv."GCRecord" IS NULL
  INNER JOIN "Usuario" u ON u."Oid" = gv."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  LEFT JOIN "Solicitud" s ON s."Grupo" = gv."Oid" 
  WHERE gv."GCRecord" IS NULL 
  AND gv."Cancelado" IS NOT TRUE
  ${filter}
  GROUP BY gv."Oid",g."Oid",u."Oid" 
  ORDER BY gv."FechaHoraVisita" DESC
  OFFSET ${inicio} LIMIT ${limit}`;
  return query;
}
export const get_VisitasXGrupoPaginado = (filtro: any) => {
  
  let OidGrupo= filtro.OidGrupo;
  
  let limit = filtro.Limit;

  let filter = ``;

  if (OidGrupo != '') {
    filter += ` AND g."Oid" = '${OidGrupo}'`;
  }

  const query = `SELECT 
    count(*) AS "TotalRegistros",
    ceiling(count(*)/${limit}.00) AS "Paginas"
  FROM "GrupoVisita" gv
  INNER JOIN "Grupo" g ON g."Oid" = gv."Grupo" AND gv."GCRecord" IS NULL
  INNER JOIN "Usuario" u ON u."Oid" = gv."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  WHERE gv."GCRecord" IS NULL 
  AND gv."Cancelado" IS NOT TRUE
  ${filter}`;
  return query;
};

export const get_InvitadosXGrupoAll = (filtro: any) => {

  let OidGrupo = filtro.OidGrupo;

  // let buscar =
  //   filtro.NombreInvitado != "" && filtro.NombreInvitado != null ? filtro.NombreInvitado : null;

  let filter = ``;

  if (filtro.Activo != null && filtro.Activo != undefined) {
    filter += ` AND gi."Activo" IS ${filtro.Activo}`;
  }

  const query = `SELECT 
    gi."Oid",
    i."Oid" AS "OidInvitado",
    CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
    i."Nombres",
    i."PrimerApellido",
    i."SegundoApellido",
    i."CURP",
    cs."Oid" AS "OidSexo",
    cs."Nombre" AS "Sexo",
    i."Correo" AS "CorreoInvitado",
    i."Telefono",
    i."Estacionamiento" AS "OidTipoEstacionamiento",
    e."Nombre" AS "TipoEstacionamiento",
    i."Placa",
    gi."UsuarioRegistra" AS "OidUsuarioRegistra",
    COALESCE(u."Nombres"||' ', '')||coalesce(u."PrimerApellido",'') ||coalesce(u."SegundoApellido",'') AS "UsuarioRegistra",
    gi."Activo"
  FROM "GrupoInvitado" gi
  LEFT JOIN "UsuarioAcceso" u ON u."Oid" = gi."UsuarioRegistra"
  INNER JOIN "Invitado" i ON i."Oid" = gi."Invitado" AND i."GCRecord" IS NULL
  LEFT JOIN "CatalogoEstacionamiento" e ON e."Oid" = i."Estacionamiento"
  LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS NULL
  WHERE gi."GCRecord" IS NULL  
  ${filter}
  AND gi."Grupo" = '${OidGrupo}'
  ORDER BY gi."Activo" DESC,3;`;
  return query;
};
export const get_InvitadosXGrupo = (filtro: any) => {

  let OidGrupo = filtro.OidGrupo;

  let buscar =
    filtro.NombreInvitado != "" && filtro.NombreInvitado != null ? filtro.NombreInvitado : null;
  let filter = ``;

  if (buscar != null) {
    filter += ` AND CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") ILIKE '%${buscar}%'`;
  }

  if (filtro.Activo != null && filtro.Activo != undefined) {
    filter += ` AND gi."Activo" IS ${filtro.Activo}`;
  }

  let inicio = filtro.Offset;
  let limit = filtro.Limit;

  const query = `SELECT 
    gi."Oid",
    i."Oid" AS "OidInvitado",
    CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
    i."Nombres",
    i."PrimerApellido",
    i."SegundoApellido",
    i."CURP",
    cs."Oid" AS "OidSexo",
    cs."Nombre" AS "Sexo",
    i."Correo" AS "CorreoInvitado",
    i."Telefono",
    i."Placa",
    i."Estacionamiento" AS "OidTipoEstacionamiento",
    e."Nombre" AS "TipoEstacionamiento",
    gi."UsuarioRegistra" AS "OidUsuarioRegistra",
    COALESCE(u."Nombres"||' ', '')||coalesce(u."PrimerApellido",'') ||coalesce(u."SegundoApellido",'') AS "UsuarioRegistra",
    gi."Activo"
  FROM "GrupoInvitado" gi
  LEFT JOIN "UsuarioAcceso" u ON u."Oid" = gi."UsuarioRegistra"
  INNER JOIN "Invitado" i ON i."Oid" = gi."Invitado" AND i."GCRecord" IS NULL
  LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS NULL
  LEFT JOIN "CatalogoEstacionamiento" e ON e."Oid" = i."Estacionamiento"
  WHERE gi."GCRecord" IS NULL  
  AND gi."Grupo" = '${OidGrupo}'
  ${filter}
  ORDER BY gi."Activo" DESC,3
  OFFSET ${inicio} LIMIT ${limit};`;
  return query;
};

export const get_InvitadosXGrupoPaginado = (filtro: any) => {
  
  let OidGrupo = filtro.OidGrupo;

  let buscar =
    filtro.NombreInvitado != "" && filtro.NombreInvitado != null ? filtro.NombreInvitado : null;

  let filter = ``;

  if (buscar != null) {
    filter += ` AND CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") ILIKE '%${buscar}%'`;
  }

  let limit = filtro.Limit;

  const query = `SELECT 
    count(*) AS "TotalRegistros",
    ceiling(count(*)/${limit}.00) AS "Paginas"
  FROM "GrupoInvitado" gi
  LEFT JOIN "UsuarioAcceso" u ON u."Oid" = gi."UsuarioRegistra"
  INNER JOIN "Invitado" i ON i."Oid" = gi."Invitado" AND i."GCRecord" IS NULL
  LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS NULL
  WHERE gi."GCRecord" IS NULL  
  AND gi."Grupo" = '${OidGrupo}'
  ${filter};`;
  return query;
};

export const get_BuscarGrupo = (filtro: any,condicionRol3:string) => {
  
  let buscar =
    filtro.palabraBuscar != "" && filtro.palabraBuscar != null ? filtro.palabraBuscar : null;
  let filter = ``;
  if (buscar != null) {
    filter += ` AND g."Nombre" ILIKE '%${buscar}%'`;
  }
  let inicio = filtro.Offset;
  let limit = filtro.Limit;

  const query = `SELECT 
        distinct(g."Oid"),
        g."Nombre",
        g."Clave",
        g."Sede" as "OidSedeDependencia",
        se."Nombre" as "Sede",
        g."Dependencia" as "OidDependencia",
        d."Titulo" as "Dependencia",
        g."Responsable",
        g."Telefono",
        g."Activo",
        g."UsuarioRegistra" AS "OidUsuarioRegistra",
        COALESCE(u."Nombres"||' ', '')||coalesce(u."PrimerApellido",'') ||coalesce(u."SegundoApellido",'') AS "UsuarioRegistra",
        g."Activo",
        (SELECT COUNT(*) FROM "GrupoInvitado" gi WHERE gi."Grupo" = g."Oid") AS "NumIntegrantes",        
        (SELECT COUNT(*) FROM "GrupoInvitado" gi WHERE gi."Grupo" = g."Oid" and  gi."Activo" is TRUE) AS "NumIntegrantesActivos"
      FROM "Grupo" g
      LEFT JOIN "Dependencia" d ON d."Oid" = g."Dependencia"  AND d."GCRecord" IS NULL
      LEFT JOIN "SedeDependencia" sd ON sd."Oid" = g."Sede"  AND sd."GCRecord" IS NULL
      LEFT JOIN "Sede" se ON se."Oid" = sd."Sede"  AND se."GCRecord" IS NULL
      LEFT JOIN "UsuarioAcceso" u ON u."Oid" = g."UsuarioRegistra"
      WHERE g."GCRecord" IS NULL
      AND g."Activo" IS TRUE
      ${filter}
      ${condicionRol3}
      OFFSET ${inicio} LIMIT ${limit};`;
  return query;
};

export const get_BuscarGrupoPaginado = (filtro: any,condicionRol3:string) => {
 
  let buscar =
    filtro.palabraBuscar != "" && filtro.palabraBuscar != null ? filtro.palabraBuscar : null;
  let filter = ``;
  if (buscar != null) {
    filter += ` AND g."Nombre" ILIKE '%${buscar}%'`;
  }
  let limit = filtro.Limit;

  const query = `SELECT 
        count(*) AS "TotalRegistros",
        ceiling(count(*)/${limit}.00) AS "Paginas"
      FROM "Grupo" g
      LEFT JOIN "Dependencia" d ON d."Oid" = g."Dependencia"  AND d."GCRecord" IS NULL
      LEFT JOIN "SedeDependencia" sd ON sd."Oid" = g."Sede"  AND sd."GCRecord" IS NULL
      LEFT JOIN "Sede" se ON se."Oid" = sd."Sede"  AND se."GCRecord" IS NULL
      LEFT JOIN "UsuarioAcceso" u ON u."Oid" = g."UsuarioRegistra"
      WHERE g."GCRecord" IS NULL
      AND g."Activo" IS TRUE
      ${filter}
      ${condicionRol3};`;
  return query;
};


/*===================================================MUTATION==========================================*/

const NUEVO_OID =
  "(SELECT(uuid_in(overlay(overlay(md5(random()::text || ':' || clock_timestamp()::text) placing '4' from 13) placing to_hex(floor(random()*(11-8+1) + 8)::int)::text from 17)::cstring)))";
var noSqlInyection = new NoSqlInyection();

export const set_CambiarContraseniaUsuaroAcceso = (
  oid: String,
  pass: String
) => {
  const query = `UPDATE "UsuarioAcceso" 
  SET "Contrasenia" = '${pass}',
  "CambiarContrasenia" = false
  WHERE "Oid" = '${oid}'
  RETURNING 
    "Oid", 
    CONCAT("Nombres",' ',"PrimerApellido",' ',"SegundoApellido") AS "NombreUsuarioAcceso",
    "Nombres", 
    "PrimerApellido",  
    "SegundoApellido",
    "Correo",
    "CambiarContrasenia";`;
  return query;
};

export const set_nuevoInvitado = (inv: any) => {
  const query = `INSERT INTO "Invitado" ("Oid","Nombres","PrimerApellido","SegundoApellido","CURP","Sexo","Procedencia","Correo","Telefono",
  "FotografiaB64", "UsuarioRegistra","EsPreregistro","Placa","FechaCreacion",
  "FechaBloqueo","Bloqueado","MotivoBloqueo","Oficio","OptimisticLockField","GCRecord"
  ) VALUES (${NUEVO_OID},
    '${noSqlInyection.remplazar(inv.Nombres.toUpperCase())}',
    '${noSqlInyection.remplazar(inv.PrimerApellido.toUpperCase())}',
    '${noSqlInyection.remplazar(inv.SegundoApellido.toUpperCase())}',
    '${inv.CURP}',
    ${inv.OidSexo == "" ? "null" : `'${inv.OidSexo}'`},
    '${noSqlInyection.remplazar(inv.Procedencia)}',
    '${inv.Correo}',
    '${inv.Telefono}',
    '${inv.FotografiaB64}',
    '${inv.UsuarioRegistra}',
    ${inv.PreRegistro}, 
    ${inv.Placa == undefined || inv.Placa == null ? "''" : `'${inv.Placa}'`},
    (SELECT NOW()),
  NULL,FALSE,NULL,NULL,1,NULL
  )
  RETURNING 
    "Oid", 
    CONCAT("Nombres",' ',"PrimerApellido",' ',"SegundoApellido") AS "NombreUsuarioAcceso",
    "Nombres", 
    "PrimerApellido",  
    "SegundoApellido";`;
  return query;
};

export const set_actualizarInvitado = (inv: any) => {
  const query = `UPDATE "Invitado"
    SET 
    "Nombres" = '${noSqlInyection.remplazar(inv.Nombres.toUpperCase())}',
    "PrimerApellido" = '${noSqlInyection.remplazar(inv.PrimerApellido.toUpperCase())}',
    "SegundoApellido" = '${noSqlInyection.remplazar(inv.SegundoApellido.toUpperCase())}',
    "CURP" = '${inv.CURP}',
    "Sexo" = ${inv.OidSexo == "" ? "null" : `'${inv.OidSexo}'`},
    "Correo" = '${inv.Correo}',
    "Telefono" = '${inv.Telefono}'
  WHERE "Oid" = '${inv.Oid}'
  RETURNING 
    "Oid";`;
  return query;
};

export const set_actualizarInvitado_Grupo = (inv: any) => {
  const query = `UPDATE "Invitado"
    SET 
    "Nombres" = '${inv.Nombres}',
    "PrimerApellido" = '${inv.PrimerApellido}',
    "SegundoApellido" = '${inv.SegundoApellido}',
    "CURP" = '${inv.CURP}',
    "Correo" = '${inv.Correo}',
    "Telefono" = '${inv.Telefono}',
    "Placa" = ${inv.Placa == undefined || inv.Placa == null ? "''" : `'${inv.Placa}'`},
    "Estacionamiento" = ${inv.Estacionamiento == undefined || inv.Estacionamiento == null ? "NULL" : `'${inv.Estacionamiento}'`}
  WHERE "Oid" = '${inv.OidInvitado}'
  RETURNING 
    "Oid";`;
  return query;
};

export const set_actualizarInvitado_GrupoVisita = (inv: any) => {
  const query = `UPDATE "Invitado"
    SET 
      "Estacionamiento" = ${inv.Estacionamiento == undefined || inv.Estacionamiento == null ? "NULL" : `'${inv.Estacionamiento}'`}
  WHERE "Oid" = '${inv.OidInvitado}'
  RETURNING 
    "Oid";`;
  return query;
};

export const set_nuevoCargo = (cargo: any) => {
  const query = `INSERT INTO "CatalogoPosicion"  ("Oid", "Nombre", "Orden", "Activo","OptimisticLockField","GCRecord") VALUES 
  (${NUEVO_OID},
    '${cargo}',
    (SELECT MAX(cp."Orden") FROM "CatalogoPosicion" cp WHERE cp."GCRecord" IS NULL),
    TRUE,1,NULL)
  RETURNING "Oid";`;
  return query;
};

export const set_nuevaSolicitudAcceso = (solicitud: any) => {
  const query = `INSERT INTO "Solicitud"  ("Oid", "VisitaA", "Invitado","Asunto", "InstitucionOrigen",
  "Dependencia", "Sede", "Placas", "Marca", "Modelo", "Color","NoAcompaniantes",
 "Estatus","FotografiaB64","RegistraEnVentanilla", "FechaHoraVisita","FechaHoraFinVisita","Notificado",
 "PersonaVisitada","CargoPersonaVisitada","MedioIdentificacion","TipoVisita","Estacionamiento","IngresaEquipo","EsPreregistro","PorcentajeListaNegra",
 "EsPrincipal","SolicitudPrincipal",
  "FechaHoraAceptacion","FechaHoraSolicitud","OptimisticLockField","GCRecord") VALUES 
  (${NUEVO_OID},
    '${solicitud.VisitaA}',
    '${solicitud.Invitado}',
    '${noSqlInyection.remplazar(solicitud.Asunto)}',
    '${noSqlInyection.remplazar(solicitud.Institucion)}',
    (SELECT u."Dependencia" FROM "Usuario" u WHERE u."Oid" =  '${solicitud.VisitaA}'),
    (SELECT u."Sede" FROM "Usuario" u WHERE u."Oid" =  '${solicitud.VisitaA}'),
    '${solicitud.Placa}',
    '${solicitud.Marca}',
    '${solicitud.Modelo}',
    '${solicitud.Color}',
    ${solicitud.NoAcompaniantes},
    1,
    '${solicitud.FotografiaB64}', 
    '${solicitud.RegistraEnVentanilla}',
    '${solicitud.FechaHoraVisita}',
    '${solicitud.FechaHoraFinVisita}',
    false,
    '${solicitud.PersonaVisitada}', 
    ${
      solicitud.CargoPersonaVisitada == ""
        ? "null"
        : `'${solicitud.CargoPersonaVisitada}'`
    },
    ${
      solicitud.MedioIdentificacion == ""
        ? "null"
        : `'${solicitud.MedioIdentificacion}'`
    },
    ${
      solicitud.TipoVisita == ""
        ? "null"
        : `'${solicitud.TipoVisita}'`
    },
    ${
      solicitud.TipoEstacionamiento == ""
        ? "null"
        : `'${solicitud.TipoEstacionamiento}'`
    },
    ${solicitud.IngresaEquipo},
    ${solicitud.PreRegistro}, 
    ${solicitud.PorcentajeListaNegra},    
    ${solicitud.EsPrincipal}, 
    ${
      solicitud.SolicitudPrincipal == null
        ? "null"
        : `'${solicitud.SolicitudPrincipal}'`
    },
    (SELECT now()),(SELECT now()),1,NULL)
  RETURNING "Oid";`;
  return query;
};

export const set_actualizarSolicitudVisita = (solicitud: any) => {
  const query = `UPDATE "Solicitud"
    SET 
    "VisitaA" = '${solicitud.VisitaA}',
    "Dependencia" = (SELECT u."Dependencia" FROM "Usuario" u WHERE u."Oid" =  '${solicitud.VisitaA}'),
    "FechaHoraVisita" = '${solicitud.FechaHoraVisita}',
    "FechaHoraFinVisita" = '${solicitud.FechaHoraFinVisita}',
    "PersonaVisitada" = '${solicitud.PersonaVisitada}',
    "CargoPersonaVisitada" = ${
      solicitud.CargoPersonaVisitada == ""
        ? "null"
        : `'${solicitud.CargoPersonaVisitada}'`
    },
    "Estacionamiento" = ${
      solicitud.TipoEstacionamiento == undefined || solicitud.TipoEstacionamiento == null || solicitud.TipoEstacionamiento == ""
        ? `"Estacionamiento"`
        : `'${solicitud.TipoEstacionamiento}'`
    },
    "Notificado" = false
  WHERE "Oid" = '${solicitud.Oid}'
  RETURNING 
    "Oid";`;
  return query;
};

export const set_actualizarSolicitud = (solicitud: any) => {
  const query = `UPDATE "Solicitud"
    SET 
    "Asunto" = '${noSqlInyection.remplazar(solicitud.Asunto)}',
    "InstitucionOrigen" = '${noSqlInyection.remplazar(solicitud.Institucion)}',
    "NumeroTarjeta" = '${noSqlInyection.remplazar(solicitud.NumeroTarjeta)}',
    "Placas" = '${solicitud.Placa}',
    "Marca" = '${solicitud.Marca}',
    "Modelo" = '${solicitud.Modelo}',
    "Color" = '${solicitud.Color}',
    "NoAcompaniantes" = ${solicitud.NoAcompaniantes},
    "FotografiaB64" = '${solicitud.FotografiaB64}',
    "MedioIdentificacion" = ${
      solicitud.MedioIdentificacion == ""
        ? "null"
        : `'${solicitud.MedioIdentificacion}'`
    },
    "Estacionamiento" = ${
      solicitud.TipoEstacionamiento == undefined || solicitud.TipoEstacionamiento == null || solicitud.TipoEstacionamiento == ""
        ? "null"
        : `'${solicitud.TipoEstacionamiento}'`
    },
    "IngresaEquipo" = ${solicitud.IngresaEquipo},
    "PorcentajeListaNegra" = ${solicitud.PorcentajeListaNegra},
    "PersonaModifica" = '${solicitud.RegistraEnVentanilla}',
    "FechaModifica" =  (SELECT NOW())
  WHERE "Oid" = '${solicitud.Oid}'
  RETURNING 
    "Oid";`;
  return query;
};

export const set_cancelarSolicitud = (solicitud: any) => {
  const query = `UPDATE "Solicitud"
  SET 
    "Cancelado" = true,
    "PersonaCancela" = '${solicitud.RegistraEnVentanilla}',
    "FechaCancelado" = (SELECT NOW())
  WHERE "Oid" = '${solicitud.Oid}'
  RETURNING 
    "Oid";`;
  return query;
};

export const set_nuevaEntradaSalida = (EntSal: any) => {
  const query = `INSERT INTO "HistorialEntradaSalida"  ("Oid", "Solicitud", "UsuarioRegistra","Tipo","ManeraAcceso","LugarIngreso","FechaHora", "OptimisticLockField","GCRecord") VALUES 
      (${NUEVO_OID},
     '${EntSal.Solicitud}',
     ${EntSal.UsuarioRegistra == "" ? "null" : `'${EntSal.UsuarioRegistra}'`},
     ${EntSal.Tipo},
     ${EntSal.ManeraAcceso},
     ${EntSal.LugarIngreso == null ? "null" : EntSal.LugarIngreso},
     (SELECT NOW()),1,NULL)
   RETURNING "Oid";`;
  return query;
};

export const set_CambiarNotificado = (oid: any) => {
  const query = `UPDATE "Solicitud"
    SET "Notificado" = true
   WHERE "Oid"='${oid}'
   RETURNING 
    "Oid";`;
  return query;
};


export const set_CambiarNotificadoVigencia = (oid: any) => {
  const query = `UPDATE "Solicitud"
    SET "Notificado" = true
   WHERE "Oid"='${oid}' OR "SolicitudPrincipal"='${oid}';`;
  return query;
};

export const set_FotoObservaciones = (
  oid: string,
  FotografiaB64: string,
  Asunto: string
) => {
  const query = `UPDATE "Solicitud"
  SET "FotografiaB64" = '${FotografiaB64}',
    "Asunto" = '${Asunto}'
 WHERE "Oid"='${oid}'
 RETURNING 
    "Oid";`;
  return query;
};

export const set_FotoInvitado = (
  oid: string,
  FotografiaB64: string
) => {
  const query = `UPDATE "Invitado"
  SET "FotografiaB64" = '${FotografiaB64}'
 WHERE "Oid"='${oid}'
 RETURNING 
    "Oid";`;
  return query;
};

export const set_NombreLimpio = (oid: string, nombrelimpio: string) => {
  const query = `UPDATE "Usuario"
    SET "NombreCompletoLimpio" = '${nombrelimpio}'
   WHERE "Oid"='${oid}'
   RETURNING 
    "Oid";`;
  return query;
};

export const set_NombreLimpioListaNegra = (
  oid: string,
  nombrelimpio: string
) => {
  const query = `UPDATE "ListaNegra"
    SET "NombreLimpio" = '${nombrelimpio}'
   WHERE "Oid"='${oid}'
   RETURNING 
    "Oid";`;
  return query;
};
export const get_Oid = `
SELECT(uuid_in(overlay(overlay(md5(random()::text || ':' || clock_timestamp()::text) placing '4' from 13) placing to_hex(floor(random()*(11-8+1) + 8)::int)::text from 17)::cstring));`;


export const get_EntradasSalidasOidInvitado = (invitado: String) => {
  const query = ` 
  SELECT  
( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes 
  where hes."Solicitud" = s."Oid" and hes."Tipo" = 1  order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraEntrada",
( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes 
  where hes."Solicitud" = s."Oid" and hes."Tipo" = 2  order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraSalida"
FROM "Solicitud" s 
INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL 
WHERE s."GCRecord" IS null
AND i."Oid" = '${invitado}'
AND s."FechaHoraVisita"::date = (SELECT NOW()::date)
order by "FechaUltimaHoraEntrada" desc
limit 5
  `; 
  return query;
};

export const set_NuevoGrupo = (grupo: any,oidLogin:string) => {
  const query = ` 
  INSERT INTO "Grupo"("Oid", "Nombre", "Clave","Responsable","Telefono","Sede","Dependencia","Activo", "UsuarioRegistra","FechaCreacion","OptimisticLockField","GCRecord") 
     SELECT ${NUEVO_OID},
     '${grupo.Nombre}',
     '${grupo.Clave}',
     ${grupo.Responsable == null ? "null" : `'${grupo.Responsable}'`},
     ${grupo.Telefono == null ? "null" : `'${grupo.Telefono}'`},
     null,
     null,
     TRUE,
     '${oidLogin}',
     (SELECT NOW()),1,NULL
     --FROM "Usuario" u WHERE u."Oid" =  '${grupo.Dependencia}' LIMIT 1
   RETURNING *;`; 
  return query;
};

export const set_actualizarGrupo = (grupo: any) => {
  const query = ` 
  UPDATE "Grupo"
    SET
     "Nombre" = '${grupo.Nombre}',
     "Clave" = '${grupo.Clave}',
     "Responsable" = ${grupo.Responsable == null ? "null" : `'${grupo.Responsable}'`},
     "Telefono" = ${grupo.Telefono == null ? "null" : `'${grupo.Telefono}'`}
    WHERE "Oid" = '${grupo.Oid}'
  RETURNING "Oid";`; 
  return query;
};

export const set_nuevoGrupoInvitado = (OidGrupo:any,OidInvitado: any,oidLogin:string) => {
  let query = ` 
    INSERT INTO "GrupoInvitado" ("Oid", "Invitado", "Grupo","Activo", "UsuarioRegistra","FechaCreacion","OptimisticLockField","GCRecord") VALUES
     (${NUEVO_OID},'${OidInvitado}','${OidGrupo}',TRUE,'${oidLogin}',(SELECT NOW()),1,NULL) RETURNING "Oid";`;
  return query;
};

export const set_actualizarGrupoInvitado = (OidGrupoInvitado:any,Activo:boolean) => {
  let query = ` 
    UPDATE "GrupoInvitado"
    SET
      "Activo" = ${Activo}
    WHERE "Oid" = '${OidGrupoInvitado}';`;
  return query;
};

export const set_nuevaVisitaGrupo = (solicitud: any,OidUsuarioRegistra:string) => {
  let query = ` 
    INSERT INTO "GrupoVisita" ("Oid", "Grupo", "VisitaA","TipoVisita", "FechaHoraVisita","FechaHoraFinVisita","Comentarios","Notificado","Estacionamiento",
    "FechaCreacion","UsuarioRegistra","EsPreregistro","Cancelado","PersonaCancela","FechaCancelado","OptimisticLockField","GCRecord") VALUES
     (${NUEVO_OID},
     '${solicitud.OidGrupo}',
     '${solicitud.VisitaA}', 
     ${
      solicitud.TipoVisita == ""
        ? "null"
        : `'${solicitud.TipoVisita}'`
    },
    '${solicitud.FechaHoraVisita}',
    '${solicitud.FechaHoraFinVisita}',
    '${noSqlInyection.remplazar(solicitud.Comentario)}',
    FALSE,
    ${
      solicitud.TipoEstacionamiento == undefined || solicitud.TipoEstacionamiento == null || solicitud.TipoEstacionamiento == ""
        ? "null"
        : `'${solicitud.TipoEstacionamiento}'`
    },
    (SELECT NOW()),
     '${OidUsuarioRegistra}',
     ${solicitud.PreRegistro},
     FALSE,NULL,NULL,1,NULL) RETURNING "Oid";`;
  return query;
};

export const set_nuevaSolicitudAccesoVisitaGrupo = (solicitud: any) => {
  const query = `INSERT INTO "Solicitud"  ("Oid", "VisitaA", "Invitado","Asunto", "Grupo",
  "Dependencia", "Sede","Estatus","RegistraEnVentanilla", "FechaHoraVisita","FechaHoraFinVisita","Notificado","Placas",
 "TipoVisita","Estacionamiento","EsPreregistro","EsPrincipal","FechaHoraAceptacion","FechaHoraSolicitud","OptimisticLockField","GCRecord") VALUES 
  (${NUEVO_OID},
    '${solicitud.VisitaA}',
    '${solicitud.Invitado}',
    '${noSqlInyection.remplazar(solicitud.Asunto)}',
    '${solicitud.GrupoVisita}',
    (SELECT u."Dependencia" FROM "Usuario" u WHERE u."Oid" =  '${solicitud.VisitaA}'),
    (SELECT u."Sede" FROM "Usuario" u WHERE u."Oid" =  '${solicitud.VisitaA}'),
    1,
    '${solicitud.RegistraEnVentanilla}',
    '${solicitud.FechaHoraVisita}',
    '${solicitud.FechaHoraFinVisita}',
    false,
    '${solicitud.Placas}',
    ${
      solicitud.TipoVisita == undefined || solicitud.TipoVisita == null || solicitud.TipoVisita == ""
        ? "null"
        : `'${solicitud.TipoVisita}'`
    },
    ${
      solicitud.TipoEstacionamiento == undefined || solicitud.TipoEstacionamiento == null || solicitud.TipoEstacionamiento == ""
        ? "null"
        : `'${solicitud.TipoEstacionamiento}'`
    },
    ${solicitud.PreRegistro},  
    false,
    (SELECT now()),(SELECT now()),1,NULL)
  RETURNING "Oid";`;
  return query;
};

export const set_CambiarNotificadoGrupoVisita = (oid: string) => {
  const query = `UPDATE "GrupoVisita"
    SET "Notificado" = true
   WHERE "Oid"='${oid}'
   RETURNING 
    "Oid";`;
  return query;
};

export const set_cancelarSolicitudGrupoVisita = (oid: string,oidUsuarioLogin:string) => {
  const query = `UPDATE "GrupoVisita"
  SET 
    "Cancelado" = true,
    "PersonaCancela" = '${oidUsuarioLogin}',
    "FechaCancelado" = (SELECT NOW())
  WHERE "Oid" = '${oid}'
  RETURNING 
    "Oid";`;
  return query;
};
export const set_actualizarSolicitudGrupoVisita = (grupoVisita: any) => {
  const query = `UPDATE "GrupoVisita"
    SET 
    "VisitaA" = '${grupoVisita.VisitaA}',
    "FechaHoraVisita" = '${grupoVisita.FechaHoraVisita}',
    "FechaHoraFinVisita" = '${grupoVisita.FechaHoraFinVisita}',    
    "Estacionamiento" = ${
      grupoVisita.TipoEstacionamiento == undefined || grupoVisita.TipoEstacionamiento == null || grupoVisita.TipoEstacionamiento == ""
        ? "null"
        : `'${grupoVisita.TipoEstacionamiento}'`
    },
    "Notificado" = false
  WHERE "Oid" = '${grupoVisita.Oid}'
  RETURNING 
    "Oid";`;
  return query;
};